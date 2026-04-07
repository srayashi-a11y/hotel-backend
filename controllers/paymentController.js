const razorpay = require("../config/razorpay")
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const generateInvoiceAndSendEmail = require("../utils/invoiceWorker");
const puppeteer = require("puppeteer");
const QRCode = require("qrcode");
// exports.createOrder = async (req,res)=>{

// try{

// const {amount} = req.body

// const options = {
// amount: amount * 100,
// currency:"INR",
// receipt:"order_rcptid_"+Date.now()
// }

// const order = await razorpay.orders.create(options)

// res.json(order)

// }catch(err){
// res.status(500).json({error:err.message})
// }

// }
exports.createOrder = async (req, res) => {
  try {

    const { amount } = req.body;

    console.log("AMOUNT RECEIVED:", amount);

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // ✅ FIXED
      currency: "INR",
      receipt: "order_" + Date.now()
    };

    console.log("OPTIONS:", options);

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (err) {
    console.log("RAZORPAY ERROR FULL:", err); // ✅ IMPORTANT
    res.status(500).json({ error: err.message });
  }
};
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const Hold = require("../models/Hold");

exports.verifyPaymentAndCreateBooking = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    // ❌ INVALID PAYMENT
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }
    const bookingId = "HTL-" + Date.now();

    // ✅ CREATE BOOKING ONLY AFTER VERIFIED PAYMENT
    let booking = await Booking.create({
  ...bookingData,
  user: req.user.id,
  bookingId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  paymentStatus: "paid"
});

// ✅ POPULATE ROOM DATA
booking = await booking.populate("room");
// ✅ DELETE HOLDS AFTER SUCCESSFUL BOOKING
await Hold.deleteMany({
  room: booking.room._id,
  user: req.user.id // ✅ ONLY delete current user's hold
});
  

    // ✅ reduce room count
    // await Room.findByIdAndUpdate(
    //   bookingData.room,
    //   { $inc: { totalRooms: -bookingData.rooms } }
    // );

    res.json({
  message: "Payment successful & booking created",
  booking
});

// 🔥 BACKGROUND PROCESS (NON-BLOCKING)
setTimeout(() => {
  generateInvoiceAndSendEmail(booking); // ✅ pass booking
}, 0);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
exports.refundPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("room");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.paymentStatus === "refunded") {
      return res.status(400).json({ message: "Already refunded" });
    }

    if (!booking.refundAmount || booking.refundAmount <= 0) {
      return res.status(400).json({ message: "No refund amount" });
    }

    // ✅ RAZORPAY REFUND
    const refund = await razorpay.payments.refund(
      booking.razorpay_payment_id,
      {
        amount: Math.round(booking.refundAmount * 100)
      }
    );

    // ✅ UPDATE DB
    booking.paymentStatus = "refunded";
    booking.status = "cancelled";
    await booking.save();

    // ✅ 🔥 SAME SYSTEM AS BOOKING
    setTimeout(() => {
      generateInvoiceAndSendEmail(booking);
    }, 0);

    res.json({ message: "Refund successful", refund });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
// GET ALL PAYMENTS (ADMIN)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Booking.find()
      .populate("user", "name email")
      .populate("room", "name")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




exports.downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("room", "name");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const nights =
      (new Date(booking.checkOut) - new Date(booking.checkIn)) /
      (1000 * 60 * 60 * 24);

    const subtotal = booking.pricePerNight * booking.rooms * nights; // optional if correct
const tax = booking.taxAmount;
const total = booking.grandTotal;
const extras = booking.grandTotal - (subtotal + tax);
    const isRefund = booking.paymentStatus === "refunded";

    // ✅ QR DATA (verification URL)
   const verifyUrl = `${process.env.FRONTEND_URL}/verify-booking/${booking._id}`;
    const qrCode = await QRCode.toDataURL(verifyUrl);

    const html = `
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

/* GOLD BAR */
.top {
  height: 6px;
  background: linear-gradient(90deg,#c9a96e,#f5deb3,#c9a96e);
  margin-bottom: 10px;
}

/* WATERMARK */
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

/* HEADER */
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

/* TITLE */
.title {
  text-align: center;
  margin: 30px 0;
}

.title h1 {
  letter-spacing: 3px;
}

/* SECTION */
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

/* TABLE */
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

/* TOTAL */
.total {
  text-align: right;
  font-size: 20px;
  margin-top: 20px;
  font-weight: bold;
}

/* STAMP */
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

/* FOOTER */
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

/* REFUND BOX */
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

<!-- 🔥 DYNAMIC STAMP -->
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

<!-- 🔥 REFUND SECTION -->
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
     <img src="http://localhost:5173/images/sign.jpg" />
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
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  scale: 0.8, // 🔥 SHRINK CONTENT TO FIT ONE PAGE
});

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${booking._id}.pdf`,
    });

    res.send(pdfBuffer);

  } catch (err) {
    console.error("INVOICE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};