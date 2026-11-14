import jwt from "jsonwebtoken";
import User from "../modules/User.js";

// ---------------------------------------------------------------------------
// validateUser -> must be logged in            (sets req.userId and req.user)
//                 + must have changed the default password (new students)
// isAdmin      -> must be the admin            (use after validateUser)
// isStudent    -> must be a student            (use after validateUser)
// isCr         -> must be an active CR         (use after validateUser)
//
// route example:  router.route("/getstructure").get(validateUser , isAdmin , getstructure);
// ---------------------------------------------------------------------------


//$ function to check the login cookie and find the logged in user
export const validateUser = async(req , res , next) =>{

    // cookie-parser (see index.js) puts the browser's cookies in req.cookies
    const token = req.cookies.userToken;
    if(!token){
        return res.status(401).send({success:false , message:"Please Log In To Continue."});
    }

    // jwt.verify checks the token with our secret key and gives back what we put in it ({userid})
    // jwt.verify throws an error if the token is fake or expired
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

        // still on the default password -> only "change password" and "getme" are allowed
        // "/user/getme?x=1" -> split at "?" -> take the part before it -> "/user/getme"
        const path = req.originalUrl.split("?")[0];
        const allowed = ["/user/changepassword" , "/user/getme"];
        if(user.mustChangePassword && !allowed.includes(path)){
            return res.status(403).send({success:false , message:"Please Change Your Password First." , data:{mustChangePassword:true}});
        }

        // save the user on the request, so the next functions (and the controller) can use it
        req.userId = user._id;
        req.user = user;
        next();         // go on to the next middleware / controller
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to allow only the admin
export const isAdmin = (req , res , next) =>{
    if(req.user.role !== "admin"){
        return res.status(403).send({success:false , message:"Only The Admin Can Do This."});
    }
    next();
}


//$ function to allow only students (CRs are students too)
export const isStudent = (req , res , next) =>{
    if(req.user.role !== "student"){
        return res.status(403).send({success:false , message:"Only Students Can Do This."});
    }
    next();
}


//$ function to allow only an active Class Representative
export const isCr = (req , res , next) =>{
    if(req.user.role !== "student" || req.user.crStatus !== "active"){
        return res.status(403).send({success:false , message:"Only An Active CR Can Do This."});
    }
    next();
}
