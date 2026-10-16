# FLAKY-PROJECTS-ALERTS BRIEF (Developer)
책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-16
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/flaky-projects-alerts` (브랜치 `k002bill2/flaky-projects-alerts`, base origin/main `3454702f`)

## 목적
`app/src/pages/ProjectsPage.test.tsx` "목록이 비어도·있어도 … 알림 영역은 둘(목록·저장소)"이 전체 실행에서 가끔 `['프로젝트 알림', null, '저장소 알림']`로 실패한다(단독 실행은 통과). 근본 원인을 찾아 고친다.

## 절차 (systematic-debugging)
1. 재현: 전체 실행 반복 또는 `--sequence.shuffle`/느린 환경 흉내로 재현율을 기록. 재현 못 하면 코드 경로 추론으로 진행하되 그렇게 표기.
2. 원인: aria-label 없는 3번째 `role=status`가 무엇인지 특정(RS4가 추가한 `/projects` 미확인 행 알림·dynamic import 로드 상태 등 후보). 앱 쪽 실제 결함(라벨 없는 status가 사용자에게 잠깐 보임)인지, 테스트 대기 부족인지 판정.
3. 수정: 앱 결함이면 최소 앱 수정(접근성상 라벨 없는 live region 금지) + 회귀 테스트. 테스트 대기 문제면 테스트만 수정. **단언 완화(예: 개수 검사 삭제) 금지.**
4. 검증: 수정 후 해당 파일 20회 반복 + 전체 실행 3회 통과 기록.
- 예산 영향이 있는 앱 수정이면 build 출력의 `/projects` 수치를 REPORT에.

산출물: `dev/active/flaky-projects-alerts/REPORT.md`, `PROGRESS.md`
서브에이전트 분할: 불필요(단일 원인 추적).

## 공통 규칙
- 먼저 `cd app && npm ci`(설치 부산물·`package-lock.json` 변경은 커밋 금지, `git add`는 명시 경로만).
- push·merge·원격 쓰기 금지. 다른 워크트리 접촉 금지. 예산 판정선·ADR·SPEC 수정 금지. 새 의존성 금지. Codex 실행 금지.
- 체크포인트마다 `dev/active/flaky-projects-alerts/PROGRESS.md` 갱신 + 로컬 커밋.
- 마지막에 `app/`에서 `npm run typecheck`·`npm run lint`·`npm test -- --run`·`npm run build` fresh 실행, exit·수치를 REPORT에(base main `3454702f` = 313 files / 2830 tests).
- REPORT는 사실/추정/미확인을 구분한다.
