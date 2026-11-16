import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LuCircleAlert, LuCircleCheck, LuDownload, LuFileSpreadsheet, LuKeyboard, LuPlus, LuTrash2, LuUpload, LuX } from "react-icons/lu";
import { Modal } from "../../components/Modal";
import { setSectionPopup } from "../../store/slice/PortalSlice";
import { useAddsectionMutation } from "../../store/Api/Api";
import { CSV_COLUMNS, MAX_CSV_BYTES, MAX_CSV_ROWS, readStudentCsv, readTypedStudents, downloadCsvTemplate } from "../../utils/csv";
import { fileSize } from "../../utils/format";

const SOURCES = [
    {value:"csv" , label:"Upload CSV" , icon:LuUpload},
    {value:"manual" , label:"Type manually" , icon:LuKeyboard}
];

const SourceTabs = ({source , onChange}) =>{
    return (
        <div className="inline-flex rounded-xl border border-line bg-canvas p-1" role="tablist" aria-label="How to add students">
            {SOURCES.map((option) =>{
                const Icon = option.icon;
                const active = source === option.value;
                let tabClass = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm text-muted hover:text-ink";
                if(active) tabClass = "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm bg-white text-ink font-medium shadow-sm";
                return (
                    <button key={option.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(option.value)} className={tabClass}>
                        <Icon className="w-4 h-4"/> {option.label}
                    </button>
                )
            })}
        </div>
    )
}

const ManualStudents = ({rows , errorsByRow , focusId , onChangeCell , onAddRow , onRemoveRow}) =>{
    const input = "w-full px-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:border-primary";

    const handleKeyDown = (event , index) =>{
        if(event.key !== "Enter") return;
        event.preventDefault();
        if(index === rows.length - 1) onAddRow();
    }

    return (
        <div className="rounded-xl border border-line overflow-hidden">
            <div className="hidden sm:grid grid-cols-[2.5rem_1fr_9rem_11rem_2.5rem] gap-2 px-3 py-2 bg-canvas text-xs text-muted">
                <span>#</span><span>Student Name</span><span>Class Roll No.</span><span>College Roll No.</span><span/>
            </div>

            <ol className="max-h-80 overflow-auto thin-scroll divide-y divide-line">
                {rows.map((row , index) =>{
                    const rowNumber = index + 1;
                    const problems = errorsByRow[rowNumber] || [];
                    let border = "border-line";
                    if(problems.length > 0) border = "border-bad/50";

                    return (
                        <li key={row.id} className="px-3 py-2.5">
                            <div className="grid grid-cols-[2rem_1fr_2.5rem] sm:grid-cols-[2.5rem_1fr_9rem_11rem_2.5rem] gap-2 items-center">
                                <span className="text-sm text-muted tabular-nums">{rowNumber}</span>
                                <input value={row.name} onChange={(event) => onChangeCell(row.id , "name" , event.target.value)}
                                    onKeyDown={(event) => handleKeyDown(event , index)} autoFocus={row.id === focusId}
                                    placeholder="Student name, e.g. Priya Negi" aria-label={`Student ${rowNumber} name`} className={`${input} ${border}`}/>
                                <button type="button" onClick={() => onRemoveRow(row.id)} aria-label={`Remove student ${rowNumber}`}
                                    className="sm:hidden p-2 rounded-md text-muted hover:text-bad hover:bg-bad-soft justify-self-center"><LuTrash2 className="w-4 h-4"/></button>
                                <input value={row.classRollNo} onChange={(event) => onChangeCell(row.id , "classRollNo" , event.target.value)}
                                    onKeyDown={(event) => handleKeyDown(event , index)}
                                    placeholder="Class roll, e.g. 13" aria-label={`Student ${rowNumber} class roll number`}
                                    className={`${input} ${border} uppercase col-start-2 sm:col-start-auto`}/>
                                <input value={row.collegeRollNo} onChange={(event) => onChangeCell(row.id , "collegeRollNo" , event.target.value)}
                                    onKeyDown={(event) => handleKeyDown(event , index)}
                                    placeholder="College roll, e.g. BT25ML013" aria-label={`Student ${rowNumber} college roll number`}
                                    className={`${input} ${border} uppercase col-start-2 sm:col-start-auto`}/>
                                <button type="button" onClick={() => onRemoveRow(row.id)} aria-label={`Remove student ${rowNumber}`}
                                    className="hidden sm:block p-2 rounded-md text-muted hover:text-bad hover:bg-bad-soft justify-self-center"><LuTrash2 className="w-4 h-4"/></button>
                            </div>
                            {problems.length > 0 && (
                                <ul className="mt-1.5 sm:ml-[3rem] ml-[2.5rem] text-bad text-xs leading-snug">
                                    {problems.map((message) => <li key={message}>{message}</li>)}
                                </ul>
                            )}
                        </li>
                    )
                })}
            </ol>

            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-canvas border-t border-line">
                <button type="button" onClick={onAddRow} disabled={rows.length >= MAX_CSV_ROWS}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-line text-sm font-medium hover:border-primary/40 hover:text-primary disabled:opacity-50">
                    <LuPlus className="w-4 h-4"/> Add student
                </button>
                <p className="text-xs text-muted">Press Enter on the last line to add another. Empty lines are ignored.</p>
            </div>
        </div>
    )
}

const firstFile = (fileList) =>{
    if(fileList && fileList.length > 0) return fileList[0];
    return null;
}

const CellText = ({text}) =>{
    if(text) return text;
    return <span className="text-muted italic">empty</span>;
}

const PreviewRow = ({student}) =>{
    const hasProblems = student.errors.length > 0;

    let rowClass = "";
    if(hasProblems){
        rowClass = "bg-bad-soft/30";
    }

    let status;
    if(hasProblems){
        status = <ul className="text-bad text-xs leading-snug">{student.errors.map((message) => <li key={message}>{message}</li>)}</ul>;
    }
    else{
        status = <span className="inline-flex items-center gap-1 text-ok text-xs font-medium"><LuCircleCheck className="w-3.5 h-3.5"/> Ready</span>;
    }

    return (
        <tr className={rowClass}>
            <td className="px-4 py-2 text-muted tabular-nums">{student.row}</td>
            <td className="px-4 py-2 font-medium"><CellText text={student.name}/></td>
            <td className="px-4 py-2 tabular-nums"><CellText text={student.classRollNo}/></td>
            <td className="px-4 py-2 tabular-nums"><CellText text={student.collegeRollNo}/></td>
            <td className="px-4 py-2">
                {status}
            </td>
        </tr>
    )
}

const CsvPreview = ({rows , visibleRows , problemCount , onlyProblems , setOnlyProblems}) =>{
    let studentWord = "students";
    if(rows.length === 1) studentWord = "student";

    let summaryText = "Everything looks right.";
    if(problemCount === 1){
        summaryText = "1 row needs fixing. Correct the file and upload it again.";
    }
    else if(problemCount > 1){
        summaryText = `${problemCount} rows need fixing. Correct the file and upload it again.`;
    }

    let barClass = "flex flex-wrap items-center gap-3 px-4 py-3 text-sm ";
    let barIcon;
    if(problemCount){
        barClass = barClass + "bg-bad-soft/60";
        barIcon = <LuCircleAlert className="w-5 h-5 text-bad"/>;
    }
    else{
        barClass = barClass + "bg-ok-soft/60";
        barIcon = <LuCircleCheck className="w-5 h-5 text-ok"/>;
    }

    return (
        <div className="rounded-xl border border-line overflow-hidden">
            <div className={barClass}>
                {barIcon}
                <p className="flex-1">
                    <span className="font-semibold">{rows.length} {studentWord} found.</span>{" "}
                    {summaryText}
                </p>
                {problemCount > 0 && (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={onlyProblems} onChange={(event) => setOnlyProblems(event.target.checked)} className="accent-[var(--color-bad)]"/>
                        Only show problems
                    </label>
                )}
            </div>
            <div className="max-h-72 overflow-auto thin-scroll">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white shadow-[0_1px_0_var(--color-line)]">
                        <tr className="text-left text-muted">
                            <th className="font-normal px-4 py-2 w-14">Row</th>
                            <th className="font-normal px-4 py-2">Student Name</th>
                            <th className="font-normal px-4 py-2">Class Roll No.</th>
                            <th className="font-normal px-4 py-2">College Roll No.</th>
                            <th className="font-normal px-4 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {visibleRows.map((student) => <PreviewRow key={student.row} student={student}/>)}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export const AddSectionPopup = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const popup = useSelector((state) => state.portal.sectionPopup);
    const [addsection] = useAddsectionMutation();
    const [saving , setSaving] = useState(false);
    const [file , setFile] = useState(null);
    const [parsed , setParsed] = useState(null);
    const [serverErrors , setServerErrors] = useState({});
    const [onlyProblems , setOnlyProblems] = useState(false);
    const [source , setSource] = useState("csv");
    const nextId = useRef(2);
    const [typedRows , setTypedRows] = useState([{id:1 , name:"" , classRollNo:"" , collegeRollNo:""}]);
    const [focusId , setFocusId] = useState(null);
    const {register , handleSubmit , formState:{errors}} = useForm({mode:"onChange"});

    const close = () => dispatch(setSectionPopup(false));

    const handleSource = (value) =>{
        setSource(value);
        setServerErrors({});
        setOnlyProblems(false);
    }

    const handleChangeCell = (id , key , value) =>{
        setServerErrors({});
        setTypedRows((current) => current.map((row) =>{
            if(row.id !== id) return row;
            const changed = Object.assign({} , row);
            changed[key] = value;
            return changed;
        }));
    }

    const handleAddRow = () =>{
        if(typedRows.length >= MAX_CSV_ROWS) return;
        const id = nextId.current;
        nextId.current = id + 1;
        setTypedRows((current) => current.concat([{id , name:"" , classRollNo:"" , collegeRollNo:""}]));
        setFocusId(id);
    }

    const handleRemoveRow = (id) =>{
        setServerErrors({});
        setTypedRows((current) =>{
            if(current.length === 1) return [{id:current[0].id , name:"" , classRollNo:"" , collegeRollNo:""}];
            return current.filter((row) => row.id !== id);
        });
    }

    const handleFile = async (picked) =>{
        setServerErrors({});
        setOnlyProblems(false);
        if(!picked) return;
        setFile({name:picked.name , size:picked.size});
        if(!/\.csv$/i.test(picked.name)){
            setParsed({error:"Please choose a .csv file. In Excel or Google Sheets use File > Download > CSV."});
            return;
        }
        if(picked.size > MAX_CSV_BYTES){
            setParsed({error:`The file is ${fileSize(picked.size)}. CSV files can be at most 1 MB.`});
            return;
        }
        try{
            const text = await picked.text();
            setParsed(readStudentCsv(text));
        }
        catch{
            setParsed({error:"The file could not be read. Save it again as CSV (UTF-8) and retry."});
        }
    }

    const handleChoose = (event) =>{
        handleFile(firstFile(event.target.files));
    }

    const handleDrop = (event) =>{
        event.preventDefault();
        handleFile(firstFile(event.dataTransfer.files));
    }

    const clearFile = () =>{
        setFile(null);
        setParsed(null);
        setServerErrors({});
    }

    let students = [];
    if(source === "manual"){
        students = readTypedStudents(typedRows).students;
    }
    else if(parsed && parsed.students){
        students = parsed.students;
    }

    const rows = [];
    for(const student of students){
        const messagesFromServer = serverErrors[student.row] || [];
        rows.push({
            row:student.row,
            name:student.name,
            classRollNo:student.classRollNo,
            collegeRollNo:student.collegeRollNo,
            errors:student.errors.concat(messagesFromServer)
        });
    }

    const problemRows = rows.filter((row) => row.errors.length > 0);
    const problemCount = problemRows.length;
    const visibleRows = onlyProblems ? problemRows : rows;
    const ready = rows.length > 0 && problemCount === 0;

    const handleOnSubmit = async (form) =>{
        if(!ready) return;
        try{
            setSaving(true);
            const studentsToSave = rows.map((row) => ({row:row.row , name:row.name , classRollNo:row.classRollNo , collegeRollNo:row.collegeRollNo}));
            const result = await addsection({
                courseId:popup.courseId,
                year:popup.year,
                name:form.name,
                students:studentsToSave
            }).unwrap();
            if(result?.success){
                toast.success(result.message);
                close();
                Navigate(`/admin/sections/${result.data.section._id}?tab=subjects`);
            }
        }
        catch(error){
            let list = [];
            if(error && error.data && error.data.data && error.data.data.errors){
                list = error.data.data.errors;
            }
            if(list.length > 0){
                const messagesByRow = {};
                for(const item of list){
                    if(!messagesByRow[item.row]){
                        messagesByRow[item.row] = [];
                    }
                    messagesByRow[item.row].push(item.message);
                }
                setServerErrors(messagesByRow);
                setOnlyProblems(true);
            }
            toast.error(error?.data?.message || "Could Not Create The Section");
        }
        finally{
            setSaving(false);
        }
    }

    const field = "w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:border-primary";

    let fileBox;
    if(!file){
        fileBox = (
            <label onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed border-primary/30 bg-primary-soft/40 cursor-pointer hover:bg-primary-soft text-center">
                <span className="w-11 h-11 rounded-xl bg-white text-primary flex items-center justify-center shadow-sm"><LuUpload className="w-5 h-5"/></span>
                <span className="text-sm"><span className="font-semibold text-primary">Choose a CSV file</span> <span className="text-muted">or drop it here</span></span>
                <span className="text-xs text-muted">Up to 500 students, 1 MB</span>
                <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleChoose}/>
            </label>
        );
    }
    else{
        let sizeText = fileSize(file.size);
        if(!sizeText) sizeText = "under 1 KB";

        fileBox = (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-line bg-white">
                <LuFileSpreadsheet className="w-5 h-5 text-ok shrink-0"/>
                <span className="text-sm min-w-0 flex-1"><span className="font-medium break-all">{file.name}</span> <span className="text-muted">({sizeText})</span></span>
                <label className="text-sm text-primary hover:underline cursor-pointer">
                    Replace
                    <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleChoose}/>
                </label>
                <button type="button" onClick={clearFile} aria-label="Remove file" className="p-1 rounded-md text-muted hover:text-bad hover:bg-bad-soft"><LuX className="w-4 h-4"/></button>
            </div>
        );
    }

    let fileError = null;
    if(parsed && parsed.error){
        fileError = parsed.error;
    }

    const errorsByRow = {};
    for(const row of rows){
        if(row.errors.length > 0) errorsByRow[row.row] = row.errors;
    }

    let submitText = "Upload a valid CSV to continue";
    if(source === "manual"){
        submitText = "Type at least one student to continue";
        if(problemCount === 1) submitText = "Fix the student marked in red";
        else if(problemCount > 1) submitText = `Fix the ${problemCount} students marked in red`;
    }
    if(saving){
        submitText = "Creating section...";
    }
    else if(ready){
        let studentWord = "students";
        if(rows.length === 1) studentWord = "student";
        submitText = `Create section and register ${rows.length} ${studentWord}`;
    }

    return (
        <Modal onClose={close} width="max-w-3xl" title="Add section" description={`Create a section in ${popup.label} and register its students from a CSV file or by typing them in.`}>
            <form onSubmit={handleSubmit(handleOnSubmit)} className="flex flex-col gap-5" noValidate>

                <div>
                    <label htmlFor="section-name" className="block text-sm font-medium mb-1.5">Section name</label>
                    <input id="section-name" autoFocus placeholder="e.g. Section A or ML4" className={`${field} max-w-sm`}
                        {...register("name" , {
                            required:"Enter a section name",
                            validate:(value) => value.trim().length > 0 || "Enter a section name",
                            maxLength:{value:20 , message:"Use at most 20 characters"}
                        })}/>
                    {errors.name && <p className="text-bad text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-medium">Student list</p>
                        <SourceTabs source={source} onChange={handleSource}/>
                    </div>

                    {source === "csv" && (
                        <>
                            <div className="flex flex-wrap items-end justify-between gap-2 mb-1.5">
                                <p className="text-xs text-muted">Columns: {CSV_COLUMNS.map((column) => column.label).join(", ")}</p>
                                <button type="button" onClick={downloadCsvTemplate} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                                    <LuDownload className="w-4 h-4"/> Download template
                                </button>
                            </div>
                            {fileBox}
                        </>
                    )}

                    {source === "manual" && (
                        <ManualStudents rows={typedRows} errorsByRow={errorsByRow} focusId={focusId}
                            onChangeCell={handleChangeCell} onAddRow={handleAddRow} onRemoveRow={handleRemoveRow}/>
                    )}
                </div>

                {source === "csv" && fileError && (
                    <div className="flex gap-2.5 rounded-xl bg-bad-soft text-bad px-4 py-3 text-sm">
                        <LuCircleAlert className="w-5 h-5 shrink-0"/> <p>{fileError}</p>
                    </div>
                )}

                {source === "csv" && rows.length > 0 && (
                    <CsvPreview rows={rows} visibleRows={visibleRows} problemCount={problemCount}
                        onlyProblems={onlyProblems} setOnlyProblems={setOnlyProblems}/>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-1">
                    <button type="button" onClick={close} className="px-4 py-2.5 rounded-xl border border-line text-sm font-medium hover:bg-canvas">Cancel</button>
                    <button type="submit" disabled={saving || !ready}
                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitText}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
