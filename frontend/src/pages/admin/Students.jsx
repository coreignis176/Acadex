import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuSearch } from "react-icons/lu";
import { useGetallstudentsQuery } from "../../store/Api/Api";
import { courses } from "../../data/courses";
import { PageHeader } from "../../components/PageHeader";
import { RoleBadge } from "../../components/StatusBadge";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";

// the status filter buttons
const STATUS = [
    {key:"all" , label:"All"},
    {key:"section" , label:"In a section"},
    {key:"removed" , label:"Removed"}
];

// course id -> its position in the courses list, e.g. {btech:0 , bba:1}. Used for sorting
const COURSE_ORDER = {};
for(let i = 0; i < courses.length; i++){
    COURSE_ORDER[courses[i]._id] = i;
}

// "1st Year" , "2nd Year" , ... for the year dropdown
const YEAR_NAMES = ["1st" , "2nd" , "3rd" , "4th" , "5th"];
const ordinal = (yearNumber) => `${YEAR_NAMES[yearNumber - 1]} Year`;

// compare function for .sort(): course -> year -> section -> class roll; students without a section go last
// it returns a negative number when a comes first, a positive number when b comes first, 0 when equal
// {numeric:true} sorts "2" before "10" (like numbers, not like text)
const byPlacement = (a , b) =>{
    // students without a section go to the end, sorted by name
    if(!a.section && !b.section) return a.name.localeCompare(b.name);
    if(!a.section) return 1;
    if(!b.section) return -1;

    // a result of 0 means "the same", and 0 counts as false in an if,
    // so each check only decides when there is a real difference; otherwise we try the next one
    const byCourse = COURSE_ORDER[a.section.courseId] - COURSE_ORDER[b.section.courseId];
    if(byCourse) return byCourse;

    const byYear = a.section.year - b.section.year;
    if(byYear) return byYear;

    const bySection = a.section.name.localeCompare(b.section.name , undefined , {numeric:true});
    if(bySection) return bySection;

    return String(a.classRollNo).localeCompare(String(b.classRollNo) , undefined , {numeric:true});
}

// one row of the desktop table; students without a section show "-" in the section columns
const StudentTableRow = ({student}) =>{
    // confirmed CRs get a light "seal" background
    let rowClass = "";
    if(student.crStatus === "active"){
        rowClass = "bg-seal-soft/30";
    }

    const dash = <span className="text-muted">-</span>;
    let classRoll = dash;
    let courseName = dash;
    let yearLabel = dash;
    let sectionCell = <span className="text-muted">Not in a section</span>;
    if(student.section){
        classRoll = student.classRollNo;
        courseName = student.section.course;
        yearLabel = student.section.yearLabel;
        sectionCell = <Link to={`/admin/sections/${student.section._id}`} className="font-medium text-primary hover:underline underline-offset-4">{student.section.name}</Link>;
    }

    return (
        <tr className={rowClass}>
            <td className="px-5 py-3">
                <p className="font-medium">{student.name}</p>
                <p className="text-xs text-muted tabular-nums">{student.rollNo}</p>
            </td>
            <td className="px-5 py-3 tabular-nums">{classRoll}</td>
            <td className="px-5 py-3">{courseName}</td>
            <td className="px-5 py-3 whitespace-nowrap">{yearLabel}</td>
            <td className="px-5 py-3">
                {sectionCell}
            </td>
            <td className="px-5 py-3"><RoleBadge crStatus={student.crStatus}/></td>
        </tr>
    )
}

// one card of the mobile list (small screens show this instead of the table)
const StudentCard = ({student}) =>{
    // the four small facts under the name, or "Not in a section"
    let placement;
    if(student.section){
        // "2nd Year" -> "2nd" (the column is narrow)
        const shortYear = student.section.yearLabel.replace(" Year" , "");
        placement = (
            <dl className="grid grid-cols-4 gap-2 mt-2.5 text-xs">
                <div><dt className="text-muted">Roll No.</dt><dd className="font-medium tabular-nums">{student.classRollNo}</dd></div>
                <div><dt className="text-muted">Course</dt><dd className="font-medium">{student.section.course}</dd></div>
                <div><dt className="text-muted">Year</dt><dd className="font-medium">{shortYear}</dd></div>
                <div><dt className="text-muted">Section</dt><dd><Link to={`/admin/sections/${student.section._id}`} className="font-medium text-primary">{student.section.name}</Link></dd></div>
            </dl>
        );
    }
    else{
        placement = <p className="text-sm text-muted mt-1">Not in a section</p>;
    }

    return (
        <li className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-muted tabular-nums">{student.rollNo}</p>
                </div>
                <RoleBadge crStatus={student.crStatus}/>
            </div>
            {placement}
        </li>
    )
}

// page listing every student on Acadex with a search box and course / year / status filters
export const Students = () =>{
    const Navigate = useNavigate();
    const [students , setStudents] = useState([]);    // every student, sorted by course / year / section / roll
    const [search , setSearch] = useState("");        // text typed in the search box
    const [course , setCourse] = useState("all");     // course filter: "all" or a course _id
    const [year , setYear] = useState("all");         // year filter: "all" or "1" , "2" , ...
    const [status , setStatus] = useState("all");     // status filter: "all" , "section" or "removed"
    const {data , isLoading} = useGetallstudentsQuery();

    // runs every time new data arrives from the server and stores the students in sorted order.
    // .slice() makes a copy first, because .sort() changes the array it is called on
    useEffect(() =>{
        if(data && data.success && data.data){
            setStudents(data.data.slice().sort(byPlacement));
        }
    },[data]);

    if(isLoading) return <Loader/>;
    if(!students.length) return <NoData message="No students are registered yet" description="Add a section in Academic Structure and upload its student CSV."
        buttonText="Open Academic Structure" onClick={() => Navigate("/admin/structure")}/>;

    // linear search over name + class roll + college roll, then the filters
    const query = search.trim().toLowerCase();
    const filtered = students.filter((student) =>{
        // 1. search box (the class roll number has to match exactly)
        let classRoll = "";
        if(student.classRollNo !== null && student.classRollNo !== undefined){
            classRoll = String(student.classRollNo);
        }
        let searchMatch = false;
        if(!query){
            searchMatch = true;     // empty search box matches everyone
        }
        else if(student.name.toLowerCase().includes(query)){
            searchMatch = true;
        }
        else if(classRoll.toLowerCase() === query){
            searchMatch = true;
        }
        else if(student.rollNo.toLowerCase().includes(query)){
            searchMatch = true;
        }

        // 2. course and year dropdowns (a student without a section has no course or year)
        let sectionCourseId;
        let sectionYear;
        if(student.section){
            sectionCourseId = student.section.courseId;
            sectionYear = student.section.year;
        }
        const courseMatch = course === "all" || sectionCourseId === course;
        const yearMatch = year === "all" || String(sectionYear) === year;

        // 3. status buttons: All / In a section / Removed (= not in a section)
        let statusMatch;
        if(status === "all"){
            statusMatch = true;
        }
        else if(status === "section"){
            statusMatch = Boolean(student.section);
        }
        else{
            statusMatch = !student.section;
        }

        return searchMatch && courseMatch && yearMatch && statusMatch;
    });

    //$ function to clear the search box and every filter
    const reset = () =>{
        setSearch("");
        setCourse("all");
        setYear("all");
        setStatus("all");
    }

    //$ function to change the course filter (the year filter goes back to "All years")
    const handleCourseChange = (event) =>{
        setCourse(event.target.value);
        setYear("all");
    }

    const selectedCourse = courses.find((item) => item._id === course);

    // how many years the year dropdown offers:
    // the chosen course's duration, or the longest course when "All courses" is picked
    let yearCount = 0;
    if(selectedCourse){
        yearCount = selectedCourse.duration;
    }
    else{
        for(const item of courses){
            if(item.duration > yearCount){
                yearCount = item.duration;
            }
        }
    }

    // [1 , 2 , ... , yearCount]
    const yearOptions = [];
    for(let i = 1; i <= yearCount; i++){
        yearOptions.push(i);
    }

    const selectClass = "px-3 py-2 rounded-lg border border-line bg-white text-sm focus:outline-none focus:border-primary";

    // "student" or "students"
    let studentWord = "students";
    if(filtered.length === 1){
        studentWord = "student";
    }

    // the table + mobile list, or a message when nothing matches the filters
    let listContent;
    if(filtered.length === 0){
        listContent = (
            <NoData compact message="No students match these filters" description="Try a different name, roll number or filter." buttonText="Clear filters" onClick={reset}/>
        );
    }
    else{
        listContent = (
            <>
                {/* desktop table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-muted bg-canvas/60 border-b border-line">
                                <th className="font-medium px-5 py-3">Name</th>
                                <th className="font-medium px-5 py-3 whitespace-nowrap">Roll No. (Class)</th>
                                <th className="font-medium px-5 py-3">Course</th>
                                <th className="font-medium px-5 py-3">Year</th>
                                <th className="font-medium px-5 py-3">Section</th>
                                <th className="font-medium px-5 py-3">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {filtered.map((student) => <StudentTableRow key={student._id} student={student}/>)}
                        </tbody>
                    </table>
                </div>

                {/* mobile list */}
                <ul className="md:hidden divide-y divide-line">
                    {filtered.map((student) => <StudentCard key={student._id} student={student}/>)}
                </ul>
            </>
        );
    }

    return (
        <div>
            <PageHeader title="Students" description="Every student registered on Acadex. Search by name or roll number, or filter by course and year."/>

            <div className="bg-white border border-line rounded-2xl overflow-hidden">
                <div className="flex flex-col xl:flex-row xl:items-center gap-3 p-4 border-b border-line">
                    <label className="relative flex-1 xl:max-w-xs">
                        <span className="sr-only">Search students</span>
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"/>
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or roll number"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-primary"/>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <label className="sr-only" htmlFor="filter-course">Course</label>
                        <select id="filter-course" value={course} onChange={handleCourseChange} className={selectClass}>
                            <option value="all">All courses</option>
                            {courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                        </select>
                        <label className="sr-only" htmlFor="filter-year">Year</label>
                        <select id="filter-year" value={year} onChange={(event) => setYear(event.target.value)} className={selectClass}>
                            <option value="all">All years</option>
                            {yearOptions.map((yearNumber) => <option key={yearNumber} value={String(yearNumber)}>{ordinal(yearNumber)}</option>)}
                        </select>
                        <div className="inline-flex p-1 rounded-lg bg-canvas border border-line text-sm" role="tablist" aria-label="Status">
                            {STATUS.map((option) =>{
                                // the chosen status looks raised (white with a shadow)
                                let buttonClass = "px-3 py-1 rounded-md ";
                                if(status === option.key){
                                    buttonClass = buttonClass + "bg-white shadow-sm font-medium";
                                }
                                else{
                                    buttonClass = buttonClass + "text-muted hover:text-ink";
                                }

                                return (
                                    <button key={option.key} role="tab" aria-selected={status === option.key} onClick={() => setStatus(option.key)}
                                        className={buttonClass}>
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <p className="text-sm text-muted xl:ml-auto">{filtered.length} {studentWord}</p>
                </div>

                {listContent}
            </div>
        </div>
    )
}
