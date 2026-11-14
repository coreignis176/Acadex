@echo off
REM ============================================================
REM  compile.bat
REM
REM  The computer cannot run a .c or .cpp file directly.
REM  First we must COMPILE it: turn the code into a .exe file.
REM
REM  This file compiles every program in the  c  and  cpp  folders
REM  and puts the .exe files in the  bin  folder.
REM  The backend runs the .exe files from that  bin  folder.
REM
REM  HOW TO USE: double click this file
REM              (or open a terminal in this folder and type  compile.bat )
REM
REM  Run it again every time you change a .c or .cpp file.
REM ============================================================

REM go to the folder where this file is (so it works from anywhere)
cd /d "%~dp0"

REM make the bin folder if it is not there yet
if not exist bin mkdir bin

echo.
echo ---- Compiling C programs (c folder) ----
REM for every .c file:  gcc  name.c  -o  bin\name_c.exe
REM %%~nF means "the file name without .c"
for %%F in (c\*.c) do (
    echo %%F
    gcc "%%F" -o "bin\%%~nF_c.exe"
)

echo.
echo ---- Compiling C++ programs (cpp folder) ----
REM for every .cpp file:  g++  name.cpp  -o  bin\name_cpp.exe
for %%F in (cpp\*.cpp) do (
    echo %%F
    g++ "%%F" -o "bin\%%~nF_cpp.exe"
)

echo.
echo Done. The .exe files are in the bin folder.
pause
