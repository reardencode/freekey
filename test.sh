#!/bin/sh

export PYTHONPATH=./lib

declare -i total=0
declare -i failed=0
for file in lib/freekey/[a-z]*.py; do
    echo -n "$file... "
    python -m doctest $file
    if [ $? ]; then
        echo "done"
    else
        echo "failed"
        failed=$failed+1
    fi
    total=$total+1
done
