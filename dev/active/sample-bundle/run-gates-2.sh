#!/bin/zsh
cd /Users/younghwankang/orca/workspaces/web-builder-solution/sample-bundle/app || exit 9
L=../dev/active/sample-bundle/logs
npm run typecheck > $L/gates-2.txt 2>&1; echo "typecheck EXIT=$?" >> $L/gates-2.txt
npm run lint >> $L/gates-2.txt 2>&1; echo "lint EXIT=$?" >> $L/gates-2.txt
npx vitest run --maxWorkers=2 > $L/vitest-2.txt 2>&1; V=$?; tail -8 $L/vitest-2.txt >> $L/gates-2.txt; echo "vitest EXIT=$V" >> $L/gates-2.txt
npm run build > $L/bundle-2.txt 2>&1; echo "build EXIT=$?" >> $L/gates-2.txt
tail -6 $L/gates-2.txt
