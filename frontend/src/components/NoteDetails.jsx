import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { LuChevronLeft, LuChevronRight, LuDownload, LuImageOff, LuThumbsDown, LuThumbsUp, LuZoomIn, LuZoomOut } from "react-icons/lu";
import { PiSealCheckFill } from "react-icons/pi";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "../utils/format";
import { thumbnailUrl } from "../utils/notePages";
import { handleNoteDownload } from "../utils/noteActions";

// full-screen page viewer + note details (used by students, CRs and the uploader)
export const NoteDetails = ({note , onClose}) =>{
    const [index , setIndex] = useState(0);        // which page is shown (0 = the first page)
    const [zoom , setZoom] = useState(false);      // true = the page is shown bigger than the screen

    let pages = [];
    if(note.files){
        pages = note.files;
    }
    const count = pages.length;
    const page = pages[index];

    //$ function to go to the next (+1) or previous (-1) page
    const goTo = (step) =>{
        const next = index + step;
        if(next >= 0 && next < count) setIndex(next);
    }

    //$ function to zoom in or out
    const handleZoom = () => setZoom(!zoom);

    //$ function to jump to a page from the small pictures (and leave zoom)
    const handlePickPage = (pageIndex) =>{
        setIndex(pageIndex);
        setZoom(false);
    }

    // keyboard: Esc closes, arrow keys turn pages ; the page behind does not scroll
    // runs when the viewer opens (and again if the page count or onClose changes)
    useEffect(() =>{
        const onKey = (event) =>{
            if(event.key === "Escape") onClose();
            // setIndex with a function gets the current page number, so we never use an old value
            // Math.min / Math.max keep the number between the first and the last page
            if(event.key === "ArrowRight") setIndex((current) => Math.min(count - 1 , current + 1));
            if(event.key === "ArrowLeft") setIndex((current) => Math.max(0 , current - 1));
        };
        document.addEventListener("keydown" , onKey);
        document.body.style.overflow = "hidden";

        // cleanup: runs when the viewer closes -> stop listening to keys and let the page scroll again
        return () =>{
            document.removeEventListener("keydown" , onKey);
            document.body.style.overflow = "";
        };
    },[count , onClose]);

    // the details shown on the right: {label , value}
    let subjectText = note.subject;
    if(note.subjectCode) subjectText = `${note.subject} (${note.subjectCode})`;
    let uploaderText = note.uploaderName;
    if(note.uploaderRole === "CR") uploaderText = `${note.uploaderName}, CR`;
    let pagesText = String(count);
    if(note.fileSize) pagesText = `${count}, ${note.fileSize}`;

    const details = [
        {label:"Subject" , value:subjectText},
        {label:"Topic" , value:note.topic},
        {label:"Uploaded by" , value:uploaderText},
        {label:"Section" , value:note.sectionName},
        {label:"Uploaded on" , value:formatDate(note.createdAt)},
        {label:"Pages" , value:pagesText}
    ];
    if(note.reviewedBy) details.push({label:"Reviewed by" , value:note.reviewedBy});

    // only the details that have a value are shown
    const filledDetails = details.filter((detail) => detail.value);

    // zoomed in: the page is wide and the area scrolls; zoomed out: the whole page fits in the area
    let zoomLabel = "Zoom in";
    let zoomIcon = <LuZoomIn className="w-4 h-4"/>;
    let areaClass = "relative flex-1 min-h-0 overflow-hidden flex items-center justify-center px-3 pb-3";
    let imageClass = "max-h-full max-w-full object-contain cursor-zoom-in rounded shadow-lg bg-white";
    if(zoom){
        zoomLabel = "Fit page";
        zoomIcon = <LuZoomOut className="w-4 h-4"/>;
        areaClass = "relative flex-1 min-h-0 overflow-auto px-3 pb-3";
        imageClass = "max-w-none w-[160%] cursor-zoom-out mx-auto rounded shadow-lg bg-white";
    }

    // the big picture of the current page, or a message when the page is missing
    let pageView = (
        <div className="m-auto text-center text-white/80 px-6">
            <LuImageOff className="w-10 h-10 mx-auto mb-3"/>
            <p className="font-medium">This page could not be found</p>
        </div>
    );
    if(page && page.url){
        pageView = (
            <img src={page.url} alt={`${note.title}, page ${index + 1}`}
                onClick={handleZoom}
                className={imageClass}/>
        );
    }

    // the description, or a grey message when there is none
    let description = <p className="text-sm text-muted mt-2">No description was added.</p>;
    if(note.description){
        description = <p className="text-sm leading-relaxed text-ink/80 mt-2">{note.description}</p>;
    }

    let downloadText = "Download";
    if(count > 1){
        downloadText = `Download all ${count}`;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={note.title}>
            <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose}/>

            <div className="relative w-full max-w-6xl bg-white sm:rounded-2xl overflow-hidden flex flex-col lg:flex-row shadow-2xl">

                {/* viewer */}
                <div className="relative flex-1 min-h-[55vh] lg:min-h-0 bg-[#1b2633] flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2.5 text-white/90 text-sm">
                        <span className="tabular-nums">Page {index + 1} of {count}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={handleZoom} aria-label={zoomLabel} className="p-2 rounded-md hover:bg-white/10">
                                {zoomIcon}
                            </button>
                            <button onClick={() => handleNoteDownload(note , index)} aria-label="Download this page" className="p-2 rounded-md hover:bg-white/10">
                                <LuDownload className="w-4 h-4"/>
                            </button>
                            <button onClick={onClose} aria-label="Close" className="lg:hidden p-2 rounded-md hover:bg-white/10"><IoClose className="w-5 h-5"/></button>
                        </div>
                    </div>

                    <div className={areaClass}>
                        {pageView}

                        {count > 1 && !zoom && (
                            <>
                                <button onClick={() => goTo(-1)} disabled={index === 0} aria-label="Previous page"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-ink shadow flex items-center justify-center disabled:opacity-0"><LuChevronLeft className="w-5 h-5"/></button>
                                <button onClick={() => goTo(1)} disabled={index === count - 1} aria-label="Next page"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-ink shadow flex items-center justify-center disabled:opacity-0"><LuChevronRight className="w-5 h-5"/></button>
                            </>
                        )}
                    </div>

                    {/* small pictures of every page */}
                    {count > 1 && (
                        <ol className="flex gap-2 px-3 pb-3 overflow-x-auto thin-scroll">
                            {pages.map((pageFile , i) =>{
                                // the current page has a white border, the others are faded
                                let thumbClass = "w-12 h-16 rounded overflow-hidden border-2 bg-white/10 border-transparent opacity-60 hover:opacity-100";
                                if(i === index){
                                    thumbClass = "w-12 h-16 rounded overflow-hidden border-2 bg-white/10 border-white";
                                }
                                return (
                                    <li key={i} className="shrink-0">
                                        <button onClick={() => handlePickPage(i)} aria-label={`Page ${i + 1}`} aria-current={i === index}
                                            className={thumbClass}>
                                            <img src={thumbnailUrl(pageFile.url)} alt="" className="w-full h-full object-cover"/>
                                        </button>
                                    </li>
                                )
                            })}
                        </ol>
                    )}
                </div>

                {/* details */}
                <aside className="w-full lg:w-[340px] shrink-0 flex flex-col max-h-[45vh] lg:max-h-none overflow-y-auto">
                    <div className="flex items-start justify-between gap-3 px-5 pt-5">
                        <div className="flex flex-wrap items-center gap-2">
                            {note.subjectCode && <span className="px-2 py-0.5 rounded-md bg-primary text-white text-xs font-semibold tracking-wide">{note.subjectCode}</span>}
                            {note.status && note.status !== "approved" && <StatusBadge status={note.status}/>}
                        </div>
                        <button onClick={onClose} aria-label="Close" className="hidden lg:block p-1.5 -mr-1.5 rounded-md text-muted hover:bg-canvas hover:text-ink"><IoClose className="w-5 h-5"/></button>
                    </div>
                    <div className="px-5 pb-5">
                        <h2 className="text-xl font-semibold mt-2 leading-snug">{note.title}</h2>
                        {description}

                        <dl className="mt-5 grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                            {filledDetails.map((detail) => (
                                <div key={detail.label} className="contents">
                                    <dt className="text-muted">{detail.label}</dt>
                                    <dd className="text-ink break-words flex items-center gap-1">
                                        {detail.value}
                                        {detail.label === "Uploaded by" && note.uploaderRole === "CR" && <PiSealCheckFill className="w-3.5 h-3.5 text-seal"/>}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {note.reason && <p className="mt-4 text-sm text-bad bg-bad-soft rounded-md px-3 py-2">Reason: {note.reason}</p>}
                    </div>

                    <div className="mt-auto px-5 py-4 border-t border-line flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-sm text-muted tabular-nums">
                            <span className="inline-flex items-center gap-1"><LuThumbsUp className="w-4 h-4"/>{note.likeCount || 0}</span>
                            <span className="inline-flex items-center gap-1"><LuThumbsDown className="w-4 h-4"/>{note.dislikeCount || 0}</span>
                        </div>
                        <button onClick={() => handleNoteDownload(note)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium">
                            <LuDownload className="w-4 h-4"/> {downloadText}
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    )
}
