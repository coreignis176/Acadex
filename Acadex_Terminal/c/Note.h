# pragma once

# include "Subject.h"

# define MAX_TITLE 100
# define MAX_TEXT  1000
# define MAX_ID    20

struct Page{
    int  number;
    char text[MAX_TEXT];
    struct Page *prev;
    struct Page *next;
};

typedef struct Page PG;

struct Note{
    int  id;
    char title[MAX_TITLE];
    char subject[MAX_NAME];
    char uploaderId[MAX_ID];
    PG   *firstPage;
    struct Note *next;
};

typedef struct Note NT;

void insert_end_page(PG** Head , const char text[]);
int  returnPageCount(PG** Head);
void free_all_pages(PG** Head);

void set_next_note_id(int id);
int  insert_end_note(NT** Head , const char title[] , const char subject[] , const char uploaderId[] , PG* pages);
void display_notes(NT** Head);
NT*  find_note(NT** Head , int id);
NT*  remove_note(NT** Head , int id);
void insert_note_back(NT** Head , NT* note);
void free_all_notes(NT** Head);

void show_page(NT* note , PG* page);
PG*  move_page(PG* page , char choice);
