import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Modal } from "../../components/Modal";
import { setStudentPopup } from "../../store/slice/PortalSlice";
import { useAddstudentMutation } from "../../store/Api/Api";

// popup to add ONE student to an existing section (bulk registration happens through the CSV in Add Section)
// payload: {sectionId , label}
export const StudentPopup = () =>{
    const dispatch = useDispatch();
    const popup = useSelector((state) => state.portal.studentPopup);   // {sectionId , label}
    const [addstudent] = useAddstudentMutation();
    const [saving , setSaving] = useState(false);      // true while the server adds the student
    const {register , handleSubmit , formState:{errors}} = useForm();

    //$ function to close the popup
    const close = () => dispatch(setStudentPopup(false));

    //$ function to register a student in the section
    const handleOnSubmit = async (form) =>{
        try{
            setSaving(true);
            const result = await addstudent({sectionId:popup.sectionId , name:form.name , classRollNo:form.classRollNo , rollNo:form.collegeRollNo}).unwrap();
            if(result?.success){
                toast.success(result.message);
                close();
            }
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Add The Student");
        }
        finally{
            setSaving(false);
        }
    }

    const field = "w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:border-primary";

    return (
        <Modal onClose={close} width="max-w-md" title="Add a student" description={`The student is added to ${popup.label}.`}>
            <form onSubmit={handleSubmit(handleOnSubmit)} className="flex flex-col gap-4" noValidate>
                <div>
                    <label htmlFor="student-name" className="block text-sm font-medium mb-1.5">Student Name</label>
                    {/* {...register(...)} connects this input to the form and gives it its rules */}
                    <input id="student-name" autoFocus className={field} placeholder="e.g. Priya Negi"
                        {...register("name" , {
                            required:"Enter the student's name",
                            validate:(value) => (value.trim().length >= 2 && value.trim().length <= 60) || "Use 2-60 characters"
                        })}/>
                    {errors.name && <p className="text-bad text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="student-class" className="block text-sm font-medium mb-1.5">Class Roll Number</label>
                        <input id="student-class" className={`${field} uppercase`} placeholder="e.g. 13"
                            {...register("classRollNo" , {
                                required:"Enter the class roll number",
                                // 1 to 10 characters, each a letter, a digit or "-"
                                pattern:{value:/^[A-Za-z0-9-]{1,10}$/ , message:"Up to 10 letters, digits or hyphens"}
                            })}/>
                        {errors.classRollNo && <p className="text-bad text-xs mt-1">{errors.classRollNo.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="student-college" className="block text-sm font-medium mb-1.5">College Roll Number</label>
                        <input id="student-college" className={`${field} uppercase`} placeholder="e.g. BT25ML1013"
                            {...register("collegeRollNo" , {
                                required:"Enter the college roll number",
                                // 4 to 16 characters, each a letter, a digit or "-"
                                pattern:{value:/^[A-Za-z0-9-]{4,16}$/ , message:"4-16 letters, digits or hyphens"}
                            })}/>
                        {errors.collegeRollNo && <p className="text-bad text-xs mt-1">{errors.collegeRollNo.message}</p>}
                    </div>
                </div>
                <p className="text-xs text-muted">Students log in with their college roll number and the default student password. They must choose their own password the first time they log in.</p>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={close} className="px-4 py-2.5 rounded-xl border border-line text-sm font-medium hover:bg-canvas">Cancel</button>
                    <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-60">
                        {saving ? "Adding..." : "Add student"}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
