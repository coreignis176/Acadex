@echo off

cd /d "%~dp0"

if not exist bin mkdir bin

echo.
echo ---- Compiling C programs (c folder) ----
for %%F in (c\*.c) do (
    echo %%F
    gcc "%%F" -o "bin\%%~nF_c.exe"
)

echo.
echo ---- Compiling C++ programs (cpp folder) ----
for %%F in (cpp\*.cpp) do (
    echo %%F
    g++ "%%F" -o "bin\%%~nF_cpp.exe"
)

echo.
echo Done. The .exe files are in the bin folder.
pause
