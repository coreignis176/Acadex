import { fileSize } from "./format";

export const MAX_PAGES = 30;
export const MAX_PAGE_MB = 10;
export const MAX_TOTAL_MB = 60;

const IMAGE_TYPES = ["image/jpeg" , "image/png" , "image/webp" , "image/gif" , "image/bmp"];
const IMAGE_EXTENSIONS = ["jpg" , "jpeg" , "png" , "webp" , "gif" , "bmp"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",") + ",.jpg,.jpeg,.png,.webp,.gif,.bmp";

export const pageProblem = (file) =>{
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

export const makeNoteForm = (form , pages) =>{
    const data = new FormData();
    data.append("title" , form.title);
    data.append("subject" , form.subject);
    data.append("topic" , form.topic);
    data.append("description" , form.description || "");
    for(const page of pages){
        data.append("pages" , page);
    }
    return data;
}

export const thumbnailUrl = (url) =>{
    if(!url) return null;
    return url.replace("/upload/" , "/upload/w_300,q_auto/");
}

const downloadUrl = (url) =>{
    return url.replace("/upload/" , "/upload/fl_attachment/");
}

export const downloadPages = async(note , index = null) =>{
    const files = note.files || [];

    let chosen = files;
    if(index !== null) chosen = [files[index]];

    let count = 0;
    for(const file of chosen){
        if(!file || !file.url) continue;

        const link = document.createElement("a");
        link.href = downloadUrl(file.url);
        document.body.appendChild(link);
        link.click();
        link.remove();
        count++;

        if(chosen.length > 1){
            await new Promise((resolve) => setTimeout(resolve , 300));
        }
    }
    return count;
}
