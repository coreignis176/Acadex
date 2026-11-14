# include <iostream>
# include <string>
using namespace std;


int main(){


    string message;



    if(!getline(cin , message)){
        cout << "C++ program got nothing" << endl;
        return 0;
    }



    if(!message.empty() && message[message.size() - 1] == '\r'){
        message.erase(message.size() - 1);
    }



    cout << "C++ program got: " << message << endl;


    return 0;
}
