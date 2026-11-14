import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Modal } from "./Modal";
import { PagePicker } from "./PagePicker";
import { toggleNotePopup } from "../store/slice/PortalSlice";
import { useGetsubjectlistQuery, useSubmitnoteMutation } from "../store/Api/Api";
import { makeNoteForm, pagesProblem } from "../utils/notePages";

// upload popup used in the CR portal (students use the Upload Notes page)
// the server decides the outcome: active CR -> published, student -> pending
export const NotePopup = () =>{
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const {data} = useGetsubjectlistQuery();
    const [submitnote] = useSubmitnoteMutation();
    const [saving , setSaving] = useState(false);          // true while the note is being uploaded
    const [pages , setPages] = useState([]);               // the picked page photos (File objects)
    const [pagesError , setPagesError] = useState("");     // message shown under the photos (empty = no problem)
    const {register , handleSubmit , formState:{errors}} = useForm();

    //$ function to close the popup (its open / closed state lives in Redux so any portal page can open it)
    const close = () => dispatch(toggleNotePopup());

    //$ function to upload the page images and share the note
    const handleOnSubmit = async (form) =>{
        const problem = pagesProblem(pages);
        if(problem){
            setPagesError(problem);
            return;
        }
        try{
            setSaving(true);
            const result = await submitnote(makeNoteForm(form , pages)).unwrap();
            if(result?.success){
                toast.success(result.message);
                close();
            }
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Upload The Notes");
        }
        finally{
            setSaving(false);
        }
    }

    //$ function to check the title is 4-80 characters long (spaces at the ends are not counted)
    const checkTitle = (value) =>{
        const length = value.trim().length;
        if(length >= 4 && length <= 80){
            return true;
        }
        return "Use 4-80 characters";
    }

    //$ function to check the topic is 2-60 characters long
    const checkTopic = (value) =>{
        const length = value.trim().length;
        if(length >= 2 && length <= 60){
            return true;
        }
        return "Use 2-60 characters";
    }

    //$ function to keep the new list of pages and clear the old pages error
    const handlePagesChange = (nextPages) =>{
        setPages(nextPages);
        setPagesError("");
    }

    const field = "w-full px-3 py-2 rounded-lg border border-line bg-white text-sm focus:outline-none focus:border-primary";

    // the subjects the user can choose from
    let list = [];
    if(data && data.data){
        list = data.data;
    }

    // a confirmed Class Representative
    let isCr = false;
    if(user && user.crStatus === "active"){
        isCr = true;
    }

    // name of the user's section, if they have one (used when there are no subjects)
    let sectionName;
    if(user && user.section){
        sectionName = user.section.name;
    }

    // the popup's title and description depend on who is uploading
    let title = "Submit notes for approval";
    let description = "Your CR reviews notes before they are shared.";
    if(isCr){
        title = "Upload notes";
        description = "As a CR, your notes are shared right away with every section of your year.";
    }

    // text of the submit button
    let submitText = "Submit for approval";
    if(saving){
        submitText = "Uploading...";
    }
    else if(isCr){
        submitText = "Upload notes";
    }

    // no subjects yet -> only a message, no form
    if(list.length === 0){
        return (
            <Modal onClose={close} width="max-w-2xl" title={title} description={description}>
                <p className="text-sm text-muted">{sectionName} has no subjects yet. The admin adds subjects in Academic Structure.</p>
            </Modal>
        )
    }

    return (
        <Modal onClose={close} width="max-w-2xl" title={title} description={description}>
            <form onSubmit={handleSubmit(handleOnSubmit)} className="flex flex-col gap-4" noValidate>
                <div>
                    <span className="block text-sm font-medium mb-1">Note pages</span>
                    <PagePicker pages={pages} onChange={handlePagesChange} disabled={saving} error={pagesError}/>
                </div>

                <div>
                    <label htmlFor="note-title" className="block text-sm font-medium mb-1">Title</label>
                    {/* {...register(...)} connects this input to the form (its value and its rules) */}
                    <input id="note-title" className={field} placeholder="e.g. Stacks and Queues - Lecture 7"
                        {...register("title" , {required:"Enter a title" , validate:checkTitle})}/>
                    {errors.title && <p className="text-bad text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="note-subject" className="block text-sm font-medium mb-1">Subject</label>
                        <select id="note-subject" className={field} defaultValue="" {...register("subject" , {required:"Choose a subject"})}>
                            <option value="" disabled>Choose a subject</option>
                            {list.map((subject) => <option key={subject.name} value={subject.name}>{subject.code} - {subject.name}</option>)}
                        </select>
                        {errors.subject && <p className="text-bad text-xs mt-1">{errors.subject.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="note-topic" className="block text-sm font-medium mb-1">Topic</label>
                        <input id="note-topic" className={field} placeholder="e.g. Heaps"
                            {...register("topic" , {required:"Enter the topic" , validate:checkTopic})}/>
                        {errors.topic && <p className="text-bad text-xs mt-1">{errors.topic.message}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="note-desc" className="block text-sm font-medium mb-1">Description <span className="text-muted font-normal">(optional)</span></label>
                    <textarea id="note-desc" rows={2} className={field} placeholder="What do these pages cover?"
                        {...register("description" , {maxLength:{value:300 , message:"Keep the description under 300 characters"}})}/>
                    {errors.description && <p className="text-bad text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={close} className="px-4 py-2 rounded-lg border border-line text-sm font-medium hover:bg-canvas">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60 bg-primary hover:bg-primary-hover">
                        {submitText}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
