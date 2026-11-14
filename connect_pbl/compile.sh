#!/usr/bin/env bash
# ============================================================
#  compile.sh  -  the Linux version of compile.bat
#
#  The live backend runs on a Linux server (Render).
#  Linux cannot run .exe files, so there we compile the C / C++
#  programs again with this script (Render runs it while building).
#
#  It does the same as compile.bat:
#      c/name.c     ->  bin/name_c      (gcc)
#      cpp/name.cpp ->  bin/name_cpp    (g++)
#  (on Linux there is no ".exe" at the end - runProgram.js knows this)
#
#  HOW TO USE (Linux / Git Bash):   bash connect_pbl/compile.sh
# ============================================================

# stop at the FIRST error, so a broken program can never go live without anyone noticing
set -e

# go to the folder where this file is (so it works from anywhere)
cd "$(dirname "$0")"

mkdir -p bin

echo ""
echo "---- Compiling C programs (c folder) ----"
for file in c/*.c; do
    name=$(basename "$file" .c)          # c/notes_sort.c -> notes_sort
    echo "$file"
    gcc "$file" -o "bin/${name}_c"
done

echo ""
echo "---- Compiling C++ programs (cpp folder) ----"
for file in cpp/*.cpp; do
    name=$(basename "$file" .cpp)        # cpp/validation.cpp -> validation
    echo "$file"
    g++ -std=c++14 "$file" -o "bin/${name}_cpp"
done

echo ""
echo "Done. The programs are in the bin folder:"
ls bin
