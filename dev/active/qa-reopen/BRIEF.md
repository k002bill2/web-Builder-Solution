# QA-REOPEN QA 브리프 — 실화면 재검만 남은 백로그 (코드 0)

- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree `qa-reopen` / base main `6fc4668`. 시작: `cd app && npm ci`(lock 변경 0).
- 근거: `dev/active/backlog-triage/REPORT.md`(판정 "열림-실화면 QA 재검만"), BACKLOG 해당 행. 이전 QA 자산(사본 사용): `dev/active/qfix-qa/{BRIEF.md,REPORT.md,lib.mjs,ber07.mjs,gen-fixtures.mjs}`, `dev/active/er-5b-qa/lib.mjs`(measure·shotV).
- 병렬 레인: COPY-HELP(포트 4341)·FALLBACK-FONT(4343) Developer — **이 레인은 포트 4345**, 다른 레인 공간·서버 무접촉. 영환님 창·main 5480 무접촉.

## 항목 (우선순위 순 — 턴 부족 시 뒤에서부터 N/A 처리)
1. **B-ER-11**: 390 폭 /studio에서 테마 적용 직후 알림 줄 "되돌리기"가 뷰포트 안에 보이는지(이전 y=-337). 좌표·캡처.
2. **D-QA01**: 1280 상세 화면 뷰포트 단위 캡처(스크롤 여러 지점) — 하단 GNB 반복 재현 여부. DOM 헤더 개수 기록. 재현 0이면 종결 의견.
3. **B-ER-07**: 10MB 미만 고화소 이미지(gen-fixtures로 생성) + CPU 스로틀 ≥6 → 이미지 고르기 직후 스냅샷 미리보기 → 변환 완료 뒤 문서·이미지 불변 + 상태 문장 확인. 수단·수치·순서 기록. 재현 불가면 "재현 불가(수단)".
4. **B-M2C-09 ②**: 768·390 폭 PNG ↔ 정적 HTML(같은 폭) 대조 1쌍씩 — 높이·육안/픽셀 차.
5. **B-M2B-09**(Chrome 포그라운드 범위만): QB-13·14(BOUND)·BODY QB-14·15·실제 로컬 이미지 갤러리 중 가능한 것. Safari·Firefox는 환경 없음 → N/A로 명시(PASS로 쓰지 않음).
- 제외: B-M2C-09 ③(교차 출처 iframe 한계), B-M3P-04(배포 시).

## 캡처·브라우저
- `npm run build` → `npx vite preview --host 127.0.0.1 --port 4345 --strictPort`(dev 금지).
- 시작 전 `listTaskSpaces()` → 새 taskSpace → 창 minimized면 `Browser.setWindowBounds {windowState:"normal"}`. 캡처 = `captureBeyondViewport:false` + 뷰포트 clip, fullPage 금지.
- 끝: override·스로틀 해제 → IDB `deleteDatabase("design-studio")` → 자기 공간 `finish({keep:[]})` · `listTaskSpaces()` 재확인 · 서버 종료·4345 리슨 0.

## 제약
- 첫 3턴 안 BRIEF P0(PROGRESS) 커밋, 항목마다 증거·PROGRESS 커밋. 쓰기는 `dev/active/qa-reopen/`만(내보낸 HTML·PNG는 .gitignore된 `exports/` — 경로만 REPORT에).
- 앱/테스트/docs/lock/scripts 수정 0. 결함은 고치지 말고 재현·심각도·증거. N/A를 PASS로 쓰지 않음. vitest 생략(코드 0).
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- 턴 관리: 50턴 도달 시 새 측정 중단 → 창 닫기 → REPORT. REPORT는 마지막 5턴 전 커밋. REPORT(한국어): 항목별 판정(PASS/FAIL/재현 불가/N/A)·결함·각 BACKLOG 항목 닫힘 의견.
