import jwt from "jsonwebtoken";
import User from "../modules/User.js";

export const validateUser = async(req , res , next) =>{

    const token = req.cookies.userToken;
    if(!token){
        return res.status(401).send({success:false , message:"Please Log In To Continue."});
    }

    let userid;
    try{
        userid = jwt.verify(token , process.env.JWT_SECRET).userid;
    }
    catch(error){
        return res.status(401).send({success:false , message:"Your Session Has Expired. Please Log In Again."});
    }

    try{
        const user = await User.findById(userid);
        if(!user){
            return res.status(401).send({success:false , message:"Please Log In To Continue."});
        }

        req.userId = user._id;
        req.user = user;
        next();
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const isAdmin = (req , res , next) =>{
    if(req.user.role !== "admin"){
        return res.status(403).send({success:false , message:"Only The Admin Can Do This."});
    }
    next();
}

export const isStudent = (req , res , next) =>{
    if(req.user.role !== "student"){
        return res.status(403).send({success:false , message:"Only Students Can Do This."});
    }
    next();
}

export const isCr = (req , res , next) =>{
    if(req.user.role !== "student" || req.user.crStatus !== "active"){
        return res.status(403).send({success:false , message:"Only An Active CR Can Do This."});
    }
    next();
}
