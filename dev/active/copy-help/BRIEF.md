# COPY-HELP Developer 브리프 — 편집 패널 도움말 2건 (B-M2B-02 · B-M2B-03)

- 역할 Developer / Orca managed Claude Code / worktree `copy-help` / base main `6fc4668`.
- 근거: `dev/active/backlog-triage/REPORT.md`(판정 "열림-코드 수정만"), `docs/06-handoff/BACKLOG.md` B-M2B-02·03, 사양 `docs/design/` 아래 SPEC-BODY MQ-B1·MQ-B4(grep으로 찾아 원문 문구 확인).

## 작업
1. P0: `dev/active/copy-help/PROGRESS.md` 체크리스트 커밋(3턴 전).
2. **B-M2B-02**: `services/list`의 `items` 필드 편집 도움말 "가운뎃점(·)으로 나눕니다"(SPEC 원문 우선). 필드 도움말이 붙는 기존 방식(`aria-describedby` 등)을 그대로 따른다. 테스트: 도움말 문구 + 입력과의 연결 단언.
3. **B-M2B-03**: 예약 섹션(contact 계열 booking 변형 — 실제 변형 id는 코드에서 확인) 편집 패널의 사이트 주인용 안내 Callout. `ContactOwnerNote.tsx`는 조작 뒤 청크 + DS Callout을 부르는 쪽이 넘기는 구조(파일 주석 참고) — **이 구조를 유지**하고 변형별 문구 분기만 추가. 문구는 K2 문구의 "문의"를 "예약"으로(SPEC MQ-B4 원문 우선). 테스트: form=문의 문구, booking=예약 문구.
4. 두 항목은 각각 별도 커밋. 끝나면 BACKLOG.md 두 행 끝에 `· ✅ COPY-HELP \`<커밋>\` 닫힘(…)` 표기 커밋.
5. Ego Lite 생략(문구·연결은 단위 테스트로 충분 — REPORT에 사유 한 줄). 포트를 쓴다면 4341.
- 턴: 구현 25턴 전 · 25턴부터 게이트·REPORT만 · REPORT 34턴 전.

## 공통 제약
- 시작: `cd app && npm ci` (lock 변경 0 확인 — `git status --short`에 package-lock 없음).
- TDD: RED 예측·결과를 PROGRESS에 → 실패 테스트 → GREEN. RED 테스트만 있는 tip 커밋 금지 · 단언 약화 0 · amend·rebase 금지 · 명령 체인 `set -o pipefail`.
- 번들(ADR-004): build 출력의 `/studio` ≤129.65 · 복원 진입 ≤132.68 · `/profile` 첫 화면 ≤100. 넘으면 **멈추고** 수치와 원인을 REPORT에 — 예산 재배분 시도 금지.
- 마감 게이트: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT(한국어: 변경 파일·테스트·예산 실측·남은 것).
- 엔진·계약(`contracts/`·저장 스키마)·docs(BACKLOG 제외)·lock·CLAUDE.md·design/ 수정 0. 새 의존성 0. push/merge/브랜치 삭제 0. 승인 실패 우회 금지.
- 서브에이전트 분할: 불필요(단일 소규모 수정).
- 병렬 레인 3개 동시 진행(COPY-HELP · FALLBACK-FONT · QA-REOPEN) — 다른 레인 worktree·포트·Ego Lite 공간 무접촉. 영환님 창·main 5480 무접촉.
