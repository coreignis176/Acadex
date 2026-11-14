import { useEffect } from "react";
import { IoClose } from "react-icons/io5";

// a popup window with a title, a close button and any content inside
// overlay pattern from PetCare: fixed inset-0 + blurred backdrop that closes on click
export const Modal = ({title , description , onClose , children , width = "max-w-lg"}) =>{

    // runs when the popup opens (and again if onClose changes):
    // the Escape key closes the popup and the page behind it stops scrolling
    useEffect(() =>{
        const onKey = (event) =>{
            if(event.key === "Escape") onClose();
        };
        document.addEventListener("keydown" , onKey);
        document.body.style.overflow = "hidden";

        // cleanup: runs when the popup closes -> remove the key listener and let the page scroll again
        return () =>{
            document.removeEventListener("keydown" , onKey);
            document.body.style.overflow = "";
        }
    },[onClose]);

    const windowClass = "relative w-full " + width + " bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto thin-scroll";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
            <div role="dialog" aria-modal="true" aria-label={title} className={windowClass}>
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
                    <div>
                        <h2 className="text-xl font-semibold">{title}</h2>
                        {description && <p className="text-sm text-muted mt-1">{description}</p>}
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-1.5 -mr-1.5 rounded-md text-muted hover:bg-canvas hover:text-ink">
                        <IoClose className="w-5 h-5"/>
                    </button>
                </div>
                <div className="px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    )
}
