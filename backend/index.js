import "dotenv/config"
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connection from "./config/Database.js";
import userRouter from "./routes/UserRoute.js";
import studentRouter from "./routes/studentRoute.js";
import adminRouter from "./routes/adminRoute.js";
import notesRouter from "./routes/notesRoute.js";
import crRouter from "./routes/crRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import { syncAdmin } from "./utils/syncAdmin.js";

const app = express();
const port = process.env.PORT || 9999;

const frontendUrl = (process.env.FRONTEND_URL || "").trim().replace(/\/+$/ , "");
const allowedOrigins = [frontendUrl , "http://localhost:5173"];

app.use(cors({
    origin:(origin , callback) =>{
        if(!origin || allowedOrigins.includes(origin)){
            callback(null , true);
        }
        else{
            callback(null , false);
        }
    },
    credentials:true
}));
app.use(express.json());
app.use(cookieParser());

app.use((req , res , next) =>{
    if(!req.body) req.body = {};
    next();
})

app.use("/user" , userRouter);
app.use("/student" , studentRouter);
app.use("/admin" , adminRouter);
app.use("/notes" , notesRouter);
app.use("/cr" , crRouter);
app.use("/notification" , notificationRouter);

app.get("/" , (req , res) =>{
    res.send("api working")
})

app.use((req , res) =>{
    res.status(404).send({success:false , message:"This API Route Does Not Exist."});
})

app.use((error , req , res , next) =>{
    if(error.type === "entity.parse.failed"){
        return res.status(400).send({success:false , message:"The Request Data Is Not Valid JSON."});
    }
    console.log(error);
    res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
})

const server = async() =>{
    await connection();

    try{
        console.log(await syncAdmin());
    }
    catch(error){
        console.log("Could not update the admin account from .env:" , error.message);
    }

    app.listen(port , () =>{
        console.log("Server successfully running on the port :- " , port);
    })
}

server();
