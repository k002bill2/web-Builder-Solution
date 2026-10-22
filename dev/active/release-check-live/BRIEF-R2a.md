# RELEASE-CHECK-LIVE BRIEF-R2a — B-M2B-05d A안 대조만 (QA, 짧게)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-22
상위 `BRIEF.md` 규칙 승계. 쓰기 경로 = `dev/active/release-check-live/`만. 앱 코드·테스트 수정 금지.

## 이미 끝난 것 (다시 하지 말 것)
- npm ci·build 완료(`logs/build.txt`). C안(1.333) 실측 = h1 **67.3392px** · `--site-t1` **1.333rem** — 원본 `logs/d05-oopif2-C.txt`(Jarvis 확인, 덮어써지지 않았음). OOPIF 부착 방법 = `scripts/d05-oopif2.mjs`.

## 할 일 (이것만)
1. preview 4399 기동(사전 lsof 기록). **새 ego-browser TaskSpace**에서 시작(지난 실패 원인 = 비교 보드 상태가 남아 "전부 선택" 버튼 0개). 필요하면 `/` 새로 열기·IndexedDB 삭제로 상태 초기화.
2. 프로필 비율 1.25 프로젝트(모던 카페, 지난 실행과 같은 경로) → **A안(1.25)** 편집 시작 → `d05-oopif2.mjs` 방식으로 캔버스 h1 font-size·`--site-t1` 수집 → `logs/r2a-A.txt` tee. 기대 48.828px · 1.25rem.
3. 판정: C 67.3392px ≠ A 값이고 둘 다 계산식(scale^5 × 16px, `--site-t1` = scale rem)과 일치 → B-M2B-05d **PASS**. QA-REPORT 1절 표에 A 행·판정 추가, 첫 줄 판정 갱신(B-SEC-09 ②④는 아직 BLOCKED — R2b 예정).
4. 마감: preview 종료·`lsof` 0줄 · TaskSpace finish · PROGRESS 갱신 · 커밋 · `git status --short` 빈 값.

## 규칙
- git push·pull·fetch 금지. 서브에이전트 금지. 기존 로그 덮어쓰기 금지(새 파일명 `r2a-*`). 최대 25턴 — 15턴 안에 A값을 못 얻으면 BLOCKED 기록 후 마감.
