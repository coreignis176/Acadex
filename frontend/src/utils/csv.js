export const CSV_COLUMNS = [
    {key:"name" , label:"Student Name" , aliases:["studentname" , "name" , "fullname"]},
    {key:"classRollNo" , label:"Class Roll Number" , aliases:["classrollnumber" , "classrollno" , "classroll"]},
    {key:"collegeRollNo" , label:"College Roll Number" , aliases:["collegerollnumber" , "collegerollno" , "collegeroll"]}
];

export const MAX_CSV_ROWS = 500;
export const MAX_CSV_BYTES = 1024 * 1024;

const COLUMN_LABELS = CSV_COLUMNS.map((column) => column.label);

const CLASS_ROLL_RE = /^[A-Z0-9-]{1,10}$/;
const COLLEGE_ROLL_RE = /^[A-Z0-9-]{4,16}$/;

const parseCsv = (text) =>{
    const rows = [];
    let row = [];
    let cell = "";
    let insideQuotes = false;

    let source = text;
    if(text.charCodeAt(0) === 0xFEFF){
        source = text.slice(1);
    }

    for(let i = 0; i < source.length; i++){
        const char = source[i];
        const nextChar = source[i + 1];

        if(insideQuotes){
            if(char === '"' && nextChar === '"'){
                cell = cell + '"';
                i++;
            }
            else if(char === '"'){
                insideQuotes = false;
            }
            else{
                cell = cell + char;
            }
        }
        else if(char === '"'){
            insideQuotes = true;
        }
        else if(char === ","){
            row.push(cell);
            cell = "";
        }
        else if(char === "\n" || char === "\r"){
            if(char === "\r" && nextChar === "\n"){
                i++;
            }
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
        }
        else{
            cell = cell + char;
        }
    }

    if(cell !== "" || row.length > 0){
        row.push(cell);
        rows.push(row);
    }
    return rows;
}

const normalise = (header) =>{
    return header.toLowerCase().replace(/[^a-z]/g , "");
}

const isBlankRow = (cells) =>{
    for(const cell of cells){
        if(cell.trim() !== "") return false;
    }
    return true;
}

const isKnownHeader = (header) =>{
    for(const column of CSV_COLUMNS){
        if(column.aliases.includes(header)) return true;
    }
    return false;
}

const cellText = (cells , position) =>{
    const value = cells[position] || "";
    return value.trim();
}

export const readStudentCsv = (text) =>{
    const rows = parseCsv(text);

    let headerRow = -1;
    for(let i = 0; i < rows.length; i++){
        if(!isBlankRow(rows[i])){
            headerRow = i;
            break;
        }
    }
    if(headerRow === -1) return {error:"The file is empty."};

    const originalHeader = rows[headerRow];
    const header = originalHeader.map((name) => normalise(name));

    const extra = [];
    for(let i = 0; i < originalHeader.length; i++){
        const name = originalHeader[i];
        if(name.trim() && !isKnownHeader(header[i])){
            extra.push(name);
        }
    }
    if(extra.length > 0){
        let plural = "";
        if(extra.length > 1) plural = "s";
        return {error:`Unexpected column${plural}: ${extra.join(", ")}. The file must have exactly these columns: ${COLUMN_LABELS.join(", ")}.`};
    }

    const index = {};
    for(const column of CSV_COLUMNS){
        const positions = [];
        for(let i = 0; i < header.length; i++){
            if(column.aliases.includes(header[i])) positions.push(i);
        }
        if(positions.length === 0) return {error:`Missing column "${column.label}". The first row must be the header: ${COLUMN_LABELS.join(", ")}.`};
        if(positions.length > 1) return {error:`The column "${column.label}" appears more than once.`};
        index[column.key] = positions[0];
    }

    const students = [];
    for(let i = headerRow + 1; i < rows.length; i++){
        const cells = rows[i];
        if(isBlankRow(cells)) continue;

        const name = cellText(cells , index.name).replace(/\s+/g , " ");

        students.push({
            row:i + 1,
            name:name,
            classRollNo:cellText(cells , index.classRollNo).toUpperCase(),
            collegeRollNo:cellText(cells , index.collegeRollNo).toUpperCase(),
            errors:[]
        });
    }

    if(students.length === 0) return {error:"The file has a header but no students."};
    if(students.length > MAX_CSV_ROWS) return {error:`The file has ${students.length} students. Upload at most ${MAX_CSV_ROWS} at a time.`};

    const problems = checkStudentRows(students);

    students.sort((first , second) => first.classRollNo.localeCompare(second.classRollNo , undefined , {numeric:true}));

    return {students , problems};
}

export const readTypedStudents = (rows) =>{
    const students = [];
    for(let i = 0; i < rows.length; i++){
        const typed = rows[i];
        const name = String(typed.name || "").trim().replace(/\s+/g , " ");
        const classRollNo = String(typed.classRollNo || "").trim().toUpperCase();
        const collegeRollNo = String(typed.collegeRollNo || "").trim().toUpperCase();

        if(!name && !classRollNo && !collegeRollNo) continue;

        students.push({row:i + 1 , name , classRollNo , collegeRollNo , errors:[]});
    }

    const problems = checkStudentRows(students);
    return {students , problems};
}

export const checkStudentRows = (students) =>{
    const seenClass = {};
    const seenCollege = {};
    for(const student of students){
        const hasLetter = /[A-Za-z]/.test(student.name);
        if(!student.name) student.errors.push("Student name is missing");
        else if(student.name.length < 2 || student.name.length > 60 || !hasLetter) student.errors.push("Student name must be 2-60 characters");

        if(!student.classRollNo) student.errors.push("Class roll number is missing");
        else if(!CLASS_ROLL_RE.test(student.classRollNo)) student.errors.push("Class roll number can use up to 10 letters, digits or hyphens");
        else if(seenClass[student.classRollNo]) student.errors.push(`Class roll number repeats row ${seenClass[student.classRollNo]}`);
        else seenClass[student.classRollNo] = student.row;

        if(!student.collegeRollNo) student.errors.push("College roll number is missing");
        else if(!COLLEGE_ROLL_RE.test(student.collegeRollNo)) student.errors.push("College roll number must be 4-16 letters, digits or hyphens");
        else if(seenCollege[student.collegeRollNo]) student.errors.push(`College roll number repeats row ${seenCollege[student.collegeRollNo]}`);
        else seenCollege[student.collegeRollNo] = student.row;
    }

    let problems = 0;
    for(const student of students){
        if(student.errors.length > 0) problems++;
    }
    return problems;
}

export const downloadCsvTemplate = () =>{
    const lines = [
        COLUMN_LABELS.join(","),
        "Aarav Sharma,1,BT25CA001",
        "Diya Rawat,2,BT25CA002",
        "Kabir Joshi,3,BT25CA003"
    ];
    const text = lines.join("\r\n");

    const url = URL.createObjectURL(new Blob([text] , {type:"text/csv"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "acadex-students-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
