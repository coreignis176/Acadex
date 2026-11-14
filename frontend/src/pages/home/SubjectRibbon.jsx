import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SubjectIcon } from "../../components/SubjectIcon";
import { openLoginPopup } from "../../store/slice/UserSlice";
import { subjectColor } from "../../utils/subjects";
import { allSubjects } from "./homeData";

// two endless rows of subject chips - "whatever you study, it's here"
export const SubjectRibbon = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);

    // split the subjects into two rows: the first half and the second half
    const half = Math.ceil(allSubjects.length / 2);
    const rows = [allSubjects.slice(0 , half) , allSubjects.slice(half)];

    //$ function to open a subject's notes
    const openSubject = (subject) =>{
        if(user && user.role === "student") Navigate(`/student?subject=${encodeURIComponent(subject)}`);
        else dispatch(openLoginPopup("student"));
    }

    // one subject chip; keys starting with "b" are the duplicate copy used for the endless scroll
    const chip = (subject , key) =>{
        const colors = subjectColor(subject);
        // the copy is hidden from screen readers and skipped by the Tab key
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
                {/* the first row scrolls left, the second row scrolls right */}
                {rows.map((row , rowIndex) =>{
                    let rowClass = "flex gap-3 w-max marquee-reverse";
                    if(rowIndex === 0) rowClass = "flex gap-3 w-max marquee";
                    return (
                        <ul key={rowIndex} className={rowClass}>
                            {row.map((subject) => chip(subject , `a-${subject}`))}
                            {/* duplicate for a seamless loop (hidden from screen readers) */}
                            {row.map((subject) => chip(subject , `b-${subject}`))}
                        </ul>
                    )
                })}
            </div>
        </section>
    )
}
