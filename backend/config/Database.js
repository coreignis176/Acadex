import mongoose from "mongoose";
import dns from "dns";

const url = process.env.DATABASE_URL;

dns.setServers(["1.1.1.1" , "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

const connection = async() =>{

    try{
        await mongoose.connect(url)
        console.log("Successfully connected with the database...");
    }
    catch(error){
        console.log("Failed to connect with the database.")
        console.log(error);
        process.exit(1);
    }
}

export default connection;
