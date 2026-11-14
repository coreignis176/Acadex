import Note from "../modules/Note.js";
import { runProgram } from "./runProgram.js";

// ---------------------------------------------------------------------------
// the line of PENDING notes (FIFO queue) - run by our C program
//
// C code   : connect_pbl/c/notes_queue.c      (struct Queue: enqueue , dequeue , peek ...)
// it runs  : connect_pbl/bin/notes_queue_c.exe (made by connect_pbl/compile.bat)
//
// RULE: the note that was sent FIRST is reviewed FIRST (strict queue)
//
// used by:
//   crController.js     getsectionnotes   -> queueLine       (the whole line, front to rear)
//   crController.js     reviewnote        -> queueFront      (only the FRONT note can be reviewed)
//   notesController.js  getmysubmissions  -> queuePositions  ("Your notes are #3 in line")
//
// the C program does NOT get the whole notes, only what the queue needs:
//      line 1 = the job                 line / front / position
//      line 2 = how many notes          e.g.  4
//      then one line per note, OLDEST FIRST:   index mine
//                                       e.g.  2 1
//
// if the C program does not work (no .exe , crash , too slow , strange answer)
// JavaScript does it instead, so the page still works,
// and the backend console prints why  -> check the console during the demo!
// ---------------------------------------------------------------------------


//$ function to get the PENDING notes of a section, OLDEST FIRST (the order they were sent)
// this is only the ARRIVAL order - like people walking up to the line one by one.
// the C program ENQUEUES them in this order; the queue itself decides who is at the front.
// two notes sent at the same millisecond -> the smaller _id was saved first, so it goes first
export const getPendingNotes = async(sectionId) =>{
    return await Note.find({sectionId , status:"pending"}).sort({createdAt:1 , _id:1});
}


//$ function to make the input text for the C program
// job    = "line" , "front" or "position"
// userId = the student who is looking (only the job "position" needs it)
const makeInput = (job , notes , userId) =>{
    const lines = [];
    lines.push(job);
    lines.push(String(notes.length));

    for(let index = 0 ; index < notes.length ; index++){
        let mine = 0;
        if(userId && String(notes[index].uploadedBy) === String(userId)){
            mine = 1;
        }
        lines.push(index + " " + mine);
    }

    return lines.join("\n");          // join the lines, with an Enter between them
}


//$ function to split the C program's answer into lines
// Windows C programs end every printf line with "\r\n" (not only "\n"),
// so /\r?\n/ means "an Enter, with or without \r before it"
const splitLines = (output) =>{
    return output.split(/\r?\n/).map((line) => line.trim());
}


//$ function to check one number from the C program's answer
// it must be a whole number and a real note: 0 to count - 1
const isRealIndex = (index , count) =>{
    return Number.isInteger(index) && index >= 0 && index < count;
}




// ======================= job "line" =======================

//$ function to get the whole line, FRONT to REAR
// gives back the notes in the line's order (notes[0] of the answer = the front)
export const queueLine = async(notes) =>{

    const useJavaScriptInstead = (reason) =>{
        console.log("notes_queue (C) line " + reason + " -> JavaScript made the line instead.");
        return notes.slice();         // notes are already oldest first = the line's order
    }

    // nobody waiting -> empty line
    if(notes.length === 0){
        return [];
    }

    const result = await runProgram("notes_queue_c" , makeInput("line" , notes));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    // the answer has 2 lines:   "4"   and   "0 1 2 3"
    const lines = splitLines(result.output);
    if(lines.length !== 2 || Number(lines[0]) !== notes.length){
        return useJavaScriptInstead("gave a strange answer: " + result.output);
    }

    // every note must come back exactly once
    const line = [];
    const alreadyUsed = [];               // alreadyUsed[5] = true -> note 5 is already in the line
    for(const part of lines[1].split(/\s+/)){
        const index = Number(part);
        if(!isRealIndex(index , notes.length) || alreadyUsed[index]){
            return useJavaScriptInstead("gave a strange answer: " + result.output);
        }
        alreadyUsed[index] = true;
        line.push(notes[index]);
    }

    if(line.length !== notes.length){
        return useJavaScriptInstead("did not give back every note: " + result.output);
    }

    return line;
}




// ======================= job "front" =======================

//$ function to get the note at the FRONT of the line (PEEK)
// gives back that note , or null if the line is empty
export const queueFront = async(notes) =>{

    const useJavaScriptInstead = (reason) =>{
        console.log("notes_queue (C) front " + reason + " -> JavaScript found the front instead.");
        if(notes.length === 0){
            return null;
        }
        return notes[0];              // oldest note = front of the line
    }

    const result = await runProgram("notes_queue_c" , makeInput("front" , notes));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    // the answer is one number:  the front note's index , or -1 (empty line)
    const index = Number(result.output);

    if(index === -1 && notes.length === 0){
        return null;
    }
    if(!isRealIndex(index , notes.length)){
        return useJavaScriptInstead("gave a strange answer: " + result.output);
    }

    return notes[index];
}




// ======================= job "position" =======================

//$ function to find where the student's OWN notes stand in the line
// gives back an object  {noteId : position}   (position 1 = at the front)
//      e.g.  {"6650...a1" : 3 , "6650...b7" : 4}
export const queuePositions = async(notes , userId) =>{

    // the notes of this student (we need them for the check and for JavaScript)
    const myIndexes = [];
    for(let index = 0 ; index < notes.length ; index++){
        if(String(notes[index].uploadedBy) === String(userId)){
            myIndexes.push(index);
        }
    }

    const useJavaScriptInstead = (reason) =>{
        console.log("notes_queue (C) position " + reason + " -> JavaScript found the positions instead.");
        const positions = {};
        for(const index of myIndexes){
            positions[String(notes[index]._id)] = index + 1;      // oldest first -> index 0 is #1
        }
        return positions;
    }

    // none of my notes are waiting -> nothing to find
    if(myIndexes.length === 0){
        return {};
    }

    const result = await runProgram("notes_queue_c" , makeInput("position" , notes , userId));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    // one line per note of mine:   "index position"   e.g.  "2 3"
    const lines = splitLines(result.output);
    if(lines.length !== myIndexes.length){
        return useJavaScriptInstead("did not give every note of mine: " + result.output);
    }

    const positions = {};
    const usedPositions = [];             // usedPositions[3] = true -> somebody is already #3
    for(const line of lines){
        const parts = line.split(/\s+/);
        const index = Number(parts[0]);
        const position = Number(parts[1]);

        const isGoodLine = parts.length === 2
            && isRealIndex(index , notes.length)
            && myIndexes.includes(index)                          // it really is my note
            && Number.isInteger(position) && position >= 1 && position <= notes.length
            && !usedPositions[position]
            && positions[String(notes[index]._id)] === undefined; // not given twice

        if(!isGoodLine){
            return useJavaScriptInstead("gave a strange answer: " + result.output);
        }

        usedPositions[position] = true;
        positions[String(notes[index]._id)] = position;
    }

    return positions;
}
