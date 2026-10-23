# RELEASE-CHECK-LIVE BRIEF-R4 — B-SEC-09 ②④ 마지막 시도 (QA, 짧게)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-23 — 영환님 "1"(R4 1회, 실패 시 수동 릴리스 체크로 이관 — 재시도 없음)
상위 `BRIEF-R3.md` 승계. 쓰기 경로 = `dev/active/release-check-live/`만(+ `$TMPDIR/r4-*`, 마감 때 삭제). 앱 코드·테스트·설정 수정 금지. 기존 로그·스크립트 덮어쓰기 금지(새 파일 `r4-*`).
tip = origin/main `99d1f4a2` 병합 뒤(`d8298ff5`). `app/node_modules` 있음(없으면 `npm ci`, lock 커밋 금지).

## 원인 (Jarvis 확인 — 다시 조사하지 말 것)
`scripts/r3-export2.mjs:24`의 `readImage`가 `{ blob, width, height }`를 돌려준다. 계약은 `ReadImage = (id) => { variants: Record<폭, Blob>, width, height } | undefined`(`app/src/features/studio/staticHtml/exportImages.ts:6`, 테스트 예 `exportImages.test.ts:17-18`). 그래서 `pickVariant`가 `Object.keys(undefined)`로 TypeError.

## 할 일
1. `scripts/r3-export2.mjs`를 `scripts/r4-export.mjs`로 복사하고 `readImage`만 고친다: `(id) => (id === ID ? { variants: { 640: png, 1280: png, 1920: png }, width: 1000, height: 1000 } : undefined)`. 그 밖의 줄은 바꾸지 않는다(글꼴 주입은 R3 2차에서 통과).
2. dev 서버 4399(사전 lsof 기록) → 새 ego TaskSpace → `r4-export.mjs` 실행 → zip Blob을 `$TMPDIR/r4-zip/site.zip`으로 → sha256·바이트·`zipinfo -1` → `logs/r4-export.txt`. **최대 2회 시도.** 또 실패하면 오류를 기록하고 3·4단계는 건너뛰어 BLOCKED로 마감.
3. `ditto -xk` → `file://.../index.html`, 같은 스크립트에서 1280 → 390(`innerWidth` 기록): CSP meta 1 · `securitypolicyviolation` 0 · 끝까지 스크롤 뒤 이미지 `complete && naturalWidth>0` n/n · `document.fonts` loaded · 390 메뉴 열기→앵커→닫힘·hash · 양성 대조(사본에 인라인 `<script>` → 위반 1·실행 안 됨) → `logs/r4-file.txt`.
4. QA-REPORT 2절에 `2-R4` 추가, 첫 줄 판정 갱신. 한계를 명시: UI 클릭 대신 모듈 직접 호출이며 dev 서버라 CSS를 `?raw`로 주입한 테스트 경로 수준이다(생성기·렌더 iframe·zip 조립은 실제 코드).

## 마감
- dev 서버 종료 · `lsof -nP -iTCP:4399 -sTCP:LISTEN` 0줄 · TaskSpace finish · `$TMPDIR/r4-*` 삭제 · PROGRESS 갱신 · 커밋 · `git status --short` 빈 값.

## 규칙
- git push·pull·fetch 금지. 서브에이전트 금지. 최대 25턴 — QA-REPORT 초안 커밋 18턴 전, 20턴부터 마감.
