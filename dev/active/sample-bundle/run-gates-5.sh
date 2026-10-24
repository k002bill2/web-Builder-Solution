#!/bin/zsh
cd /Users/younghwankang/orca/workspaces/web-builder-solution/sample-bundle/app || exit 9
L=../dev/active/sample-bundle/logs
: > $L/gates-5.txt
npm run typecheck > /dev/null 2>&1; echo "typecheck EXIT=$?" >> $L/gates-5.txt
npm run lint > /dev/null 2>&1; echo "lint EXIT=$?" >> $L/gates-5.txt
npx vitest run --maxWorkers=2 > $L/vitest-5.txt 2>&1; V=$?; grep -E "FAIL|×|Tests  |Test Files" $L/vitest-5.txt >> $L/gates-5.txt; echo "vitest EXIT=$V" >> $L/gates-5.txt
npm run build > $L/bundle-5.txt 2>&1; echo "build EXIT=$?" >> $L/gates-5.txt; grep -E "예산 검사|해시 정규화 진입" $L/bundle-5.txt >> $L/gates-5.txt
cat $L/gates-5.txt
