import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LuEye, LuEyeOff, LuGraduationCap, LuShieldCheck } from "react-icons/lu";
import { PiSealCheckFill } from "react-icons/pi";
import { Modal } from "./Modal";
import { Api, useLoginMutation } from "../store/Api/Api";
import { setUser, toggleLoginPopup } from "../store/slice/UserSlice";
import { homePortal } from "./portal/portalLinks";

const PANELS = {
    student:{
        tab:"Student",
        icon:LuGraduationCap,
        title:"Student login",
        description:"Log in with your roll number to open your notes.",
        field:"Roll number",
        placeholder:"e.g. BT25ML1003",
        button:"Open my notes",
        hint:"No account? The college registers every student. Ask the academic office for your login."
    },
    cr:{
        tab:"CR",
        icon:PiSealCheckFill,
        title:"CR login",
        description:"Class Representatives log in with their roll number to manage their section's notes.",
        field:"Roll number",
        placeholder:"e.g. BT25ML1001",
        button:"Open CR portal",
        hint:"Just appointed? Log in as a student first and confirm your CR appointment from your notifications."
    },
    admin:{
        tab:"Admin",
        icon:LuShieldCheck,
        title:"Admin login",
        description:"For the academic office: manage courses, sections, students and CRs.",
        field:"Email",
        placeholder:"admin@acadex.edu",
        button:"Open admin portal",
        hint:""
    }
};

const PANEL_KEYS = ["student" , "cr" , "admin"];

export const AuthPage = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const initialRole = useSelector((state) => state.user.loginRole);

    let startRole = "student";
    if(PANELS[initialRole]){
        startRole = initialRole;
    }

    const [role , setRole] = useState(startRole);
    const [eyeOpen , setEyeOpen] = useState(false);
    const [authLoading , setAuthLoading] = useState(false);
    const [login] = useLoginMutation();
    const {register , handleSubmit , reset , formState:{errors}} = useForm();
    const panel = PANELS[role];

    useEffect(() =>{
        reset({identifier:"" , password:""});
    },[role , reset]);

    const close = () => dispatch(toggleLoginPopup());

    const handleOnSubmit = async (form) =>{
        try{
            setAuthLoading(true);
            const loginData = {
                identifier:form.identifier,
                password:form.password,
                role:role
            };
            const result = await login(loginData).unwrap();
            if(result?.success){
                dispatch(Api.util.resetApiState());
                dispatch(setUser(result.data));
                toast.success(result.message);
                close();
                if(role === "cr"){
                    Navigate("/cr");
                }
                else{
                    Navigate(homePortal(result.data));
                }
            }
        }
        catch(error){
            toast.error(error?.data?.message || "Login Failed");
        }
        finally{
            setAuthLoading(false);
        }
    }

    const handleEyeClick = () => setEyeOpen(!eyeOpen);

    const field = "w-full px-3.5 py-3 rounded-xl border border-line bg-white text-[0.95rem] focus:outline-none focus:border-primary";
    const passwordField = field + " pr-11";

    let identifierRules = {required:"Enter your roll number"};
    if(role === "admin"){
        identifierRules = {
            required:"Enter your email",
            pattern:{value:/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i , message:"Enter a valid email"}
        };
    }

    let passwordType = "password";
    let eyeLabel = "Show password";
    let eyeIcon = <LuEye className="w-4 h-4"/>;
    if(eyeOpen){
        passwordType = "text";
        eyeLabel = "Hide password";
        eyeIcon = <LuEyeOff className="w-4 h-4"/>;
    }

    let submitClass = "w-full py-3 rounded-xl text-white font-semibold disabled:opacity-60 bg-primary hover:bg-primary-hover";
    if(role === "cr"){
        submitClass = "w-full py-3 rounded-xl text-white font-semibold disabled:opacity-60 bg-seal hover:bg-seal/90";
    }

    let submitText = panel.button;
    if(authLoading){
        submitText = "Logging in...";
    }

    return (
        <Modal onClose={close} title={panel.title} description={panel.description}>

            <div className="grid grid-cols-3 p-1 rounded-xl bg-canvas border border-line mb-5" role="tablist" aria-label="Login as">
                {PANEL_KEYS.map((key) =>{
                    const Icon = PANELS[key].icon;

                    let tabClass = "flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm";
                    if(role !== key){
                        tabClass = tabClass + " text-muted hover:text-ink";
                    }
                    else if(key === "cr"){
                        tabClass = tabClass + " bg-white shadow-sm font-semibold text-seal";
                    }
                    else{
                        tabClass = tabClass + " bg-white shadow-sm font-semibold text-primary";
                    }

                    return (
                        <button key={key} type="button" role="tab" aria-selected={role === key} onClick={() => setRole(key)}
                            className={tabClass}>
                            <Icon className="w-4 h-4"/> {PANELS[key].tab}
                        </button>
                    )
                })}
            </div>

            <form onSubmit={handleSubmit(handleOnSubmit)} className="flex flex-col gap-4" noValidate>
                <div>
                    <label htmlFor="identifier" className="block text-sm font-medium mb-1.5">{panel.field}</label>
                    <input id="identifier" autoComplete="username" className={field} placeholder={panel.placeholder}
                        {...register("identifier" , identifierRules)}/>
                    {errors.identifier && <p className="text-bad text-xs mt-1">{errors.identifier.message}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
                    <div className="relative">
                        <input id="password" type={passwordType} autoComplete="current-password" className={passwordField}
                            {...register("password" , {required:"Enter your password"})}/>
                        <button type="button" onClick={handleEyeClick} aria-label={eyeLabel}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink">
                            {eyeIcon}
                        </button>
                    </div>
                    {errors.password && <p className="text-bad text-xs mt-1">{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={authLoading} className={submitClass}>
                    {submitText}
                </button>

                {panel.hint && <p className="text-xs text-muted text-center">{panel.hint}</p>}
            </form>
        </Modal>
    )
}
