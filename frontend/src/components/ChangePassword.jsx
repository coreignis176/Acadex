import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { useChangepasswordMutation } from "../store/Api/Api";
import { setUser } from "../store/slice/UserSlice";

export const ChangePassword = ({onDone}) =>{
    const dispatch = useDispatch();
    const [changepassword] = useChangepasswordMutation();
    const [saving , setSaving] = useState(false);
    const [showPasswords , setShowPasswords] = useState(false);
    const {register , handleSubmit , watch , formState:{errors}} = useForm();

    const newPassword = watch("newPassword");

    const checkLetterAndNumber = (value) =>{
        const hasLetter = /[A-Za-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        if(hasLetter && hasNumber){
            return true;
        }
        return "Use at least one letter and one number";
    }

    const checkSameAsNew = (value) =>{
        if(value === newPassword){
            return true;
        }
        return "The two passwords are not the same";
    }

    const handleOnSubmit = async (form) =>{
        try{
            setSaving(true);
            const result = await changepassword({oldPassword:form.oldPassword , newPassword:form.newPassword}).unwrap();
            if(result?.success){
                dispatch(setUser(result.data));
                toast.success(result.message);
                if(onDone) onDone();
            }
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Change The Password");
        }
        finally{
            setSaving(false);
        }
    }

    const field = "w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:border-primary";
    const type = showPasswords ? "text" : "password";

    return (
        <form onSubmit={handleSubmit(handleOnSubmit)} className="flex flex-col gap-4" noValidate>
            <div>
                <label htmlFor="old-password" className="block text-sm font-medium mb-1.5">Current password</label>
                <input id="old-password" type={type} autoComplete="current-password" className={field}
                    {...register("oldPassword" , {required:"Enter your current password"})}/>
                {errors.oldPassword && <p className="text-bad text-xs mt-1">{errors.oldPassword.message}</p>}
            </div>

            <div>
                <label htmlFor="new-password" className="block text-sm font-medium mb-1.5">New password</label>
                <input id="new-password" type={type} autoComplete="new-password" className={field}
                    {...register("newPassword" , {
                        required:"Enter a new password",
                        minLength:{value:8 , message:"Use at least 8 characters"},
                        maxLength:{value:64 , message:"Use at most 64 characters"},
                        validate:checkLetterAndNumber
                    })}/>
                {errors.newPassword && <p className="text-bad text-xs mt-1">{errors.newPassword.message}</p>}
            </div>

            <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium mb-1.5">Type the new password again</label>
                <input id="confirm-password" type={type} autoComplete="new-password" className={field}
                    {...register("confirmPassword" , {
                        required:"Type the new password again",
                        validate:checkSameAsNew
                    })}/>
                {errors.confirmPassword && <p className="text-bad text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="self-start inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                {showPasswords ? <LuEyeOff className="w-4 h-4"/> : <LuEye className="w-4 h-4"/>}
                {showPasswords ? "Hide passwords" : "Show passwords"}
            </button>

            <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold disabled:opacity-60">
                {saving ? "Saving..." : "Save new password"}
            </button>
        </form>
    )
}
