const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({

room:{
type:mongoose.Schema.Types.ObjectId,
ref:"Room"
},

checkIn:Date,
checkOut:Date,

rooms:Number,

mealOption:String,

pricePerNight:Number,
taxAmount:Number,
taxRate:Number,
grandTotal:Number,

firstName:String,
lastName:String,
email:String,
phone:String,
countryCode:String,

bookingFor:{
type:String,
enum:["self","someone_else"],
default:"self"
},

paymentMethod:{
type:String,
enum:["razorpay","stripe"]
},
guestDetails: {
  firstName: String,
  lastName: String,
  email: String,
  phone: String
},
address:String,
city:String,
postalCode:String,
country:String,
status: {
  type: String,
  enum: ["active", "completed", "cancelled"], // ADD cancelled
  default: "active"
},

actualCheckOut: {
  type: Date
},
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
},
canceledAt: Date,
refundAmount: Number,
cancelOption: {
  type: String,
  enum: ["free", "non-refundable"],
  default: "non-refundable"
},
razorpay_order_id: String,
razorpay_payment_id: String,
razorpay_signature: String,

paymentStatus: {
  type: String,
  enum: ["pending", "paid", "failed", "refunded"],
  default: "pending"
},
},{timestamps:true})

module.exports = mongoose.model("Booking",bookingSchema)