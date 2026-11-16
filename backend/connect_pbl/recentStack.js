import { runProgram } from "./runProgram.js";

export const MAX_HISTORY = 10;

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

const readAnswer = (output) =>{
    const lines = output.split(/\r?\n/).map((line) => line.trim());

    const count = Number(lines[0]);
    if(!Number.isInteger(count) || count < 0 || count > MAX_HISTORY || lines.length !== count + 1){
        return null;
    }

    const ids = lines.slice(1);

    if(new Set(ids).size !== ids.length){
        return null;
    }

    return ids;
}

export const stackPush = async(ids , newId) =>{

    const useJavaScriptInstead = (reason) =>{
        console.log("recent_stack (C) push " + reason + " -> JavaScript updated the history instead.");
        const history = ids.filter((id) => id !== newId);
        while(history.length >= MAX_HISTORY){
            history.shift();
        }
        history.push(newId);
        return history;
    }

    const result = await runProgram("recent_stack_c" , makeInput("push" , ids , newId));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    const history = readAnswer(result.output);

    const isGoodAnswer = history !== null
        && history[history.length - 1] === newId
        && history.every((id) => id === newId || ids.includes(id));

    if(!isGoodAnswer){
        return useJavaScriptInstead("gave a strange answer: " + result.output);
    }

    return history;
}

export const stackShow = async(ids) =>{

    const useJavaScriptInstead = (reason) =>{
        console.log("recent_stack (C) show " + reason + " -> JavaScript read the history instead.");
        return ids.slice().reverse();
    }

    if(ids.length === 0){
        return [];
    }

    const result = await runProgram("recent_stack_c" , makeInput("show" , ids));
    if(!result.ok){
        return useJavaScriptInstead("did not work. Reason: " + result.error);
    }

    const history = readAnswer(result.output);

    const isGoodAnswer = history !== null
        && history.length === ids.length
        && history.every((id) => ids.includes(id));

    if(!isGoodAnswer){
        return useJavaScriptInstead("gave a strange answer: " + result.output);
    }

    return history;
}

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
