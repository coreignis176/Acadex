import multer from "multer";

// ---------------------------------------------------------------------------
// reads the page images of a note (form field name: "pages")
// the files stay in memory (req.files[i].buffer) and are then sent to Cloudinary
// ---------------------------------------------------------------------------

export const MAX_PAGES = 30;
export const MAX_PAGE_BYTES = 10 * 1024 * 1024;      // 10 MB per page
export const MAX_TOTAL_BYTES = 60 * 1024 * 1024;     // 60 MB for all pages together

const IMAGE_TYPES = ["image/jpeg" , "image/png" , "image/webp" , "image/gif" , "image/bmp"];

// keep the uploaded files in memory (not on disk)
const storage = multer.memoryStorage();

// NOTE: {storage} is short for {storage:storage} and {success:false , message} for {success:false , message:message}

const upload = multer({
    storage,
    limits:{fileSize:MAX_PAGE_BYTES , files:MAX_PAGES},
    fileFilter:(req , file , callback) =>{
        if(IMAGE_TYPES.includes(file.mimetype)){
            callback(null , true);
        }
        else{
            // reject the whole request with a readable message
            const error = new Error(`${file.originalname} Is Not An Image. Notes Must Be JPG, PNG, WebP, GIF Or BMP Images.`);
            error.code = "NOT_AN_IMAGE";
            callback(error);
        }
    }
});


//$ function to read the "pages" images and turn multer errors into our {success , message} answer
export const uploadPages = (req , res , next) =>{

    // stop huge requests before reading them into memory
    // (content-length = the request size in bytes; 1 MB extra is allowed for the text fields)
    const size = Number(req.headers["content-length"] || 0);
    if(size > MAX_TOTAL_BYTES + 1024 * 1024){
        return res.status(413).send({success:false , message:"All Pages Together Can Be At Most 60 MB."});
    }

    // upload.array(...) makes a middleware that reads up to MAX_PAGES files from the "pages" field.
    // We call it ourselves, so we can handle its error in the function below.
    const readPages = upload.array("pages" , MAX_PAGES);

    readPages(req , res , (error) =>{
        // no error -> the images are in req.files, go on to the controller
        if(!error) return next();

        // turn multer's error code into a readable message
        let message = "The Pages Could Not Be Read. Please Try Again.";
        if(error.code === "LIMIT_FILE_SIZE"){
            message = "Each Page Can Be At Most 10 MB.";
        }
        if(error.code === "LIMIT_FILE_COUNT"){
            message = `A Note Can Have At Most ${MAX_PAGES} Pages.`;
        }
        if(error.code === "LIMIT_UNEXPECTED_FILE"){
            if(error.field === "pages"){
                message = `A Note Can Have At Most ${MAX_PAGES} Pages.`;
            }
            else{
                message = "Send The Page Images In The \"pages\" Field.";
            }
        }
        if(error.code === "NOT_AN_IMAGE"){
            message = error.message;
        }

        res.status(400).send({success:false , message});
    });
}
