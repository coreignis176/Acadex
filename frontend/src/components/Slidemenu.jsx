import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { openLoginPopup, toggleSlideMenu } from "../store/slice/UserSlice";
import { homePortal, publicLinks } from "./portal/portalLinks";

// mobile right-side drawer for the public pages
export const Slidemenu = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);

    //$ function to close the drawer (its open / closed state is kept in Redux)
    const close = () => dispatch(toggleSlideMenu());

    //$ function to close the drawer and open the user's portal
    const handleOpenPortal = () =>{
        close();
        Navigate(homePortal(user));
    }

    //$ function to close the drawer and open the login popup
    const handleLogin = () =>{
        close();
        dispatch(openLoginPopup("student"));
    }

    // logged in -> "Open my portal", otherwise "Log in"
    let bottomButton = <button onClick={handleLogin} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium">Log in</button>;
    if(user){
        bottomButton = <button onClick={handleOpenPortal} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium">Open my portal</button>;
    }

    return (
        <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-ink/40" onClick={close}/>
            <div className="absolute inset-y-0 right-0 w-72 bg-white shadow-xl flex flex-col">
                <div className="flex items-center justify-between px-5 h-16 border-b border-line">
                    <span className="font-serif text-lg font-semibold">Menu</span>
                    <button onClick={close} aria-label="Close menu" className="p-1.5 rounded-md hover:bg-canvas"><IoClose className="w-5 h-5"/></button>
                </div>
                <nav className="flex flex-col p-3" aria-label="Mobile">
                    {publicLinks.map((item) => (
                        <NavLink key={item.label} to={item.href} onClick={close} className="px-3 py-2.5 rounded-lg hover:bg-canvas">
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-auto p-4 border-t border-line">
                    {bottomButton}
                </div>
            </div>
        </div>
    )
}
