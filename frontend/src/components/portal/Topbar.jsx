import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LuBell, LuKeyRound, LuLogOut, LuMenu } from "react-icons/lu";
import { PiSealCheckFill } from "react-icons/pi";
import toast from "react-hot-toast";
import { toggleSidebar } from "../../store/slice/PortalSlice";
import { useGetnotificationsQuery, useMarknotificationsreadMutation } from "../../store/Api/Api";
import { NotificationList } from "../NotificationList";
import { portalNames } from "./portalLinks";
import { useAccountActions } from "./useAccountActions";
import { initials } from "../../utils/format";

// closes a dropdown when clicking outside it (same pattern as PetCare Navbar)
// ref = the dropdown's box on the page, close = the function that hides it
const useOutsideClose = (ref , close) =>{
    // listens to every mouse click on the page while the top bar is shown
    useEffect(() =>{
        const handle = (event) =>{
            // the click was somewhere outside the box -> close it
            if(ref.current && !ref.current.contains(event.target)) close();
        };
        document.addEventListener("mousedown" , handle);

        // cleanup: stop listening (runs before the effect runs again, and when the top bar goes away)
        return () => document.removeEventListener("mousedown" , handle);
    },[ref , close]);
}

// small red number on the bell (shows "9+" for 10 or more, nothing for 0)
const Badge = ({count , tone = "bg-bad"}) =>{
    if(count > 0){
        const badgeClass = "absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full " + tone + " text-white text-[10px] font-semibold flex items-center justify-center";
        let text = count;
        if(count > 9) text = "9+";
        return (
            <span className={badgeClass}>
                {text}
            </span>
        )
    }
    return null;
}

// the bar at the top of a portal: menu button, portal name, notifications bell and profile menu
export const Topbar = ({portal}) =>{
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const [bellOpen , setBellOpen] = useState(false);      // true = the notifications dropdown is open
    const [menuOpen , setMenuOpen] = useState(false);      // true = the profile dropdown is open
    // a ref points at a box on the page, so we can check if a click happened inside it
    const bellRef = useRef(null);
    const menuRef = useRef(null);
    // ask the server for new notifications every 15 seconds
    const {data} = useGetnotificationsQuery(undefined , {pollingInterval:15000});
    const [markread] = useMarknotificationsreadMutation();
    const {handleLogout , handleChangePassword} = useAccountActions();

    // close each dropdown when the user clicks somewhere else
    useOutsideClose(bellRef , () => setBellOpen(false));
    useOutsideClose(menuRef , () => setMenuOpen(false));

    let notifications = [];
    if(data && data.data){
        notifications = data.data;
    }
    const unread = notifications.filter((item) => !item.read).length;

    // details of the logged-in user (empty when nobody is logged in)
    let userName;
    let rollNo;
    let email;
    let section;
    let classRollNo;
    let isAdmin = false;
    let isCr = false;          // a student who is a confirmed Class Representative
    if(user){
        userName = user.name;
        rollNo = user.rollNo;
        email = user.email;
        section = user.section;
        classRollNo = user.classRollNo;
        isAdmin = user.role === "admin";
        isCr = user.role === "student" && user.crStatus === "active";
    }

    // the second line of the profile menu: admins see their email, students their roll number
    let accountLine = `College roll ${rollNo}`;
    if(isAdmin) accountLine = email;

    //$ function to mark everything as read
    const handleMarkAll = async () =>{
        try{
            const result = await markread({}).unwrap();
            toast.success(result.message);
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Update Notifications");
        }
    }

    //$ function to close the profile menu and open the change password form
    const handleChangePasswordClick = () =>{
        setMenuOpen(false);
        handleChangePassword();
    }

    const iconButton = "relative p-2 rounded-lg hover:bg-white text-ink/80";

    // CRs can jump between the student portal and the CR portal
    let switchTo = "/cr";
    let switchText = "Switch to CR portal";
    if(portal === "cr"){
        switchTo = "/student";
        switchText = "Switch to student portal";
    }

    // CRs have a bronze circle, everyone else a blue one
    let avatarClass = "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ring-offset-2 hover:ring-2 hover:ring-primary/30 bg-primary-soft text-primary";
    if(isCr){
        avatarClass = "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ring-offset-2 hover:ring-2 hover:ring-primary/30 bg-seal-soft text-seal";
    }

    // the newest 6 notifications, or a message when there are none
    let bellList = <p className="px-4 py-8 text-center text-sm text-muted">You have no notifications yet.</p>;
    if(notifications.length > 0){
        bellList = <NotificationList items={notifications.slice(0 , 6)} compact/>;
    }

    return (
        <header className="sticky top-0 z-30 h-16 bg-canvas/90 backdrop-blur border-b border-line flex items-center gap-3 px-4 md:px-8">
            <button onClick={() => dispatch(toggleSidebar())} aria-label="Open menu" className="lg:hidden p-2 -ml-2 rounded-md hover:bg-white">
                <LuMenu className="w-5 h-5"/>
            </button>
            <p className="font-medium text-ink/80">{portalNames[portal]}</p>

            <div className="ml-auto flex items-center gap-1.5">

                {/* notifications */}
                <div className="relative" ref={bellRef}>
                    <button onClick={() => setBellOpen(!bellOpen)} aria-label={`Notifications, ${unread} unread`} aria-expanded={bellOpen} className={iconButton}>
                        <LuBell className="w-5 h-5"/>
                        <Badge count={unread}/>
                    </button>

                    {bellOpen && (
                        <div className="absolute right-0 mt-2 w-[min(380px,calc(100vw-2rem))] bg-white border border-line rounded-xl shadow-lg overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                                <p className="font-semibold text-sm">Notifications</p>
                                {unread > 0 && <button onClick={handleMarkAll} className="text-xs text-primary hover:underline">Mark all as read</button>}
                            </div>
                            <div className="max-h-[360px] overflow-y-auto thin-scroll">
                                {bellList}
                            </div>
                            <Link to={`/${portal}/notifications`} onClick={() => setBellOpen(false)} className="block text-center text-sm font-medium text-primary py-2.5 border-t border-line hover:bg-canvas">
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>

                {/* profile menu */}
                <div className="relative ml-1" ref={menuRef}>
                    <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Profile menu" aria-expanded={menuOpen}
                        className={avatarClass}>
                        {initials(userName)}
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-line rounded-xl shadow-lg overflow-hidden">
                            <div className="px-4 py-4 border-b border-line">
                                <p className="font-semibold flex items-center gap-1.5">
                                    {userName}
                                    {isCr && <PiSealCheckFill className="w-4 h-4 text-seal" title="Class Representative"/>}
                                </p>
                                <p className="text-sm text-muted">{accountLine}</p>
                                {section && (
                                    <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                        <div><dt className="text-muted">Course</dt><dd className="font-medium">{section.course}</dd></div>
                                        <div><dt className="text-muted">Year</dt><dd className="font-medium">{section.yearLabel}</dd></div>
                                        <div><dt className="text-muted">Section</dt><dd className="font-medium">{section.name}</dd></div>
                                    </dl>
                                )}
                                {classRollNo && section && <p className="text-xs text-muted mt-2">Class roll number {classRollNo}</p>}
                            </div>
                            <div className="p-1.5">
                                {isCr && (
                                    <Link to={switchTo} onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-canvas">
                                        <PiSealCheckFill className="w-4 h-4 text-seal"/> {switchText}
                                    </Link>
                                )}
                                <button onClick={handleChangePasswordClick} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-canvas text-left">
                                    <LuKeyRound className="w-4 h-4 text-muted"/> Change password
                                </button>
                                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-bad-soft hover:text-bad text-left">
                                    <LuLogOut className="w-4 h-4"/> Log out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
