# Acadex

A notes-sharing website for a college class. Students upload photos of their handwritten notes, the class representative (CR) approves them, and everyone in the same year can find, read, like and download them.

This is a **PBL project** for **Data Structures in C** and **Object-Oriented Programming in C++**.
The website (React + Node.js) is the outer shell. The real logic of the main features runs inside our own **C and C++ programs**, which the backend runs on every request.

---

## What the website does

| Who | What they can do |
|---|---|
| **Admin** | Create sections inside a course and year (B.Tech, BBA), register students from a CSV file, add subjects, choose CRs, reset passwords |
| **Student** | See notes from every section of their year, filter by subject, sort by Newest / Most Liked, search, like, download, upload notes, see their **Recently Viewed** notes |
| **CR** (a student chosen by the admin) | Approve or reject the notes of their section **in the order they were sent**, delete notes, see their section |

There is no sign-up page. The admin registers every student. A new student logs in with their college roll number and a default password, and must choose a new password before doing anything else. The login page has three tabs: Student, CR and Admin.

---

## Where C and C++ are used

The backend never sorts, filters or checks these things itself. It sends plain text to a C / C++ program (like typing on a keyboard), and reads back what the program prints.

### Data Structures in C

| Program | Data structure | Used on the website for |
|---|---|---|
| [`connect_pbl/c/notes_sort.c`](connect_pbl/c/notes_sort.c) | **Array, linear search, bubble sort** | **All Notes** page: subject filter, Newest first / Most Liked |
| [`connect_pbl/c/notes_queue.c`](connect_pbl/c/notes_queue.c) | **Queue (FIFO)** | **CR Approvals**: the note sent first is reviewed first (strict queue). A student sees *"your notes are #3 in line"* |
| [`connect_pbl/c/recent_stack.c`](connect_pbl/c/recent_stack.c) | **Stack (LIFO), built with a singly linked list** | **Recently Viewed** page: the note opened last is shown first, at most 10. A note opened again moves to the top. The oldest note drops off the bottom (done with a temp stack, using only push and pop) |

### Object-Oriented Programming in C++

| Program | OOP concepts | Used on the website for |
|---|---|---|
| [`connect_pbl/cpp/validation.cpp`](connect_pbl/cpp/validation.cpp) | Abstract classes, inheritance, runtime polymorphism, encapsulation, composition, constructors, virtual destructors, `vector` | Checking **5 forms**: add / edit a student, a CSV of students, change password, add / edit a subject, upload a note |

```
                      Rule  (abstract: check() = 0)
   NotEmpty  Length  HasLetter  HasDigit  AllowedLetters  NotSameAs  InList

                      Form  (abstract: readAndCheck() = 0)
   StudentForm  StudentListForm  PasswordForm  SubjectForm  NoteForm
```

A `Field` has a list of `Rule*` and calls `rule->check()` without knowing which rule it is. `main()` makes the right `Form*` and calls `form->readAndCheck()`. To add a new rule, you write one new child class and the old code does not change.

### How the website talks to C / C++

```
Browser (React)  --request-->  Backend (Node.js)  --text on stdin-->   C / C++ program (.exe)
                 <---JSON----                     <--text on stdout--
```

* [`backend/connect_pbl/runProgram.js`](backend/connect_pbl/runProgram.js) runs a program, sends it text and returns what it printed. A program that hangs is stopped after 5 seconds.
* [`notesQueue.js`](backend/connect_pbl/notesQueue.js), [`recentStack.js`](backend/connect_pbl/recentStack.js) and [`validation.js`](backend/connect_pbl/validation.js) build the input for each program and check its answer.
* **Safety net:** if a program is missing, crashes or gives a strange answer, the backend does the same job in JavaScript, so the page keeps working. The backend console then prints a line ending in `... JavaScript ... instead`. **If no such line appears, C / C++ did the work.**

A step-by-step explanation of the bridge (in Hinglish) is in [`connect_pbl/README.md`](connect_pbl/README.md).

---

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React 19, Vite 6, Redux Toolkit (RTK Query), React Router 7, Tailwind CSS 4 |
| Backend | Node.js, Express 5, Mongoose 9, JWT in an httpOnly cookie, bcrypt, Multer |
| Database | MongoDB (Atlas or local) |
| Image storage | Cloudinary (pages of the notes) |
| C / C++ | MinGW `gcc` / `g++` (C++14), compiled into `.exe` files |

---

## Folder structure

```
Acadex/
├── frontend/          React website           (see frontend/README.md)
├── backend/           Express API             (see backend/README.md for every route)
│   └── connect_pbl/   runs the C / C++ programs and checks their answers
├── connect_pbl/       our C and C++ programs
│   ├── c/             notes_sort.c , notes_queue.c , recent_stack.c
│   ├── cpp/           validation.cpp
│   ├── compile.bat    compiles everything into bin/
│   └── IDEA_*.txt     the design notes we wrote before coding each feature
└── Acadex_Terminal/   a separate terminal-only version in pure C / C++ (see its README)
```

---

## How to run it (Windows)

**You need:** Node.js 20 or newer, MinGW (`gcc` and `g++` on the PATH), a MongoDB database (for example a free MongoDB Atlas cluster), and a Cloudinary account (needed only to upload note images).

**1. Compile the C / C++ programs**

Double-click `connect_pbl\compile.bat`, or run:

```
cd connect_pbl
compile.bat
```

This creates the `.exe` files in `connect_pbl\bin\`. Run it again every time you change a `.c` or `.cpp` file.

**2. Start the backend**

```
cd backend
npm install
copy .env.example .env        (then fill in the values in .env)
npm run createadmin           (only once: creates the admin account)
npm run dev                   (http://localhost:9999 shows "api working")
```

**3. Start the frontend** (in a second terminal)

```
cd frontend
npm install
npm run dev                   (open http://localhost:5173)
```

**4. Try it**

1. Log in on the **Admin** tab, create a section, upload a CSV of students and add subjects.
2. Log in on the **Student** tab with a college roll number and the default password, then choose a new password.
3. Open a few notes on All Notes, then open **Recently Viewed** in the sidebar.
4. Make a student CR from the admin panel, confirm it from the student's notifications, then use the **CR** tab to approve notes.

Keep the backend terminal visible during a demo. It shows whether C / C++ did the work.

---

## Testing a C / C++ program on its own

Every program reads plain lines, so you can run it in a terminal and type the input yourself. The comment at the top of each file explains its input and output with examples. For example:

```
cd connect_pbl
bin\recent_stack_c.exe
push
DBMS
3
Trees
DBMS
Stack
```

Press **Ctrl+Z** and then **Enter** to finish typing. It prints `3`, `Trees`, `Stack`, `DBMS`: DBMS moved from the middle to the top of the stack.

---

## Notes

* `.env` holds the database password and the Cloudinary keys. It is listed in `.gitignore` and must never be uploaded. `.env.example` shows which keys are needed.
* The `.exe` files are not in the repository. Make them with `compile.bat`. The programs are compiled for Windows; on Linux you would compile them again with `gcc` / `g++` and drop the `.exe` ending.
