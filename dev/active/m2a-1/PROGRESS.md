# M2A-1 렌더 기반 — PROGRESS

## 수신 기록
- 2026-10-03 수신: `docs/06-handoff/M2A-1_RENDER-BASE_BRIEF.md` 전체 읽음 · 시작 커밋 `72fe57f` (main merge m2a-briefs) · 브랜치 `k002bill2/m2a-1`
- 근거 읽음: ADR-004 개정 2 결정 1~5 · SPEC 5.7 r4.8 · S-B12 · E-AC-49 · Opus R2 B-1 ③ 1~8
- 규칙: 서브에이전트 금지 · 새 의존성/아이콘 0 · design/·docs/design/·docs/decisions/ 수정 금지 · navigate(replace) 금지 · 포트 4337 · 로컬 커밋 `git commit -- <경로>`만 · R1 `allow-same-origin` 필요 시 멈춤
- 게이트: `dev/active/m2a-1/gate.sh <로그> [표적]` (표적 + 가드 + typecheck + lint + build)

## 체크리스트
- [ ] R0 기준선 — 번들 표 · 1280/390 스크린샷 · 캔버스 테스트 목록
- [ ] R1 샌드박스 PoC — dev · preview 둘 다 `ready` (allow-scripts만)
- [ ] R2 번들 검사 스크립트 — 테스트 RED → GREEN
- [ ] R3 렌더 문서 본체 — import 가드 RED → 수신기 · 재검증 · 폴백 이전 · 표식
- [ ] R4 부모 호스트 · 오버레이 — 옮긴 단언 표
- [ ] R5 번들 실측(전후) · 브라우저 확인(E-AC-49) · r5 스크린샷
- [ ] R6 전체 vitest ×3 · Codex 1회 · REPORT

## 로그
