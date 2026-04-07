const Booking = require("../models/Booking");
const router = require("express").Router()
const paymentController = require("../controllers/paymentController")
const protect = require("../middleware/authMiddleware");
router.post("/create-order",paymentController.createOrder)
router.post("/verify", protect, paymentController.verifyPaymentAndCreateBooking);
router.post("/refund/:id", paymentController.refundPayment);
router.get("/payments", protect, paymentController.getAllPayments);
router.get("/invoice/:id", paymentController.downloadInvoice);
module.exports = router