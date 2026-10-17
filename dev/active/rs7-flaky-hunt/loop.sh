#!/bin/bash
# usage: loop.sh <label> <count> [extra vitest args...]
LABEL=$1; N=$2; shift 2
D=/Users/younghwankang/orca/workspaces/web-builder-solution/rs7-flaky-hunt/dev/active/rs7-flaky-hunt/logs
cd /Users/younghwankang/orca/workspaces/web-builder-solution/rs7-flaky-hunt/app
for i in $(seq 1 $N); do
  START=$(date +%s)
  J=$D/$LABEL-$i.json
  npx vitest run --reporter=default --reporter=json --outputFile.json=$J "$@" > $D/$LABEL-$i.out 2>&1
  RC=$?
  END=$(date +%s)
  SUMMARY=$(grep -E '^ +Tests ' $D/$LABEL-$i.out | tail -1 | sed 's/\x1b\[[0-9;]*m//g')
  echo "[$LABEL #$i] rc=$RC $((END-START))s args='$*' $SUMMARY" >> $D/runs.txt
  if [ $RC -ne 0 ]; then
    node -e '
const r=require(process.argv[1]);
for(const f of r.testResults){ if(f.status!=="passed"&&f.assertionResults.every(a=>a.status!=="failed")) console.log("  FILE-FAIL",f.name,(f.message||"").slice(0,1500));
 for(const a of f.assertionResults) if(a.status==="failed") console.log("  FAIL",f.name,"::",a.fullName,"\n    ",(a.failureMessages||[]).join("\n").slice(0,2500).replace(/\n/g,"\n     "));}
' $J >> $D/runs.txt 2>&1
  else
    rm -f $J
    rm -f $D/$LABEL-$i.out
  fi
done
echo "[$LABEL] DONE" >> $D/runs.txt
