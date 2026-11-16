import bcrypt from "bcryptjs";
import User from "../modules/User.js";

export const syncAdmin = async() =>{
    const name = String(process.env.ADMIN_NAME || "Academic Office").trim();
    const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "";

    if(!email || !password){
        return "ADMIN_EMAIL / ADMIN_PASSWORD are not set in .env -> the admin account was not changed.";
    }
    if(!email.includes("@")){
        return "ADMIN_EMAIL in .env is not an email address -> the admin account was not changed.";
    }

    let admin = await User.findOne({role:"admin" , email});
    if(!admin){
        admin = await User.findOne({role:"admin"}).sort({createdAt:1});
    }

    if(!admin){
        const hash = await bcrypt.hash(password , 10);
        await User.create({role:"admin" , name , email , password:hash});
        return "Admin account created from .env: " + email;
    }

    const changes = [];

    if(admin.email !== email){
        changes.push("email " + admin.email + " -> " + email);
        admin.email = email;
    }
    if(admin.name !== name){
        changes.push("name");
        admin.name = name;
    }

    const samePassword = await bcrypt.compare(password , admin.password);
    if(!samePassword){
        changes.push("password");
        admin.password = await bcrypt.hash(password , 10);
    }

    if(changes.length === 0){
        return "Admin account matches .env: " + email;
    }

    await admin.save();
    return "Admin account updated from .env (" + changes.join(" , ") + ")";
}
