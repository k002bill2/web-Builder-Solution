#!/bin/zsh
# 바이트 단위 번들 출력(빌드 산출 dist 재사용, 판정 아님): check-bundle-size 사본에서 KB 환산·toFixed 만 바꾼다. 사용: bytes.sh <로그이름>
set -u
ROOT=/Users/younghwankang/orca/workspaces/web-builder-solution/m2b-4b
T=$(mktemp -d)
sed 's#/ 1000;#;#; s#new URL("../dist/", import.meta.url)#new URL("file://'$ROOT'/app/dist/")#' $ROOT/app/scripts/check-bundle-size.mjs > $T/check.mjs
sed 's#`${kb.toFixed(2)}KB`#`${kb} B`#' $ROOT/app/scripts/bundleBudget.mjs > $T/bundleBudget.mjs
node $T/check.mjs 2>&1 | grep -E "^\[bundle\] (/|렌더|공통)" | grep -v "예산 검사 실패" > $ROOT/dev/active/m2b-4b/logs/$1.txt
rm -rf $T
grep -E "렌더 문서|/studio|/compare 첫" $ROOT/dev/active/m2b-4b/logs/$1.txt
