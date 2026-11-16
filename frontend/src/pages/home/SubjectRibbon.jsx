import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SubjectIcon } from "../../components/SubjectIcon";
import { openLoginPopup } from "../../store/slice/UserSlice";
import { subjectColor } from "../../utils/subjects";
import { allSubjects } from "./homeData";

export const SubjectRibbon = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);

    const half = Math.ceil(allSubjects.length / 2);
    const rows = [allSubjects.slice(0 , half) , allSubjects.slice(half)];

    const openSubject = (subject) =>{
        if(user && user.role === "student") Navigate(`/student?subject=${encodeURIComponent(subject)}`);
        else dispatch(openLoginPopup("student"));
    }

    const chip = (subject , key) =>{
        const colors = subjectColor(subject);
        let hidden = undefined;
        let tabIndex = 0;
        if(key.startsWith("b")){
            hidden = true;
            tabIndex = -1;
        }
        return (
            <li key={key} className="shrink-0" aria-hidden={hidden}>
                <button onClick={() => openSubject(subject)} tabIndex={tabIndex}
                    className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full border bg-white hover:shadow-md"
                    style={{borderColor:`${colors.fg}33`}}>
                    <SubjectIcon subject={subject} size="w-8 h-8" iconSize="w-4 h-4" rounded="rounded-full"/>
                    <span className="text-sm font-medium whitespace-nowrap">{subject}</span>
                </button>
            </li>
        )
    }

    return (
        <section id="subjects" className="scroll-mt-20 pt-16 md:pt-20">
            <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
                <h2 className="text-3xl md:text-[2.6rem] leading-tight font-semibold">Whatever you&apos;re studying, the notes are here</h2>
                <p className="text-muted mt-3 text-lg">Tap a subject to open its notes.</p>
            </div>

            <div className="marquee-wrap fade-edges mt-10 flex flex-col gap-3 overflow-hidden">
                {rows.map((row , rowIndex) =>{
                    let rowClass = "flex gap-3 w-max marquee-reverse";
                    if(rowIndex === 0) rowClass = "flex gap-3 w-max marquee";
                    return (
                        <ul key={rowIndex} className={rowClass}>
                            {row.map((subject) => chip(subject , `a-${subject}`))}
                            {row.map((subject) => chip(subject , `b-${subject}`))}
                        </ul>
                    )
                })}
            </div>
        </section>
    )
}
