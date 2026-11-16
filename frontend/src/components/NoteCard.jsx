import { useState } from "react";
import toast from "react-hot-toast";
import { LuDownload, LuEye, LuThumbsUp } from "react-icons/lu";
import { PiSealCheckFill } from "react-icons/pi";
import { useReactnoteMutation } from "../store/Api/Api";
import { NoteThumb } from "./NoteThumb";
import { handleNoteDownload } from "../utils/noteActions";
import { formatDate } from "../utils/format";
import { subjectColor } from "../utils/subjects";

export const NoteCard = ({note , onView , mySection}) =>{
    const [reactnote] = useReactnoteMutation();
    const [busy , setBusy] = useState(false);
    const color = subjectColor(note.subject);
    const liked = note.myReaction === "like";

    const handleLike = async () =>{
        try{
            setBusy(true);
            await reactnote({noteId:note._id , type:"like"}).unwrap();
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Save Your Like");
        }
        finally{
            setBusy(false);
        }
    }

    let likeClass = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm tabular-nums border border-transparent text-muted hover:bg-canvas hover:text-ink";
    if(liked){
        likeClass = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm tabular-nums border bg-primary-soft border-primary/30 text-primary";
    }

    let sectionClass = "";
    let yoursText = "";
    if(note.sectionName === mySection){
        sectionClass = "text-primary font-medium";
        yoursText = " (yours)";
    }

    let pageWord = "pages";
    if(note.pages === 1) pageWord = "page";

    return (
        <article className="group bg-white border border-line rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-4 hover:border-primary/25 hover:shadow-[0_12px_28px_-20px_rgba(28,43,58,0.45)]">
            <NoteThumb note={note} className="w-20 h-[104px]" onClick={() => onView(note)}/>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {note.subjectCode && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide" style={{background:color.bg , color:color.fg}}>{note.subjectCode}</span>
                    )}
                    <span className="text-sm text-muted">{note.subject}</span>
                </div>

                <button onClick={() => onView(note)} className="text-left text-[1.05rem] font-semibold leading-snug hover:text-primary">
                    {note.title}
                </button>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas border border-line text-ink/80 text-xs font-medium">
                        Topic: {note.topic}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        by <span className="text-ink/85 font-medium">{note.uploaderName}</span>
                        {note.uploaderRole === "CR" && <PiSealCheckFill className="w-3.5 h-3.5 text-seal" title="Class Representative"/>}
                    </span>
                    {note.sectionName && (
                        <span className={sectionClass}>
                            Section {note.sectionName}{yoursText}
                        </span>
                    )}
                    <span>{formatDate(note.createdAt)}</span>
                    <span>{note.pages} {pageWord}</span>
                </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <button onClick={handleLike} disabled={busy} aria-pressed={liked} aria-label={`Like, ${note.likeCount} likes`}
                    className={likeClass}>
                    <LuThumbsUp className="w-4 h-4"/> {note.likeCount}
                </button>
                <div className="flex gap-2">
                    <button onClick={() => onView(note)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm font-medium hover:border-primary/40 hover:text-primary">
                        <LuEye className="w-4 h-4"/> View
                    </button>
                    <button onClick={() => handleNoteDownload(note)} aria-label={`Download ${note.title}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium">
                        <LuDownload className="w-4 h-4"/> <span className="hidden md:inline">Download</span>
                    </button>
                </div>
            </div>
        </article>
    )
}
