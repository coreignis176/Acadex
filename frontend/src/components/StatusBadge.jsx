import { PiSealCheckFill } from "react-icons/pi";

const STYLES = {
    approved:"bg-ok-soft text-ok",
    pending:"bg-wait-soft text-wait",
    rejected:"bg-bad-soft text-bad",
    student:"bg-canvas text-muted border border-line",
    member:"bg-ok-soft text-ok",
    archived:"bg-canvas text-muted border border-line"
};

const LABELS = {approved:"Approved" , pending:"Pending" , rejected:"Rejected" , student:"Student" , member:"Member" , archived:"Archived"};

export const StatusBadge = ({status , label}) =>{
    let colours = STYLES.student;
    if(STYLES[status]){
        colours = STYLES[status];
    }
    const badgeClass = "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap " + colours;

    let text = status;
    if(label){
        text = label;
    }
    else if(LABELS[status]){
        text = LABELS[status];
    }

    return (
        <span className={badgeClass}>
            {text}
        </span>
    )
}

export const RoleBadge = ({crStatus}) =>{
    if(crStatus === "active") return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-seal-soft text-seal whitespace-nowrap">
            <PiSealCheckFill className="w-3.5 h-3.5"/> CR
        </span>
    );
    if(crStatus === "pending") return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border border-dashed border-seal/60 text-seal whitespace-nowrap">
            CR, awaiting confirmation
        </span>
    );
    return <StatusBadge status="student"/>;
}
