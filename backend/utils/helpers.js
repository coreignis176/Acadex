import Notification from "../modules/Notification.js";
import Activity from "../modules/Activity.js";

// ---------------------------------------------------------------------------
// small helper functions used by many controllers
//
// NOTE: {userId , type , title} is short for {userId:userId , type:type , title:title}
// ---------------------------------------------------------------------------

// the courses Acadex supports (same list as the frontend)
export const courses = [
    {_id:"btech" , name:"B.Tech" , fullName:"Bachelor of Technology" , duration:4},
    {_id:"bba" , name:"BBA" , fullName:"Bachelor of Business Administration" , duration:3}
];

export const MAX_CR_PER_SECTION = 2;


//$ function to find a course by its id ("btech" / "bba")
export const findCourse = (courseId) =>{
    for(const course of courses){
        if(course._id === courseId) return course;
    }
    return null;
}


//$ function to turn 2 into "2nd Year"
export const yearLabel = (year) =>{
    const names = ["1st" , "2nd" , "3rd" , "4th" , "5th"];
    return names[year - 1] + " Year";
}


//$ function to give the details of a section in the shape the frontend uses
export const sectionInfo = (section) =>{
    if(!section) return null;
    const course = findCourse(section.courseId);
    // label = e.g. "B.Tech 2nd Year ML1"
    return {
        _id:section._id,
        name:section.name,
        courseId:course._id,
        course:course.name,
        year:section.year,
        yearLabel:yearLabel(section.year),
        archived:section.archived,
        label:course.name + " " + yearLabel(section.year) + " " + section.name
    }
}


//$ function to remove the password and add the section details to a user
// section = the user's Section document (or null)
export const publicUser = (user , section) =>{
    if(!user) return null;

    // a mongoose document has toObject() to turn it into a plain object we can change;
    // anything else is copied with Object.assign (copies every field into a new empty object {})
    let data;
    if(user.toObject){
        data = user.toObject();
    }
    else{
        data = Object.assign({} , user);
    }
    delete data.password;       // never send the password hash to the browser
    delete data.recentNotes;    // the history has its own route (/notes/getrecent)
    data.section = sectionInfo(section);
    return data;
}


//$ function to tidy a name: "  priya   negi " -> "priya negi"
export const cleanName = (value) =>{
    if(value === undefined || value === null) return "";
    // /\s+/g matches every group of spaces (or tabs / new lines) -> each group becomes one space
    return String(value).trim().replace(/\s+/g , " ");
}


//$ function to tidy a code / roll number: " bt25ml1 " -> "BT25ML1"
export const cleanCode = (value) =>{
    if(value === undefined || value === null) return "";
    return String(value).trim().toUpperCase();
}


//$ function to check a student's fields, returns the first problem or null
// rollNo      = College Roll Number (unique in Acadex, also the login id)
// classRollNo = Class Roll Number   (unique inside one section)
export const studentFieldError = (name , classRollNo , collegeRollNo) =>{
    // /[A-Za-z]/ matches any letter -> the name must contain at least one letter
    if(name.length < 2 || name.length > 60 || !/[A-Za-z]/.test(name)) return "Student name must be 2-60 characters";

    if(!classRollNo) return "Class roll number is missing";
    // the whole value must be 1 to 10 characters, each a capital letter, a digit or a hyphen
    if(!/^[A-Z0-9-]{1,10}$/.test(classRollNo)) return "Class roll number can use up to 10 letters, digits or hyphens";

    if(!collegeRollNo) return "College roll number is missing";
    // the whole value must be 4 to 16 characters, each a capital letter, a digit or a hyphen
    if(!/^[A-Z0-9-]{4,16}$/.test(collegeRollNo)) return "College roll number must be 4-16 letters, digits or hyphens";

    return null;
}


// ---------------------------------------------------------------------------
// The checks below (and studentFieldError above) are now done by our C++ program
// connect_pbl/cpp/validation.cpp  (see backend/connect_pbl/validation.js).
// These JavaScript copies are used ONLY when the C++ program does not work,
// so they must give the SAME messages as the C++ program.
// ---------------------------------------------------------------------------


//$ function to check a new password, returns the problem or null
// defaultPassword = the password every new student gets (the new one must be different)
export const passwordProblem = (password , defaultPassword) =>{
    if(password.length < 8 || password.length > 64) return "Your New Password Must Be 8-64 Characters.";

    // /[A-Za-z]/ matches any letter , /[0-9]/ matches any digit -> the password needs at least one of each
    if(!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Your New Password Must Have At Least One Letter And One Number.";
    if(password === defaultPassword) return "Please Choose A Password Different From The Default One.";
    return null;
}


//$ function to check the name and code of a subject, returns the problem or null
// (the check "is it already in the section?" is separate: subjectClash in adminController.js)
export const subjectFieldProblem = (name , code) =>{
    if(name.length < 2 || name.length > 60) return "Subject Name Must Be 2-60 Characters.";

    // the code must be 3 to 12 characters, each one a capital letter, a digit or a hyphen
    if(!/^[A-Z0-9-]{3,12}$/.test(code)) return "Subject Code Must Be 3-12 Letters, Digits Or Hyphens, e.g. TCS355.";
    return null;
}


//$ function to check the text of a note upload, returns the problem or null
// subjectNames = the subjects of the student's section (the chosen subject must be one of them)
export const noteFieldProblem = (title , topic , description , subject , subjectNames) =>{
    if(title.length < 4 || title.length > 80) return "The Title Must Be 4-80 Characters.";
    if(!subjectNames.includes(subject)) return "Please Choose One Of Your Section's Subjects.";
    if(topic.length < 2 || topic.length > 60) return "The Topic Name Must Be 2-60 Characters.";
    if(description.length > 300) return "The Description Can Be At Most 300 Characters.";
    return null;
}


//$ function to sort students by class roll number (2 comes before 10)
// (localeCompare with numeric:true compares the numbers inside the text as numbers, not letter by letter)
export const byClassRoll = (a , b) =>{
    return String(a.classRollNo).localeCompare(String(b.classRollNo) , undefined , {numeric:true});
}


//$ function to send a notification to one user
// action = null means "no value given" -> the notification has no buttons
export const notify = async(userId , type , title , message , action = null) =>{
    await Notification.create({userId , type , title , message , action});
}


//$ function to send the same notification to many users
export const notifyMany = async(userIds , type , title , message) =>{
    const list = [];
    for(const userId of userIds){
        list.push({userId , type , title , message});
    }
    // insertMany saves the whole list in one go
    if(list.length > 0) await Notification.insertMany(list);
}


//$ function to save one line in the admin's activity log
export const logActivity = async(kind , text) =>{
    await Activity.create({kind , text});
}


//$ function to add the extra fields the frontend shows on a note card
// userId = the student looking at the note (to know if they liked it)
// sectionName = "" means: use an empty name when none is given
export const decorateNote = (note , userId , sectionName = "") =>{
    // turn a mongoose document into a plain object we can add fields to (see publicUser)
    let data;
    if(note.toObject){
        data = note.toObject();
    }
    else{
        data = Object.assign({} , note);
    }
    const me = String(userId);

    // is my id in the likes list? in the dislikes list?
    // (ids are compared as text, because two id objects are never "===" each other)
    let liked = false;
    for(const id of data.likes){
        if(String(id) === me){
            liked = true;
        }
    }
    let disliked = false;
    for(const id of data.dislikes){
        if(String(id) === me){
            disliked = true;
        }
    }

    let myReaction = null;
    if(liked){
        myReaction = "like";
    }
    else if(disliked){
        myReaction = "dislike";
    }

    data.sectionName = sectionName;
    data.pages = data.files.length || 1;        // old notes without page images count as 1 page
    data.likeCount = data.likes.length;
    data.dislikeCount = data.dislikes.length;
    data.myReaction = myReaction;
    return data;
}
