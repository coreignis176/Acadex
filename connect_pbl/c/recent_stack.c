/*
============================================================
 recent_stack.c
============================================================

 WHAT THIS PROGRAM DOES
 ----------------------
 Every note a student opens goes to the TOP of their history,
 like a browser history. The note opened LAST is shown FIRST.
 (Last In First Out = LIFO = a STACK)

     Opened:   Trees -> DBMS -> Stack basics

     BOTTOM ->  [ Trees ] [ DBMS ] [ Stack basics ]  <- TOP

     History page shows (top to bottom):   Stack basics , DBMS , Trees

     DBMS opened again   -> take it out from the middle -> PUSH it on top
     BOTTOM ->  [ Trees ] [ Stack basics ] [ DBMS ]  <- TOP

     More than 10 notes  -> the oldest one (BOTTOM) is thrown away


 WHERE IT IS USED  (connected through backend/connect_pbl/recentStack.js)
 -----------------------------------------------------------------------
     Student opens a note on All Notes   ->  put it on top        (job: push)   notesController.js  viewnote
     Recently Viewed page (/student/history) -> top to bottom     (job: show)   notesController.js  getrecent
     "Clear history" button              ->  empty the stack      (job: clear)  notesController.js  clearrecent

     The history is saved in MongoDB (User.recentNotes , bottom to top),
     because this program starts fresh for every request.


 DSA USED IN THIS FILE
 ---------------------
     STACK (LIFO) made with a SINGLY LINKED LIST.
     Head = the TOP of the stack.

     | Function     | Linked list work             | Used for                          |
     |--------------|------------------------------|-----------------------------------|
     | push         | insert at front (malloc)     | build the stack , new note on top |
     | pop          | delete from front (free)     | remove duplicate / bottom         |
     | peek         | read Head->id                | "Continue reading" (top note)     |
     | isEmpty      | Head == NULL                 | stop the loops                    |
     | isFull       | returnSize() == 10           | limit of the history              |
     | returnSize   | traverse and count           | isFull , output                   |
     | isInStack    | traverse and search          | check the input                   |
     | clear        | pop till empty               | "Clear history" , free memory     |


 WHY "FULL" IF IT IS A LINKED LIST?
 ----------------------------------
 An ARRAY stack becomes full when the array has no place left.
 A LINKED LIST never becomes full (it can always malloc one more node).
 So WE decide the limit: 10 nodes = full. (MAX_HISTORY)


 TWO HARD JOBS WITH ONLY PUSH AND POP  (TEMP STACK)
 --------------------------------------------------
 In a pure stack we can touch ONLY the TOP.
 But we need to remove a note from the MIDDLE (duplicate)
 and from the BOTTOM (stack full).
 We do both with a second stack (TempStack), using only push and pop.
 We never change the "next" pointers by hand.

 (a) removeId  - remove DBMS from the middle

     Main : [Trees] [DBMS] [Stack]  <- top        Temp : empty

     pop Stack -> not DBMS -> push in Temp
     Main : [Trees] [DBMS]                        Temp : [Stack]

     pop DBMS  -> FOUND -> do not push it anywhere (it is gone)
     Main : [Trees]                               Temp : [Stack]

     pop everything from Temp -> push back in Main
     Main : [Trees] [Stack]                       Temp : empty

 (b) removeBottom - remove the oldest note

     pop everything from Main -> push in Temp   (now Temp is upside down)
     Main : empty                                 Temp : [Stack] [DBMS] [Trees] <- top

     pop the top of Temp (= the BOTTOM of Main) -> throw it away (Trees)
     pop everything from Temp -> push back in Main
     Main : [DBMS] [Stack]  <- top

 (c) printBottomToTop - the same trick is used to print the stack
     from bottom to top (Head is the top, so we must flip it first)


 WHAT THE PROGRAM GETS  (INPUT - the backend types it, like a keyboard)
 ----------------------------------------------------------------------
     line 1   = the job:   push   or   show   or   clear
     line 2   = (ONLY for push) the id of the note that was opened
     next     = how many ids are in the history now  (0 to 10)
     next     = one id per line, BOTTOM FIRST  (oldest first)

     id = MongoDB note id (24 letters and numbers)
          for testing in the terminal short names like DBMS also work


 WHAT THE PROGRAM GIVES BACK  (OUTPUT)
 -------------------------------------
     push   ->  line 1 = how many ids are in the NEW stack
                next   = the ids BOTTOM to TOP   (the backend saves this order)
     show   ->  line 1 = how many ids
                next   = the ids TOP to BOTTOM   (the page shows this order ,
                                                  the first one = "Continue reading")
     clear  ->  0

     If the input is wrong, the program writes an error message
     (on stderr) and stops with  return 1.


 EXAMPLE  (history = Trees , DBMS , Stack   bottom to top)
 ---------------------------------------------------------
     | job        | INPUT            | OUTPUT     | why                       |
     |------------|------------------|------------|---------------------------|
     | push DBMS  | push             | 3          | DBMS was in the middle ,  |
     |            | DBMS             | Trees      | now it is on top          |
     |            | 3                | Stack      |                           |
     |            | Trees            | DBMS       |                           |
     |            | DBMS             |            |                           |
     |            | Stack            |            |                           |
     | show       | show             | 3          | top to bottom             |
     |            | 3                | Stack      |                           |
     |            | Trees            | DBMS       |                           |
     |            | DBMS             | Trees      |                           |
     |            | Stack            |            |                           |
     | clear      | clear , 3 , ...  | 0          | stack is empty now        |


 HOW TO TEST IT IN THE TERMINAL
 ------------------------------
     1. double click  connect_pbl/compile.bat   ->  makes  bin/recent_stack_c.exe
     2. open a terminal:
            cd R:\Acadex\connect_pbl
            bin\recent_stack_c.exe
     3. type the input (like the example above), pressing Enter after each line
============================================================
*/


# include <stdio.h>
# include <stdlib.h>
# include <string.h>
# include <ctype.h>




// ---------- SIZES ----------
# define MAX_HISTORY 10              // the most notes the history can have
# define ID_LENGTH 25                // MongoDB id = 24 letters + '\0'
# define MAX_LINE_LENGTH 100         // the most letters one input line can have




//? making the structure of the Node of the Linked List
//? one node = one note in the history
struct Node{
    char id[ID_LENGTH];
    struct Node *next;
};


//? typedef the structure of the Node
typedef struct Node ND;




// ================= THE STACK (linked list , Head = TOP) =================


//? function to return the size of the linked list
int returnSize(ND** Head){

    if(*Head == NULL){
        return 0;
    }

    int siz = 0;
    ND* Temp = *Head;

    while(Temp != NULL){
        siz++;
        Temp = Temp->next;
    }


    return siz;
}




//? function to check if the stack is empty
// gives back 1 for yes , 0 for no
int isEmpty(ND** Head){

    if(*Head == NULL){
        return 1;
    }

    return 0;
}




//? function to check if the stack is full (MAX_HISTORY nodes)
// gives back 1 for yes , 0 for no
int isFull(ND** Head){

    if(returnSize(Head) >= MAX_HISTORY){
        return 1;
    }

    return 0;
}




//? function to PUSH an id on the TOP of the stack (insert at the front)
// gives back 1 if it was pushed , 0 if there was no memory
int push(ND** Head , const char id[]){

    ND* Temp = (ND*)malloc(sizeof(ND));

    if(Temp == NULL){
        fprintf(stderr , "Error to get memory in heap!!\n");     // stderr , because stdout goes to the backend
        return 0;
    }

    strcpy(Temp->id , id);

    if(*Head == NULL){
        *Head = Temp;
        (*Head)->next = NULL;
    }
    else{
        Temp->next = *Head;
        *Head = Temp;
    }


    return 1;
}




//? function to POP the id on the TOP of the stack (delete from the front)
// the id is copied into  id  , then the node is freed
// gives back 1 if it was popped , 0 if the stack was empty
int pop(ND** Head , char id[]){

    if(*Head == NULL){
        return 0;
    }

    ND* Temp = *Head;

    strcpy(id , Temp->id);

    *Head = Temp->next;
    free(Temp);


    return 1;
}




//? function to PEEK at the id on the TOP (it stays in the stack)
// gives back NULL if the stack is empty
const char* peek(ND** Head){

    if(*Head == NULL){
        return NULL;
    }

    return (*Head)->id;
}




//? function to check if an id is already in the stack (traverse + search)
// gives back 1 for yes , 0 for no
int isInStack(ND** Head , const char id[]){

    ND* Temp = *Head;

    while(Temp != NULL){

        if(strcmp(Temp->id , id) == 0){
            return 1;
        }

        Temp = Temp->next;
    }


    return 0;
}




//? function to CLEAR the stack (pop till it is empty , every node is freed)
void clear(ND** Head){

    char id[ID_LENGTH];

    while(pop(Head , id) == 1){
        // nothing to do , pop() already freed the node
    }
}




// ================= THE TEMP STACK JOBS (only push and pop) =================


//$ remove ONE id from anywhere in the stack (see (a) at the top of the file)
// gives back 1 if it was found and removed , 0 if it was not there , -1 if no memory
int removeId(ND** Head , const char id[]){

    ND* TempStack = NULL;
    char topId[ID_LENGTH];
    int found = 0;

    // 1. pop from main till we find the id
    while(pop(Head , topId) == 1){

        if(strcmp(topId , id) == 0){
            found = 1;
            break;                              // do not push it anywhere -> it is gone
        }

        if(push(&TempStack , topId) == 0){
            clear(&TempStack);
            return -1;
        }
    }

    // 2. pop everything from temp and push it back in main (same order as before)
    while(pop(&TempStack , topId) == 1){

        if(push(Head , topId) == 0){
            clear(&TempStack);
            return -1;
        }
    }


    return found;
}




//$ remove the BOTTOM id (the oldest note) (see (b) at the top of the file)
// gives back 1 if it worked , 0 if no memory
int removeBottom(ND** Head){

    ND* TempStack = NULL;
    char topId[ID_LENGTH];

    // 1. pop everything from main into temp -> temp is upside down
    while(pop(Head , topId) == 1){

        if(push(&TempStack , topId) == 0){
            clear(&TempStack);
            return 0;
        }
    }

    // 2. the top of temp = the bottom of main -> throw it away
    pop(&TempStack , topId);

    // 3. pop the rest from temp and push it back in main
    while(pop(&TempStack , topId) == 1){

        if(push(Head , topId) == 0){
            clear(&TempStack);
            return 0;
        }
    }


    return 1;
}




// ================= PRINTING =================


//$ print the size , then the ids from BOTTOM to TOP (see (c) at the top of the file)
// Head is the TOP , so we flip the stack into temp first:
// then the top of temp = the bottom of main
// gives back 1 if it worked , 0 if no memory
int printBottomToTop(ND** Head){

    ND* TempStack = NULL;
    char topId[ID_LENGTH];

    printf("%d\n" , returnSize(Head));

    // 1. flip: main -> temp
    while(pop(Head , topId) == 1){

        if(push(&TempStack , topId) == 0){
            clear(&TempStack);
            return 0;
        }
    }

    // 2. flip back: temp -> main , and print every id on the way
    while(pop(&TempStack , topId) == 1){

        printf("%s\n" , topId);

        if(push(Head , topId) == 0){
            clear(&TempStack);
            return 0;
        }
    }


    return 1;
}




//$ print the size , then the ids from TOP to BOTTOM
// the first id = peek() = "Continue reading" on the History page
void printTopToBottom(ND** Head){

    printf("%d\n" , returnSize(Head));

    if(isEmpty(Head) == 1){
        return;
    }

    printf("%s\n" , peek(Head));            // the TOP note

    ND* Temp = (*Head)->next;               // the rest , top to bottom

    while(Temp != NULL){
        printf("%s\n" , Temp->id);
        Temp = Temp->next;
    }
}




// ================= READING THE INPUT =================


//$ removes the Enter key (and extra spaces) from the end of a line
// fgets() keeps the Enter key ('\n') at the end of the line.
// Windows can also add '\r' before it.
// We remove them, so "push\n" becomes "push".
void removeEnterFromEnd(char text[]){

    int length = strlen(text);

    while(length > 0){

        char lastLetter = text[length - 1];

        if(lastLetter == '\n' || lastLetter == '\r' || lastLetter == ' '){
            text[length - 1] = '\0';        // cut the last letter
            length = length - 1;
        }
        else{
            break;                          // last letter is a normal letter -> stop
        }
    }
}




//$ reads ONE line from the input into  line
// gives back 1 if a line was read
// gives back 0 if there was nothing more to read
int readOneLine(char line[]){

    if(fgets(line , MAX_LINE_LENGTH , stdin) == NULL){
        return 0;
    }

    removeEnterFromEnd(line);

    return 1;
}




//$ is this a good note id?
// 1 to 24 letters , only letters and numbers (a MongoDB id is 24 of them)
// gives back 1 for yes , 0 for no
int isValidId(const char text[]){

    int length = strlen(text);

    if(length < 1 || length > ID_LENGTH - 1){
        return 0;
    }

    for(int i = 0 ; i < length ; i++){

        if(!isalnum((unsigned char)text[i])){
            return 0;
        }
    }


    return 1;
}




int main(){

    ND* Head = NULL;                        //? the history stack (Head = TOP)

    char line[MAX_LINE_LENGTH];

    char chosenJob[MAX_LINE_LENGTH];        // push / show / clear
    char newId[MAX_LINE_LENGTH];            // only for push

    int idCount = 0;
    int idNumber;




    // ---------- STEP 1: read the job ----------
    if(readOneLine(chosenJob) == 0){
        fprintf(stderr , "No job given. Send push , show or clear.\n");
        return 1;
    }

    if(strcmp(chosenJob , "push") != 0 && strcmp(chosenJob , "show") != 0 && strcmp(chosenJob , "clear") != 0){
        fprintf(stderr , "Unknown job \"%s\". Send push , show or clear.\n" , chosenJob);
        return 1;
    }




    // ---------- STEP 2: (only push) read the id of the note that was opened ----------
    if(strcmp(chosenJob , "push") == 0){

        if(readOneLine(newId) == 0){
            fprintf(stderr , "The id of the opened note is not given.\n");
            return 1;
        }

        if(isValidId(newId) == 0){
            fprintf(stderr , "The opened note id is wrong: \"%s\"\n" , newId);
            return 1;
        }
    }




    // ---------- STEP 3: read how many ids are in the history ----------
    if(readOneLine(line) == 0){
        fprintf(stderr , "Number of ids not given.\n");
        return 1;
    }

    if(sscanf(line , "%d" , &idCount) != 1){
        fprintf(stderr , "Number of ids is not a number: \"%s\"\n" , line);
        return 1;
    }

    if(idCount < 0 || idCount > MAX_HISTORY){
        fprintf(stderr , "Number of ids must be between 0 and %d.\n" , MAX_HISTORY);
        return 1;
    }




    // ---------- STEP 4: read every id and PUSH it (bottom first) -> the stack is built ----------
    for(idNumber = 0 ; idNumber < idCount ; idNumber++){

        if(readOneLine(line) == 0){
            fprintf(stderr , "Expected %d ids, but got only %d.\n" , idCount , idNumber);
            clear(&Head);
            return 1;
        }

        if(isValidId(line) == 0){
            fprintf(stderr , "Id line %d is wrong: \"%s\"\n" , idNumber + 1 , line);
            clear(&Head);
            return 1;
        }

        if(isInStack(&Head , line) == 1){
            fprintf(stderr , "Id line %d is a duplicate: \"%s\"\n" , idNumber + 1 , line);
            clear(&Head);
            return 1;
        }

        if(push(&Head , line) == 0){
            clear(&Head);
            return 1;
        }
    }




    // ---------- STEP 5: do the job ----------
    if(strcmp(chosenJob , "push") == 0){

        // (a) already in the history? -> take it out from the middle
        if(removeId(&Head , newId) == -1){
            clear(&Head);
            return 1;
        }

        // (b) still 10 notes? -> throw away the oldest (bottom)
        if(isFull(&Head) == 1){

            if(removeBottom(&Head) == 0){
                clear(&Head);
                return 1;
            }
        }

        // (c) the opened note goes on TOP
        if(push(&Head , newId) == 0){
            clear(&Head);
            return 1;
        }

        if(printBottomToTop(&Head) == 0){
            clear(&Head);
            return 1;
        }
    }
    else if(strcmp(chosenJob , "show") == 0){

        printTopToBottom(&Head);
    }
    else if(strcmp(chosenJob , "clear") == 0){

        clear(&Head);
        printf("0\n");
    }




    clear(&Head);                           //? free every node before the program ends

    return 0;
}
