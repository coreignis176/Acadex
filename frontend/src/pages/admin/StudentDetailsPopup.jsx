import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { LuKeyRound, LuPencil, LuTriangleAlert, LuUserMinus } from "react-icons/lu";
import { PiSealCheck, PiSealCheckFill } from "react-icons/pi";
import { Modal } from "../../components/Modal";
import { RoleBadge } from "../../components/StatusBadge";
import { useRemovecrMutation, useRemovestudentMutation, useResetpasswordMutation, useSelectcrMutation, useUpdatestudentMutation } from "../../store/Api/Api";
import { initials } from "../../utils/format";

// popup with the details of one student + the admin actions: Add to CR / Edit details / Remove student / Reset password
// "view" says which screen of the popup is showing:
//   "details"  -> the student's info and the action buttons (the start screen)
//   "edit"     -> the edit form
//   "cr"       -> "Add to CR?" / "Remove from CR?" confirmation
//   "remove"   -> "Remove student?" confirmation
//   "password" -> "Reset password?" confirmation
// (all confirmations happen inside this one modal instead of opening a second one)
export const StudentDetailsPopup = ({student , section , crSlotsUsed , maxCrs , onClose}) =>{
    const [view , setView] = useState("details");   // which screen of the popup is showing (see the list above)
    const [working , setWorking] = useState(false);   // true while the server is working
    const [selectcr] = useSelectcrMutation();
    const [removecr] = useRemovecrMutation();
    const [removestudent] = useRemovestudentMutation();
    const [updatestudent] = useUpdatestudentMutation();
    const [resetpassword] = useResetpasswordMutation();
    const {register , handleSubmit , reset , formState:{errors , isDirty}} = useForm({
        defaultValues:{name:student.name , classRollNo:student.classRollNo , collegeRollNo:student.rollNo}
    });

    // after a save the list refetches -> keep the form's baseline in sync with the stored record
    // runs whenever the student's name or roll numbers change
    useEffect(() =>{
        reset({name:student.name , classRollNo:student.classRollNo , collegeRollNo:student.rollNo});
    },[student.name , student.classRollNo , student.rollNo , reset]);

    const isCr = student.crStatus !== "none";      // already a CR, or a CR request is waiting
    const slotsFull = crSlotsUsed >= maxCrs;

    //$ function to run a mutation with toast feedback
    // "action" starts the mutation , "onDone" (optional) runs after it worked
    const run = async (action , onDone) =>{
        try{
            setWorking(true);
            const result = await action().unwrap();
            if(result?.success) toast.success(result.message);
            if(onDone) onDone();
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Complete The Action");
        }
        finally{
            setWorking(false);
        }
    }

    //$ function to add the student to CR, or (if they already are / were asked) remove them
    const handleCr = () =>{
        if(isCr){
            return run(() => removecr({studentId:student._id}) , () => setView("details"));
        }
        return run(() => selectcr({studentId:student._id}) , () => setView("details"));
    }

    //$ function to remove the student from the section (the popup closes afterwards)
    const handleRemove = () => run(() => removestudent({studentId:student._id}) , onClose);

    //$ function to reset the student's password to the default one
    const handleResetPassword = () => run(() => resetpassword({studentId:student._id}) , () => setView("details"));

    //$ function to save edited details
    const handleSave = (form) => run(
        () => updatestudent({studentId:student._id , name:form.name , classRollNo:form.classRollNo , collegeRollNo:form.collegeRollNo}),
        () => setView("details")
    );

    const field = "w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:border-primary";

    //$ function to undo any typing in the form and go back to the start screen
    const goBack = () =>{
        reset();
        setView("details");
    }

    // the "Cancel" button used on the edit screen and every confirmation screen
    const back = (
        <button type="button" onClick={goBack} className="px-4 py-2.5 rounded-xl border border-line text-sm font-medium hover:bg-canvas">
            Cancel
        </button>
    );

    // texts of the CR confirmation screen, depending on the student's CR status
    let crCopy;
    if(student.crStatus === "active"){
        crCopy = {title:`Remove ${student.name} from CR?` , text:"They lose CR permissions and CR portal access. Their student account stays active and one CR position opens in this section." , button:"Remove from CR"};
    }
    else if(student.crStatus === "pending"){
        crCopy = {title:"Withdraw the CR request?" , text:`The request to ${student.name} is cancelled and the CR position opens again.` , button:"Withdraw request"};
    }
    else{
        crCopy = {title:`Add ${student.name} to CR?` , text:`${student.name} gets a request to confirm they are a Class Representative of ${section.name}. The position is reserved for them while they decide; CR permissions start after they confirm.` , button:"Add to CR"};
    }

    // the round avatar: "seal" colours for a confirmed CR, primary colours for everyone else
    let avatarClass = "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-semibold shrink-0 ";
    if(student.crStatus === "active"){
        avatarClass = avatarClass + "bg-seal-soft text-seal";
    }
    else{
        avatarClass = avatarClass + "bg-primary-soft text-primary";
    }

    // the CR button on the start screen: remove / withdraw for a CR, otherwise "Add to CR"
    let crButton;
    if(isCr){
        let removeText = "Withdraw CR request";
        if(student.crStatus === "active"){
            removeText = "Remove from CR";
        }
        crButton = (
            <button onClick={() => setView("cr")} className="mt-3 w-full px-4 py-2.5 rounded-xl border border-seal/40 bg-white text-seal text-sm font-semibold hover:bg-seal-soft">
                {removeText}
            </button>
        );
    }
    else{
        crButton = (
            <>
                <button onClick={() => setView("cr")} disabled={slotsFull}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-seal hover:bg-seal/90 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                    <PiSealCheck className="w-4 h-4"/> Add to CR
                </button>
                {slotsFull && <p className="text-xs text-muted mt-2">Both CR positions in {section.name} are taken. Remove a CR or withdraw a request to free a position.</p>}
            </>
        );
    }

    // the confirm button on the CR screen: red when removing, "seal" colour when adding
    let crConfirmClass = "px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 ";
    if(isCr){
        crConfirmClass = crConfirmClass + "bg-bad hover:bg-bad/90";
    }
    else{
        crConfirmClass = crConfirmClass + "bg-seal hover:bg-seal/90";
    }

    // the four boxes shown on the start screen
    const detailRows = [
        {label:"Class Roll Number" , value:student.classRollNo},
        {label:"College Roll Number" , value:student.rollNo},
        {label:"Section" , value:section.name},
        {label:"Course and year" , value:`${section.course} ${section.yearLabel}`}
    ];

    return (
        <Modal onClose={onClose} title="Student details" width="max-w-lg">

            {/* identity */}
            <div className="flex items-center gap-4">
                <div className={avatarClass}>
                    {initials(student.name)}
                </div>
                <div className="min-w-0">
                    <p className="text-lg font-semibold truncate">{student.name}</p>
                    <div className="mt-1"><RoleBadge crStatus={student.crStatus}/></div>
                </div>
            </div>

            {view === "details" && <>
                <dl className="mt-5 grid grid-cols-2 gap-3">
                    {detailRows.map((row) => (
                        <div key={row.label} className="rounded-xl bg-canvas border border-line px-3.5 py-2.5">
                            <dt className="text-xs text-muted">{row.label}</dt>
                            <dd className="font-semibold tabular-nums mt-0.5 break-all">{row.value}</dd>
                        </div>
                    ))}
                </dl>

                {/* CR block */}
                <div className="mt-5 rounded-xl border border-seal/25 bg-seal-soft/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium inline-flex items-center gap-1.5"><PiSealCheckFill className="w-4 h-4 text-seal"/> Class Representative</p>
                        <span className="text-xs font-semibold text-seal tabular-nums">{crSlotsUsed}/{maxCrs} positions used</span>
                    </div>
                    {crButton}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => setView("edit")} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line text-sm font-medium hover:border-primary/40 hover:text-primary">
                        <LuPencil className="w-4 h-4"/> Edit details
                    </button>
                    <button onClick={() => setView("remove")} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line text-sm font-medium hover:border-bad/40 hover:text-bad hover:bg-bad-soft">
                        <LuUserMinus className="w-4 h-4"/> Remove student
                    </button>
                </div>
                <button onClick={() => setView("password")} className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line text-sm font-medium hover:border-primary/40 hover:text-primary">
                    <LuKeyRound className="w-4 h-4"/> Reset password
                </button>
            </>}

            {view === "edit" && (
                <form onSubmit={handleSubmit(handleSave)} className="mt-5 flex flex-col gap-4" noValidate>
                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium mb-1.5">Student Name</label>
                        {/* {...register(...)} connects this input to the form and gives it its rules */}
                        <input id="edit-name" autoFocus className={field}
                            {...register("name" , {
                                required:"Enter the student's name",
                                validate:(value) => (value.trim().length >= 2 && value.trim().length <= 60) || "Use 2-60 characters"
                            })}/>
                        {errors.name && <p className="text-bad text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-class" className="block text-sm font-medium mb-1.5">Class Roll Number</label>
                            <input id="edit-class" className={`${field} uppercase`}
                                {...register("classRollNo" , {
                                    required:"Enter the class roll number",
                                    // 1 to 10 characters, each a letter, a digit or "-"
                                    pattern:{value:/^[A-Za-z0-9-]{1,10}$/ , message:"Up to 10 letters, digits or hyphens"}
                                })}/>
                            {errors.classRollNo && <p className="text-bad text-xs mt-1">{errors.classRollNo.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="edit-college" className="block text-sm font-medium mb-1.5">College Roll Number</label>
                            <input id="edit-college" className={`${field} uppercase`}
                                {...register("collegeRollNo" , {
                                    required:"Enter the college roll number",
                                    // 4 to 16 characters, each a letter, a digit or "-"
                                    pattern:{value:/^[A-Za-z0-9-]{4,16}$/ , message:"4-16 letters, digits or hyphens"}
                                })}/>
                            {errors.collegeRollNo && <p className="text-bad text-xs mt-1">{errors.collegeRollNo.message}</p>}
                        </div>
                    </div>
                    <p className="text-xs text-muted">The college roll number is also the student&apos;s login ID. If you change it, they log in with the new one.</p>
                    <div className="flex justify-end gap-2">
                        {back}
                        <button type="submit" disabled={working || !isDirty} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-50">
                            {working ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            )}

            {view === "cr" && (
                <div className="mt-5 rounded-xl border border-seal/30 bg-seal-soft/40 p-4">
                    <p className="font-semibold">{crCopy.title}</p>
                    <p className="text-sm text-ink/75 mt-1 leading-relaxed">{crCopy.text}</p>
                    <div className="flex justify-end gap-2 mt-4">
                        {back}
                        <button onClick={handleCr} disabled={working}
                            className={crConfirmClass}>
                            {working ? "Saving..." : crCopy.button}
                        </button>
                    </div>
                </div>
            )}

            {view === "remove" && (
                <div className="mt-5 rounded-xl border border-bad/30 bg-bad-soft/50 p-4">
                    <p className="font-semibold inline-flex items-center gap-2 text-bad"><LuTriangleAlert className="w-4 h-4"/> Remove {student.name} from {section.name}?</p>
                    <p className="text-sm text-ink/75 mt-1 leading-relaxed">
                        They are removed from this section and the student count updates. Their Acadex account is not deleted.
                        {isCr ? " Their CR permissions are revoked as well." : ""}
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        {back}
                        <button onClick={handleRemove} disabled={working} className="px-5 py-2.5 rounded-xl bg-bad hover:bg-bad/90 text-white text-sm font-semibold disabled:opacity-60">
                            {working ? "Removing..." : "Remove student"}
                        </button>
                    </div>
                </div>
            )}

            {view === "password" && (
                <div className="mt-5 rounded-xl border border-line bg-canvas p-4">
                    <p className="font-semibold inline-flex items-center gap-2"><LuKeyRound className="w-4 h-4"/> Reset the password of {student.name}?</p>
                    <p className="text-sm text-ink/75 mt-1 leading-relaxed">
                        Use this when a student forgets their password. It goes back to the default student password,
                        and they must choose a new one the next time they log in.
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        {back}
                        <button onClick={handleResetPassword} disabled={working} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-60">
                            {working ? "Resetting..." : "Reset password"}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    )
}
