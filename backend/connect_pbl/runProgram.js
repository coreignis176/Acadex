import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";




const thisFolder = path.dirname(fileURLToPath(import.meta.url));                     //? address of this folder....


const binFolder = path.join(thisFolder , ".." , ".." , "connect_pbl" , "bin");                                 //? address of binary folder


const WAIT_LIMIT = 5000;



const findProgram = (name) =>{                                                                 //? return the path of the exe file..
    let fileName = name;
    if(process.platform === "win32"){        // "win32" = this computer is Windows
        fileName = name + ".exe";
    }
    return path.join(binFolder , fileName);
}


//$ function to run a C / C++ program, send it some text, and get back what it printed
// name  = program name without .exe   e.g. "connection_test_c"
// input = the text to send (the program reads it like keyboard typing)
//
// it always gives back an object like this:
//   {ok:true  , output:"what the program printed"}
//   {ok:false , error:"what went wrong"}
//
// it returns a Promise, so use it with await:
//   const result = await runProgram("connection_test_c" , "hello");
export const runProgram = (name , input) =>{
    return new Promise((resolve) =>{

        const programPath = findProgram(name);

   
        if(!fs.existsSync(programPath)){                                                                           //? if program file not find / bat file not runned..
            resolve({ok:false , error:`Program "${name}" not found. Run connect_pbl/compile.bat first.`});
            return;
        }


        const child = execFile(programPath , [] , {timeout:WAIT_LIMIT , windowsHide:true} , (error , stdout , stderr) =>{    //!(error , stdout , stderr) are callback functions
                                                                                                                             //! stdout receive the output...
                                                                                                                             //! stderr receive error messages...

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

            // .trim() removes the extra Enter / spaces at the start and end
            resolve({ok:true , output:stdout.trim()});
        });

        // if the program stops BEFORE it read all our typing (e.g. it found a mistake on line 1),
        // writing more gives an "EPIPE" error. Without this line that error would crash the whole backend.
        // We can ignore it here: the callback above already tells us how the program ended.
        child.stdin.on("error" , () =>{});

        // 3. "type" the input into the program, then press Enter
        //    ( `${input}` turns anything into text, even a number )
        child.stdin.write(`${input}` + "\n");

        // tell the program "no more typing" (like Ctrl+Z / Ctrl+D in the terminal)
        // without this, a program that reads till the end would wait forever
        child.stdin.end();
    });
}
