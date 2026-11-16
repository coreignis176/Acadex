#!/usr/bin/env bash

set -e

cd "$(dirname "$0")"

mkdir -p bin

echo ""
echo "---- Compiling C programs (c folder) ----"
for file in c/*.c; do
    name=$(basename "$file" .c)
    echo "$file"
    gcc "$file" -o "bin/${name}_c"
done

echo ""
echo "---- Compiling C++ programs (cpp folder) ----"
for file in cpp/*.cpp; do
    name=$(basename "$file" .cpp)
    echo "$file"
    g++ -std=c++14 "$file" -o "bin/${name}_cpp"
done

echo ""
echo "Done. The programs are in the bin folder:"
ls bin
