const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({

 name:String,

 description:String,

 pricePerNight:Number,

 maxGuests:Number,
 maxChildren:{
 type:Number
},

 roomImages:[String],

 amenities:[String],
 advancedFeatures:[String],
 reviews:[
 {
  name:String,
  rating:Number,
  comment:String,
  createdAt:{
   type:Date,
   default:Date.now
  }
 }
],
totalRooms:{
 type:Number,
 required:true
},

 isAvailable:{
  type:Boolean,
  default:true
 }

},{timestamps:true})

module.exports = mongoose.model("Room",roomSchema)