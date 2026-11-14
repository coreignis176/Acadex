# pragma once

# define MAX_SUBJECTS 20
# define MAX_NAME     50

int  addSubject(const char name[]);
int  findSubject(const char name[]);
void showSubjects();
int  getSubjectCount();
const char* getSubject(int index);
