# RS6-L5 QA BRIEF R2 — FIX1 재검증 + 1차 QA 미완 항목 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs6-l5-projects` (tip `f576340c`). 1차 QA 기록: `QA-PROGRESS.md`(1·2·5번 완료, 3·4·6 미완 — run 중단). FIX1: `REPORT.md` "FIX1" 절(선택안 (a) rebase proof = `rebased`, 커밋 `0911b900`).
1차 브리프 `QA-BRIEF.md`의 정본·판정 기준·제외·산출물 규칙을 그대로 따른다.

## 할 일
1. **FIX1 재검증(최우선)**: 1차 FAIL 경로(restoreSnapshot·resolveConflict 뒤 flush 실패 → 기억 해제)가 닫혔는지 임시 테스트로 재현 시도. `"rebased"` 추가가 다른 판독 경로(편집기 표시·confirm·discard·restart `DocBook.start`)에서 새 거짓 상태를 만들지 않는지 grep·추적. flush 실패 뒤 "저장 확인" 클릭이 쓰기 탭 재쓰기 → 해제로 끝나는지(테스트 없음 — 임시 테스트로 확인). 변이: `rebased`→`committed` 되돌림 FAIL 확인.
2. 1차 생존 변이 3종(M1 행 우선순위 · M3 페이지 guard · M4b 페이지 catch) — 테스트 공백 심각도 판정만(수정 금지).
3. 접근성(QA-PROGRESS 3번) · Ego Lite 실화면(4번 — 다른 탭 writer 잠금으로 해제 save 실패 행 → "다시 저장" · PendingStart 행 · 1280·390). preview `--port 4383 --strictPort`. **끝나면 반드시 서버 종료·리슨 0 확인**(1차 run이 4382를 남김). IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`. 5480 무접촉.
4. fresh 게이트(기대 332/2971 · `/studio` 129.09 · 복원 132.07).
5. `QA-REPORT.md` 작성(1차 기록 통합 · FIX1 판정 포함) · 커밋.

- 첫 2턴 QA-BRIEF-R2·QA-PROGRESS 갱신 커밋. **QA-REPORT를 40턴 전에 초안 커밋**(중단 대비), 이후 보강. 최대 55턴.
- 앱·테스트 수정 커밋 금지. push·원격 쓰기·다른 워크트리·Codex 금지.
