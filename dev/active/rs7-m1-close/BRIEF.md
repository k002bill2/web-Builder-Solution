# RS7-M1 마무리 BRIEF — L5 M1 테스트 · BACKLOG 상태 갱신 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17 (영환님 "1" — RS6·RS7 마무리 묶음)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs7-m1-close` (브랜치 `k002bill2/rs7-m1-close`). `app/node_modules` 설치 완료.

## 1. L5 M1 행 우선순위 변이 테스트 (새 테스트 파일만)
- 정의: `dev/active/rs7-mutation-gaps/REPORT.md` 1절 M1 행 · `dev/active/rs6-l5-projects/QA-REPORT.md` 2절. RS7-B(PR #28) 뒤 현재 `pendingRows.ts` `describeRow` 우선순위(시작 대기 > 저장 중 > 저장 실패 > 미확인 기록)를 읽고 기대값 확정(근거 줄 인용).
- 테스트: "시작 대기 + 코어 dirty(저장 실패) 조합 행 → 라벨 = 시작 다시 시도 · 클릭 = starter 1회 · core.save 0" + 필요하면 "저장 중 + 미확인 기록" 조합 1건.
- RED 증명 = 변이(우선순위 뒤바꿈 · `git checkout -- <앱 파일>`로 매번 복원) → 새 테스트 FAIL 로그 `dev/active/rs7-m1-close/logs/`.
- 전체 스위트 1회 + 새 파일 단독 10회 GREEN.

## 2. BACKLOG 상태 갱신 (`docs/06-handoff/BACKLOG.md`만)
- RS7 결과 반영(근거 = PR·REPORT 경로):
  - B-RS-06 ✅ PR #27(`/studio` 129.12→128.66 · 복원 131.64 · 여유 0.47)
  - B-RS-07 ✅ PR #27(ConflictCallout·resolve 제거, QA `dev/active/rs7-dead-conflict/QA-REPORT.md`)
  - B-RS-08 🔶 PR #29(5종) + 이 레인 M1 · 남은 U14-b(Low, `dev/active/rs7-mutation-gaps/REPORT.md` 3절)
  - B-RS-09 열림 유지 + 재개 조건: 저장 코어에 잠금 없는 조회(`peek`) 또는 마지막 실패 reason 필드(새 인터페이스 — 승인 필요) · 되돌린 구현 `bd3163a3`(ProjectsReasonRows.test 3건) 재사용 가능 · 근거 Codex P2(`port.mode()`가 writer 잠금 획득)
  - B-RS-15 ✅ PR #28 · B-RS-17 ✅ PR #28
  - B-RS-16: RS7-B QA에서도 실화면 BLOCKED(PendingStart 생성 불가) 1줄 추가
  - 새 행: 전체 스위트 간헐 실패 1건(RS7-C 병합 검증 6회 중 1회, 원인 미식별) — 병렬 레인 `rs7-flaky-hunt` 결과는 Jarvis가 머지 때 기입
- 표 형식·ID 규칙은 기존 표를 따른다. 다른 문서 수정 0.

## 마감
- fresh `typecheck`·`lint`·`npm test -- --run`(base 346/3033 + 증분). `dev/active/rs7-m1-close/{PROGRESS,REPORT}.md`. 최대 35턴.

## 공통
- base origin/main `bcaa9832`(RS7 PR #29). 병렬 레인 2개(`rs7-m1-close` · `rs7-flaky-hunt`) — 다른 레인 쓰기 경로 접촉 0.
- 앱(비테스트) 코드·기준선·예산 파일·ADR·SPEC 수정 0 (예외는 각 BRIEF에 명시된 것만).
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. REPORT 초안은 마감 10턴 전 커밋.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 출력 0을 REPORT에 기록.
- **마감 전 `git status --short`가 node_modules 외 빈 값이어야 한다**(로그도 커밋하거나 지운다 — untracked가 남으면 worktree 정리가 막힌다).
