# include <stdio.h>
# include <string.h>

# define MAX_NOTES 1000
# define MAX_LINE_LENGTH 100

struct Note{
    int index;
    int mine;
};

struct Note queue[MAX_NOTES];

int front = 0;
int rear = -1;

int isEmpty(){

    if(front > rear){
        return 1;
    }

    return 0;
}

int isFull(){

    if(rear == MAX_NOTES - 1){
        return 1;
    }

    return 0;
}

int size(){

    return rear - front + 1;
}

int enqueue(struct Note newNote){

    if(isFull() == 1){
        return 0;
    }

    rear = rear + 1;
    queue[rear] = newNote;

    return 1;
}

struct Note dequeue(){

    struct Note firstNote = queue[front];

    front = front + 1;

    return firstNote;
}

struct Note peek(){

    return queue[front];
}

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

void showLine(){

    int printedCount = 0;

    printf("%d\n" , size());

    while(isEmpty() == 0){

        struct Note note = dequeue();

        if(printedCount > 0){
            printf(" ");
        }

        printf("%d" , note.index);
        printedCount = printedCount + 1;
    }

    printf("\n");
}

void showFront(){

    struct Note firstNote;

    if(isEmpty() == 1){
        printf("-1\n");
        return;
    }

    firstNote = peek();
    printf("%d\n" , firstNote.index);
}

void showMyPositions(){

    int position = 0;

    while(isEmpty() == 0){

        struct Note note = dequeue();

        position = position + 1;

        if(note.mine == 1){
            printf("%d %d\n" , note.index , position);
        }
    }
}

int main(){

    char line[MAX_LINE_LENGTH];

    char chosenJob[MAX_LINE_LENGTH];

    int noteCount = 0;
    int noteNumber;

    if(readOneLine(chosenJob) == 0){
        fprintf(stderr , "No job given. Send line , front or position.\n");
        return 1;
    }

    if(strcmp(chosenJob , "line") != 0 && strcmp(chosenJob , "front") != 0 && strcmp(chosenJob , "position") != 0){
        fprintf(stderr , "Unknown job \"%s\". Send line , front or position.\n" , chosenJob);
        return 1;
    }

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

    for(noteNumber = 0 ; noteNumber < noteCount ; noteNumber++){

        struct Note newNote;

        if(readOneLine(line) == 0){
            fprintf(stderr , "Expected %d notes, but got only %d.\n" , noteCount , noteNumber);
            return 1;
        }

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
