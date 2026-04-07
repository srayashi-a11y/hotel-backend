const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false, // important for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    });

    console.log("✅ Email sent successfully");

  } catch (err) {
    console.error("❌ Email error:", err);
  }
};

module.exports = sendEmail;