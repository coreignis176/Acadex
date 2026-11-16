import { useEffect, useMemo, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuCamera, LuImagePlus, LuX } from "react-icons/lu";
import { IMAGE_ACCEPT, MAX_PAGE_MB, MAX_PAGES, MAX_TOTAL_MB, pageProblem } from "../utils/notePages";
import { fileSize } from "../utils/format";

export const PagePicker = ({pages , onChange , disabled , error}) =>{
    const [rejected , setRejected] = useState([]);

    const previews = useMemo(() => pages.map((file) => URL.createObjectURL(file)) , [pages]);

    useEffect(() =>{
        return () =>{
            for(const url of previews){
                URL.revokeObjectURL(url);
            }
        };
    },[previews]);

    const add = (fileList) =>{
        const problems = [];
        const goodFiles = [];
        if(fileList){
            for(const file of fileList){
                const problem = pageProblem(file);
                if(problem){
                    problems.push(problem);
                }
                else{
                    goodFiles.push(file);
                }
            }
        }

        const room = MAX_PAGES - pages.length;
        if(goodFiles.length > room){
            const leftOut = goodFiles.length - room;
            let leftOutText = `${leftOut} photos were`;
            if(leftOut === 1) leftOutText = `${leftOut} photo was`;
            problems.push(`Only ${MAX_PAGES} pages fit in one note, so ${leftOutText} left out.`);
        }
        setRejected(problems);

        if(goodFiles.length && room > 0){
            const filesThatFit = goodFiles.slice(0 , room);
            onChange(pages.concat(filesThatFit));
        }
    }

    const move = (i , direction) =>{
        const next = pages.slice();
        const otherIndex = i + direction;
        if(otherIndex < 0 || otherIndex >= next.length) return;
        const temp = next[i];
        next[i] = next[otherIndex];
        next[otherIndex] = temp;
        onChange(next);
    }

    const remove = (i) => onChange(pages.filter((page , pageIndex) => pageIndex !== i));

    let total = 0;
    for(const file of pages){
        total = total + file.size;
    }

    const handleDragOver = (event) => event.preventDefault();

    const handleDrop = (event) =>{
        event.preventDefault();
        if(!disabled) add(event.dataTransfer.files);
    }

    const handlePick = (event) =>{
        add(event.target.files);
        event.target.value = "";
    }

    let pageWord = "pages";
    if(pages.length === 1) pageWord = "page";

    const canAddMore = !disabled && pages.length < MAX_PAGES;

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
