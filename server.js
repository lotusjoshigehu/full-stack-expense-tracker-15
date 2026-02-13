require("dotenv").config();

const path = require("path")
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const compression = require("compression");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");

const { askAI } = require("./services/aiservices");
const { createOrder } = require("./services/cashfreeservices");
const { sendResetMail } = require("./services/mailservices");
const { uploadToS3, getSignedUrl } = require("./services/s3service");

const sequelize = require("./connection/dbconnection");
const User = require("./models/users");
const Expense = require("./models/expense");
const Order = require("./models/orders");
const ForgotPasswordRequest = require("./models/forgetpassword");

const app = express();


app.use(cors());
app.use(express.json());
app.use(compression());
app.use(morgan("combined"));
app.use(express.static(path.join(__dirname)));


User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(ForgotPasswordRequest);
ForgotPasswordRequest.belongsTo(User);


sequelize.sync()
  .then(() => console.log("Database synced"))
  .catch(err => console.error("DB Sync Error:", err));

/* ================= HELPER (CSV) ================= */
function expensesToCSV(expenses) {
  const header = "Amount,Description,Category,CreatedAt";
  const rows = expenses.map(e =>
    `${e.amount},${e.description},${e.category},${e.createdAt}`
  );
  return [header, ...rows].join("\n");
}


app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json("User already exists");

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hash,
      isPremium: false,
      totalExpense: 0
    });

    res.json("Signup successful");
  } catch {
    res.status(500).json("Signup failed");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json("User not found");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json("Wrong password");

    res.json({ email: user.email, isPremium: user.isPremium });
  } catch {
    res.status(500).json("Login failed");
  }
});

app.get("/user/status/:email", async (req, res) => {
  const user = await User.findOne({ where: { email: req.params.email } });
  res.json({ isPremium: user ? user.isPremium : false });
});

app.post("/ai/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const answer = await askAI(question);

    res.status(200).json({ answer });
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ message: "AI failed" });
  }
});



app.post("/expense", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { email, amount, description, category } = req.body;

    const user = await User.findOne({ where: { email }, transaction: t });
    if (!user) throw new Error("User not found");

    await Expense.create(
      { amount, description, category, UserId: user.id },
      { transaction: t }
    );

    user.totalExpense += Number(amount);
    await user.save({ transaction: t });

    await t.commit();
    res.json("Expense added");
  } catch {
    await t.rollback();
    res.status(500).json("Failed to add expense");
  }
});

app.get("/expense/:email", async (req, res) => {
  const user = await User.findOne({
    where: { email: req.params.email },
    include: Expense
  });
  res.json(user ? user.Expenses : []);
});

app.delete("/expense/:id", async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const expense = await Expense.findByPk(req.params.id, {
      transaction: t
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    const user = await User.findByPk(expense.UserId, {
      transaction: t
    });

    user.totalExpense -= Number(expense.amount);
    await user.save({ transaction: t });

    await expense.destroy({ transaction: t });

    await t.commit();
    res.json("Deleted successfully");

  } catch (err) {
    await t.rollback();
    res.status(500).json("Delete failed");
  }
});


app.get("/premium/showleaderboard", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["name", "totalExpense"],
      order: [["totalExpense", "DESC"]]
    });

    res.status(200).json(users);
  } catch (err) {
    console.error("Leaderboard error:", err.message);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});


app.get("/expense/download/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isPremium) return res.status(401).json({ message: "Not premium user" });

    const expenses = await Expense.findAll({
      where: { UserId: user.id }
    });

    if (!expenses.length) {
      return res.status(400).json({ message: "No expenses found" });
    }

    
    const csvData = expensesToCSV(expenses);

    const fileName = `expenses/${email}-${Date.now()}.csv`;

  
    await uploadToS3(csvData, fileName);

  
    const signedUrl = getSignedUrl(fileName);

    res.status(200).json({ fileURL: signedUrl });

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Download failed" });
  }
});

app.post("/create-order", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orderData = await createOrder(user.id, email);

    await Order.create({
      orderId: orderData.order_id,
      paymentStatus: "PENDING",
      UserId: user.id
    });

    res.status(200).json(orderData);

  } catch (err) {
    console.error("Create order failed:", err.response?.data || err.message);
    res.status(500).json({ message: "Order creation failed" });
  }
});



app.post("/password/forgotpassword", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const request = await ForgotPasswordRequest.create({
      id: uuidv4(),
      UserId: user.id,
      isActive: true
    });

    const resetLink = `http://localhost:3000/password/resetpassword/${request.id}`;
    await sendResetMail(email, resetLink);

    res.json({ message: "Reset email sent" });
  } catch {
    res.status(500).json({ message: "Reset failed" });
  }
});

app.get("/payment-success", async (req, res) => {
  try {
    const { order_id } = req.query;

    const order = await Order.findOne({ where: { orderId: order_id } });
    if (!order) {
      return res.send("Invalid order");
    }

    const user = await User.findByPk(order.UserId);

    user.isPremium = true;
    await user.save();

    order.paymentStatus = "SUCCESS";
    await order.save();

    res.redirect("/expense.html");

  } catch (err) {
    console.error("Payment success error:", err.message);
    res.send("Payment verification failed");
  }
});




app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

;


app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on http://localhost:3000");
});

















