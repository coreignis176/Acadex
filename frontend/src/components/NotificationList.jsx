import { useState } from "react";
import toast from "react-hot-toast";
import { LuBookOpen, LuLayers, LuUsersRound, LuUser } from "react-icons/lu";
import { PiSealCheck } from "react-icons/pi";
import { useMarknotificationsreadMutation, useRespondcrMutation } from "../store/Api/Api";
import { timeAgo } from "../utils/format";

// icon and colours for each kind of notification
const ICONS = {
    cr:{icon:PiSealCheck , tone:"bg-seal-soft text-seal"},
    notes:{icon:LuBookOpen , tone:"bg-primary-soft text-primary"},
    section:{icon:LuLayers , tone:"bg-canvas text-muted"},
    student:{icon:LuUser , tone:"bg-canvas text-muted"},
    group:{icon:LuUsersRound , tone:"bg-ok-soft text-ok"}
};

// Confirm / Not me buttons for the "Admin has identified you as CR" notification
export const CrConfirmActions = ({size = "md"}) =>{
    const [respondcr] = useRespondcrMutation();
    const [busy , setBusy] = useState(null);       // "yes" / "no" while sending, otherwise null

    //$ function to confirm or reject the CR appointment
    const handleRespond = async (accept) =>{
        try{
            if(accept){
                setBusy("yes");
            }
            else{
                setBusy("no");
            }
            const result = await respondcr({accept}).unwrap();
            if(result?.success) toast.success(result.message);
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Send Your Response");
        }
        finally{
            setBusy(null);
        }
    }

    // stopPropagation() stops the click from also reaching the notification row around these buttons
    //$ function for the "Confirm appointment" button
    const handleConfirm = (event) =>{
        event.stopPropagation();
        handleRespond(true);
    }

    //$ function for the "Not me" button
    const handleNotMe = (event) =>{
        event.stopPropagation();
        handleRespond(false);
    }

    // smaller buttons inside the bell dropdown
    let pad = "px-4 py-2 text-sm";
    if(size === "sm"){
        pad = "px-3 py-1.5 text-xs";
    }
    const confirmClass = pad + " rounded-lg bg-seal text-white font-medium hover:bg-seal/90 disabled:opacity-60";
    const notMeClass = pad + " rounded-lg border border-line bg-white font-medium hover:bg-canvas disabled:opacity-60";

    let confirmText = "Confirm appointment";
    if(busy === "yes") confirmText = "Confirming...";
    let notMeText = "Not me";
    if(busy === "no") notMeText = "Sending...";

    return (
        <div className="flex flex-wrap gap-2">
            <button onClick={handleConfirm} disabled={busy} className={confirmClass}>
                {confirmText}
            </button>
            <button onClick={handleNotMe} disabled={busy} className={notMeClass}>
                {notMeText}
            </button>
        </div>
    )
}

// one notification in the list: icon, title, time, message and (for CR appointments) the answer buttons
const NotificationItem = ({item , compact , onOpen}) =>{
    // unknown kinds use the grey "section" look
    let meta = ICONS.section;
    if(ICONS[item.type]){
        meta = ICONS[item.type];
    }
    const Icon = meta.icon;

    // compact rows have less space; unread rows have a light blue background
    let padding = "px-5 py-4";
    if(compact) padding = "px-4 py-3";
    let unreadClass = "";
    if(!item.read) unreadClass = "bg-primary-soft/40";
    const rowClass = "flex gap-3 " + padding + " " + unreadClass + " cursor-default";

    const iconClass = "w-9 h-9 shrink-0 rounded-lg flex items-center justify-center " + meta.tone;

    // unread titles are bolder
    let titleClass = "text-sm font-semibold";
    if(item.read) titleClass = "text-sm font-medium";

    // in compact mode the message is cut after two lines
    let clamp = "";
    if(compact) clamp = "line-clamp-2";
    const messageClass = "text-sm text-muted mt-0.5 " + clamp;

    // the "Admin has identified you as CR" notification gets Confirm / Not me buttons
    let isCrConfirm = false;
    if(item.action && item.action.kind === "cr-confirm"){
        isCrConfirm = true;
    }
    let buttonSize = "md";
    if(compact) buttonSize = "sm";

    return (
        <li>
            <div onClick={() => onOpen(item)} className={rowClass}>
                <div className={iconClass}>
                    <Icon className="w-[18px] h-[18px]"/>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <p className={titleClass}>{item.title}</p>
                        <span className="text-xs text-muted whitespace-nowrap">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className={messageClass}>{item.message}</p>
                    {isCrConfirm && (
                        <div className="mt-3"><CrConfirmActions size={buttonSize}/></div>
                    )}
                </div>
                {!item.read && <span aria-label="Unread" className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0"/>}
            </div>
        </li>
    )
}

// a list of notifications (compact = the smaller version used in the bell dropdown)
export const NotificationList = ({items , compact = false}) =>{
    const [markread] = useMarknotificationsreadMutation();

    //$ function to mark a notification as read when opened
    const handleOpen = (item) =>{
        if(!item.read) markread({id:item._id});
    }

    return (
        <ul className="divide-y divide-line">
            {items.map((item) => <NotificationItem key={item._id} item={item} compact={compact} onOpen={handleOpen}/>)}
        </ul>
    )
}
