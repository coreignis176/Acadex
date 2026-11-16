import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LuKeyRound, LuLogOut } from "react-icons/lu";
import { PiSealCheckFill } from "react-icons/pi";
import { portalLinks } from "./portalLinks";
import { toggleSidebar } from "../../store/slice/PortalSlice";
import { useGetnotificationsQuery, useGetsectionnotesQuery } from "../../store/Api/Api";
import { useAccountActions } from "./useAccountActions";
import { initials } from "../../utils/format";

const HierarchyPath = ({section}) =>{
    if(!section) return (
        <p className="text-xs text-muted px-1">Not assigned to a section</p>
    );
    const rows = [section.course , section.yearLabel , section.name];
    return (
        <ol aria-label="Your section" className="text-sm">
            {rows.map((row , index) =>{
                let rowClass = "text-muted";
                if(index === rows.length - 1){
                    rowClass = "font-semibold text-ink";
                }
                return (
                    <li key={row} className="flex items-center" style={{paddingLeft:`${index * 14}px`}}>
                        {index > 0 && <span aria-hidden="true" className="w-2.5 h-3 border-l border-b border-muted/40 rounded-bl-sm mr-1.5 -mt-2.5"/>}
                        <span className={rowClass}>{row}</span>
                    </li>
                )
            })}
        </ol>
    )
}

const SidebarLink = ({item , count , onClick}) =>{
    const Icon = item.icon;

    let badgeClass = "min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center bg-primary text-white";
    if(item.badge === "approvals"){
        badgeClass = "min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center bg-wait text-white";
    }

    const linkClass = ({isActive}) =>{
        if(isActive){
            return "relative flex items-center gap-3 px-3 py-2 rounded-lg text-[0.95rem] bg-primary-soft text-primary font-medium";
        }
        return "relative flex items-center gap-3 px-3 py-2 rounded-lg text-[0.95rem] text-ink/75 hover:bg-canvas hover:text-ink";
    }

    const linkContent = ({isActive}) => (
        <>
            {isActive && <span aria-hidden="true" className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary"/>}
            <Icon className="w-[18px] h-[18px] shrink-0"/>
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
                <span className={badgeClass}>
                    {count}
                </span>
            )}
        </>
    );

    return (
        <li>
            <NavLink to={item.to} end={item.end} onClick={onClick} className={linkClass}>
                {linkContent}
            </NavLink>
        </li>
    )
}

export const Sidebar = ({portal}) =>{
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);

    const notificationsResult = useGetnotificationsQuery();
    const sectionNotesResult = useGetsectionnotesQuery(undefined , {skip:portal !== "cr"});
    const {handleLogout , handleChangePassword} = useAccountActions();

    let userName;
    let section;
    let isAdmin = false;
    let isCr = false;
    let accountLine;
    if(user){
        userName = user.name;
        section = user.section;
        isAdmin = user.role === "admin";
        isCr = user.role === "student" && user.crStatus === "active";
        accountLine = user.rollNo;
        if(isAdmin) accountLine = user.email;
    }

    let unreadCount = 0;
    if(notificationsResult.data && notificationsResult.data.data){
        unreadCount = notificationsResult.data.data.filter((item) => !item.read).length;
    }
    let approvalsCount = 0;
    if(sectionNotesResult.data && sectionNotesResult.data.data){
        approvalsCount = sectionNotesResult.data.data.filter((note) => note.status === "pending").length;
    }
    const badges = {
        unread:unreadCount,
        approvals:approvalsCount
    };

    const close = () => dispatch(toggleSidebar(false));

    let sectionText = "Not in a section yet";
    if(section) sectionText = `Section ${section.name}`;

    let infoBox;
    if(isAdmin){
        infoBox = (
            <>
                <p className="text-sm font-semibold">Admin portal</p>
                <p className="text-xs text-muted mt-0.5">B.Tech and BBA, every section</p>
            </>
        );
    }
    else if(portal === "cr"){
        infoBox = <HierarchyPath section={section}/>;
    }
    else{
        infoBox = (
            <>
                <p className="text-xs text-muted">Your class</p>
                <p className="text-sm font-semibold mt-0.5">{sectionText}</p>
            </>
        );
    }

    let studentTabClass = "text-center py-1.5 rounded-md text-muted hover:text-ink";
    if(portal === "student"){
        studentTabClass = "text-center py-1.5 rounded-md bg-white shadow-sm font-medium text-ink";
    }
    let crTabClass = "text-center py-1.5 rounded-md inline-flex items-center justify-center gap-1 text-muted hover:text-ink";
    if(portal === "cr"){
        crTabClass = "text-center py-1.5 rounded-md inline-flex items-center justify-center gap-1 bg-white shadow-sm font-medium text-seal";
    }

    let avatarClass = "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-primary-soft text-primary";
    if(isCr){
        avatarClass = "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-seal-soft text-seal";
    }

    return (
        <aside className="h-full w-[264px] bg-white border-r border-line flex flex-col">

            <div className="px-5 pt-5 pb-4">
                <NavLink to="/" className="flex items-center gap-2.5" onClick={close}>
                    <img src="/logo.svg" alt="" className="w-8 h-8"/>
                    <span className="font-serif text-xl font-semibold tracking-tight">Acadex</span>
                </NavLink>
            </div>

            {isCr && (
                <div className="mx-4 mb-3 grid grid-cols-2 p-1 rounded-lg bg-canvas border border-line text-sm" role="tablist" aria-label="Switch portal">
                    <NavLink to="/student" onClick={close} className={() => studentTabClass}>Student</NavLink>
                    <NavLink to="/cr" onClick={close} className={() => crTabClass}>
                        <PiSealCheckFill className="w-3.5 h-3.5"/> CR
                    </NavLink>
                </div>
            )}

            <div className="mx-4 mb-4 px-3 py-3 rounded-lg bg-canvas border border-line">
                {infoBox}
            </div>

            <nav className="flex-1 overflow-y-auto thin-scroll px-3" aria-label="Portal">
                <ul className="flex flex-col gap-0.5">
                    {portalLinks[portal].map((item) =>{
                        let count = 0;
                        if(item.badge) count = badges[item.badge];
                        return <SidebarLink key={item.to} item={item} count={count} onClick={close}/>;
                    })}
                </ul>
            </nav>

            <div className="border-t border-line p-4">
                <div className="flex items-center gap-3">
                    <div className={avatarClass}>
                        {initials(userName)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{userName}</p>
                        <p className="text-xs text-muted truncate">{accountLine}</p>
                    </div>
                    <button onClick={handleLogout} aria-label="Log out" title="Log out" className="p-2 rounded-md text-muted hover:text-bad hover:bg-bad-soft">
                        <LuLogOut className="w-4 h-4"/>
                    </button>
                </div>
                <button onClick={handleChangePassword} className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary">
                    <LuKeyRound className="w-3.5 h-3.5"/> Change password
                </button>
            </div>
        </aside>
    )
}
