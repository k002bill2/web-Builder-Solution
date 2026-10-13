#!/bin/bash
# 하네스 코어 mutation 실행 — 원본 읽기 전용. /tmp 복사본에만 변경을 가하고 하네스 23건을 돌린다.
set -u
ROOT=$(cd "$(dirname "$0")/../../../.." && pwd)
H=$ROOT/dev/active/save-core-harness
W=/tmp/save-core-qa-mut
OUT=$ROOT/dev/active/save-core-qa/rawlogs/mutations.txt
: > "$OUT"
sub() { perl -pi -e 'BEGIN{$f=shift;$t=shift} s/\Q$f\E/$t/g' "$1" "$2" "$W/core/saveCore.ts"; }
reset() {
  rm -rf "$W"; mkdir -p "$W"; cp -R "$H/core" "$H/test" "$W/"
  perl -pi -e "s#\\.\\./\\.\\./\\.\\./\\.\\./app/#$ROOT/app/#g" "$W"/core/*.ts "$W"/test/*.ts
  cat > "$W/vitest.config.mjs" <<CFG
export default { root: "$W", resolve: { alias: { vitest: "$ROOT/app/node_modules/vitest/dist/index.js" } }, server: { fs: { allow: ["$ROOT", "$W"] } }, test: { environment: "node", include: ["test/**/*.test.ts"], sequence: { shuffle: false, seed: 1 }, dangerouslyIgnoreUnhandledErrors: false } };
CFG
}
run() {
  local name=$1
  local log; log=$("$ROOT/app/node_modules/.bin/vitest" run --config "$W/vitest.config.mjs" 2>&1); local code=$?
  local changed; changed=$(diff "$H/core/saveCore.ts" <(perl -pe "s#$ROOT/app/#../../../../app/#g" "$W/core/saveCore.ts") | grep -c '^[<>]')
  echo "=== $name | exit $code | changed-lines $changed | $(echo "$log" | grep -E '^ +Tests ' | tr -s ' ')" >> "$OUT"
  echo "$log" | grep -E '^ +(×|FAIL)|✗| ✕ ' | head -8 >> "$OUT"
}
reset; run "M0 원본(무변경 대조)"
reset; sub 'if (mark !== entered) return { status: "newer", receipt: { ...proof, proof: "fresh" } };' ''; run "M1 confirm wrote:false 진입 mark 재확인 삭제"
reset; sub 'if (mark !== entered) return { status: "blocked", reason: "newer" };' ''; run "M2 discard 진입 mark 재확인 삭제"
reset; sub 'if ((prev?.generation ?? 0) !== (confirmed?.generation ?? 0)) return { status: "failed", reason: "stale", newer: mark > submitted };' ''; run "M3 save 예상 세대(stale) 검사 삭제"
reset; sub 'if (inflight > 0) return { status: "rejected", reason: "inflight" };
    if (!persistence) return { status: "blocked"' 'if (!persistence) return { status: "blocked"'; perl -0pi -e 's/const discard = async \(\): Promise<DiscardResult> => \{\n    if \(inflight > 0\) return \{ status: "rejected", reason: "inflight" \};/const discard = async (): Promise<DiscardResult> => {/' "$W/core/saveCore.ts"; run "M4 discard inflight 거절 삭제"
reset; sub 'if (mark > savedMark) return { status: "rejected", reason: "dirty" };' ''; run "M5 replace dirty 거절 삭제"
reset; sub 'if (!confirmed || receipt.generation > confirmed.generation) confirmed = receipt;' 'confirmed = receipt;'; run "M6 settle 세대 가드 제거"
reset; sub 'const run = chain.then(saveNow).finally(' 'const run = saveNow().finally('; run "M7 저장 직렬(chain) 제거"
reset; sub 'return receipt.imageIds.every((id) => keys.has(id));' 'return true;'; run "M8 verify 이미지 key 검사 제거"
reset; sub 'if (!(await verify(result.receipt))) return { status: "failed", reason: "not-committed" };' ''; run "M9 confirm wrote:true 재읽기 verify 삭제"
reset; sub 'if (!(await verify(proof))) return { status: "failed", reason: "stale" };' ''; run "M10 confirm wrote:false 재읽기 verify 삭제"
reset; perl -0pi -e 's/const mode = await writer.mode\(\);\n      if \(mode !== "writer"\) return \{ status: "failed", reason: mode \};\n      const proof/const proof/' "$W/core/saveCore.ts"; run "M11 confirm wrote:false writer 모드 검사 삭제"
reset; sub 'if (request.expectedEpoch !== epoch) return { status: "rejected", reason: "epoch" };' ''; run "M12 replace epoch 검사 삭제"
reset; sub 'if (mark > result.receipt.mark) return { status: "newer", receipt: result.receipt };' ''; run "M13 confirm wrote:true newer 판정 삭제"
reset; sub 'if (!stored || !(await verify(confirmed))) return { status: "blocked", reason: "stale" };' 'if (!stored) return { status: "blocked", reason: "stale" };'; run "M14 discard 재읽기 verify 삭제"
rm -rf "$W"
echo "done" >> "$OUT"
