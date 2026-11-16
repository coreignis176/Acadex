import Note from "../modules/Note.js";
import { runProgram } from "./runProgram.js";

export const getPendingNotes = async(sectionId) =>{
    return await Note.find({sectionId , status:"pending"}).sort({createdAt:1 , _id:1});
}

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

    return lines.join("\n");
}

const splitLines = (output) =>{
    return output.split(/\r?\n/).map((line) => line.trim());
}

const isRealIndex = (index , count) =>{
    return Number.isInteger(index) && index >= 0 && index < count;
}

export const queueLine = async(notes) =>{

    const useJavaScriptInstead = (reason) =>{
        console.log("notes_queue (C) line " + reason + " -> JavaScript made the line instead.");
        return notes.slice();
    }

    if(notes.length === 0){
        return [];
    }

    const result = await runProgram("notes_queue_c" , makeInput("line" , notes));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    const lines = splitLines(result.output);
    if(lines.length !== 2 || Number(lines[0]) !== notes.length){
        return useJavaScriptInstead("gave a strange answer: " + result.output);
    }

    const line = [];
    const alreadyUsed = [];
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

export const queueFront = async(notes) =>{

    const useJavaScriptInstead = (reason) =>{
        console.log("notes_queue (C) front " + reason + " -> JavaScript found the front instead.");
        if(notes.length === 0){
            return null;
        }
        return notes[0];
    }

    const result = await runProgram("notes_queue_c" , makeInput("front" , notes));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    const index = Number(result.output);

    if(index === -1 && notes.length === 0){
        return null;
    }
    if(!isRealIndex(index , notes.length)){
        return useJavaScriptInstead("gave a strange answer: " + result.output);
    }

    return notes[index];
}

export const queuePositions = async(notes , userId) =>{

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
            positions[String(notes[index]._id)] = index + 1;
        }
        return positions;
    }

    if(myIndexes.length === 0){
        return {};
    }

    const result = await runProgram("notes_queue_c" , makeInput("position" , notes , userId));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    const lines = splitLines(result.output);
    if(lines.length !== myIndexes.length){
        return useJavaScriptInstead("did not give every note of mine: " + result.output);
    }

    const positions = {};
    const usedPositions = [];
    for(const line of lines){
        const parts = line.split(/\s+/);
        const index = Number(parts[0]);
        const position = Number(parts[1]);

        const isGoodLine = parts.length === 2
            && isRealIndex(index , notes.length)
            && myIndexes.includes(index)
            && Number.isInteger(position) && position >= 1 && position <= notes.length
            && !usedPositions[position]
            && positions[String(notes[index]._id)] === undefined;

        if(!isGoodLine){
            return useJavaScriptInstead("gave a strange answer: " + result.output);
        }

        usedPositions[position] = true;
        positions[String(notes[index]._id)] = position;
    }

    return positions;
}
