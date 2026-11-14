@echo off
REM build.bat -> gcc compiles the C files , g++ joins them with main.cpp into bin\acadex.exe

cd /d "%~dp0"

if not exist obj mkdir obj
if not exist bin mkdir bin

echo.
echo ---- Step 1: C files (DSA) ----

echo c\Subject.c
gcc -Wall -I c -c c\Subject.c -o obj\Subject.o
if errorlevel 1 goto fail

echo c\Note.c
gcc -Wall -I c -c c\Note.c -o obj\Note.o
if errorlevel 1 goto fail

echo c\Stack.c
gcc -Wall -I c -c c\Stack.c -o obj\Stack.o
if errorlevel 1 goto fail

echo c\Queue.c
gcc -Wall -I c -c c\Queue.c -o obj\Queue.o
if errorlevel 1 goto fail

echo.
echo ---- Step 2: C++ (OOP) + joining everything ----

echo cpp\main.cpp
g++ -Wall -std=c++14 -I c cpp\main.cpp obj\Subject.o obj\Note.o obj\Stack.o obj\Queue.o -o bin\acadex.exe
if errorlevel 1 goto fail

echo.
echo Done. Run:  run.bat
pause
exit /b 0

:fail
echo.
echo BUILD FAILED. Upar wali error dekho.
pause
exit /b 1
