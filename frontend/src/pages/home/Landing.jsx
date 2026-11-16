import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LuCheck, LuDownload, LuHeart, LuSearch, LuSparkles } from "react-icons/lu";
import { openLoginPopup } from "../../store/slice/UserSlice";
import { homePortal } from "../../components/portal/portalLinks";
import { SubjectIcon } from "../../components/SubjectIcon";
import { shortSubject, subjectColor } from "../../utils/subjects";
import { popularSearches, previewNotes } from "./homeData";

const Sticker = ({subject , className}) =>{
    const colors = subjectColor(subject);
    return (
        <span aria-hidden="true" className={`absolute z-[3] hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${className}`}
            style={{background:colors.bg , color:colors.fg}}>
            <SubjectIcon subject={subject} size="w-5 h-5" iconSize="w-3 h-3" rounded="rounded-full"/>
            {shortSubject(subject)}
        </span>
    )
}

const LibraryPreview = () =>{
    const chips = ["Data Structures" , "Object Oriented Programming (C++)" , "Database Management Systems"];
    return (
        <div className="relative mx-auto w-full max-w-[520px] pt-6 pb-12 sm:px-6">

            <Sticker subject="Marketing Management" className="-left-8 top-24 -rotate-6 float-slower"/>
            <Sticker subject="Machine Learning" className="-right-6 bottom-28 rotate-3 float-slow"/>
            <Sticker subject="Financial Accounting" className="left-10 -bottom-2 rotate-2 float-slow"/>

            <div className="relative z-[1] bg-white rounded-2xl shadow-[0_30px_60px_-20px_rgba(5,15,30,0.55)] overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-line">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-serif text-lg font-semibold leading-tight">My notes</p>
                            <p className="text-xs text-muted">5 subjects, 11 notes</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-ok-soft text-ok">5 new this week</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg border border-line bg-canvas text-sm text-muted">
                        <LuSearch className="w-4 h-4"/> linked list
                    </div>
                    <div className="mt-3 flex gap-2 overflow-hidden">
                        {chips.map((chip , index) =>{
                            const colors = subjectColor(chip);
                            const chipStyle = index === 0 ? {background:colors.fg , color:"#fff"} : {background:colors.bg , color:colors.fg};
                            return (
                                <span key={chip} className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium"
                                    style={chipStyle}>
                                    {shortSubject(chip)}
                                </span>
                            )
                        })}
                    </div>
                </div>
                <ul className="divide-y divide-line">
                    {previewNotes.map((note) => (
                        <li key={note.title} className="flex items-center gap-3 px-5 py-3.5">
                            <SubjectIcon subject={note.subject} size="w-10 h-10" rounded="rounded-xl"/>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">{note.title}</p>
                                <p className="text-xs text-muted flex items-center gap-1">
                                    by {note.by}
                                    <span className="ml-2 inline-flex items-center gap-1 text-[#a8395a]"><LuHeart className="w-3 h-3 fill-current"/>{note.likes}</span>
                                </p>
                            </div>
                            <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                                <LuDownload className="w-4 h-4"/>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="float-slow absolute z-[2] -top-3 right-0 sm:-right-4 w-[236px] bg-white rounded-xl shadow-xl p-3.5">
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-[#efeafb] text-[#5b46a8] text-xs font-semibold flex items-center justify-center">PN</span>
                    <div className="min-w-0">
                        <p className="text-xs text-muted">Priya, from your class, shared</p>
                        <p className="text-sm font-semibold truncate">Hashing - Collision Handling</p>
                    </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-ok">
                    <span className="w-4 h-4 rounded-full bg-ok text-white flex items-center justify-center"><LuCheck className="w-3 h-3"/></span>
                    Ready to download
                </div>
            </div>

            <div className="float-slower absolute z-[2] bottom-4 left-0 sm:-left-6 bg-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#fbe9ee] text-[#a8395a] flex items-center justify-center"><LuDownload className="w-4 h-4"/></span>
                <div>
                    <p className="text-sm font-semibold">Saved for exam week</p>
                    <p className="text-xs text-muted">Linked List notes, 2.4 MB</p>
                </div>
            </div>
        </div>
    )
}

const heroPoints = ["Sorted by subject" , "Quality-checked" , "Download anytime"];

const Landing = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const [query , setQuery] = useState("");

    const handleSearch = (text) =>{
        let searchText = query;
        if(text !== undefined) searchText = text;
        const trimmedText = searchText.trim();

        if(user && user.role === "student"){
            let url = "/student";
            if(trimmedText) url = `/student?q=${encodeURIComponent(trimmedText)}`;
            Navigate(url);
        }
        else if(user) Navigate(homePortal(user));
        else dispatch(openLoginPopup("student"));
    }

    const handleSubmit = (event) =>{
        event.preventDefault();
        handleSearch();
    }

    return (
        <section className="px-2 sm:px-4 pt-3">
            <div className="relative bg-night dot-grid rounded-[28px] overflow-hidden">
                <div aria-hidden="true" className="absolute -right-40 -top-40 w-[620px] h-[620px] rounded-full bg-night-soft blur-3xl opacity-80"/>
                <div aria-hidden="true" className="absolute -left-32 bottom-[-220px] w-[460px] h-[460px] rounded-full bg-[#2b5d9e]/25 blur-3xl"/>

                <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-14 md:pt-20 pb-14 md:pb-20 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-chalk/20 text-chalk text-sm">
                            <LuSparkles className="w-3.5 h-3.5 text-[#f2c879]"/>
                            Made for students who share
                        </span>
                        <h1 className="font-serif text-white text-[2.5rem] leading-[1.06] sm:text-[3.2rem] md:text-[3.9rem] font-semibold mt-6 max-w-xl">
                            All your class notes, in one place.
                        </h1>
                        <p className="text-chalk text-lg mt-5 max-w-lg leading-relaxed">
                            Find notes for every subject, download them in a tap, and share your own with your classmates. No more digging through WhatsApp groups and Telegram channels.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-8 flex items-center gap-2 p-1.5 pl-4 bg-white rounded-xl max-w-lg shadow-lg">
                            <LuSearch className="w-5 h-5 text-muted shrink-0"/>
                            <label htmlFor="hero-search" className="sr-only">Search notes</label>
                            <input id="hero-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you studying today?"
                                className="flex-1 min-w-0 py-2 text-[0.95rem] focus:outline-none"/>
                            <button type="submit" className="px-4 sm:px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm shrink-0">
                                Find notes
                            </button>
                        </form>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-chalk/70">Try:</span>
                            {popularSearches.map((term) => (
                                <button key={term} onClick={() => handleSearch(term)} className="px-3 py-1 rounded-full bg-white/8 border border-white/10 text-chalk hover:bg-white/15 hover:text-white">
                                    {term}
                                </button>
                            ))}
                        </div>

                        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-chalk">
                            {heroPoints.map((point) => (
                                <li key={point} className="inline-flex items-center gap-2">
                                    <LuCheck className="w-4 h-4 text-[#7fd1a8]"/> {point}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <LibraryPreview/>
                </div>
            </div>
        </section>
    )
}

export default Landing;
