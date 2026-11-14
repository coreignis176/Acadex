import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LuUpload } from "react-icons/lu";
import { useDeletenoteMutation, useGetsectionnotesQuery, useGetsubjectsQuery } from "../../store/Api/Api";
import { toggleNotePopup } from "../../store/slice/PortalSlice";
import { PageHeader } from "../../components/PageHeader";
import { NotesBrowser } from "../../components/NotesBrowser";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Loader } from "../../components/Loader";

// CR notes page: every approved note of the section, with upload and delete
export const CrNotes = () =>{
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const [notes , setNotes] = useState([]); // the section's published (approved) notes
    const [toDelete , setToDelete] = useState(null); // the note waiting for delete confirmation (null = popup closed)
    const [deleting , setDeleting] = useState(false); // true while the delete is running
    const notesResult = useGetsectionnotesQuery();
    const subjectsResult = useGetsubjectsQuery();
    const [deletenote] = useDeletenoteMutation();

    // runs whenever new notes arrive from the server and keeps only the approved (published) ones
    useEffect(() =>{
        const data = notesResult.data;
        if(data && data.success && data.data){
            setNotes(data.data.filter((note) => note.status === "approved"));
        }
    },[notesResult.data]);

    //$ function to delete notes from the section
    const handleDelete = async () =>{
        try{
            setDeleting(true);
            const result = await deletenote({noteId:toDelete._id}).unwrap();
            if(result?.success) toast.success(result.message);
            setToDelete(null);
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Delete The Notes");
        }
        finally{
            setDeleting(false);
        }
    }

    //$ function to open the upload notes popup
    const handleUpload = () =>{
        dispatch(toggleNotePopup());
    }

    if(notesResult.isLoading) return <Loader/>;

    let section = {};
    if(user && user.section) section = user.section;

    let myId = undefined;
    if(user) myId = user._id;

    let subjects = [];
    if(subjectsResult.data && subjectsResult.data.data) subjects = subjectsResult.data.data;

    // text for the delete popup; the uploader is mentioned only when someone else uploaded the note
    let deleteMessage = "";
    if(toDelete){
        deleteMessage = `"${toDelete.title}" will be removed for every student in ${section.name}.`;
        if(toDelete.uploadedBy !== myId) deleteMessage += ` ${toDelete.uploaderName} will be notified.`;
        deleteMessage += " This can't be undone.";
    }

    // button shown by the notes list when there are no notes yet
    const emptyAction = {buttonText:"Upload notes" , onClick:handleUpload};

    return (
        <div>
            <PageHeader
                path={[{label:section.course} , {label:section.yearLabel} , {label:section.name , to:"/cr"} , {label:"Notes"}]}
                title="Notes management"
                description={`Everything published to ${section.name}. Students see these notes subject-wise and date-wise.`}
                actions={
                    <button onClick={handleUpload} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium">
                        <LuUpload className="w-4 h-4"/> Upload notes
                    </button>
                }
            />

            <NotesBrowser notes={notes} subjects={subjects} mode="manage" onDelete={setToDelete}
                emptyAction={emptyAction}/>

            {toDelete && (
                <ConfirmDialog
                    title="Delete these notes?"
                    message={deleteMessage}
                    confirmText="Delete notes"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onClose={() => setToDelete(null)}
                />
            )}
        </div>
    )
}
