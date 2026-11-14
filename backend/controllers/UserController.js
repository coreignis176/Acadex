import bcrypt from "bcryptjs";
import User from "../modules/User.js";
import Section from "../modules/Section.js";
import Notification from "../modules/Notification.js";
import generateToken from "../utils/tokenGenerator.js";
import { notify, notifyMany, logActivity, publicUser, sectionInfo } from "../utils/helpers.js";
import { checkPassword } from "../connect_pbl/validation.js";       // the password check is done by our C++ program

// NOTE: {success:true , message} is short for {success:true , message:message}
//       $in = "one of these" , $ne = "not equal to" (used in the database queries below)

// same cookie settings for login and logout
//   httpOnly -> page JavaScript cannot read the cookie (safer)
//   secure + sameSite:"None" -> the cookie is sent over https, also from the frontend's other website address
//   maxAge -> how long it lives in milliseconds (1000 ms * 60 s * 60 min * 48 h = 2 days)
const cookieOptions = {httpOnly:true , secure:true , sameSite:"None" , maxAge:1000 * 60 * 60 * 48};


//$ function to log in (admin by email, students and CRs by college roll number)
export const login = async(req , res) =>{
    try{
        const {identifier , password , role} = req.body;

        if(!identifier || !password){
            return res.status(400).send({success:false , message:"Please Enter Your Login Details."});
        }

        // find the account
        let user = null;
        if(role === "admin"){
            user = await User.findOne({role:"admin" , email:identifier.trim().toLowerCase()});
            if(!user){
                return res.status(400).send({success:false , message:"No Admin Account Uses This Email."});
            }
        }
        else{
            user = await User.findOne({role:"student" , rollNo:identifier.trim().toUpperCase()});
            if(!user){
                return res.status(400).send({success:false , message:"No Student Is Registered With This Roll Number."});
            }
        }

        // check the password: bcrypt.compare scrambles the typed password the same way and compares it with the saved hash
        const correct = await bcrypt.compare(password , user.password);
        if(!correct){
            return res.status(400).send({success:false , message:"Incorrect Password."});
        }

        // the CR panel is only for confirmed CRs
        if(role === "cr" && user.crStatus === "pending"){
            return res.status(400).send({success:false , message:"Confirm Your CR Appointment First. Log In As A Student And Open Your Notifications."});
        }
        if(role === "cr" && user.crStatus !== "active"){
            return res.status(400).send({success:false , message:"You Are Not A Class Representative. Please Use The Student Login."});
        }

        // save the login token in a cookie
        const token = generateToken(user);
        res.cookie("userToken" , token , cookieOptions);

        const section = await Section.findById(user.sectionId);
        // "Priya Negi" -> split at spaces -> ["Priya" , "Negi"] -> take the first word
        const firstName = user.name.split(" ")[0];
        res.status(200).send({success:true , message:"Welcome, " + firstName , data:publicUser(user , section)});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to log out
export const logout = async(req , res) =>{
    try{
        res.clearCookie("userToken" , {httpOnly:true , secure:true , sameSite:"None"});
        res.status(200).send({success:true , message:"Logged Out Successfully"});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to get the logged in user's fresh profile
export const getme = async(req , res) =>{
    try{
        const user = req.user;
        const section = await Section.findById(user.sectionId);
        const me = publicUser(user , section);

        // students also see their section's CRs and size
        if(user.sectionId){
            // $in = crStatus is any one of the values in the list ("active" OR "pending")
            const crs = await User.find({sectionId:user.sectionId , crStatus:{$in:["active" , "pending"]}});
            me.sectionCrs = crs.map((cr) =>{
                return {_id:cr._id , name:cr.name , rollNo:cr.rollNo , crStatus:cr.crStatus};
            });
            me.sectionSize = await User.countDocuments({role:"student" , sectionId:user.sectionId});
        }

        res.status(200).send({success:true , data:me});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to change my password (new students must do this before using Acadex)
export const changepassword = async(req , res) =>{
    try{
        const user = req.user;
        const {oldPassword , newPassword} = req.body;

        // typeof ... !== "string" -> a number or a list sent by mistake is not a password
        if(!oldPassword || !newPassword || typeof oldPassword !== "string" || typeof newPassword !== "string"){
            return res.status(400).send({success:false , message:"Please Enter Your Current And New Password."});
        }

        const correct = await bcrypt.compare(oldPassword , user.password);
        if(!correct){
            return res.status(400).send({success:false , message:"Your Current Password Is Incorrect."});
        }
        if(oldPassword === newPassword){
            return res.status(400).send({success:false , message:"The New Password Must Be Different From The Current One."});
        }
        // checked by our C++ program (connect_pbl/cpp/validation.cpp , form "password")
        const defaultPassword = process.env.DEFAULT_STUDENT_PASSWORD || "Acadex@123";
        const problem = await checkPassword(newPassword , defaultPassword);
        if(problem){
            return res.status(400).send({success:false , message:problem});
        }

        // save only the scrambled (hashed) password, never the real text
        user.password = await bcrypt.hash(newPassword , 10);
        user.mustChangePassword = false;
        await user.save();

        const section = await Section.findById(user.sectionId);
        res.status(200).send({success:true , message:"Password Changed Successfully" , data:publicUser(user , section)});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function for a student to confirm / reject the CR appointment the admin sent
export const respondcr = async(req , res) =>{
    try{
        const user = req.user;
        const {accept} = req.body;

        // accept must be exactly true or false (a form posted by another website sends nothing ,
        // and nothing must NOT count as "Not me")
        if(accept !== true && accept !== false){
            return res.status(400).send({success:false , message:"Please Choose Confirm Or Not Me."});
        }

        if(user.crStatus !== "pending"){
            return res.status(400).send({success:false , message:"You Have No Pending CR Request."});
        }

        const section = await Section.findById(user.sectionId);
        const info = sectionInfo(section);

        // the request is answered -> hide the Confirm / Not me buttons
        // ("action.kind" looks inside the action object of each notification)
        await Notification.updateMany({userId:user._id , "action.kind":"cr-confirm"} , {action:null});

        const admins = await User.find({role:"admin"});

        if(accept){
            user.crStatus = "active";
            await user.save();

            // everyone in my section except me ($ne = "not equal")
            const classmates = await User.find({role:"student" , sectionId:user.sectionId , _id:{$ne:user._id}});
            const classmateIds = classmates.map((classmate) => classmate._id);
            const newCrText = `${user.name} is now a Class Representative of ${info.name}.`;
            await notifyMany(classmateIds , "cr" , "New Class Representative" , newCrText);
            const confirmedText = `Your appointment as Class Representative of ${info.name} is confirmed. The CR portal is now available.`;
            await notify(user._id , "cr" , "You are now a CR" , confirmedText);

            // tell every admin
            const adminText = `${user.name} confirmed the Class Representative appointment for ${info.label}.`;
            for(const admin of admins){
                await notify(admin._id , "cr" , "CR appointment confirmed" , adminText);
            }
            await logActivity("cr" , `${user.name} confirmed CR appointment for ${info.label}`);
        }
        else{
            user.crStatus = "none";
            await user.save();

            // tell every admin
            const adminText = `${user.name} (${user.rollNo}) responded "Not me" to the CR request for ${info.label}. The position is open again.`;
            for(const admin of admins){
                await notify(admin._id , "cr" , "CR appointment rejected" , adminText);
            }
            await logActivity("cr" , `${user.name} rejected CR request for ${info.label}`);
        }

        let message = "CR Request Declined";
        if(accept){
            message = "CR Appointment Confirmed";
        }
        res.status(200).send({success:true , message , data:publicUser(user , section)});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}
