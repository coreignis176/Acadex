import "dotenv/config"
import mongoose from "mongoose";
import connection from "./config/Database.js";
import { syncAdmin } from "./utils/syncAdmin.js";

const createAdmin = async() =>{
    await connection();
    console.log(await syncAdmin());
    await mongoose.disconnect();
}

createAdmin();
