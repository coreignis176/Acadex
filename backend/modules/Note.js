import mongoose from "mongoose";

// one page image of a note (the image itself is stored on Cloudinary)
const file_schema = new mongoose.Schema({
    url:{type:String , required:true},             // link to show / download the image
    publicId:{type:String , required:true},        // Cloudinary id, needed to delete it
    name:{type:String , required:true},            // original file name, e.g. page1.jpg
    type:{type:String , default:""},
    size:{type:Number , default:0}
},{_id:false})

// notes uploaded by a student (pending until a CR approves) or a CR (approved at once)
const note_schema = new mongoose.Schema({
    sectionId:{type:mongoose.Schema.Types.ObjectId , ref:"section" , required:true},
    title:{type:String , required:true},
    subject:{type:String , required:true},
    subjectCode:{type:String , default:""},
    topic:{type:String , required:true},
    description:{type:String , default:""},
    fileName:{type:String , default:""},
    fileSize:{type:String , default:""},
    files:{type:[file_schema] , default:[]},
    uploadedBy:{type:mongoose.Schema.Types.ObjectId , ref:"User" , required:true},
    uploaderName:{type:String , required:true},
    uploaderRole:{type:String , enum:["Student" , "CR"] , default:"Student"},
    status:{type:String , enum:["pending" , "approved" , "rejected"] , default:"pending"},
    reason:{type:String , default:""},                 // why a CR rejected it
    reviewedBy:{type:String , default:null},
    reviewedAt:{type:Date , default:null},
    likes:[{type:mongoose.Schema.Types.ObjectId , ref:"User"}],
    dislikes:[{type:mongoose.Schema.Types.ObjectId , ref:"User"}]

},{minimize:false , timestamps:true})


const Note = new mongoose.model("note" , note_schema);

export default Note;
