const fetch = require("node-fetch");

async function createOrder(email) {

    const orderId = "ORD_" + Date.now();
    const customerId = email.replace(/[^a-zA-Z0-9_-]/g, "_");

    const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-client-id": "TEST430329ae80e0f32e41a393d78b923034",
            "x-client-secret": "TESTaf195616268bd6202eeb3bf8dc458956e7192a85",
            "x-api-version": "2022-09-01"
        },
        body: JSON.stringify({
            order_id: orderId,
            order_amount: 499,
            order_currency: "INR",
            customer_details: {
                customer_id: customerId,
                customer_email: email,
                customer_phone: "9999999999"
            },
            order_meta: {
                return_url: "http://localhost:3000/payment-success?order_id={order_id}"
            }
        })
    });

    const data = await response.json();
    return data;
}

module.exports = { createOrder };
