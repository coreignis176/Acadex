import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuSearch, LuUpload, LuX } from "react-icons/lu";
import { PiSealCheck } from "react-icons/pi";
import { useGetnotesQuery, useGetsubjectlistQuery, useViewnoteMutation } from "../../store/Api/Api";
import { CrConfirmActions } from "../../components/NotificationList";
import { NoteCard } from "../../components/NoteCard";
import { NoteDetails } from "../../components/NoteDetails";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { dayLabel } from "../../utils/format";
import { shortSubject, subjectColor } from "../../utils/subjects";
import { NoSection } from "./NoSection";

// "tcs 355" -> "tcs355" so codes match however they are typed
// (the regex /\s+/g means "every group of spaces, tabs or new lines" - we replace them with nothing)
const squash = (text) => String(text || "").toLowerCase().replace(/\s+/g , "");

// true when the note's subject code, subject name, topic or title contains the search text
// (searchText is already trimmed and in lower case; an empty search matches every note)
const noteMatchesSearch = (note , searchText) =>{
    if(searchText === "") return true;
    if(squash(note.subjectCode).includes(squash(searchText))) return true;
    if(note.subject.toLowerCase().includes(searchText)) return true;
    const topic = note.topic || "";
    if(topic.toLowerCase().includes(searchText)) return true;
    if(note.title.toLowerCase().includes(searchText)) return true;
    return false;
}

// my section's subjects + any other subject that appears in my year's notes (sections can differ)
const buildSubjectList = (mySubjects , notes) =>{
    const list = [];
    for(const item of mySubjects){
        list.push(item);
    }
    for(const note of notes){
        const alreadyInList = list.find((item) => item.name === note.subject);
        if(!alreadyInList) list.push({name:note.subject , code:note.subjectCode});
    }
    return list;
}

// the names of all sections that have notes, each name only once, sorted
const buildSectionNames = (notes) =>{
    const names = [];
    for(const note of notes){
        if(!names.includes(note.sectionName)) names.push(note.sectionName);
    }
    // numeric:true sorts "A2" before "A10" (it compares the numbers inside the names)
    names.sort((first , second) => first.localeCompare(second , undefined , {numeric:true}));
    return names;
}

// group a newest-first list by upload day, e.g. [{label:"Today" , items:[...]} , {label:"Yesterday" , items:[...]}]
// because the list is already sorted, notes of the same day are next to each other
const groupByDay = (notes) =>{
    const result = [];
    for(const note of notes){
        const label = dayLabel(note.createdAt);
        const lastGroup = result[result.length - 1];
        if(lastGroup && lastGroup.label === label) lastGroup.items.push(note);
        else result.push({label , items:[note]});
    }
    return result;
}

// banner asking a student to confirm that they are now the CR of their section
const CrConfirmBanner = ({sectionName}) =>{
    return (
        <section className="mb-6 rounded-2xl border-2 border-seal/40 bg-seal-soft/60 p-5 flex flex-col md:flex-row md:items-center gap-4">
            <PiSealCheck className="w-8 h-8 text-seal shrink-0"/>
            <div className="flex-1">
                <h2 className="text-lg font-semibold font-sans">Confirm your CR appointment</h2>
                <p className="text-sm text-ink/80">The admin has identified you as the Class Representative of {sectionName}. Please confirm your appointment.</p>
            </div>
            <CrConfirmActions/>
        </section>
    )
}

// row of subject chips; "All subjects" first, then one chip per subject
const SubjectChips = ({subjects , selected , onSelect}) =>{
    //$ function to pick a subject chip (clicking the picked chip again turns the filter off)
    const handleChipClick = (name) =>{
        if(selected === name) onSelect("all");
        else onSelect(name);
    }

    let allChipColors = "border-line text-ink/80 hover:border-primary/40";
    if(selected === "all") allChipColors = "bg-ink text-white border-ink";
    const allChipClass = `shrink-0 px-3 py-1.5 rounded-full text-sm border ${allChipColors}`;

    return (
        <div className="flex gap-2 overflow-x-auto thin-scroll pb-1 flex-1" role="tablist" aria-label="Subject">
            <button role="tab" aria-selected={selected === "all"} onClick={() => onSelect("all")}
                className={allChipClass}>
                All subjects
            </button>
            {subjects.map((item) =>{
                const colors = subjectColor(item.name);
                const active = selected === item.name;
                // the selected chip is filled with the subject colour
                let chipStyle = {background:colors.bg , color:colors.fg , borderColor:"transparent"};
                if(active) chipStyle = {background:colors.fg , color:"#fff" , borderColor:colors.fg};
                return (
                    <button key={item.name} role="tab" aria-selected={active} onClick={() => handleChipClick(item.name)} title={item.name}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border"
                        style={chipStyle}>
                        <span className="font-bold text-xs">{item.code}</span> {shortSubject(item.name)}
                    </button>
                )
            })}
        </div>
    )
}

// two buttons to pick the order of the notes: Newest or Most Liked
const SortToggle = ({sortBy , onChange}) =>{
    const options = [{value:"newest" , label:"Newest"} , {value:"liked" , label:"Most Liked"}];
    return (
        <div className="flex items-center gap-2 text-sm shrink-0">
            <span className="text-muted">Sort</span>
            <div className="inline-flex rounded-lg border border-line bg-white p-0.5" role="radiogroup" aria-label="Sort notes">
                {options.map((option) =>{
                    const active = sortBy === option.value;
                    // the picked button is filled dark
                    let colors = "text-ink/80 hover:text-ink";
                    if(active) colors = "bg-ink text-white";
                    return (
                        <button key={option.value} role="radio" aria-checked={active} onClick={() => onChange(option.value)}
                            className={`px-3 py-1 rounded-md ${colors}`}>
                            {option.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// the notes, shown in groups with a day heading ("Today", "Yesterday", ...)
const NoteGroups = ({groups , onView , mySectionName}) =>{
    return (
        <div className="flex flex-col gap-6">
            {groups.map((group) => (
                <section key={group.label}>
                    <h2 className="text-sm font-sans font-semibold text-muted mb-2.5 px-1">{group.label}</h2>
                    <div className="flex flex-col gap-3">
                        {group.items.map((note) => <NoteCard key={note._id} note={note} onView={onView} mySection={mySectionName}/>)}
                    </div>
                </section>
            ))}
        </div>
    )
}

// All Notes: approved notes from every section of the student's course + year
// the subject filter and the sort (newest / most liked) are done on the backend by our C program
// (connect_pbl/c/notes_sort.c); the search box and the section dropdown still work here in JavaScript
export const AllNotes = () =>{
    const Navigate = useNavigate();
    const user = useSelector((state) => state.user.user);
    const hasSection = Boolean(user && user.sectionId);
    // search params are the "?q=heaps&subject=..." part of the URL
    const [params , setParams] = useSearchParams();
    const [search , setSearch] = useState(params.get("q") || ""); // the text typed in the search box
    const [subject , setSubject] = useState(params.get("subject") || "all"); // the picked subject chip ("all" = no filter)
    const [section , setSection] = useState("all"); // the picked section in the dropdown ("all" = no filter)
    const [sortBy , setSortBy] = useState("newest"); // "newest" or "liked"
    const [openNote , setOpenNote] = useState(null); // the note opened in the details popup (null = closed)
    // the picked sort + subject go to the backend: /notes/getnotes?sort=liked&subject=DBMS
    // a new pick -> a new request -> the C program filters + sorts again
    // pollingInterval: ask the server for fresh notes every 20 seconds
    const notesResult = useGetnotesQuery({sort:sortBy , subject:subject} , {skip:!hasSection , pollingInterval:20000});
    const subjectsResult = useGetsubjectlistQuery(undefined , {skip:!hasSection});
    const [viewnote] = useViewnoteMutation();

    //$ function to open a note , and put it on top of my Recently Viewed history
    // (the backend asks our C stack program to PUSH it - see connect_pbl/c/recent_stack.c)
    // the note opens at once , the history is saved quietly in the background:
    // if saving fails , opening the note must still work , so the error is ignored
    const handleView = (note) =>{
        setOpenNote(note);
        viewnote({noteId:note._id}).unwrap().catch(() =>{});
    }

    // keep ?q= in the URL so a search can be shared or refreshed
    // runs every time the search text changes
    useEffect(() =>{
        const next = new URLSearchParams();
        if(search.trim()) next.set("q" , search.trim());
        // replace:true changes the URL without adding a new entry to the browser history
        setParams(next , {replace:true});
    },[search , setParams]);

    if(!hasSection) return <NoSection/>;

    // read the lists out of the server answers (empty lists until they arrive)
    // currentData = the notes for the CURRENT sort + subject. Right after a new pick it is empty
    // until the new answer comes, so the old (wrong) list is not shown in the meantime.
    let notes = [];
    if(notesResult.currentData && notesResult.currentData.data) notes = notesResult.currentData.data;
    let mySubjects = [];
    if(subjectsResult.data && subjectsResult.data.data) mySubjects = subjectsResult.data.data;

    // loading = the first time, or after picking another sort / subject
    const loadingNotes = notesResult.isFetching && !notesResult.currentData;

    let mySectionName = undefined;
    if(user.section) mySectionName = user.section.name;

    // the backend now sends only the picked subject's notes,
    // so make sure the picked chip and the picked section never disappear from the screen
    const subjects = buildSubjectList(mySubjects , notes);
    if(subject !== "all" && !subjects.find((item) => item.name === subject)){
        subjects.push({name:subject , code:""});
    }
    const sections = buildSectionNames(notes);
    if(section !== "all" && !sections.includes(section)){
        sections.push(section);
    }

    // the subject filter is already done by the backend (C program).
    // here a note is shown only if it passes the other two checks: search text and section dropdown
    const searchText = search.trim().toLowerCase();
    const filtered = notes.filter((note) =>{
        const searchMatch = noteMatchesSearch(note , searchText);
        const sectionMatch = section === "all" || note.sectionName === section;
        return searchMatch && sectionMatch;
    });

    // newest     -> groups by day (Today , Yesterday ...)
    // most liked -> ONE plain list (grouping by day would mix the days up)
    let groups;
    if(sortBy === "liked") groups = [{label:"Most liked first" , items:filtered}];
    else groups = groupByDay(filtered);

    let sortText = "newest first";
    if(sortBy === "liked") sortText = "most liked first";

    // use the newest copy of the opened note from the list (its likes may have changed since it was opened)
    let liveOpen = null;
    if(openNote){
        const newestCopy = notes.find((note) => note._id === openNote._id);
        liveOpen = newestCopy || openNote;
    }

    const filtersOn = search !== "" || subject !== "all" || section !== "all";

    //$ function to clear the search and all filters
    const handleClearAll = () =>{
        setSearch("");
        setSubject("all");
        setSection("all");
    }

    // the small line above the list: "Loading...", "3 results for ..." or "12 notes available"
    let countText;
    if(loadingNotes){
        countText = "Loading notes...";
    }
    else if(filtersOn){
        const resultWord = filtered.length === 1 ? "result" : "results";
        let searchPart = null;
        if(search) searchPart = <> for &ldquo;{search}&rdquo;</>;
        countText = <><span className="font-semibold text-ink">{filtered.length}</span> {resultWord}{searchPart}</>;
    }
    else{
        countText = <><span className="font-semibold text-ink">{notes.length}</span> notes available</>;
    }

    // the main area: loader, error, empty message, or the notes grouped by day
    let content;
    if(loadingNotes){
        content = <Loader label="Loading notes"/>;
    }
    else if(notesResult.isError){
        content = <NoData message="Notes could not be loaded" description="Check your connection and try again." buttonText="Try again" onClick={notesResult.refetch}/>;
    }
    else if(notes.length === 0 && subject !== "all"){
        // a subject is picked, but the backend found no notes of it
        content = (
            <div className="bg-white border border-line rounded-2xl">
                <NoData compact message="No notes for this subject yet" description={`Nobody in your year has shared ${subject} notes yet.`}
                    buttonText="Show all subjects" onClick={() => setSubject("all")}/>
            </div>
        );
    }
    else if(notes.length === 0){
        content = (
            <div className="bg-white border border-line rounded-2xl">
                <NoData message="No notes yet" description="Nobody in your year has shared notes yet. Be the first." buttonText="Upload Notes" onClick={() => Navigate("/student/upload")}/>
            </div>
        );
    }
    else if(filtered.length === 0){
        let noMatchText = "No notes for this filter yet.";
        if(search) noMatchText = `Nothing matches "${search}". Try a subject code like TCS302, a subject name or a topic.`;
        content = (
            <div className="bg-white border border-line rounded-2xl">
                <NoData compact message="No notes match" description={noMatchText}
                    buttonText="Clear filters" onClick={handleClearAll}/>
            </div>
        );
    }
    else{
        content = <NoteGroups groups={groups} onView={handleView} mySectionName={mySectionName}/>;
    }

    return (
        <div className="max-w-5xl">

            {user.crStatus === "pending" && <CrConfirmBanner sectionName={mySectionName}/>}

            {/* title + search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-2xl md:text-[2rem] font-semibold">All Notes</h1>
                    <p className="text-muted mt-1">Notes shared by students and CRs from every section of your year, {sortText}.</p>
                </div>
                <Link to="/student/upload" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold self-start">
                    <LuUpload className="w-4 h-4"/> Upload Notes
                </Link>
            </div>

            <div className="bg-white border border-line rounded-2xl p-3 md:p-4 mb-4 shadow-[0_8px_24px_-20px_rgba(28,43,58,0.4)]">
                <label className="relative block">
                    <span className="sr-only">Search notes</span>
                    <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted"/>
                    <input value={search} onChange={(event) => setSearch(event.target.value)} autoFocus
                        placeholder="Search by subject code, subject, topic or title. Try TCS355"
                        className="w-full pl-12 pr-11 py-3.5 rounded-xl bg-canvas border border-transparent text-[0.95rem] focus:outline-none focus:bg-white focus:border-primary"/>
                    {search && (
                        <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted hover:text-ink hover:bg-white">
                            <LuX className="w-4 h-4"/>
                        </button>
                    )}
                </label>

                {/* subject chips + sort + section filter */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-3">
                    <SubjectChips subjects={subjects} selected={subject} onSelect={setSubject}/>
                    <SortToggle sortBy={sortBy} onChange={setSortBy}/>
                    <label className="flex items-center gap-2 text-sm shrink-0">
                        <span className="text-muted">Section</span>
                        <select value={section} onChange={(event) => setSection(event.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:border-primary">
                            <option value="all">All sections</option>
                            {sections.map((name) =>{
                                // mark my own section with "(yours)"
                                let yoursText = "";
                                if(name === mySectionName) yoursText = " (yours)";
                                return <option key={name} value={name}>{name}{yoursText}</option>;
                            })}
                        </select>
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-between mb-3 text-sm">
                <p className="text-muted">
                    {countText}
                </p>
                {filtersOn && <button onClick={handleClearAll} className="text-primary hover:underline">Clear filters</button>}
            </div>

            {content}

            {liveOpen && <NoteDetails note={liveOpen} onClose={() => setOpenNote(null)}/>}
        </div>
    )
}
