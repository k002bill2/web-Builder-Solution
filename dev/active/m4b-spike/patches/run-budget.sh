#!/bin/zsh
set -u
A=$TMPDIR/m4b/appcopy/app
S=$TMPDIR/m4b/scripts
cd $A
npm run build > $TMPDIR/m4b/b0.log 2>&1; echo "b0 exit=$?"
python3 $S/step1.py $A && npm run build > $TMPDIR/m4b/b1.log 2>&1; echo "b1 exit=$?"
mkdir -p src/features/studio/reactZip && cp $TMPDIR/m4b/spike-src/reactZip.ts $TMPDIR/m4b/spike-src/templates.ts src/features/studio/reactZip/
python3 $S/step2.py $A && npm run build > $TMPDIR/m4b/b2.log 2>&1; echo "b2 exit=$?"
