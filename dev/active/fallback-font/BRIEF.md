# FALLBACK-FONT Developer 브리프 — 폴백 섹션 표식의 사이트 밖 굵기 글꼴 요청 (B-M2B-04)

- 역할 Developer / Orca managed Claude Code / worktree `fallback-font` / base main `6fc4668`.
- 근거: BACKLOG B-M2B-04, `dev/active/backlog-triage/REPORT.md`. 현상: 폴백 섹션 표식(`render/fallback/FallbackCanvas.tsx` — `SlotLine`의 `ds-heading1`/`ds-body1-strong`, 표식 `font-bold`)이 사이트 굵기 대응(`kit/siteFonts.ts` — 커밋 파일은 400·700뿐, `siteWeight`) 밖 600 등 굵기 글꼴 파일을 요청할 수 있음. 편집 캔버스 한정(내보내기는 폴백 미렌더 차단).

## 작업
1. P0: `dev/active/fallback-font/PROGRESS.md` 체크리스트 커밋(3턴 전).
2. 원인 확정: 해당 클래스가 어떤 font-family·font-weight로 풀리는지(토큰·kit.css·@font-face) 추적해 실제로 600/700 요청이 생기는 경로를 PROGRESS에 기록. **요청이 실제로 생기지 않으면 수정하지 말고** 근거와 함께 "닫힘 의견"으로 REPORT.
3. 수정(최소 변경 · 우선순위): ① 폴백 표식·슬롯 글자가 사이트 글꼴 계열을 쓰면 굵기를 `siteWeight`로 400/700에 맞춤 ② 또는 표식이 UI 글꼴(시스템/DS)을 쓰게 분리. 어느 쪽이든 하드코딩 금지(토큰·클래스만, `noHardcodedStyle.test.ts`). 시각 위계(Hero 크게·첫 글자 굵게)는 유지.
4. 테스트: 폴백 렌더 시 사이트 글꼴 계열에 대해 400·700 밖 굵기 요청 0을 보장하는 단언(클래스/계산 스타일 또는 `siteFaces` 기준 — jsdom 한계면 순수 함수로 분리해 단언).
5. Ego Lite(짧게): build + `npx vite preview --host 127.0.0.1 --port 4343 --strictPort` → /studio에서 폴백 섹션이 보이는 문서 → Network(또는 `performance.getEntriesByType('resource')`)로 woff2 요청 목록 기록(수정 전 main 기준 비교는 단위 근거로 대체 가능) → 캡처 1장 `dev/active/fallback-font/shots/` → IDB `deleteDatabase("design-studio")` · 자기 공간 `finish({keep:[]})` · `listTaskSpaces()` 기록 · 서버 종료·4343 리슨 0.
6. 끝나면 BACKLOG.md B-M2B-04 행 끝에 닫힘 표기 커밋.
- 턴: 원인 확정 12턴 전 · 구현 커밋 25턴 전 · Ego Lite 30턴 전 시작 · 38턴부터 게이트·REPORT만 · REPORT 44턴 전.

## 공통 제약
- 시작: `cd app && npm ci` (lock 변경 0 확인 — `git status --short`에 package-lock 없음).
- TDD: RED 예측·결과를 PROGRESS에 → 실패 테스트 → GREEN. RED 테스트만 있는 tip 커밋 금지 · 단언 약화 0 · amend·rebase 금지 · 명령 체인 `set -o pipefail`.
- 번들(ADR-004): build 출력의 `/studio` ≤129.65 · 복원 진입 ≤132.68 · `/profile` 첫 화면 ≤100. 넘으면 **멈추고** 수치와 원인을 REPORT에 — 예산 재배분 시도 금지.
- 마감 게이트: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT(한국어: 변경 파일·테스트·예산 실측·남은 것).
- 엔진·계약(`contracts/`·저장 스키마)·docs(BACKLOG 제외)·lock·CLAUDE.md·design/ 수정 0. 새 의존성 0. push/merge/브랜치 삭제 0. 승인 실패 우회 금지.
- 서브에이전트 분할: 불필요(단일 소규모 수정).
- 병렬 레인 3개 동시 진행(COPY-HELP · FALLBACK-FONT · QA-REOPEN) — 다른 레인 worktree·포트·Ego Lite 공간 무접촉. 영환님 창·main 5480 무접촉.
