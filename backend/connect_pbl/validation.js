import { runProgram } from "./runProgram.js";
import { studentFieldError, passwordProblem, subjectFieldProblem, noteFieldProblem } from "../utils/helpers.js";

const hasEnterInside = (values) =>{
    for(const value of values){
        if(/[\r\n]/.test(value)){
            return true;
        }
    }
    return false;
}

const askCpp = async(form , values , answerCount) =>{

    const lines = values.map((value) => String(value));

    if(hasEnterInside(lines)){
        return {ok:false , reason:"cannot get a value with an Enter inside it"};
    }

    const input = [form , ...lines].join("\n");
    const result = await runProgram("validation_cpp" , input);

    if(!result.ok){
        return {ok:false , reason:"did not work. Reason: " + result.error};
    }

    const answers = result.output.split(/\r?\n/).map((line) => line.trim());

    if(answerCount === 0 && result.output === ""){
        return {ok:true , answers:[]};
    }

    if(answers.length !== answerCount || answers.includes("")){
        return {ok:false , reason:"gave a strange answer (" + answers.length + " lines instead of " + answerCount + ")"};
    }

    return {ok:true , answers};
}

const toProblem = (answer) =>{
    if(answer === "ok"){
        return null;
    }
    return answer;
}

export const checkStudent = async(name , classRollNo , collegeRollNo) =>{

    const result = await askCpp("student" , [name , classRollNo , collegeRollNo] , 1);

    if(!result.ok){
        console.log("validation (C++) student " + result.reason + " -> JavaScript checked it instead.");
        return studentFieldError(name , classRollNo , collegeRollNo);
    }

    return toProblem(result.answers[0]);
}

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

export const checkPassword = async(password , defaultPassword) =>{

    const result = await askCpp("password" , [password , defaultPassword] , 1);

    if(!result.ok){
        console.log("validation (C++) password " + result.reason + " -> JavaScript checked it instead.");
        return passwordProblem(password , defaultPassword);
    }

    return toProblem(result.answers[0]);
}

export const checkSubject = async(name , code) =>{

    const result = await askCpp("subject" , [name , code] , 1);

    if(!result.ok){
        console.log("validation (C++) subject " + result.reason + " -> JavaScript checked it instead.");
        return subjectFieldProblem(name , code);
    }

    return toProblem(result.answers[0]);
}

export const checkNote = async(title , topic , description , subject , subjectNames) =>{

    const values = [title , topic , description , subject , String(subjectNames.length) , ...subjectNames];
    const result = await askCpp("note" , values , 1);

    if(!result.ok){
        console.log("validation (C++) note " + result.reason + " -> JavaScript checked it instead.");
        return noteFieldProblem(title , topic , description , subject , subjectNames);
    }

    return toProblem(result.answers[0]);
}
