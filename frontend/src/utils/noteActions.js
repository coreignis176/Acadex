import toast from "react-hot-toast";
import { downloadPages } from "./notePages";

export const handleNoteDownload = async(note , index = null) =>{
    try{
        const count = await downloadPages(note , index);
        if(count === 0){
            toast.error("This note has no pages to download.");
        }
        else if(count === 1){
            toast.success("Downloading 1 page");
        }
        else{
            toast.success(`Downloading ${count} pages`);
        }
    }
    catch{
        toast.error("Download failed. Please try again.");
    }
}
