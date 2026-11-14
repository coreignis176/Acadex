// ---------------------------------------------------------------------------
// Notes on Acadex are photos of notebook pages (images only).
// The backend stores every page on Cloudinary, so each note has:
//     note.files = [{url , publicId , name , type , size} , ...]   (one per page)
// This file checks the pages a student picks, and builds image links.
// ---------------------------------------------------------------------------

import { fileSize } from "./format";

export const MAX_PAGES = 30;
export const MAX_PAGE_MB = 10;
export const MAX_TOTAL_MB = 60;

// the image types the file picker accepts
const IMAGE_TYPES = ["image/jpeg" , "image/png" , "image/webp" , "image/gif" , "image/bmp"];
const IMAGE_EXTENSIONS = ["jpg" , "jpeg" , "png" , "webp" , "gif" , "bmp"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",") + ",.jpg,.jpeg,.png,.webp,.gif,.bmp";


//$ function to check one picked page, returns the problem or null
export const pageProblem = (file) =>{
    // the extension is the text after the last dot: "page1.JPG" -> "jpg"
    const nameParts = file.name.split(".");
    const extension = nameParts[nameParts.length - 1].toLowerCase();
    const isImage = IMAGE_TYPES.includes(file.type) || IMAGE_EXTENSIONS.includes(extension);

    if(!isImage){
        if(extension === "heic" || extension === "heif"){
            return `${file.name}: HEIC photos aren't supported. Set your camera to "Most compatible" (JPG) or share the photo as JPG.`;
        }
        return `${file.name} is not an image. Notes must be JPG, PNG, WebP, GIF or BMP photos.`;
    }
    if(file.size === 0){
        return `${file.name} is empty.`;
    }
    if(file.size > MAX_PAGE_MB * 1024 * 1024){
        return `${file.name} is ${fileSize(file.size)}. Each page can be at most ${MAX_PAGE_MB} MB.`;
    }
    return null;
}


//$ function to check all the picked pages together, returns the problem or null
export const pagesProblem = (files) =>{
    if(files.length === 0) return "Add at least one page photo.";
    if(files.length > MAX_PAGES) return `A note can have at most ${MAX_PAGES} pages.`;

    let total = 0;
    for(const file of files){
        total = total + file.size;
    }
    if(total > MAX_TOTAL_MB * 1024 * 1024){
        return `All pages together are ${fileSize(total)}. The limit is ${MAX_TOTAL_MB} MB.`;
    }
    return null;
}


//$ function to pack a note's details and its page images into FormData
// (files can't be sent as JSON, so the form is sent like an HTML form with files)
export const makeNoteForm = (form , pages) =>{
    const data = new FormData();
    data.append("title" , form.title);
    data.append("subject" , form.subject);
    data.append("topic" , form.topic);
    data.append("description" , form.description || "");
    for(const page of pages){
        data.append("pages" , page);          // the backend reads every file sent as "pages"
    }
    return data;
}


//$ function to get a small, fast version of a page for thumbnails
// Cloudinary can resize an image if we add settings after "/upload/" in its link:
//   w_300  = 300 pixels wide ,  q_auto = smaller file with the same look
export const thumbnailUrl = (url) =>{
    if(!url) return null;
    return url.replace("/upload/" , "/upload/w_300,q_auto/");
}


//$ function to get a link that DOWNLOADS the page instead of opening it
// "fl_attachment" tells Cloudinary to send the image as a download
const downloadUrl = (url) =>{
    return url.replace("/upload/" , "/upload/fl_attachment/");
}


//$ function to download one page (index) or every page of a note; returns how many were started
export const downloadPages = async(note , index = null) =>{
    const files = note.files || [];

    // which pages to download
    let chosen = files;
    if(index !== null) chosen = [files[index]];

    let count = 0;
    for(const file of chosen){
        if(!file || !file.url) continue;

        // clicking a hidden link starts the download
        const link = document.createElement("a");
        link.href = downloadUrl(file.url);
        document.body.appendChild(link);
        link.click();
        link.remove();
        count++;

        // browsers block many downloads at the same moment, so wait a little between pages
        if(chosen.length > 1){
            // a "pause" of 300 milliseconds: the Promise finishes when the timer ends, and await waits for it
            await new Promise((resolve) => setTimeout(resolve , 300));
        }
    }
    return count;
}
