import { LuAlarmClock, LuCalendarX, LuFileSearch, LuPenLine } from "react-icons/lu";
import { moments } from "./homeData";

const MomentIcon = ({momentKey , className , style , ariaHidden}) =>{
    if(momentKey === "missed") return <LuCalendarX aria-hidden={ariaHidden} className={className} style={style}/>;
    if(momentKey === "exam") return <LuAlarmClock aria-hidden={ariaHidden} className={className} style={style}/>;
    if(momentKey === "great") return <LuPenLine aria-hidden={ariaHidden} className={className} style={style}/>;
    if(momentKey === "lost") return <LuFileSearch aria-hidden={ariaHidden} className={className} style={style}/>;
    return null;
}

export const Moments = () =>{
    return (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-20 md:pt-28">
            <div className="max-w-2xl">
                <h2 className="text-3xl md:text-[2.6rem] leading-tight font-semibold">Made for the moments that matter</h2>
                <p className="text-muted mt-4 text-lg leading-relaxed">College gets busy. Acadex makes sure the notes are there when you need them.</p>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {moments.map((moment , index) =>{
                    return (
                        <li key={moment.key} data-aos="fade-up" data-aos-delay={index * 80}
                            className="relative overflow-hidden rounded-2xl p-6 min-h-[230px] flex flex-col"
                            style={{background:moment.color.bg}}>
                            <MomentIcon momentKey={moment.key} ariaHidden="true" className="absolute -right-5 -bottom-5 w-32 h-32 opacity-[0.08]" style={{color:moment.color.fg}}/>
                            <span className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm" style={{color:moment.color.fg}}>
                                <MomentIcon momentKey={moment.key} className="w-6 h-6"/>
                            </span>
                            <h3 className="mt-auto pt-8 text-xl font-semibold" style={{color:moment.color.fg}}>{moment.title}</h3>
                            <p className="mt-2 text-ink/75 leading-relaxed text-[0.95rem]">{moment.text}</p>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
