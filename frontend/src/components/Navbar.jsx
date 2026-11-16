import { useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LuMenu } from "react-icons/lu";
import { AuthPage } from "./AuthPage";
import { Slidemenu } from "./Slidemenu";
import { openLoginPopup, toggleSlideMenu } from "../store/slice/UserSlice";
import { homePortal, publicLinks } from "./portal/portalLinks";
import { initials } from "../utils/format";

const Navbar = () =>{
    const Navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const LoginPopup = useSelector((state) => state.user.loginPopup);
    const slideMenu = useSelector((state) => state.user.slideMenu);

    useEffect(() =>{
        if(location.state && location.state.login){
            dispatch(openLoginPopup(location.state.login));
            Navigate(location.pathname , {replace:true , state:null});
        }
    },[location.state , location.pathname , dispatch , Navigate]);

    useEffect(() =>{
        if(location.hash){
            const id = location.hash.slice(1);
            const section = document.getElementById(id);
            if(section){
                section.scrollIntoView({behavior:"smooth"});
            }
        }
    },[location.hash]);

    const linkClass = (item , isActive) =>{
        const isCurrentPage = isActive && !item.href.includes("#") && !location.hash;
        if(isCurrentPage){
            return "py-1 border-b-2 border-primary text-ink font-medium";
        }
        return "py-1 border-b-2 border-transparent text-muted hover:text-ink";
    }

    const handleLogin = () => dispatch(openLoginPopup("student"));

    const handleOpenPortal = () => Navigate(homePortal(user));

    let accountButton = (
        <button onClick={handleLogin} className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium">
            Log in
        </button>
    );
    if(user){
        accountButton = (
            <button onClick={handleOpenPortal} className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full border border-line bg-white hover:border-primary/40">
                <span className="w-7 h-7 rounded-full bg-primary-soft text-primary text-xs font-semibold flex items-center justify-center">{initials(user.name)}</span>
                <span className="text-sm font-medium">Open my portal</span>
            </button>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur border-b border-line">
                <div className="max-w-6xl mx-auto h-16 px-4 md:px-6 flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src="/logo.svg" alt="" className="w-8 h-8"/>
                        <span className="font-serif text-xl font-semibold tracking-tight">Acadex</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Main">
                        {publicLinks.map((item) => (
                            <NavLink key={item.label} to={item.href} end
                                className={({isActive}) => linkClass(item , isActive)}>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        {accountButton}
                        <button onClick={() => dispatch(toggleSlideMenu())} aria-label="Open menu" className="md:hidden p-2 -mr-2 rounded-md hover:bg-white">
                            <LuMenu className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </header>

            {slideMenu && <Slidemenu/>}
            {LoginPopup && <AuthPage/>}
        </>
    )
}

export default Navbar;
