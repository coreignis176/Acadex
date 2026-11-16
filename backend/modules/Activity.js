import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    kind:{type:String , required:true},
    text:{type:String , required:true}

},{minimize:false , timestamps:true})

const Activity = new mongoose.model("activity" , Schema);

export default Activity;
