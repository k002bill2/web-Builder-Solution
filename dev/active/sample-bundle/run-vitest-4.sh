#!/bin/zsh
cd /Users/younghwankang/orca/workspaces/web-builder-solution/sample-bundle/app || exit 9
L=../dev/active/sample-bundle/logs
for i in 1 2; do
  npx vitest run --maxWorkers=2 > $L/vitest-4-run$i.txt 2>&1; echo "run$i EXIT=$?" >> $L/vitest-4.txt
  grep -E "FAIL|×|Tests  " $L/vitest-4-run$i.txt | head -20 >> $L/vitest-4.txt
done
cat $L/vitest-4.txt
