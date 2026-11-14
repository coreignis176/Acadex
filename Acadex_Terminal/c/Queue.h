# pragma once

//? only the note id is kept (not the note) , because the note may be deleted later
struct QNode{
    int noteId;
    struct QNode *next;
};

typedef struct QNode QU;

void enqueue(QU** Front , QU** Rear , int noteId);
int  dequeue(QU** Front , QU** Rear);
int  isInQueue(QU** Front , int noteId);
int  returnQueueSize(QU** Front);
void free_queue(QU** Front , QU** Rear);
