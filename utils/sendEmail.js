const SibApiV3Sdk = require("sib-api-v3-sdk");

const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const client = SibApiV3Sdk.ApiClient.instance;

    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const emailData = {
      sender: {
        email: process.env.EMAIL_USER,
        name: "Hotel Booking"
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      attachment: attachments.map(file => ({
  name: file.filename,
  content: Buffer.from(file.content).toString("base64"),
  type: file.contentType
}))
    };

    await apiInstance.sendTransacEmail(emailData);

    console.log("✅ Email sent via API");

  } catch (err) {
    console.error("❌ Email API error:", err.response?.body || err);
  }
};

module.exports = sendEmail;