import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Modal } from "../../components/Modal";
import { setSectionPopup } from "../../store/slice/PortalSlice";
import { useRenamesectionMutation } from "../../store/Api/Api";

// popup to rename an existing section - payload: {mode:"rename" , sectionId , name , label}
// (new sections are created with their students in AddSectionPopup)
export const SectionPopup = () =>{
    const dispatch = useDispatch();
    const popup = useSelector((state) => state.portal.sectionPopup);   // {mode:"rename" , sectionId , name , label}
    const [renamesection] = useRenamesectionMutation();
    const [saving , setSaving] = useState(false);      // true while the server renames the section
    const {register , handleSubmit , formState:{errors}} = useForm({defaultValues:{name:popup.name}});

    //$ function to close the popup
    const close = () => dispatch(setSectionPopup(false));

    //$ function to rename the section
    const handleOnSubmit = async (form) =>{
        try{
            setSaving(true);
            const result = await renamesection({sectionId:popup.sectionId , name:form.name}).unwrap();
            if(result?.success){
                toast.success(result.message);
                close();
            }
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Rename The Section");
        }
        finally{
            setSaving(false);
        }
    }

    return (
        <Modal onClose={close} width="max-w-md" title={`Rename ${popup.name}`} description={`Students of ${popup.label} are told about the new name.`}>
            <form onSubmit={handleSubmit(handleOnSubmit)} className="flex flex-col gap-4" noValidate>
                <div>
                    <label htmlFor="section-name" className="block text-sm font-medium mb-1">Section name</label>
                    {/* {...register(...)} connects this input to the form and gives it its rules */}
                    <input id="section-name" autoFocus placeholder="e.g. Section A or ML4"
                        className="w-full px-3 py-2 rounded-lg border border-line bg-white text-sm focus:outline-none focus:border-primary"
                        {...register("name" , {
                            required:"Enter a section name",
                            validate:(value) => value.trim().length > 0 || "Enter a section name",   // only spaces is not a name
                            maxLength:{value:20 , message:"Use at most 20 characters"}
                        })}/>
                    {errors.name && <p className="text-bad text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={close} className="px-4 py-2 rounded-lg border border-line text-sm font-medium hover:bg-canvas">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium disabled:opacity-60">
                        {saving ? "Saving..." : "Rename section"}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
