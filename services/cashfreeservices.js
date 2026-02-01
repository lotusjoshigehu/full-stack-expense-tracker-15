const axios = require("axios");

const CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg";

exports.createOrder = async (userId, email) => {
  try {
    const orderId = `order_${Date.now()}`;

    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders`,
      {
        order_id: orderId,
        order_amount: 499,
        order_currency: "INR",
        customer_details: {
          customer_id: userId.toString(),
          customer_email: email,
          customer_phone: "9999999999"
        },
        order_meta: {
          return_url: `http://localhost:3000/payment-success?order_id=${orderId}`
        }
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01"
        }
      }
    );

    return {
      order_id: orderId,
      payment_session_id: response.data.payment_session_id
    };

  } catch (err) {
    console.error("Cashfree API Error:", err.response?.data || err.message);
    throw err;
  }
};
