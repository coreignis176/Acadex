import { useEffect } from "react";
// <Navigate> is renamed to <Redirect> here because the name "Navigate" is used below for useNavigate()
import { Navigate as Redirect, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PiSealCheck } from "react-icons/pi";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { homePortal } from "./portalLinks";
import { setPasswordPopup, setSectionPopup, setStudentPopup, toggleSidebar } from "../../store/slice/PortalSlice";
import { setUser } from "../../store/slice/UserSlice";
import { useGetmeQuery } from "../../store/Api/Api";
import { Loader } from "../Loader";
import { NoData } from "../NoData";
import { NotePopup } from "../NotePopup";
import { Modal } from "../Modal";
import { ChangePassword } from "../ChangePassword";

// portal = "admin" | "cr" | "student"
// guards the route, keeps the logged-in user fresh, and renders sidebar + topbar + page
export const PortalLayout = ({portal}) =>{
    const Navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const sidebar = useSelector((state) => state.portal.sidebar);
    const notePopup = useSelector((state) => state.portal.notePopup);
    const passwordPopup = useSelector((state) => state.portal.passwordPopup);
    // ask the server for the latest copy of the logged-in user (skipped when nobody is logged in)
    const {data , isLoading} = useGetmeQuery(undefined , {skip:!user});

    // a new page never inherits a form popup or the open drawer from the last one
    // runs every time the address (pathname) changes
    useEffect(() =>{
        dispatch(setSectionPopup(false));
        dispatch(setStudentPopup(false));
        dispatch(toggleSidebar(false));
        dispatch(setPasswordPopup(false));
    },[location.pathname , dispatch]);

    // CR status / section can change at any time (admin action, confirmation)
    // runs when fresh user data arrives -> save it in Redux so every component sees the new values
    useEffect(() =>{
        if(data && data.success && data.data){
            dispatch(setUser(data.data));
        }
    },[data , dispatch]);

    // route guard: nobody logged in -> go home and open the login popup;
    // wrong kind of user for this portal -> go to their own portal
    if(!user) return <Redirect to="/" replace state={{login:portal}}/>;
    if(portal === "admin" && user.role !== "admin") return <Redirect to={homePortal(user)} replace/>;
    if(portal !== "admin" && user.role !== "student") return <Redirect to={homePortal(user)} replace/>;

    // the CR portal is closed to students who are not confirmed CRs
    const crBlocked = portal === "cr" && !isLoading && user.crStatus !== "active";
    const closePasswordPopup = () => dispatch(setPasswordPopup(false));

    // what the main area shows
    let page = <Outlet/>;
    if(isLoading){
        page = <Loader/>;
    }
    else if(user.mustChangePassword){
        // still on the default password -> nothing else works until a new one is chosen
        page = (
            <div className="max-w-md mx-auto bg-white border border-line rounded-2xl p-6 md:p-8">
                <h1 className="text-2xl font-semibold">Choose your own password</h1>
                <p className="text-sm text-muted mt-1 mb-6">
                    You are using the default password the college gave you. Pick a new one that only you know before you continue.
                </p>
                <ChangePassword/>
            </div>
        );
    }
    else if(crBlocked){
        let description = "Only confirmed Class Representatives can open the CR portal. Your student portal is still available.";
        if(user.crStatus === "pending") description = "Confirm your CR appointment from your notifications to open the CR portal.";
        page = <NoData icon={<PiSealCheck/>} message="The CR portal is not available" description={description}
                    buttonText="Go to student portal" onClick={() => Navigate("/student")}/>;
    }

    return (
        <div className="min-h-screen bg-canvas lg:pl-[264px]">

            {/* desktop sidebar */}
            <div className="hidden lg:block fixed inset-y-0 left-0 z-40">
                <Sidebar portal={portal}/>
            </div>

            {/* mobile drawer */}
            {sidebar && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-ink/40" onClick={() => dispatch(toggleSidebar(false))}/>
                    <div className="absolute inset-y-0 left-0 shadow-xl">
                        <Sidebar portal={portal}/>
                    </div>
                </div>
            )}

            <Topbar portal={portal}/>

            <main className="px-4 md:px-8 py-6 md:py-8 max-w-[1240px]">
                {page}
            </main>

            {/* notes form is opened from several student / CR pages */}
            {notePopup && portal !== "admin" && <NotePopup/>}

            {/* "Change password" from the menu */}
            {passwordPopup && !user.mustChangePassword && (
                <Modal title="Change password" description="Choose a password with at least 8 characters, a letter and a number." onClose={closePasswordPopup}>
                    <ChangePassword onDone={closePasswordPopup}/>
                </Modal>
            )}
        </div>
    )
}
