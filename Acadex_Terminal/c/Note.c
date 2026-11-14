# include <stdio.h>
# include <stdlib.h>
# include <string.h>
# include "Note.h"

//? SINGLY linked list = all notes ,  DOUBLY linked list = pages of one note

static int nextNoteId = 1;

void set_next_note_id(int id){
    nextNoteId = id;
}

void insert_end_page(PG** Head , const char text[]){

    PG* Temp = (PG*) malloc(sizeof(PG));

    if(Temp == NULL){
        printf("Unable to access memory in the heap!!\n");
        return;
    }

    strcpy(Temp->text , text);

    if(*Head == NULL){
        Temp->number = 1;
        Temp->prev = NULL;
        *Head = Temp;
        (*Head)->next = NULL;
    }
    else{

        PG* Temp1 = *Head;

        while(Temp1->next != NULL){
            Temp1 = Temp1->next;
        }

        Temp->number = Temp1->number + 1;

        Temp1->next = Temp;
        Temp->prev = Temp1;        //? this line makes it a DOUBLY linked list
        Temp->next = NULL;
    }
}

int returnPageCount(PG** Head){

    if(*Head == NULL){
        return 0;
    }

    int siz = 0;
    PG* Temp = *Head;

    while(Temp != NULL){
        siz++;
        Temp = Temp->next;
    }

    return siz;
}

void free_all_pages(PG** Head){

    PG* Temp = *Head;

    while(Temp != NULL){
        PG* Next = Temp->next;     //? save the next page BEFORE free
        free(Temp);
        Temp = Next;
    }

    *Head = NULL;
}

int insert_end_note(NT** Head , const char title[] , const char subject[] , const char uploaderId[] , PG* pages){

    NT* Temp = (NT*) malloc(sizeof(NT));

    if(Temp == NULL){
        printf("Unable to access memory in the heap!!\n");
        free_all_pages(&pages);
        return 0;
    }

    Temp->id = nextNoteId;
    nextNoteId++;

    strcpy(Temp->title , title);
    strcpy(Temp->subject , subject);
    strcpy(Temp->uploaderId , uploaderId);
    Temp->firstPage = pages;

    if(*Head == NULL){
        *Head = Temp;
        (*Head)->next = NULL;
    }
    else{

        NT* Temp1 = *Head;

        while(Temp1->next != NULL){
            Temp1 = Temp1->next;
        }

        Temp1->next = Temp;
        Temp->next = NULL;
    }

    return Temp->id;
}

void display_notes(NT** Head){

    if(*Head == NULL){
        printf("No notes yet!!\n");
        return;
    }

    printf("\n------ ALL NOTES ------\n");

    NT* Temp = *Head;

    while(Temp != NULL){
        printf("#%d  %s  %s  (by %s)  - %d page(s)\n" , Temp->id , Temp->subject , Temp->title , Temp->uploaderId , returnPageCount(&Temp->firstPage));
        Temp = Temp->next;
    }
}

NT* find_note(NT** Head , int id){

    NT* Temp = *Head;

    while(Temp != NULL){

        if(Temp->id == id){
            return Temp;
        }

        Temp = Temp->next;
    }

    return NULL;
}

//? takes the note out of the list but does NOT free it (it goes to the undo stack)
NT* remove_note(NT** Head , int id){

    if(*Head == NULL){
        return NULL;
    }

    NT* Temp = *Head;

    if(Temp->id == id){
        *Head = Temp->next;
        Temp->next = NULL;
        return Temp;
    }

    NT* Prev = Temp;
    Temp = Temp->next;

    while(Temp != NULL){

        if(Temp->id == id){
            Prev->next = Temp->next;
            Temp->next = NULL;
            return Temp;
        }

        Prev = Temp;
        Temp = Temp->next;
    }

    return NULL;
}

//? undo: puts the note back at its old place (notes stay in id order 1 , 2 , 3 ...)
void insert_note_back(NT** Head , NT* note){

    if(*Head == NULL || note->id < (*Head)->id){
        note->next = *Head;
        *Head = note;
        return;
    }

    NT* Prev = *Head;
    NT* Temp = (*Head)->next;

    while(Temp != NULL && Temp->id < note->id){
        Prev = Temp;
        Temp = Temp->next;
    }

    Prev->next = note;
    note->next = Temp;
}

void show_page(NT* note , PG* page){

    printf("\n====== %s  (%s , by %s) ======\n" , note->title , note->subject , note->uploaderId);
    printf("---- Page %d of %d ----\n" , page->number , returnPageCount(&note->firstPage));
    printf("%s\n" , page->text);
}

PG* move_page(PG* page , char choice){

    if(choice == 'n'){

        if(page->next == NULL){
            printf("This is the last page!!\n");
            return page;
        }

        return page->next;
    }

    if(choice == 'p'){

        if(page->prev == NULL){
            printf("This is the first page!!\n");
            return page;
        }

        return page->prev;
    }

    return page;
}

void free_all_notes(NT** Head){

    NT* Temp = *Head;

    while(Temp != NULL){
        NT* Next = Temp->next;
        free_all_pages(&Temp->firstPage);
        free(Temp);
        Temp = Next;
    }

    *Head = NULL;
}
