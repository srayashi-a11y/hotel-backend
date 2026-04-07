const express=require("express")
const router=express.Router()

const {addRoom,getRooms,deleteRoom,updateRoom,updateRoomStatus,getRoomById,addReview,checkAvailability,searchRooms}=require("../controllers/roomController")
const upload=require("../middleware/uploadroomMiddleware")
const protect=require("../middleware/authMiddleware")

router.post(
 "/rooms/add",
 protect,
 upload.array("roomImages",5),
 addRoom
)

router.get("/rooms", getRooms)

router.get("/rooms/:id", getRoomById)

router.delete("/rooms/:id", protect, deleteRoom)

router.put(
 "/rooms/:id",
 protect,
 upload.array("roomImages",5),
 updateRoom
)

router.put("/rooms/:id/status", protect, updateRoomStatus)

router.post("/rooms/:id/review", addReview)

// router.post("/rooms/:id/check-availability", checkAvailability)
router.post(
  "/rooms/:id/check-availability",
  protect,
  checkAvailability
)
router.get("/search", searchRooms);
module.exports=router