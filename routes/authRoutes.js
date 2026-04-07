const express=require("express");
const router=express.Router();

const {registerUser,loginUser,updateProfile,changePassword,deleteAccount}=require("../controllers/authController");
const upload=require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register",upload.single("image") ,registerUser);

router.post("/login",loginUser);

//router.put("/update-profile", authMiddleware, updateProfile);

router.put("/change-password", authMiddleware, changePassword);
router.put(
  "/update-profile",
  authMiddleware,
  upload.single("image"),
  updateProfile
);
router.delete("/delete-account",authMiddleware,deleteAccount);
module.exports = router;