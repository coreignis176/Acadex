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

const squash = (text) => String(text || "").toLowerCase().replace(/\s+/g , "");

const noteMatchesSearch = (note , searchText) =>{
    if(searchText === "") return true;
    if(squash(note.subjectCode).includes(squash(searchText))) return true;
    if(note.subject.toLowerCase().includes(searchText)) return true;
    const topic = note.topic || "";
    if(topic.toLowerCase().includes(searchText)) return true;
    if(note.title.toLowerCase().includes(searchText)) return true;
    return false;
}

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

const buildSectionNames = (notes) =>{
    const names = [];
    for(const note of notes){
        if(!names.includes(note.sectionName)) names.push(note.sectionName);
    }
    names.sort((first , second) => first.localeCompare(second , undefined , {numeric:true}));
    return names;
}

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

const SubjectChips = ({subjects , selected , onSelect}) =>{
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

const SortToggle = ({sortBy , onChange}) =>{
    const options = [{value:"newest" , label:"Newest"} , {value:"liked" , label:"Most Liked"}];
    return (
        <div className="flex items-center gap-2 text-sm shrink-0">
            <span className="text-muted">Sort</span>
            <div className="inline-flex rounded-lg border border-line bg-white p-0.5" role="radiogroup" aria-label="Sort notes">
                {options.map((option) =>{
                    const active = sortBy === option.value;
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

export const AllNotes = () =>{
    const Navigate = useNavigate();
    const user = useSelector((state) => state.user.user);
    const hasSection = Boolean(user && user.sectionId);
    const [params , setParams] = useSearchParams();
    const [search , setSearch] = useState(params.get("q") || "");
    const [subject , setSubject] = useState(params.get("subject") || "all");
    const [section , setSection] = useState("all");
    const [sortBy , setSortBy] = useState("newest");
    const [openNote , setOpenNote] = useState(null);
    const notesResult = useGetnotesQuery({sort:sortBy , subject:subject} , {skip:!hasSection , pollingInterval:20000});
    const subjectsResult = useGetsubjectlistQuery(undefined , {skip:!hasSection});
    const [viewnote] = useViewnoteMutation();

    const handleView = (note) =>{
        setOpenNote(note);
        viewnote({noteId:note._id}).unwrap().catch(() =>{});
    }

    useEffect(() =>{
        const next = new URLSearchParams();
        if(search.trim()) next.set("q" , search.trim());
        setParams(next , {replace:true});
    },[search , setParams]);

    if(!hasSection) return <NoSection/>;

    let notes = [];
    if(notesResult.currentData && notesResult.currentData.data) notes = notesResult.currentData.data;
    let mySubjects = [];
    if(subjectsResult.data && subjectsResult.data.data) mySubjects = subjectsResult.data.data;

    const loadingNotes = notesResult.isFetching && !notesResult.currentData;

    let mySectionName = undefined;
    if(user.section) mySectionName = user.section.name;

    const subjects = buildSubjectList(mySubjects , notes);
    if(subject !== "all" && !subjects.find((item) => item.name === subject)){
        subjects.push({name:subject , code:""});
    }
    const sections = buildSectionNames(notes);
    if(section !== "all" && !sections.includes(section)){
        sections.push(section);
    }

    const searchText = search.trim().toLowerCase();
    const filtered = notes.filter((note) =>{
        const searchMatch = noteMatchesSearch(note , searchText);
        const sectionMatch = section === "all" || note.sectionName === section;
        return searchMatch && sectionMatch;
    });

    let groups;
    if(sortBy === "liked") groups = [{label:"Most liked first" , items:filtered}];
    else groups = groupByDay(filtered);

    let sortText = "newest first";
    if(sortBy === "liked") sortText = "most liked first";

    let liveOpen = null;
    if(openNote){
        const newestCopy = notes.find((note) => note._id === openNote._id);
        liveOpen = newestCopy || openNote;
    }

    const filtersOn = search !== "" || subject !== "all" || section !== "all";

    const handleClearAll = () =>{
        setSearch("");
        setSubject("all");
        setSection("all");
    }

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

    let content;
    if(loadingNotes){
        content = <Loader label="Loading notes"/>;
    }
    else if(notesResult.isError){
        content = <NoData message="Notes could not be loaded" description="Check your connection and try again." buttonText="Try again" onClick={notesResult.refetch}/>;
    }
    else if(notes.length === 0 && subject !== "all"){
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

                <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-3">
                    <SubjectChips subjects={subjects} selected={subject} onSelect={setSubject}/>
                    <SortToggle sortBy={sortBy} onChange={setSortBy}/>
                    <label className="flex items-center gap-2 text-sm shrink-0">
                        <span className="text-muted">Section</span>
                        <select value={section} onChange={(event) => setSection(event.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-line bg-white text-sm focus:outline-none focus:border-primary">
                            <option value="all">All sections</option>
                            {sections.map((name) =>{
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
