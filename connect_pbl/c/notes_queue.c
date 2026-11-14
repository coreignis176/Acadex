/*
============================================================
 notes_queue.c
============================================================

 WHAT THIS PROGRAM DOES
 ----------------------
 A student uploads notes  ->  the notes are "pending"
 ->  the CR of the section approves or rejects them.

 RULE:  the note that was sent FIRST is reviewed FIRST.
        (First In First Out = FIFO = a QUEUE)

     Sent:   Rahul (10:00) -> Priya (10:05) -> Aman (10:20)

     FRONT ->  [ Rahul ] [ Priya ] [ Aman ]  <- REAR

     CR reviews Rahul's note    -> DEQUEUE -> now Priya is at the front
     Neha sends a note (10:30)  -> ENQUEUE -> she stands behind Aman

 STRICT QUEUE: the CR can review ONLY the note at the FRONT.
 Nobody can jump the line. So it is fair for every student.


 WHERE IT IS USED  (connected to the backend)
 -------------------------------------------
     CR Approvals page    ->  show the whole line            (job: line)      crController.js     getsectionnotes
     CR approve / reject  ->  is this note at the front?     (job: front)     crController.js     reviewnote
     Student Upload page  ->  "Your notes are #3 in line"    (job: position)  notesController.js  getmysubmissions

     The backend runs this program through:  backend/connect_pbl/notesQueue.js
     (it makes the input, runs the .exe, checks the answer)


 DSA USED IN THIS FILE
 ---------------------
     Queue (FIFO), made with an array, and these functions:

     | Function   | What it does                         | Used for                     |
     |------------|--------------------------------------|------------------------------|
     | enqueue    | add a note at the REAR (back)        | every note we read           |
     | dequeue    | take out the note at the FRONT       | line , position              |
     | peek       | look at the FRONT note (no removing) | front                        |
     | isEmpty    | is the line empty?                   | stop the loops               |
     | isFull     | is the array full?                   | stop too many notes          |
     | size       | how many notes are in the line       | line                         |


 HOW THE QUEUE WORKS  (front and rear)
 -------------------------------------
     front = position of the FIRST note in the line
     rear  = position of the LAST note in the line

     Start (empty)     :  front = 0 , rear = -1          (front > rear -> EMPTY)

     enqueue(Rahul)    :  rear = 0     queue[0] = Rahul
     enqueue(Priya)    :  rear = 1     queue[1] = Priya
     enqueue(Aman)     :  rear = 2     queue[2] = Aman

                          index:   0       1       2
                          queue: [Rahul] [Priya] [Aman]
                                   ^front          ^rear       size = rear - front + 1 = 3

     dequeue()         :  gives Rahul , front = 1

                          queue: [Rahul] [Priya] [Aman]
                                           ^front  ^rear       size = 2 - 1 + 1 = 2

 Why a SIMPLE queue and not a CIRCULAR queue?
     In a simple queue, the places before "front" are never used again.
     That is a problem only if the program runs for a long time.
     Our program starts fresh for EVERY request and ends after one job,
     so a simple queue is enough.


 WHY THE PROGRAM DOES NOT GET THE TIME
 -------------------------------------
 The backend sends the notes in the order they were SENT (oldest first).
 We ENQUEUE them in that same order. That is all a queue needs:
 it only remembers WHO CAME FIRST. It never compares times.
 (If C compared the times itself, that would be SORTING, not a queue.)


 WHAT THE PROGRAM GETS  (INPUT - the backend types it, like a keyboard)
 ----------------------------------------------------------------------
     line 1   = the job:   line   or   front   or   position
     line 2   = how many pending notes there are
     next     = one line for every note, OLDEST FIRST:   index  mine

         index = 0 , 1 , 2 ...  the note's number in the backend's list
         mine  = 1  -> this note belongs to the student who is looking
                 0  -> it belongs to someone else
                 (only the job "position" uses it)


 WHAT THE PROGRAM GIVES BACK  (OUTPUT)
 -------------------------------------
     line      ->  line 1 = size of the line
                   line 2 = the indexes from FRONT to REAR
     front     ->  the index of the note at the front  (-1 if the line is empty)
     position  ->  for every note with mine = 1, one line:   index  position
                   (position 1 = at the front)

     If the input is wrong, the program writes an error message
     (on stderr) and stops with  return 1.


 EXAMPLE  (the same 4 notes in all three jobs; notes 2 and 3 are "mine")
 ----------------------------------------------------------------------
     input after the job line:          4
                                        0 0
                                        1 0
                                        2 1
                                        3 1

     | job       | OUTPUT     | why                                         |
     |-----------|------------|---------------------------------------------|
     | line      | 4          | 4 notes are waiting                         |
     |           | 0 1 2 3    | front to rear                               |
     | front     | 0          | note 0 was sent first                       |
     | position  | 2 3        | my note 2 is #3 in line                     |
     |           | 3 4        | my note 3 is #4 in line                     |


 HOW TO TEST IT IN THE TERMINAL
 ------------------------------
     1. double click  connect_pbl/compile.bat   ->  makes  bin/notes_queue_c.exe
     2. open a terminal:
            cd R:\Acadex\connect_pbl
            bin\notes_queue_c.exe
     3. type the input (like the example above), pressing Enter after each line
============================================================
*/


# include <stdio.h>
# include <string.h>




// ---------- SIZES ----------
# define MAX_NOTES 1000              // the most notes the line can have
# define MAX_LINE_LENGTH 100         // the most letters one input line can have




// ONE pending note. We keep only what the queue needs.
struct Note{
    int index;          // the note's number in the backend's list
    int mine;           // 1 = this note belongs to the student who is looking , 0 = not
};




// ================= THE QUEUE =================
// an array + two numbers: front and rear

struct Note queue[MAX_NOTES];

int front = 0;          // position of the FIRST note in the line
int rear = -1;          // position of the LAST note in the line  (-1 = nobody yet)




//$ is the line empty?
// gives back 1 for yes , 0 for no
int isEmpty(){

    if(front > rear){
        return 1;
    }

    return 0;
}




//$ is the array full?  (no place left at the back)
// gives back 1 for yes , 0 for no
int isFull(){

    if(rear == MAX_NOTES - 1){
        return 1;
    }

    return 0;
}




//$ how many notes are in the line?
int size(){

    return rear - front + 1;
}




//$ ENQUEUE - add a note at the BACK (rear) of the line
// gives back 1 if it was added , 0 if the queue was full
int enqueue(struct Note newNote){

    if(isFull() == 1){
        return 0;
    }

    rear = rear + 1;            // one more place at the back
    queue[rear] = newNote;      // put the note there

    return 1;
}




//$ DEQUEUE - take out the note at the FRONT of the line
// call it ONLY when the line is not empty (check isEmpty first)
struct Note dequeue(){

    struct Note firstNote = queue[front];       // the note at the front

    front = front + 1;                          // the next note is now the front

    return firstNote;
}




//$ PEEK - look at the note at the FRONT (it stays in the line)
// call it ONLY when the line is not empty (check isEmpty first)
struct Note peek(){

    return queue[front];
}




// ================= READING THE INPUT =================


//$ removes the Enter key (and extra spaces) from the end of a line
// fgets() keeps the Enter key ('\n') at the end of the line.
// Windows can also add '\r' before it.
// We remove them, so "line\n" becomes "line".
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




// ================= THE THREE JOBS =================


//$ job "line" - print the size, then every note from FRONT to REAR
// we DEQUEUE the notes one by one: they come out in the line's order
// example output:
//      4
//      0 1 2 3
void showLine(){

    int printedCount = 0;

    printf("%d\n" , size());

    while(isEmpty() == 0){

        struct Note note = dequeue();

        // put a space BETWEEN numbers (not before the first one)
        if(printedCount > 0){
            printf(" ");
        }

        printf("%d" , note.index);
        printedCount = printedCount + 1;
    }

    printf("\n");
}




//$ job "front" - print the index of the note at the FRONT
// -1 means the line is empty
// example output:   0
void showFront(){

    struct Note firstNote;

    if(isEmpty() == 1){
        printf("-1\n");
        return;
    }

    firstNote = peek();
    printf("%d\n" , firstNote.index);
}




//$ job "position" - where are MY notes in the line?
// we DEQUEUE the notes one by one and count:
//      the 1st note out is #1 , the 2nd is #2 ...
// when a note is mine (mine = 1) we print:   index  position
// example output:
//      2 3
//      3 4
void showMyPositions(){

    int position = 0;

    while(isEmpty() == 0){

        struct Note note = dequeue();

        position = position + 1;            // this note's place in the line

        if(note.mine == 1){
            printf("%d %d\n" , note.index , position);
        }
    }
}




int main(){

    char line[MAX_LINE_LENGTH];

    char chosenJob[MAX_LINE_LENGTH];        // line / front / position

    int noteCount = 0;
    int noteNumber;




    // ---------- STEP 1: read the job ----------
    if(readOneLine(chosenJob) == 0){
        fprintf(stderr , "No job given. Send line , front or position.\n");
        return 1;
    }

    if(strcmp(chosenJob , "line") != 0 && strcmp(chosenJob , "front") != 0 && strcmp(chosenJob , "position") != 0){
        fprintf(stderr , "Unknown job \"%s\". Send line , front or position.\n" , chosenJob);
        return 1;
    }




    // ---------- STEP 2: read how many notes there are ----------
    if(readOneLine(line) == 0){
        fprintf(stderr , "Number of notes not given.\n");
        return 1;
    }

    if(sscanf(line , "%d" , &noteCount) != 1){
        fprintf(stderr , "Number of notes is not a number: \"%s\"\n" , line);
        return 1;
    }

    if(noteCount < 0 || noteCount > MAX_NOTES){
        fprintf(stderr , "Number of notes must be between 0 and %d.\n" , MAX_NOTES);
        return 1;
    }




    // ---------- STEP 3: read every note and ENQUEUE it ----------
    // the backend sends the OLDEST note first, so the oldest goes to the front
    for(noteNumber = 0 ; noteNumber < noteCount ; noteNumber++){

        struct Note newNote;

        if(readOneLine(line) == 0){
            fprintf(stderr , "Expected %d notes, but got only %d.\n" , noteCount , noteNumber);
            return 1;
        }

        // read the 2 parts of the line:   index  mine
        if(sscanf(line , "%d %d" , &newNote.index , &newNote.mine) != 2){
            fprintf(stderr , "Note line %d is wrong: \"%s\"\n" , noteNumber + 1 , line);
            return 1;
        }

        if(newNote.mine != 0 && newNote.mine != 1){
            fprintf(stderr , "Note line %d: mine must be 0 or 1: \"%s\"\n" , noteNumber + 1 , line);
            return 1;
        }

        if(enqueue(newNote) == 0){
            fprintf(stderr , "The queue is full (more than %d notes).\n" , MAX_NOTES);
            return 1;
        }
    }




    // ---------- STEP 4: do the job ----------
    if(strcmp(chosenJob , "line") == 0){
        showLine();
    }
    else if(strcmp(chosenJob , "front") == 0){
        showFront();
    }
    else if(strcmp(chosenJob , "position") == 0){
        showMyPositions();
    }


    return 0;
}
