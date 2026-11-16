import { subjectColor, subjectIcon } from "../utils/subjects";

export const SubjectIcon = ({subject , size = "w-10 h-10" , iconSize = "w-5 h-5" , rounded = "rounded-lg"}) =>{
    const color = subjectColor(subject);
    const Icon = subjectIcon(subject);
    const boxClass = size + " " + rounded + " shrink-0 inline-flex items-center justify-center";
    return (
        <span aria-hidden="true" className={boxClass} style={{background:color.bg , color:color.fg}}>
            <Icon className={iconSize}/>
        </span>
    )
}
