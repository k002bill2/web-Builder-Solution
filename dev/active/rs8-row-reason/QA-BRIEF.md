# RS8-2 QA BRIEF — `view().reason` · `/projects` stale 행 첫 표시 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 `k002bill2/rs8-row-reason` (tip `d2bc8702`, base `494a7c6f`). Developer 보고 `dev/active/rs8-row-reason/REPORT.md`.

## 검증 (최우선 = 잠금 0 · 거짓 상태 0)
1. **잠금 회귀(Codex P2 재발)**: `/projects` 렌더·행 판정·재판정(`watchCores`)·버튼 클릭 전 단계에서 `navigator.locks.request`·`gate.enter`·`port.mode` 호출 0 — 코드 추적 + 스파이 임시 테스트 + 실화면 2탭(`navigator.locks.query()` held에 `/projects` 탭 writer 0). 클릭 뒤(`다시 저장` = core.save)는 잠금 획득이 정상 — 구분해서 기록.
2. **`view().reason` 수명**: 기록·해제 규칙(saved·discard·rebased·not-persistent·재시도 성공·편집 재개)에서 오래된 reason이 남아 거짓 stale/readonly 행을 보이는 경로 0 · reason 없음인데 실패 행인 경로 0. 변이: 해제 규칙 각각 제거 → FAIL.
3. **행 문구·버튼**: stale·cleared·readonly 첫 표시가 UX-5 2.3 원문 · stale에서 "다시 저장" 숨김 규칙 · 2벌 가드 유지.
4. 예산 fresh: `/studio` 128.66 · 복원 131.65 · `/projects` 99.09/109.54.
5. fresh 게이트: typecheck·lint·test(349/3049)·build.
- 실화면 preview `--port 4392 --strictPort`. IDB 삭제·`finish({keep:[]})`.

## 판정·규칙
- `/projects`가 잠금을 잡거나 거짓 사유 행이 보이면 FAIL. 앱·테스트 수정 커밋 금지. Codex 금지.
- `dev/active/rs8-row-reason/{QA-PROGRESS,QA-REPORT}.md`. 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋. 최대 45턴.

## 공통
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. **REPORT(또는 산출 문서) 초안은 15턴 안에 먼저 커밋**, 이후 보강(중단 대비). 사실/추정/미확인 구분.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 출력 0을 REPORT에 기록.
- 마감 전 `git status --short`가 node_modules 외 빈 값.
