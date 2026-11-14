import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LuBookOpen, LuChevronRight, LuSearch, LuUserPlus, LuUsers } from "react-icons/lu";
import { PiSealCheckFill } from "react-icons/pi";
import { useGetsectionQuery } from "../../store/Api/Api";
import { setStudentPopup } from "../../store/slice/PortalSlice";
import { PageHeader } from "../../components/PageHeader";
import { RoleBadge } from "../../components/StatusBadge";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { StudentPopup } from "./StudentPopup";
import { StudentDetailsPopup } from "./StudentDetailsPopup";
import { SectionSubjects } from "./SectionSubjects";

// card showing "1/2 CRs appointed" + who holds each position
const CrSummary = ({students , max}) =>{
    const active = students.filter((student) => student.crStatus === "active");
    const pending = students.filter((student) => student.crStatus === "pending");
    const used = active.length + pending.length;

    // one "slot" per CR position: confirmed CRs first, then requests waiting, then open positions
    const slots = [];
    for(const student of active){
        slots.push({kind:"active" , name:student.name});
    }
    for(const student of pending){
        slots.push({kind:"pending" , name:student.name});
    }
    while(slots.length < max) slots.push({kind:"free"});

    return (
        <div className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Class Representatives</p>
                <PiSealCheckFill className="w-5 h-5 text-seal"/>
            </div>
            <p className="text-2xl font-semibold tabular-nums">{active.length}/{max} <span className="text-base font-medium text-muted">CRs appointed</span></p>
            <ul className="flex flex-wrap gap-2">
                {slots.map((slot , index) =>{
                    // colour and text depend on the kind of slot (an open position is the default)
                    let slotClass = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ";
                    let slotText = "Open position";
                    if(slot.kind === "active"){
                        slotClass = slotClass + "bg-seal-soft text-seal font-semibold";
                        slotText = slot.name;
                    }
                    else if(slot.kind === "pending"){
                        slotClass = slotClass + "border border-dashed border-seal/60 text-seal";
                        slotText = `${slot.name}, awaiting confirmation`;
                    }
                    else{
                        slotClass = slotClass + "border border-line text-muted";
                    }

                    return (
                        <li key={index} className={slotClass}>
                            {slotText}
                        </li>
                    )
                })}
            </ul>
            {used >= max && <p className="text-xs text-muted">Both positions are in use, so Add to CR is turned off for other students.</p>}
        </div>
    )
}

// one row of the desktop table; clicking anywhere on it opens the student's details
const StudentTableRow = ({student , onOpen}) =>{
    // confirmed CRs get a light "seal" background
    let rowClass = "cursor-pointer hover:bg-primary-soft/40 ";
    if(student.crStatus === "active"){
        rowClass = rowClass + "bg-seal-soft/30";
    }

    //$ function to open the details when the name button is clicked
    const handleNameClick = (event) =>{
        event.stopPropagation();   // the row has its own onClick; stop it from running a second time
        onOpen(student._id);
    }

    return (
        <tr onClick={() => onOpen(student._id)} className={rowClass}>
            <td className="px-5 py-3">
                <button onClick={handleNameClick} className="font-medium text-left hover:text-primary">
                    {student.name}
                </button>
            </td>
            <td className="px-5 py-3 tabular-nums">{student.classRollNo}</td>
            <td className="px-5 py-3 tabular-nums text-muted">{student.rollNo}</td>
            <td className="px-5 py-3"><RoleBadge crStatus={student.crStatus}/></td>
            <td className="pr-4 text-muted"><LuChevronRight className="w-4 h-4"/></td>
        </tr>
    )
}

// one item of the mobile list (small screens show this instead of the table)
const StudentListItem = ({student , onOpen}) =>{
    // confirmed CRs get a light "seal" background
    let buttonClass = "w-full text-left flex items-center gap-3 px-4 py-3.5 ";
    if(student.crStatus === "active"){
        buttonClass = buttonClass + "bg-seal-soft/30";
    }

    return (
        <li>
            <button onClick={() => onOpen(student._id)} className={buttonClass}>
                <span className="w-9 text-center text-sm font-semibold tabular-nums text-muted">{student.classRollNo}</span>
                <span className="min-w-0 flex-1">
                    <span className="block font-medium truncate">{student.name}</span>
                    <span className="block text-xs text-muted tabular-nums">{student.rollNo}</span>
                </span>
                <RoleBadge crStatus={student.crStatus}/>
            </button>
        </li>
    )
}

// the Students tab: totals, CR summary, a search box and the list of students
const StudentsTab = ({section , students , maxCrs , search , setSearch , filtered , onOpen , onAdd}) =>{
    // archived sections can't take new students, so their empty list has no button
    let emptyButtonText;
    let emptyButtonClick;
    if(!section.archived){
        emptyButtonText = "Add a student";
        emptyButtonClick = onAdd;
    }

    // what goes below the search box: an empty message, a "no match" message, or the students
    let listContent;
    if(students.length === 0){
        listContent = (
            <NoData compact message={`${section.name} has no students`} description="Add students so they can use Acadex."
                buttonText={emptyButtonText} onClick={emptyButtonClick}/>
        );
    }
    else if(filtered.length === 0){
        listContent = (
            <NoData compact message="No students match your search" description={`Nothing matches "${search}".`} buttonText="Clear search" onClick={() => setSearch("")}/>
        );
    }
    else{
        listContent = (
            <>
                {/* desktop table */}
                <table className="hidden md:table w-full text-sm">
                    <thead>
                        <tr className="text-left text-muted bg-canvas/60 border-b border-line">
                            <th className="font-medium px-5 py-3">Student Name</th>
                            <th className="font-medium px-5 py-3 w-44">Class Roll Number</th>
                            <th className="font-medium px-5 py-3 w-48">College Roll Number</th>
                            <th className="font-medium px-5 py-3 w-56">CR Status</th>
                            <th className="w-10"><span className="sr-only">Open</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {filtered.map((student) => <StudentTableRow key={student._id} student={student} onOpen={onOpen}/>)}
                    </tbody>
                </table>

                {/* mobile list */}
                <ul className="md:hidden divide-y divide-line">
                    {filtered.map((student) => <StudentListItem key={student._id} student={student} onOpen={onOpen}/>)}
                </ul>
            </>
        );
    }

    // small text on the right of the search box
    let searchSummary = "Sorted by class roll number";
    if(search){
        searchSummary = `${filtered.length} of ${students.length} students`;
    }

    return (
        <>
            {/* summary */}
            <div className="grid gap-4 md:grid-cols-[260px_1fr] mb-5">
                <div className="bg-white border border-line rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted">Total students</p>
                        <LuUsers className="w-5 h-5 text-primary"/>
                    </div>
                    <p className="text-3xl font-semibold tabular-nums mt-3">{students.length}</p>
                    <p className="text-xs text-muted mt-1">Registered in {section.name}</p>
                </div>
                <CrSummary students={students} max={maxCrs}/>
            </div>

            <div className="bg-white border border-line rounded-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-line">
                    <label className="relative flex-1 sm:max-w-sm">
                        <span className="sr-only">Search students</span>
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"/>
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or roll number"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-primary"/>
                    </label>
                    <p className="text-sm text-muted sm:ml-auto">{searchSummary}</p>
                </div>

                {listContent}
            </div>
        </>
    )
}

// page of one section with two tabs: its students (with CR status) and its subjects
export const SectionStudents = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const {sectionId} = useParams();
    // the open tab is kept in the URL: ?tab=subjects -> Subjects , anything else -> Students
    const [params , setParams] = useSearchParams();
    let tab = "students";
    if(params.get("tab") === "subjects"){
        tab = "subjects";
    }
    const studentPopup = useSelector((state) => state.portal.studentPopup);
    const [details , setDetails] = useState(null);   // the section, its students and subjects from the server
    const [search , setSearch] = useState("");        // text typed in the search box
    const [openId , setOpenId] = useState(null);      // _id of the student whose details popup is open
    const {data , isLoading , error} = useGetsectionQuery({sectionId});

    // runs every time new data arrives from the server and copies it into state
    useEffect(() =>{
        if(data && data.success && data.data){
            setDetails(data.data);
        }
    },[data]);

    if(isLoading) return <Loader/>;
    if(error) return <NoData message="This section could not be found" description={error?.data?.message}
        buttonText="Back to Academic Structure" onClick={() => Navigate("/admin/structure")}/>;
    if(!details) return <Loader/>;

    // take the values out of "details"
    const section = details.section;
    const students = details.students;
    const crSlotsUsed = details.crSlotsUsed;
    const maxCrs = details.maxCrs;
    // subjects and siblings become [] when the server leaves them out
    let subjects = details.subjects;
    if(subjects === undefined){
        subjects = [];
    }
    let siblings = details.siblings;
    if(siblings === undefined){
        siblings = [];
    }

    // students matching the search box: name, class roll or college roll
    const query = search.trim().toLowerCase();
    const filtered = students.filter((student) =>{
        if(!query) return true;    // empty search box -> show everyone
        if(student.name.toLowerCase().includes(query)) return true;
        if(String(student.classRollNo).toLowerCase().includes(query)) return true;
        if(student.rollNo.toLowerCase().includes(query)) return true;
        return false;
    });

    // look the open student up in the latest list, so the popup shows live data after every change
    let openStudent = null;
    if(openId){
        openStudent = students.find((student) => student._id === openId);
    }

    //$ function to open the "Add a student" popup
    const openAdd = () => dispatch(setStudentPopup({sectionId:section._id , label:section.label}));

    //$ function to switch tabs by changing the URL (?tab=subjects , or nothing for Students)
    const openTab = (key) =>{
        if(key === "students"){
            setParams({} , {replace:true});
        }
        else{
            setParams({tab:key} , {replace:true});
        }
    }

    // the two tab buttons
    const tabs = [
        {key:"students" , label:"Students" , count:students.length , icon:<LuUsers className="w-4 h-4"/>},
        {key:"subjects" , label:"Subjects" , count:subjects.length , icon:<LuBookOpen className="w-4 h-4"/>}
    ];

    // text under the page title, depending on the open tab
    let headerDescription;
    if(tab === "subjects"){
        headerDescription = `${section.course}, ${section.yearLabel}. Add the subjects students of this section study.`;
    }
    else{
        headerDescription = `${section.course}, ${section.yearLabel}. Click a student to appoint a CR, edit details or remove them.`;
    }

    // the "Add a student" button on the right of the title (only on the Students tab of an active section)
    let headerAction = false;
    if(!section.archived && tab === "students"){
        headerAction = (
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line bg-white text-sm font-medium hover:border-primary/40 hover:text-primary">
                <LuUserPlus className="w-4 h-4"/> Add a student
            </button>
        );
    }

    // what is shown below the tab buttons
    let tabContent;
    if(tab === "subjects"){
        tabContent = <SectionSubjects section={section} subjects={subjects} siblings={siblings}/>;
    }
    else{
        tabContent = (
            <StudentsTab section={section} students={students} maxCrs={maxCrs} search={search} setSearch={setSearch}
                filtered={filtered} onOpen={setOpenId} onAdd={openAdd}/>
        );
    }

    return (
        <div>
            <PageHeader title={section.name}
                description={headerDescription}
                path={[
                    {label:"Academic Structure" , to:"/admin/structure"},
                    {label:section.course , to:`/admin/structure/${section.courseId}`},
                    {label:section.yearLabel , to:`/admin/structure/${section.courseId}/${section.year}`},
                    {label:section.name}
                ]}
                actions={headerAction}/>

            {section.archived && (
                <p className="mb-4 text-sm bg-wait-soft text-wait rounded-lg px-4 py-3">This section is archived. Restore it from Academic Structure to add students again.</p>
            )}

            {/* tabs */}
            <div className="flex gap-6 border-b border-line mb-5" role="tablist" aria-label="Section">
                {tabs.map((tabItem) =>{
                    // the open tab is underlined in the primary colour
                    let buttonClass = "pb-3 -mb-px border-b-2 text-sm inline-flex items-center gap-2 ";
                    let countClass = "px-1.5 rounded-full text-xs tabular-nums ";
                    if(tab === tabItem.key){
                        buttonClass = buttonClass + "border-primary text-primary font-semibold";
                        countClass = countClass + "bg-primary-soft";
                    }
                    else{
                        buttonClass = buttonClass + "border-transparent text-muted hover:text-ink";
                        countClass = countClass + "bg-canvas";
                    }

                    return (
                        <button key={tabItem.key} role="tab" aria-selected={tab === tabItem.key} onClick={() => openTab(tabItem.key)}
                            className={buttonClass}>
                            {tabItem.icon} {tabItem.label}
                            <span className={countClass}>{tabItem.count}</span>
                        </button>
                    )
                })}
            </div>

            {tabContent}

            {openStudent && (
                <StudentDetailsPopup key={openStudent._id} student={openStudent} section={section}
                    crSlotsUsed={crSlotsUsed} maxCrs={maxCrs} onClose={() => setOpenId(null)}/>
            )}
            {studentPopup && <StudentPopup/>}
        </div>
    )
}
