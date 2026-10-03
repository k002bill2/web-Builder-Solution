#!/bin/zsh
# 체크포인트 게이트: 표적 test + 가드 전체(src/test + engineImportGuard + renderImportGuard) + typecheck + lint + build(번들)
# 사용: gate.sh <로그이름> [표적 테스트 경로...] — 하나라도 실패하면 exit 1 (3a gate.sh는 항상 0이었다)
set -u
GUARD_EXTRA=${GUARD_EXTRA:-src/render/renderImportGuard.test.ts}
NAME=$1; shift
ROOT=/Users/younghwankang/orca/workspaces/web-builder-solution/m2a-3b
LOG=$ROOT/dev/active/m2a-3b/logs/$NAME.txt
cd $ROOT/app
{
  echo "## targets: $*"; [ $# -gt 0 ] && { npx vitest run "$@" 2>&1 | tail -15; echo "targets exit=${pipestatus[1]}"; }
  echo "## guards"; npx vitest run src/test src/engine/engineImportGuard.test.ts $GUARD_EXTRA 2>&1 | tail -6; echo "guards exit=${pipestatus[1]}"
  echo "## typecheck"; npm run typecheck >/dev/null 2>&1; echo "typecheck exit=$?"
  echo "## lint"; npm run lint 2>&1 | tail -15; echo "lint exit=${pipestatus[1]}"
  echo "## build"; npm run build 2>&1 | grep -E "\[bundle\]|error|Error" | grep -v "조작 뒤 src/(features/compare|data/memory|domain)" ; echo "build exit=${pipestatus[1]}"
} > $LOG 2>&1
grep -E "exit=|Tests |\[bundle\] (공통|/|렌더)|앱과 공유" $LOG
if grep -E "exit=[1-9]" $LOG >/dev/null; then echo "GATE FAIL"; exit 1; fi
echo "GATE OK"; exit 0
