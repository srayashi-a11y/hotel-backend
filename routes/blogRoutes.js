const express=require("express");
const router=express.Router();
const {addBlog,getBlogs,deleteBlogs,updateBlog,getBlogBySlug,addComment,getAllComments,deleteComment }=require("../controllers/blogController");
const upload=require ("../middleware/uploadblogMiddleware");
const protect=require("../middleware/authMiddleware");


router.post("/blogs/add", protect, upload.single("image"), addBlog);

router.get("/blogs",getBlogs);

router.delete("/blogs/:id",protect,deleteBlogs);
router.put(
  "/blogs/:id",
  protect,
  upload.single("image"),
  updateBlog
);
router.get("/blogs/:slug", getBlogBySlug); 
router.post("/blogs/:slug/comment", addComment); 
router.get("/comments", getAllComments);
router.delete("/comments/:blogSlug/:commentId", deleteComment);
module.exports=router;