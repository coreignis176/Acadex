import { runProgram } from "./runProgram.js";
import { studentFieldError, passwordProblem, subjectFieldProblem, noteFieldProblem } from "../utils/helpers.js";

// ---------------------------------------------------------------------------
// FORM CHECKING - done by our C++ program (OOP)
//
// C++ code : connect_pbl/cpp/validation.cpp      (abstract class Rule , Form ...)
// it runs  : connect_pbl/bin/validation_cpp.exe  (made by connect_pbl/compile.bat)
//
// every function here gives back the FIRST problem as text , or null when all is fine
// (the same thing the old JavaScript checks gave back , so the controllers did not change much)
//
// used by:
//   adminController.js  addstudent , updatestudent   -> checkStudent
//   adminController.js  addsection (CSV file)         -> checkStudentList
//   UserController.js   changepassword                -> checkPassword
//   adminController.js  addsubject , updatesubject    -> checkSubject
//   notesController.js  submitnote                    -> checkNote
//
// the C++ program reads ONE value per line. So a value with an Enter inside it
// cannot be sent -> JavaScript checks that one instead.
//
// if the C++ program does not work (no .exe , crash , too slow , strange answer)
// JavaScript checks it instead (functions in utils/helpers.js), so the page still works,
// and the backend console prints why  -> check the console during the demo!
//
// SAFETY: a password goes to the C++ program only through stdin (like typing).
//         it is never printed in the console , not even when something goes wrong.
// ---------------------------------------------------------------------------


//$ function to check if any value has an Enter (\r or \n) inside it
// such a value would break the "one value per line" input
const hasEnterInside = (values) =>{
    for(const value of values){
        if(/[\r\n]/.test(value)){
            return true;
        }
    }
    return false;
}


//$ function to run the C++ program for one form and get its answer lines
// form          = "student" , "students" , "password" , "subject" or "note"
// values        = the lines after the form name (every value is turned into text)
// answerCount   = how many answer lines we expect (1 , or the number of students)
//
// gives back {ok:true , answers:[...]}   or   {ok:false , reason:"..."}
const askCpp = async(form , values , answerCount) =>{

    const lines = values.map((value) => String(value));

    if(hasEnterInside(lines)){
        return {ok:false , reason:"cannot get a value with an Enter inside it"};
    }

    const input = [form , ...lines].join("\n");          // ...lines = put every line of the list here
    const result = await runProgram("validation_cpp" , input);

    if(!result.ok){
        return {ok:false , reason:"did not work. Reason: " + result.error};
    }

    // Windows C++ programs end every line with "\r\n" -> /\r?\n/ splits on both
    const answers = result.output.split(/\r?\n/).map((line) => line.trim());

    // the output of zero students is "" -> no answer lines
    if(answerCount === 0 && result.output === ""){
        return {ok:true , answers:[]};
    }

    // every answer must be there , and none can be empty
    if(answers.length !== answerCount || answers.includes("")){
        return {ok:false , reason:"gave a strange answer (" + answers.length + " lines instead of " + answerCount + ")"};
    }

    return {ok:true , answers};
}


//$ function to turn one answer of the C++ program into a problem
// "ok" -> null (no problem) , anything else is the problem text
const toProblem = (answer) =>{
    if(answer === "ok"){
        return null;
    }
    return answer;
}




// ======================= form "student" =======================

//$ function to check ONE student: name , class roll no , college roll no
export const checkStudent = async(name , classRollNo , collegeRollNo) =>{

    const result = await askCpp("student" , [name , classRollNo , collegeRollNo] , 1);

    if(!result.ok){
        console.log("validation (C++) student " + result.reason + " -> JavaScript checked it instead.");
        return studentFieldError(name , classRollNo , collegeRollNo);
    }

    return toProblem(result.answers[0]);
}




// ======================= form "students" (CSV file) =======================

//$ function to check MANY students in ONE run of the C++ program (a CSV file can have 500)
// students = [{name , classRollNo , collegeRollNo} , ...]
// gives back a list with one problem (or null) for each student , in the same order
export const checkStudentList = async(students) =>{

    const values = [String(students.length)];
    for(const student of students){
        values.push(student.name , student.classRollNo , student.collegeRollNo);
    }

    const result = await askCpp("students" , values , students.length);

    if(!result.ok){
        console.log("validation (C++) students " + result.reason + " -> JavaScript checked them instead.");
        return students.map((student) => studentFieldError(student.name , student.classRollNo , student.collegeRollNo));
    }

    return result.answers.map(toProblem);
}




// ======================= form "password" =======================

//$ function to check a new password (the default password is sent too: the new one must be different)
export const checkPassword = async(password , defaultPassword) =>{

    const result = await askCpp("password" , [password , defaultPassword] , 1);

    if(!result.ok){
        // only the reason is printed , NEVER the password
        console.log("validation (C++) password " + result.reason + " -> JavaScript checked it instead.");
        return passwordProblem(password , defaultPassword);
    }

    return toProblem(result.answers[0]);
}




// ======================= form "subject" =======================

//$ function to check the name and the code of a subject
// (if it is already in the section is checked separately: subjectClash in adminController.js)
export const checkSubject = async(name , code) =>{

    const result = await askCpp("subject" , [name , code] , 1);

    if(!result.ok){
        console.log("validation (C++) subject " + result.reason + " -> JavaScript checked it instead.");
        return subjectFieldProblem(name , code);
    }

    return toProblem(result.answers[0]);
}




// ======================= form "note" =======================

//$ function to check a note upload: title , topic , description , and the chosen subject
// subjectNames = the subjects of the student's section (the chosen one must be in this list)
export const checkNote = async(title , topic , description , subject , subjectNames) =>{

    const values = [title , topic , description , subject , String(subjectNames.length) , ...subjectNames];
    const result = await askCpp("note" , values , 1);

    if(!result.ok){
        console.log("validation (C++) note " + result.reason + " -> JavaScript checked it instead.");
        return noteFieldProblem(title , topic , description , subject , subjectNames);
    }

    return toProblem(result.answers[0]);
}
