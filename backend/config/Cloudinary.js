import {v2 as cloudinary} from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_SECRET_KEY
})

export const cloudinaryReady = () =>{
    return Boolean(process.env.CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY);
}

export const uploadImage = (buffer , folder) =>{
    return new Promise((resolve , reject) =>{
        const stream = cloudinary.uploader.upload_stream(
            {resource_type:"image" , folder},
            (error , result) =>{
                if(result){
                    resolve(result);
                }
                else{
                    reject(error);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
}

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
