# include <iostream>
# include <string>
# include <vector>
using namespace std;

const int NAME_MIN_LETTERS         = 2;
const int NAME_MAX_LETTERS         = 60;
const int CLASS_ROLL_MIN_LETTERS   = 1;
const int CLASS_ROLL_MAX_LETTERS   = 10;
const int COLLEGE_ROLL_MIN_LETTERS = 4;
const int COLLEGE_ROLL_MAX_LETTERS = 16;
const int MAX_STUDENTS_IN_LIST     = 500;

const string NAME_MESSAGE                 = "Student name must be 2-60 characters";
const string CLASS_ROLL_MISSING_MESSAGE   = "Class roll number is missing";
const string CLASS_ROLL_WRONG_MESSAGE     = "Class roll number can use up to 10 letters, digits or hyphens";
const string COLLEGE_ROLL_MISSING_MESSAGE = "College roll number is missing";
const string COLLEGE_ROLL_WRONG_MESSAGE   = "College roll number must be 4-16 letters, digits or hyphens";

const int PASSWORD_MIN_LETTERS = 8;
const int PASSWORD_MAX_LETTERS = 64;

const string PASSWORD_LENGTH_MESSAGE  = "Your New Password Must Be 8-64 Characters.";
const string PASSWORD_MIX_MESSAGE     = "Your New Password Must Have At Least One Letter And One Number.";
const string PASSWORD_DEFAULT_MESSAGE = "Please Choose A Password Different From The Default One.";

const int SUBJECT_NAME_MIN_LETTERS = 2;
const int SUBJECT_NAME_MAX_LETTERS = 60;
const int SUBJECT_CODE_MIN_LETTERS = 3;
const int SUBJECT_CODE_MAX_LETTERS = 12;

const string SUBJECT_NAME_MESSAGE = "Subject Name Must Be 2-60 Characters.";
const string SUBJECT_CODE_MESSAGE = "Subject Code Must Be 3-12 Letters, Digits Or Hyphens, e.g. TCS355.";

const int TITLE_MIN_LETTERS       = 4;
const int TITLE_MAX_LETTERS       = 80;
const int TOPIC_MIN_LETTERS       = 2;
const int TOPIC_MAX_LETTERS       = 60;
const int DESCRIPTION_MAX_LETTERS = 300;
const int MAX_SUBJECTS_IN_LIST    = 100;

const string TITLE_MESSAGE       = "The Title Must Be 4-80 Characters.";
const string SUBJECT_MESSAGE     = "Please Choose One Of Your Section's Subjects.";
const string TOPIC_MESSAGE       = "The Topic Name Must Be 2-60 Characters.";
const string DESCRIPTION_MESSAGE = "The Description Can Be At Most 300 Characters.";

const string CODE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";

const string ALL_GOOD = "ok";

int countLetters(string text){

    int count = 0;

    for(int i = 0 ; i < (int)text.length() ; i++){

        unsigned char oneByte = text[i];

        bool isExtraByte = (oneByte & 0xC0) == 0x80;
        bool isEmojiStart = oneByte >= 0xF0;

        if(isEmojiStart){
            count = count + 2;
        }
        else if(!isExtraByte){
            count = count + 1;
        }
    }

    return count;
}

class Rule{

    private:
        string message;

    public:
        Rule(string message){
            this->message = message;
        }

        virtual ~Rule(){
        }

        virtual bool check(string text) = 0;

        string getMessage(){
            return message;
        }
};

class NotEmptyRule : public Rule{

    public:
        NotEmptyRule(string message) : Rule(message){
        }

        bool check(string text){
            return text != "";
        }
};

class LengthRule : public Rule{

    private:
        int minLetters;
        int maxLetters;

    public:
        LengthRule(int minLetters , int maxLetters , string message) : Rule(message){
            this->minLetters = minLetters;
            this->maxLetters = maxLetters;
        }

        bool check(string text){
            int letters = countLetters(text);
            return letters >= minLetters && letters <= maxLetters;
        }
};

class HasLetterRule : public Rule{

    public:
        HasLetterRule(string message) : Rule(message){
        }

        bool check(string text){

            for(int i = 0 ; i < (int)text.length() ; i++){

                char letter = text[i];

                if((letter >= 'a' && letter <= 'z') || (letter >= 'A' && letter <= 'Z')){
                    return true;
                }
            }

            return false;
        }
};

class HasDigitRule : public Rule{

    public:
        HasDigitRule(string message) : Rule(message){
        }

        bool check(string text){

            for(int i = 0 ; i < (int)text.length() ; i++){

                if(text[i] >= '0' && text[i] <= '9'){
                    return true;
                }
            }

            return false;
        }
};

class AllowedLettersRule : public Rule{

    private:
        string allowedLetters;

    public:
        AllowedLettersRule(string allowedLetters , string message) : Rule(message){
            this->allowedLetters = allowedLetters;
        }

        bool check(string text){

            for(int i = 0 ; i < (int)text.length() ; i++){

                if(allowedLetters.find(text[i]) == string::npos){
                    return false;
                }
            }

            return true;
        }
};

class NotSameAsRule : public Rule{

    private:
        string blockedText;

    public:
        NotSameAsRule(string blockedText , string message) : Rule(message){
            this->blockedText = blockedText;
        }

        bool check(string text){
            return text != blockedText;
        }
};

class InListRule : public Rule{

    private:
        vector<string> list;

    public:
        InListRule(vector<string> list , string message) : Rule(message){
            this->list = list;
        }

        bool check(string text){

            for(int i = 0 ; i < (int)list.size() ; i++){

                if(list[i] == text){
                    return true;
                }
            }

            return false;
        }
};

class Field{

    private:
        vector<Rule*> rules;

    public:
        Field(){
        }

        Field(const Field&) = delete;
        Field& operator=(const Field&) = delete;

        ~Field(){
            for(int i = 0 ; i < (int)rules.size() ; i++){
                delete rules[i];
            }
        }

        void addRule(Rule* rule){
            rules.push_back(rule);
        }

        string firstProblem(string text){

            for(int i = 0 ; i < (int)rules.size() ; i++){

                if(rules[i]->check(text) == false){
                    return rules[i]->getMessage();
                }
            }

            return "";
        }
};

bool readOneLine(string &line){

    if(!getline(cin , line)){
        return false;
    }

    while(!line.empty() && (line[line.length() - 1] == '\r' || line[line.length() - 1] == '\n')){
        line.erase(line.length() - 1);
    }

    return true;
}

bool readCount(int &number , int maxNumber){

    string line;

    if(!readOneLine(line) || line == "" || line.length() > 6){
        return false;
    }

    for(int i = 0 ; i < (int)line.length() ; i++){

        if(line[i] < '0' || line[i] > '9'){
            return false;
        }
    }

    number = stoi(line);

    return number <= maxNumber;
}

void printAnswer(string problem){

    if(problem == ""){
        cout << ALL_GOOD << "\n";
    }
    else{
        cout << problem << "\n";
    }
}

class Form{

    public:
        virtual ~Form(){
        }

        virtual bool readAndCheck() = 0;
};

class StudentForm : public Form{

    private:
        Field nameField;
        Field classRollField;
        Field collegeRollField;

    public:
        StudentForm(){
            nameField.addRule(new LengthRule(NAME_MIN_LETTERS , NAME_MAX_LETTERS , NAME_MESSAGE));
            nameField.addRule(new HasLetterRule(NAME_MESSAGE));

            classRollField.addRule(new NotEmptyRule(CLASS_ROLL_MISSING_MESSAGE));
            classRollField.addRule(new LengthRule(CLASS_ROLL_MIN_LETTERS , CLASS_ROLL_MAX_LETTERS , CLASS_ROLL_WRONG_MESSAGE));
            classRollField.addRule(new AllowedLettersRule(CODE_LETTERS , CLASS_ROLL_WRONG_MESSAGE));

            collegeRollField.addRule(new NotEmptyRule(COLLEGE_ROLL_MISSING_MESSAGE));
            collegeRollField.addRule(new LengthRule(COLLEGE_ROLL_MIN_LETTERS , COLLEGE_ROLL_MAX_LETTERS , COLLEGE_ROLL_WRONG_MESSAGE));
            collegeRollField.addRule(new AllowedLettersRule(CODE_LETTERS , COLLEGE_ROLL_WRONG_MESSAGE));
        }

        string findProblem(string name , string classRollNo , string collegeRollNo){

            string problem = nameField.firstProblem(name);

            if(problem == ""){
                problem = classRollField.firstProblem(classRollNo);
            }

            if(problem == ""){
                problem = collegeRollField.firstProblem(collegeRollNo);
            }

            return problem;
        }

        bool readAndCheck(){

            string name;
            string classRollNo;
            string collegeRollNo;

            if(!readOneLine(name) || !readOneLine(classRollNo) || !readOneLine(collegeRollNo)){
                cerr << "Student form needs 3 lines: name , class roll no , college roll no.\n";
                return false;
            }

            printAnswer(findProblem(name , classRollNo , collegeRollNo));
            return true;
        }
};

class StudentListForm : public Form{

    private:
        StudentForm oneStudent;

    public:
        bool readAndCheck(){

            int studentCount = 0;

            if(!readCount(studentCount , MAX_STUDENTS_IN_LIST)){
                cerr << "Students form: line 2 must be the number of students (0 to " << MAX_STUDENTS_IN_LIST << ").\n";
                return false;
            }

            vector<string> answers;

            for(int number = 1 ; number <= studentCount ; number++){

                string name;
                string classRollNo;
                string collegeRollNo;

                if(!readOneLine(name) || !readOneLine(classRollNo) || !readOneLine(collegeRollNo)){
                    cerr << "Students form: expected " << studentCount << " students , but student " << number << " is not complete.\n";
                    return false;
                }

                string problem = oneStudent.findProblem(name , classRollNo , collegeRollNo);

                if(problem == ""){
                    answers.push_back(ALL_GOOD);
                }
                else{
                    answers.push_back(problem);
                }
            }

            for(int i = 0 ; i < (int)answers.size() ; i++){
                cout << answers[i] << "\n";
            }

            return true;
        }
};

class PasswordForm : public Form{

    private:
        Field passwordField;

    public:
        bool readAndCheck(){

            string newPassword;
            string defaultPassword;

            if(!readOneLine(newPassword) || !readOneLine(defaultPassword)){
                cerr << "Password form needs 2 lines: new password , default password.\n";
                return false;
            }

            passwordField.addRule(new LengthRule(PASSWORD_MIN_LETTERS , PASSWORD_MAX_LETTERS , PASSWORD_LENGTH_MESSAGE));
            passwordField.addRule(new HasLetterRule(PASSWORD_MIX_MESSAGE));
            passwordField.addRule(new HasDigitRule(PASSWORD_MIX_MESSAGE));
            passwordField.addRule(new NotSameAsRule(defaultPassword , PASSWORD_DEFAULT_MESSAGE));

            printAnswer(passwordField.firstProblem(newPassword));
            return true;
        }
};

class SubjectForm : public Form{

    private:
        Field nameField;
        Field codeField;

    public:
        SubjectForm(){
            nameField.addRule(new LengthRule(SUBJECT_NAME_MIN_LETTERS , SUBJECT_NAME_MAX_LETTERS , SUBJECT_NAME_MESSAGE));

            codeField.addRule(new LengthRule(SUBJECT_CODE_MIN_LETTERS , SUBJECT_CODE_MAX_LETTERS , SUBJECT_CODE_MESSAGE));
            codeField.addRule(new AllowedLettersRule(CODE_LETTERS , SUBJECT_CODE_MESSAGE));
        }

        bool readAndCheck(){

            string name;
            string code;

            if(!readOneLine(name) || !readOneLine(code)){
                cerr << "Subject form needs 2 lines: subject name , subject code.\n";
                return false;
            }

            string problem = nameField.firstProblem(name);

            if(problem == ""){
                problem = codeField.firstProblem(code);
            }

            printAnswer(problem);
            return true;
        }
};

class NoteForm : public Form{

    private:
        Field titleField;
        Field subjectField;
        Field topicField;
        Field descriptionField;

    public:
        NoteForm(){
            titleField.addRule(new LengthRule(TITLE_MIN_LETTERS , TITLE_MAX_LETTERS , TITLE_MESSAGE));
            topicField.addRule(new LengthRule(TOPIC_MIN_LETTERS , TOPIC_MAX_LETTERS , TOPIC_MESSAGE));
            descriptionField.addRule(new LengthRule(0 , DESCRIPTION_MAX_LETTERS , DESCRIPTION_MESSAGE));
        }

        bool readAndCheck(){

            string title;
            string topic;
            string description;
            string chosenSubject;
            int subjectCount = 0;

            if(!readOneLine(title) || !readOneLine(topic) || !readOneLine(description) || !readOneLine(chosenSubject)){
                cerr << "Note form needs: title , topic , description , chosen subject.\n";
                return false;
            }

            if(!readCount(subjectCount , MAX_SUBJECTS_IN_LIST)){
                cerr << "Note form: after the chosen subject comes the number of subjects (0 to " << MAX_SUBJECTS_IN_LIST << ").\n";
                return false;
            }

            vector<string> subjects;

            for(int number = 1 ; number <= subjectCount ; number++){

                string subject;

                if(!readOneLine(subject)){
                    cerr << "Note form: expected " << subjectCount << " subjects , but got only " << number - 1 << ".\n";
                    return false;
                }

                subjects.push_back(subject);
            }

            subjectField.addRule(new InListRule(subjects , SUBJECT_MESSAGE));

            string problem = titleField.firstProblem(title);

            if(problem == ""){
                problem = subjectField.firstProblem(chosenSubject);
            }

            if(problem == ""){
                problem = topicField.firstProblem(topic);
            }

            if(problem == ""){
                problem = descriptionField.firstProblem(description);
            }

            printAnswer(problem);
            return true;
        }
};

int main(){

    string formName;

    if(!readOneLine(formName)){
        cerr << "No form name given. Send: student , students , password , subject or note.\n";
        return 1;
    }

    Form* form = NULL;

    if(formName == "student"){
        form = new StudentForm();
    }
    else if(formName == "students"){
        form = new StudentListForm();
    }
    else if(formName == "password"){
        form = new PasswordForm();
    }
    else if(formName == "subject"){
        form = new SubjectForm();
    }
    else if(formName == "note"){
        form = new NoteForm();
    }
    else{
        cerr << "Unknown form. Send: student , students , password , subject or note.\n";
        return 1;
    }

    bool inputWasFine = form->readAndCheck();

    delete form;

    if(inputWasFine){
        return 0;
    }

    return 1;
}
