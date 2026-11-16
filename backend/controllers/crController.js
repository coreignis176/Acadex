import mongoose from "mongoose";
import User from "../modules/User.js";
import Section from "../modules/Section.js";
import Note from "../modules/Note.js";
import { decorateNote, notify, notifyMany, publicUser, sectionInfo, byClassRoll } from "../utils/helpers.js";
import { deleteImages } from "../config/Cloudinary.js";
import { getPendingNotes, queueLine, queueFront } from "../connect_pbl/notesQueue.js";

export const getsectionnotes = async(req , res) =>{
    try{
        const user = req.user;
        const section = await Section.findById(user.sectionId);

        let sectionName = "";
        if(section){
            sectionName = section.name;
        }

        const pendingNotes = await getPendingNotes(user.sectionId);
        const line = await queueLine(pendingNotes);
        const pendingList = line.map((note , place) =>{
            const data = decorateNote(note , user._id , sectionName);
            data.queuePosition = place + 1;
            return data;
        });

        const reviewedNotes = await Note.find({sectionId:user.sectionId , status:{$ne:"pending"}}).sort({createdAt:-1});
        const reviewedList = reviewedNotes.map((note) => decorateNote(note , user._id , sectionName));

        const list = pendingList.concat(reviewedList);
        res.status(200).send({success:true , data:list});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const reviewnote = async(req , res) =>{
    try{
        const user = req.user;
        const {noteId , decision , reason} = req.body;
        const cleanReason = String(reason || "").trim();

        if(!mongoose.isValidObjectId(noteId)){
            return res.status(400).send({success:false , message:"These Notes Are Not From Your Section."});
        }

        const note = await Note.findById(noteId);
        if(!note || String(note.sectionId) !== String(user.sectionId)){
            return res.status(400).send({success:false , message:"These Notes Are Not From Your Section."});
        }
        if(note.status !== "pending"){
            return res.status(400).send({success:false , message:"These Notes Were Already Reviewed."});
        }

        const pendingNotes = await getPendingNotes(user.sectionId);
        const frontNote = await queueFront(pendingNotes);
        if(!frontNote || String(frontNote._id) !== String(note._id)){
            return res.status(400).send({success:false , message:"Please Review The Notes At The Front Of The Line First."});
        }

        if(decision === "rejected" && !cleanReason){
            return res.status(400).send({success:false , message:"Please Tell The Student Why The Notes Were Not Approved."});
        }

        if(decision === "approved"){
            note.status = "approved";
        }
        else{
            note.status = "rejected";
        }
        note.reason = cleanReason;
        note.reviewedBy = user.name;
        note.reviewedAt = new Date();
        await note.save();

        if(note.status === "approved"){
            const approvedText = `Your notes "${note.title}" were approved by ${user.name} and are now visible to your section.`;
            await notify(note.uploadedBy , "notes" , "Notes approved" , approvedText);
            const classmates = await User.find({role:"student" , sectionId:user.sectionId , _id:{$ne:note.uploadedBy}});
            const classmateIds = classmates.map((classmate) => classmate._id);
            await notifyMany(classmateIds , "notes" , "New notes available" , `"${note.title}" (${note.subject}) is now available.`);
        }
        else{
            const rejectedText = `Your notes "${note.title}" were not approved. Reason: ${note.reason}`;
            await notify(note.uploadedBy , "notes" , "Notes not approved" , rejectedText);
        }

        const section = await Section.findById(user.sectionId);
        let sectionName = "";
        if(section){
            sectionName = section.name;
        }

        let message = "Notes Rejected";
        if(note.status === "approved"){
            message = "Notes Approved And Published";
        }
        const data = decorateNote(note , user._id , sectionName);
        res.status(200).send({success:true , message , data});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const deletenote = async(req , res) =>{
    try{
        const user = req.user;
        const {id} = req.params;

        if(!mongoose.isValidObjectId(id)){
            return res.status(400).send({success:false , message:"These Notes Are Not From Your Section."});
        }

        const note = await Note.findById(id);
        if(!note || String(note.sectionId) !== String(user.sectionId)){
            return res.status(400).send({success:false , message:"These Notes Are Not From Your Section."});
        }

        await Note.findByIdAndDelete(id);

        const publicIds = note.files.map((file) => file.publicId);
        await deleteImages(publicIds);

        if(String(note.uploadedBy) !== String(user._id)){
            await notify(note.uploadedBy , "notes" , "Notes removed" , `Your notes "${note.title}" were removed by ${user.name}.`);
        }

        res.status(200).send({success:true , message:"Notes Deleted"});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}

export const getcrstats = async(req , res) =>{
    try{
        const user = req.user;
        const section = await Section.findById(user.sectionId);
        const notes = await Note.find({sectionId:user.sectionId});
        const studentDocs = await User.find({role:"student" , sectionId:user.sectionId});

        const students = studentDocs.map((student) => publicUser(student , section));
        students.sort(byClassRoll);

        const lastTime = (note) =>{
            return new Date(note.reviewedAt || note.createdAt).getTime();
        }
        const sortedNotes = notes.slice();
        sortedNotes.sort((a , b) => lastTime(b) - lastTime(a));
        const recent = sortedNotes.slice(0 , 6);

        const approvedNotes = notes.filter((note) => note.status === "approved");
        const pendingNotes = notes.filter((note) => note.status === "pending");
        const rejectedNotes = notes.filter((note) => note.status === "rejected");

        res.status(200).send({success:true , data:{
            section:sectionInfo(section),
            students,
            totals:{
                students:students.length,
                notes:approvedNotes.length,
                pending:pendingNotes.length,
                rejected:rejectedNotes.length
            },
            recent
        }});
    }
    catch(error){
        console.log(error);
        res.status(501).send({success:false , message:"Internal Server Error , Please Try Again Later."});
    }
}
