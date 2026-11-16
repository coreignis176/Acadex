import { useEffect } from "react";
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

export const PortalLayout = ({portal}) =>{
    const Navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const sidebar = useSelector((state) => state.portal.sidebar);
    const notePopup = useSelector((state) => state.portal.notePopup);
    const passwordPopup = useSelector((state) => state.portal.passwordPopup);
    const {data , isLoading} = useGetmeQuery(undefined , {skip:!user});

    useEffect(() =>{
        dispatch(setSectionPopup(false));
        dispatch(setStudentPopup(false));
        dispatch(toggleSidebar(false));
        dispatch(setPasswordPopup(false));
    },[location.pathname , dispatch]);

    useEffect(() =>{
        if(data && data.success && data.data){
            dispatch(setUser(data.data));
        }
    },[data , dispatch]);

    if(!user) return <Redirect to="/" replace state={{login:portal}}/>;
    if(portal === "admin" && user.role !== "admin") return <Redirect to={homePortal(user)} replace/>;
    if(portal !== "admin" && user.role !== "student") return <Redirect to={homePortal(user)} replace/>;

    const crBlocked = portal === "cr" && !isLoading && user.crStatus !== "active";
    const closePasswordPopup = () => dispatch(setPasswordPopup(false));

    let page = <Outlet/>;
    if(isLoading){
        page = <Loader/>;
    }
    else if(crBlocked){
        let description = "Only confirmed Class Representatives can open the CR portal. Your student portal is still available.";
        if(user.crStatus === "pending") description = "Confirm your CR appointment from your notifications to open the CR portal.";
        page = <NoData icon={<PiSealCheck/>} message="The CR portal is not available" description={description}
                    buttonText="Go to student portal" onClick={() => Navigate("/student")}/>;
    }

    return (
        <div className="min-h-screen bg-canvas lg:pl-[264px]">

            <div className="hidden lg:block fixed inset-y-0 left-0 z-40">
                <Sidebar portal={portal}/>
            </div>

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

            {notePopup && portal !== "admin" && <NotePopup/>}

            {passwordPopup && (
                <Modal title="Change password" description="Choose a password with at least 8 characters, a letter and a number." onClose={closePasswordPopup}>
                    <ChangePassword onDone={closePasswordPopup}/>
                </Modal>
            )}
        </div>
    )
}
