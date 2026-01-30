document.getElementById("forgotForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const msg = document.getElementById("msg");

    try {
        const res = await axios.post(
            "http://localhost:3000/password/forgotpassword",
            { email }
        );

        msg.textContent = res.data.message || "Reset email sent successfully";
        msg.style.color = "green";

    } catch (err) {
        msg.textContent = "Email not found";
        msg.style.color = "red";
    }
});
