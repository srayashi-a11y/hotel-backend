const puppeteer = require("puppeteer");
const QRCode = require("qrcode");
const User = require("../models/User");
const Booking = require("../models/Booking");
const sendEmail = require("../utils/sendEmail");

const generateInvoiceAndSendEmail = async (bookingData) => {
  try {

    // ✅ ALWAYS FETCH FULL BOOKING (IMPORTANT FIX)
    const booking = await Booking.findById(bookingData._id).populate("room");

    const user = await User.findById(booking.user);

    const bookingId = booking.bookingId || ("HTL-" + booking._id.toString().slice(-6));
    const subject = booking.paymentStatus === "refunded"
  ? `Refund Processed - ${bookingId}`
  : `Booking Confirmed - ${bookingId}`;

    // ================= PDF =================
    const nights =
      (new Date(booking.checkOut) - new Date(booking.checkIn)) /
      (1000 * 60 * 60 * 24);

    const subtotal = booking.pricePerNight * booking.rooms * nights;
    const tax = booking.taxAmount;
    const total = booking.grandTotal;
    const extras = booking.grandTotal - (subtotal + tax);

   const verifyUrl = `${process.env.FRONTEND_URL}/verify-booking/${booking._id}`;
    const qrCode = await QRCode.toDataURL(verifyUrl);
    const isRefund = booking.paymentStatus === "refunded";

    // ✅ YOUR SAME HTML (UNCHANGED)
     const htmlInvoice = `
<html>
<head>
<style>

body {
  font-family: "Georgia", serif;
  background: #f4f4f4;
  padding: 10px;
}

.invoice {
  max-width: 1000px;
  margin: auto;
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.15);
  position: relative;
}

.top {
  height: 6px;
  background: linear-gradient(90deg,#c9a96e,#f5deb3,#c9a96e);
  margin-bottom: 30px;
}

.watermark {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%,-50%);
  opacity: 0.05;
}

.watermark img {
  width: 350px;
}

.header {
  display: flex;
  justify-content: space-between;
}

.hotel-name {
  font-size: 22px;
  font-weight: bold;
}

.info {
  text-align: right;
  font-size: 13px;
}

.title {
  text-align: center;
  margin: 30px 0;
}

.title h1 {
  letter-spacing: 3px;
}

.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.box {
  width: 48%;
}

.box h3 {
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th {
  background: #111;
  color: #fff;
  padding: 12px;
}

td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}
.total {
  text-align: right;
  font-size: 20px;
  margin-top: 20px;
  font-weight: bold;
}

.paid {
  position: absolute;
  top: 150px;
  right: 60px;
  padding: 10px 30px;
  transform: rotate(-15deg);
  opacity: 0.2;
  font-size: 30px;
  border: 3px solid green;
  color: green;
}

.footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.signature img {
  height: 50px;
}

.qr img {
  height: 100px;
}

.note {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #777;
}

.refund-box {
  margin-top:20px;
  padding:15px;
  border:2px solid #dc2626;
  background:#fef2f2;
  border-radius:8px;
  color:#991b1b;
}
.invoice {
  page-break-inside: avoid;
}

table, tr, td {
  page-break-inside: avoid;
}
</style>
</head>

<body>

<div class="invoice">

<div class="top"></div>

<div class="watermark">
  <img src="https://i.imgur.com/6X4K8QK.png"/>
</div>

<div class="paid" style="
  border-color:${isRefund ? '#dc2626' : 'green'};
  color:${isRefund ? '#dc2626' : 'green'};
">
  ${isRefund ? "REFUNDED" : "PAID"}
</div>

<div class="header">
  <div>
    <div class="hotel-name">Hotel Booking Pvt Ltd</div>
    <small>Luxury Collection</small>
  </div>

  <div class="info">
    Calangute Beach, Goa, India <br/>
    GSTIN: 22AAAAA0000A1Z5 <br/>
    support@seanest.com
  </div>
</div>

<div class="title">
  <h1>${isRefund ? "REFUND INVOICE" : "TAX INVOICE"}</h1>
  <p>Invoice No: INV-${booking._id.toString().slice(-6)}</p>
  <p>Date: ${new Date().toDateString()}</p>

  <p style="color:${isRefund ? '#dc2626' : '#16a34a'}; font-weight:bold;">
    ${isRefund ? "This booking has been cancelled & refunded" : "Payment successfully completed"}
  </p>
</div>

<div class="row">
  <div class="box">
    <h3>Guest Details</h3>
    <p>${booking.firstName} ${booking.lastName}</p>
    <p>${booking.email}</p>
  </div>

  <div class="box">
    <h3>Booking Details</h3>
    <p>Room: ${booking.room?.name}</p>
    <p>Rooms: ${booking.rooms}</p>
    <p>Nights: ${nights}</p>
    <p>Meal Plan: ${booking.mealOption || "Not Included"}</p>
  </div>
</div>

<table>
<tr>
  <th>Description</th>
  <th>Amount (₹)</th>
</tr>

<tr>
  <td>Room Charges (${booking.rooms} rooms × ${nights} nights)</td>
  <td>₹${subtotal.toFixed(2)}</td>
</tr>
<tr>
  <td>
    Extras:<br/>
    🍽 Meal Plan: ${booking.mealOption || "Not Included"}<br/>
    🛑 Cancellation: ${booking.cancelOption === "free" ? "Free Cancellation" : "Non-Refundable"}
  </td>
  <td>₹${extras.toFixed(2)}</td>
</tr>
<tr>
  <td>Taxes & Fees</td>
  <td>₹${tax.toFixed(2)}</td>
</tr>

<tr>
  <td><b>Total</b></td>
  <td><b>₹${total.toFixed(2)}</b></td>
</tr>
</table>

<div class="total">
Grand Total: ₹${total.toFixed(2)}
</div>

${isRefund ? `
<div class="refund-box">
  <h3>Refund Details</h3>
  <p><b>Original Amount:</b> ₹${booking.grandTotal}</p>
  <p><b>Refund Amount:</b> ₹${booking.refundAmount}</p>
  <p><b>Status:</b> Refunded</p>
</div>
` : ""}

<div class="footer">
  <div class="signature">
    <img src="${process.env.FRONTEND_URL}/images/sign.jpg" />
    <p>Authorized Signature</p>
  </div>

  <div class="qr">
    <img src="${qrCode}" />
    <p style="font-size:12px;">Scan to verify booking</p>
  </div>
</div>

<div class="note">
This is a computer-generated invoice. No signature required.
</div>

</div>

</body>
</html>
`;

    // const browser = await puppeteer.launch({
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    //   headless: true
    // });
    // const browser = await puppeteer.launch({
    //   executablePath: "C:\\Users\\Monojit-PC\\.cache\\puppeteer\\chrome\\win64-146.0.7680.153\\chrome-win64\\chrome.exe",
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    //   headless: true
    // });
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
 

    const page = await browser.newPage();
    await page.setContent(htmlInvoice, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  scale: 0.8, // 🔥 SHRINK CONTENT TO FIT ONE PAGE
});

    await browser.close();

    // ================= EMAIL BODY (RESTORED ✅) =================
 const emailHTML = isRefund
  ? `
  <!-- 💸 REFUND EMAIL -->
  <div style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px">
    
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden">
      
      <div style="background:#6a0dad;color:#fff;padding:20px;text-align:center">
        <h2 style="margin:0">💸 Refund Confirmation</h2>
        <p style="margin:5px 0 0">Your refund has been successfully processed</p>
      </div>

      <div style="padding:20px;color:#333">
        
        <p>Hi <b>${user.name}</b>,</p>

        <p>Your refund has been <b style="color:green">processed successfully</b> ✅</p>

        <hr/>

        <h3>Booking Details</h3>

        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td><b>Booking ID</b></td>
            <td>${bookingId}</td>
          </tr>
          <tr>
            <td><b>Check-in</b></td>
            <td>${new Date(booking.checkIn).toDateString()}</td>
          </tr>
          <tr>
            <td><b>Check-out</b></td>
            <td>${new Date(booking.checkOut).toDateString()}</td>
          </tr>
          <tr>
            <td><b>Status</b></td>
            <td style="color:red"><b>Cancelled</b></td>
          </tr>
        </table>

        <hr/>

        <h3>Refund Summary</h3>

        <table style="width:100%">
          <tr>
            <td>Original Amount</td>
            <td style="text-align:right">₹${booking.grandTotal}</td>
          </tr>
          <tr>
            <td>Refund Amount</td>
            <td style="text-align:right;color:green">
              <b>₹${booking.refundAmount}</b>
            </td>
          </tr>
        </table>

        <hr/>

        <p style="font-size:14px;color:#555">
          Refund will be credited in 3-5 working days.
        </p>

        <p style="margin-top:20px">
          Thank you ❤️
        </p>

      </div>

      <div style="background:#f1f1f1;padding:15px;text-align:center;font-size:12px;color:#777">
        <p>Hotel Booking Pvt Ltd</p>
      </div>

    </div>
  </div>
  `
  : `
  <!-- 🏨 BOOKING EMAIL -->
  <div style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px">
    
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden">
      
      <div style="background:#052b5f;color:#fff;padding:20px;text-align:center">
        <h2 style="margin:0">🏨 Hotel Booking</h2>
        <p style="margin:5px 0 0">Your reservation is confirmed</p>
      </div>

      <div style="padding:20px;color:#333">
        
        <p>Hi <b>${user.name}</b>,</p>

        <p>Your booking has been <b style="color:green">confirmed</b> ✅</p>

        <hr/>

        <h3>Booking Details</h3>

        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td><b>Booking ID</b></td>
            <td>${bookingId}</td>
          </tr>
          <tr>
            <td><b>Check-in</b></td>
            <td>${new Date(booking.checkIn).toDateString()}</td>
          </tr>
          <tr>
            <td><b>Check-out</b></td>
            <td>${new Date(booking.checkOut).toDateString()}</td>
          </tr>
          <tr>
            <td><b>Rooms</b></td>
            <td>${booking.rooms}</td>
          </tr>
          <tr>
            <td><b>Payment</b></td>
            <td style="color:green"><b>Paid</b></td>
          </tr>
        </table>

        <hr/>

        <h3>Payment Summary</h3>

        <table style="width:100%">
          <tr>
            <td>Total Amount</td>
            <td style="text-align:right">₹${booking.grandTotal}</td>
          </tr>
        </table>

      </div>

      <div style="background:#f1f1f1;padding:15px;text-align:center;font-size:12px;color:#777">
        <p>Hotel Booking Pvt Ltd</p>
      </div>

    </div>
  </div>
  `;

    // ================= SEND EMAIL =================
    await sendEmail(user.email, subject, emailHTML, // ✅ FULL BODY RESTORED
      [
        {
          filename: `Invoice-${bookingId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    );

  } catch (err) {
    console.error("Worker error:", err);
  }
};

module.exports = generateInvoiceAndSendEmail;