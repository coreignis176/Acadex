# include <iostream>
# include <string>
# include <vector>
# include "User.h"
# include "FileManager.h"
using namespace std;

User* login(vector<User*> &users , string role){

    string loginId;
    string password;

    if(role == "student"){
        cout << "Enter your login id (section-roll no , like ML1-5) :- ";
    }
    else{
        cout << "Enter your username :- ";
    }
    getline(cin , loginId);

    cout << "Enter your password :- ";
    getline(cin , password);

    int total = users.size();

    for(int i = 0 ; i < total ; i++){

        User* user = users[i];

        if(user->getRole() == role  &&  user->getLoginId() == loginId  &&  user->checkPassword(password)){

            cout << "\nLogin successful. Welcome " << user->getName() << "!!\n";
            return user;
        }
    }

    cout << "\nWrong login id or password!!\n";
    return NULL;
}

int main(){

    cout << "==========================================\n";
    cout << "            ACADEX  (Terminal)            \n";
    cout << "      share and find class notes          \n";
    cout << "==========================================\n";

    vector<User*> users;

    users.push_back(new Admin  ("Admin" , "admin"   , "admin123"));

    NT* notesHead = NULL;

    FileManager files;
    files.loadAll(users , &notesHead);

    while(1){

        cout << "\n------------- LOGIN -------------\n";
        cout << "1. Student login\n";
        cout << "2. Admin login\n";
        cout << "3. Exit\n";
        cout << "Enter your option :- ";

        int option = readNumber();

        switch(option){

            case 1:{
                User* user = login(users , "student");

                if(user != NULL){
                    user->showMenu(&notesHead , users);      //? POLYMORPHISM: opens Student or Admin menu
                    files.saveAll(users , notesHead);        //? save after logout
                }
                break;
            }

            case 2:{
                User* user = login(users , "admin");

                if(user != NULL){
                    user->showMenu(&notesHead , users);
                    files.saveAll(users , notesHead);
                }
                break;
            }

            case 3:{
                int total = users.size();

                for(int i = 0 ; i < total ; i++){
                    delete users[i];
                }

                free_all_notes(&notesHead);

                cout << "Thank you for using Acadex. Bye!!\n";
                return 0;
            }

            default:{
                cout << "Please enter a number from 1 to 3!!\n";
            }
        }
    }
}
