const User=require("../models/User");
const bcrypt=require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerUser=async(req,res)=>{
    try{
        const {name,email,password,role}=req.body;
        const image=req.file? req.file.filename:"";
        const userExists=await User.findOne({email});
        if(userExists){
            return res.status(400).json({msg:"User already exist"});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);
        const user=await User.create({
            name,
            email,
            password:hashedPassword,
            image,
            role
        });
        res.status(201).json({
            msg:"User Registered",
            user
        });
    }catch(error){
        res.status(500).json({message:error.message});
    }
}


exports.loginUser=async(req,res)=>{
    try{
        const {email,password}=req.body;
        const user=await User.findOne({email});
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(401).json({message:"Invalid credentials"})
        }
        const token=jwt.sign(
            {id:user._id,role:user.role},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );
        res.json({
            token,
            user
        });
    }catch(error){
        res.status(500).json({message:error.message})

    }
};
exports.authAdmin=async(req,res,next)=>{
    const token=req.headers.authorization?.split(" ")[1]
    if(!token) return res.status(401).json({msg:"No token"})
    const decoded=jwt.verify(token,process.env.JWT_SECRET)
    if(decoded.role !== "admin"){
    return res.status(403).json({msg:"Admin only"})
    }
    next()
}

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const updateData = {
      name,
      phone
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { returnDocument: "after" }
    );

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ CHECK CURRENT PASSWORD
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect ❌" });
    }

    // ✅ HASH NEW PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully ✅" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.deleteAccount=async(req,res)=>{
  try{
    await User.findByIdAndDelete(req.user.id);
    res.json({message:"Account deleted"});
  }catch(err){
    res.status(500).json({message:err.message})
  }
}