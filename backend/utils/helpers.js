import Notification from "../modules/Notification.js";
import Activity from "../modules/Activity.js";

export const courses = [
    {_id:"btech" , name:"B.Tech" , fullName:"Bachelor of Technology" , duration:4},
    {_id:"bba" , name:"BBA" , fullName:"Bachelor of Business Administration" , duration:3}
];

export const MAX_CR_PER_SECTION = 2;

export const findCourse = (courseId) =>{
    for(const course of courses){
        if(course._id === courseId) return course;
    }
    return null;
}

export const yearLabel = (year) =>{
    const names = ["1st" , "2nd" , "3rd" , "4th" , "5th"];
    return names[year - 1] + " Year";
}

export const sectionInfo = (section) =>{
    if(!section) return null;
    const course = findCourse(section.courseId);
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

export const publicUser = (user , section) =>{
    if(!user) return null;

    let data;
    if(user.toObject){
        data = user.toObject();
    }
    else{
        data = Object.assign({} , user);
    }
    delete data.password;
    delete data.recentNotes;
    data.section = sectionInfo(section);
    return data;
}

export const cleanName = (value) =>{
    if(value === undefined || value === null) return "";
    return String(value).trim().replace(/\s+/g , " ");
}

export const cleanCode = (value) =>{
    if(value === undefined || value === null) return "";
    return String(value).trim().toUpperCase();
}

export const studentFieldError = (name , classRollNo , collegeRollNo) =>{
    if(name.length < 2 || name.length > 60 || !/[A-Za-z]/.test(name)) return "Student name must be 2-60 characters";

    if(!classRollNo) return "Class roll number is missing";
    if(!/^[A-Z0-9-]{1,10}$/.test(classRollNo)) return "Class roll number can use up to 10 letters, digits or hyphens";

    if(!collegeRollNo) return "College roll number is missing";
    if(!/^[A-Z0-9-]{4,16}$/.test(collegeRollNo)) return "College roll number must be 4-16 letters, digits or hyphens";

    return null;
}

export const passwordProblem = (password , defaultPassword) =>{
    if(password.length < 8 || password.length > 64) return "Your New Password Must Be 8-64 Characters.";

    if(!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Your New Password Must Have At Least One Letter And One Number.";
    if(password === defaultPassword) return "Please Choose A Password Different From The Default One.";
    return null;
}

export const subjectFieldProblem = (name , code) =>{
    if(name.length < 2 || name.length > 60) return "Subject Name Must Be 2-60 Characters.";

    if(!/^[A-Z0-9-]{3,12}$/.test(code)) return "Subject Code Must Be 3-12 Letters, Digits Or Hyphens, e.g. TCS355.";
    return null;
}

export const noteFieldProblem = (title , topic , description , subject , subjectNames) =>{
    if(title.length < 4 || title.length > 80) return "The Title Must Be 4-80 Characters.";
    if(!subjectNames.includes(subject)) return "Please Choose One Of Your Section's Subjects.";
    if(topic.length < 2 || topic.length > 60) return "The Topic Name Must Be 2-60 Characters.";
    if(description.length > 300) return "The Description Can Be At Most 300 Characters.";
    return null;
}

export const byClassRoll = (a , b) =>{
    return String(a.classRollNo).localeCompare(String(b.classRollNo) , undefined , {numeric:true});
}

export const notify = async(userId , type , title , message , action = null) =>{
    await Notification.create({userId , type , title , message , action});
}

export const notifyMany = async(userIds , type , title , message) =>{
    const list = [];
    for(const userId of userIds){
        list.push({userId , type , title , message});
    }
    if(list.length > 0) await Notification.insertMany(list);
}

export const logActivity = async(kind , text) =>{
    await Activity.create({kind , text});
}

export const decorateNote = (note , userId , sectionName = "") =>{
    let data;
    if(note.toObject){
        data = note.toObject();
    }
    else{
        data = Object.assign({} , note);
    }
    const me = String(userId);

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
    data.pages = data.files.length || 1;
    data.likeCount = data.likes.length;
    data.dislikeCount = data.dislikes.length;
    data.myReaction = myReaction;
    return data;
}
