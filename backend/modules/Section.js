import mongoose from "mongoose";

const subject_schema = new mongoose.Schema({
    name:{type:String , required:true},
    code:{type:String , required:true}
})

const section_schema = new mongoose.Schema({
    courseId:{type:String , required:true},
    year:{type:Number , required:true},
    name:{type:String , required:true},
    archived:{type:Boolean , default:false},
    subjects:{type:[subject_schema] , default:[]}

},{minimize:false , timestamps:true})

const Section = new mongoose.model("section" , section_schema);

export default Section;
