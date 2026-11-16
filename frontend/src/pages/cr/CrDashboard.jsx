import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LuBookOpen, LuClipboardCheck, LuUpload, LuUsers } from "react-icons/lu";
import { PiSealCheckFill } from "react-icons/pi";
import { useGetcrstatsQuery } from "../../store/Api/Api";
import { toggleNotePopup } from "../../store/slice/PortalSlice";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { timeAgo } from "../../utils/format";

const describe = (note) =>{
    if(note.status === "pending") return `${note.uploaderName} submitted it for approval`;
    if(note.status === "rejected"){
        if(note.reviewedBy) return `Not approved by ${note.reviewedBy}`;
        return "Not approved";
    }
    if(note.uploaderRole === "CR") return `Uploaded by ${note.uploaderName}`;
    if(note.reviewedBy) return `Submitted by ${note.uploaderName}, approved by ${note.reviewedBy}`;
    return `Submitted by ${note.uploaderName}`;
};

const RecentActivity = ({recent}) =>{
    if(recent.length === 0){
        return <NoData compact message="No activity yet" description="Uploads and submissions from your section will appear here."/>;
    }
    return (
        <ul className="divide-y divide-line">
            {recent.map((note) => (
                <li key={note._id} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{note.title}</p>
                        <p className="text-sm text-muted">{note.subject}. {describe(note)}.</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={note.status}/>
                        <span className="text-xs text-muted">{timeAgo(note.reviewedAt || note.createdAt)}</span>
                    </div>
                </li>
            ))}
        </ul>
    )
}

const SectionCrs = ({myName , coCr}) =>{
    let crNote = "A section can have up to two CRs. The admin assigns the second one if your section has one.";
    if(coCr.length > 0) crNote = "Both CRs can upload, approve and remove notes for this section.";

    return (
        <>
            <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-2">
                    <PiSealCheckFill className="w-4 h-4 text-seal"/>
                    <span className="font-medium">{myName}</span>
                    <span className="text-sm text-muted">(you)</span>
                </li>
                {coCr.map((cr) =>{
                    let sealColor = "text-seal/40";
                    if(cr.crStatus === "active") sealColor = "text-seal";
                    const sealClass = `w-4 h-4 ${sealColor}`;
                    return (
                        <li key={cr._id} className="flex items-center gap-2">
                            <PiSealCheckFill className={sealClass}/>
                            <span className="font-medium">{cr.name}</span>
                            {cr.crStatus === "pending" && <span className="text-sm text-muted">awaiting confirmation</span>}
                        </li>
                    )
                })}
            </ul>
            <p className="text-sm text-muted mt-4 leading-relaxed">
                {crNote}
            </p>
        </>
    )
}

export const CrDashboard = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user.user);
    const [stats , setStats] = useState(null);
    const {data , isLoading , isError , refetch} = useGetcrstatsQuery();

    useEffect(() =>{
        if(data && data.success && data.data){
            setStats(data.data);
        }
    },[data]);

    if(isError && !stats){
        return <NoData message="This page could not be loaded" description="Check your connection and try again." buttonText="Try again" onClick={refetch}/>;
    }
    if(isLoading || !stats) return <Loader/>;

    const section = stats.section;
    const totals = stats.totals;
    const recent = stats.recent;

    let allCrs = [];
    if(user && user.sectionCrs) allCrs = user.sectionCrs;
    const coCr = allCrs.filter((cr) => cr._id !== user._id);

    let myName = undefined;
    if(user) myName = user.name;

    let pendingHint = "Nothing waiting";
    if(totals.pending) pendingHint = "Students are waiting for a review";

    const handleUpload = () =>{
        dispatch(toggleNotePopup());
    }

    return (
        <div>
            <PageHeader
                path={[{label:section.course} , {label:section.yearLabel} , {label:section.name}]}
                title={`CR dashboard for ${section.name}`}
                description="Upload notes for your section and review what students submit."
                actions={<>
                    <button onClick={() => Navigate("/cr/approvals")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-white text-sm font-medium hover:border-primary/40">
                        <LuClipboardCheck className="w-4 h-4"/> Review submissions
                    </button>
                    <button onClick={handleUpload} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium">
                        <LuUpload className="w-4 h-4"/> Upload notes
                    </button>
                </>}
            />

            <div className="bg-white border border-line rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-seal-soft text-seal flex items-center justify-center">
                        <PiSealCheckFill className="w-6 h-6"/>
                    </div>
                    <div>
                        <p className="font-semibold">Class Representative</p>
                        <p className="text-sm text-muted">Confirmed for this section only</p>
                    </div>
                </div>
                <dl className="grid grid-cols-3 gap-4 md:ml-auto md:gap-10 text-sm">
                    <div><dt className="text-muted">Course</dt><dd className="font-medium mt-0.5">{section.course}</dd></div>
                    <div><dt className="text-muted">Academic year</dt><dd className="font-medium mt-0.5">{section.yearLabel}</dd></div>
                    <div><dt className="text-muted">Section</dt><dd className="font-medium mt-0.5">{section.name}</dd></div>
                </dl>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard label="Students in section" value={totals.students} icon={<LuUsers/>} onClick={() => Navigate("/cr/section")}/>
                <StatCard label="Published notes" value={totals.notes} icon={<LuBookOpen/>} onClick={() => Navigate("/cr/notes")}/>
                <StatCard label="Pending approvals" value={totals.pending} icon={<LuClipboardCheck/>} tone="wait"
                    hint={pendingHint} onClick={() => Navigate("/cr/approvals")}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <Panel title="Recent academic activity" padded={false}
                    action={<Link to="/cr/notes" className="text-sm text-primary hover:underline">All notes</Link>}>
                    <RecentActivity recent={recent}/>
                </Panel>

                <Panel title="Section CRs">
                    <SectionCrs myName={myName} coCr={coCr}/>
                </Panel>
            </div>
        </div>
    )
}
