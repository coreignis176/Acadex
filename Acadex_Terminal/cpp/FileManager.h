# pragma once

# include <iostream>
# include <fstream>
# include <string>
# include <vector>
# include "User.h"
using namespace std;

//? every value is written on its own line , so we read it back with getline() in the same order
class FileManager{

    private:

        string studentsFile = "data/students.txt";
        string subjectsFile = "data/subjects.txt";
        string notesFile    = "data/notes.txt";

    public:

        void saveStudents(vector<User*> &users){

            ofstream file(studentsFile);

            if(!file.is_open()){
                cout << "Could not save " << studentsFile << "!! (is the data folder there?)\n";
                return;
            }

            int total = users.size();

            for(int i = 0 ; i < total ; i++){
                users[i]->saveToFile(file);
            }
        }

        void loadStudents(vector<User*> &users){

            ifstream file(studentsFile);

            if(!file.is_open()){
                return;
            }

            string name;
            string section;
            string rollText;

            while(getline(file , name)){

                getline(file , section);
                getline(file , rollText);

                int rollNo = stoi(rollText);

                users.push_back(new Student(name , section , rollNo));
            }
        }

        void saveSubjects(){

            ofstream file(subjectsFile);

            if(!file.is_open()){
                cout << "Could not save " << subjectsFile << "!! (is the data folder there?)\n";
                return;
            }

            int total = getSubjectCount();

            for(int i = 0 ; i < total ; i++){
                file << getSubject(i) << "\n";
            }
        }

        void loadSubjects(){

            ifstream file(subjectsFile);

            if(!file.is_open()){
                return;
            }

            string name;

            while(getline(file , name)){
                addSubject(name.c_str());
            }
        }

        void saveNotes(NT* notesHead){

            ofstream file(notesFile);

            if(!file.is_open()){
                cout << "Could not save " << notesFile << "!! (is the data folder there?)\n";
                return;
            }

            NT* Temp = notesHead;

            while(Temp != NULL){

                file << Temp->id << "\n";
                file << Temp->title << "\n";
                file << Temp->subject << "\n";
                file << Temp->uploaderId << "\n";
                file << returnPageCount(&Temp->firstPage) << "\n";

                PG* Temp1 = Temp->firstPage;

                while(Temp1 != NULL){
                    file << Temp1->text << "\n";
                    Temp1 = Temp1->next;
                }

                Temp = Temp->next;
            }
        }

        void loadNotes(NT** notesHead){

            ifstream file(notesFile);

            if(!file.is_open()){
                return;
            }

            string idText;
            string title;
            string subject;
            string uploaderId;
            string countText;

            while(getline(file , idText)){

                getline(file , title);
                getline(file , subject);
                getline(file , uploaderId);
                getline(file , countText);

                int pageCount = stoi(countText);

                PG* pagesHead = NULL;

                for(int i = 0 ; i < pageCount ; i++){

                    string text;
                    getline(file , text);

                    insert_end_page(&pagesHead , text.c_str());
                }

                set_next_note_id(stoi(idText));      //? so the note gets its OLD id back
                insert_end_note(notesHead , title.c_str() , subject.c_str() , uploaderId.c_str() , pagesHead);
            }
        }

        void saveAll(vector<User*> &users , NT* notesHead){
            saveStudents(users);
            saveSubjects();
            saveNotes(notesHead);
        }

        void loadAll(vector<User*> &users , NT** notesHead){
            loadStudents(users);
            loadSubjects();
            loadNotes(notesHead);
        }
};
