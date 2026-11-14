import mongoose from "mongoose";
import User from "../modules/User.js";
import Section from "../modules/Section.js";
import Note from "../modules/Note.js";
import { decorateNote, notify, notifyMany, publicUser, sectionInfo, byClassRoll } from "../utils/helpers.js";
import { deleteImages } from "../config/Cloudinary.js";
import { getPendingNotes, queueLine, queueFront } from "../connect_pbl/notesQueue.js";   // the line of pending notes, run by our C queue

// every route in this file needs an active CR (see routes/crRoute.js)
// a CR can only touch notes of their OWN section
//
// NOTE on short forms used in this file:
//   {success:true , message}   is short for {success:true , message:message}
//   $ne = "not equal to"       e.g. {_id:{$ne:note.uploadedBy}} -> every user except the uploader
//   String(id)                 turns a MongoDB id into plain text so two ids can be compared with ===


//$ function to get every note of the CR's section (pending , approved and rejected)
// the PENDING notes come first, in the order of the LINE (front first) - made by our C queue
// every pending note gets  queuePosition  (1 = at the front = the only one that can be reviewed)
// after them come the reviewed notes, newest first
export const getsectionnotes = async(req , res) =>{
    try{
        const user = req.user;
        const section = await Section.findById(user.sectionId);

        let sectionName = "";
        if(section){
            sectionName = section.name;
        }

        // 1. the line of pending notes (C program: job "line")
        const pendingNotes = await getPendingNotes(user.sectionId);
        const line = await queueLine(pendingNotes);
        const pendingList = line.map((note , place) =>{
            const data = decorateNote(note , user._id , sectionName);
            data.queuePosition = place + 1;          // place 0 -> #1
            return data;
        });

        // 2. the reviewed notes ($ne = "not equal") , sort({createdAt:-1}) -> newest first
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


//$ function for a CR to approve or reject a student's notes
// decision = "approved" | "rejected" , reason is needed when rejecting
//
// STRICT QUEUE: only the note at the FRONT of the line can be reviewed (C program: job "front").
// this check MUST be here in the backend - hiding buttons in the frontend is not enough,
// because anyone can send this request directly and jump the line.
// approving / rejecting = DEQUEUE: the note is no longer "pending", so next time it is not in the line
export const reviewnote = async(req , res) =>{
    try{
        const user = req.user;
        const {noteId , decision , reason} = req.body;
        const cleanReason = String(reason || "").trim();

        // a broken id like "abc" would make MongoDB throw an error -> answer like "not found"
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

        // is this note at the FRONT of the line? (PEEK)
        const pendingNotes = await getPendingNotes(user.sectionId);
        const frontNote = await queueFront(pendingNotes);
        if(!frontNote || String(frontNote._id) !== String(note._id)){
            return res.status(400).send({success:false , message:"Please Review The Notes At The Front Of The Line First."});
        }

        if(decision === "rejected" && !cleanReason){
            return res.status(400).send({success:false , message:"Please Tell The Student Why The Notes Were Not Approved."});
        }

        // anything other than "approved" counts as a rejection
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
            // everyone in the section except the uploader ($ne = "not equal")
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


//$ function for a CR to delete notes of their section
export const deletenote = async(req , res) =>{
    try{
        const user = req.user;
        const {id} = req.params;

        // a broken id like "abc" would make MongoDB throw an error -> answer like "not found"
        if(!mongoose.isValidObjectId(id)){
            return res.status(400).send({success:false , message:"These Notes Are Not From Your Section."});
        }

        const note = await Note.findById(id);
        if(!note || String(note.sectionId) !== String(user.sectionId)){
            return res.status(400).send({success:false , message:"These Notes Are Not From Your Section."});
        }

        await Note.findByIdAndDelete(id);

        // remove the page images from Cloudinary too
        const publicIds = note.files.map((file) => file.publicId);
        await deleteImages(publicIds);

        // tell the student, unless the CR deleted their own notes
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


//$ function for the CR dashboard: section students + note numbers + recent notes
export const getcrstats = async(req , res) =>{
    try{
        const user = req.user;
        const section = await Section.findById(user.sectionId);
        const notes = await Note.find({sectionId:user.sectionId});
        const studentDocs = await User.find({role:"student" , sectionId:user.sectionId});

        // students without passwords, sorted by class roll number
        const students = studentDocs.map((student) => publicUser(student , section));
        students.sort(byClassRoll);

        // latest 6 notes (by review time if reviewed, else by upload time)
        // getTime() turns a date into a number, so two dates can be subtracted
        const lastTime = (note) =>{
            return new Date(note.reviewedAt || note.createdAt).getTime();
        }
        const sortedNotes = notes.slice();      // a copy, so the original list is not changed
        sortedNotes.sort((a , b) => lastTime(b) - lastTime(a));     // b - a -> newest first
        const recent = sortedNotes.slice(0 , 6);                     // keep only the first 6

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
