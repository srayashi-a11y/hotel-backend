 const Blog=require ("../models/Blog")
const slugify = (text) =>
  text.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");


//  exports.addBlog=async(req,res)=>{
//     try{
//         const blog=await Blog.create({
//             title:req.body.title,
//             shortdes:req.body.shortdes,
//             content:req.body.content,
//             image:req.file?req.file.filename:""
//         });
//         res.json(blog)
//     }catch(err){
//         res.status (500).json({message:err.message});
//     }
//  };
exports.addBlog=async(req,res)=>{
    try{
        const blog=await Blog.create({
            title:req.body.title,
            slug: slugify(req.body.title), // 👈 ADD
            shortdes:req.body.shortdes,
            content:req.body.content,
            image:req.file?req.file.filename:""
        });
        res.json(blog)
    }catch(err){
        res.status (500).json({message:err.message});
    }
};
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) return res.status(404).json({ msg: "Not found" });

    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getBlogs=async(req,res)=>{
    try{
        const blogs=await Blog.find().sort({createdAt:-1});
        res.json(blogs);
    }catch(err){
        res.status(500).json({message:err.message});
    }
 };
exports.deleteBlogs=async(req,res)=>{
    try{
        await Blog.findByIdAndDelete(req.params.id);
        res.json({ msg:"Deleted"});
    }catch(err){
        res.status(500).json({message:err.message});
    }
}
exports.updateBlog=async(req,res)=>{
    try{
        const updateData={
            title:req.body.title,
            shortdes:req.body.shortdes,
            content:req.body.content
        };
        if(req.file){
            updateData.image=req.file.filename;
        }
        const updated=await Blog.findByIdAndUpdate(req.params.id,updateData,{returnDocument: "after"});
        res.json(updated)
    }
    catch(err){
        console.log(err)
    }
}
exports.addComment=async(req,res)=>{
    try{
        const {name,message}=req.body;
        const blog=await Blog.findOne({slug:req.params.slug});
        if(!blog) return res.status(400).json({msg:"Blog not found"});
        blog.comments.push({name,message});
        await blog.save();
        res.json(blog.comments)
    }catch(err){
        res.status(500).json({message:err.message})
    }
}
// exports.getAllComments = async (req, res) => {
//   try {
//     const blogs = await Blog.find();

//     let allComments = [];

//     blogs.forEach((blog) => {
//       blog.comments.forEach((c) => {
//         allComments.push({
//           blogTitle: blog.title,
//           blogSlug: blog.slug,
//           name: c.name,
//           message: c.message,
//           createdAt: c.createdAt,
//         });
//       });
//     });

//     res.json(allComments);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
exports.getAllComments = async (req, res) => {
  try {
    const blogs = await Blog.find();

    let allComments = [];

    blogs.forEach((blog) => {
      blog.comments.forEach((c) => {
        allComments.push({
          _id: c._id, // 👈 ADD THIS
          blogTitle: blog.title,
          blogSlug: blog.slug,
          name: c.name,
          message: c.message,
          createdAt: c.createdAt,
        });
      });
    });

    res.json(allComments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.deleteComment = async (req, res) => {
  try {
    const { blogSlug, commentId } = req.params;

    const blog = await Blog.findOne({ slug: blogSlug });

    if (!blog) return res.status(404).json({ msg: "Blog not found" });

    blog.comments = blog.comments.filter(
      (c) => c._id.toString() !== commentId
    );

    await blog.save();

    res.json({ msg: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};