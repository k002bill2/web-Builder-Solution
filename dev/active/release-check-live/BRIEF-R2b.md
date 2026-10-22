# RELEASE-CHECK-LIVE BRIEF-R2b — B-SEC-09 ②④ 정적 zip `file://` (QA, 짧게)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-22
상위 `BRIEF.md` §2 그대로. 쓰기 경로 = `dev/active/release-check-live/`만. 앱 코드·테스트 수정 금지. 기존 로그 덮어쓰기 금지(새 파일명 `r2b-*`).

## 이미 끝난 것 (다시 하지 말 것)
- B-M2B-05d PASS(R2a). npm ci·build 완료.
- 흐름 팁(R2a 실측): 비교 추가 버튼은 `aria-label`이 아니라 `(aria-label || textContent).trim()`으로 찾아야 담긴다(`scripts/r2a-A3.mjs`). 앱 안 클릭으로만 이동(새로고침 = 메모리 store 소실).

## 할 일 (이것만)
1. preview 4399 기동(사전 lsof 기록), 새 ego-browser TaskSpace.
2. `scripts/r2a-A3.mjs` 흐름으로 편집기 진입 → **이미지 1장 이상 있는 문서**(레퍼런스 기본 이미지 또는 슬롯 업로드 — 쉬운 쪽)로 **정적 zip 내보내기를 앱 버튼으로** 실행 → 다운로드 파일 경로·sha256·바이트를 `logs/r2b-export.txt`.
3. `$TMPDIR/r2b-zip/`에 `ditto -xk`로 풀기 → `file://.../index.html`을 같은 스크립트 안에서 viewport 1280 → 390 순서로 열기(`innerWidth` 기록):
   - CSP meta 1개 · `securitypolicyviolation` 0
   - 끝까지 스크롤해 lazy 이미지 로드 후 `img.complete && naturalWidth>0` n/n (④)
   - `document.fonts` loaded 목록
   - 390: 메뉴 열기 → 앵커 클릭 → 닫힘·hash
   - 양성 대조 1회: 같은 파일 사본에 인라인 `<script>` 삽입 → 위반 1·실행 안 됨
   → `logs/r2b-file.txt`.
4. QA-REPORT 2절 채우고 첫 줄 판정 갱신(B-SEC-09 ②④ PASS/FAIL/BLOCKED). PROGRESS 갱신.
5. 마감: preview 종료·`lsof` 0줄 · TaskSpace finish · `$TMPDIR/r2b-zip` 삭제 · 커밋 · `git status --short` 빈 값.

## 규칙
- git push·pull·fetch 금지. 서브에이전트 금지. 최대 30턴 — QA-REPORT 초안 커밋 22턴 전, 24턴부터 마감, 남은 행은 BLOCKED.
