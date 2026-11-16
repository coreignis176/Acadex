import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuSearch } from "react-icons/lu";
import { useGetallstudentsQuery } from "../../store/Api/Api";
import { courses } from "../../data/courses";
import { PageHeader } from "../../components/PageHeader";
import { RoleBadge } from "../../components/StatusBadge";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";

const STATUS = [
    {key:"all" , label:"All"},
    {key:"section" , label:"In a section"},
    {key:"removed" , label:"Removed"}
];

const COURSE_ORDER = {};
for(let i = 0; i < courses.length; i++){
    COURSE_ORDER[courses[i]._id] = i;
}

const YEAR_NAMES = ["1st" , "2nd" , "3rd" , "4th" , "5th"];
const ordinal = (yearNumber) => `${YEAR_NAMES[yearNumber - 1]} Year`;

const byPlacement = (a , b) =>{
    if(!a.section && !b.section) return a.name.localeCompare(b.name);
    if(!a.section) return 1;
    if(!b.section) return -1;

    const byCourse = COURSE_ORDER[a.section.courseId] - COURSE_ORDER[b.section.courseId];
    if(byCourse) return byCourse;

    const byYear = a.section.year - b.section.year;
    if(byYear) return byYear;

    const bySection = a.section.name.localeCompare(b.section.name , undefined , {numeric:true});
    if(bySection) return bySection;

    return String(a.classRollNo).localeCompare(String(b.classRollNo) , undefined , {numeric:true});
}

const StudentTableRow = ({student}) =>{
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

const StudentCard = ({student}) =>{
    let placement;
    if(student.section){
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

export const Students = () =>{
    const Navigate = useNavigate();
    const [students , setStudents] = useState([]);
    const [search , setSearch] = useState("");
    const [course , setCourse] = useState("all");
    const [year , setYear] = useState("all");
    const [status , setStatus] = useState("all");
    const {data , isLoading} = useGetallstudentsQuery();

    useEffect(() =>{
        if(data && data.success && data.data){
            setStudents(data.data.slice().sort(byPlacement));
        }
    },[data]);

    if(isLoading) return <Loader/>;
    if(!students.length) return <NoData message="No students are registered yet" description="Add a section in Academic Structure and upload its student CSV."
        buttonText="Open Academic Structure" onClick={() => Navigate("/admin/structure")}/>;

    const query = search.trim().toLowerCase();
    const filtered = students.filter((student) =>{
        let classRoll = "";
        if(student.classRollNo !== null && student.classRollNo !== undefined){
            classRoll = String(student.classRollNo);
        }
        let searchMatch = false;
        if(!query){
            searchMatch = true;
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

        let sectionCourseId;
        let sectionYear;
        if(student.section){
            sectionCourseId = student.section.courseId;
            sectionYear = student.section.year;
        }
        const courseMatch = course === "all" || sectionCourseId === course;
        const yearMatch = year === "all" || String(sectionYear) === year;

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

    const reset = () =>{
        setSearch("");
        setCourse("all");
        setYear("all");
        setStatus("all");
    }

    const handleCourseChange = (event) =>{
        setCourse(event.target.value);
        setYear("all");
    }

    const selectedCourse = courses.find((item) => item._id === course);

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

    const yearOptions = [];
    for(let i = 1; i <= yearCount; i++){
        yearOptions.push(i);
    }

    const selectClass = "px-3 py-2 rounded-lg border border-line bg-white text-sm focus:outline-none focus:border-primary";

    let studentWord = "students";
    if(filtered.length === 1){
        studentWord = "student";
    }

    let listContent;
    if(filtered.length === 0){
        listContent = (
            <NoData compact message="No students match these filters" description="Try a different name, roll number or filter." buttonText="Clear filters" onClick={reset}/>
        );
    }
    else{
        listContent = (
            <>
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
