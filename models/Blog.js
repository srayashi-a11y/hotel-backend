const mongoose=require("mongoose");

const commentSchema=new mongoose.Schema({
    name:String,
    message:String,
    createdAt:{type:Date,default:Date.now}
});
const blogSchema=new mongoose.Schema({
    title:String,
    slug:String,
    image:String,
    shortdes:String,
    content:String,
    comments:[commentSchema]
},{timestamps:true});

module.exports=mongoose.model("Blog", blogSchema);