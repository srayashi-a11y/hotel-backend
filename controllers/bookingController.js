const Booking = require("../models/Booking")
const Room = require("../models/Room")

exports.createBooking = async(req,res)=>{

try{

    console.log("ROOM ID:", req.body.room)
console.log("ROOMS BOOKED:", req.body.rooms)
// const booking = await Booking.create(req.body)
const booking = await Booking.create({
  ...req.body,
  user: req.user.id   // remove optional chaining
});
await Room.findByIdAndUpdate(
req.body.room,
{ $inc: { totalRooms: -req.body.rooms } }
)

res.json(booking)

}catch(err){

res.status(500).json({message:err.message})

}

}
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("room", "name").sort({ createdAt: -1 });; // use Booking (singular)
    
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.completeCheckout = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    console.log("BOOKING:", booking); // 👈 DEBUG

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ message: "Already checked out" });
    }

    // ✅ SAFE ROOM UPDATE
    if (booking.room) {
      const room = await Room.findById(booking.room);

      if (room) {
        // await Room.findByIdAndUpdate(
        //   booking.room,
        //   { $inc: { totalRooms: booking.rooms || 1 } } // 👈 SAFE fallback
        // );
      } else {
        console.log("Room not found");
      }
    } else {
      console.log("No room ID in booking");
    }

    // ✅ UPDATE BOOKING
    booking.status = "completed";
    booking.actualCheckOut = new Date();

    await booking.save();

    res.json({ message: "Checkout completed successfully" });

  } catch (err) {
    console.error("CHECKOUT ERROR:", err); // 👈 VERY IMPORTANT
    res.status(500).json({ message: err.message });
  }
};
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("room", "name").sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "active") {
      return res.status(400).json({ message: "Cannot cancel" });
    }

    // ❌ NON-REFUNDABLE CHECK
    if (booking.cancelOption === "non-refundable") {
      return res.status(400).json({
        message: "This booking is non-refundable ❌"
      });
    }

    const today = new Date();
    const checkIn = new Date(booking.checkIn);

    const diffTime = checkIn - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let deduction = 0;

    if (diffDays >= 2) {
      deduction = 0;
    } else if (diffDays === 1) {
      deduction = 0.2;
    } else {
      deduction = 1;
    }

    const refund = booking.grandTotal * (1 - deduction);

    booking.status = "cancelled";
    booking.canceledAt = new Date();
    booking.refundAmount = refund;

    await booking.save();

    // await Room.findByIdAndUpdate(
    //   booking.room,
    //   { $inc: { totalRooms: booking.rooms } }
    // );

    res.json({
      message: "Booking cancelled",
      refundAmount: refund
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getDashboardStats = async (req, res) => {
  try {
    const bookings = await Booking.find();

    const stats = {
      total: bookings.length,
      active: bookings.filter(b => b.status === "active").length,
      completed: bookings.filter(b => b.status === "completed").length,
      cancelled: bookings.filter(b => b.status === "cancelled").length,

      revenue: bookings
        .filter(b => b.paymentStatus === "paid")
        .reduce((acc, b) => acc + (b.grandTotal || 0), 0)
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};