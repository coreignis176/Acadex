import "dotenv/config"
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connection from "./config/Database.js";
import User from "./modules/User.js";

// ---------------------------------------------------------------------------
// Acadex has no sign up page: the admin adds every student.
// So the FIRST admin account is made with this file, once:
//
//      npm run createadmin
//
// it reads ADMIN_NAME , ADMIN_EMAIL and ADMIN_PASSWORD from .env
// ---------------------------------------------------------------------------

//$ function to create the admin account (does nothing if it already exists)
const createAdmin = async() =>{
    const name = process.env.ADMIN_NAME || "Academic Office";
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if(!email || !password){
        console.log("Please set ADMIN_EMAIL and ADMIN_PASSWORD in the .env file first.");
        process.exit(1);
    }

    await connection();

    const existing = await User.findOne({role:"admin" , email});
    if(existing){
        console.log("An admin with this email already exists:" , email);
    }
    else{
        // bcrypt.hash scrambles the password (10 = how much work it does); only this hash is saved
        const hash = await bcrypt.hash(password , 10);
        // {name , email} is short for {name:name , email:email}
        await User.create({role:"admin" , name , email , password:hash});
        console.log("Admin account created:" , email);
    }

    await mongoose.disconnect();
}

createAdmin();
