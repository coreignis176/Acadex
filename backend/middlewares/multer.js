import multer from "multer";

export const MAX_PAGES = 30;
export const MAX_PAGE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 60 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg" , "image/png" , "image/webp" , "image/gif" , "image/bmp"];

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits:{fileSize:MAX_PAGE_BYTES , files:MAX_PAGES},
    fileFilter:(req , file , callback) =>{
        if(IMAGE_TYPES.includes(file.mimetype)){
            callback(null , true);
        }
        else{
            const error = new Error(`${file.originalname} Is Not An Image. Notes Must Be JPG, PNG, WebP, GIF Or BMP Images.`);
            error.code = "NOT_AN_IMAGE";
            callback(error);
        }
    }
});

export const uploadPages = (req , res , next) =>{

    const size = Number(req.headers["content-length"] || 0);
    if(size > MAX_TOTAL_BYTES + 1024 * 1024){
        return res.status(413).send({success:false , message:"All Pages Together Can Be At Most 60 MB."});
    }

    const readPages = upload.array("pages" , MAX_PAGES);

    readPages(req , res , (error) =>{
        if(!error) return next();

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
