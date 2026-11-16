import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../modules/User.js";
import Section from "../modules/Section.js";
import Note from "../modules/Note.js";
import Notification from "../modules/Notification.js";
import Activity from "../modules/Activity.js";
import {
    courses, findCourse, yearLabel, sectionInfo, publicUser, cleanName, cleanCode,
    subjectFieldProblem, byClassRoll, notify, notifyMany, logActivity, MAX_CR_PER_SECTION
} from "../utils/helpers.js";
import { checkStudent, checkStudentList, checkSubject } from "../connect_pbl/validation.js";

const MAX_CSV_STUDENTS = 500;
const MAX_SUBJECTS = 20;

const defaultPassword = () =>{
    return process.env.DEFAULT_STUDENT_PASSWORD || "Acadex@123";
}

const sectionMap = async() =>{
    const sections = await Section.find();
    const map = {};
    for(const section of sections){
        map[String(section._id)] = section;
    }
    return map;
}

const studentCounts = async() =>{
    const students = await User.find({role:"student" , sectionId:{$ne:null}});
    const counts = {};
    for(const student of students){
        const key = String(student.sectionId);
        if(!counts[key]){
            counts[key] = 0;
        }
        counts[key] = counts[key] + 1;
    }
    return counts;
}

export const getadminstats = async(req , res) =>{
    try{
        const activeSections = await Section.find({archived:false});
        const students = await User.find({role:"student" , sectionId:{$ne:null}});
        const counts = await studentCounts();
        const sections = await sectionMap();
        const approvedNotes = await Note.countDocuments({status:"approved"});

        const crs = students.filter((student) => student.crStatus === "active");
        const pending = students.filter((student) => student.crStatus === "pending");

        const perYear = [];
        for(const course of courses){
            for(let year = 1; year <= course.duration; year++){
                const yearSections = activeSections.filter((section) => section.courseId === course._id && section.year === year);

                let total = 0;
                for(const section of yearSections){
                    total += counts[String(section._id)] || 0;
                }

                const label = course.name + " " + yearLabel(year);
                perYear.push({courseId:course._id , label , year , sections:yearSections.length , students:total});
            }
        }

        const pendingCrs = pending.map((student) => publicUser(student , sections[String(student.sectionId)]));
        const crAssignments = crs.map((student) => publicUser(student , sections[String(student.sectionId)]));

        const recentActivity = await Activity.find().sort({createdAt:-1}).limit(8);

        res.status(200).send({success:true , data:{
            totals:{
                courses:courses.length,
                sections:activeSections.length,
                students:students.length,
                activeCrs:crs.length,
                pendingCrs:pending.length,
                notes:approvedNotes
            },
            perYear,
            pendingCrs,
            crAssignments,
            recentActivity
        }});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const getstructure = async(req , res) =>{
    try{
        const allSections = await Section.find();
        const students = await User.find({role:"student" , sectionId:{$ne:null}});

        const tree = [];
        for(const course of courses){
            const years = [];
            for(let year = 1; year <= course.duration; year++){
                const yearSections = allSections.filter((section) => section.courseId === course._id && section.year === year);

                const sections = [];
                for(const section of yearSections){
                    const inSection = students.filter((student) => String(student.sectionId) === String(section._id));
                    const activeCrs = inSection.filter((student) => student.crStatus === "active");
                    const pendingCrs = inSection.filter((student) => student.crStatus === "pending");

                    const row = sectionInfo(section);
                    row.createdAt = section.createdAt;
                    row.students = inSection.length;
                    row.subjectCount = section.subjects.length;
                    row.crs = activeCrs.length;
                    row.pendingCrs = pendingCrs.length;
                    sections.push(row);
                }

                years.push({year , label:yearLabel(year) , sections});
            }
            tree.push({_id:course._id , name:course.name , fullName:course.fullName , duration:course.duration , years});
        }

        res.status(200).send({success:true , data:tree});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const addsection = async(req , res) =>{
    try{
        const {courseId , name , students} = req.body;
        const year = Number(req.body.year);
        const course = findCourse(courseId);
        const clean = String(name || "").trim();

        if(!course){
            return res.status(400).send({success:false , message:"This Course Does Not Exist."});
        }
        if(!Number.isInteger(year) || year < 1 || year > course.duration){
            return res.status(400).send({success:false , message:`${course.name} Has Only ${course.duration} Years.`});
        }
        if(!clean){
            return res.status(400).send({success:false , message:"Please Enter A Section Name."});
        }
        if(clean.length > 20){
            return res.status(400).send({success:false , message:"Section Names Can Be At Most 20 Characters."});
        }

        const courseYear = course.name + " " + yearLabel(year);

        const sameYear = await Section.find({courseId , year});
        const duplicate = sameYear.find((section) => section.name.toLowerCase() === clean.toLowerCase());
        if(duplicate){
            const message = `${courseYear} Already Has A Section Named ${duplicate.name}.`;
            return res.status(400).send({success:false , message});
        }

        if(!Array.isArray(students) || students.length === 0){
            return res.status(400).send({success:false , message:"Please Upload A CSV File With At Least One Student."});
        }
        if(students.length > MAX_CSV_STUDENTS){
            return res.status(400).send({success:false , message:`A Section Can Be Created With At Most ${MAX_CSV_STUDENTS} Students At Once.`});
        }

        const errors = [];
        const seenClass = {};
        const seenCollege = {};
        const rows = [];

        const sections = await sectionMap();

        for(let i = 0; i < students.length; i++){
            const csvStudent = students[i] || {};
            const row = csvStudent.row || i + 2;
            rows.push({
                row,
                name:cleanName(csvStudent.name),
                classRollNo:cleanCode(csvStudent.classRollNo),
                collegeRollNo:cleanCode(csvStudent.collegeRollNo),
                existing:null
            });
        }

        const fieldErrors = await checkStudentList(rows);

        for(let i = 0; i < rows.length; i++){
            const record = rows[i];
            const row = record.row;

            const fieldError = fieldErrors[i];
            if(fieldError){
                errors.push({row , message:fieldError});
                continue;
            }

            if(seenClass[record.classRollNo]){
                const firstRow = seenClass[record.classRollNo];
                const message = `Class roll number ${record.classRollNo} is repeated (also on row ${firstRow})`;
                errors.push({row , message});
            }
            else{
                seenClass[record.classRollNo] = row;
            }

            if(seenCollege[record.collegeRollNo]){
                const firstRow = seenCollege[record.collegeRollNo];
                const message = `College roll number ${record.collegeRollNo} is repeated (also on row ${firstRow})`;
                errors.push({row , message});
            }
            else{
                seenCollege[record.collegeRollNo] = row;
            }

            const existing = await User.findOne({rollNo:record.collegeRollNo});
            if(existing && (existing.role !== "student" || existing.sectionId)){
                let message = "College roll number " + record.collegeRollNo + " is already registered to " + existing.name;
                const where = sectionInfo(sections[String(existing.sectionId)]);
                if(where){
                    message = message + " in " + where.label;
                }
                errors.push({row , message});
            }
            if(existing && !existing.sectionId){
                record.existing = existing;
            }
        }

        if(errors.length > 0){
            let text = "Rows Need";
            if(errors.length === 1){
                text = "Row Needs";
            }
            const message = `${errors.length} ${text} Fixing. Nothing Was Saved.`;
            return res.status(422).send({success:false , message , data:{errors}});
        }

        const section = await Section.create({courseId , year , name:clean});
        const info = sectionInfo(section);
        const password = await bcrypt.hash(defaultPassword() , 10);

        const registeredTitle = `Registered in ${clean}`;
        const registeredText = `You have been registered in ${info.course} ${info.yearLabel}, section ${clean}.`;

        for(const record of rows){
            let student = record.existing;
            if(student){
                student.name = record.name;
                student.classRollNo = record.classRollNo;
                student.sectionId = section._id;
                student.crStatus = "none";
                await student.save();
            }
            else{
                student = await User.create({
                    role:"student",
                    name:record.name,
                    rollNo:record.collegeRollNo,
                    classRollNo:record.classRollNo,
                    password,
                    sectionId:section._id,
                    mustChangePassword:true
                });
            }
            await notify(student._id , "section" , registeredTitle , registeredText);
        }

        const logText = `Added section ${clean} to ${courseYear} with ${rows.length} students`;
        await logActivity("section" , logText);
        const adminText = `Section ${clean} was added to ${courseYear} with ${rows.length} students.`;
        await notify(req.userId , "section" , "Section created" , adminText);

        let word = "Students";
        if(rows.length === 1){
            word = "Student";
        }
        const message = `${clean} Created With ${rows.length} ${word}`;
        res.status(200).send({success:true , message , data:{section:info , registered:rows.length}});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const renamesection = async(req , res) =>{
    try{
        const {sectionId , name} = req.body;
        const clean = (name || "").trim();

        const section = await Section.findById(sectionId);
        if(!section){
            return res.status(400).send({success:false , message:"This Section Does Not Exist."});
        }
        if(!clean){
            return res.status(400).send({success:false , message:"Please Enter A Section Name."});
        }
        if(clean.length > 20){
            return res.status(400).send({success:false , message:"Section Names Can Be At Most 20 Characters."});
        }

        const sameYear = await Section.find({courseId:section.courseId , year:section.year , _id:{$ne:section._id}});
        const duplicate = sameYear.find((other) => other.name.toLowerCase() === clean.toLowerCase());
        if(duplicate){
            return res.status(400).send({success:false , message:`A Section Named ${duplicate.name} Already Exists In This Year.`});
        }

        const old = section.name;
        section.name = clean;
        await section.save();

        const students = await User.find({role:"student" , sectionId:section._id});
        const studentIds = students.map((student) => student._id);
        await logActivity("section" , `Renamed section ${old} to ${clean}`);
        await notifyMany(studentIds , "section" , "Section renamed" , `Your section ${old} is now called ${clean}.`);

        res.status(200).send({success:true , message:`Section Renamed To ${clean}` , data:sectionInfo(section)});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const archivesection = async(req , res) =>{
    try{
        const {sectionId , archived} = req.body;

        const section = await Section.findById(sectionId);
        if(!section){
            return res.status(400).send({success:false , message:"This Section Does Not Exist."});
        }

        const count = await User.countDocuments({role:"student" , sectionId:section._id});
        if(archived && count > 0){
            return res.status(400).send({success:false , message:`Remove The ${count} Students In ${section.name} Before Archiving It.`});
        }

        section.archived = Boolean(archived);
        await section.save();

        let doneWord = "Restored";
        if(archived){
            doneWord = "Archived";
        }

        const info = sectionInfo(section);
        const logText = `${doneWord} section ${section.name} (${info.course} ${info.yearLabel})`;
        await logActivity("section" , logText);

        res.status(200).send({success:true , message:`Section ${section.name} ${doneWord}` , data:info});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const getsection = async(req , res) =>{
    try{
        const {id} = req.params;

        if(!mongoose.isValidObjectId(id)){
            return res.status(404).send({success:false , message:"This Section Does Not Exist."});
        }

        const section = await Section.findById(id);
        if(!section){
            return res.status(404).send({success:false , message:"This Section Does Not Exist."});
        }

        const studentDocs = await User.find({role:"student" , sectionId:section._id});

        const students = studentDocs.map((student) => publicUser(student , section));
        students.sort(byClassRoll);

        const crStudents = studentDocs.filter((student) => student.crStatus === "active" || student.crStatus === "pending");
        const crSlotsUsed = crStudents.length;

        const others = await Section.find({courseId:section.courseId , year:section.year , archived:false , _id:{$ne:section._id}});
        const siblings = others.map((other) =>{
            return {_id:other._id , name:other.name , subjectCount:other.subjects.length};
        });

        res.status(200).send({success:true , data:{
            section:sectionInfo(section),
            students,
            crSlotsUsed,
            subjects:section.subjects,
            siblings,
            maxCrs:MAX_CR_PER_SECTION
        }});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const addstudent = async(req , res) =>{
    try{
        const {sectionId} = req.body;
        const name = cleanName(req.body.name);
        const classRollNo = cleanCode(req.body.classRollNo);
        const collegeRollNo = cleanCode(req.body.rollNo);

        const section = await Section.findById(sectionId);
        if(!section || section.archived){
            return res.status(400).send({success:false , message:"Students Can Only Be Added To An Active Section."});
        }

        const fieldError = await checkStudent(name , classRollNo , collegeRollNo);
        if(fieldError){
            return res.status(400).send({success:false , message:fieldError + "."});
        }

        const sameClassRoll = await User.findOne({role:"student" , sectionId:section._id , classRollNo});
        if(sameClassRoll){
            const message = `Class Roll Number ${classRollNo} Already Belongs To ${sameClassRoll.name} In ${section.name}.`;
            return res.status(400).send({success:false , message});
        }

        const existing = await User.findOne({rollNo:collegeRollNo});
        if(existing && (existing.role !== "student" || existing.sectionId)){
            return res.status(400).send({success:false , message:`College Roll Number ${collegeRollNo} Already Belongs To ${existing.name}.`});
        }

        let student = existing;
        if(existing){
            existing.name = name;
            existing.classRollNo = classRollNo;
            existing.sectionId = section._id;
            existing.crStatus = "none";
            await existing.save();
        }
        else{
            const password = await bcrypt.hash(defaultPassword() , 10);
            student = await User.create({role:"student" , name , rollNo:collegeRollNo , classRollNo , password , sectionId:section._id , mustChangePassword:true});
        }

        const info = sectionInfo(section);
        const registeredText = `You have been registered in ${info.course} ${info.yearLabel}, section ${section.name}.`;
        await notify(student._id , "section" , `Registered in ${section.name}` , registeredText);
        await logActivity("student" , `Registered ${student.name} (${collegeRollNo}) in ${info.label}`);

        res.status(200).send({success:true , message:`${student.name} Registered In ${section.name}` , data:publicUser(student , section)});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const updatestudent = async(req , res) =>{
    try{
        const {studentId} = req.body;
        const name = cleanName(req.body.name);
        const classRollNo = cleanCode(req.body.classRollNo);
        const collegeRollNo = cleanCode(req.body.collegeRollNo);

        const student = await User.findById(studentId);
        if(!student || student.role !== "student" || !student.sectionId){
            return res.status(400).send({success:false , message:"This Student Is Not In Any Section."});
        }

        const fieldError = await checkStudent(name , classRollNo , collegeRollNo);
        if(fieldError){
            return res.status(400).send({success:false , message:fieldError + "."});
        }

        const section = await Section.findById(student.sectionId);

        const sameClassRoll = await User.findOne({role:"student" , sectionId:section._id , classRollNo , _id:{$ne:student._id}});
        if(sameClassRoll){
            const message = `Class Roll Number ${classRollNo} Already Belongs To ${sameClassRoll.name} In ${section.name}.`;
            return res.status(400).send({success:false , message});
        }

        const sameCollegeRoll = await User.findOne({rollNo:collegeRollNo , _id:{$ne:student._id}});
        if(sameCollegeRoll){
            return res.status(400).send({success:false , message:`College Roll Number ${collegeRollNo} Already Belongs To ${sameCollegeRoll.name}.`});
        }

        const changed = student.name !== name || student.classRollNo !== classRollNo || student.rollNo !== collegeRollNo;
        if(!changed){
            return res.status(200).send({success:true , message:"Nothing To Update" , data:publicUser(student , section)});
        }

        student.name = name;
        student.classRollNo = classRollNo;
        student.rollNo = collegeRollNo;
        await student.save();

        await Note.updateMany({uploadedBy:student._id} , {uploaderName:name});
        const sectionLabel = sectionInfo(section).label;
        await logActivity("student" , `Updated details of ${name} (${sectionLabel})`);

        res.status(200).send({success:true , message:"Student Details Updated" , data:publicUser(student , section)});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const removestudent = async(req , res) =>{
    try{
        const {studentId} = req.body;

        const student = await User.findById(studentId);
        if(!student || student.role !== "student" || !student.sectionId){
            return res.status(400).send({success:false , message:"This Student Is Not In Any Section."});
        }

        const section = await Section.findById(student.sectionId);
        const info = sectionInfo(section);
        const wasCr = student.crStatus === "active";

        student.crStatus = "none";
        student.sectionId = null;
        await student.save();

        await Notification.updateMany({userId:student._id , "action.kind":"cr-confirm"} , {action:null});

        let removedText = "You have been removed from " + info.label + ".";
        if(wasCr){
            removedText = removedText + " Your CR permissions have been revoked.";
        }
        removedText = removedText + " Your Acadex account is still active.";
        await notify(student._id , "section" , "Removed from section" , removedText);

        if(wasCr){
            const classmates = await User.find({role:"student" , sectionId:section._id});
            const classmateIds = classmates.map((classmate) => classmate._id);
            const crRemovedText = `${student.name} is no longer a Class Representative of ${info.name}.`;
            await notifyMany(classmateIds , "cr" , "CR removed" , crRemovedText);
        }
        await notify(req.userId , "student" , "Student removed" , `${student.name} was removed from ${info.label}.`);

        let logText = "Removed " + student.name + " from " + info.label;
        if(wasCr){
            logText = logText + " (CR revoked)";
        }
        await logActivity("student" , logText);

        res.status(200).send({success:true , message:`${student.name} Removed From ${info.name}`});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const resetpassword = async(req , res) =>{
    try{
        const {studentId} = req.body;

        const student = await User.findById(studentId);
        if(!student || student.role !== "student"){
            return res.status(400).send({success:false , message:"This Student Does Not Exist."});
        }

        student.password = await bcrypt.hash(defaultPassword() , 10);
        student.mustChangePassword = true;
        await student.save();

        await logActivity("student" , `Reset the password of ${student.name} (${student.rollNo})`);
        res.status(200).send({success:true , message:`Password Of ${student.name} Reset To The Default`});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const getallstudents = async(req , res) =>{
    try{
        const students = await User.find({role:"student"}).sort({name:1});
        const sections = await sectionMap();
        const list = students.map((student) => publicUser(student , sections[String(student.sectionId)]));
        res.status(200).send({success:true , data:list});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const selectcr = async(req , res) =>{
    try{
        const {studentId} = req.body;

        const student = await User.findById(studentId);
        if(!student || student.role !== "student" || !student.sectionId){
            return res.status(400).send({success:false , message:"This Student Is Not In Any Section."});
        }
        if(student.crStatus !== "none"){
            let already = "Awaiting CR Confirmation";
            if(student.crStatus === "active"){
                already = "A CR";
            }
            return res.status(400).send({success:false , message:`${student.name} Is Already ${already}.`});
        }

        const used = await User.countDocuments({sectionId:student.sectionId , crStatus:{$in:["active" , "pending"]}});
        if(used >= MAX_CR_PER_SECTION){
            return res.status(400).send({success:false , message:`This Section Already Has ${MAX_CR_PER_SECTION} CR Positions Filled Or Pending.`});
        }

        const section = await Section.findById(student.sectionId);
        const info = sectionInfo(section);

        student.crStatus = "pending";
        await student.save();

        const confirmText = `The admin has identified you as the Class Representative of ${info.name}. Please confirm your appointment.`;
        await notify(student._id , "cr" , "Confirm your CR appointment" , confirmText , {kind:"cr-confirm"});
        await logActivity("cr" , `Selected ${student.name} as CR of ${info.label}`);

        res.status(200).send({success:true , message:`Confirmation Request Sent To ${student.name}` , data:publicUser(student , section)});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const removecr = async(req , res) =>{
    try{
        const {studentId} = req.body;

        const student = await User.findById(studentId);
        if(!student || student.crStatus === "none"){
            return res.status(400).send({success:false , message:"This Student Is Not A CR."});
        }

        const section = await Section.findById(student.sectionId);
        const info = sectionInfo(section);
        const wasActive = student.crStatus === "active";

        student.crStatus = "none";
        await student.save();

        await Notification.updateMany({userId:student._id , "action.kind":"cr-confirm"} , {action:null});

        let message = "CR Request Withdrawn";
        if(wasActive){
            message = `${student.name} Removed From CR`;

            const removedText = `You are no longer a Class Representative of ${info.name}. Your CR portal access has ended; your student account is unchanged.`;
            await notify(student._id , "cr" , "Removed as CR" , removedText);
            const classmates = await User.find({role:"student" , sectionId:section._id , _id:{$ne:student._id}});
            const classmateIds = classmates.map((classmate) => classmate._id);
            const crRemovedText = `${student.name} is no longer a Class Representative of ${info.name}.`;
            await notifyMany(classmateIds , "cr" , "CR removed" , crRemovedText);
            await notify(req.userId , "cr" , "CR removed" , `${student.name} (${info.label}) was removed as CR.`);
            await logActivity("cr" , `Removed ${student.name} from CR of ${info.label}`);
        }
        else{
            await notify(student._id , "cr" , "CR request withdrawn" , `The admin withdrew the CR request for ${info.name}.`);
            await notify(req.userId , "cr" , "CR request withdrawn" , `${student.name} (${info.label}) request withdrawn.`);
            await logActivity("cr" , `Withdrew CR request for ${student.name} in ${info.label}`);
        }

        res.status(200).send({success:true , message , data:publicUser(student , section)});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

const subjectClash = (section , name , code , ignoreId) =>{
    for(const subject of section.subjects){
        if(ignoreId && String(subject._id) === String(ignoreId)) continue;
        if(subject.name.toLowerCase() === name.toLowerCase()) return `${section.name} Already Has The Subject ${subject.name}.`;
        if(subject.code === code) return `Code ${code} Is Already Used By ${subject.name} In ${section.name}.`;
    }
    return null;
}

const subjectProblem = async(section , name , code , ignoreId) =>{
    const fieldProblem = await checkSubject(name , code);
    if(fieldProblem){
        return fieldProblem;
    }
    return subjectClash(section , name , code , ignoreId);
}

export const addsubject = async(req , res) =>{
    try{
        const {sectionId} = req.body;
        const name = cleanName(req.body.name);
        const code = cleanCode(req.body.code).replace(/\s+/g , "");

        const section = await Section.findById(sectionId);
        if(!section){
            return res.status(404).send({success:false , message:"This Section Does Not Exist."});
        }
        if(section.subjects.length >= MAX_SUBJECTS){
            return res.status(400).send({success:false , message:`A Section Can Have At Most ${MAX_SUBJECTS} Subjects.`});
        }
        const problem = await subjectProblem(section , name , code);
        if(problem){
            return res.status(400).send({success:false , message:problem});
        }

        section.subjects.push({name , code});
        await section.save();
        const subject = section.subjects[section.subjects.length - 1];

        const sectionLabel = sectionInfo(section).label;
        await logActivity("section" , `Added subject ${code} ${name} to ${sectionLabel}`);
        const message = `${code} ${name} Added To ${section.name}`;
        res.status(200).send({success:true , message , data:subject});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const updatesubject = async(req , res) =>{
    try{
        const {sectionId , subjectId} = req.body;
        const name = cleanName(req.body.name);
        const code = cleanCode(req.body.code).replace(/\s+/g , "");

        const section = await Section.findById(sectionId);
        if(!section){
            return res.status(404).send({success:false , message:"This Section Does Not Exist."});
        }
        const subject = section.subjects.id(subjectId);
        if(!subject){
            return res.status(400).send({success:false , message:"This Subject Was Already Removed."});
        }
        const problem = await subjectProblem(section , name , code , subjectId);
        if(problem){
            return res.status(400).send({success:false , message:problem});
        }
        if(name === subject.name && code === subject.code){
            return res.status(200).send({success:true , message:"Nothing To Update" , data:subject});
        }

        await Note.updateMany({sectionId:section._id , subject:subject.name} , {subject:name , subjectCode:code});

        subject.name = name;
        subject.code = code;
        await section.save();

        const sectionLabel = sectionInfo(section).label;
        await logActivity("section" , `Updated subject ${code} ${name} in ${sectionLabel}`);
        res.status(200).send({success:true , message:"Subject Updated" , data:subject});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const removesubject = async(req , res) =>{
    try{
        const {sectionId , subjectId} = req.body;

        const section = await Section.findById(sectionId);
        if(!section){
            return res.status(404).send({success:false , message:"This Section Does Not Exist."});
        }
        const subject = section.subjects.id(subjectId);
        if(!subject){
            return res.status(400).send({success:false , message:"This Subject Was Already Removed."});
        }

        const label = subject.code + " " + subject.name;
        section.subjects.pull(subjectId);
        await section.save();

        const sectionLabel = sectionInfo(section).label;
        await logActivity("section" , `Removed subject ${label} from ${sectionLabel}`);
        res.status(200).send({success:true , message:`${label} Removed`});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const copysubjects = async(req , res) =>{
    try{
        const {sectionId , fromSectionId} = req.body;

        const section = await Section.findById(sectionId);
        if(!section){
            return res.status(404).send({success:false , message:"This Section Does Not Exist."});
        }
        const from = await Section.findById(fromSectionId);
        if(!from || from.courseId !== section.courseId || from.year !== section.year){
            return res.status(400).send({success:false , message:"Subjects Can Only Be Copied Within The Same Course And Year."});
        }

        const toAdd = from.subjects.filter((subject) =>{
            return !subjectFieldProblem(subject.name , subject.code) && !subjectClash(section , subject.name , subject.code);
        });
        if(toAdd.length === 0){
            return res.status(400).send({success:false , message:`${section.name} Already Has All Of ${from.name}'s Subjects.`});
        }
        if(section.subjects.length + toAdd.length > MAX_SUBJECTS){
            return res.status(400).send({success:false , message:`A Section Can Have At Most ${MAX_SUBJECTS} Subjects.`});
        }

        for(const subject of toAdd){
            section.subjects.push({name:subject.name , code:subject.code});
        }
        await section.save();

        const sectionLabel = sectionInfo(section).label;
        await logActivity("section" , `Copied ${toAdd.length} subjects from ${from.name} to ${sectionLabel}`);
        let word = "Subjects";
        if(toAdd.length === 1){
            word = "Subject";
        }
        const message = `${toAdd.length} ${word} Copied From ${from.name}`;
        res.status(200).send({success:true , message});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}
