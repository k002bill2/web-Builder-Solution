# FIX-BER11 Developer 브리프 — 390 테마 적용 직후 "되돌리기"가 화면 밖 (B-ER-11 · P3 · 실화면 FAIL)

- 역할 Developer / Orca managed Claude Code / worktree `fix-ber11` / base main `5db4275`. Designer 생략 사유: 기존 화면 순수 버그 수정(알림 줄 위치 사양은 기존 QFIX `0415e74` 의도 그대로).
- 실화면 증거: `dev/active/qa-reopen/JARVIS_RECOVERY.md` · `PROGRESS.md`(RESUME-1) · `shots/ber11-390-applied.png` — 390 폭, 테마 적용 직후 알림 줄 "되돌리기" y=-246(재현 3/3). 단위 테스트(`ThemeSwap.test.tsx:130` "알림 줄 보이기 — B-ER-11")는 통과 중 → jsdom이 실제 스크롤 순서를 못 잡는다.
- 원인 가설(QA): `StudioPanels.tsx:26-30`이 알림 줄을 `scrollIntoView({block:"nearest"})`한 **뒤** `StructureCanvas.tsx:137-138`의 선택 상자 `scrollIntoView`가 실행돼 스크롤을 덮어씀(390 탭 배치에서 두 요소가 같은 스크롤 컨테이너).

## 작업
1. P0: `dev/active/fix-ber11/PROGRESS.md` 체크리스트 커밋(3턴 전).
2. 원인 확정: 테마 적용 경로에서 두 effect의 실행 순서·트리거(선택 변경 여부, 테마 적용이 선택 상자 effect를 왜 다시 부르는지)를 코드로 추적해 PROGRESS에 기록.
3. RED: 두 `scrollIntoView` 호출 순서/대상을 관찰하는 테스트(jsdom에 `Element.prototype.scrollIntoView` 스파이 주입) — 테마 적용 직후 **마지막** 호출 대상이 알림 줄이어야 한다(또는 선택 상자 호출이 없어야 한다). 예측·결과 PROGRESS.
4. GREEN(최소 변경 우선): 선택이 실제로 바뀔 때만 선택 상자를 스크롤(테마·문서 변경만으로 재실행되지 않게 의존성 정리)하는 방향 우선. 알림 줄 effect의 타이밍 꼼수(setTimeout 등)는 마지막 수단 — 쓰면 사유 기록. 다른 폭(1024·1280)·섹션 선택 시 스크롤 회귀 0(기존 테스트 유지 + 필요 시 추가).
5. Ego Lite(필수, 짧게): build + `npx vite preview --host 127.0.0.1 --port 4347 --strictPort` → 경로 A(ref-e → 3안 → 편집 시작 → 페이지 정보 → 프로필 조정 v2 저장 → 편집기 390 폭 테마 바꾸기 적용) → 알림 줄 "되돌리기" `getBoundingClientRect().top`이 0~뷰포트 높이 안인지 기록(3회) + 뷰포트 clip 캡처 1장 `dev/active/fix-ber11/shots/`(PNG 바이트 수 확인 — 57B 같은 손상 파일 금지). 정리: IDB `deleteDatabase("design-studio")` · 자기 공간 `finish({keep:[]})` · `listTaskSpaces()` 기록 · 서버 종료·4347 리슨 0. 영환님 창·main 5480 무접촉. 경로 A 준비가 15턴을 넘으면 중단하고 단위 근거만으로 REPORT(Ego는 Jarvis가 QA에 별도 위임).
6. BACKLOG B-ER-11 행 끝에 결과 표기 커밋.

## 공통 제약
- 시작 `cd app && npm ci`(lock 변경 0). TDD · RED만 있는 tip 커밋 금지 · 단언 약화 0 · amend·rebase 금지 · `set -o pipefail`.
- 번들: `/studio` ≤129.65(현재 129.26) · 복원 ≤132.68 · `/profile` ≤100 — 넘으면 멈추고 보고.
- 마감 게이트: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT(한국어: 원인·변경 파일·테스트·예산·Ego 수치·남은 것).
- 엔진·계약·lock·CLAUDE.md·design/ 수정 0. 새 의존성 0. push/merge/삭제 0. 승인 실패 우회 금지.
- 서브에이전트 분할: 불필요(단일 결함).
- 시간 상한 60분. 턴: 원인 확정 12턴 전 · GREEN 커밋 25턴 전 · Ego 45턴 전 마감 · 48턴부터 게이트·REPORT만 · REPORT 55턴 전.
