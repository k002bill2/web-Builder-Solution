# M2B-1b-hardening PROGRESS — Popover 폴백·포커스 링 검증 공백 종결

- 브리프: `docs/06-handoff/M2B-1B_HARDENING_BRIEF.md` (영환님 ★A 승인 범위)
- worker 시작 HEAD `c79bb65` (코드 baseline `9e87308`) · 브랜치 `k002bill2/m2b-1b-hardening` · 시작 2026-10-05 03:01 KST
- 실행: Orca managed Claude Code(Opus) 단일 레인 · 서브에이전트 0 · 포트 127.0.0.1:4337(보조 4339) · main 5480 무접촉
- 쓰기: app/src/kit/kit.css · 표적 테스트 · (필요 최소) app/src/render/testing/drawKit.tsx · dev/active/m2b-1b-hardening/ 만. docs/·design/ 수정 0

## 체크리스트
- [ ] P0 PROGRESS·REPORT 골격·gate.sh 커밋
- [ ] P0 npm ci(잠금 불변) · baseline gate(typecheck·lint·가드·build) · 전체 suite 기준 개수 재확인
- [ ] P1 폴백 구조 RED 테스트 → 최소 CSS 수정 → GREEN
- [ ] P1 브라우저: 지원 상태(4변형×3폭) 회귀 0 + 모의 미지원(강제 분기) 상태 판정 — 원본/모의 차이 기록
- [ ] P2 qb 복사·링 판정 개선(footer 실제 a · 부모 바깥 면 · ratio≥3 · 부정 표본 RED)
- [ ] P3 390 two-tier nav 빈 값 + utility 상태 rect·캡처 1
- [ ] P4 gate · 전체 vitest 1회 · 번들 예산
- [ ] P4 Codex review 1회 회수
- [ ] P4 REPORT 1~8절 · 서버 종료 LISTEN 0 증거

## 메모
