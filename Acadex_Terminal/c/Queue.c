# include <stdio.h>
# include <stdlib.h>
# include "Queue.h"

//? QUEUE (FIFO) for read later
//? enqueue at the Rear , dequeue from the Front
//? Rear pointer -> we add at the end without walking the whole list

void enqueue(QU** Front , QU** Rear , int noteId){

    QU* Temp = (QU*) malloc(sizeof(QU));

    if(Temp == NULL){
        printf("Unable to access memory in the heap!!\n");
        return;
    }

    Temp->noteId = noteId;
    Temp->next = NULL;

    if(*Front == NULL){
        *Front = Temp;
        *Rear = Temp;
    }
    else{
        (*Rear)->next = Temp;
        *Rear = Temp;
    }
}

int dequeue(QU** Front , QU** Rear){

    if(*Front == NULL){
        return 0;                  //? 0 = queue is empty (note ids start from 1)
    }

    QU* Temp = *Front;
    int noteId = Temp->noteId;

    *Front = (*Front)->next;

    if(*Front == NULL){
        *Rear = NULL;
    }

    free(Temp);

    return noteId;
}

int isInQueue(QU** Front , int noteId){

    QU* Temp = *Front;

    while(Temp != NULL){

        if(Temp->noteId == noteId){
            return 1;
        }

        Temp = Temp->next;
    }

    return 0;
}

int returnQueueSize(QU** Front){

    int siz = 0;
    QU* Temp = *Front;

    while(Temp != NULL){
        siz++;
        Temp = Temp->next;
    }

    return siz;
}

void free_queue(QU** Front , QU** Rear){

    while(*Front != NULL){
        dequeue(Front , Rear);
    }
}
