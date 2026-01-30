// ================= AUTH GUARD =================
if (!localStorage.getItem("loggedIn")) {
    window.location.href = "login.html";
}

const email = localStorage.getItem("userEmail");

// ================= DOM =================
const table = document.getElementById("expenseTable");
const premiumMsg = document.getElementById("premiumMessage");
const leaderboardBtn = document.getElementById("showLeaderboardBtn");
const leaderboardList = document.getElementById("leaderboard");
const premiumBtn = document.getElementById("premiumBtn");
const askAiBtn = document.getElementById("askAiBtn");
const aiAnswer = document.getElementById("aiAnswer");
const aiQuestion = document.getElementById("aiQuestion");

const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const rowsSelect = document.getElementById("rowsPerPageSelect");

const downloadBtn = document.getElementById("downloadBtn");
const downloadLink = document.getElementById("downloadLink");

// ✅ ADD MISSING FORM ELEMENTS
const expenseForm = document.getElementById("expenseForm");
const amount = document.getElementById("amount");
const description = document.getElementById("description");
const category = document.getElementById("category");

// ================= PAGINATION STATE =================
let expenses = [];
let currentPage = 1;
let rowsPerPage = Number(localStorage.getItem("rowsPerPage")) || 10;

if (rowsSelect) rowsSelect.value = rowsPerPage;

// ================= CHECK PREMIUM =================
fetch(`http://localhost:3000/user/status/${email}`)
    .then(res => res.json())
    .then(data => {
        if (data.isPremium) {
            localStorage.setItem("isPremium", "true");
            if (premiumMsg) premiumMsg.style.display = "block";
            if (leaderboardBtn) leaderboardBtn.style.display = "inline-block";
            if (premiumBtn) premiumBtn.style.display = "none";
            if (downloadBtn) downloadBtn.style.display = "inline-block";
        }
    });

// ================= LOAD EXPENSES =================
fetch(`http://localhost:3000/expense/${email}`)
    .then(res => res.json())
    .then(data => {
        expenses = data;
        renderPage();
    });

// ================= RENDER PAGE =================
function renderPage() {
    if (!table) return;

    table.innerHTML = "";

    const totalPages = Math.max(1, Math.ceil(expenses.length / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    expenses.slice(start, end).forEach((e, i) => {
        table.innerHTML += `
            <tr>
                <td>${e.amount}</td>
                <td>${e.description}</td>
                <td>${e.category}</td>
                <td>
                    <button onclick="deleteExpense(${start + i})">Delete</button>
                </td>
            </tr>
        `;
    });

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// ================= PAGINATION EVENTS =================
if (prevBtn) {
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    };
}

if (nextBtn) {
    nextBtn.onclick = () => {
        const totalPages = Math.ceil(expenses.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
        }
    };
}

// ================= ROWS PER PAGE =================
if (rowsSelect) {
    rowsSelect.addEventListener("change", () => {
        rowsPerPage = Number(rowsSelect.value);
        localStorage.setItem("rowsPerPage", rowsPerPage);
        currentPage = 1;
        renderPage();
    });
}

// ================= ADD EXPENSE =================
if (expenseForm) {
    expenseForm.addEventListener("submit", e => {
        e.preventDefault();

        fetch("http://localhost:3000/expense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                amount: amount.value,
                description: description.value,
                category: category.value
            })
        }).then(() => location.reload());
    });
}

// ================= DELETE EXPENSE =================
function deleteExpense(index) {
    fetch(`http://localhost:3000/expense/${email}/${index}`, {
        method: "DELETE"
    }).then(() => location.reload());
}

// ================= LEADERBOARD =================
if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", async () => {
        const res = await fetch("http://localhost:3000/premium/showleaderboard");
        const data = await res.json();

        leaderboardList.innerHTML = "";
        data.forEach(u => {
            const li = document.createElement("li");
            li.textContent = `Name - ${u.name} | Total Expense - ${u.totalExpense}`;
            leaderboardList.appendChild(li);
        });
    });
}

// ================= BUY PREMIUM =================
if (premiumBtn) {
    const cashfree = Cashfree({ mode: "sandbox" });

    premiumBtn.addEventListener("click", async () => {
        const res = await fetch("http://localhost:3000/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        cashfree.checkout({
            paymentSessionId: data.payment_session_id,
            redirectTarget: "_self"
        });
    });
}

// ================= DOWNLOAD EXPENSES =================
if (downloadBtn) {
    downloadBtn.addEventListener("click", async () => {
        try {
            const res = await fetch(
                `http://localhost:3000/expense/download/${email}`
            );

            if (res.status === 401) {
                alert("Only premium users can download expenses");
                return;
            }

            const data = await res.json();
            downloadLink.innerHTML = `
                <a href="${data.fileURL}" target="_blank">
                    Click here to download your expenses
                </a>
            `;
        } catch {
            alert("Download failed");
        }
    });
}

// ================= AI =================
if (askAiBtn) {
    askAiBtn.addEventListener("click", async () => {
        if (!aiQuestion.value) return;

        const res = await fetch("http://localhost:3000/ai/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: aiQuestion.value })
        });

        const data = await res.json();
        aiAnswer.textContent = data.answer;
    });
}
