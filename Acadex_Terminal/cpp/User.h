# pragma once

# include <iostream>
# include <string>
# include <vector>
# include <fstream>
# include <cctype>
using namespace std;

//? C files: extern "C" stops C++ from changing their function names (otherwise linker error)
extern "C" {
    # include "Subject.h"
    # include "Note.h"
    # include "Stack.h"
    # include "Queue.h"
}

int readNumber(){

    int number;

    while(!(cin >> number)){
        cin.clear();
        cin.ignore(1000 , '\n');
        cout << "Please enter a number :- ";
    }

    cin.ignore(1000 , '\n');         //? remove the Enter key , so the next getline() works
    return number;
}

class User{

    private:

        string name;
        string loginId;
        string password;

    public:

        User(string name , string loginId , string password){
            this->name = name;
            this->loginId = loginId;
            this->password = password;
        }

        string getName(){
            return name;
        }

        string getLoginId(){
            return loginId;
        }

        bool checkPassword(string typedPassword){
            return typedPassword == password;
        }

        void moveNoteToStack(NT** notesHead , NT** undoTop , int id){

            NT* note = remove_note(notesHead , id);

            push(undoTop , note);

            cout << "Note #" << id << " deleted!! (you can undo it before you logout)\n";
        }

        void undoLastDelete(NT** notesHead , NT** undoTop){

            NT* note = pop(undoTop);

            if(note == NULL){
                cout << "Nothing to undo!!\n";
                return;
            }

            insert_note_back(notesHead , note);

            cout << "Note #" << note->id << " (" << note->title << ") is back!!\n";
        }

        void clearUndo(NT** undoTop){

            if(isStackEmpty(undoTop) == 0){
                free_all_notes(undoTop);
                cout << "Deleted notes are now removed for good.\n";
            }
        }

        virtual string getRole() = 0;

        virtual void showDetails() = 0;

        virtual void saveToFile(ofstream &file) = 0;

        virtual void showMenu(NT** notesHead , vector<User*> &users) = 0;

        virtual ~User(){}
};

class Student : public User{

    private:

        string section;
        int    rollNo;

        QU* readLaterFront = NULL;       //? every student has their own read later queue
        QU* readLaterRear  = NULL;

    public:
        //? login id and password = section - roll no (like ML1-5)
        //? the dash stops clashes : ML1 + 15 = ML1-15 , ML11 + 5 = ML11-5
        Student(string name , string section , int rollNo) : User(name , section + "-" + to_string(rollNo) , section + "-" + to_string(rollNo)){
            this->section = section;
            this->rollNo = rollNo;
        }

        ~Student(){                                          //? destructor: frees the read later queue
            free_queue(&readLaterFront , &readLaterRear);
        }

        string getRole(){
            return "student";
        }

        void showDetails(){
            cout << getName() << "   Section " << section << "   Roll no " << rollNo << "   (login id: " << getLoginId() << ")\n";
        }

        void saveToFile(ofstream &file){
            file << getName() << "\n";
            file << section << "\n";
            file << rollNo << "\n";
        }

        void uploadNote(NT** notesHead){

            if(getSubjectCount() == 0){
                cout << "No subjects yet!! Ask the admin to add a subject first.\n";
                return;
            }

            string title;
            cout << "Enter note title :- ";
            getline(cin , title);

            if(title == ""){
                cout << "Title cannot be empty!!\n";
                return;
            }

            if(title.length() >= MAX_TITLE){
                cout << "Title is too long (max " << MAX_TITLE - 1 << " letters)!!\n";
                return;
            }

            showSubjects();
            cout << "Choose subject number :- ";
            int choice = readNumber();

            if(choice < 1 || choice > getSubjectCount()){
                cout << "Wrong subject number!!\n";
                return;
            }

            const char* subject = getSubject(choice - 1);

            PG* pagesHead = NULL;
            int pageNumber = 1;

            while(1){

                string text;
                cout << "Page " << pageNumber << " :- ";
                getline(cin , text);

                if(text == ""){
                    cout << "Page cannot be empty!! Type again.\n";
                    continue;
                }

                if(text.length() >= MAX_TEXT){
                    cout << "Page is too long (max " << MAX_TEXT - 1 << " letters)!! Type again.\n";
                    continue;
                }

                insert_end_page(&pagesHead , text.c_str());
                pageNumber++;

                string answer;
                cout << "Add another page? (y/n) :- ";
                getline(cin , answer);

                if(answer != "y" && answer != "Y"){
                    break;
                }
            }

            int totalPages = returnPageCount(&pagesHead);

            int id = insert_end_note(notesHead , title.c_str() , subject , getLoginId().c_str() , pagesHead);

            if(id != 0){
                cout << "Note #" << id << " uploaded with " << totalPages << " page(s)!!\n";
            }
        }

        void readNote(NT** notesHead){

            cout << "Enter note id :- ";
            int id = readNumber();

            NT* note = find_note(notesHead , id);

            if(note == NULL){
                cout << "Note not found!!\n";
                return;
            }

            openReader(note);
        }

        void addToReadLater(NT** notesHead){

            cout << "Enter note id :- ";
            int id = readNumber();

            if(find_note(notesHead , id) == NULL){
                cout << "Note not found!!\n";
                return;
            }

            if(isInQueue(&readLaterFront , id) == 1){
                cout << "Note #" << id << " is already in your Read Later list!!\n";
                return;
            }

            enqueue(&readLaterFront , &readLaterRear , id);

            cout << "Note #" << id << " added to Read Later. ("
                 << returnQueueSize(&readLaterFront) << " note(s) waiting)\n";
        }

        void readNextFromReadLater(NT** notesHead){

            int id = dequeue(&readLaterFront , &readLaterRear);

            if(id == 0){
                cout << "Your Read Later list is empty!!\n";
                return;
            }

            NT* note = find_note(notesHead , id);

            if(note == NULL){
                cout << "Note #" << id << " was deleted , so it is removed from Read Later.\n";
                return;
            }

            openReader(note);

            cout << returnQueueSize(&readLaterFront) << " note(s) left in Read Later.\n";
        }

        void deleteMyNote(NT** notesHead , NT** undoTop){

            cout << "Enter note id :- ";
            int id = readNumber();

            NT* note = find_note(notesHead , id);

            if(note == NULL){
                cout << "Note not found!!\n";
                return;
            }

            if(getLoginId() != note->uploaderId){
                cout << "You can delete only YOUR notes!!\n";
                return;
            }

            moveNoteToStack(notesHead , undoTop , id);
        }

        void openReader(NT* note){

            PG* page = note->firstPage;

            while(1){

                show_page(note , page);

                cout << "n = next   p = previous   q = back\n";
                cout << "Your choice :- ";

                string choice;
                getline(cin , choice);

                if(choice == "q"){
                    break;
                }
                else if(choice == "n" || choice == "p"){
                    page = move_page(page , choice[0]);
                }
                else{
                    cout << "Please type n , p or q!!\n";
                }
            }
        }

        void showMenu(NT** notesHead , vector<User*> &users){

            NT* undoTop = NULL;              //? undo stack of this login only

            while(1){

                cout << "\n------ STUDENT MENU (" << getName() << ") ------\n";
                cout << "1. Upload note\n";
                cout << "2. View all notes\n";
                cout << "3. Read a note\n";
                cout << "4. Add note to Read Later\n";
                cout << "5. Read next from Read Later\n";
                cout << "6. Delete my note\n";
                cout << "7. Undo last delete\n";
                cout << "8. Logout\n";
                cout << "Enter your option :- ";

                int option = readNumber();

                switch(option){

                    case 1:{
                        uploadNote(notesHead);
                        break;
                    }

                    case 2:{
                        display_notes(notesHead);
                        break;
                    }

                    case 3:{
                        readNote(notesHead);
                        break;
                    }

                    case 4:{
                        addToReadLater(notesHead);
                        break;
                    }

                    case 5:{
                        readNextFromReadLater(notesHead);
                        break;
                    }

                    case 6:{
                        deleteMyNote(notesHead , &undoTop);
                        break;
                    }

                    case 7:{
                        undoLastDelete(notesHead , &undoTop);
                        break;
                    }

                    case 8:{
                        clearUndo(&undoTop);
                        cout << "Logged out. Bye " << getName() << "!!\n";
                        return;
                    }

                    default:{
                        cout << "Please enter a number from 1 to 8!!\n";
                    }
                }
            }
        }
};

class Admin : public User{

    public:
        Admin(string name , string username , string password) : User(name , username , password){
        }

        string getRole(){
            return "admin";
        }

        void showDetails(){
            cout << getName() << "   (admin)\n";
        }

        void saveToFile(ofstream &file){
        }

        void addStudent(vector<User*> &users){

            string name;
            cout << "Enter student name :- ";
            getline(cin , name);

            if(name == ""){
                cout << "Name cannot be empty!!\n";
                return;
            }

            string section;
            cout << "Enter section (like ML1) :- ";
            getline(cin , section);

            if(section == "" || section.length() > 5){
                cout << "Section must have 1 to 5 letters or numbers!!\n";
                return;
            }

            if(!isalpha(section[0])){
                cout << "Section must start with a letter (like ML1 , DS1)!!\n";
                return;
            }

            int length = section.length();

            for(int i = 0 ; i < length ; i++){

                if(!isalnum(section[i])){
                    cout << "Section can have only letters and numbers (like ML1 , DS1)!!\n";
                    return;
                }

                section[i] = toupper(section[i]);
            }

            cout << "Enter class roll no :- ";
            int rollNo = readNumber();

            if(rollNo <= 0){
                cout << "Roll no must be more than 0!!\n";
                return;
            }

            string loginId = section + "-" + to_string(rollNo);

            int total = users.size();

            for(int i = 0 ; i < total ; i++){

                if(users[i]->getLoginId() == loginId){
                    cout << "Student with login id " << loginId << " already exists!!\n";
                    return;
                }
            }

            users.push_back(new Student(name , section , rollNo));

            cout << "Student added!!\n";
            cout << "Login id : " << loginId << "\n";
            cout << "Password : " << loginId << "\n";
        }

        void viewStudents(vector<User*> &users){

            cout << "\n------ STUDENTS ------\n";

            int total = users.size();
            int count = 0;

            for(int i = 0 ; i < total ; i++){

                if(users[i]->getRole() == "student"){
                    count++;
                    cout << count << ". ";
                    users[i]->showDetails();
                }
            }

            if(count == 0){
                cout << "No students yet!!\n";
            }
        }

        void removeStudent(vector<User*> &users){

            string loginId;
            cout << "Enter login id of the student (like ML1-5) :- ";
            getline(cin , loginId);

            int total = users.size();

            for(int i = 0 ; i < total ; i++){

                if(users[i]->getRole() == "student" && users[i]->getLoginId() == loginId){

                    cout << "Student " << users[i]->getName() << " (" << loginId << ") removed!!\n";

                    delete users[i];                       //? free the object
                    users.erase(users.begin() + i);        //? remove its address from the vector
                    return;
                }
            }

            cout << "No student with login id " << loginId << "!!\n";
        }

        void addNewSubject(){

            string name;
            cout << "Enter subject name :- ";
            getline(cin , name);

            if(name == ""){
                cout << "Subject name cannot be empty!!\n";
                return;
            }

            if(name.length() >= MAX_NAME){
                cout << "Name is too long (max " << MAX_NAME - 1 << " letters)!!\n";
                return;
            }

            int result = addSubject(name.c_str());

            if(result == 1){
                cout << "Subject \"" << name << "\" added!!\n";
            }
            else if(result == 0){
                cout << "Cannot add. Max " << MAX_SUBJECTS << " subjects allowed!!\n";
            }
            else{
                cout << "\"" << name << "\" is already in the list!!\n";
            }
        }

        void deleteAnyNote(NT** notesHead , NT** undoTop){

            display_notes(notesHead);

            if(*notesHead == NULL){
                return;
            }

            cout << "Enter note id to delete :- ";
            int id = readNumber();

            if(find_note(notesHead , id) == NULL){
                cout << "Note not found!!\n";
                return;
            }

            moveNoteToStack(notesHead , undoTop , id);
        }

        void showMenu(NT** notesHead , vector<User*> &users){

            NT* undoTop = NULL;

            while(1){

                cout << "\n------ ADMIN MENU (" << getName() << ") ------\n";
                cout << "1. Add student\n";
                cout << "2. Remove student\n";
                cout << "3. View students\n";
                cout << "4. Add subject\n";
                cout << "5. View subjects\n";
                cout << "6. Delete any note\n";
                cout << "7. Undo last delete\n";
                cout << "8. Logout\n";
                cout << "Enter your option :- ";

                int option = readNumber();

                switch(option){

                    case 1:{
                        addStudent(users);
                        break;
                    }

                    case 2:{
                        removeStudent(users);
                        break;
                    }

                    case 3:{
                        viewStudents(users);
                        break;
                    }

                    case 4:{
                        addNewSubject();
                        break;
                    }

                    case 5:{
                        showSubjects();
                        break;
                    }

                    case 6:{
                        deleteAnyNote(notesHead , &undoTop);
                        break;
                    }

                    case 7:{
                        undoLastDelete(notesHead , &undoTop);
                        break;
                    }

                    case 8:{
                        clearUndo(&undoTop);
                        cout << "Logged out. Bye " << getName() << "!!\n";
                        return;
                    }

                    default:{
                        cout << "Please enter a number from 1 to 8!!\n";
                    }
                }
            }
        }
};
