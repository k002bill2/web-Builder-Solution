# RELEASE-CHECK-LIVE BRIEF-R3 — B-SEC-09 ②④ 실제 생성기 정적 zip `file://` (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-22 — 영환님 "1A"(UI 흐름 건너뜀 · 실제 생성기 출력으로 file:// 실측)
상위 `BRIEF.md` §2 승계. 쓰기 경로 = `dev/active/release-check-live/`만(+ `$TMPDIR/r3-*` 임시, 마감 때 삭제). **앱 코드·테스트·vite 설정 수정 금지.** 기존 로그 덮어쓰기 금지(새 파일명 `r3-*`).

## 배경
- R2b: 앱 버튼 경로는 품질 게이트 차단 → 우회 경로에서 "B안으로 편집 시작" 무반응으로 zip 미확보(`logs/r2b-export7-run.txt`). 그 무반응은 **별건 BACKLOG**(이 레인에서 조사하지 말 것).
- 메우려는 공백(`dev/active/csp-zip/QA-REPORT.md:45·86·89`): R3 `file://` 증거가 E0 **임시 삽입본**뿐 · R4 1280 lazy 이미지 재확인 없음.

## 생성 방법 (★ Jarvis 결정 — 순서대로 시도, 첫 성공에서 멈춤)
1. ★ **실제 브라우저에서 실제 생성기 호출**: `cd app && npx vite --port 4399 --strictPort`(dev 서버, 기존 `devServer.ts` 설정 그대로) → ego-browser로 `http://localhost:4399/` 연 페이지에서 `page.evaluate(async () => { const m = await import('/src/features/studio/staticHtml/staticHtml.ts'); ... })`로 `"static-zip"` 형식 생성 함수를 직접 호출(입력 = 레퍼런스 문서 + 이미지 1장 이상, 시그니처는 `staticHtml.ts`·`exportFlow.ts`·`staticCspZip.test.ts`를 읽고 맞출 것). 렌더 iframe·`kitCss` fetch가 실제로 돈다 → 앱 버튼 경로와 같은 생성기. 결과 Blob을 base64로 꺼내 `$TMPDIR/r3-zip/site.zip` 저장.
2. 1이 15턴 안에 안 되면: 게이트를 통과하는 기존 레퍼런스 문서(대비·SEO 차단 0)를 찾아 앱 버튼으로 내보내기(비교 보드 → 편집 시작 경로만, 보정값 v2 경로 금지).
- 어느 방법인지·한계(1이면 "UI 클릭 대신 모듈 직접 호출, 생성기·렌더·CSS는 실제")를 REPORT에 명시. zip sha256·바이트·엔트리 목록(`zipinfo -1`)을 `logs/r3-export.txt`.

## file:// 실측 (BRIEF §2·R2b 3단계 그대로) → `logs/r3-file.txt`
- `ditto -xk` → `file://.../index.html`, 같은 스크립트에서 1280 → 390(`innerWidth` 기록).
- CSP meta 1 · `securitypolicyviolation` 0 · 끝까지 스크롤 후 이미지 `complete && naturalWidth>0` n/n(④) · `document.fonts` loaded · 390 메뉴 열기→앵커→닫힘·hash · 양성 대조(사본에 인라인 `<script>` → 위반 1·실행 안 됨).

## 마감
- QA-REPORT 2절에 R3 결과·판정(B-SEC-09 ②④ PASS/FAIL/BLOCKED), 첫 줄 갱신. PROGRESS 갱신.
- dev 서버 종료 · `lsof -nP -iTCP:4399 -sTCP:LISTEN` 0줄 기록 · TaskSpace finish · `$TMPDIR/r3-*` 삭제 · 커밋 · `git status --short` 빈 값.

## 규칙
- git push·pull·fetch 금지. 서브에이전트 금지. 최대 35턴 — REPORT 초안 커밋 26턴 전, 29턴부터 마감, 남은 행은 BLOCKED.
