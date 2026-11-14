import toast from "react-hot-toast";
import { downloadPages } from "./notePages";

//$ function to download the pages of a note and show a message
// index = one page number, or null for every page
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
    catch{          // we don't need the error details, so no (error) after catch
        toast.error("Download failed. Please try again.");
    }
}
