# ER-9 Developer 브리프 — 편집기 "더보기" 메뉴 (B-ER-09, ADR-004 개정 8 배분 ②)

- 역할 Developer / Orca managed Claude Code / worktree er-9 / base `19a97d0`(M3P-6 병합: `/studio` 진입 128.23 · 기준선 128.23 · 판정선 128.26). `app/node_modules` lock 그대로 `npm ci` 완료.
- 영환님 ★A(개정 8 배분 순서 ① B-M3P-06 → ② B-ER-09). 정본: `docs/design/editor-rest/SPEC.md` 150·202·223·236·246·251·263·269행 근처(U4 "더보기": "실행 취소: …"·"다시 실행: …" 두 항목, 비활성 `aria-disabled`+이유 "되돌릴 편집이 없습니다", 키보드와 같은 기능, 메뉴 본문 조작 뒤 청크, <1280 "스냅샷" 이동은 2a-05 4.2), `docs/06-handoff/BACKLOG.md` B-ER-09, `dev/active/er-4b/REPORT.md`(키보드 실행 취소 구현·당시 128.56 시도 실패), `dev/active/studio-off3/AUDIT.md`.

## 범위
1. **S0 실측(코드 변경 전, PROGRESS)**: 현재 툴바·실행 취소 훅(키보드 Ctrl/⌘+Z·Shift+Z 경로) 위치, "더보기" 트리거·메뉴 본문 배치 후보(트리거 버튼만 진입, 본문 `import()` 조작 뒤)와 예상 증가.
2. **구현(SPEC U4·접근성 표 그대로)**: 툴바 "더보기" 버튼(`aria-haspopup="menu"`·`aria-expanded`) → 메뉴(`role="menu"`, 화살표·Home/End·Esc 닫기·닫으면 트리거로 포커스) 항목 "실행 취소: {대상}"·"다시 실행: {대상}" = 키보드와 같은 함수, 비활성은 `aria-disabled`+이유 문구, 실행 뒤 알림 "실행 취소: …"(기존 알림 경로 재사용). **<1280 "스냅샷" 이동은 예산이 남을 때만** — 아니면 SPEC 차이 유지(모든 폭 툴바)로 REPORT 기록.
3. 테스트: ER-AC-U4 · 메뉴 키보드 · 비활성 이유 · Esc 포커스 복귀 · 기존 툴바 순서 단언 유지(SPEC 236행 — 새 버튼 반영, 기존 단언 약화 0).

## 예산 (개정 8 결정 2·3)
- `/studio` 진입 실측 증가분만큼 `app/scripts/m2cBaseline.json` 기준선을 올리는 커밋 1개("ADR-004 개정 8 배분 ②", `bundleBudget.test.mjs` 고정 기대값 같은 커밋 갱신, 검사기 로직 변경 0). **상한 128.67(판정선 128.70) — 넘으면 구현 멈추고 보고.** 다른 라우트 첫 화면 한도 초과 0, 렌더 변화 0. 자동 저장 지연(B1)·엔진 분할 적용 금지.

## Ego Lite (영환님 지시)
- build + `vite preview --port 4337`(dev 금지), 창 minimized면 `Browser.setWindowBounds normal`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지), 첫 goto 1회 뒤 앱 안 클릭·키 입력만·새로고침 금지. 편집기 진입 → 섹션 삭제 → "더보기" 열기(키보드만: Tab·Enter·화살표) → "실행 취소: …" → 복원·알림 확인 → "다시 실행" → 비활성 상태 이유 확인 → Esc 포커스 복귀. 1280(+390 있으면) 캡처 ≤3장(`dev/active/er-9/shots/`). 끝나면 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 마감·금지
- typecheck·lint·build(번들 표 전 행) · 전체 vitest 1회 exit0 · Codex review --scope branch --base 19a97d0(≤2) · REPORT(증가량 표 필수).
- TDD 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0. 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md·check-bundle-size 판정 수정 0, 새 의존성·아이콘 0, APFS 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 40턴 도달 시 새 구현 중단 → Ego Lite → vitest → Codex → REPORT. **REPORT 초안 45턴 전 커밋**(직전 레인 턴 한도 반복).
