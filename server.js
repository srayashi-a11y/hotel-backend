const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");


const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes=require("./routes/bookingRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const contactRoutes = require("./routes/contactRoutes");
const blogRoutes=require("./routes/blogRoutes");


connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ⭐ THIS LINE IS REQUIRED
app.use("/uploads", express.static("uploads"));
app.use("/api/payment",paymentRoutes)
app.use("/api/auth", authRoutes);
app.use("/api", roomRoutes);
app.use("/api/bookings",bookingRoutes);
app.use("/api", contactRoutes);
app.use("/api",blogRoutes);
app.get("/", (req,res)=>{
 res.send("API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
 console.log(`Server running on ${PORT}`);
});