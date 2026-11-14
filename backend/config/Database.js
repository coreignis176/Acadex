import mongoose from "mongoose";
import dns from "dns";

const url = process.env.DATABASE_URL;

// a "mongodb+srv://" address needs a special DNS lookup (SRV record).
// some networks / routers refuse it (error: querySrv ECONNREFUSED),
// so we ask Cloudflare and Google DNS instead (same fix as in PetCare)
dns.setServers(["1.1.1.1" , "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");


//$ function to connect with the MongoDB database
const connection = async() =>{

    try{
        await mongoose.connect(url)
        console.log("Successfully connected with the database...");
    }
    catch(error){
        console.log("Failed to connect with the database.")
        console.log(error);
        process.exit(1);          // no database -> no point keeping the server running
    }
}


export default connection;
