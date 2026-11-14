import { Modal } from "./Modal";

// a small "Are you sure?" popup with Cancel and a confirm button
// used for every destructive or permission-changing action
export const ConfirmDialog = ({title , message , confirmText , tone = "danger" , loading , onConfirm , onClose}) =>{
    // red button for dangerous actions, blue for the rest
    let confirmClass = "px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 bg-primary hover:bg-primary-hover";
    if(tone === "danger"){
        confirmClass = "px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 bg-bad hover:bg-bad/90";
    }

    let buttonText = confirmText;
    if(loading){
        buttonText = "Working...";
    }

    return (
        <Modal title={title} onClose={onClose} width="max-w-md">
            <p className="text-sm text-muted leading-relaxed">{message}</p>
            <div className="flex justify-end gap-2 mt-6">
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-line text-sm font-medium hover:bg-canvas">Cancel</button>
                <button onClick={onConfirm} disabled={loading} className={confirmClass}>
                    {buttonText}
                </button>
            </div>
        </Modal>
    )
}
