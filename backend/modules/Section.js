import mongoose from "mongoose";

// a subject inside a section, e.g. {name:"Data Structures" , code:"TCS302"}
// (mongoose gives every subject its own _id automatically)
const subject_schema = new mongoose.Schema({
    name:{type:String , required:true},
    code:{type:String , required:true}
})

// a class section, e.g. B.Tech 2nd Year ML1
const section_schema = new mongoose.Schema({
    courseId:{type:String , required:true},        // "btech" or "bba"
    year:{type:Number , required:true},            // 1 , 2 , 3 , 4
    name:{type:String , required:true},            // "ML1" , "Section A"
    archived:{type:Boolean , default:false},
    subjects:{type:[subject_schema] , default:[]}

},{minimize:false , timestamps:true})


const Section = new mongoose.model("section" , section_schema);

export default Section;
