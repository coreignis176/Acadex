# Acadex (Terminal) — sirf C aur C++

Website wala Acadex ka **terminal version**: ek chhota notes app.
Student notes upload karta hai aur padhta hai, admin students aur subjects sambhalta hai.
Koi browser nahi, koi database nahi — data `data/` folder ki `.txt` files mein save hota hai.

## Build aur run

```
build.bat      <- sab compile karke bin\acadex.exe banata hai
run.bat        <- program chalata hai (hamesha isi se chalao)
```

Compiler: MinGW gcc / g++ 6.3.0 (C++14).

Pehli baar: `admin` / `admin123` se login karo, students aur subjects add karo.
Student ka login id aur password dono = **section-class roll no** (jaise `ML1-5`).
Section mein letters aur numbers dono chal sakte hain (`ML1` , `DS1`) , pehla letter hona chahiye.
Beech ka `-` isliye hai taaki ID clash na ho : `ML1` + roll 15 = `ML1-15` , `ML11` + roll 5 = `ML11-5`.

## Menus

| Student | Admin |
|---|---|
| 1. Upload note | 1. Add student |
| 2. View all notes | 2. Remove student |
| 3. Read a note (n / p / q) | 3. View students |
| 4. Add note to Read Later | 4. Add subject |
| 5. Read next from Read Later | 5. View subjects |
| 6. Delete my note | 6. Delete any note |
| 7. Undo last delete | 7. Undo last delete |
| 8. Logout | 8. Logout |

## DSA in C (`c/` folder)

| Data structure | File | Kahan use hua |
|---|---|---|
| Array | `Subject.c` | Subjects ki list (`char subjects[20][50]`) , linear search |
| Singly linked list | `Note.c` | Saare notes — insert end , traverse , search , delete |
| Doubly linked list | `Note.c` | Ek note ke pages — next / previous page |
| Stack | `Stack.c` | Undo last delete (LIFO) — push = insert front , pop = delete start |
| Queue | `Queue.c` | Read Later (FIFO) — enqueue at rear , dequeue from front |

## OOP in C++ (`cpp/` folder)

| Topic | Kahan |
|---|---|
| Encapsulation | `User` ka `private` password , sirf `checkPassword()` se check |
| Abstraction | `User` abstract class (`getRole() = 0` , `showMenu() = 0` ...) |
| Inheritance | `User` -> `Student` , `Admin` ; undo wale functions `User` mein ek baar likhe , dono use karte hain |
| Polymorphism | `user->showMenu()` , `users[i]->showDetails()` , `users[i]->saveToFile()` |
| Vector | `vector<User*> users` — add (`push_back`) , remove (`erase`) |
| File handling | `FileManager` class — `ofstream` se save , `ifstream` se load |
| Destructor | `~Student()` Read Later queue ki memory free karta hai |

## Folders

```
Acadex_Terminal/
  c/          C files + unki .h files (DSA)
                Subject.c  Note.c  Stack.c  Queue.c
  cpp/        C++ files (OOP)
                main.cpp  User.h  FileManager.h
  data/       students.txt  subjects.txt  notes.txt  (program khud banata hai)
  build.bat   compile
  run.bat     run
```

## C function ko C++ se call karna

C aur C++ function ke naam `.o` file mein alag tarike se save karte hain (C++ naam badal deta hai = name mangling).
Isliye `cpp/User.h` mein C headers ko **ek hi jagah** `extern "C"` ke andar include kiya hai:

```cpp
extern "C" {
    # include "Subject.h"
    # include "Note.h"
    # include "Stack.h"
    # include "Queue.h"
}
```

C ki `.h` files bilkul normal C headers hain — unme kuch extra nahi likha.

## Rules

- Student sirf **apna** note delete kar sakta hai , admin **koi bhi**.
- Undo sirf usi login ke deletes ka hota hai. Logout pe stack ke notes hamesha ke liye delete.
- Read Later har student ka apna hai , aur save nahi hota (program band = list khaali).
- Student remove karne pe uske notes rehte hain.
- Data har logout pe save hota hai.
