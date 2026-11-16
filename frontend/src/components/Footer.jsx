import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { openLoginPopup } from "../store/slice/UserSlice";

export const Footer = () =>{
    const dispatch = useDispatch();
    return (
        <footer className="border-t border-line bg-white mt-24">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
                <div>
                    <div className="flex items-center gap-2.5">
                        <img src="/logo.svg" alt="" className="w-8 h-8"/>
                        <span className="font-serif text-xl font-semibold">Acadex</span>
                    </div>
                    <p className="text-sm text-muted mt-3 max-w-sm leading-relaxed">
                        Your academic journey, organized. Find, share and download notes for your course in one place.
                    </p>
                </div>
                <div>
                    <p className="text-sm font-semibold mb-3">Explore</p>
                    <ul className="flex flex-col gap-2 text-sm text-muted">
                        <li><Link to="/#features" className="hover:text-primary">Features</Link></li>
                        <li><Link to="/#subjects" className="hover:text-primary">Browse subjects</Link></li>
                        <li><Link to="/about" className="hover:text-primary">About Acadex</Link></li>
                    </ul>
                </div>
                <div>
                    <p className="text-sm font-semibold mb-3">Account</p>
                    <ul className="flex flex-col gap-2 text-sm text-muted">
                        <li><button onClick={() => dispatch(openLoginPopup("student"))} className="hover:text-primary">Student login</button></li>
                        <li><button onClick={() => dispatch(openLoginPopup("cr"))} className="hover:text-primary">CR login</button></li>
                        <li><button onClick={() => dispatch(openLoginPopup("admin"))} className="hover:text-primary">Admin login</button></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-line">
                <p className="max-w-6xl mx-auto px-4 md:px-6 py-4 text-xs text-muted">
                    Acadex. Made for students who share notes.
                </p>
            </div>
        </footer>
    )
}
