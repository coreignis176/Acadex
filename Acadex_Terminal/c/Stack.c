# include <stdio.h>
# include "Stack.h"

//? STACK (LIFO) for undo delete
//? push = insert at front , pop = delete from start (without free)
//? it uses the note's own next pointer (a note is in the notes list OR in the stack , never both)

void push(NT** Top , NT* note){

    if(*Top == NULL){
        *Top = note;
        (*Top)->next = NULL;
    }
    else{
        note->next = *Top;
        *Top = note;
    }
}

NT* pop(NT** Top){

    if(*Top == NULL){
        return NULL;
    }

    NT* Temp = *Top;
    *Top = (*Top)->next;
    Temp->next = NULL;

    return Temp;
}

int isStackEmpty(NT** Top){

    if(*Top == NULL){
        return 1;
    }

    return 0;
}
