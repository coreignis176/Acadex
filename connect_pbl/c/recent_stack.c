# include <stdio.h>
# include <stdlib.h>
# include <string.h>
# include <ctype.h>

# define MAX_HISTORY 10
# define ID_LENGTH 25
# define MAX_LINE_LENGTH 100

struct Node{
    char id[ID_LENGTH];
    struct Node *next;
};

typedef struct Node ND;

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

int isEmpty(ND** Head){

    if(*Head == NULL){
        return 1;
    }

    return 0;
}

int isFull(ND** Head){

    if(returnSize(Head) >= MAX_HISTORY){
        return 1;
    }

    return 0;
}

int push(ND** Head , const char id[]){

    ND* Temp = (ND*)malloc(sizeof(ND));

    if(Temp == NULL){
        fprintf(stderr , "Error to get memory in heap!!\n");
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

const char* peek(ND** Head){

    if(*Head == NULL){
        return NULL;
    }

    return (*Head)->id;
}

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

void clear(ND** Head){

    char id[ID_LENGTH];

    while(pop(Head , id) == 1){
    }
}

int removeId(ND** Head , const char id[]){

    ND* TempStack = NULL;
    char topId[ID_LENGTH];
    int found = 0;

    while(pop(Head , topId) == 1){

        if(strcmp(topId , id) == 0){
            found = 1;
            break;
        }

        if(push(&TempStack , topId) == 0){
            clear(&TempStack);
            return -1;
        }
    }

    while(pop(&TempStack , topId) == 1){

        if(push(Head , topId) == 0){
            clear(&TempStack);
            return -1;
        }
    }

    return found;
}

int removeBottom(ND** Head){

    ND* TempStack = NULL;
    char topId[ID_LENGTH];

    while(pop(Head , topId) == 1){

        if(push(&TempStack , topId) == 0){
            clear(&TempStack);
            return 0;
        }
    }

    pop(&TempStack , topId);

    while(pop(&TempStack , topId) == 1){

        if(push(Head , topId) == 0){
            clear(&TempStack);
            return 0;
        }
    }

    return 1;
}

int printBottomToTop(ND** Head){

    ND* TempStack = NULL;
    char topId[ID_LENGTH];

    printf("%d\n" , returnSize(Head));

    while(pop(Head , topId) == 1){

        if(push(&TempStack , topId) == 0){
            clear(&TempStack);
            return 0;
        }
    }

    while(pop(&TempStack , topId) == 1){

        printf("%s\n" , topId);

        if(push(Head , topId) == 0){
            clear(&TempStack);
            return 0;
        }
    }

    return 1;
}

void printTopToBottom(ND** Head){

    printf("%d\n" , returnSize(Head));

    if(isEmpty(Head) == 1){
        return;
    }

    printf("%s\n" , peek(Head));

    ND* Temp = (*Head)->next;

    while(Temp != NULL){
        printf("%s\n" , Temp->id);
        Temp = Temp->next;
    }
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

    ND* Head = NULL;

    char line[MAX_LINE_LENGTH];

    char chosenJob[MAX_LINE_LENGTH];
    char newId[MAX_LINE_LENGTH];

    int idCount = 0;
    int idNumber;

    if(readOneLine(chosenJob) == 0){
        fprintf(stderr , "No job given. Send push , show or clear.\n");
        return 1;
    }

    if(strcmp(chosenJob , "push") != 0 && strcmp(chosenJob , "show") != 0 && strcmp(chosenJob , "clear") != 0){
        fprintf(stderr , "Unknown job \"%s\". Send push , show or clear.\n" , chosenJob);
        return 1;
    }

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

    if(strcmp(chosenJob , "push") == 0){

        if(removeId(&Head , newId) == -1){
            clear(&Head);
            return 1;
        }

        if(isFull(&Head) == 1){

            if(removeBottom(&Head) == 0){
                clear(&Head);
                return 1;
            }
        }

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

    clear(&Head);

    return 0;
}
