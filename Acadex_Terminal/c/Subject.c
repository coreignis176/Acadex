# include <stdio.h>
# include <string.h>
# include "Subject.h"

//? ARRAY of subjects.  static -> only this file can use these two variables
static char subjects[MAX_SUBJECTS][MAX_NAME];
static int  subjectCount = 0;

int findSubject(const char name[]){

    for(int i = 0 ; i < subjectCount ; i++){

        if(strcmp(subjects[i] , name) == 0){
            return i;
        }
    }

    return -1;
}

int addSubject(const char name[]){

    if(subjectCount == MAX_SUBJECTS){
        return 0;
    }

    if(findSubject(name) != -1){
        return -1;
    }

    strcpy(subjects[subjectCount] , name);
    subjectCount++;

    return 1;
}

void showSubjects(){

    if(subjectCount == 0){
        printf("No subjects yet!!\n");
        return;
    }

    printf("\n------ SUBJECTS ------\n");

    for(int i = 0 ; i < subjectCount ; i++){
        printf("%d. %s\n" , i + 1 , subjects[i]);
    }
}

int getSubjectCount(){
    return subjectCount;
}

const char* getSubject(int index){

    if(index < 0 || index >= subjectCount){
        return NULL;
    }

    return subjects[index];
}
