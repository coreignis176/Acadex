import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { NoteRow } from "./NoteRow";
import { NoteDetails } from "./NoteDetails";
import { NoData } from "./NoData";
import { dayLabel } from "../utils/format";
import { subjectColor } from "../utils/subjects";

const VIEWS = [
    {key:"subject" , label:"Subject-wise"},
    {key:"date" , label:"Date-wise"}
];

export const NotesBrowser = ({notes , subjects = [] , mode = "read" , onDelete , emptyAction , initialSubject = "all" , initialSearch = ""}) =>{
    const [view , setView] = useState("subject");
    const [subject , setSubject] = useState(initialSubject);
    const [search , setSearch] = useState(initialSearch);
    const [openNote , setOpenNote] = useState(null);

    const query = search.trim().toLowerCase();
    const filtered = [];
    for(const note of notes){
        const subjectMatch = view === "date" || subject === "all" || note.subject === subject;

        let searchMatch = false;
        if(query === ""){
            searchMatch = true;
        }
        else{
            const texts = [note.title , note.subject , note.uploaderName , note.description];
            for(const text of texts){
                if(text && text.toLowerCase().includes(query)){
                    searchMatch = true;
                    break;
                }
            }
        }

        if(subjectMatch && searchMatch){
            filtered.push(note);
        }
    }

    const counts = {};
    for(const note of notes){
        if(counts[note.subject]){
            counts[note.subject] = counts[note.subject] + 1;
        }
        else{
            counts[note.subject] = 1;
        }
    }

    const byDate = [];
    for(const note of filtered){
        const label = dayLabel(note.createdAt);
        const lastGroup = byDate[byDate.length - 1];
        if(lastGroup && lastGroup.label === label){
            lastGroup.items.push(note);
        }
        else{
            byDate.push({label:label , items:[note]});
        }
    }

    let liveOpen = null;
    if(openNote){
        const freshNote = notes.find((note) => note._id === openNote._id);
        if(freshNote){
            liveOpen = freshNote;
        }
        else{
            liveOpen = openNote;
        }
    }

    const allSubjects = [];
    for(const name of subjects){
        if(!allSubjects.includes(name)) allSubjects.push(name);
    }
    for(const name of Object.keys(counts)){
        if(!allSubjects.includes(name)) allSubjects.push(name);
    }

    const subjectButtons = [{key:"all" , label:"All subjects" , count:notes.length}];
    for(const name of allSubjects){
        let count = 0;
        if(counts[name]) count = counts[name];
        subjectButtons.push({key:name , label:name , count:count});
    }

    const list = (items , showSubject = true) => (
        <div className="divide-y divide-line">
            {items.map((note) => <NoteRow key={note._id} note={note} mode={mode} onOpen={setOpenNote} onDelete={onDelete} showSubject={showSubject}/>)}
        </div>
    );

    let emptyMessage = "No notes here yet";
    let emptyDescription = "Notes appear here once they are uploaded and approved.";
    let emptyButtonText;
    let emptyOnClick;
    if(search){
        emptyMessage = "No notes match your search";
        emptyDescription = `Nothing matches "${search}". Try a subject name, a topic or an uploader.`;
        emptyButtonText = "Clear search";
        emptyOnClick = () => setSearch("");
    }
    else if(emptyAction){
        emptyButtonText = emptyAction.buttonText;
        emptyOnClick = emptyAction.onClick;
    }

    const empty = (
        <NoData compact message={emptyMessage} description={emptyDescription} buttonText={emptyButtonText} onClick={emptyOnClick}/>
    );

    let body;
    if(view === "subject"){
        let subjectNotes = empty;
        if(filtered.length){
            subjectNotes = list(filtered , subject === "all");
        }

        body = (
            <div className="md:grid md:grid-cols-[230px_1fr]">
                <nav aria-label="Subjects" className="border-b md:border-b-0 md:border-r border-line p-3">
                    <ul className="flex md:flex-col gap-1 overflow-x-auto thin-scroll">
                        {subjectButtons.map((item) =>{
                            let buttonClass = "w-full flex items-center justify-between gap-3 text-left px-3 py-2 rounded-lg text-sm text-ink/80 hover:bg-canvas";
                            if(subject === item.key){
                                buttonClass = "w-full flex items-center justify-between gap-3 text-left px-3 py-2 rounded-lg text-sm bg-primary-soft text-primary font-medium";
                            }
                            return (
                                <li key={item.key} className="shrink-0">
                                    <button onClick={() => setSubject(item.key)} aria-current={subject === item.key}
                                        className={buttonClass}>
                                        <span className="flex items-center gap-2 min-w-0">
                                            {item.key !== "all" && <span aria-hidden="true" className="w-2 h-2 rounded-full shrink-0" style={{background:subjectColor(item.key).fg}}/>}
                                            <span className="md:truncate whitespace-nowrap md:whitespace-normal">{item.label}</span>
                                        </span>
                                        <span className="text-xs tabular-nums text-muted">{item.count}</span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
                <div className="min-w-0">
                    {subject !== "all" && <h3 className="px-5 pt-4 pb-1 text-lg font-semibold">{subject}</h3>}
                    {subjectNotes}
                </div>
            </div>
        );
    }
    else{
        let dateGroups = empty;
        if(byDate.length){
            dateGroups = byDate.map((group) => (
                <section key={group.label}>
                    <h3 className="px-5 py-2 bg-canvas/70 border-b border-line text-sm font-sans font-semibold text-ink/80 sticky top-16 z-[1]">
                        {group.label}
                    </h3>
                    {list(group.items)}
                </section>
            ));
        }

        body = (
            <div>
                {dateGroups}
            </div>
        );
    }

    return (
        <div className="bg-white border border-line rounded-xl">

            <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b border-line">
                <div className="inline-grid grid-cols-2 p-1 rounded-lg bg-canvas border border-line text-sm shrink-0" role="tablist" aria-label="Organise notes">
                    {VIEWS.map((item) =>{
                        let tabClass = "px-4 py-1.5 rounded-md text-muted hover:text-ink";
                        if(view === item.key){
                            tabClass = "px-4 py-1.5 rounded-md bg-white shadow-sm font-medium";
                        }
                        return (
                            <button key={item.key} role="tab" aria-selected={view === item.key} onClick={() => setView(item.key)}
                                className={tabClass}>
                                {item.label}
                            </button>
                        )
                    })}
                </div>
                <label className="relative flex-1 md:max-w-sm md:ml-auto">
                    <span className="sr-only">Search notes</span>
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"/>
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, subject or uploader"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-line bg-white text-sm focus:outline-none focus:border-primary"/>
                </label>
            </div>

            {body}

            {liveOpen && <NoteDetails note={liveOpen} onClose={() => setOpenNote(null)}/>}
        </div>
    )
}
