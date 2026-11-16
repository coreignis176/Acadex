import mongoose from "mongoose";
import Notification from "../modules/Notification.js";

export const getnotifications = async(req , res) =>{
    try{
        const list = await Notification.find({userId:req.userId}).sort({createdAt:-1});
        res.status(200).send({success:true , data:list});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const marknotificationsread = async(req , res) =>{
    try{
        const {id} = req.body;

        if(id){
            if(!mongoose.isValidObjectId(id)){
                return res.status(400).send({success:false , message:"This Notification Does Not Exist."});
            }
            await Notification.updateOne({_id:id , userId:req.userId} , {read:true});
            return res.status(200).send({success:true , message:""});
        }

        await Notification.updateMany({userId:req.userId} , {read:true});
        res.status(200).send({success:true , message:"All Notifications Marked As Read"});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}
