import { useState } from "react";
import toast from "react-hot-toast";
import { LuDownload, LuThumbsDown, LuThumbsUp, LuTrash2 } from "react-icons/lu";
import { NoteThumb } from "./NoteThumb";
import { PiSealCheckFill } from "react-icons/pi";
import { useReactnoteMutation } from "../store/Api/Api";
import { formatDate } from "../utils/format";
import { handleNoteDownload } from "../utils/noteActions";
import { StatusBadge } from "./StatusBadge";

export const NoteRow = ({note , mode = "read" , onOpen , onDelete , showSubject = true}) =>{
    const [reactnote] = useReactnoteMutation();
    const [reacting , setReacting] = useState(false);

    const handleReact = async (type) =>{
        try{
            setReacting(true);
            await reactnote({noteId:note._id , type}).unwrap();
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Save Your Reaction");
        }
        finally{
            setReacting(false);
        }
    }

    const handleDownload = () => handleNoteDownload(note);

    const handleOpen = () =>{
        if(onOpen) onOpen(note);
    }

    const reactionButton = (type) =>{
        const active = note.myReaction === type;

        let Icon = LuThumbsDown;
        let count = note.dislikeCount;
        let label = "Dislike";
        let colours = "bg-bad-soft border-bad/30 text-bad";
        if(type === "like"){
            Icon = LuThumbsUp;
            count = note.likeCount;
            label = "Like";
            colours = "bg-primary-soft border-primary/30 text-primary";
        }
        if(!active){
            colours = "border-transparent text-muted hover:bg-canvas hover:text-ink";
        }
        const buttonClass = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm tabular-nums border " + colours;

        return (
            <button onClick={() => handleReact(type)} disabled={reacting} aria-pressed={active} aria-label={`${label}, ${count}`}
                className={buttonClass}>
                <Icon className="w-4 h-4"/> {count}
            </button>
        )
    }

    let pageWord = "pages";
    if(note.pages === 1) pageWord = "page";

    return (
        <article className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-canvas/50">
            <div className="flex gap-3 min-w-0 flex-1">
                <NoteThumb note={note} className="w-11 h-14" onClick={handleOpen}/>
                <div className="min-w-0">
                    <button onClick={handleOpen} className="text-left font-semibold text-ink hover:text-primary hover:underline underline-offset-4 decoration-primary/40">
                        {note.title}
                    </button>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted">
                        {showSubject && <span className="text-ink/75">{note.subject}</span>}
                        <span className="inline-flex items-center gap-1">
                            {note.uploaderName}
                            {note.uploaderRole === "CR" && <PiSealCheckFill className="w-3.5 h-3.5 text-seal" title="Class Representative"/>}
                        </span>
                        <span>{formatDate(note.createdAt)}</span>
                        <span>{note.pages} {pageWord}</span>
                    </div>
                    {mode === "submission" && note.status === "rejected" && note.reason && (
                        <p className="mt-2 text-sm text-bad bg-bad-soft rounded-md px-3 py-2">Reason: {note.reason}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 sm:justify-end pl-14 sm:pl-0">
                {mode === "read" && <>
                    {reactionButton("like")}
                    {reactionButton("dislike")}
                </>}
                {mode !== "read" && <StatusBadge status={note.status}/>}
                {mode === "manage" && note.status === "approved" && (
                    <span className="text-sm text-muted tabular-nums px-2 inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-1"><LuThumbsUp className="w-3.5 h-3.5"/>{note.likeCount}</span>
                        <span className="inline-flex items-center gap-1"><LuThumbsDown className="w-3.5 h-3.5"/>{note.dislikeCount}</span>
                    </span>
                )}
                <button onClick={handleDownload} aria-label={`Download ${note.title}`} title="Download"
                    className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:border-primary/40 hover:text-primary">
                    <LuDownload className="w-4 h-4"/> <span className="hidden md:inline">Download</span>
                </button>
                {mode === "manage" && onDelete && (
                    <button onClick={() => onDelete(note)} aria-label={`Delete ${note.title}`} title="Delete"
                        className="p-2 rounded-lg text-muted hover:text-bad hover:bg-bad-soft">
                        <LuTrash2 className="w-4 h-4"/>
                    </button>
                )}
            </div>
        </article>
    )
}
