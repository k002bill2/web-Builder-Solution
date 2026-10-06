# ER-5b QA 브리프 — ER-5 조건 해소 (QB-R7 · 개수 문구 · B-ER-07 · B-M2C-09 ②)

- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree er-5b-qa / base `a192037`(ER-5 QA 병합). 코드 0. `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `dev/active/er-5-qa/REPORT.md`(조건부 Go 조건)·`BRIEF.md`(캡처 방식), `docs/design/editor-rest/SPEC.md` r1 5.5 QB-R2·R5·R7, BACKLOG B-ER-07·B-M2C-09. ER-5의 `lib.mjs`·`fixtures/gen-fixtures.mjs` 재사용 가능(사본).

## 항목 (순서대로 — 앞 항목 우선)
1. **QB-R7**: 1280·1024·390(`Emulation.setDeviceMetricsOverride`)에서 테마 대화상자·스냅샷 대화상자·미리보기 Callout 넘침 0 · 포커스 가림 0 — 폭마다 캡처. **390 탭 배치에서 테마 적용 → 알림 줄 "되돌리기"(클릭 또는 Tab+Enter) → 포커스 = `#studio-theme-swap`** (ER-4b 미확인분). 좌표 클릭이 빗나가면 `page.focus`+Enter로.
2. **QB-R2·R5 결과 줄 개수 문구**: 이미지 2장 → 편집기 이탈·복귀(잃은 이미지) → 정적 HTML·PNG 내보내기 뒤 **결과 줄 텍스트를 DOM으로 그대로 기록**(role=status/결과 줄 전체 문장) + 캡처. 스냅샷 복원 경로(QB-R5)도 같은 기록.
3. **B-ER-07**: 이미지 변환 중 미리보기 차단 실브라우저 재현 — `Emulation.setCPUThrottlingRate` 6→20 단계 + 큰 자체 제작 이미지(`noise-12mp.jpg` 등). 이미지 고르기 직후 바로 스냅샷 미리보기 → 변환 완료 대기 → 문서·이미지 맵 그대로 + 상태 문장 "스냅샷을 보는 동안 준비된 이미지는 넣지 않았습니다…" 확인. 수단·스로틀 수치·변환 시간을 기록. 재현 불가면 그 사실과 수치.
4. **B-M2C-09 ②**(시간 될 때): 태블릿·모바일 폭 PNG ↔ 정적 HTML 대조 1쌍.

## 캡처·브라우저
- 시작 전 `listTaskSpaces()` 확인 → 새 taskSpace → **창 상태 확인: minimized면 `Browser.setWindowBounds {windowState:"normal"}`**(ER-5 원인).
- 캡처 = `page.cdp("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,clip:{x:0,y:0,width:<뷰포트 w>,height:<뷰포트 h>,scale:1}})` → PNG 저장. fullPage 금지. 렌더 iframe(OOPIF) 빈 칸이면 DOM 텍스트로 보완 명시.
- 첫 goto 1회 뒤 앱 안 클릭·키 입력만, 새로고침 금지. 끝나면 `Emulation.clearDeviceMetricsOverride`·`setCPUThrottlingRate {rate:1}` → 이 레인 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 제약
- 환경 `npm run build` → `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 금지). fixture 자체 제작만.
- **첫 3턴 안에 BRIEF P0 커밋**. 측정 항목 하나 끝날 때마다 증거·PROGRESS 커밋(exports·fixture 바이너리 .gitignore — exports 경로는 REPORT에).
- 쓰기는 `dev/active/er-5b-qa/`만. 앱/테스트/docs/lock/scripts 수정 0. 결함은 고치지 말고 재현·심각도·증거. N/A를 PASS로 쓰지 않음. Safari·Firefox 미검증 표기.
- 전체 vitest는 생략(ER-5에서 2124 PASS, 코드 변경 0).
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 35턴 도달 시 새 측정 중단 → 창 닫기 → REPORT. REPORT는 마지막 5턴 전 커밋. REPORT(한국어): 항목별 판정·결함·ER-5 조건 해소 여부(Go/조건부/No-Go)·B-ER-07·B-M2C-09 닫힘 의견.
