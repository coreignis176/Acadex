import mongoose from "mongoose";

// the admin's recent activity log, e.g. "Added section ML3 to B.Tech 2nd Year"
// kind = "section" | "student" | "cr"
const Schema = new mongoose.Schema({
    kind:{type:String , required:true},
    text:{type:String , required:true}

},{minimize:false , timestamps:true})


const Activity = new mongoose.model("activity" , Schema);

export default Activity;
