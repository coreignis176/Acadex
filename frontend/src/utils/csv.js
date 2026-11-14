// ---------------------------------------------------------------------------
// Student CSV import for "Add Section".
// Required columns (exactly these three, any order, header names are matched
// loosely so "Class Roll No" and "class_roll_number" both work):
//     Student Name , Class Roll Number , College Roll Number
// ---------------------------------------------------------------------------

// key     = the name we use inside the code
// label   = the name shown to the admin
// aliases = header names we accept (after normalise() below has cleaned them)
export const CSV_COLUMNS = [
    {key:"name" , label:"Student Name" , aliases:["studentname" , "name" , "fullname"]},
    {key:"classRollNo" , label:"Class Roll Number" , aliases:["classrollnumber" , "classrollno" , "classroll"]},
    {key:"collegeRollNo" , label:"College Roll Number" , aliases:["collegerollnumber" , "collegerollno" , "collegeroll"]}
];

export const MAX_CSV_ROWS = 500;
export const MAX_CSV_BYTES = 1024 * 1024;     // 1 MB

// the three column labels, used inside error messages
const COLUMN_LABELS = CSV_COLUMNS.map((column) => column.label);

// 1 to 10 characters, each one a capital letter, a digit or a hyphen
const CLASS_ROLL_RE = /^[A-Z0-9-]{1,10}$/;
// 4 to 16 characters, each one a capital letter, a digit or a hyphen
const COLLEGE_ROLL_RE = /^[A-Z0-9-]{4,16}$/;


//$ function to split CSV text into rows of cells
// A cell can be wrapped in double quotes. Inside quotes:
//   - a comma or a new line is part of the cell (it does NOT end the cell / row)
//   - two quotes "" stand for one real quote character "
// Lines can end with "\n" (Mac / Linux) or "\r\n" (Windows) or a lone "\r".
// Example:  a,"b,c",d   ->   [["a" , "b,c" , "d"]]
const parseCsv = (text) =>{
    const rows = [];          // every finished row
    let row = [];             // the cells of the row we are reading now
    let cell = "";            // the text of the cell we are reading now
    let insideQuotes = false; // are we between an opening " and its closing " ?

    // Excel often puts an invisible "BOM" character (code 0xFEFF) at the very start - drop it
    let source = text;
    if(text.charCodeAt(0) === 0xFEFF){
        source = text.slice(1);
    }

    // read the text one character at a time
    for(let i = 0; i < source.length; i++){
        const char = source[i];
        const nextChar = source[i + 1];

        if(insideQuotes){
            if(char === '"' && nextChar === '"'){
                // "" inside quotes = one real quote. Skip the second one too.
                cell = cell + '"';
                i++;
            }
            else if(char === '"'){
                // a single quote closes the quoted part
                insideQuotes = false;
            }
            else{
                // anything else (even a comma or a new line) is part of the cell
                cell = cell + char;
            }
        }
        else if(char === '"'){
            // a quote outside quotes opens a quoted part
            insideQuotes = true;
        }
        else if(char === ","){
            // a comma ends the cell
            row.push(cell);
            cell = "";
        }
        else if(char === "\n" || char === "\r"){
            // "\r\n" is ONE line break, so skip the "\n" that follows a "\r"
            if(char === "\r" && nextChar === "\n"){
                i++;
            }
            // a line break ends the cell and the row
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
        }
        else{
            cell = cell + char;
        }
    }

    // the last row has no line break after it, so save it here (if there is one)
    if(cell !== "" || row.length > 0){
        row.push(cell);
        rows.push(row);
    }
    return rows;
}


//$ function to clean a header name so it can be compared: "Class Roll No." -> "classrollno"
const normalise = (header) =>{
    // [^a-z] = any character that is NOT a small letter a-z (spaces, digits, _ , . etc.)
    // the g flag means "every match", so all of them are removed
    return header.toLowerCase().replace(/[^a-z]/g , "");
}


//$ function to check if a row has no text in any cell
const isBlankRow = (cells) =>{
    for(const cell of cells){
        if(cell.trim() !== "") return false;
    }
    return true;
}


//$ function to check if a (normalised) header name belongs to one of our columns
const isKnownHeader = (header) =>{
    for(const column of CSV_COLUMNS){
        if(column.aliases.includes(header)) return true;
    }
    return false;
}


//$ function to get the trimmed text of one cell ("" if the row is too short)
const cellText = (cells , position) =>{
    const value = cells[position] || "";
    return value.trim();
}


//$ function to read a student CSV -> {error} for file-level problems, or {students , problems}
// every student = {row , name , classRollNo , collegeRollNo , errors:[]}  (row = line number in the file)
export const readStudentCsv = (text) =>{
    const rows = parseCsv(text);

    // the header is the first row that has some text in it
    let headerRow = -1;
    for(let i = 0; i < rows.length; i++){
        if(!isBlankRow(rows[i])){
            headerRow = i;
            break;
        }
    }
    if(headerRow === -1) return {error:"The file is empty."};

    // ----- header -----
    const originalHeader = rows[headerRow];
    const header = originalHeader.map((name) => normalise(name));

    // any filled-in header that is not one of our columns is an error
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

    // find the position of each column, e.g. index = {name:0 , classRollNo:2 , collegeRollNo:1}
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

    // ----- rows -----
    const students = [];
    for(let i = headerRow + 1; i < rows.length; i++){
        const cells = rows[i];
        if(isBlankRow(cells)) continue;          // skip blank lines

        // \s+ = one or more spaces / tabs / new lines in a row -> squeeze them into one space
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

    // ----- field checks + duplicates inside the file -----
    const problems = checkStudentRows(students);

    // preview in class roll order ({numeric:true} puts "2" before "10")
    students.sort((first , second) => first.classRollNo.localeCompare(second.classRollNo , undefined , {numeric:true}));

    // {students , problems} is short for {students:students , problems:problems}
    return {students , problems};
}


//$ function to tidy the students the admin TYPED in "Add section" (instead of a CSV file)
// rows = [{name , classRollNo , collegeRollNo}] in the order they were typed
// gives back the students in the same shape as readStudentCsv: {row , name , classRollNo , collegeRollNo , errors}
//   - row = the number shown next to the student in the form (1 , 2 , 3 ...)
//   - a row where nothing was typed is skipped (it is just an empty line in the form)
// then checks them with the SAME rules as a CSV file (checkStudentRows)
export const readTypedStudents = (rows) =>{
    const students = [];
    for(let i = 0; i < rows.length; i++){
        const typed = rows[i];
        const name = String(typed.name || "").trim().replace(/\s+/g , " ");
        const classRollNo = String(typed.classRollNo || "").trim().toUpperCase();
        const collegeRollNo = String(typed.collegeRollNo || "").trim().toUpperCase();

        if(!name && !classRollNo && !collegeRollNo) continue;      // an empty line -> skip it

        students.push({row:i + 1 , name , classRollNo , collegeRollNo , errors:[]});
    }

    const problems = checkStudentRows(students);
    return {students , problems};
}


//$ function to check every student (name , roll numbers , and roll numbers used twice in the list)
// adds the problems to student.errors and gives back how many students have at least one problem
// used for a CSV file (readStudentCsv) AND for students typed by hand (readTypedStudents)
export const checkStudentRows = (students) =>{
    // seenClass["12"] = 4 means class roll number 12 was first used on row 4
    const seenClass = {};
    const seenCollege = {};
    for(const student of students){
        // [A-Za-z] = at least one letter somewhere in the name
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

    // how many students have at least one error
    let problems = 0;
    for(const student of students){
        if(student.errors.length > 0) problems++;
    }
    return problems;
}


//$ function to download a ready-to-fill template
export const downloadCsvTemplate = () =>{
    const lines = [
        COLUMN_LABELS.join(","),
        "Aarav Sharma,1,BT25CA001",
        "Diya Rawat,2,BT25CA002",
        "Kabir Joshi,3,BT25CA003"
    ];
    const text = lines.join("\r\n");

    // turn the text into a temporary file link, click it, then clean up
    const url = URL.createObjectURL(new Blob([text] , {type:"text/csv"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "acadex-students-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
