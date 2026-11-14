import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LuArchive, LuArchiveRestore, LuBookOpen, LuChevronRight, LuGraduationCap, LuLayers, LuPencil, LuPlus, LuUsers } from "react-icons/lu";
import { useArchivesectionMutation, useGetstructureQuery } from "../../store/Api/Api";
import { setSectionPopup } from "../../store/slice/PortalSlice";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { StatusBadge } from "../../components/StatusBadge";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { SectionPopup } from "./SectionPopup";
import { AddSectionPopup } from "./AddSectionPopup";
import { formatDate } from "../../utils/format";

const ROOT = {label:"Academic Structure" , to:"/admin/structure"};

// adds up every year of a course, counting only the active (not archived) sections
// key = "sections" -> how many sections , key = "students" -> how many students
const sumYears = (years , key) =>{
    let total = 0;
    for(const year of years){
        for(const section of year.sections){
            if(section.archived) continue;   // skip archived sections
            if(key === "sections"){
                total = total + 1;
            }
            else{
                total = total + section.students;
            }
        }
    }
    return total;
}

// ---------- level 1: courses ----------
// shows one card per course (B.Tech, BBA, ...) with its section and student totals
const CourseList = ({courses}) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((course) => (
            <Link key={course._id} to={`/admin/structure/${course._id}`}
                className="group bg-white border border-line rounded-xl p-5 hover:border-primary/40">
                <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-xl">
                        <LuGraduationCap/>
                    </div>
                    <LuChevronRight className="w-5 h-5 text-muted group-hover:text-primary"/>
                </div>
                <h2 className="text-xl font-semibold mt-4">{course.name}</h2>
                <p className="text-sm text-muted">{course.fullName}</p>
                <dl className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-line text-sm">
                    <div><dt className="text-muted">Duration</dt><dd className="font-semibold">{course.duration} years</dd></div>
                    <div><dt className="text-muted">Sections</dt><dd className="font-semibold tabular-nums">{sumYears(course.years , "sections")}</dd></div>
                    <div><dt className="text-muted">Students</dt><dd className="font-semibold tabular-nums">{sumYears(course.years , "students")}</dd></div>
                </dl>
            </Link>
        ))}
        <div className="rounded-xl border border-dashed border-line p-5 flex flex-col items-center justify-center text-center text-muted min-h-[180px]">
            <LuPlus className="w-6 h-6 mb-2"/>
            <p className="font-medium">More Courses Coming Soon...</p>
            <p className="text-sm mt-1">Acadex starts with B.Tech and BBA.</p>
        </div>
    </div>
);

// ---------- level 2: academic years ----------
// shows the years of one course (1st Year, 2nd Year, ...) as a list
const YearList = ({course}) => (
    <ol className="bg-white border border-line rounded-xl divide-y divide-line">
        {course.years.map((year) =>{
            // only the sections that are not archived
            const active = year.sections.filter((section) => !section.archived);

            // total students in those sections
            let students = 0;
            for(const section of active){
                students = students + section.students;
            }

            // names of the sections, e.g. "A, B, C"
            let sectionNames = "No sections yet";
            if(active.length > 0){
                sectionNames = active.map((section) => section.name).join(", ");
            }

            return (
                <li key={year.year}>
                    <Link to={`/admin/structure/${course._id}/${year.year}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-canvas/60">
                        <span className="w-10 h-10 shrink-0 rounded-full border border-line flex items-center justify-center font-serif font-semibold text-primary">{year.year}</span>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold">{year.label}</p>
                            <p className="text-sm text-muted truncate">
                                {sectionNames}
                            </p>
                        </div>
                        <div className="hidden sm:flex gap-6 text-sm text-right">
                            <div><p className="font-semibold tabular-nums">{active.length}</p><p className="text-muted">sections</p></div>
                            <div><p className="font-semibold tabular-nums">{students}</p><p className="text-muted">students</p></div>
                        </div>
                        <LuChevronRight className="w-5 h-5 text-muted group-hover:text-primary"/>
                    </Link>
                </li>
            )
        })}
    </ol>
);

// one row of the section list: name, counts and the buttons for that section
const SectionRow = ({section , label , working , onArchive , onRestore}) =>{
    const dispatch = useDispatch();

    //$ function to open the "Rename section" popup
    const handleRename = () =>{
        dispatch(setSectionPopup({mode:"rename" , sectionId:section._id , name:section.name , label}));
    }

    // CR positions taken = confirmed CRs + requests still waiting for the student
    const used = section.crs + section.pendingCrs;

    // the small line of text under "x of 2 CR"
    let crText;
    if(section.pendingCrs){
        crText = `${section.pendingCrs} awaiting confirmation`;
    }
    else if(used >= 2){
        crText = "Positions filled";
    }
    else{
        crText = "Position open";
    }

    // archived rows get a grey background
    let rowClass = "flex flex-col md:flex-row md:items-center gap-3 px-5 py-4 ";
    if(section.archived){
        rowClass = rowClass + "bg-canvas/60";
    }

    // a section without subjects shows its 0 in the "waiting" colour
    let subjectCountClass = "font-semibold tabular-nums ";
    if(!section.subjectCount){
        subjectCountClass = subjectCountClass + "text-wait";
    }

    // a section with a confirmed CR shows the number in the "seal" colour
    let crCountClass = "font-semibold tabular-nums ";
    if(section.crs){
        crCountClass = crCountClass + "text-seal";
    }

    // buttons: an active section can be opened / renamed / archived, an archived one can only be restored
    let buttons;
    if(!section.archived){
        buttons = (
            <>
                <Link to={`/admin/sections/${section._id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium">
                    <LuUsers className="w-4 h-4"/> Students
                </Link>
                <Link to={`/admin/sections/${section._id}?tab=subjects`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:border-primary/40 hover:text-primary">
                    <LuBookOpen className="w-4 h-4"/> Subjects
                </Link>
                <button onClick={handleRename}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:border-primary/40 hover:text-primary">
                    <LuPencil className="w-4 h-4"/> Rename
                </button>
                <button onClick={() => onArchive(section)} aria-label={`Archive ${section.name}`} title="Archive"
                    className="p-2 rounded-lg text-muted hover:text-bad hover:bg-bad-soft">
                    <LuArchive className="w-4 h-4"/>
                </button>
            </>
        );
    }
    else{
        buttons = (
            <button onClick={() => onRestore(section)} disabled={working}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:border-primary/40 hover:text-primary disabled:opacity-60">
                <LuArchiveRestore className="w-4 h-4"/> Restore
            </button>
        );
    }

    return (
        <li className={rowClass}>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg font-serif">{section.name}</p>
                    {section.archived && <StatusBadge status="archived"/>}
                </div>
                <p className="text-sm text-muted">Created {formatDate(section.createdAt)}</p>
            </div>
            <div className="flex gap-6 text-sm">
                <div className="w-20"><p className="font-semibold tabular-nums">{section.students}</p><p className="text-muted">students</p></div>
                <div className="w-20">
                    <p className={subjectCountClass}>{section.subjectCount}</p>
                    <p className="text-muted">subjects</p>
                </div>
                <div className="w-32">
                    <p className={crCountClass}>{section.crs} of 2 CR</p>
                    <p className="text-muted">{crText}</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-1">
                {buttons}
            </div>
        </li>
    )
}

// ---------- level 3: sections of a year ----------
// shows the sections of one year with buttons to open, rename, archive or restore them
const SectionList = ({course , year}) =>{
    const dispatch = useDispatch();
    const [showArchived , setShowArchived] = useState(false);   // is "Show archived" ticked?
    const [confirm , setConfirm] = useState(null);              // the section waiting for "Archive?" confirmation
    const [working , setWorking] = useState(false);             // true while the server is archiving / restoring
    const [archivesection] = useArchivesectionMutation();

    const archivedCount = year.sections.filter((section) => section.archived).length;
    // archived sections are listed only when "Show archived" is ticked
    const sections = year.sections.filter((section) => showArchived || !section.archived);
    const label = `${course.name} ${year.label}`;

    //$ function to archive or restore a section
    const handleArchive = async (section , archived) =>{
        try{
            setWorking(true);
            const result = await archivesection({sectionId:section._id , archived}).unwrap();
            if(result?.success) toast.success(result.message);
            setConfirm(null);
        }
        catch(error){
            toast.error(error?.data?.message || "Could Not Update The Section");
            setConfirm(null);
        }
        finally{
            setWorking(false);
        }
    }

    //$ function to restore an archived section
    const handleRestore = (section) =>{
        handleArchive(section , false);
    }

    //$ function to archive the section after the admin confirmed
    const handleConfirmArchive = () =>{
        handleArchive(confirm , true);
    }

    //$ function to open the "Add section" popup for this year
    const handleAddSection = () =>{
        dispatch(setSectionPopup({mode:"add" , courseId:course._id , year:year.year , label}));
    }

    // the list itself, or an empty message when there are no sections
    let listContent;
    if(sections.length === 0){
        listContent = (
            <NoData compact icon={<LuLayers/>} message="No sections added yet."
                description={`Create the first section of ${label} and upload its student list as a CSV file.`}
                buttonText="Add Section" onClick={handleAddSection}/>
        );
    }
    else{
        listContent = (
            <ul className="divide-y divide-line">
                {sections.map((section) => (
                    <SectionRow key={section._id} section={section} label={label} working={working}
                        onArchive={setConfirm} onRestore={handleRestore}/>
                ))}
            </ul>
        );
    }

    // text of the "Archive?" dialog: a section that still has students can't be archived yet
    let confirmMessage = "";
    if(confirm){
        if(confirm.students > 0){
            confirmMessage = `${confirm.name} still has ${confirm.students} students. Remove them from the section before archiving it.`;
        }
        else{
            confirmMessage = `${confirm.name} will be hidden from ${label} and its group closes. You can restore it later.`;
        }
    }

    return (
        <div className="bg-white border border-line rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-line">
                <p className="text-sm text-muted">{year.sections.length - archivedCount} active sections. Open a section to manage its students and subjects.</p>
                {archivedCount > 0 && (
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="accent-[var(--color-primary)]"/>
                        Show archived ({archivedCount})
                    </label>
                )}
            </div>

            {listContent}

            {confirm && (
                <ConfirmDialog title={`Archive ${confirm.name}?`} confirmText="Archive section" loading={working}
                    message={confirmMessage}
                    onConfirm={handleConfirmArchive} onClose={() => setConfirm(null)}/>
            )}
        </div>
    )
}

// the Academic Structure page: courses -> years -> sections, picked from the URL
// /admin/structure                  -> list of courses
// /admin/structure/:courseId        -> years of that course
// /admin/structure/:courseId/:year  -> sections of that year
export const AcademicStructure = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const {courseId , year} = useParams();
    const sectionPopup = useSelector((state) => state.portal.sectionPopup);
    const [courses , setCourses] = useState([]);    // every course with its years and sections
    const {data , isLoading , isError , refetch} = useGetstructureQuery();

    // runs every time new data arrives from the server and copies the course list into state
    useEffect(() =>{
        if(data && data.success && data.data){
            setCourses(data.data);
        }
    },[data]);

    // the server answered with an error and we have nothing to show -> say so (and offer a retry)
    // instead of spinning forever
    if(isError && !courses.length){
        return <NoData message="This page could not be loaded" description="Check your connection and try again." buttonText="Try again" onClick={refetch}/>;
    }
    // keep showing the loader until the first answer from the server arrives
    if(isLoading || (!courses.length && !data)) return <Loader/>;

    // the course named in the URL (if any)
    let course = null;
    if(courseId){
        course = courses.find((item) => item._id === courseId);
    }

    // the year named in the URL (if any). The URL gives text, so compare both as text
    let yearData = null;
    if(course && year){
        yearData = course.years.find((item) => String(item.year) === String(year));
    }

    if(courseId && !course) return <NoData message="This course does not exist" description="Acadex currently supports B.Tech and BBA."
        buttonText="Back to academic structure" onClick={() => Navigate("/admin/structure")}/>;
    if(course && year && !yearData) return <NoData message={`${course.name} has no such year`} description={`${course.name} runs for ${course.duration} years.`}
        buttonText={`Back to ${course.name}`} onClick={() => Navigate(`/admin/structure/${course._id}`)}/>;

    // pick the page title and the list to show, depending on how deep the URL goes
    let header;
    let body;
    if(yearData){
        const label = `${course.name} ${yearData.label}`;

        //$ function to open the "Add section" popup for this year
        const handleAddSection = () =>{
            dispatch(setSectionPopup({mode:"add" , courseId:course._id , year:yearData.year , label}));
        }

        header = <PageHeader title={`${yearData.label} sections`} description={`Sections of ${course.fullName}, ${yearData.label}. You decide how many sections this year has.`}
            path={[ROOT , {label:course.name , to:`/admin/structure/${course._id}`} , {label:yearData.label}]}
            actions={<button onClick={handleAddSection}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium">
                <LuPlus className="w-4 h-4"/> Add Section
            </button>}/>;
        body = <SectionList course={course} year={yearData}/>;
    }
    else if(course){
        header = <PageHeader title={course.name} description={`${course.fullName} runs for ${course.duration} years. Open a year to manage its sections.`}
            path={[ROOT , {label:course.name}]}/>;
        body = <YearList course={course}/>;
    }
    else{
        header = <PageHeader title="Academic Structure" description="College, course, academic year, section, students. Choose a course to manage its years and sections."
            path={[{label:"College"} , {label:"Courses"}]}/>;
        body = <CourseList courses={courses}/>;
    }

    // the section popup is opened through Redux: false = closed , mode "add" = new section , mode "rename" = rename one
    let popupMode = null;
    if(sectionPopup){
        popupMode = sectionPopup.mode;
    }

    return (
        <div>
            {header}
            {body}
            {popupMode === "add" && <AddSectionPopup/>}
            {popupMode === "rename" && <SectionPopup/>}
        </div>
    )
}
