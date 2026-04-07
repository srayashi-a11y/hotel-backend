const Booking = require("../models/Booking");
const Room = require("../models/Room");
const Hold = require("../models/Hold");

exports.addRoom = async(req,res)=>{

 try{

  let images = [];

  if(req.files){
   images = req.files.map(file => file.filename);
  }

  const amenities = req.body.amenities
   ? req.body.amenities.split(",")
   : [];
  const advancedFeatures = req.body.advancedFeatures
    ? req.body.advancedFeatures.split("\n").filter(f => f.trim() !== "")
    : [];

  const room = await Room.create({
   ...req.body,
   roomImages: images,
   amenities,
   advancedFeatures
  });

  res.json(room);

 }catch(err){

  res.status(500).json({message:err.message});

 }

}
exports.getRooms=async(req,res)=>{
    try{
        const rooms=await Room.find().sort({createdAt:-1})
        res.json(rooms)
    }catch(err){
        res.status(500).json({message:err.message})
    }
}
exports.deleteRoom = async (req,res)=>{
 try{

  const room = await Room.findById(req.params.id)

  if(!room){
   return res.status(404).json({message:"Room not found"})
  }

  await room.deleteOne()

  res.json({message:"Room deleted successfully"})

 }catch(err){
  res.status(500).json({message:err.message})
 }
}
exports.updateRoom = async(req,res)=>{
 try{

  const room = await Room.findById(req.params.id)

  if(!room){
   return res.status(404).json({message:"Room not found"})
  }

 
let images = []

if(req.body.existingImages){
 images = JSON.parse(req.body.existingImages)
}

if(req.files && req.files.length > 0){
 const newImages = req.files.map(file => file.filename)
 images = [...images, ...newImages]
}

  const amenities = req.body.amenities
   ? req.body.amenities.split(",")
   : []
   const advancedFeatures = req.body.advancedFeatures
    ? req.body.advancedFeatures.split("\n").filter(f => f.trim() !== "")
    : []

  const updatedRoom = await Room.findByIdAndUpdate(
   req.params.id,
   {
    ...req.body,
    amenities,
    advancedFeatures,
    roomImages: images
   },
   { returnDocument:"after" }
  )

  res.json(updatedRoom)

 }catch(err){
  res.status(500).json({message:err.message})
 }
}

exports.updateRoomStatus = async(req,res)=>{

 try{

  const room = await Room.findByIdAndUpdate(
   req.params.id,
   { isAvailable: req.body.isAvailable },
   { returnDocument:"after" }
  )

  res.json(room)

 }catch(err){
  res.status(500).json({message:err.message})
 }

}
exports.getRoomById=async(req,res)=>{
  try{
    const room=await Room.findById(req.params.id)
    if(!room){
      return res.status(404).json({message:"Room not found"})
    }
    res.json(room)
  }catch(err){
    res.status(500).json({message:err.message})
  }
}
exports.addReview = async(req,res)=>{

 try{

  const {name,rating,comment} = req.body

  const room = await Room.findById(req.params.id)

  if(!room){
   return res.status(404).json({message:"Room not found"})
  }

  const review = {
   name,
   rating,
   comment
  }

  room.reviews.push(review)

  await room.save()

  res.json(room.reviews)

 }catch(err){
  res.status(500).json({message:err.message})
 }

}
exports.checkAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut, rooms } = req.body;

    if (!checkIn || !checkOut || !rooms) {
      return res.status(400).json({ message: "Missing data" });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // ✅ ACTIVE BOOKINGS
    const bookings = await Booking.find({
      room: room._id,
      status: "active",
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    });

    const bookedCount = bookings.reduce((sum, b) => sum + b.rooms, 0);

    // ✅ ACTIVE HOLDS
    const holds = await Hold.find({
  room: room._id,
  checkIn: { $lt: end },
  checkOut: { $gt: start },
  expiresAt: { $gt: new Date() } // ✅ ADD THIS
});

    const holdCount = holds.reduce((sum, h) => sum + h.rooms, 0);

    // ✅ FINAL AVAILABLE
    const availableRooms = room.totalRooms - bookedCount - holdCount;

    if (Number(rooms) > availableRooms) {
      return res.json({
        availableRooms: availableRooms > 0 ? availableRooms : 0
      });
    }

    // ✅ CREATE HOLD (15 MIN)
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await Hold.create({
      room: room._id,
      user: req.user.id, // ✅ ADD THIS LINE
      rooms,
      checkIn: start,
      checkOut: end,
      expiresAt: expires
    });

    res.json({
      availableRooms
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.searchRooms = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    const adults = Number(req.query.adults);

    if (!checkIn || !checkOut || !adults) {
      return res.status(400).json({ message: "Missing search data" });
    }

    const start = new Date(checkIn);
start.setHours(0, 0, 0, 0);

const end = new Date(checkOut);
end.setHours(23, 59, 59, 999);

    const rooms = await Room.find({
      //maxGuests: { $gte: adults },
      isAvailable: true
    });

    let availableRooms = [];

for (let room of rooms) {

  const bookings = await Booking.find({
  room: room._id,
  status: "active",
  checkOut: { $gt: new Date() }, // 🔥 ignore old bookings
  $expr: {
    $and: [
      { $lt: ["$checkIn", end] },
      { $gt: ["$checkOut", start] }
    ]
  }
});

  const bookedCount = bookings.reduce((sum, b) => sum + b.rooms, 0);

  //const availableCount = room.totalRooms - bookedCount;
const holds = await Hold.find({
  room: room._id,
  checkIn: { $lt: end },
  checkOut: { $gt: start },
  expiresAt: { $gt: new Date() } // ✅ ADD THIS
});

const holdCount = holds.reduce((sum, h) => sum + h.rooms, 0);

const availableCount = room.totalRooms - bookedCount - holdCount;

  if (availableCount > 0) {
    availableRooms.push({
      ...room.toObject(),
      availableRooms: availableCount // 🔥 IMPORTANT
    });
  }
}

    res.json(availableRooms);

  } catch (err) {
    console.log("SEARCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};