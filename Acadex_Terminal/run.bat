@echo off
REM run.bat -> runs Acadex from this folder , so the data folder is always found

cd /d "%~dp0"

if not exist bin\acadex.exe (
    echo bin\acadex.exe nahi mila. Pehle build.bat chalao.
    pause
    exit /b 1
)

if not exist data mkdir data

bin\acadex.exe
pause
