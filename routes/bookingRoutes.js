const express = require("express");
const router = require("express").Router();
const bookingController = require("../controllers/bookingController");


const { getMyBookings } = require("../controllers/bookingController");
const protect = require("../middleware/authMiddleware");
// router.post("/", bookingController.createBooking); // create booking
router.post("/", protect, bookingController.createBooking);
router.get("/", bookingController.getAllBookings); // fetch all bookings
router.delete("/:id", bookingController.deleteBooking);
router.put("/checkout/:id", bookingController.completeCheckout);
router.put("/:id", bookingController.updateBooking);
router.get("/user/:email", bookingController.getMyBookings);


router.get("/my-bookings", protect, getMyBookings);
router.put("/cancel/:id", protect, bookingController.cancelBooking);
router.get("/stats/dashboard", bookingController.getDashboardStats);
module.exports = router;
