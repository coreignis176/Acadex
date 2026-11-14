import jwt from "jsonwebtoken";


//$ function to make the login token (stays valid for 2 days)
// jwt.sign packs {userid} into a signed token; only someone with JWT_SECRET can make a valid one
const generateToken = (user) =>{
    return jwt.sign({userid:user._id} , process.env.JWT_SECRET , {expiresIn:"2d"})
}


export default generateToken;
