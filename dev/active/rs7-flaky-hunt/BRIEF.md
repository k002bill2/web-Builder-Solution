# RS7 FLAKY BRIEF — 전체 스위트 간헐 실패 식별·수정 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs7-flaky-hunt` (브랜치 `k002bill2/rs7-flaky-hunt`). `app/node_modules` 설치 완료.

## 배경
RS7-C 병합 검증(main = A #27·B #28 + C)에서 전체 `npx vitest run` 6회 중 1회 `1 failed | 3032 passed` — 실패 테스트 이름은 기록 못 함. 이후 5회 연속 통과, C 새 2파일 단독 15/15 통과. 과거 선례: flaky-projects-alerts(ProjectsPage, PR #9).

## 절차
1. **식별**: 전체 스위트를 반복(최소 15회, 시간 상한 안에서 최대 25회, 직렬). 매 회 실패 테스트 이름·파일·오류 원문을 `dev/active/rs7-flaky-hunt/logs/runs.txt`에 append(`--reporter=default` + 실패 시 `--reporter=json` 출력 파일 보존). 실패 0이면 `--sequence.shuffle`·`--pool=forks`/`threads` 변형 각 5회.
2. **원인**: 실패 테스트를 단독·파일 단위·셔플로 재현율 측정. 타이머·전역 리스너(window `beforeunload`·IDB fake·`navigator.locks` 흉내)·테스트 간 공유 상태(레지스트리·모듈 싱글턴) 누수 후보 추적. RS6·RS7에서 추가된 테스트(StudioUnloadGuard·ProjectsRetryGuard·saveCore.mutationGaps·ProjectsCoreRows 등) 우선 의심 — 레지스트리 리스너가 window에 남는 패턴(T16 REPORT 언급).
3. **수정**: **테스트 쪽만**(정리 누락 cleanup·fake timer 복원·격리). 앱 코드 결함이 원인이면 수정하지 말고 근거와 함께 멈추고 REPORT(Jarvis 판단).
4. **검증**: 수정 뒤 전체 스위트 15회 연속 GREEN(로그). 재현 못 하면 "미재현 · 후보 N개 · 근거" 로 마감(추측 수정 금지).
- 쓰기 경로: 원인 테스트 파일 · 테스트 헬퍼(`src/test/**`·`testing/**`) · `dev/active/rs7-flaky-hunt/`. `docs/**`·앱 코드·`vite.config`·`vitest.config` 수정 0(config 변경이 필요하면 근거와 함께 멈춤).
- 서브에이전트: 읽기 전용 1개(후보 테스트 정적 조사) 허용.
- 최대 50턴, 40턴부터 마감. 반복 실행은 백그라운드로 돌려 턴을 아껴라.

## 공통
- base origin/main `bcaa9832`(RS7 PR #29). 병렬 레인 2개(`rs7-m1-close` · `rs7-flaky-hunt`) — 다른 레인 쓰기 경로 접촉 0.
- 앱(비테스트) 코드·기준선·예산 파일·ADR·SPEC 수정 0 (예외는 각 BRIEF에 명시된 것만).
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. REPORT 초안은 마감 10턴 전 커밋.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 출력 0을 REPORT에 기록.
- **마감 전 `git status --short`가 node_modules 외 빈 값이어야 한다**(로그도 커밋하거나 지운다 — untracked가 남으면 worktree 정리가 막힌다).
