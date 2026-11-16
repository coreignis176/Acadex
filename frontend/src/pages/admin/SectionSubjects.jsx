import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { LuBookOpen, LuCopy, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { useAddsubjectMutation, useCopysubjectsMutation, useRemovesubjectMutation, useUpdatesubjectMutation } from "../../store/Api/Api";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SubjectIcon } from "../../components/SubjectIcon";

const NAME_RULES = {required:"Enter the subject name" , validate:(value) => (value.trim().length >= 2 && value.trim().length <= 60) || "Use 2-60 characters"};
const CODE_RULES = {required:"Enter the subject code" , pattern:{value:/^\s*[A-Za-z0-9-]{3,12}\s*$/ , message:"3-12 letters, digits or hyphens, e.g. TCS355"}};
const field = "w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:border-primary";

const attempt = async (call , fallback) =>{
    try{
        const result = await call().unwrap();
        toast.success(result.message);
        return true;
    }
    catch(error){
        toast.error(error?.data?.message || fallback);
        return false;
    }
}

const SubjectRow = ({subject , sectionId , onRemove}) =>{
    const [editing , setEditing] = useState(false);
    const [saving , setSaving] = useState(false);
    const [updatesubject] = useUpdatesubjectMutation();
    const {register , handleSubmit , reset , formState:{errors}} = useForm({defaultValues:{name:subject.name , code:subject.code}});

    const save = async (form) =>{
        setSaving(true);
        const done = await attempt(() => updatesubject({sectionId , subjectId:subject._id , name:form.name , code:form.code}) , "Could Not Update The Subject");
        setSaving(false);
        if(done) setEditing(false);
    }

    const cancelEdit = () =>{
        reset();
        setEditing(false);
    }

    if(editing) return (
        <li className="px-5 py-4 bg-primary-soft/30">
            <form onSubmit={handleSubmit(save)} noValidate className="grid gap-3 sm:grid-cols-[150px_1fr_auto] sm:items-start">
                <div>
                    <label className="sr-only" htmlFor={`code-${subject._id}`}>Subject Code</label>
                    <input id={`code-${subject._id}`} className={`${field} uppercase`} {...register("code" , CODE_RULES)}/>
                    {errors.code && <p className="text-bad text-xs mt-1">{errors.code.message}</p>}
                </div>
                <div>
                    <label className="sr-only" htmlFor={`name-${subject._id}`}>Subject Name</label>
                    <input id={`name-${subject._id}`} autoFocus className={field} {...register("name" , NAME_RULES)}/>
                    {errors.name && <p className="text-bad text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={cancelEdit} className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm font-medium">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
                </div>
            </form>
            <p className="text-xs text-muted mt-2">Notes already shared for this subject in this section are updated too.</p>
        </li>
    );

    return (
        <li className="flex items-center gap-4 px-5 py-3.5">
            <SubjectIcon subject={subject.name} size="w-10 h-10" rounded="rounded-xl"/>
            <span className="w-24 shrink-0 font-semibold tracking-wide text-sm tabular-nums">{subject.code}</span>
            <span className="flex-1 min-w-0 font-medium truncate">{subject.name}</span>
            <button onClick={() => setEditing(true)} aria-label={`Edit ${subject.name}`} title="Edit"
                className="p-2 rounded-lg text-muted hover:text-primary hover:bg-primary-soft"><LuPencil className="w-4 h-4"/></button>
            <button onClick={() => onRemove(subject)} aria-label={`Remove ${subject.name}`} title="Remove"
                className="p-2 rounded-lg text-muted hover:text-bad hover:bg-bad-soft"><LuTrash2 className="w-4 h-4"/></button>
        </li>
    );
}

export const SectionSubjects = ({section , subjects , siblings}) =>{
    const [addsubject] = useAddsubjectMutation();
    const [removesubject] = useRemovesubjectMutation();
    const [copysubjects] = useCopysubjectsMutation();
    const [adding , setAdding] = useState(false);
    const [removing , setRemoving] = useState(null);
    const [working , setWorking] = useState(false);

    const copyable = siblings.filter((sibling) => sibling.subjectCount > 0);
    let firstCopyable = "";
    if(copyable.length > 0){
        firstCopyable = copyable[0]._id;
    }
    const [copyFrom , setCopyFrom] = useState(firstCopyable);
    const {register , handleSubmit , reset , setFocus , formState:{errors}} = useForm({defaultValues:{name:"" , code:""}});

    const handleAdd = async (form) =>{
        setAdding(true);
        const done = await attempt(() => addsubject({sectionId:section._id , name:form.name , code:form.code}) , "Could Not Add The Subject");
        setAdding(false);
        if(done){
            reset();
            setFocus("name");
        }
    }

    const handleRemove = async () =>{
        setWorking(true);
        await attempt(() => removesubject({sectionId:section._id , subjectId:removing._id}) , "Could Not Remove The Subject");
        setWorking(false);
        setRemoving(null);
    }

    const handleCopy = async () =>{
        setWorking(true);
        await attempt(() => copysubjects({sectionId:section._id , fromSectionId:copyFrom}) , "Could Not Copy The Subjects");
        setWorking(false);
    }

    let copyBar = false;
    if(copyable.length > 0){
        copyBar = (
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <LuCopy className="w-4 h-4 text-muted"/>
                <span className="text-muted">Copy subjects from</span>
                <label className="sr-only" htmlFor="copy-from">Section to copy from</label>
                <select id="copy-from" value={copyFrom} onChange={(event) => setCopyFrom(event.target.value)} className="px-3 py-1.5 rounded-lg border border-line bg-white text-sm">
                    {copyable.map((sibling) => <option key={sibling._id} value={sibling._id}>{sibling.name} ({sibling.subjectCount})</option>)}
                </select>
                <button onClick={handleCopy} disabled={working || !copyFrom} className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary font-medium hover:bg-primary-soft disabled:opacity-50">Copy</button>
            </div>
        );
    }

    let subjectWord = "subjects";
    if(subjects.length === 1){
        subjectWord = "subject";
    }

    let listContent;
    if(subjects.length === 0){
        listContent = (
            <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3"><LuBookOpen className="w-5 h-5"/></div>
                <p className="font-semibold">No subjects added yet.</p>
                <p className="text-sm text-muted mt-1 max-w-md mx-auto">Add each subject with its name and code above. Students can&apos;t upload notes until {section.name} has subjects.</p>
                {!section.archived && copyable.length > 0 && <div className="mt-4 flex justify-center">{copyBar}</div>}
            </div>
        );
    }
    else{
        listContent = (
            <ul className="divide-y divide-line">
                {subjects.map((subject) => <SubjectRow key={subject._id} subject={subject} sectionId={section._id} onRemove={setRemoving}/>)}
            </ul>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {!section.archived && (
                <form onSubmit={handleSubmit(handleAdd)} noValidate className="bg-white border border-line rounded-2xl p-5">
                    <p className="font-semibold">Add a subject</p>
                    <p className="text-sm text-muted mb-4">Students of {section.name} can upload notes only for the subjects listed here.</p>
                    <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-start">
                        <div>
                            <label htmlFor="sub-name" className="block text-sm font-medium mb-1.5">Subject Name</label>
                            <input id="sub-name" className={field} placeholder="e.g. Database Management Systems" {...register("name" , NAME_RULES)}/>
                            {errors.name && <p className="text-bad text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="sub-code" className="block text-sm font-medium mb-1.5">Subject Code</label>
                            <input id="sub-code" className={`${field} uppercase`} placeholder="e.g. TCS355" {...register("code" , CODE_RULES)}/>
                            {errors.code && <p className="text-bad text-xs mt-1">{errors.code.message}</p>}
                        </div>
                        <button type="submit" disabled={adding}
                            className="sm:mt-[26px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-60">
                            <LuPlus className="w-4 h-4"/> {adding ? "Adding..." : "Add subject"}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white border border-line rounded-2xl overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-line">
                    <p className="font-semibold">{subjects.length} {subjectWord} in {section.name}</p>
                    {subjects.length > 0 && !section.archived && copyBar}
                </div>
                {listContent}
            </div>

            {removing && (
                <ConfirmDialog title={`Remove ${removing.code} ${removing.name}?`} confirmText="Remove subject" loading={working}
                    message={`Students of ${section.name} won't be able to upload new notes for this subject. Notes already shared for it stay available.`}
                    onConfirm={handleRemove} onClose={() => setRemoving(null)}/>
            )}
        </div>
    )
}
