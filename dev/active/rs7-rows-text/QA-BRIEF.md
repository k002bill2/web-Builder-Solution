# RS7-B QA BRIEF — /projects·/profile 문구 정합 독립 검증 (QA, 짧게)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs7-rows-text` (tip `1d8e9e9a`, base `73289c90`). Developer 보고 `dev/active/rs7-rows-text/REPORT.md`.
Jarvis 판정(참고): B-RS-09 되돌림(Codex P2 — `port.mode()`가 writer 잠금 획득) 수용. B-RS-09는 백로그 유지.

## 검증
1. **B-RS-15 (최우선 — 거짓 성공 제거)**: `retryRow` 폴백 2곳이 `{ok: true, text: ""}`로 바뀐 뒤 — 페이지가 ok:true를 어떻게 처리하는지(포커스·status·행 새로고침) 추적. 저장 0인데 성공 문구·성공 포커스가 남는 경로 0인지. 실제 저장된 경우의 성공 문구("다시 저장했습니다")는 그대로인지. 변이: 폴백을 원래 문구로 되돌림 → 새 테스트 FAIL.
2. **B-RS-17**: `/profile` 버튼·C-E4·C-E6 알림 라벨 치환이 UX-5 D1 원문과 일치 · 다른 화면(`/projects` "시작 다시 시도")과 같은 문자열 · 단언 교체 2파일이 약화 아님.
3. **B-RS-09 되돌림 완결성**: `git diff 73289c90 -- app/src` 에 `bd3163a3`의 앱 변경 잔재 0(`coreRowText.test.ts` 가드만) · 2벌 일치 가드가 실제로 두 문자열을 비교하는지(변이: 한쪽 글자 변경 → FAIL).
4. 실화면(짧게): build + preview `--port 4388 --strictPort` — `/profile` "시작 다시 시도" 라벨(PendingStart 상태를 만들 수 없으면 BLOCKED 기록) · `/projects` 일반 흐름 회귀 0. **반드시 서버 종료·리슨 0.** IDB 삭제·`finish({keep:[]})`. 5480 무접촉.
5. fresh 게이트: typecheck·lint·test(기대 345/3036)·build(`/studio` 129.12 · `/profile` 첫 ≤ 100 · `/projects` ≤ 100/125).

## 판정·규칙
- 거짓 성공 문구·포커스 경로가 남으면 FAIL.
- 앱·테스트 수정 커밋 금지. push·원격 쓰기·다른 워크트리·Codex 금지.
- `dev/active/rs7-rows-text/{QA-PROGRESS.md, QA-REPORT.md}` 명시 경로 커밋. 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋. QA-REPORT 초안 25턴 전. 최대 35턴.
