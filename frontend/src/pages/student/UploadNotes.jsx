import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LuCircleCheck, LuUpload } from "react-icons/lu";
import { useGetmysubmissionsQuery, useGetsubjectlistQuery, useSubmitnoteMutation } from "../../store/Api/Api";
import { StatusBadge } from "../../components/StatusBadge";
import { NoteThumb } from "../../components/NoteThumb";
import { NoteDetails } from "../../components/NoteDetails";
import { PagePicker } from "../../components/PagePicker";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { makeNoteForm, pagesProblem } from "../../utils/notePages";
import { timeAgo } from "../../utils/format";
import { NoSection } from "./NoSection";

// react-hook-form "validate" rules: return true when the value is fine, otherwise the error message to show
//$ function to check that the title has 4 to 80 characters
const checkTitle = (value) =>{
    const length = value.trim().length;
    if(length >= 4 && length <= 80) return true;
    return "Use 4-80 characters";
}

//$ function to check that the topic has 2 to 60 characters
const checkTopic = (value) =>{
    const length = value.trim().length;
    if(length >= 2 && length <= 60) return true;
    return "Use 2-60 characters";
}

// green message shown after a successful upload
const UploadSuccess = ({result}) =>{
    const pageWord = result.pages === 1 ? "page" : "pages";
    let statusText = "It appears in All Notes once your CR approves it. Track it on the right.";
    if(result.status === "approved") statusText = "It is now live in All Notes.";

    return (
        <div className="flex gap-3 rounded-xl bg-ok-soft text-ok px-4 py-3 text-sm">
            <LuCircleCheck className="w-5 h-5 shrink-0"/>
            <p>
                <span className="font-semibold">&ldquo;{result.title}&rdquo; uploaded with {result.pages} {pageWord}.</span>{" "}
                {statusText}
            </p>
        </div>
    )
}

// the "Your uploads" box: every note I uploaded, with its status
const MyUploads = ({loading , uploads , onOpen}) =>{
    let content;
    if(loading){
        content = <Loader/>;
    }
    else if(uploads.length === 0){
        content = <p className="px-5 py-8 text-sm text-muted text-center">Notes you upload will be listed here with their status.</p>;
    }
    else{
        content = (
            <ul className="divide-y divide-line max-h-[560px] overflow-y-auto thin-scroll">
                {uploads.map((note) =>{
                    // small grey line, e.g. "TCS302, Heaps, 4 pages"
                    let topicPart = "";
                    if(note.topic) topicPart = `, ${note.topic}`;
                    const pageWord = note.pages === 1 ? "page" : "pages";

                    // a pending note shows its place in the CR's line, e.g. "#3 in line"
                    // (queuePosition comes from the backend, found by our C queue , job "position")
                    let lineText = "";
                    if(note.status === "pending" && note.queuePosition){
                        lineText = "#" + note.queuePosition + " in line";
                        if(note.queuePosition === 1){
                            lineText = "#1 in line, next to be reviewed";
                        }
                    }

                    return (
                        <li key={note._id}>
                            <button onClick={() => onOpen(note)} className="w-full text-left flex gap-3 px-5 py-3.5 hover:bg-canvas/60">
                                <NoteThumb note={note} className="w-10 h-[52px]"/>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium truncate">{note.title}</span>
                                    <span className="block text-xs text-muted">{note.subjectCode}{topicPart}, {note.pages} {pageWord}</span>
                                    <span className="flex items-center gap-2 mt-1.5">
                                        <StatusBadge status={note.status}/>
                                        <span className="text-xs text-muted">{timeAgo(note.createdAt)}</span>
                                    </span>
                                    {lineText && <span className="block text-xs font-medium text-wait mt-1">{lineText}</span>}
                                    {note.status === "rejected" && note.reason && <span className="block text-xs text-bad mt-1">Reason: {note.reason}</span>}
                                </span>
                            </button>
                        </li>
                    )
                })}
            </ul>
        );
    }

    return (
        <aside className="bg-white border border-line rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
                <h2 className="font-sans text-base font-semibold">Your uploads</h2>
                <p className="text-xs text-muted">Pending notes wait in line. Your CR reviews them first come, first served.</p>
            </div>
            {content}
        </aside>
    )
}

// Upload Notes: a form to upload note pages, and a list of my own uploads with their status
export const UploadNotes = () =>{
    const user = useSelector((state) => state.user.user);
    const hasSection = Boolean(user && user.sectionId);
    const isCr = Boolean(user && user.crStatus === "active");
    const [pages , setPages] = useState([]); // the page photos picked for this note
    const [pagesError , setPagesError] = useState(""); // error message about the pages ("" = no error)
    const [uploading , setUploading] = useState(false); // true while the upload is running
    const [lastResult , setLastResult] = useState(null); // info about the last successful upload (null = none)
    const [openNote , setOpenNote] = useState(null); // the upload opened in the details popup (null = closed)
    const subjectsResult = useGetsubjectlistQuery(undefined , {skip:!hasSection});
    const mineResult = useGetmysubmissionsQuery(undefined , {skip:!hasSection});
    const [submitnote] = useSubmitnoteMutation();
    // errors holds the validation message of each field that failed
    const {register , handleSubmit , watch , reset , formState:{errors}} = useForm({defaultValues:{title:"" , subject:"" , topic:"" , description:""}});

    let subjects = [];
    if(subjectsResult.data && subjectsResult.data.data) subjects = subjectsResult.data.data;
    // watch() gives the current value of a form field, so the subject code and character count update while typing
    const chosen = subjects.find((subject) => subject.name === watch("subject"));
    const description = watch("description") || "";

    if(!hasSection) return <NoSection/>;

    //$ function to save the picked pages and clear old messages
    const changePages = (next) =>{
        setPages(next);
        setPagesError("");
        setLastResult(null);
    }

    //$ function to upload the note with its page images
    const handleOnSubmit = async (form) =>{
        const problem = pagesProblem(pages);
        if(problem){
            setPagesError(problem);
            return;
        }

        try{
            setLastResult(null);
            setUploading(true);
            const result = await submitnote(makeNoteForm(form , pages)).unwrap();
            toast.success(result.message);
            setLastResult({title:result.data.title , status:result.data.status , pages:pages.length});
            reset();
            setPages([]);
        }
        catch(error){
            toast.error(error?.data?.message || "Upload Failed. Please Try Again.");
        }
        finally{
            setUploading(false);
        }
    }

    // Tailwind classes shared by the form inputs
    const field = "w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:border-primary disabled:bg-canvas";

    let uploads = [];
    if(mineResult.data && mineResult.data.data) uploads = mineResult.data.data;

    // the subject code box fills itself in when a subject is chosen
    let chosenCode = "";
    if(chosen && chosen.code) chosenCode = chosen.code;

    // the character counter turns red above 300 characters
    let counterColor = "text-muted";
    if(description.length > 300) counterColor = "text-bad";
    const counterClass = `text-xs tabular-nums ${counterColor}`;

    let introText = "Your section's CR reviews them before they appear in All Notes.";
    if(isCr) introText = "As a CR, your notes are published right away.";

    const pageWord = pages.length === 1 ? "page" : "pages";

    // text on the upload button
    let buttonText = "Upload for approval";
    if(uploading) buttonText = "Uploading...";
    else if(isCr) buttonText = "Upload and publish";

    // left side: a loader, a "no subjects" message, or the upload form
    let formArea;
    if(subjectsResult.isLoading){
        formArea = <Loader/>;
    }
    else if(subjects.length === 0){
        formArea = (
            <div className="bg-white border border-line rounded-2xl">
                <NoData message="No subjects yet" description="Your section has no subjects yet. The admin adds them in Academic Structure; you can upload once they do."/>
            </div>
        );
    }
    else{
        formArea = (
            <form onSubmit={handleSubmit(handleOnSubmit)} noValidate className="bg-white border border-line rounded-2xl p-5 md:p-7 flex flex-col gap-5">

                {lastResult && <UploadSuccess result={lastResult}/>}

                <div>
                    <span className="block text-sm font-medium mb-1.5">Note pages</span>
                    <PagePicker pages={pages} onChange={changePages} disabled={uploading} error={pagesError}/>
                </div>

                {/* {...register(...)} connects the input to the form and gives it its rules */}
                <div>
                    <label htmlFor="up-title" className="block text-sm font-medium mb-1.5">Note Title</label>
                    <input id="up-title" disabled={uploading} className={field} placeholder="e.g. Heaps and Priority Queues - Unit 4"
                        {...register("title" , {required:"Enter a title" , validate:checkTitle})}/>
                    {errors.title && <p className="text-bad text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div className="grid sm:grid-cols-[1fr_160px] gap-4">
                    <div>
                        <label htmlFor="up-subject" className="block text-sm font-medium mb-1.5">Subject Name</label>
                        <select id="up-subject" disabled={uploading} className={field} {...register("subject" , {required:"Choose a subject"})}>
                            <option value="">Choose a subject</option>
                            {subjects.map((subject) => <option key={subject.name} value={subject.name}>{subject.name}</option>)}
                        </select>
                        {errors.subject && <p className="text-bad text-xs mt-1">{errors.subject.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="up-code" className="block text-sm font-medium mb-1.5">Subject Code</label>
                        <input id="up-code" readOnly value={chosenCode} placeholder="Auto-filled" tabIndex={-1}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-canvas text-sm font-semibold tracking-wide"/>
                    </div>
                </div>

                <div>
                    <label htmlFor="up-topic" className="block text-sm font-medium mb-1.5">Topic Name</label>
                    <input id="up-topic" disabled={uploading} className={field} placeholder="e.g. Heaps"
                        {...register("topic" , {required:"Enter the topic" , validate:checkTopic})}/>
                    {errors.topic && <p className="text-bad text-xs mt-1">{errors.topic.message}</p>}
                </div>

                <div>
                    <div className="flex justify-between mb-1.5">
                        <label htmlFor="up-desc" className="text-sm font-medium">Description <span className="text-muted font-normal">(optional)</span></label>
                        <span className={counterClass}>{description.length}/300</span>
                    </div>
                    <textarea id="up-desc" rows={3} disabled={uploading} className={field} placeholder="What do these pages cover?"
                        {...register("description" , {maxLength:{value:300 , message:"Keep it under 300 characters"}})}/>
                    {errors.description && <p className="text-bad text-xs mt-1">{errors.description.message}</p>}
                </div>

                {uploading && (
                    <p aria-live="polite" className="text-sm text-muted">
                        Uploading {pages.length} {pageWord}. Large photos can take a little while, please keep this page open.
                    </p>
                )}

                <button type="submit" disabled={uploading}
                    className="w-full sm:w-auto sm:self-end px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
                    <LuUpload className="w-4 h-4"/> {buttonText}
                </button>
            </form>
        );
    }

    return (
        <div className="max-w-6xl">
            <div className="mb-6">
                <h1 className="text-2xl md:text-[2rem] font-semibold">Upload Notes</h1>
                <p className="text-muted mt-1">
                    Photograph your notebook pages and share them with your year.{" "}
                    {introText}
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
                {formArea}

                {/* my uploads */}
                <MyUploads loading={mineResult.isLoading} uploads={uploads} onOpen={setOpenNote}/>
            </div>

            {openNote && <NoteDetails note={openNote} onClose={() => setOpenNote(null)}/>}
        </div>
    )
}
