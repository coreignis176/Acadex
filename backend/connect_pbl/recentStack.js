import { runProgram } from "./runProgram.js";

// ---------------------------------------------------------------------------
// RECENTLY VIEWED notes (STACK , LIFO) - run by our C program
//
// C code   : connect_pbl/c/recent_stack.c       (stack made with a linked list)
// it runs  : connect_pbl/bin/recent_stack_c.exe (made by connect_pbl/compile.bat)
//
// RULE: the note opened LAST is shown FIRST. At most 10 notes.
//       a note opened again moves to the top , the 11th note pushes out the oldest one
//
// the history is saved in MongoDB:  User.recentNotes = [note ids]  BOTTOM to TOP
// (the C program starts fresh for every request , so it cannot remember anything itself)
//
// used by notesController.js:
//   viewnote    -> stackPush   (a student opened a note)
//   getrecent   -> stackShow   (the Recently Viewed page , top to bottom)
//   clearrecent -> stackClear  ("Clear history" button)
//
// what the C program gets (one thing per line):
//      the job              push / show / clear
//      (only push) the id of the opened note
//      how many ids are saved
//      the saved ids , BOTTOM first
//
// what it gives back:   how many ids , then the ids (push: bottom to top , show: top to bottom)
//
// if the C program does not work (no .exe , crash , too slow , strange answer)
// JavaScript does it instead, so the page still works,
// and the backend console prints why  -> check the console during the demo!
// ---------------------------------------------------------------------------


export const MAX_HISTORY = 10;          // the same limit as MAX_HISTORY in recent_stack.c


//$ function to make the input text for the C program
// job = "push" , "show" or "clear"   ,   ids = the saved history , bottom first
const makeInput = (job , ids , newId) =>{
    const lines = [job];
    if(job === "push"){
        lines.push(newId);
    }
    lines.push(String(ids.length));
    for(const id of ids){
        lines.push(id);
    }
    return lines.join("\n");
}


//$ function to read the answer of the C program:  "3" , "id" , "id" , "id"
// gives back the list of ids , or null if the answer looks wrong
const readAnswer = (output) =>{
    // Windows C programs end every line with "\r\n" -> /\r?\n/ splits on both
    const lines = output.split(/\r?\n/).map((line) => line.trim());

    const count = Number(lines[0]);
    if(!Number.isInteger(count) || count < 0 || count > MAX_HISTORY || lines.length !== count + 1){
        return null;
    }

    const ids = lines.slice(1);           // every line after the count

    // every id only once
    if(new Set(ids).size !== ids.length){
        return null;
    }

    return ids;
}




// ======================= job "push" =======================

//$ function to put the opened note on TOP of the history
// ids = saved history (bottom first) , newId = the opened note
// gives back the NEW history (bottom first) -> save it in User.recentNotes
export const stackPush = async(ids , newId) =>{

    const useJavaScriptInstead = (reason) =>{
        console.log("recent_stack (C) push " + reason + " -> JavaScript updated the history instead.");
        const history = ids.filter((id) => id !== newId);         // take it out if it is already there
        while(history.length >= MAX_HISTORY){
            history.shift();                                      // full -> remove the oldest (bottom)
        }
        history.push(newId);                                      // the opened note goes on top
        return history;
    }

    const result = await runProgram("recent_stack_c" , makeInput("push" , ids , newId));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    const history = readAnswer(result.output);

    // the answer must make sense: the new note on top , and only ids we sent
    const isGoodAnswer = history !== null
        && history[history.length - 1] === newId
        && history.every((id) => id === newId || ids.includes(id));

    if(!isGoodAnswer){
        return useJavaScriptInstead("gave a strange answer: " + result.output);
    }

    return history;
}




// ======================= job "show" =======================

//$ function to get the history from TOP to BOTTOM (the order the page shows)
// ids = saved history (bottom first)
export const stackShow = async(ids) =>{

    const useJavaScriptInstead = (reason) =>{
        console.log("recent_stack (C) show " + reason + " -> JavaScript read the history instead.");
        return ids.slice().reverse();            // bottom first -> top first
    }

    if(ids.length === 0){
        return [];
    }

    const result = await runProgram("recent_stack_c" , makeInput("show" , ids));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    const history = readAnswer(result.output);

    // every saved id must come back
    const isGoodAnswer = history !== null
        && history.length === ids.length
        && history.every((id) => ids.includes(id));

    if(!isGoodAnswer){
        return useJavaScriptInstead("gave a strange answer: " + result.output);
    }

    return history;
}




// ======================= job "clear" =======================

//$ function to empty the history
// gives back the new (empty) history
export const stackClear = async(ids) =>{

    const result = await runProgram("recent_stack_c" , makeInput("clear" , ids));

    if(!result.ok || result.output !== "0"){
        let reason = "gave a strange answer: " + result.output;
        if(!result.ok){
            reason = "did not work. Reason: " + result.error;
        }
        console.log("recent_stack (C) clear " + reason + " -> JavaScript cleared the history instead.");
    }

    return [];
}
