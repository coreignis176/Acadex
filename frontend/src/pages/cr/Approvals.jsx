import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LuCheck, LuClipboardCheck, LuEye, LuX } from "react-icons/lu";
import { useGetsectionnotesQuery, useReviewnoteMutation } from "../../store/Api/Api";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Modal } from "../../components/Modal";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { formatDate, timeAgo } from "../../utils/format";
import { NoteThumb } from "../../components/NoteThumb";
import { NoteDetails } from "../../components/NoteDetails";

// reason form shown before rejecting a submission
const RejectPopup = ({note , onClose , onReject}) =>{
    const [saving , setSaving] = useState(false); // true while the rejection is being saved
    // errors holds the validation message of each field that failed
    const {register , handleSubmit , formState:{errors}} = useForm();

    //$ function to send the typed reason to the Approvals page
    const submit = async (form) =>{
        setSaving(true);
        await onReject(form.reason);
        setSaving(false);
    };

    return (
        <Modal title="Reject submission" description={`${note.uploaderName} will see this reason with "${note.title}".`} onClose={onClose} width="max-w-md">
            <form onSubmit={handleSubmit(submit)} noValidate>
                <label htmlFor="reason" className="block text-sm font-medium mb-1">Reason</label>
                {/* {...register(...)} connects the textarea to the form and gives it its rules */}
                <textarea id="reason" rows={4} placeholder="e.g. The scan is unreadable on pages 3 to 5. Please upload a clearer copy."
                    className="w-full px-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-primary"
                    {...register("reason" , {required:"Tell the student what to fix" , minLength:{value:10 , message:"Add a little more detail"} , maxLength:{value:300 , message:"Keep it under 300 characters"}})}/>
                {errors.reason && <p className="text-bad text-xs mt-1">{errors.reason.message}</p>}
                <div className="flex justify-end gap-2 mt-5">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-line text-sm font-medium hover:bg-canvas">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-bad hover:bg-bad/90 text-white text-sm font-medium disabled:opacity-60">
                        {saving ? "Rejecting..." : "Reject submission"}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

// one submitted note in the list, with Approve / Reject buttons (or the review result)
// STRICT QUEUE: only the note at the FRONT of the line (#1) gets the buttons.
// the line's order and each note's  queuePosition  come from the backend (our C queue).
const SubmissionCard = ({note , tab , approving , onView , onReject , onApprove}) =>{
    const pageWord = note.pages === 1 ? "page" : "pages";
    const decisionWord = note.status === "approved" ? "Approved" : "Rejected";
    const approveText = approving ? "Approving..." : "Approve";

    // is this note at the front of the line?
    let isFront = false;
    if(note.queuePosition === 1){
        isFront = true;
    }

    // the front note gets a coloured border, so the CR sees at once which one is next
    let cardClass = "bg-white border border-line rounded-xl p-5";
    if(tab === "pending" && isFront){
        cardClass = "bg-white border-2 border-primary rounded-xl p-5";
    }

    // the small label next to the title, e.g. "#3 in line" or "#1 Next to review"
    let lineLabel = "";
    if(note.queuePosition){
        lineLabel = "#" + note.queuePosition + " in line";
        if(isFront){
            lineLabel = "#1 Next to review";
        }
    }

    return (
        <li className={cardClass}>
            <div className="flex flex-col md:flex-row md:items-start gap-4">
                <NoteThumb note={note} className="w-16 h-[84px]" onClick={() => onView(note)}/>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {tab === "pending" && lineLabel && <StatusBadge status={isFront ? "member" : "pending"} label={lineLabel}/>}
                        <h3 className="font-sans font-semibold text-[1.05rem]">{note.title}</h3>
                        {tab === "reviewed" && <StatusBadge status={note.status}/>}
                    </div>
                    <p className="text-sm text-muted mt-0.5">
                        {note.subject}. Submitted by <span className="text-ink">{note.uploaderName}</span> {timeAgo(note.createdAt)}.
                    </p>
                    {note.description && <p className="text-sm text-ink/85 mt-2 leading-relaxed max-w-2xl">{note.description}</p>}
                    <button onClick={() => onView(note)}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                        <LuEye className="w-4 h-4"/> View {note.pages} {pageWord}
                    </button>
                    {tab === "reviewed" && (
                        <p className="text-sm text-muted mt-2">
                            {decisionWord} by {note.reviewedBy} on {formatDate(note.reviewedAt)}.
                            {note.reason && <span className="block text-bad mt-1">Reason: {note.reason}</span>}
                        </p>
                    )}
                </div>
                {/* not at the front -> no buttons, it waits for its turn */}
                {tab === "pending" && !isFront && (
                    <p className="text-sm text-muted shrink-0 md:max-w-[180px] md:text-right">
                        Waiting for its turn. Review #1 first.
                    </p>
                )}
                {tab === "pending" && isFront && (
                    <div className="flex gap-2 shrink-0">
                        <button onClick={() => onReject(note)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line text-sm font-medium hover:border-bad/40 hover:text-bad">
                            <LuX className="w-4 h-4"/> Reject
                        </button>
                        <button onClick={() => onApprove(note)} disabled={approving}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-ok hover:bg-ok/90 text-white text-sm font-medium disabled:opacity-60">
                            <LuCheck className="w-4 h-4"/> {approveText}
                        </button>
                    </div>
                )}
            </div>
        </li>
    )
}

// Approvals: the CR reviews (approves or rejects) notes that students of the section submitted
export const Approvals = () =>{
    const user = useSelector((state) => state.user.user);
    const [tab , setTab] = useState("pending"); // which tab is open: "pending" or "reviewed"
    const [notes , setNotes] = useState([]); // the section's notes that need (or had) a review
    const [rejecting , setRejecting] = useState(null); // the note being rejected (null = popup closed)
    const [approvingId , setApprovingId] = useState(null); // id of the note being approved right now
    const [viewing , setViewing] = useState(null); // the note opened in the details popup (null = closed)
    const {data , isLoading} = useGetsectionnotesQuery();
    const [reviewnote] = useReviewnoteMutation();

    // runs whenever new data arrives from the server and copies the notes into state
    useEffect(() =>{
        if(data && data.success && data.data){
            // only student submissions need a review; CR uploads are published directly
            setNotes(data.data.filter((note) => note.uploaderRole !== "CR" || note.status !== "approved"));
        }
    },[data]);

    //$ function to approve a submission
    const handleApprove = async (note) =>{
        try{
            setApprovingId(note._id);
            const result = await reviewnote({noteId:note._id , decision:"approved"}).unwrap();
            if(result?.success) toast.success(result.message);
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Approve The Notes");
        }
        finally{
            setApprovingId(null);
        }
    }

    //$ function to reject a submission with a reason
    const handleReject = async (reason) =>{
        try{
            const result = await reviewnote({noteId:rejecting._id , decision:"rejected" , reason}).unwrap();
            if(result?.success) toast.success(result.message);
            setRejecting(null);
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Reject The Notes");
        }
    }

    if(isLoading) return <Loader/>;

    // notes waiting for review, in the order of the LINE (front first).
    // we do NOT sort them here: the backend already gives them in the line's order,
    // made by our C queue (connect_pbl/c/notes_queue.c , job "line")
    const pending = notes.filter((note) => note.status === "pending");

    // the note at the front of the line (the only one that can be reviewed now)
    let frontNote = null;
    if(pending.length > 0){
        frontNote = pending[0];
    }
    // notes that a CR already approved or rejected
    const reviewed = notes.filter((note) => note.status !== "pending" && note.reviewedBy);

    let section = {};
    if(user && user.section) section = user.section;

    const list = tab === "pending" ? pending : reviewed;

    // the two tabs at the top, each with how many notes it holds
    const tabs = [
        {key:"pending" , label:"Waiting for review" , count:pending.length},
        {key:"reviewed" , label:"Reviewed" , count:reviewed.length}
    ];

    // message shown when the open tab has no notes
    let emptyMessage = "Nothing reviewed yet";
    let emptyDescription = "Approved and rejected submissions will be listed here.";
    if(tab === "pending"){
        emptyMessage = "No submissions waiting";
        emptyDescription = "When a student submits notes, they appear here and you get a notification.";
    }

    // the list area: an empty message or the list of notes
    let content;
    if(list.length === 0){
        content = (
            <div className="bg-white border border-line rounded-xl">
                <NoData icon={<LuClipboardCheck/>}
                    message={emptyMessage}
                    description={emptyDescription}/>
            </div>
        );
    }
    else{
        content = (
            <ul className="flex flex-col gap-3">
                {list.map((note) => (
                    <SubmissionCard key={note._id} note={note} tab={tab} approving={approvingId === note._id}
                        onView={setViewing} onReject={setRejecting} onApprove={handleApprove}/>
                ))}
            </ul>
        );
    }

    return (
        <div>
            <PageHeader
                path={[{label:section.course} , {label:section.yearLabel} , {label:section.name , to:"/cr"} , {label:"Approvals"}]}
                title="Notes approval"
                description="Students submit notes here before they are shared. Approved notes are published to the whole section; rejected notes stay private to the student."
            />

            <div className="flex gap-6 border-b border-line mb-5" role="tablist">
                {tabs.map((item) =>{
                    // the open tab is underlined in the primary colour
                    let tabColors = "border-transparent text-muted hover:text-ink";
                    if(tab === item.key) tabColors = "border-primary text-primary font-medium";
                    const tabClass = `pb-3 -mb-px border-b-2 text-sm ${tabColors}`;
                    return (
                        <button key={item.key} role="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)}
                            className={tabClass}>
                            {item.label} <span className="ml-1 tabular-nums">{item.count}</span>
                        </button>
                    )
                })}
            </div>

            {/* the queue rule + "Review next" (opens the pages of the note at the front) */}
            {tab === "pending" && frontNote && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-primary-soft rounded-xl px-4 py-3 mb-4">
                    <p className="text-sm text-ink flex-1">
                        First come, first served: notes are reviewed in the order they were sent.
                        Only the note at the front of the line (#1) can be approved or rejected.
                    </p>
                    <button onClick={() => setViewing(frontNote)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium shrink-0">
                        <LuEye className="w-4 h-4"/> Review next
                    </button>
                </div>
            )}

            {content}

            {viewing && <NoteDetails note={viewing} onClose={() => setViewing(null)}/>}
            {rejecting && <RejectPopup note={rejecting} onClose={() => setRejecting(null)} onReject={handleReject}/>}
        </div>
    )
}
