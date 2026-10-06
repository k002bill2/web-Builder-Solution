# QFIX-QA 브리프 — 미검증 QA 3건 (개수 문구 · B-ER-07 · B-M2C-09 ②)

- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree qfix-qa / base `f73708f`. 코드 0. `app/node_modules` lock 그대로 `npm ci` 완료.
- 영환님 ★A(2026-10-06) 품질 정리. 병렬 레인 QFIX(Developer, 포트 4337) — **이 레인은 포트 4339**, 그 레인 Ego Lite 공간·서버 무접촉.
- 정본: `dev/active/er-5b-qa/REPORT.md`·`BRIEF.md`·`lib.mjs`(measure·shotV — 사본 사용), `dev/active/er-5-qa/REPORT.md`, `docs/design/editor-rest/SPEC.md` r1 5.5 QB-R2·R5, BACKLOG B-M2C-09·B-ER-07. fixture 생성기 `dev/active/er-5b-qa/fixtures/gen-fixtures.mjs`(사본 — noise-12mp·big-noise).
- **턴 예산 메모(B-QA-01):** 문서 생성 경로만 ~10턴. 문서 1개를 만들어 세 항목에 재사용한다.

## 항목 (순서대로)
1. **개수 문구(B-M2C-09 ① · QB-R2·R5)**: 경로 A(카탈로그 ref-e 법률사무소 → 3안 → 편집 시작 → 페이지 정보)로 게이트 통과 문서 → 이미지 2장(+대체텍스트) → 편집기 이탈·복귀(잃은 이미지) → 정적 HTML·PNG 내보내기 → **결과 줄 전체 문장을 DOM 원문 그대로 기록** + 캡처. 이어서 스냅샷 복원 경로(QB-R5) 같은 기록. 문구가 없거나 SPEC과 다르면 결함 후보(심각도).
2. **B-ER-07**: 같은 문서에서 `Emulation.setCPUThrottlingRate` 6→20 단계 + `noise-12mp.jpg`/`big-noise.jpg` 고르기 직후 즉시 스냅샷 미리보기 → 변환 완료 대기 → 문서·이미지 그대로 + 상태 문장 "스냅샷을 보는 동안 준비된 이미지는 넣지 않았습니다…" 확인. 스로틀 수치·변환 시간·순서 기록. 재현 불가면 수단·수치와 함께 "재현 불가".
3. **B-M2C-09 ②**: 같은 문서로 768·390 폭 PNG ↔ 정적 HTML(같은 폭 렌더) 대조 1쌍씩(픽셀 차 또는 육안 + 높이) — 시간 남을 때.

## 캡처·브라우저
- `npm run build` → `npx vite preview --host 127.0.0.1 --port 4339 --strictPort`(dev 금지).
- 시작 전 `listTaskSpaces()` 확인 → 새 taskSpace → 창 minimized면 `Browser.setWindowBounds {windowState:"normal"}`. 캡처 = `captureBeyondViewport:false` + 뷰포트 clip(`shotV`), fullPage 금지. 렌더 iframe 빈 칸이면 DOM 보완 명시.
- 첫 goto 1회 뒤 앱 안 클릭·키 입력만, 새로고침 금지. 끝나면 override·스로틀 해제 → 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()`에 이 레인 공간 없음 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 제약
- **첫 3턴 안에 BRIEF P0 커밋**, 항목마다 증거·PROGRESS 커밋. 내보낸 HTML·PNG는 `exports/`(.gitignore) — 경로를 REPORT에.
- 쓰기는 `dev/active/qfix-qa/`만. 앱/테스트/docs/lock/scripts 수정 0. 결함은 고치지 말고 재현·심각도·증거. N/A를 PASS로 쓰지 않음. vitest 생략(코드 0).
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 40턴 도달 시 새 측정 중단 → 창 닫기 → REPORT. REPORT는 마지막 5턴 전 커밋. REPORT(한국어): 항목별 판정·결함·B-M2C-09·B-ER-07 닫힘 의견.
