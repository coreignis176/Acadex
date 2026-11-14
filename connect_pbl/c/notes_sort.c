/*
============================================================
 notes_sort.c
============================================================

 WHAT THIS PROGRAM DOES
 ----------------------
 The "All Notes" page of Acadex shows notes to the students.
 The student can choose HOW to see the notes:

     SORT    (pick one)
         Newest First  ->  newest notes on top                (default)
         Most Liked    ->  notes with the most likes on top

     SUBJECT (pick one)
         All subjects  ->  every note                         (default)
         one subject   ->  only the notes of that subject, like "DBMS"

 Both work TOGETHER. Example: "DBMS" + "Most Liked"
     -> only DBMS notes, the most liked one on top.

 This C program does that work:
     first it FILTERS the notes (keeps only one subject)  -> linear search
     then  it SORTS what is left (newest / most liked)     -> bubble sort
 JavaScript and MongoDB do NOT do this work. This C program does.


 WHERE IT IS USED
 ----------------
     Page     : All Notes   ->  frontend/src/pages/student/AllNotes.jsx
     Backend  : getnotes    ->  backend/controllers/notesController.js
     Bridge   : the backend runs  connect_pbl/bin/notes_sort_c.exe
                using  backend/connect_pbl/runProgram.js


 DSA USED IN THIS FILE
 ---------------------
     Array of structures  ->  all the notes are kept in an array:  struct Note notes[]
     Linear search        ->  look at every note, one by one, to find one subject
     Bubble sort          ->  put the notes in the right order
     Stable sort          ->  two notes that are exactly equal never change places


 WHAT THE PROGRAM GETS  (INPUT - the backend types it, like a keyboard)
 ----------------------------------------------------------------------
     line 1   = how to sort:     newest   or   liked
     line 2   = which subject:   a subject name (like  DBMS)
                                 or  all   (= every subject, no filter)
     line 3   = how many notes there are
     next     = one line for every note:   index  time  likes  subject

         index   = 0 , 1 , 2 ...  the note's number in the backend's list
                   (so the backend knows which note is which)
         time    = when the note was uploaded (a big number, milliseconds)
                   bigger time = newer note
         likes   = how many likes the note has
         subject = subject name. It is LAST on the line because it can
                   have spaces in it, like "Data Structures".


 WHAT THE PROGRAM GIVES BACK  (OUTPUT)
 -------------------------------------
     ONE line: the indexes of the notes in the new order.
     The program does NOT send the whole notes back, only their numbers.
     If no note is left (no note of that subject), the line is empty.

     If the input is wrong, the program writes an error message
     (on stderr) and stops with  return 1.


 EXAMPLE  (the same 4 notes in all the examples)
 -----------------------------------------------
     the 4 notes:
         0 500 3 Data Structures
         1 900 7 DBMS
         2 100 9 Data Structures
         3 700 1 DBMS

     full input for "newest" + "Data Structures":
         newest
         Data Structures
         4
         0 500 3 Data Structures
         1 900 7 DBMS
         2 100 9 Data Structures
         3 700 1 DBMS

     | line 1  | line 2           | OUTPUT    | why                                  |
     |---------|------------------|-----------|--------------------------------------|
     | newest  | all              | 1 3 0 2   | every note, biggest time first       |
     | newest  | Data Structures  | 0 2       | only Data Structures, newest first   |
     | liked   | all              | 2 1 0 3   | every note, most likes first         |
     | liked   | DBMS             | 1 3       | only DBMS, most likes first          |


 HOW BUBBLE SORT WORKS  (example: "newest", look only at the time)
 -----------------------------------------------------------------
 Idea: look at two NEIGHBOURS. If they are in the wrong order, SWAP them.
       Do this again and again, until nothing is in the wrong order.

     Start      :  500  900  100  700       (we want: biggest time first)

     Round 1    :  500  900   -> wrong order  -> swap -> 900  500  100  700
                        500  100   -> correct     -> stay
                             100  700   -> wrong  -> swap -> 900  500  700  100
                   The OLDEST note (100) has reached the END. It is done.

     Round 2    :  900  500   -> correct     -> stay
                        500  700   -> wrong  -> swap -> 900  700  500  100

     Round 3    :  900  700   -> correct     -> stay
                   Nothing was swapped in this round -> everything is sorted. STOP.

     Result     :  900  700  500  100   ->  indexes  1  3  0  2

 Why is it STABLE?
     We swap ONLY when the order is really wrong.
     When two notes are exactly equal, we do NOT swap them.
     So equal notes keep the order in which the backend sent them.

 Rule for "liked":
     more likes  -> comes first
     same likes  -> the NEWER note comes first


 HOW TO TEST IT IN THE TERMINAL
 ------------------------------
     1. double click  connect_pbl/compile.bat   ->  makes  bin/notes_sort_c.exe
     2. open a terminal:
            cd R:\Acadex\connect_pbl
            bin\notes_sort_c.exe
     3. type the input (like the example above), pressing Enter after each line
============================================================
*/


# include <stdio.h>
# include <string.h>




// ---------- SIZES ----------
# define MAX_NOTES 1000              // the most notes this program can take at one time
# define MAX_SUBJECT_LENGTH 61       // a subject name can have 60 letters (+1 for '\0' at the end)
# define MAX_LINE_LENGTH 200         // the most letters one input line can have


// ---------- TWO WAYS TO SORT ----------
# define SORT_BY_NEWEST 1            // newest note first
# define SORT_BY_LIKES 2             // most liked note first




// ONE note. We keep only what we need for sorting and filtering.
struct Note{
    int index;                              // the note's number in the backend's list
    long long time;                         // when it was uploaded (a very big number, so "long long")
    int likes;                              // how many likes
    char subject[MAX_SUBJECT_LENGTH];       // subject name, like "Data Structures"
};



//? function to remove the "\n" , "\r" , " " from the string
void removeEnterFromEnd(char text[]){

    int length = strlen(text);

    while(length > 0){

        char lastLetter = text[length - 1];

        if(lastLetter == '\n' || lastLetter == '\r' || lastLetter == ' '){
            text[length - 1] = '\0';        
            length = length - 1;
        }
        else{
            break;                         
        }
    }
}




//? function to read one line at a time
int readOneLine(char line[]){

    if(fgets(line , MAX_LINE_LENGTH , stdin) == NULL){               //! data from backend came here , only one line read
        return 0;
    }

    removeEnterFromEnd(line);

    return 1;
}




//? function to return if note is newer then other note
int isNewer(struct Note noteA , struct Note noteB){

    if(noteA.time > noteB.time){
        return 1;
    }

    return 0;
}




//? function to return if the note is more liked then the others..
int isMoreLiked(struct Note noteA , struct Note noteB){

    // more likes -> comes first
    if(noteA.likes > noteB.likes){
        return 1;
    }

    // same likes -> the newer note comes first
    if(noteA.likes == noteB.likes){
        return isNewer(noteA , noteB);
    }

    // fewer likes -> does not come first
    return 0;
}




//? function to compare the sorting between two notes with the sorttype
int shouldComeBefore(struct Note noteA , struct Note noteB , int sortType){

    if(sortType == SORT_BY_NEWEST){
        return isNewer(noteA , noteB);
    }

    if(sortType == SORT_BY_LIKES){
        return isMoreLiked(noteA , noteB);
    }

    return 0;
}




//$ BUBBLE SORT
// puts the notes in order (sortType = SORT_BY_NEWEST or SORT_BY_LIKES)
//
// We look at two neighbours:   notes[position]   and   notes[position + 1]
// If the RIGHT one should come before the LEFT one -> they are in the wrong order -> SWAP.
void bubbleSort(struct Note notes[] , int noteCount , int sortType){

    int round;
    int position;

    for(round = 1 ; round <= noteCount - 1 ; round++){

        int swappedInThisRound = 0;         // 0 = nothing swapped yet in this round

        // After every round, one more note has reached its correct place at the END.
        // So every round we can stop one step earlier:  noteCount - round
        for(position = 0 ; position < noteCount - round ; position++){

            struct Note leftNote = notes[position];
            struct Note rightNote = notes[position + 1];

            if(shouldComeBefore(rightNote , leftNote , sortType) == 1){

                // wrong order -> SWAP the two notes
                // (one struct = one whole note, so all its parts move together)
                struct Note temporaryNote = notes[position];
                notes[position] = notes[position + 1];
                notes[position + 1] = temporaryNote;

                swappedInThisRound = 1;
            }
        }

        // if nothing was swapped, everything is already in order -> stop early
        if(swappedInThisRound == 0){
            break;
        }
    }
}




//$ LINEAR SEARCH (filter)
// looks at EVERY note, one by one.
// if its subject is the wanted subject -> copy it into chosenNotes.
// gives back how many notes were chosen.
int keepOnlySubject(struct Note allNotes[] , int allNotesCount , char wantedSubject[] , struct Note chosenNotes[]){

    int chosenCount = 0;
    int position;

    for(position = 0 ; position < allNotesCount ; position++){

        // strcmp gives 0 when the two words are exactly the same
        if(strcmp(allNotes[position].subject , wantedSubject) == 0){
            chosenNotes[chosenCount] = allNotes[position];
            chosenCount = chosenCount + 1;
        }
    }

    return chosenCount;
}




//$ prints the indexes of the notes, in order, on one line
// example:  1 3 0 2
void printOrder(struct Note notes[] , int noteCount){

    int position;

    for(position = 0 ; position < noteCount ; position++){

        // put a space BETWEEN numbers (not before the first one)
        if(position > 0){
            printf(" ");
        }

        printf("%d" , notes[position].index);               //? return in the form "1 3 6 3"
    }

    printf("\n");
}




int main(){

    char line[MAX_LINE_LENGTH];

    char chosenSort[MAX_LINE_LENGTH];               // newest / liked
    int sortType;                                   // SORT_BY_NEWEST or SORT_BY_LIKES (a number)

    char wantedSubject[MAX_LINE_LENGTH];            // a subject name like "DBMS" , or "all"

    struct Note allNotes[MAX_NOTES];                // every note we get
    int allNotesCount = 0;

    struct Note chosenNotes[MAX_NOTES];             // notes left after the subject filter
    int chosenNotesCount = 0;

    int noteNumber;




    // ---------- STEP 1: read how to sort ---------- //? return sort type   newest / liked
    if(readOneLine(chosenSort) == 0){
        fprintf(stderr , "No sort given. Send newest or liked.\n");
        return 1;
    }

    // turn the word into a number, so the sorting functions can use it
    if(strcmp(chosenSort , "newest") == 0){
        sortType = SORT_BY_NEWEST;
    }
    else if(strcmp(chosenSort , "liked") == 0){
        sortType = SORT_BY_LIKES;
    }
    else{
        fprintf(stderr , "Unknown sort \"%s\". Send newest or liked.\n" , chosenSort);
        return 1;
    }




    // ---------- STEP 2: read which subject ("all" = every subject) ----------
    if(readOneLine(wantedSubject) == 0){                                              //? now go the subject
        fprintf(stderr , "No subject given. Send a subject name or all.\n");
        return 1;
    }

    // a note's subject keeps only 60 letters (see STEP 4),
    // so the wanted subject must also keep only 60 letters, or they would never match
    if(strlen(wantedSubject) > MAX_SUBJECT_LENGTH - 1){
        wantedSubject[MAX_SUBJECT_LENGTH - 1] = '\0';
    }




    // ---------- STEP 3: read how many notes there are ----------                           //? getting the number of notes...
    if(readOneLine(line) == 0){
        fprintf(stderr , "Number of notes not given.\n");
        return 1;
    }

    // sscanf reads a number out of the line. It gives back how many things it read.
    if(sscanf(line , "%d" , &allNotesCount) != 1){                                               //? where to read , what type to read , where to put
        fprintf(stderr , "Number of notes is not a number: \"%s\"\n" , line);
        return 1;
    }

    if(allNotesCount < 0 || allNotesCount > MAX_NOTES){
        fprintf(stderr , "Number of notes must be between 0 and %d.\n" , MAX_NOTES);
        return 1;
    }




    // ---------- STEP 4: read every note into the array ----------
    for(noteNumber = 0 ; noteNumber < allNotesCount ; noteNumber++){

        int partsRead;

        if(readOneLine(line) == 0){
            fprintf(stderr , "Expected %d notes, but got only %d.\n" , allNotesCount , noteNumber);
            return 1;
        }

        // Read the 4 parts of the line:
        //   %d      -> index
        //   %lld    -> time    (long long number)
        //   %d      -> likes
        //   %60[^\n]  -> subject: read ALL the letters till the end of the line,
        //               spaces too (at most 60 letters).
        //               [^\n] means "every letter except Enter".
        partsRead = sscanf(line , "%d %lld %d %60[^\n]" ,
                           &allNotes[noteNumber].index ,
                           &allNotes[noteNumber].time ,
                           &allNotes[noteNumber].likes ,
                           allNotes[noteNumber].subject);

        if(partsRead < 3){
            fprintf(stderr , "Note line %d is wrong: \"%s\"\n" , noteNumber + 1 , line);
            return 1;
        }

        // only 3 parts read -> the note has no subject -> keep it empty
        if(partsRead == 3){
            strcpy(allNotes[noteNumber].subject , "");
        }

        // the subject may have spaces at its end -> remove them
        removeEnterFromEnd(allNotes[noteNumber].subject);
    }




    // ---------- STEP 5: FILTER - keep only the wanted subject (linear search) ----------
    if(strcmp(wantedSubject , "all") == 0){

        // "all" -> no filter -> every note is chosen
        for(noteNumber = 0 ; noteNumber < allNotesCount ; noteNumber++){
            chosenNotes[noteNumber] = allNotes[noteNumber];
        }
        chosenNotesCount = allNotesCount;
    }
    else{

        chosenNotesCount = keepOnlySubject(allNotes , allNotesCount , wantedSubject , chosenNotes);
    }




    // ---------- STEP 6: SORT - put the chosen notes in order (bubble sort) ----------
    bubbleSort(chosenNotes , chosenNotesCount , sortType);




    // ---------- STEP 7: ANSWER - print the new order (the backend reads this) ----------
    printOrder(chosenNotes , chosenNotesCount);


    return 0;
}
