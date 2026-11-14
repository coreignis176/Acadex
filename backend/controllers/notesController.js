import mongoose from "mongoose";
import User from "../modules/User.js";
import Section from "../modules/Section.js";
import Note from "../modules/Note.js";
import { decorateNote, notifyMany, sectionInfo } from "../utils/helpers.js";
import { cloudinaryReady, uploadImage, deleteImages } from "../config/Cloudinary.js";
import { MAX_TOTAL_BYTES } from "../middlewares/multer.js";
import { runProgram } from "../connect_pbl/runProgram.js";                 // runs our C programs (see connect_pbl folder)
import { getPendingNotes, queuePositions } from "../connect_pbl/notesQueue.js";   // the line of pending notes, run by our C queue
import { stackPush, stackShow, stackClear } from "../connect_pbl/recentStack.js";  // Recently Viewed history, run by our C stack
import { checkNote } from "../connect_pbl/validation.js";                          // the note form is checked by our C++ program

// every route in this file needs a logged in student (see routes/notesRoute.js)
// notes are photos of notebook pages, stored on Cloudinary
//
// NOTE on short forms used in this file:
//   {success:true , message}   is short for {success:true , message:message}
//   $in = "one of these"       e.g. {sectionId:{$in:ids}} -> sectionId is any id in the list
//   $ne = "not equal to"       e.g. {_id:{$ne:user._id}} -> every user except me
//   String(id)                 turns a MongoDB id into plain text so two ids can be compared with ===


//$ function to turn bytes into text like "860 KB" or "2.4 MB"
// (1024 bytes = 1 KB , 1024 KB = 1 MB)
const sizeText = (bytes) =>{
    if(bytes < 1024 * 1024){
        // Math.max(1 , ...) -> a tiny file still shows as "1 KB", never "0 KB"
        return Math.max(1 , Math.round(bytes / 1024)) + " KB";
    }
    // toFixed(1) -> keep one digit after the dot, e.g. 2.4
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
}


//$ function to get the subject names of the student's section
export const getsubjects = async(req , res) =>{
    try{
        const section = await Section.findById(req.user.sectionId);
        if(!section){
            return res.status(200).send({success:true , data:[]});
        }
        const names = section.subjects.map((subject) => subject.name);
        res.status(200).send({success:true , data:names});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to get the subjects (name + code) of the student's section
export const getsubjectlist = async(req , res) =>{
    try{
        const section = await Section.findById(req.user.sectionId);
        if(!section){
            return res.status(200).send({success:true , data:[]});
        }
        const list = section.subjects.map((subject) =>{
            return {name:subject.name , code:subject.code};
        });
        res.status(200).send({success:true , data:list});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to clean a subject name before it goes to the C program
// - an Enter (\r or \n) inside it becomes a space, so it stays on ONE line
//   ( /[\r\n]+/g means "every group of \r or \n" )
// - spaces at the start and the end are removed (trim)
const cleanSubject = (text) =>{
    return String(text || "").replace(/[\r\n]+/g , " ").trim();
}


//$ function to filter + sort the notes in JavaScript
// used ONLY when the C program does not work (see sortNotesWithC below)
// sortBy  = "newest" or "liked"
// subject = a subject name , or "all" (= every subject)
const sortNotesWithJavaScript = (notes , sortBy , subject) =>{

    // 1. filter: keep only the wanted subject
    const chosen = [];
    for(const note of notes){
        if(subject === "all" || cleanSubject(note.subject) === subject){
            chosen.push(note);
        }
    }

    // 2. sort: (noteB - noteA) -> the bigger one comes first
    chosen.sort((noteA , noteB) =>{
        // "liked" and the likes are different -> more likes first
        if(sortBy === "liked" && noteA.likes.length !== noteB.likes.length){
            return noteB.likes.length - noteA.likes.length;
        }
        // otherwise -> newer first
        return noteB.createdAt - noteA.createdAt;
    });

    return chosen;
}


//$ function to FILTER + SORT the notes using our C program
// C code   : connect_pbl/c/notes_sort.c   (linear search + bubble sort)
// it runs  : connect_pbl/bin/notes_sort_c.exe   (made by connect_pbl/compile.bat)
//
// sortBy  = "newest" or "liked"
// subject = a subject name like "DBMS" , or "all" (= every subject)
//
// the C program does NOT get the whole notes, only what it needs:
//      line 1 = sortBy                          e.g.  liked
//      line 2 = subject                         e.g.  DBMS
//      line 3 = how many notes                  e.g.  4
//      then one line per note: index time likes subject
//                                               e.g.  0 1731400000000 3 Data Structures
// and it gives back ONLY the new order (the indexes), e.g.   "1 3"
// then we put the notes in that order:  notes[1] , notes[3]
//
// if the C program does not work (no .exe , crash , too slow , strange answer)
// JavaScript does it instead, so the page still works,
// and the backend console prints why  -> check the console during the demo!
const sortNotesWithC = async(notes , sortBy , subject) =>{

    // when something goes wrong: say why in the console, then let JavaScript do it
    const useJavaScriptInstead = (reason) =>{
        console.log("notes_sort (C) " + reason + " -> JavaScript sorted the notes instead.");
        return sortNotesWithJavaScript(notes , sortBy , subject);
    }

    // no notes -> nothing to sort
    if(notes.length === 0){
        return [];
    }


    // ---------- 1. make the input text for the C program ----------
    const lines = [];
    lines.push(sortBy);
    lines.push(subject);
    lines.push(String(notes.length));

    for(let index = 0 ; index < notes.length ; index++){
        const note = notes[index];

        const time = new Date(note.createdAt).getTime();          // date -> milliseconds (a big number)
        const likes = note.likes.length;                           // how many likes
        const noteSubject = cleanSubject(note.subject);            // stays on ONE line

        lines.push(index + " " + time + " " + likes + " " + noteSubject);
    }

    const input = lines.join("\n");          // join the lines, with an Enter between them


    // ---------- 2. run the C program ----------
    const result = await runProgram("notes_sort_c" , input);

    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }


    // ---------- 3. turn "1 3" into the numbers [1 , 3] and check them ----------
    // every index must be a real note (0 to notes.length - 1), must come only once,
    // and must be a note of the wanted subject
    const order = [];
    const alreadyUsed = [];                  // alreadyUsed[5] = true -> note 5 is already in the order

    // an empty answer means: no note of that subject -> the order stays empty
    if(result.output !== ""){
        const parts = result.output.split(" ");

        for(const part of parts){
            const index = Number(part);

            const isRealNote = Number.isInteger(index) && index >= 0 && index < notes.length;
            if(!isRealNote || alreadyUsed[index]){
                return useJavaScriptInstead("gave a strange answer: " + result.output);
            }

            if(subject !== "all" && cleanSubject(notes[index].subject) !== subject){
                return useJavaScriptInstead("gave a note of another subject: " + result.output);
            }

            alreadyUsed[index] = true;
            order.push(index);
        }
    }

    // with "all" (no filter) every note must come back
    if(subject === "all" && order.length !== notes.length){
        return useJavaScriptInstead("did not give back every note: " + result.output);
    }


    // ---------- 4. put the notes in the order the C program gave ----------
    const sorted = [];
    for(const index of order){
        sorted.push(notes[index]);
    }
    return sorted;
}


//$ function to find the sections whose notes this student may see:
// every ACTIVE section of the same course and year, e.g. ML1 , ML2 , ML3
// gives back  {ids:[section ids] , names:{sectionId : section name}}
// (no section -> both are empty , so the student sees no notes)
const visibleSections = async(user) =>{
    const mine = await Section.findById(user.sectionId);
    if(!mine){
        return {ids:[] , names:{}};
    }

    const sameYear = await Section.find({courseId:mine.courseId , year:mine.year , archived:false});
    const ids = sameYear.map((section) => section._id);

    // names = {sectionId : section name} so each note can show its section's name
    const names = {};
    for(const section of sameYear){
        names[String(section._id)] = section.name;
    }

    return {ids , names};
}


//$ function to find ONE note this student may see (approved + from a visible section)
// gives back {note , sectionName} , or null if it is not available to this student
const findVisibleNote = async(user , noteId) =>{
    // a broken id like "abc" would make MongoDB throw an error -> treat it as "not found"
    if(!mongoose.isValidObjectId(noteId)){
        return null;
    }

    const note = await Note.findById(noteId);
    if(!note || note.status !== "approved"){
        return null;
    }

    const {names} = await visibleSections(user);
    const sectionName = names[String(note.sectionId)];
    if(sectionName === undefined){
        return null;        // a note of another course / year , or of an archived section
    }

    return {note , sectionName};
}


//$ function to get approved notes from ALL sections of the student's course + year
// the student can pick (see frontend AllNotes.jsx):
//      ?sort=liked     -> most liked first      (missing / anything else -> newest first)
//      ?subject=DBMS   -> only DBMS notes        (missing / "all" -> every subject)
// the filter + sort is done by our C program (see sortNotesWithC above), not by MongoDB
export const getnotes = async(req , res) =>{
    try{
        const user = req.user;
        const {ids , names} = await visibleSections(user);
        if(ids.length === 0){
            return res.status(200).send({success:true , data:[]});
        }

        // what the student picked on the page
        let sortBy = "newest";
        if(req.query.sort === "liked"){
            sortBy = "liked";
        }

        // typeof ... === "string" -> ignore strange values, like ?subject=a&subject=b (that comes as a list)
        let subject = "all";
        if(typeof req.query.subject === "string" && cleanSubject(req.query.subject) !== ""){
            subject = cleanSubject(req.query.subject);
        }

        // $in = the note's sectionId is any one of the ids in the list
        // NO .sort() and NO subject filter here on purpose -> MongoDB must not do it, our C program does
        const notes = await Note.find({sectionId:{$in:ids} , status:"approved"});
        const sortedNotes = await sortNotesWithC(notes , sortBy , subject);
        const list = sortedNotes.map((note) => decorateNote(note , user._id , names[String(note.sectionId)]));

        res.status(200).send({success:true , data:list});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to get the notes this student uploaded (every status)
// every PENDING note of mine also gets  queuePosition  -> "Your notes are #3 in line"
// (found by our C queue: job "position" , see connect_pbl/notesQueue.js)
export const getmysubmissions = async(req , res) =>{
    try{
        const user = req.user;
        const section = await Section.findById(user.sectionId);
        const notes = await Note.find({uploadedBy:user._id}).sort({createdAt:-1});

        let sectionName = "";
        if(section){
            sectionName = section.name;
        }

        // the whole line of my section (everyone's pending notes), then where MY notes stand
        const pendingNotes = await getPendingNotes(user.sectionId);
        const positions = await queuePositions(pendingNotes , user._id);     // {noteId : position}

        const list = notes.map((note) =>{
            const data = decorateNote(note , user._id , sectionName);
            const position = positions[String(note._id)];
            if(position){
                data.queuePosition = position;
            }
            return data;
        });
        res.status(200).send({success:true , data:list});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to upload notes (student -> waits for CR approval , CR -> published at once)
// sent as form-data:  title , subject , topic , description  +  pages (the images, 1 to 30)
// the images are already read by the uploadPages middleware -> req.files
export const submitnote = async(req , res) =>{
    const uploaded = [];       // public ids sent to Cloudinary (deleted again if something fails)
    try{
        const user = req.user;
        const {title , subject , topic , description} = req.body;
        const files = req.files || [];      // no images sent -> use an empty list

        const section = await Section.findById(user.sectionId);
        if(!section){
            return res.status(400).send({success:false , message:"You Are Not Assigned To A Section."});
        }

        // String(...) -> a value sent twice (it comes as a list) can't crash .trim()
        const cleanTitle = String(title || "").trim();
        const cleanTopic = String(topic || "").trim();
        const cleanDescription = String(description || "").trim();
        const chosenSubject = String(subject || "");

        // title , subject , topic and description are checked by our C++ program
        // (connect_pbl/cpp/validation.cpp , form "note") - the chosen subject must be one of these
        const subjectNames = section.subjects.map((entry) => entry.name);
        const problem = await checkNote(cleanTitle , cleanTopic , cleanDescription , chosenSubject , subjectNames);
        if(problem){
            return res.status(400).send({success:false , message:problem});
        }
        const subjectEntry = section.subjects.find((entry) => entry.name === chosenSubject);
        if(!subjectEntry){
            // extra safety: never save a note with a subject the section does not have
            return res.status(400).send({success:false , message:"Please Choose One Of Your Section's Subjects."});
        }

        // check the page images (type, count and size per page were checked by multer)
        if(files.length === 0){
            return res.status(400).send({success:false , message:"Please Add At Least One Page Image."});
        }
        let totalBytes = 0;
        for(const file of files){
            totalBytes += file.size;
        }
        if(totalBytes > MAX_TOTAL_BYTES){
            return res.status(400).send({success:false , message:"All Pages Together Can Be At Most 60 MB."});
        }
        if(!cloudinaryReady()){
            return res.status(503).send({success:false , message:"Image Upload Is Not Set Up Yet. Please Contact The Admin."});
        }

        // upload the pages one by one, in order
        const pages = [];
        for(const file of files){
            const result = await uploadImage(file.buffer , "acadex/notes");
            uploaded.push(result.public_id);
            pages.push({url:result.secure_url , publicId:result.public_id , name:file.originalname , type:file.mimetype , size:file.size});
        }

        // a CR's notes are published at once, a student's notes wait for a CR
        const isCr = user.crStatus === "active";
        let uploaderRole = "Student";
        let status = "pending";
        if(isCr){
            uploaderRole = "CR";
            status = "approved";
        }

        const note = await Note.create({
            sectionId:section._id,
            title:cleanTitle,
            subject:subjectEntry.name,
            subjectCode:subjectEntry.code,
            topic:cleanTopic,
            description:cleanDescription,
            fileName:files[0].originalname,
            fileSize:sizeText(totalBytes),
            files:pages,
            uploadedBy:user._id,
            uploaderName:user.name,
            uploaderRole,
            status
        });

        if(isCr){
            // a CR's notes go live -> tell the class
            // everyone in the section except me ($ne = "not equal")
            const classmates = await User.find({role:"student" , sectionId:section._id , _id:{$ne:user._id}});
            const classmateIds = classmates.map((classmate) => classmate._id);
            const sharedText = `${user.name} shared "${cleanTitle}" for ${subjectEntry.name}.`;
            await notifyMany(classmateIds , "notes" , "New notes available" , sharedText);
        }
        else{
            // a student's notes wait -> tell the section's CRs
            const crs = await User.find({role:"student" , sectionId:section._id , crStatus:"active"});
            const crIds = crs.map((cr) => cr._id);
            const submittedText = `${user.name} submitted "${cleanTitle}" for ${subjectEntry.name}.`;
            await notifyMany(crIds , "notes" , "New notes awaiting approval" , submittedText);
        }

        let message = "Notes Submitted For CR Approval";
        if(isCr){
            message = `Notes Published To ${sectionInfo(section).name}`;
        }
        const data = decorateNote(note , user._id , section.name);
        res.status(200).send({success:true , message , data});
    }
    catch(error){
        console.log(error);
        // something failed half way -> remove the pages that did reach Cloudinary
        await deleteImages(uploaded);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to like / dislike a note (clicking the same button again removes it)
export const reactnote = async(req , res) =>{
    try{
        const user = req.user;
        const {noteId , type} = req.body;
        const me = String(user._id);

        if(type !== "like" && type !== "dislike"){
            return res.status(400).send({success:false , message:"Please Choose Like Or Dislike."});
        }

        // only a note this student can see on All Notes (approved + same course and year)
        const found = await findVisibleNote(user , noteId);
        if(!found){
            return res.status(400).send({success:false , message:"These Notes Are Not Available."});
        }
        const note = found.note;

        // did I already press this same button?
        // (ids are compared as text, because two id objects are never "===" each other)
        let list = note.dislikes;
        if(type === "like"){
            list = note.likes;
        }
        let had = false;
        for(const id of list){
            if(String(id) === me){
                had = true;
            }
        }

        // remove my old reaction from both lists (filter keeps only the ids that are NOT mine)
        note.likes = note.likes.filter((id) => String(id) !== me);
        note.dislikes = note.dislikes.filter((id) => String(id) !== me);

        // add the new one (unless I was undoing it)
        if(!had){
            if(type === "like"){
                note.likes.push(user._id);
            }
            else{
                note.dislikes.push(user._id);
            }
        }
        await note.save();

        res.status(200).send({success:true , data:decorateNote(note , user._id , found.sectionName)});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}




// ============================ Recently Viewed (STACK in C) ======================================
// the history of every student is saved in User.recentNotes (bottom to top)
// the stack work (push / show / clear) is done by our C program: connect_pbl/c/recent_stack.c
// (see backend/connect_pbl/recentStack.js)


//$ function to read the saved history of a student as text ids (bottom first)
const savedHistory = (user) =>{
    const ids = [];
    for(const id of user.recentNotes || []){
        ids.push(String(id));
    }
    return ids;
}


//$ function to remember that the student opened a note -> PUSH it on top of the history
// body: {noteId}
export const viewnote = async(req , res) =>{
    try{
        const user = req.user;
        const {noteId} = req.body;

        // only notes the student can really see go into the history
        const found = await findVisibleNote(user , noteId);
        if(!found){
            return res.status(400).send({success:false , message:"These Notes Are Not Available."});
        }

        const history = await stackPush(savedHistory(user) , String(found.note._id));

        // updateOne changes ONLY recentNotes (nothing else of the user is saved again)
        await User.updateOne({_id:user._id} , {recentNotes:history});

        res.status(200).send({success:true , data:{count:history.length}});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function to get the Recently Viewed notes , the note opened LAST comes FIRST
// the first note of the list = "Continue reading" on the page (the TOP of the stack)
export const getrecent = async(req , res) =>{
    try{
        const user = req.user;
        const saved = savedHistory(user);

        // the C program gives the ids from TOP to BOTTOM
        const order = await stackShow(saved);

        // get those notes , but only the ones the student can still see
        // (a note can be deleted or rejected later , or its section archived)
        const {ids , names} = await visibleSections(user);
        const notes = await Note.find({_id:{$in:order} , status:"approved" , sectionId:{$in:ids}});

        // byId = {noteId : note} so we can put the notes in the stack's order
        const byId = {};
        for(const note of notes){
            byId[String(note._id)] = note;
        }

        const list = [];
        for(const id of order){
            const note = byId[id];
            if(note){
                list.push(decorateNote(note , user._id , names[String(note.sectionId)]));
            }
        }

        // a note is gone -> remove it from the saved history too (the order stays the same)
        const stillThere = saved.filter((id) => byId[id]);
        if(stillThere.length !== saved.length){
            await User.updateOne({_id:user._id} , {recentNotes:stillThere});
        }

        res.status(200).send({success:true , data:list});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}


//$ function for the "Clear history" button -> CLEAR the stack
export const clearrecent = async(req , res) =>{
    try{
        const user = req.user;
        const history = await stackClear(savedHistory(user));

        await User.updateOne({_id:user._id} , {recentNotes:history});

        res.status(200).send({success:true , message:"History Cleared"});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}
