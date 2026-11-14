import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { homePortal } from "../components/portal/portalLinks";

// the "404" page shown when the URL does not match any route
export const NotFound = () =>{
    const Navigate = useNavigate();
    const user = useSelector((state) => state.user.user);
    return (
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
            <p className="font-serif text-7xl font-semibold text-primary/25">404</p>
            <h1 className="text-3xl font-semibold mt-4">This page doesn&apos;t exist</h1>
            <p className="text-muted mt-2">The link may be old, or the page may have moved.</p>
            <div className="flex justify-center gap-3 mt-8">
                <button onClick={() => Navigate("/")} className="px-4 py-2 rounded-lg border border-line bg-white font-medium hover:border-primary/40">Go to home</button>
                {user && <button onClick={() => Navigate(homePortal(user))} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium">Open my portal</button>}
            </div>
        </main>
    )
}
