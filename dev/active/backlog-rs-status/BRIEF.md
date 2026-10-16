# BACKLOG-RS-STATUS BRIEF — 저장·재시작 계열 백로그 실상태 판정 (Developer, 코드 수정 0)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17 (영환님 "2+1")
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/backlog-rs-status` (브랜치 `k002bill2/backlog-rs-status`, base origin/main `c7a7a2a8`).
병렬 레인: RS5-INTEGRATE-PLAN(Designer, `docs/design/restart/INTEGRATE-6*.md`·`docs/04-plan/`·`dev/active/rs5-integrate-plan/`) — 그 경로 접촉 금지.

## 목적
`docs/06-handoff/BACKLOG.md`의 저장·재시작 계열 열린 항목이 **현재 main 코드에서 실제로 열려 있는지** 근거로 판정하고, 닫힌 항목만 표기를 갱신한다. 결과는 병렬 RS5 연결 계획 레인과 Jarvis의 입력이다.

## 대상 항목
B-RS-01 · B-RS-02 · B-RS-03 + BACKLOG에서 `restart`·`save`·`저장`·`RS4`·`RS5`·`pending`·`SPEC-4` 관련으로 닫힘 표기가 없는 항목 전부(grep으로 목록화해 PROGRESS에 기록).

## 근거
- 머지 이력: PR #6(RS4 CP1~3 — 미확인 쓰기 기억·create 가드·confirmDoc·/projects 미확인 행), #7·#8(RS3-AC 회귀 테스트 이식·보강), #9(/projects 로딩 겹침), SAVE-ON-LEAVE 레인 기록(`dev/active/save-on-leave/` 있으면).
- 정본: `docs/design/restart/SPEC-4.md`(RS4-AC 표, 5.6 남는 경로 RS4-R1·R2), `dev/active/rs4-cp4-measure/REPORT*.md`(CP4 보류 근거), `dev/active/save-core-final-qa/REPORT.md`(RS5 코어 하네스, 제품 미통합).

## 작업
1. P0: `dev/active/backlog-rs-status/PROGRESS.md`(항목 체크리스트) 커밋(3턴 전).
2. 항목마다: 관련 코드 파일:행, 대응 테스트(파일:행 · 테스트 이름), 처리 커밋(`git log --oneline -S/--grep`). 실브라우저 재현 안 함(정적·테스트 근거).
   - 가능하면 대응 테스트를 표적 실행(`npx vitest run <파일>`)해 GREEN을 기록.
3. 판정 4종: `닫힘(근거 커밋·테스트)` · `부분 닫힘(남은 것 명시)` · `열림-RS5/CP4 의존(어느 결정·레인)` · `열림(확인 불가: 사유)`. 근거 없는 "닫힘" 금지.
4. `docs/06-handoff/BACKLOG.md`: 닫힘·부분 닫힘 항목만 기존 관례(`✅ … 닫힘(커밋)` 또는 `🔶 부분 닫힘`)로 행 끝에 표기. 열린 항목 문구는 바꾸지 않는다. RS4-R1(history 재진입 거짓 idle, CP4 보류)이 BACKLOG에 없으면 새 행 1개 추가(B-RS-04 등 다음 번호, 근거 `dev/active/rs4-cp4-measure/REPORT-M2.md`).
5. `dev/active/backlog-rs-status/REPORT.md`: 항목별 판정 표 + RS5 연결 계획 레인에 넘길 "남은 저장 결함 목록"(한 줄씩, 근거 포함).
6. 로컬 커밋 2개 이내(`docs(backlog-rs-status): …`), 명시 경로 add.

## 금지
- `app/`·`docs/design/`·`docs/decisions/`·`CLAUDE.md`·lock 수정 0(쓰기 = BACKLOG.md · `dev/active/backlog-rs-status/`만). 새 의존성 0. push·merge·원격 쓰기 0. 다른 워크트리 접촉 0. Codex 0.
- 표적 테스트 실행에 `npm ci`가 필요하면 `cd app && npm ci`(lock 변경 커밋 금지).
- 서브에이전트 분할: 권장(읽기 전용 2개 — B-RS-01~03 ∥ 나머지 grep 항목). 쓰기는 메인만.
- 30턴부터 새 조사 중단 → BACKLOG 표기·REPORT 마감. 한국어.
