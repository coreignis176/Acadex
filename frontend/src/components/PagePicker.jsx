import { useEffect, useMemo, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuCamera, LuImagePlus, LuX } from "react-icons/lu";
import { IMAGE_ACCEPT, MAX_PAGE_MB, MAX_PAGES, MAX_TOTAL_MB, pageProblem } from "../utils/notePages";
import { fileSize } from "../utils/format";

// pick page photos for a note: add (button / drop / camera), preview, reorder, remove
// pages = File[] (controlled by the parent), onChange(File[]) gives the parent the new list
// files that could not be added are listed in red under the picker
export const PagePicker = ({pages , onChange , disabled , error}) =>{
    const [rejected , setRejected] = useState([]);     // messages about files that were not added

    // a temporary preview URL for every picked photo, so <img> can show it
    // useMemo is needed here: it makes new URLs ONLY when the list of pages changes.
    // Without it, new URLs would be made on every render and the effect below would free them again and again.
    const previews = useMemo(() => pages.map((file) => URL.createObjectURL(file)) , [pages]);

    // runs whenever the previews change; the cleanup frees the OLD preview URLs from memory
    // (the cleanup runs before the next previews are used, and when the picker closes)
    useEffect(() =>{
        return () =>{
            for(const url of previews){
                URL.revokeObjectURL(url);
            }
        };
    },[previews]);

    //$ function to add picked files (invalid ones are listed, not added)
    const add = (fileList) =>{
        const problems = [];
        const goodFiles = [];
        // fileList is the list of files from the input or the drop (it can be empty)
        if(fileList){
            for(const file of fileList){
                const problem = pageProblem(file);      // a message if the file is not allowed, otherwise empty
                if(problem){
                    problems.push(problem);
                }
                else{
                    goodFiles.push(file);
                }
            }
        }

        // how many more pages fit in this note
        const room = MAX_PAGES - pages.length;
        if(goodFiles.length > room){
            const leftOut = goodFiles.length - room;
            let leftOutText = `${leftOut} photos were`;
            if(leftOut === 1) leftOutText = `${leftOut} photo was`;
            problems.push(`Only ${MAX_PAGES} pages fit in one note, so ${leftOutText} left out.`);
        }
        setRejected(problems);

        // add only as many good files as there is room for
        if(goodFiles.length && room > 0){
            const filesThatFit = goodFiles.slice(0 , room);
            onChange(pages.concat(filesThatFit));      // a new list: the old pages followed by the new ones
        }
    }

    //$ function to move a page one place earlier (direction = -1) or later (direction = 1)
    const move = (i , direction) =>{
        const next = pages.slice();      // slice() with no numbers makes a copy, so the original list is not changed
        const otherIndex = i + direction;
        if(otherIndex < 0 || otherIndex >= next.length) return;
        // swap the two pages
        const temp = next[i];
        next[i] = next[otherIndex];
        next[otherIndex] = temp;
        onChange(next);
    }

    //$ function to remove one page
    const remove = (i) => onChange(pages.filter((page , pageIndex) => pageIndex !== i));

    // total size of all pages in bytes
    let total = 0;
    for(const file of pages){
        total = total + file.size;
    }

    // dragging files over the box: preventDefault() tells the browser we accept a drop here
    const handleDragOver = (event) => event.preventDefault();

    //$ function to add files dropped on the box
    const handleDrop = (event) =>{
        event.preventDefault();      // stop the browser from opening the dropped file
        if(!disabled) add(event.dataTransfer.files);
    }

    //$ function to add files chosen with a file input
    const handlePick = (event) =>{
        add(event.target.files);
        event.target.value = "";     // empty the input so the same file can be picked again
    }

    let pageWord = "pages";
    if(pages.length === 1) pageWord = "page";

    // more photos can be added while not saving and while there is room
    const canAddMore = !disabled && pages.length < MAX_PAGES;

    // ---- no pages yet: one big "Add page photos" box ----
    // red when there is an error, faded while saving
    let colours = "border-primary/30 bg-primary-soft/40 hover:bg-primary-soft";
    if(error) colours = "border-bad/50 bg-bad-soft/30";
    let pointer = "cursor-pointer";
    if(disabled) pointer = "opacity-60";
    const dropClass = "flex flex-col items-center gap-2 px-6 py-9 rounded-xl border-2 border-dashed text-center " + colours + " " + pointer;

    let picker;
    if(pages.length === 0){
        picker = (
            <label onDragOver={handleDragOver} onDrop={handleDrop}
                className={dropClass}>
                <span className="w-12 h-12 rounded-xl bg-white text-primary flex items-center justify-center shadow-sm"><LuImagePlus className="w-6 h-6"/></span>
                <span className="text-sm"><span className="font-semibold text-primary">Add page photos</span> <span className="text-muted">or drop them here</span></span>
                <span className="text-xs text-muted">JPG, PNG, WebP, GIF or BMP. Up to {MAX_PAGES} pages, {MAX_PAGE_MB} MB each.</span>
                <input type="file" multiple accept={IMAGE_ACCEPT} disabled={disabled} className="sr-only" onChange={handlePick}/>
            </label>
        );
    }
    else{
        // ---- some pages: a grid of small previews with remove / move buttons ----
        picker = (
            <div onDragOver={handleDragOver} onDrop={handleDrop}
                className="rounded-xl border border-line p-3">
                <ol className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {pages.map((file , i) => (
                        <li key={`${file.name}-${file.size}-${i}`} className="group relative">
                            <div className="aspect-[3/4] rounded-lg overflow-hidden border border-line bg-canvas">
                                <img src={previews[i]} alt={`Page ${i + 1}: ${file.name}`} className="w-full h-full object-cover"/>
                            </div>
                            <span className="absolute top-1 left-1 px-1.5 rounded bg-ink/75 text-white text-[10px] font-semibold leading-4">{i + 1}</span>
                            {!disabled && (
                                <>
                                    <button type="button" onClick={() => remove(i)} aria-label={`Remove page ${i + 1}`}
                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/95 text-bad shadow flex items-center justify-center"><LuX className="w-3.5 h-3.5"/></button>
                                    <div className="absolute bottom-1 inset-x-1 flex justify-between">
                                        <button type="button" onClick={() => move(i , -1)} disabled={i === 0} aria-label={`Move page ${i + 1} earlier`}
                                            className="w-6 h-6 rounded-full bg-white/95 shadow flex items-center justify-center disabled:opacity-0"><LuArrowLeft className="w-3.5 h-3.5"/></button>
                                        <button type="button" onClick={() => move(i , 1)} disabled={i === pages.length - 1} aria-label={`Move page ${i + 1} later`}
                                            className="w-6 h-6 rounded-full bg-white/95 shadow flex items-center justify-center disabled:opacity-0"><LuArrowRight className="w-3.5 h-3.5"/></button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                    {canAddMore && (
                        <li>
                            <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-primary/30 bg-primary-soft/40 hover:bg-primary-soft flex flex-col items-center justify-center gap-1 text-primary cursor-pointer text-xs font-medium">
                                <LuImagePlus className="w-5 h-5"/> Add more
                                <input type="file" multiple accept={IMAGE_ACCEPT} className="sr-only" onChange={handlePick}/>
                            </label>
                        </li>
                    )}
                </ol>
                <p className="text-xs text-muted mt-3">
                    {pages.length} {pageWord}, {fileSize(total)} of {MAX_TOTAL_MB} MB. Use the arrows to put pages in order.
                </p>
            </div>
        );
    }

    return (
        <div>
            {picker}

            {/* phones: open the camera directly */}
            {canAddMore && (
                <label className="sm:hidden mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-line text-sm font-medium cursor-pointer">
                    <LuCamera className="w-4 h-4"/> Take a photo
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handlePick}/>
                </label>
            )}

            {rejected.length > 0 && (
                <ul className="mt-2 text-xs text-bad flex flex-col gap-0.5">
                    {rejected.map((message) => <li key={message}>{message}</li>)}
                </ul>
            )}
            {error && <p className="text-bad text-xs mt-1">{error}</p>}
        </div>
    )
}
