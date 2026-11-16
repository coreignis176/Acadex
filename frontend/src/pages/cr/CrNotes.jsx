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

export const CrNotes = () =>{
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const [notes , setNotes] = useState([]);
    const [toDelete , setToDelete] = useState(null);
    const [deleting , setDeleting] = useState(false);
    const notesResult = useGetsectionnotesQuery();
    const subjectsResult = useGetsubjectsQuery();
    const [deletenote] = useDeletenoteMutation();

    useEffect(() =>{
        const data = notesResult.data;
        if(data && data.success && data.data){
            setNotes(data.data.filter((note) => note.status === "approved"));
        }
    },[notesResult.data]);

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

    let deleteMessage = "";
    if(toDelete){
        deleteMessage = `"${toDelete.title}" will be removed for every student in ${section.name}.`;
        if(toDelete.uploadedBy !== myId) deleteMessage += ` ${toDelete.uploaderName} will be notified.`;
        deleteMessage += " This can't be undone.";
    }

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
