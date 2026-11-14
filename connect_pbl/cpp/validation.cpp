/*
============================================================
 validation.cpp
============================================================

 WHAT THIS PROGRAM DOES
 ----------------------
 It checks if a form on the website is filled correctly.
 The backend sends the form here, this program answers "ok" or the problem.

     Admin adds a student:
         Name         : R            <- too short
         Class roll   : 12
         College roll : 2510121

     Answer: Student name must be 2-60 characters


 WHERE IT IS USED  (connected through backend/connect_pbl/validation.js)
 ----------------------------------------------------------------------
     | Form       | Website                                   | Backend                                  |
     |------------|-------------------------------------------|------------------------------------------|
     | student    | admin adds a student , edits a student    | adminController.js  addstudent ,         |
     |            |                                           |                     updatestudent        |
     | students   | admin makes a section from a CSV file     | adminController.js  addsection           |
     | password   | a student changes the password            | UserController.js   changepassword       |
     | subject    | admin adds / edits a subject              | adminController.js  addsubject ,         |
     |            |                                           |                     updatesubject        |
     | note       | a student uploads notes                   | notesController.js  submitnote           |

     If this program does not work, the backend uses its old JavaScript check,
     so the website never stops. (the backend console says why)


 OOP USED IN THIS FILE
 ---------------------
     | OOP idea              | Where in this file                                          |
     |-----------------------|-------------------------------------------------------------|
     | Abstract class        | Rule  (check() = 0)   and   Form  (readAndCheck() = 0)      |
     | Inheritance           | 7 rules are children of Rule ,  5 forms are children of Form|
     | Runtime polymorphism  | Field calls rule->check()   ,   main calls form->readAndCheck()|
     |                       | (they never know WHICH child it is)                         |
     | Encapsulation         | every class keeps its data private                          |
     | Composition           | a Field HAS rules , a Form HAS fields ,                     |
     |                       | StudentListForm HAS a StudentForm                           |
     | Constructor           | every rule gets its limits and message in the constructor   |
     | Destructor            | ~Field() deletes its rules , main deletes the form          |
     | Vector (STL)          | vector<Rule*> , vector<string>                              |


 THE IDEA IN ONE PICTURE
 -----------------------
                                  Rule   (abstract: check)
          /         |          |         |           |            |          \
   NotEmpty     Length     HasLetter  HasDigit  AllowedLetters  NotSameAs   InList

                                  Form   (abstract: readAndCheck)
          /            |              |              |              \
   StudentForm  StudentListForm  PasswordForm   SubjectForm      NoteForm

     One Field = a list of rules. Example:
         Name         = [ Length(2,60) , HasLetter ]
         Password     = [ Length(8,64) , HasLetter , HasDigit , NotSameAs(default password) ]

     ONE loop checks all the rules of a field. The FIRST rule that fails gives its message.
     A new rule later? -> write ONE new child class. The old code does not change.


 WHAT THE PROGRAM GETS  (INPUT - the backend types it, like a keyboard)
 ----------------------------------------------------------------------
     line 1 = the form name , then the lines of that form:

     student   ->  name , class roll no , college roll no
     students  ->  how many students , then 3 lines for EACH student (like "student")
     password  ->  new password , default password (the new one must be different)
     subject   ->  subject name , subject code
     note      ->  title , topic , description (can be an empty line) , chosen subject ,
                   how many subjects the section has , then one subject name per line


 WHAT THE PROGRAM GIVES BACK  (OUTPUT)
 -------------------------------------
     ok                      <- everything is correct
     or the FIRST problem    e.g.  Class roll number is missing

     students -> one answer line for EACH student (ok or the problem)

     If the input itself is wrong (unknown form , lines missing ...)
     it writes an error on stderr and stops with  return 1.
     (it NEVER writes the values it got, because a password can be one of them)


 EXAMPLES
 --------
     | INPUT (one line each)                     | OUTPUT                                       |
     |-------------------------------------------|----------------------------------------------|
     | student , Rahul Singh , 12 , 2510121      | ok                                           |
     | student , R , 12 , 2510121                | Student name must be 2-60 characters         |
     | password , abcdefgh , Acadex@123          | Your New Password Must Have At Least One ... |
     | subject , DBMS , TCS 355                  | Subject Code Must Be 3-12 Letters, ...       |
     | note , Stack basics , Stack , (empty) ,   | ok                                           |
     |   DBMS , 2 , DBMS , Maths                 |                                              |


 HOW TO TEST IT IN THE TERMINAL
 ------------------------------
     1. double click  connect_pbl/compile.bat   ->  makes  bin/validation_cpp.exe
     2. open a terminal:
            cd /d R:\Acadex\connect_pbl
            bin\validation_cpp.exe
     3. type the lines (like the examples above), pressing Enter after each line
        (on Windows press Ctrl+Z and Enter at the end if it waits for more)
============================================================
*/


# include <iostream>
# include <string>
# include <vector>
using namespace std;




// ================= THE LIMITS AND MESSAGES (change them only here) =================
// they are the SAME as the old JavaScript checks in the backend (backend/utils/helpers.js)
// so the website shows the same messages as before


// ---------- student ----------
const int NAME_MIN_LETTERS         = 2;
const int NAME_MAX_LETTERS         = 60;
const int CLASS_ROLL_MIN_LETTERS   = 1;
const int CLASS_ROLL_MAX_LETTERS   = 10;
const int COLLEGE_ROLL_MIN_LETTERS = 4;
const int COLLEGE_ROLL_MAX_LETTERS = 16;
const int MAX_STUDENTS_IN_LIST     = 500;           // the most students one CSV file can have

const string NAME_MESSAGE                 = "Student name must be 2-60 characters";
const string CLASS_ROLL_MISSING_MESSAGE   = "Class roll number is missing";
const string CLASS_ROLL_WRONG_MESSAGE     = "Class roll number can use up to 10 letters, digits or hyphens";
const string COLLEGE_ROLL_MISSING_MESSAGE = "College roll number is missing";
const string COLLEGE_ROLL_WRONG_MESSAGE   = "College roll number must be 4-16 letters, digits or hyphens";


// ---------- password ----------
const int PASSWORD_MIN_LETTERS = 8;
const int PASSWORD_MAX_LETTERS = 64;

const string PASSWORD_LENGTH_MESSAGE  = "Your New Password Must Be 8-64 Characters.";
const string PASSWORD_MIX_MESSAGE     = "Your New Password Must Have At Least One Letter And One Number.";
const string PASSWORD_DEFAULT_MESSAGE = "Please Choose A Password Different From The Default One.";


// ---------- subject ----------
const int SUBJECT_NAME_MIN_LETTERS = 2;
const int SUBJECT_NAME_MAX_LETTERS = 60;
const int SUBJECT_CODE_MIN_LETTERS = 3;
const int SUBJECT_CODE_MAX_LETTERS = 12;

const string SUBJECT_NAME_MESSAGE = "Subject Name Must Be 2-60 Characters.";
const string SUBJECT_CODE_MESSAGE = "Subject Code Must Be 3-12 Letters, Digits Or Hyphens, e.g. TCS355.";


// ---------- note ----------
const int TITLE_MIN_LETTERS       = 4;
const int TITLE_MAX_LETTERS       = 80;
const int TOPIC_MIN_LETTERS       = 2;
const int TOPIC_MAX_LETTERS       = 60;
const int DESCRIPTION_MAX_LETTERS = 300;
const int MAX_SUBJECTS_IN_LIST    = 100;            // a section has at most 20 , 100 is a safe limit

const string TITLE_MESSAGE       = "The Title Must Be 4-80 Characters.";
const string SUBJECT_MESSAGE     = "Please Choose One Of Your Section's Subjects.";
const string TOPIC_MESSAGE       = "The Topic Name Must Be 2-60 Characters.";
const string DESCRIPTION_MESSAGE = "The Description Can Be At Most 300 Characters.";


// ---------- shared ----------
// roll numbers and subject codes can have only these letters: capital A-Z , 0-9 , and -
const string CODE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";

const string ALL_GOOD = "ok";




// ================= HELPER =================


//$ count the letters of a text , the SAME way JavaScript counts text.length
// a normal letter (a , Z , 5)        is 1 byte  -> counts 1
// a letter like é or a Hindi letter  is 2 or 3 bytes (UTF-8) -> counts 1
// an emoji                           is 4 bytes -> counts 2 (JavaScript also counts 2)
// text.length() in C++ counts BYTES , so "José" would be 5 , but JavaScript says 4.
//
// how: every letter starts with a FIRST byte , the extra bytes look like 10xxxxxx in binary
int countLetters(string text){

    int count = 0;

    for(int i = 0 ; i < (int)text.length() ; i++){

        unsigned char oneByte = text[i];

        bool isExtraByte = (oneByte & 0xC0) == 0x80;       // 0xC0 = 11000000 , 0x80 = 10000000
        bool isEmojiStart = oneByte >= 0xF0;               // 11110xxx = the first byte of a 4-byte letter

        if(isEmojiStart){
            count = count + 2;
        }
        else if(!isExtraByte){
            count = count + 1;
        }
    }

    return count;
}




// ================= PARENT CLASS: Rule (ABSTRACT) =================

class Rule{

    private:
        string message;                         //? what to show when this rule fails

    public:
        Rule(string message){
            this->message = message;
        }

        //? virtual destructor -> "delete rule" also runs the CHILD's destructor
        virtual ~Rule(){
        }

        //? PURE VIRTUAL: every child MUST write its own check()
        //? true = text is fine , false = rule failed
        virtual bool check(string text) = 0;

        string getMessage(){
            return message;
        }
};




// ================= CHILD RULES (INHERITANCE) =================


//? rule: the text must not be empty
class NotEmptyRule : public Rule{

    public:
        NotEmptyRule(string message) : Rule(message){
        }

        bool check(string text){
            return text != "";
        }
};




//? rule: the text must have minLetters to maxLetters letters
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




//? rule: the text must have at least ONE English letter (a-z or A-Z)
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




//? rule: the text must have at least ONE digit (0-9)
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




//? rule: EVERY letter of the text must be one of allowedLetters
class AllowedLettersRule : public Rule{

    private:
        string allowedLetters;

    public:
        AllowedLettersRule(string allowedLetters , string message) : Rule(message){
            this->allowedLetters = allowedLetters;
        }

        bool check(string text){

            for(int i = 0 ; i < (int)text.length() ; i++){

                //? find() gives string::npos when the letter is NOT in allowedLetters
                if(allowedLetters.find(text[i]) == string::npos){
                    return false;
                }
            }

            return true;
        }
};




//? rule: the text must NOT be the same as one blocked text (e.g. the default password)
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




//? rule: the text must be one of a list (e.g. the subjects of the section)
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




// ================= Field (COMPOSITION: a Field HAS rules) =================

class Field{

    private:
        vector<Rule*> rules;                    //? Rule* -> one list can hold ANY child rule

    public:
        Field(){
        }

        //? a Field must not be copied , or two Fields would delete the same rules
        Field(const Field&) = delete;
        Field& operator=(const Field&) = delete;

        //? the rules were made with "new" , so the Field deletes them
        ~Field(){
            for(int i = 0 ; i < (int)rules.size() ; i++){
                delete rules[i];
            }
        }

        void addRule(Rule* rule){
            rules.push_back(rule);
        }

        //? POLYMORPHISM: we call check() and every rule runs ITS OWN check()
        //? gives back the message of the FIRST rule that fails , or "" if all are fine
        string firstProblem(string text){

            for(int i = 0 ; i < (int)rules.size() ; i++){

                if(rules[i]->check(text) == false){
                    return rules[i]->getMessage();
                }
            }

            return "";
        }
};




// ================= READING THE INPUT =================


//$ reads ONE line into  line
// removes the Enter key at the end ('\n' , and '\r' on Windows)
// nothing else is removed (a password can end with a space)
// gives back true if a line was read , false if there was nothing more to read
bool readOneLine(string &line){

    if(!getline(cin , line)){
        return false;
    }

    while(!line.empty() && (line[line.length() - 1] == '\r' || line[line.length() - 1] == '\n')){
        line.erase(line.length() - 1);
    }

    return true;
}




//$ reads ONE line that must be a number from 0 to maxNumber
// gives back true if it worked (the number is put in  number)
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

    number = stoi(line);                    //? stoi = "string to int" , e.g. "12" -> 12

    return number <= maxNumber;
}




//$ prints the answer: "ok" when there is no problem , otherwise the problem
void printAnswer(string problem){

    if(problem == ""){
        cout << ALL_GOOD << "\n";
    }
    else{
        cout << problem << "\n";
    }
}




// ================= PARENT CLASS: Form (ABSTRACT) =================

class Form{

    public:
        virtual ~Form(){
        }

        //? PURE VIRTUAL: every form reads its own lines and prints its own answer
        //? gives back true if the input was fine , false if the input was wrong
        virtual bool readAndCheck() = 0;
};




// ================= CHILD FORMS (INHERITANCE) =================


//? form "student": name , class roll no , college roll no
class StudentForm : public Form{

    private:
        Field nameField;
        Field classRollField;
        Field collegeRollField;

    public:
        //? the constructor gives every field its rules
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

        //? check one student , stop at the first problem ("" = no problem)
        //? StudentListForm also uses this for every row of the CSV file
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

        //? reads the 3 lines of one student and prints the answer
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




//? form "students": many students at once (the CSV file of a new section)
//? it HAS a StudentForm and asks it about every student (COMPOSITION)
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

            // read EVERY student first , so a broken input prints no half answer
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




//? form "password": the new password + the default password
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

            // the default password comes from the backend , so this rule is added after reading it
            passwordField.addRule(new LengthRule(PASSWORD_MIN_LETTERS , PASSWORD_MAX_LETTERS , PASSWORD_LENGTH_MESSAGE));
            passwordField.addRule(new HasLetterRule(PASSWORD_MIX_MESSAGE));
            passwordField.addRule(new HasDigitRule(PASSWORD_MIX_MESSAGE));
            passwordField.addRule(new NotSameAsRule(defaultPassword , PASSWORD_DEFAULT_MESSAGE));

            printAnswer(passwordField.firstProblem(newPassword));
            return true;
        }
};




//? form "subject": subject name + subject code
//? (the check "is this subject already in the section?" stays in the backend ,
//?  because its message needs the names saved in the database)
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




//? form "note": title , topic , description , chosen subject + the section's subjects
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

            // the list of subjects comes from the backend , so this rule is added after reading it
            subjectField.addRule(new InListRule(subjects , SUBJECT_MESSAGE));

            // the same order as the old JavaScript check: title , subject , topic , description
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


    // ---------- STEP 1: read which form to check ----------
    if(!readOneLine(formName)){
        cerr << "No form name given. Send: student , students , password , subject or note.\n";
        return 1;
    }


    // ---------- STEP 2: make the right Form object ----------
    Form* form = NULL;                      //? Form* can point to ANY child form

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


    // ---------- STEP 3: POLYMORPHISM - the form reads and checks ITSELF ----------
    bool inputWasFine = form->readAndCheck();

    delete form;                            //? virtual destructor -> the child's fields are freed too


    if(inputWasFine){
        return 0;
    }

    return 1;
}
