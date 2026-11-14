// colours for each tone of the icon square
const TONES = {
    primary:"bg-primary-soft text-primary",
    seal:"bg-seal-soft text-seal",
    wait:"bg-wait-soft text-wait",
    ok:"bg-ok-soft text-ok"
};

// one number + its label; `hint` explains what the number means
export const StatCard = ({label , value , icon , hint , tone = "primary" , onClick}) =>{
    const iconClass = "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-lg " + TONES[tone];

    // the inside of the card is the same for the button and the box
    const content = (
        <>
            <div className={iconClass}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-semibold leading-tight tabular-nums">{value}</p>
                <p className="text-sm text-ink/80">{label}</p>
                {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
            </div>
        </>
    );

    // a button when it can be clicked
    if(onClick){
        return (
            <button onClick={onClick} className="w-full text-left bg-white border border-line rounded-xl p-4 flex items-start gap-3 hover:border-primary/40">
                {content}
            </button>
        )
    }

    // otherwise a plain box
    return (
        <div className="w-full text-left bg-white border border-line rounded-xl p-4 flex items-start gap-3 ">
            {content}
        </div>
    )
}
