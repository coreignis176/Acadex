import { LuArrowRight, LuFileText } from "react-icons/lu";
import { SubjectIcon } from "../../components/SubjectIcon";
import { scattered } from "./homeData";

// the "after" list: each subject with its number of notes
const organised = [
    {subject:"Data Structures" , count:4},
    {subject:"Object Oriented Programming (C++)" , count:3},
    {subject:"Database Management Systems" , count:2},
    {subject:"Discrete Mathematics" , count:1}
];

// before: notes scattered across chats -> after: one organised library
export const Problem = () =>{
    return (
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-28">
            <div className="max-w-2xl">
                <h2 className="text-3xl md:text-[2.6rem] leading-tight font-semibold">Good notes shouldn&apos;t get lost in group chats.</h2>
                <p className="text-muted mt-4 text-lg leading-relaxed">
                    Right now, study material is spread across chats, channels, drives and phone galleries. Acadex keeps it in one library, sorted by subject, for you and your classmates.
                </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
                {/* before */}
                <div className="relative rounded-2xl border border-dashed border-line bg-white/60 p-6 md:p-8 min-h-[320px]">
                    <p className="text-sm font-medium text-muted mb-5">Where notes are today</p>
                    <ul className="flex flex-col gap-3">
                        {scattered.map((item) => (
                            <li key={item.text} className={`${item.tilt} self-start max-w-full bg-white border border-line rounded-xl px-4 py-2.5 shadow-sm opacity-90`}>
                                <p className="text-sm font-medium text-ink/80 truncate">{item.text}</p>
                                <p className="text-xs text-muted">{item.where}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div aria-hidden="true" className="hidden lg:flex w-12 h-12 rounded-full bg-primary text-white items-center justify-center shadow-lg">
                    <LuArrowRight className="w-5 h-5"/>
                </div>

                {/* after */}
                <div className="rounded-2xl bg-white border border-line shadow-[0_20px_50px_-24px_rgba(28,43,58,0.35)] p-6 md:p-8 min-h-[320px]">
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-sm font-medium text-primary">With Acadex</p>
                        <span className="text-xs text-muted">Your subjects</span>
                    </div>
                    <ul className="flex flex-col gap-2.5">
                        {organised.map((item) => (
                            <li key={item.subject} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-canvas">
                                <SubjectIcon subject={item.subject} size="w-10 h-10" rounded="rounded-xl"/>
                                <span className="flex-1 min-w-0 font-medium truncate">{item.subject}</span>
                                <span className="inline-flex items-center gap-1 text-sm text-muted tabular-nums">
                                    <LuFileText className="w-3.5 h-3.5"/> {item.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-sm text-muted mt-5 pt-4 border-t border-line">One search box. Every subject. Nothing expires.</p>
                </div>
            </div>
        </section>
    )
}
