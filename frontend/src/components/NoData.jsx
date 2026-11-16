import { LuInbox } from "react-icons/lu";

export const NoData = ({message , description , buttonText , onClick , icon , compact = false}) =>{
    let boxClass = "w-full flex flex-col items-center text-center py-20 px-6";
    if(compact){
        boxClass = "w-full flex flex-col items-center text-center py-10 px-6";
    }

    let shownIcon = <LuInbox/>;
    if(icon){
        shownIcon = icon;
    }

    return (
        <div className={boxClass}>
            <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xl mb-4">
                {shownIcon}
            </div>
            <h3 className="text-lg font-semibold text-ink">{message}</h3>
            {description && <p className="text-sm text-muted mt-1 max-w-md">{description}</p>}
            {buttonText && onClick && (
                <button onClick={onClick} className="mt-5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium">
                    {buttonText}
                </button>
            )}
        </div>
    )
}
