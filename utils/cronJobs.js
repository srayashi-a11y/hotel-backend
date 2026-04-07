const cron = require("node-cron");
const Booking = require("../models/Booking");
const Room = require("../models/Room");

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running booking cleanup job...");

  try {
    const today = new Date();

    // Get expired bookings
    const expiredBookings = await Booking.find({
      checkOut: { $lt: today },
      status: "active" // only active bookings
    });

    for (let booking of expiredBookings) {

      // ✅ ADD ROOMS BACK
      await Room.findByIdAndUpdate(
        booking.room,
        { $inc: { totalRooms: booking.rooms } }
      );

      // ✅ MARK COMPLETED (instead of delete)
      booking.status = "completed";
      await booking.save();
    }

    console.log("Updated bookings:", expiredBookings.length);

  } catch (err) {
    console.error("Cron job error:", err);
  }
});