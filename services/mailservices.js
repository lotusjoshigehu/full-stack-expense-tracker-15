const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,   // a0ab54001@smtp-brevo.com
        pass: process.env.SMTP_KEY
    }
});

const sendResetMail = async (email) => {
    await transporter.sendMail({
        from: `"Expense Tracker" <${process.env.SENDER_EMAIL}>`,
        to: email,
        subject: "Password Reset",
        html: `
            <h3>Password Reset</h3>
            <p>You requested to reset your password.</p>
            <p>This is a demo reset email.</p>
        `
    });
};

module.exports = { sendResetMail };
