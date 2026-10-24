#!/bin/zsh
cd /Users/younghwankang/orca/workspaces/web-builder-solution/sample-copy/app || exit 9
L=../dev/active/sample-copy/logs
: > $L/gates-j.txt
npm run typecheck > /dev/null 2>&1; echo "typecheck EXIT=$?" >> $L/gates-j.txt
npm run lint > /dev/null 2>&1; echo "lint EXIT=$?" >> $L/gates-j.txt
npx vitest run --maxWorkers=2 > $L/vitest-j.txt 2>&1; V=$?; grep -E "FAIL|×|Tests  |Test Files" $L/vitest-j.txt >> $L/gates-j.txt; echo "vitest EXIT=$V" >> $L/gates-j.txt
npm run build > $L/bundle-j.txt 2>&1; echo "build EXIT=$?" >> $L/gates-j.txt; grep -E "예산 검사|해시 정규화 진입" $L/bundle-j.txt >> $L/gates-j.txt
cat $L/gates-j.txt
