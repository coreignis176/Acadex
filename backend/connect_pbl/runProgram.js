import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const thisFolder = path.dirname(fileURLToPath(import.meta.url));

const binFolder = path.join(thisFolder , ".." , ".." , "connect_pbl" , "bin");

const WAIT_LIMIT = 5000;

const findProgram = (name) =>{
    let fileName = name;
    if(process.platform === "win32"){
        fileName = name + ".exe";
    }
    return path.join(binFolder , fileName);
}

export const runProgram = (name , input) =>{
    return new Promise((resolve) =>{

        const programPath = findProgram(name);

        if(!fs.existsSync(programPath)){
            resolve({ok:false , error:`Program "${name}" not found. Run connect_pbl/compile.bat first.`});
            return;
        }

        const child = execFile(programPath , [] , {timeout:WAIT_LIMIT , windowsHide:true} , (error , stdout , stderr) =>{

            if(error){
                console.log("C / C++ program problem:" , name , error.message);
                if(error.killed){
                    resolve({ok:false , error:`Program "${name}" took too long and was stopped.`});
                }
                else{
                    resolve({ok:false , error:`Program "${name}" did not finish correctly. ${stderr}`.trim()});
                }
                return;
            }

            resolve({ok:true , output:stdout.trim()});
        });

        child.stdin.on("error" , () =>{});

        child.stdin.write(`${input}` + "\n");

        child.stdin.end();
    });
}
