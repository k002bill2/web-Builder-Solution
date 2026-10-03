# M2A-3b PROGRESS — 정적 HTML 생성기(숨은 렌더 iframe 직렬화) · 내려받기 · 3a 이관

## 수신 기록
- 2026-10-04 수신. 브리프 `docs/06-handoff/M2A-3B_STATIC-HTML_BRIEF.md` 전체 읽음(56행).
- 시작 커밋: `a51de92` (브랜치 `k002bill2/m2a-3b`, worktree `orca/workspaces/web-builder-solution/m2a-3b`)
- 서브에이전트: 금지(브리프). 포트 4337(필요 시 4339만, 127.0.0.1). 로컬 커밋만(`git commit -- <경로>`), push·병합·삭제 없음. 90턴부터 REPORT 마감 우선.
- 번들: `/studio` 진입 ≤ 126.70(지금 126.67 · 127 이상 상향 금지 · 넘으면 S-B5 이동 먼저, 그래도 넘으면 멈춤) · 렌더 JS ≤ 89.70 · CSS ≤ 30 · 그 밖 ±0.03.
- 금지: `ExportJob`·`ExportGenerator` 타입 변경 · `allow-same-origin` · 단언 약화·skip · 새 의존성·아이콘 · 엔진 계약 변경 · `design/`·`docs/design/`·`docs/decisions/` 수정.
- 게이트: `dev/active/m2a-3b/gate.sh` — 3a 판과 같되 실패 시 exit 1. exit 0 확인 후에만 커밋.

## 단계
- [x] 수신 · REPORT 골격(1~9절) 커밋 — 08640e5
- [x] G0 (1) Codex `review --scope branch --base bec1b38` → `logs/g0-codex-3a.txt` · P1 수정(RED→GREEN) · P2 이하 REPORT 2절 — P1 0 · P2 3(3c로)
- [x] G0 (2) 브라우저 A안 → 폴백 2개 삭제 → 차단 해소 → `GENERATOR_UNAVAILABLE` `shots/g0-1280-unavailable.png` · 대화상자 `shots/g0-1280-dialog.png` — 통과 가능 확인, 캡처는 aside 1440(ego 캡처 시간 초과)
- [x] G1 생성 방식 PoC 비교표(REPORT 3절) — 기본안 채택 · react-dom/server 140.55 기각
- [x] G2 serialize/html 프로토콜(RED 먼저 · REPORT 4절)
- [x] G3 static-html 생성기 · 등록(전역 슬롯 — 래퍼는 진입 초과) · 진입 실측 126.70(REPORT 5·7절)
- [x] G4 E-S27 완료 문구 · 내려받기 · 파일 이름(REPORT 5·8절) — gate g4 exit 0
- [x] G5 — Jarvis 판정(REPORT 6절 · shots/j-html-*) · K-AC-12·30 상호작용은 3c로
- [x] G6 — 레인 캡처 g6-1440-done/again · 로그 없음(REPORT 6절)
- [x] G7 — Jarvis vitest x3 exit 0 · Codex는 3c로 · REPORT 마감(Jarvis) · 서버 Jarvis 종료

## 서브에이전트
- 사용 0 (브리프 금지)

## 메모
- 4337: vite dev PID 14810(이 레인이 띄움) — 끝에 종료.
- 브라우저: ego 캡처 불가 → aside repl(호출마다 탭 닫힘 → /tmp/m2a3b/prefix.js 흐름 재실행).
