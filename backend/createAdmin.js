import "dotenv/config"
import mongoose from "mongoose";
import connection from "./config/Database.js";
import { syncAdmin } from "./utils/syncAdmin.js";

// ---------------------------------------------------------------------------
// Acadex has no sign up page: the admin adds every student.
// The admin login comes from .env:  ADMIN_NAME , ADMIN_EMAIL , ADMIN_PASSWORD
//
// The server already does this by itself every time it starts (see utils/syncAdmin.js).
// This file only lets you do it WITHOUT starting the server:
//
//      npm run createadmin
// ---------------------------------------------------------------------------

//$ function to create / update the admin account from .env , then stop
const createAdmin = async() =>{
    await connection();
    console.log(await syncAdmin());
    await mongoose.disconnect();
}

createAdmin();
