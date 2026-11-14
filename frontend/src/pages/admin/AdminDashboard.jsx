import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuBookOpen, LuGraduationCap, LuLayers, LuUser, LuUsers } from "react-icons/lu";
import { PiSealCheck } from "react-icons/pi";
import { useGetadminstatsQuery } from "../../store/Api/Api";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { StatCard } from "../../components/StatCard";
import { RoleBadge } from "../../components/StatusBadge";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { timeAgo } from "../../utils/format";

// icon and colours for each kind of entry in "Recent activity"
const ACTIVITY_ICONS = {
    section:{icon:<LuLayers className="w-4 h-4"/> , tone:"bg-primary-soft text-primary"},
    student:{icon:<LuUser className="w-4 h-4"/> , tone:"bg-canvas text-muted"},
    cr:{icon:<PiSealCheck className="w-4 h-4"/> , tone:"bg-seal-soft text-seal"}
};

// list of CR requests still waiting for the student to confirm
const PendingList = ({pendingCrs}) =>{
    if(pendingCrs.length === 0){
        return <p className="px-5 py-6 text-sm text-muted">Nothing is waiting on you. Every CR request has been answered.</p>;
    }

    return (
        <ul className="divide-y divide-line">
            {pendingCrs.map((student) =>{
                // the student's section (it can be missing)
                let sectionId;
                let sectionLabel;
                if(student.section){
                    sectionId = student.section._id;
                    sectionLabel = student.section.label;
                }

                return (
                    <li key={student._id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-3.5">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{student.name} <span className="text-muted font-normal">({student.rollNo})</span></p>
                            <Link to={`/admin/sections/${sectionId}`} className="text-sm text-muted hover:text-primary hover:underline">{sectionLabel}</Link>
                        </div>
                        <span className="text-xs font-medium text-wait bg-wait-soft rounded-md px-2 py-1 self-start sm:self-auto">Awaiting student confirmation</span>
                    </li>
                )
            })}
        </ul>
    )
}

// table with one row per academic year: its sections and a bar for its students
const YearTable = ({perYear}) =>{
    // the biggest student count of any year (at least 1, so we never divide by 0)
    // that year gets a full bar and the other bars are drawn relative to it
    let maxStudents = 1;
    for(const row of perYear){
        if(row.students > maxStudents){
            maxStudents = row.students;
        }
    }

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-left text-muted">
                    <th className="font-normal pb-2">Year</th>
                    <th className="font-normal pb-2 text-right w-20">Sections</th>
                    <th className="font-normal pb-2 pl-6">Students</th>
                </tr>
            </thead>
            <tbody>
                {perYear.map((row) =>{
                    // bar width = this year's students as a percentage of the biggest year
                    const barWidth = `${(row.students / maxStudents) * 100}%`;

                    return (
                        <tr key={row.label} className="border-t border-line">
                            <td className="py-2.5 pr-3 whitespace-nowrap">
                                <Link to={`/admin/structure/${row.courseId}/${row.year}`} className="hover:text-primary hover:underline">{row.label}</Link>
                            </td>
                            <td className="py-2.5 text-right tabular-nums">{row.sections}</td>
                            <td className="py-2.5 pl-6 w-1/2">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1.5 rounded-full bg-canvas overflow-hidden" aria-hidden="true">
                                        <div className="h-full rounded-full bg-primary" style={{width:barWidth}}/>
                                    </div>
                                    <span className="tabular-nums w-8 text-right">{row.students}</span>
                                </div>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}

// list of the latest admin actions, newest first
const ActivityList = ({recentActivity}) =>{
    if(recentActivity.length === 0){
        return <p className="px-5 py-6 text-sm text-muted">Administrative actions will appear here.</p>;
    }

    return (
        <ol className="divide-y divide-line">
            {recentActivity.map((item) =>{
                // unknown kinds fall back to the section icon
                let meta = ACTIVITY_ICONS[item.kind];
                if(!meta){
                    meta = ACTIVITY_ICONS.section;
                }
                const iconBoxClass = "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center " + meta.tone;

                return (
                    <li key={item._id} className="flex gap-3 px-5 py-3">
                        <div className={iconBoxClass}>
                            {meta.icon}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm">{item.text}</p>
                            <p className="text-xs text-muted">{timeAgo(item.createdAt)}</p>
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}

// list of the confirmed Class Representatives
const CrList = ({crAssignments}) =>{
    if(crAssignments.length === 0){
        return <p className="px-5 py-6 text-sm text-muted">No Class Representatives are confirmed yet.</p>;
    }

    return (
        <ul className="divide-y divide-line">
            {crAssignments.map((student) =>{
                // the student's section name (it can be missing)
                let sectionLabel;
                if(student.section){
                    sectionLabel = student.section.label;
                }

                return (
                    <li key={student._id} className="flex items-center gap-3 px-5 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{student.name}</p>
                            <p className="text-xs text-muted truncate">{sectionLabel}</p>
                        </div>
                        <RoleBadge crStatus={student.crStatus}/>
                    </li>
                )
            })}
        </ul>
    )
}

// the admin home page: totals, pending CR requests, students per year and recent activity
export const AdminDashboard = () =>{
    const Navigate = useNavigate();
    const [stats , setStats] = useState(null);     // everything the dashboard shows, from the server
    const {data , isLoading , error} = useGetadminstatsQuery();

    // runs every time new data arrives from the server and copies it into state
    useEffect(() =>{
        if(data && data.success && data.data){
            setStats(data.data);
        }
    },[data]);

    if(isLoading) return <Loader/>;
    // Navigate(0) reloads the current page
    if(error) return <NoData message="The dashboard could not load" description={error?.data?.message} buttonText="Try again" onClick={() => Navigate(0)}/>;
    if(!stats) return <Loader/>;

    // take the five lists / numbers out of the stats object
    const totals = stats.totals;
    const perYear = stats.perYear;
    const pendingCrs = stats.pendingCrs;
    const crAssignments = stats.crAssignments;
    const recentActivity = stats.recentActivity;

    return (
        <div>
            <PageHeader title="Dashboard" description="An overview of courses, sections, students and Class Representatives across Acadex."
                actions={<Link to="/admin/structure" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium">Manage academic structure</Link>}/>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <StatCard label="Total courses" value={totals.courses} icon={<LuGraduationCap/>} hint="B.Tech and BBA"/>
                <StatCard label="Total sections" value={totals.sections} icon={<LuLayers/>} hint="Active sections only"/>
                <StatCard label="Total students" value={totals.students} icon={<LuUsers/>} hint="Registered in a section"/>
                <StatCard label="Active CRs" value={totals.activeCrs} icon={<PiSealCheck/>} tone="seal" hint="Confirmed appointments"/>
                <StatCard label="Pending CR confirmations" value={totals.pendingCrs} icon={<PiSealCheck/>} tone="wait" hint="Waiting for the student" onClick={() => Navigate("/admin/crs")}/>
                <StatCard label="Uploaded notes" value={totals.notes} icon={<LuBookOpen/>} tone="ok" hint="Approved and published"/>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4 mt-6">

                <div className="flex flex-col gap-4 min-w-0">
                    <Panel title="Pending administrative actions" padded={false}
                        action={pendingCrs.length > 0 && <Link to="/admin/crs" className="text-sm text-primary hover:underline">View all</Link>}>
                        <PendingList pendingCrs={pendingCrs}/>
                    </Panel>

                    <Panel title="Students per academic year">
                        <YearTable perYear={perYear}/>
                    </Panel>
                </div>

                <div className="flex flex-col gap-4 min-w-0">
                    <Panel title="Recent activity" padded={false}>
                        <ActivityList recentActivity={recentActivity}/>
                    </Panel>

                    <Panel title="CR assignments" padded={false}
                        action={<Link to="/admin/crs" className="text-sm text-primary hover:underline">Manage</Link>}>
                        <CrList crAssignments={crAssignments}/>
                    </Panel>
                </div>
            </div>
        </div>
    )
}
