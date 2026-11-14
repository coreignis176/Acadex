import { useDispatch } from "react-redux";
import { LuCheck } from "react-icons/lu";
import { openLoginPopup } from "../../store/slice/UserSlice";
import { objectives, problems, youCan } from "./aboutData";

// background (bg) and text (fg) colours for the three problem cards, in order
const PROBLEM_COLORS = [
    {bg:"#fbe9ee" , fg:"#a8395a"},
    {bg:"#fbf1dc" , fg:"#9a6512"},
    {bg:"#efeafb" , fg:"#5b46a8"}
];

// the About page: what Acadex is, why it was built and what students can do with it
export const About = () =>{
    const dispatch = useDispatch();
    return (
        <main>
            {/* intro band */}
            <section className="px-2 sm:px-4 pt-3">
                <div className="relative bg-night dot-grid rounded-[28px] overflow-hidden">
                    <div aria-hidden="true" className="absolute -right-32 -top-32 w-[480px] h-[480px] rounded-full bg-night-soft blur-3xl"/>
                    <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
                        <div>
                            <h1 className="text-white text-4xl md:text-[3.4rem] leading-[1.06] font-semibold">What is Acadex?</h1>
                            <p className="text-chalk text-lg mt-5 leading-relaxed max-w-2xl">
                                Acadex is a notes-sharing platform for college students. It helps you find, organise and share study material with the students in your course, all in one place instead of across WhatsApp groups, Telegram channels and other sources.
                            </p>
                        </div>
                        <blockquote className="bg-white/6 border border-white/10 rounded-2xl p-6">
                            <p className="font-serif text-white text-xl leading-snug">
                                In simple words: one place where students find, share and access academic notes.
                            </p>
                        </blockquote>
                    </div>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 md:px-6">
                {/* problems */}
                <section className="mt-20">
                    <h2 className="text-3xl md:text-[2.4rem] leading-tight font-semibold max-w-xl">Why we built it</h2>
                    <div className="mt-8 grid md:grid-cols-3 gap-4">
                        {problems.map((problem , index) => (
                            <div key={problem.title} className="rounded-2xl p-6 md:p-7" style={{background:PROBLEM_COLORS[index].bg}}>
                                <h3 className="text-2xl font-semibold" style={{color:PROBLEM_COLORS[index].fg}}>{problem.title}</h3>
                                <p className="text-ink/75 mt-2 leading-relaxed">{problem.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* goals */}
                <section className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.5fr]">
                    <div>
                        <h2 className="text-3xl md:text-[2.4rem] leading-tight font-semibold">What Acadex is for</h2>
                        <p className="text-muted mt-4 text-lg leading-relaxed">
                            Making knowledge sharing between students easier and more organised.
                        </p>
                    </div>
                    <ul className="flex flex-col gap-3">
                        {objectives.map((objective) => (
                            <li key={objective.title} className="flex gap-4 bg-white border border-line rounded-2xl p-5">
                                <span className="w-8 h-8 shrink-0 rounded-full bg-ok-soft text-ok flex items-center justify-center"><LuCheck className="w-4 h-4"/></span>
                                <div>
                                    <h3 className="font-sans font-semibold text-[1.05rem]">{objective.title}</h3>
                                    <p className="text-muted mt-0.5 leading-relaxed">{objective.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* what you can do */}
                <section className="mt-20 rounded-[28px] bg-primary-soft dot-grid-light p-8 md:p-12 grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
                    <div>
                        <h2 className="text-3xl md:text-[2.4rem] leading-tight font-semibold">What you can do</h2>
                        <button onClick={() => dispatch(openLoginPopup("student"))} className="mt-6 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold">
                            Start finding notes
                        </button>
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-3">
                        {youCan.map((item) => (
                            <li key={item} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 font-medium">
                                <LuCheck className="w-4 h-4 text-primary shrink-0"/> {item}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </main>
    )
}
