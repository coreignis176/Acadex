import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    role:{type:String , enum:["admin" , "student"] , required:true},
    name:{type:String , required:true},
    email:{type:String , default:null},
    rollNo:{type:String , default:null},
    classRollNo:{type:String , default:null},
    password:{type:String , required:true},
    sectionId:{type:mongoose.Schema.Types.ObjectId , ref:"section" , default:null},
    crStatus:{type:String , enum:["none" , "pending" , "active"] , default:"none"},
    mustChangePassword:{type:Boolean , default:false},
    recentNotes:[{type:mongoose.Schema.Types.ObjectId , ref:"note"}]

},{minimize:false , timestamps:true})

const User = new mongoose.model("User" , Schema);

export default User;
