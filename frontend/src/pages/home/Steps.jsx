import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LuBookOpen, LuDownload, LuUpload } from "react-icons/lu";
import { openLoginPopup } from "../../store/slice/UserSlice";
import { homePortal } from "../../components/portal/portalLinks";
import { steps } from "./homeData";

// icon and colours for each step (same order as the steps list)
const STEP_STYLE = [
    {icon:<LuBookOpen className="w-6 h-6"/> , bg:"#e8f0fb" , fg:"#2b5d9e"},
    {icon:<LuDownload className="w-6 h-6"/> , bg:"#fbe9ee" , fg:"#a8395a"},
    {icon:<LuUpload className="w-6 h-6"/> , bg:"#e3f4f1" , fg:"#1f7a6c"}
];

// three steps from finding notes to sharing them (a real sequence -> numbered)
export const Steps = () =>{
    return (
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-28">
            <h2 className="text-3xl md:text-[2.6rem] leading-tight font-semibold max-w-xl">Up and running in a minute</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
                {steps.map((step , index) =>{
                    const stepStyle = STEP_STYLE[index];
                    // adding "26" to a hex colour like #2b5d9e makes it about 15% visible (a faint number)
                    const numberColor = `${stepStyle.fg}26`;
                    return (
                        <li key={step.title} className="relative bg-white border border-line rounded-2xl p-6 md:p-7">
                            <div className="flex items-center justify-between">
                                <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:stepStyle.bg , color:stepStyle.fg}}>
                                    {stepStyle.icon}
                                </span>
                                <span className="font-serif text-5xl font-semibold leading-none" style={{color:numberColor}}>{index + 1}</span>
                            </div>
                            <h3 className="text-xl font-semibold mt-6">{step.title}</h3>
                            <p className="text-muted mt-2 leading-relaxed">{step.text}</p>
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}

// closing call to action - students only
export const CallToAction = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);

    //$ function to open my notes if I am logged in, otherwise show the student login popup
    const handleClick = () =>{
        if(user) Navigate(homePortal(user));
        else dispatch(openLoginPopup("student"));
    }

    return (
        <section className="px-2 sm:px-4">
            <div className="relative bg-night dot-grid rounded-[28px] overflow-hidden">
                <div aria-hidden="true" className="absolute -right-24 -bottom-40 w-[480px] h-[480px] rounded-full bg-night-soft blur-3xl"/>
                <div className="relative max-w-4xl mx-auto px-5 md:px-8 py-16 md:py-24 text-center">
                    <h2 className="text-white text-3xl md:text-[3rem] leading-tight font-semibold">Stop searching. Start studying.</h2>
                    <p className="text-chalk mt-4 text-lg leading-relaxed max-w-xl mx-auto">
                        Log in with your roll number and your class&apos;s notes are waiting for you.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <button onClick={handleClick}
                            className="px-6 py-3 rounded-xl bg-white text-night font-semibold hover:bg-chalk">
                            {user ? "Open my notes" : "Log in with roll number"}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
