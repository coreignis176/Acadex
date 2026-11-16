import mongoose from "mongoose";
import User from "../modules/User.js";
import Section from "../modules/Section.js";
import Note from "../modules/Note.js";
import { decorateNote, notifyMany, sectionInfo } from "../utils/helpers.js";
import { cloudinaryReady, uploadImage, deleteImages } from "../config/Cloudinary.js";
import { MAX_TOTAL_BYTES } from "../middlewares/multer.js";
import { runProgram } from "../connect_pbl/runProgram.js";
import { getPendingNotes, queuePositions } from "../connect_pbl/notesQueue.js";
import { stackPush, stackShow, stackClear } from "../connect_pbl/recentStack.js";
import { checkNote } from "../connect_pbl/validation.js";

const sizeText = (bytes) =>{
    if(bytes < 1024 * 1024){
        return Math.max(1 , Math.round(bytes / 1024)) + " KB";
    }
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

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

const cleanSubject = (text) =>{
    return String(text || "").replace(/[\r\n]+/g , " ").trim();
}

const sortNotesWithJavaScript = (notes , sortBy , subject) =>{

    const chosen = [];
    for(const note of notes){
        if(subject === "all" || cleanSubject(note.subject) === subject){
            chosen.push(note);
        }
    }

    chosen.sort((noteA , noteB) =>{
        if(sortBy === "liked" && noteA.likes.length !== noteB.likes.length){
            return noteB.likes.length - noteA.likes.length;
        }
        return noteB.createdAt - noteA.createdAt;
    });

    return chosen;
}

const sortNotesWithC = async(notes , sortBy , subject) =>{

    const useJavaScriptInstead = (reason) =>{
        console.log("notes_sort (C) " + reason + " -> JavaScript sorted the notes instead.");
        return sortNotesWithJavaScript(notes , sortBy , subject);
    }

    if(notes.length === 0){
        return [];
    }

    const lines = [];
    lines.push(sortBy);
    lines.push(subject);
    lines.push(String(notes.length));

    for(let index = 0 ; index < notes.length ; index++){
        const note = notes[index];

        const time = new Date(note.createdAt).getTime();
        const likes = note.likes.length;
        const noteSubject = cleanSubject(note.subject);

        lines.push(index + " " + time + " " + likes + " " + noteSubject);
    }

    const input = lines.join("\n");

    const result = await runProgram("notes_sort_c" , input);

    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    const order = [];
    const alreadyUsed = [];

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

    if(subject === "all" && order.length !== notes.length){
        return useJavaScriptInstead("did not give back every note: " + result.output);
    }

    const sorted = [];
    for(const index of order){
        sorted.push(notes[index]);
    }
    return sorted;
}

const visibleSections = async(user) =>{
    const mine = await Section.findById(user.sectionId);
    if(!mine){
        return {ids:[] , names:{}};
    }

    const sameYear = await Section.find({courseId:mine.courseId , year:mine.year , archived:false});
    const ids = sameYear.map((section) => section._id);

    const names = {};
    for(const section of sameYear){
        names[String(section._id)] = section.name;
    }

    return {ids , names};
}

const findVisibleNote = async(user , noteId) =>{
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
        return null;
    }

    return {note , sectionName};
}

export const getnotes = async(req , res) =>{
    try{
        const user = req.user;
        const {ids , names} = await visibleSections(user);
        if(ids.length === 0){
            return res.status(200).send({success:true , data:[]});
        }

        let sortBy = "newest";
        if(req.query.sort === "liked"){
            sortBy = "liked";
        }

        let subject = "all";
        if(typeof req.query.subject === "string" && cleanSubject(req.query.subject) !== ""){
            subject = cleanSubject(req.query.subject);
        }

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

export const getmysubmissions = async(req , res) =>{
    try{
        const user = req.user;
        const section = await Section.findById(user.sectionId);
        const notes = await Note.find({uploadedBy:user._id}).sort({createdAt:-1});

        let sectionName = "";
        if(section){
            sectionName = section.name;
        }

        const pendingNotes = await getPendingNotes(user.sectionId);
        const positions = await queuePositions(pendingNotes , user._id);

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

export const submitnote = async(req , res) =>{
    const uploaded = [];
    try{
        const user = req.user;
        const {title , subject , topic , description} = req.body;
        const files = req.files || [];

        const section = await Section.findById(user.sectionId);
        if(!section){
            return res.status(400).send({success:false , message:"You Are Not Assigned To A Section."});
        }

        const cleanTitle = String(title || "").trim();
        const cleanTopic = String(topic || "").trim();
        const cleanDescription = String(description || "").trim();
        const chosenSubject = String(subject || "");

        const subjectNames = section.subjects.map((entry) => entry.name);
        const problem = await checkNote(cleanTitle , cleanTopic , cleanDescription , chosenSubject , subjectNames);
        if(problem){
            return res.status(400).send({success:false , message:problem});
        }
        const subjectEntry = section.subjects.find((entry) => entry.name === chosenSubject);
        if(!subjectEntry){
            return res.status(400).send({success:false , message:"Please Choose One Of Your Section's Subjects."});
        }

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

        const pages = [];
        for(const file of files){
            const result = await uploadImage(file.buffer , "acadex/notes");
            uploaded.push(result.public_id);
            pages.push({url:result.secure_url , publicId:result.public_id , name:file.originalname , type:file.mimetype , size:file.size});
        }

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
            const classmates = await User.find({role:"student" , sectionId:section._id , _id:{$ne:user._id}});
            const classmateIds = classmates.map((classmate) => classmate._id);
            const sharedText = `${user.name} shared "${cleanTitle}" for ${subjectEntry.name}.`;
            await notifyMany(classmateIds , "notes" , "New notes available" , sharedText);
        }
        else{
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
        await deleteImages(uploaded);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const reactnote = async(req , res) =>{
    try{
        const user = req.user;
        const {noteId , type} = req.body;
        const me = String(user._id);

        if(type !== "like" && type !== "dislike"){
            return res.status(400).send({success:false , message:"Please Choose Like Or Dislike."});
        }

        const found = await findVisibleNote(user , noteId);
        if(!found){
            return res.status(400).send({success:false , message:"These Notes Are Not Available."});
        }
        const note = found.note;

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

        note.likes = note.likes.filter((id) => String(id) !== me);
        note.dislikes = note.dislikes.filter((id) => String(id) !== me);

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

const savedHistory = (user) =>{
    const ids = [];
    for(const id of user.recentNotes || []){
        ids.push(String(id));
    }
    return ids;
}

export const viewnote = async(req , res) =>{
    try{
        const user = req.user;
        const {noteId} = req.body;

        const found = await findVisibleNote(user , noteId);
        if(!found){
            return res.status(400).send({success:false , message:"These Notes Are Not Available."});
        }

        const history = await stackPush(savedHistory(user) , String(found.note._id));

        await User.updateOne({_id:user._id} , {recentNotes:history});

        res.status(200).send({success:true , data:{count:history.length}});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const getrecent = async(req , res) =>{
    try{
        const user = req.user;
        const saved = savedHistory(user);

        const order = await stackShow(saved);

        const {ids , names} = await visibleSections(user);
        const notes = await Note.find({_id:{$in:order} , status:"approved" , sectionId:{$in:ids}});

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
