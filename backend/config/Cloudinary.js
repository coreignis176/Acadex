import {v2 as cloudinary} from "cloudinary";
import streamifier from "streamifier";

// cloudinary configuration (keys come from .env)
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_SECRET_KEY
})


//$ function to check that all 3 Cloudinary keys are in .env
// (Boolean(...) turns the result into a plain true / false)
export const cloudinaryReady = () =>{
    return Boolean(process.env.CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY);
}


//$ function to upload one image (a Buffer from multer) and get back {secure_url , public_id}
// Cloudinary tells us the result through a callback function, not with await.
// Wrapping it in a Promise lets the caller simply write:  const result = await uploadImage(...)
//   resolve(result) -> the await gives back result
//   reject(error)   -> the await throws the error (caught by the caller's try / catch)
export const uploadImage = (buffer , folder) =>{
    return new Promise((resolve , reject) =>{
        const stream = cloudinary.uploader.upload_stream(
            {resource_type:"image" , folder},        // {folder} is short for {folder:folder}
            (error , result) =>{
                if(result){
                    resolve(result);
                }
                else{
                    reject(error);
                }
            }
        );
        // turn the image bytes into a stream and "pipe" (send) it into the Cloudinary upload
        streamifier.createReadStream(buffer).pipe(stream);
    });
}


//$ function to delete images from Cloudinary (a failed delete is only logged, never thrown)
export const deleteImages = async(publicIds) =>{
    for(const publicId of publicIds){
        try{
            await cloudinary.uploader.destroy(publicId);
        }
        catch(error){
            console.log("Could not delete image from Cloudinary:" , publicId);
            console.log(error);
        }
    }
}


export default cloudinary;
