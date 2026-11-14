import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import { useGetcrstatsQuery } from "../../store/Api/Api";
import { PageHeader } from "../../components/PageHeader";
import { RoleBadge } from "../../components/StatusBadge";
import { Loader } from "../../components/Loader";
import { NoData } from "../../components/NoData";
import { initials } from "../../utils/format";

// one student row: initials circle, name, roll number and role badge
const StudentRow = ({student}) =>{
    // CRs get a gold circle, other students a blue one
    let circleColors = "bg-primary-soft text-primary";
    if(student.crStatus === "active") circleColors = "bg-seal-soft text-seal";
    const circleClass = `w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${circleColors}`;

    return (
        <li className="flex items-center gap-3 px-5 py-3">
            <div className={circleClass}>
                {initials(student.name)}
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{student.name}</p>
                <p className="text-sm text-muted tabular-nums">{student.rollNo}</p>
            </div>
            <RoleBadge crStatus={student.crStatus}/>
        </li>
    )
}

// CR section page: list of the section's students with a search box
export const CrSection = () =>{
    const [stats , setStats] = useState(null); // the section info and students from the server (null until loaded)
    const [search , setSearch] = useState(""); // the text typed in the search box
    const {data , isLoading , isError , refetch} = useGetcrstatsQuery();

    // runs whenever new data arrives from the server and copies the stats into state
    useEffect(() =>{
        if(data && data.success && data.data){
            setStats(data.data);
        }
    },[data]);

    // the server answered with an error and we have nothing to show -> say so (and offer a retry)
    // instead of spinning forever
    if(isError && !stats){
        return <NoData message="This page could not be loaded" description="Check your connection and try again." buttonText="Try again" onClick={refetch}/>;
    }
    if(isLoading || !stats) return <Loader/>;

    const section = stats.section;

    // students whose name or roll number contains the search text (all students when the box is empty)
    const searchText = search.trim().toLowerCase();
    const allStudents = stats.students || [];
    const students = allStudents.filter((student) =>{
        if(searchText === "") return true;
        if(student.name.toLowerCase().includes(searchText)) return true;
        if(student.rollNo.toLowerCase().includes(searchText)) return true;
        return false;
    });

    // the list area: a "no match" message or the list of students
    let content;
    if(students.length === 0){
        content = <NoData compact message="No students match" description={`Nobody in ${section.name} matches "${search}".`} buttonText="Clear search" onClick={() => setSearch("")}/>;
    }
    else{
        content = (
            <ul className="divide-y divide-line">
                {students.map((student) => <StudentRow key={student._id} student={student}/>)}
            </ul>
        );
    }

    return (
        <div>
            <PageHeader
                path={[{label:section.course} , {label:section.yearLabel} , {label:section.name , to:"/cr"} , {label:"Students"}]}
                title={`Students of ${section.name}`}
                description="The admin registers and removes students. Contact the academic office if someone is missing."
            />

            <div className="bg-white border border-line rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-line">
                    <p className="text-sm text-muted"><span className="font-semibold text-ink tabular-nums">{stats.students.length}</span> registered students</p>
                    <label className="relative sm:ml-auto sm:w-72">
                        <span className="sr-only">Search students</span>
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"/>
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or roll number"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-primary"/>
                    </label>
                </div>

                {content}
            </div>
        </div>
    )
}
