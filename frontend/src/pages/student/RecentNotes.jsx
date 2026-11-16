import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LuHistory, LuTrash2 } from "react-icons/lu";
import { useClearrecentMutation, useGetrecentQuery, useViewnoteMutation } from "../../store/Api/Api";
import { NoteCard } from "../../components/NoteCard";
import { NoteDetails } from "../../components/NoteDetails";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { NoSection } from "./NoSection";

export const RecentNotes = () =>{
    const Navigate = useNavigate();
    const user = useSelector((state) => state.user.user);
    const hasSection = Boolean(user && user.sectionId);
    const recentResult = useGetrecentQuery(undefined , {skip:!hasSection});
    const [viewnote] = useViewnoteMutation();
    const [clearrecent , {isLoading:clearing}] = useClearrecentMutation();
    const [openNote , setOpenNote] = useState(null);
    const [askClear , setAskClear] = useState(false);

    if(!hasSection) return <NoSection/>;

    let notes = [];
    if(recentResult.data && recentResult.data.data) notes = recentResult.data.data;

    const handleView = (note) =>{
        setOpenNote(note);
        viewnote({noteId:note._id}).unwrap().catch(() =>{});
    }

    const handleClear = async () =>{
        try{
            const result = await clearrecent().unwrap();
            if(result?.success) toast.success(result.message);
            setAskClear(false);
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Clear Your History");
        }
    }

    let liveOpen = null;
    if(openNote){
        const newestCopy = notes.find((note) => note._id === openNote._id);
        liveOpen = newestCopy || openNote;
    }

    let mySectionName = undefined;
    if(user.section) mySectionName = user.section.name;

    let content;
    if(recentResult.isLoading){
        content = <Loader label="Loading your history"/>;
    }
    else if(recentResult.isError){
        content = (
            <div className="bg-white border border-line rounded-2xl">
                <NoData message="Your history could not be loaded" description="Check your connection and try again."
                    buttonText="Try again" onClick={recentResult.refetch}/>
            </div>
        );
    }
    else if(notes.length === 0){
        content = (
            <div className="bg-white border border-line rounded-2xl">
                <NoData icon={<LuHistory/>} message="No notes viewed yet"
                    description="Notes you open from All Notes show up here, the last one on top, so you can pick up where you left off."
                    buttonText="Browse All Notes" onClick={() => Navigate("/student")}/>
            </div>
        );
    }
    else{
        const latest = notes[0];
        const earlier = notes.slice(1);

        content = (
            <div className="flex flex-col gap-6">
                <section>
                    <h2 className="text-sm font-sans font-semibold text-muted mb-2.5 px-1">Continue reading</h2>
                    <div className="rounded-2xl ring-2 ring-primary/25">
                        <NoteCard note={latest} onView={handleView} mySection={mySectionName}/>
                    </div>
                </section>

                {earlier.length > 0 && (
                    <section>
                        <h2 className="text-sm font-sans font-semibold text-muted mb-2.5 px-1">Earlier</h2>
                        <div className="flex flex-col gap-3">
                            {earlier.map((note) => <NoteCard key={note._id} note={note} onView={handleView} mySection={mySectionName}/>)}
                        </div>
                    </section>
                )}
            </div>
        );
    }

    let actions = null;
    if(notes.length > 0){
        actions = (
            <button onClick={() => setAskClear(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-white text-sm font-medium hover:border-bad/40 hover:text-bad">
                <LuTrash2 className="w-4 h-4"/> Clear history
            </button>
        );
    }

    let countText = `${notes.length} notes`;
    if(notes.length === 1) countText = "1 note";

    return (
        <div className="max-w-5xl">
            <PageHeader title="Recently Viewed"
                description="The notes you opened last, newest on top. Your last 10 notes are kept."
                actions={actions}/>

            {notes.length > 0 && (
                <p className="text-sm text-muted mb-3"><span className="font-semibold text-ink">{countText}</span> in your history</p>
            )}

            {content}

            {liveOpen && <NoteDetails note={liveOpen} onClose={() => setOpenNote(null)}/>}

            {askClear && (
                <ConfirmDialog title="Clear your history?" confirmText="Clear history" loading={clearing}
                    message="This removes every note from your Recently Viewed list. The notes themselves stay in All Notes."
                    onConfirm={handleClear} onClose={() => setAskClear(false)}/>
            )}
        </div>
    )
}
