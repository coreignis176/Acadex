import mongoose from "mongoose";

// type = "cr" | "notes" | "section" | "student"
// action = {kind:"cr-confirm"} shows the Confirm / Not me buttons on a CR request
const Schema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId , ref:"User" , required:true},
    type:{type:String , required:true},
    title:{type:String , required:true},
    message:{type:String , required:true},
    read:{type:Boolean , default:false},
    action:{type:Object , default:null}

},{minimize:false , timestamps:true})


const Notification = new mongoose.model("notification" , Schema);

export default Notification;
