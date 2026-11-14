import mongoose from "mongoose";

// one model for the admin AND the students
//   admin   -> logs in with email
//   student -> logs in with rollNo (college roll number); a CR is a student with crStatus "active"
const Schema = new mongoose.Schema({
    role:{type:String , enum:["admin" , "student"] , required:true},
    name:{type:String , required:true},
    email:{type:String , default:null},                   // admin only
    rollNo:{type:String , default:null},                  // college roll number (student login)
    classRollNo:{type:String , default:null},             // class roll number (unique inside a section)
    password:{type:String , required:true},               // bcrypt hash, never the real password
    sectionId:{type:mongoose.Schema.Types.ObjectId , ref:"section" , default:null},
    crStatus:{type:String , enum:["none" , "pending" , "active"] , default:"none"},
    mustChangePassword:{type:Boolean , default:false},   // true for new students (still on the default password)
    // Recently Viewed notes (a STACK , run by our C program connect_pbl/c/recent_stack.c)
    // saved BOTTOM to TOP: the last id = the note opened last , at most 10 ids
    recentNotes:[{type:mongoose.Schema.Types.ObjectId , ref:"note"}]

},{minimize:false , timestamps:true})


const User = new mongoose.model("User" , Schema);

export default User;
