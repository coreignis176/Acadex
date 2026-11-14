import bcrypt from "bcryptjs";
import User from "../modules/User.js";

// ---------------------------------------------------------------------------
// The ADMIN login comes from the .env file:
//
//      ADMIN_NAME=Academic Office
//      ADMIN_EMAIL=admin@acadex.edu
//      ADMIN_PASSWORD=...
//
// Every time the server starts (index.js), this makes the admin account in the
// database match the .env file:
//      - no admin yet            -> it is created
//      - the email changed       -> the admin account gets the new email
//      - the password changed    -> the new password is saved (only its bcrypt hash)
// So: change .env , restart the server , and the new admin login works.
//
// The admin still has to be a user in the database, because notifications are sent
// to the admin and every logged in request is checked against a database user.
//
// ADMIN_EMAIL or ADMIN_PASSWORD missing -> nothing is changed (the server still starts).
// The password is NEVER printed.
// ---------------------------------------------------------------------------


//$ function to make the admin account match ADMIN_NAME , ADMIN_EMAIL and ADMIN_PASSWORD in .env
// gives back a short text saying what happened (printed by index.js / createAdmin.js)
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

    // the admin with this email , or else the FIRST admin ever made (sort by createdAt , oldest first)
    let admin = await User.findOne({role:"admin" , email});
    if(!admin){
        admin = await User.findOne({role:"admin"}).sort({createdAt:1});
    }

    // no admin at all -> make one
    if(!admin){
        // bcrypt.hash scrambles the password (10 = how much work it does); only this hash is saved
        const hash = await bcrypt.hash(password , 10);
        await User.create({role:"admin" , name , email , password:hash});
        return "Admin account created from .env: " + email;
    }

    // what is different from .env?
    const changes = [];

    if(admin.email !== email){
        changes.push("email " + admin.email + " -> " + email);
        admin.email = email;
    }
    if(admin.name !== name){
        changes.push("name");
        admin.name = name;
    }

    // bcrypt.compare checks the .env password against the saved hash (we can't read the hash back)
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
