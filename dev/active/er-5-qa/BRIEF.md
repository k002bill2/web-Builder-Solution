# ER-5 QA 브리프 — 편집기 잔여 최종 QA (QB-R2~R7 · ER-AC-T8 · B-ER-07 · C2 재측정)

- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree er-5-qa / base `fbc6379`(ER-1·2·3a·3b·OFF2·4·4b 병합). 코드 0. `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/editor-rest/SPEC.md` r1 5.5 QB-R1~R7·ER-AC-T8, `docs/04-plan/EDITOR_REST_PLAN.md` 4절(QA 환경), ADR-004 개정 5·6(C2 숫자는 낡음 → `/studio` 판정선 128.70, 현재 128.59), BACKLOG B-M2C-09·B-ER-07·B-ER-08·B-ER-09·B-M2B-09, 레인 기록 `dev/active/{er-1-qa,er-2,er-3b,er-4,er-4b}/`(REPORT·JARVIS_FINAL).
- 범위 밖(판정 N/A로 표기, 결함 아님): U3 필드 편집 묶음(B-ER-08) · "더보기" 메뉴(B-ER-09) — QB-R6은 키보드 실행 취소·다시 실행만.

## 항목
1. **QB-R2(=B-M2C-09 ①)**: 경로 A(카탈로그 ref-e·법률사무소 → 3안 → 편집 시작 → 페이지 정보)로 게이트 통과 문서 → 이미지 2장(+대체텍스트) → 편집기 이탈·복귀 → 정적 HTML·PNG 결과 줄 "이미지 N장…" 개수 문구.
2. **QB-R3 / ER-AC-T8**: 대비 미달 문서 → 프로필 보정 저장 → 편집기 복귀(앱 안) → 새 버전 캡션 → 테마 바꾸기 → 대비 통과 · 캔버스 색 변화 육안.
3. **QB-R4**: 스냅샷 저장 → 편집 → 미리보기(실렌더) → 복원 · 포커스·알림.
4. **QB-R5**: 이미지 A → 스냅샷 → A 교체 → 이탈·복귀 → 복원 = 잃은 이미지 처리 · 내보내기 개수 문구.
5. **QB-R6**: 키보드만으로 Ctrl/⌘+Z·Shift+Ctrl/⌘+Z·Ctrl+Y(섹션 연산·테마) · 입력칸 미가로채기 · 미리보기 복귀 뒤 동작.
6. **QB-R7**: 1280·1024·390에서 테마·스냅샷 대화상자·미리보기 Callout 넘침 0 · 포커스 가림 0 · 390 테마 "되돌리기" 뒤 포커스(ER-4b 미확인분).
7. **B-ER-07**: 이미지 변환 중 미리보기 차단 실브라우저 재현 — `Emulation.setCPUThrottlingRate`(예: 6~20) 또는 큰 자체 제작 이미지로 변환 시간을 늘림. 재현 불가면 수단·수치 기록.
8. **B-M2C-09 ②**: 가능한 범위에서 ⑩ 나머지 변형·태블릿/모바일 폭 PNG ↔ 정적 HTML 대조(시간 남을 때만).
9. **C2 재측정**: `npm run build` 번들 표 전 행 기록(판정 기준 = ADR-004 개정 6).
10. 회귀: 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회 — `ProfileCompare` CMP-AC-U1은 B-TEST-01 기지 흔들림).

## 캡처 — 중요 (Jarvis 진단 2026-10-06)
- Ego Lite에서 `page.screenshot()`(= 기본 `Page.captureScreenshot`)은 빈 data URL 페이지에서도 **15초 시간 초과**. `fromSurface:false`도 실패.
- **동작하는 방법**: `page.cdp("Page.captureScreenshot", {format:"png", captureBeyondViewport:true, clip:{x:0,y:0,width:<뷰포트 w>,height:<뷰포트 h>,scale:1}})` → base64를 `fs.writeFileSync`로 PNG 저장(166ms, 1877×929 실측). **clip은 뷰포트 크기로 — fullPage 캡처 금지.** 폭 전환은 `Emulation.setDeviceMetricsOverride`(1280·1024·390) 뒤 clip을 그 폭·높이로. 끝나면 `Emulation.clearDeviceMetricsOverride`.
- 캡처는 `dev/active/er-5-qa/shots/`, 항목마다 최소 1장. 캡처 실패 시 그 항목에 원인과 DOM 대체를 명시(N/A를 PASS로 쓰지 않음).

## 제약
- 환경: `npm run build` → `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(**dev 서버 금지**). fixture는 자체 제작만(`dev/active/m2c-5-qa/fixtures/gen-fixtures.mjs` 사본 가능). 크롤링·외부 이미지 0.
- **Ego Lite(영환님 지시):** 화면을 실제로 보고 판정. 시작 전 `listTaskSpaces()` 확인(space id 기록). 첫 goto 1회 뒤 앱 안 클릭·키 입력만, 새로고침 금지(새 문서가 필요하면 앱 안 "새 프로젝트" 경로). 끝나면 이 레인 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 쓰기는 `dev/active/er-5-qa/`만(내보낸 HTML·PNG 원본은 `exports/`에 두고 .gitignore — 단 **Jarvis가 보관할 수 있게 경로를 REPORT에 기록**). 앱/테스트/docs/lock/scripts 수정 0, 새 의존성 0, BRIEF P0 명시 커밋. 결함은 고치지 말고 재현·심각도(P1~P3)·증거. Safari·Firefox 미검증 표기.
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 55턴 도달 시 새 측정 중단 → 창 닫기 → vitest → REPORT. REPORT는 마지막 5턴 전 커밋. REPORT(한국어): meta · 항목별 판정(PASS/결함/환경 한계/미검증/N/A + 증거) · 결함 목록 · Go/조건부 Go/No-Go · B-M2C-09·B-ER-07 닫힘 의견.
