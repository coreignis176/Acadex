# connect_pbl — website ko C aur C++ se kaise joda hai

## Sabse pehle: problem kya thi?

JavaScript, C aur C++ teen alag languages hain.
`.js` file ke andar C ka code **nahi** likh sakte. Browser C ka code **nahi** chala sakta.

## Toh joda kaise?

Jab tum terminal mein koi C program chalaate ho:

```
tum keyboard se type karte ho   ->  program scanf / cin se padhta hai
program printf / cout karta hai  ->  tum screen pe dekhte ho
```

Ab **tumhari jagah backend (Node.js)** yeh kaam karta hai:

```
backend text bhejta hai         ->  program scanf / cin se padhta hai
program printf / cout karta hai  ->  backend woh padh leta hai
```

Bas. C / C++ program bilkul normal program hai (`main()` wala). Usko pata bhi nahi ki keyboard ki jagah backend baat kar raha hai.

## Poora raasta (example: All Notes page)

```
  FRONTEND (browser)                 BACKEND (Node.js)                       C PROGRAM
  AllNotes.jsx                       controllers/notesController.js          connect_pbl/bin/notes_sort_c.exe
  store/Api/Api.jsx (Redux)          connect_pbl/runProgram.js

  useGetnotesQuery  -- GET ------->  /notes/getnotes?sort=liked&subject=DBMS
                                     MongoDB se notes laaye
                                     runProgram("notes_sort_c" , input) -->  fgets padhta hai
                                                                              filter + bubble sort
                                     order mil gaya   <---- "1 3" -------    printf karta hai
  notes mil gaye    <--- JSON -----  notes us order mein lagaye
```

- Browser seedha C se baat **nahi** karta. Hamesha beech mein backend hota hai.
- Frontend **koi alag "C wala" request nahi bhejta**. Woh apni normal Redux API (`useGetnotesQuery`) hi chalata hai.
  Backend ka controller khud `runProgram` se C chalata hai.

## Kaunsi file kya karti hai

| File | Kaam |
|---|---|
| `connect_pbl/c/` | C programs yahan likhne hain (`.c` files) |
| `connect_pbl/cpp/` | C++ programs yahan likhne hain (`.cpp` files) |
| `connect_pbl/compile.bat` | Sab `.c` / `.cpp` ko `.exe` mein badalta hai (compile) aur `bin/` mein rakhta hai |
| `connect_pbl/bin/` | Bani hui `.exe` files (backend inhi ko chalaata hai) |
| `backend/connect_pbl/runProgram.js` | **Asli pul (bridge):** `.exe` chalaata hai, usko text bhejta hai, uska output wapas laata hai |

## Abhi kya bana hai?

| C program | Kya karta hai | Kahan juda hai |
|---|---|---|
| `c/notes_sort.c` | All Notes: subject filter (linear search) + Newest / Most Liked (bubble sort) | `backend/controllers/notesController.js` → `getnotes` |
| `c/notes_queue.c` | Pending notes ki line (strict FIFO queue): `line` (poori line), `front` (sirf front wala review ho sakta hai), `position` (student ko "#3 in line") | `backend/connect_pbl/notesQueue.js` → `crController.js` (`getsectionnotes` , `reviewnote`) aur `notesController.js` (`getmysubmissions`) |
| `c/recent_stack.c` | Recently Viewed history (stack LIFO , **linked list** se bana , limit 10): `push` (note khola → top pe , duplicate aur bottom TEMP STACK se hatate hain), `show` (top se bottom), `clear` | `backend/connect_pbl/recentStack.js` → `notesController.js` (`viewnote` , `getrecent` , `clearrecent`). Frontend: student ka **Recently Viewed** page (`/student/history`) + All Notes pe note kholna |
| `cpp/validation.cpp` | **C++ (OOP)** form checking , 5 forms: `student` , `students` (CSV) , `password` , `subject` , `note`. Abstract class `Rule` (7 child rules) aur abstract class `Form` (5 child forms) ; `Field` ke paas `vector<Rule*>` | `backend/connect_pbl/validation.js` → `adminController.js` (`addstudent` , `updatestudent` , `addsection` , `addsubject` , `updatesubject`) , `UserController.js` (`changepassword`) , `notesController.js` (`submitnote`) |
| `c/connection_test.c` , `cpp/connection_test.cpp` | Sirf test: jo milta hai wahi wapas bolta hai (`hello` → `C program got: hello`) | Kahin nahi, sirf terminal mein check karne ke liye |

## Khud check kaise karein

1. `connect_pbl/compile.bat` pe double click karo  → `bin/` mein `.exe` ban jaayengi
2. Terminal mein program khud chala ke dekho:
   ```
   cd R:\Acadex\connect_pbl
   bin\connection_test_c.exe
   ```
   `hello` type karo, Enter dabao → `C program got: hello`
3. `notes_sort` ko terminal mein:
   ```
   bin\notes_sort_c.exe
   ```
   yeh lines type karo (har line ke baad Enter):
   ```
   liked
   all
   2
   0 1700000500 3 DBMS
   1 1700000900 7 DBMS
   ```
   Jawab: `1 0`  (7 likes wala pehle)
4. `notes_queue` ko terminal mein:
   ```
   bin\notes_queue_c.exe
   ```
   yeh lines type karo:
   ```
   position
   3
   0 0
   1 1
   2 0
   ```
   Jawab: `1 2`  (mera note index 1, line mein #2 pe)
5. Website pe: All Notes kholo, subject chip / Most Liked dabao. CR ka Approvals page aur student ka Upload Notes page kholo.
   Backend ka console dekho: `notes_sort (C) ...` , `notes_queue (C) ...` , `recent_stack (C) ...` ya `validation (C++) ... JavaScript ... instead` wali line **nahi** aayi → C / C++ ne hi kaam kiya.
6. Recently Viewed (stack) ke liye: All Notes pe 2-3 notes kholo → sidebar mein **Recently Viewed** → jo last khola woh sabse upar ("Continue reading").
7. C++ ke liye: admin se galat naam wala student add karo (jaise `R`) , ya student ka password `abcdefgh` rakhne ki koshish karo → error message C++ se aata hai.

## Naya C / C++ program kaise jodenge (baad mein)

1. `c/` ya `cpp/` mein file likho, jaise `c/notes_queue.c`
2. `compile.bat` chalao → `bin/notes_queue_c.exe` ban jaayegi
   (naam ka rule: C ke liye `naam_c.exe`, C++ ke liye `naam_cpp.exe`)
3. Terminal mein `.exe` chala ke test karo
4. Jis backend controller ko us feature ki zaroorat hai (jaise `crController.js`), wahan:
   ```js
   import { runProgram } from "../connect_pbl/runProgram.js";
   const result = await runProgram("notes_queue_c" , input);
   // result = {ok:true , output:"..."}  ya  {ok:false , error:"..."}
   ```
   Naya route / naya frontend function **nahi** chahiye agar feature kisi purane page ka hi hai.

## Yaad rakhna

- `.c` / `.cpp` badla? → **`compile.bat` dobara chalao**, warna purani `.exe` hi chalegi.
- `.exe` nahi mili → backend crash **nahi** hota, bas message deta hai: *"Run connect_pbl/compile.bat first."*
- Program 5 second se zyada atka → backend usko band kar deta hai, website nahi atakti.
- `.exe` sirf Windows pe chalti hai. Linux server pe host karoge toh wahan dobara compile karna padega.
