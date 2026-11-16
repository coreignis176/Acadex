# include <stdio.h>
# include <string.h>

# define MAX_NOTES 1000
# define MAX_SUBJECT_LENGTH 61
# define MAX_LINE_LENGTH 200

# define SORT_BY_NEWEST 1
# define SORT_BY_LIKES 2

struct Note{
    int index;
    long long time;
    int likes;
    char subject[MAX_SUBJECT_LENGTH];
};

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

int readOneLine(char line[]){

    if(fgets(line , MAX_LINE_LENGTH , stdin) == NULL){
        return 0;
    }

    removeEnterFromEnd(line);

    return 1;
}

int isNewer(struct Note noteA , struct Note noteB){

    if(noteA.time > noteB.time){
        return 1;
    }

    return 0;
}

int isMoreLiked(struct Note noteA , struct Note noteB){

    if(noteA.likes > noteB.likes){
        return 1;
    }

    if(noteA.likes == noteB.likes){
        return isNewer(noteA , noteB);
    }

    return 0;
}

int shouldComeBefore(struct Note noteA , struct Note noteB , int sortType){

    if(sortType == SORT_BY_NEWEST){
        return isNewer(noteA , noteB);
    }

    if(sortType == SORT_BY_LIKES){
        return isMoreLiked(noteA , noteB);
    }

    return 0;
}

void bubbleSort(struct Note notes[] , int noteCount , int sortType){

    int round;
    int position;

    for(round = 1 ; round <= noteCount - 1 ; round++){

        int swappedInThisRound = 0;

        for(position = 0 ; position < noteCount - round ; position++){

            struct Note leftNote = notes[position];
            struct Note rightNote = notes[position + 1];

            if(shouldComeBefore(rightNote , leftNote , sortType) == 1){

                struct Note temporaryNote = notes[position];
                notes[position] = notes[position + 1];
                notes[position + 1] = temporaryNote;

                swappedInThisRound = 1;
            }
        }

        if(swappedInThisRound == 0){
            break;
        }
    }
}

int keepOnlySubject(struct Note allNotes[] , int allNotesCount , char wantedSubject[] , struct Note chosenNotes[]){

    int chosenCount = 0;
    int position;

    for(position = 0 ; position < allNotesCount ; position++){

        if(strcmp(allNotes[position].subject , wantedSubject) == 0){
            chosenNotes[chosenCount] = allNotes[position];
            chosenCount = chosenCount + 1;
        }
    }

    return chosenCount;
}

void printOrder(struct Note notes[] , int noteCount){

    int position;

    for(position = 0 ; position < noteCount ; position++){

        if(position > 0){
            printf(" ");
        }

        printf("%d" , notes[position].index);
    }

    printf("\n");
}

int main(){

    char line[MAX_LINE_LENGTH];

    char chosenSort[MAX_LINE_LENGTH];
    int sortType;

    char wantedSubject[MAX_LINE_LENGTH];

    struct Note allNotes[MAX_NOTES];
    int allNotesCount = 0;

    struct Note chosenNotes[MAX_NOTES];
    int chosenNotesCount = 0;

    int noteNumber;

    if(readOneLine(chosenSort) == 0){
        fprintf(stderr , "No sort given. Send newest or liked.\n");
        return 1;
    }

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

    if(readOneLine(wantedSubject) == 0){
        fprintf(stderr , "No subject given. Send a subject name or all.\n");
        return 1;
    }

    if(strlen(wantedSubject) > MAX_SUBJECT_LENGTH - 1){
        wantedSubject[MAX_SUBJECT_LENGTH - 1] = '\0';
    }

    if(readOneLine(line) == 0){
        fprintf(stderr , "Number of notes not given.\n");
        return 1;
    }

    if(sscanf(line , "%d" , &allNotesCount) != 1){
        fprintf(stderr , "Number of notes is not a number: \"%s\"\n" , line);
        return 1;
    }

    if(allNotesCount < 0 || allNotesCount > MAX_NOTES){
        fprintf(stderr , "Number of notes must be between 0 and %d.\n" , MAX_NOTES);
        return 1;
    }

    for(noteNumber = 0 ; noteNumber < allNotesCount ; noteNumber++){

        int partsRead;

        if(readOneLine(line) == 0){
            fprintf(stderr , "Expected %d notes, but got only %d.\n" , allNotesCount , noteNumber);
            return 1;
        }

        partsRead = sscanf(line , "%d %lld %d %60[^\n]" ,
                           &allNotes[noteNumber].index ,
                           &allNotes[noteNumber].time ,
                           &allNotes[noteNumber].likes ,
                           allNotes[noteNumber].subject);

        if(partsRead < 3){
            fprintf(stderr , "Note line %d is wrong: \"%s\"\n" , noteNumber + 1 , line);
            return 1;
        }

        if(partsRead == 3){
            strcpy(allNotes[noteNumber].subject , "");
        }

        removeEnterFromEnd(allNotes[noteNumber].subject);
    }

    if(strcmp(wantedSubject , "all") == 0){

        for(noteNumber = 0 ; noteNumber < allNotesCount ; noteNumber++){
            chosenNotes[noteNumber] = allNotes[noteNumber];
        }
        chosenNotesCount = allNotesCount;
    }
    else{

        chosenNotesCount = keepOnlySubject(allNotes , allNotesCount , wantedSubject , chosenNotes);
    }

    bubbleSort(chosenNotes , chosenNotesCount , sortType);

    printOrder(chosenNotes , chosenNotesCount);

    return 0;
}
