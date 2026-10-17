# RS7-C BRIEF — 생존 변이 테스트 공백 메우기 (B-RS-08) (Developer, 테스트만)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs7-mutation-gaps` (브랜치 `k002bill2/rs7-mutation-gaps`).

## 범위 (새 테스트 파일만 · 앱 코드 0)
B-RS-08 목록 — 각 레인 REPORT/QA-REPORT 변이 절에서 변이 정의를 읽고:
- L5: M1 행 우선순위 · M3 페이지 guard 단독 · M4b 페이지 catch (`dev/active/rs6-l5-projects/QA-REPORT.md` 2절)
- L1: U14-b · U10-a · IMG-meta (`dev/active/rs6-l1-port/QA-REPORT.md`)
- L3a: M2b 복원·restart 경로 epoch 단언 (`dev/active/rs6-l3a-editor/QA-REPORT.md`)
- 각 변이마다: 변이 적용 → 새 테스트 RED 로그 → `git checkout -- <앱 파일>` → GREEN. 도달 불가 방어 코드라 테스트로 잡을 수 없는 것은 "도달 불가" 판정 + 근거(테스트 추가 0).
- **중복 회피**: RS7-A가 `ConflictCallout`·`useDocSave.resolve`·충돌 경로를 삭제한다 → 그 경로 대상 변이는 건너뛰고 REPORT에 "RS7-A로 소멸". RS7-B가 `pendingRows`·`retryRow` 판정을 바꾼다 → **L5 M1(행 우선순위)은 RS7-B 이후로 이월**(이 레인에서 하지 않음, REPORT에 인계).
- 쓰기 경로: **새** `*.test.ts(x)` 파일만(기존 테스트 파일 수정 0) · `dev/active/rs7-mutation-gaps/`. 앱 코드·기준선·문서 0. build는 확인용 1회.
- 전체 스위트 2회 연속 GREEN(flaky 0).
- 최대 55턴, 42턴부터 마감.

## 공통 규칙
- base origin/main `73289c90`(RS6 종료 PR #26). 병렬 레인 3개(`rs7-dead-conflict` · `rs7-rows-text` · `rs7-mutation-gaps`) — **다른 레인 쓰기 경로 접촉 0**.
- 예산(ADR-004 개정 17): `/studio` 정규화 129.12 / 상한 129.13 · 복원 132.10 / 132.11 · raw 130.43 / 130.5 · `/projects` 100/125 · `/profile` 첫 화면 99.52/100. **증분 금지**(줄면 좋다). 상한 초과 → 감량 1회 → 멈춤.
- 기준선 파일(`m2cBaseline.json`·`bundleBudget.test.mjs`)은 **`rs7-dead-conflict`만** 실측 하향 갱신 가능. 다른 레인 수정 금지. `check-bundle-size.mjs`·ADR·SPEC 수정 금지.
- TDD(RED 로그 `dev/active/<레인>/logs/`) · 기존 단언 약화·skip 0 — 바뀐 단언은 이전/이후·근거 표.
- fresh `typecheck`·`lint`·`npm test -- --run`(base 341/3027 ± 설명)·`build`. Codex review 1회(`--scope branch --base 73289c90`).
- `dev/active/<레인>/{PROGRESS,REPORT}.md`(사실/추정/미확인). 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. **REPORT 초안은 마감 10턴 전 커밋.** preview를 띄우면 반드시 종료·리슨 0.
- 서브에이전트 분할은 필요할 때만(레인당 ≤4, 쓰기는 worktree 격리).
