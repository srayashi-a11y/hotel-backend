const mongoose = require("mongoose");

const holdSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },

  user: {   // ✅ ADD THIS
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  rooms: Number,
  checkIn: Date,
  checkOut: Date,

  expiresAt: {
    type: Date,
    required: true
  }

}, { timestamps: true });

// 🔥 AUTO DELETE AFTER 15 MIN
holdSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Hold", holdSchema);