# M4-a-4 QA BRIEF LIVE — 릴리스 게이트 2차(실화면, 무인 Chromium 행) (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 tip `ee09160c` = 1차 기록 + **m4a-impl FIX1 tip `41385e10` 병합**(AppSec M-1·M-2·L-1·L-2 · 문구 수정). 계획 `dev/active/m4a-qa/LIVE-PLAN.md`.

## 범위 (무인 행만 — 순서대로)
0. fresh 게이트 1회(FIX1 반영 확인: test 3134 · build · `/studio` 128.71 · 복원 131.69). 앱 코드는 수정하지 않는다.
1. LIVE-PLAN 1절 준비 → **L1 → L3 → L4 → L6 → L10 → L2 → L9** 순서. 각 행 끝날 때마다 QA-REPORT 8절(2차) 표 갱신 커밋.
- L1에서 성공 제목 조사 "정적 사이트(zip)를" 확인(FIX1 F4).
- L3 `open -a "Archive Utility"`는 GUI 실행이라 사람 확인이 필요하면 `ditto -xk` 결과만 쓰고 "Archive Utility 더블클릭 = 미확인"으로 적어라.
- **L5·L7(Safari 수동)·L8(Firefox 미설치)은 실행하지 않는다** — "미확인(무인 run 범위 밖)"으로 기록. Firefox 설치·Safari 자동화 시도 금지.
- L9(R3 큰 문서)는 6턴 한도, 넘으면 BLOCKED로 기록.

## 판정
- 2차 판정(PASS / PASS with notes / FAIL) + **릴리스 게이트 종합 판정**(1차 + AppSec PASS + FIX1 + 2차) 1줄을 QA-REPORT 첫머리에.
- FAIL 기준: 거짓 성공 · 외부 요청 · 스크립트 실행 · 이미지·글꼴 누락 · 예산 초과.

## 규칙
- preview `--port 4395 --strictPort`, http.server `4396`. 마지막 커밋 직전 둘 다 종료 → `lsof -nP -iTCP:4395 -sTCP:LISTEN`·`4396` 0 기록. IDB 삭제·`finish({keep:[]})`. 출력 폴더 `/tmp/m4a-qa-live/`(저장소 밖) — 스크린샷만 `dev/active/m4a-qa/shots/`로 복사 커밋.
- 첫 2턴 QA-BRIEF-LIVE·QA-PROGRESS 커밋. 행마다 커밋. **50턴이 되면 남은 행을 미확인으로 적고 판정 확정·마감.**
- 앱·테스트 수정 커밋 금지, Codex 금지, push·원격 쓰기 금지. 마감 전 `git status --short` node_modules 외 빈 값. 최대 60턴.
