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

// variables
const app = express();
const port = process.env.PORT || 9999;

// only these websites may call the API (with cookies)
// the browser sends the address WITHOUT a "/" at the end, so we remove one if it was typed in .env
// ( /\/+$/ means "one or more / at the very end" )
const frontendUrl = (process.env.FRONTEND_URL || "").trim().replace(/\/+$/ , "");
const allowedOrigins = [frontendUrl , "http://localhost:5173"];

// middlewares
// cors decides which websites may call this API from the browser.
// origin = the website making the request (empty for tools like Postman)
// callback(null , true) = allow , callback(null , false) = do not allow
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
app.use(express.json());        // read JSON request bodies into req.body
app.use(cookieParser());        // read the browser's cookies into req.cookies

// a request with no body -> use an empty object, so  const {a} = req.body  never crashes
app.use((req , res , next) =>{
    if(!req.body) req.body = {};
    next();
})

// routes
app.use("/user" , userRouter);
app.use("/student" , studentRouter);
app.use("/admin" , adminRouter);
app.use("/notes" , notesRouter);
app.use("/cr" , crRouter);
app.use("/notification" , notificationRouter);

// health check
app.get("/" , (req , res) =>{
    res.send("api working")
})

// any other URL -> not found
app.use((req , res) =>{
    res.status(404).send({success:false , message:"This API Route Does Not Exist."});
})

// errors Express catches itself (for example a request with broken JSON)
// Express knows this is the error handler because the function has 4 parameters (error first)
app.use((error , req , res , next) =>{
    if(error.type === "entity.parse.failed"){
        return res.status(400).send({success:false , message:"The Request Data Is Not Valid JSON."});
    }
    console.log(error);
    res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
})

//$ function to start the server (database first, then listen)
const server = async() =>{
    await connection();

    // the admin login comes from .env (ADMIN_EMAIL / ADMIN_PASSWORD) - see utils/syncAdmin.js
    // if this fails, the server still starts (students must not be locked out because of the admin)
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
