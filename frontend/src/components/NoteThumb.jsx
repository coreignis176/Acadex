import { useState } from "react";
import { LuImageOff } from "react-icons/lu";
import { thumbnailUrl } from "../utils/notePages";

// first page of a note as a small portrait picture, with the page count
export const NoteThumb = ({note , className = "w-16 h-[84px]" , onClick}) =>{
    const [broken , setBroken] = useState(false);      // true when the picture could not be loaded

    // the small picture of the first page (if the note has pages)
    let url = null;
    if(note.files && note.files[0]){
        url = thumbnailUrl(note.files[0].url);
    }

    const pages = note.pages || 1;

    // the picture, or a "no image" icon when there is no picture or it failed to load
    let picture = <span className="w-full h-full flex items-center justify-center text-muted"><LuImageOff className="w-5 h-5"/></span>;
    if(url && !broken){
        picture = <img src={url} alt="" loading="lazy" onError={() => setBroken(true)} className="w-full h-full object-cover object-top"/>;
    }

    // the "3p" label in the corner, only for notes with more than one page
    let pageCount = null;
    if(pages > 1){
        pageCount = <span className="absolute bottom-1 right-1 px-1.5 rounded bg-ink/75 text-white text-[10px] font-semibold leading-4">{pages}p</span>;
    }

    // a button when it can be clicked
    if(onClick){
        const buttonClass = "relative shrink-0 rounded-lg overflow-hidden border border-line bg-canvas shadow-sm " + className + " hover:ring-2 hover:ring-primary/30";
        return (
            <button onClick={onClick} aria-label={`Open ${note.title}`} className={buttonClass}>
                {picture}
                {pageCount}
            </button>
        )
    }

    // otherwise a plain box
    const boxClass = "relative shrink-0 rounded-lg overflow-hidden border border-line bg-canvas shadow-sm " + className + " ";
    return (
        <div className={boxClass}>
            {picture}
            {pageCount}
        </div>
    )
}
