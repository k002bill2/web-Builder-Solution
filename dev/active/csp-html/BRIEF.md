# CSP-1 BRIEF — 정적 HTML 1개 고정 CSP 구현 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-20 (영환님 "1" — CSP-SPEC r1 5a, CQ-07 B 1단계)
base origin/main `ec32f407`. 정본 `docs/design/csp/CSP-SPEC.md` r1 + 5a(1.1 · 2.1 · 3.1 · 4.1 · 4.3 · 4.4).

## 범위 = `static-html`만
- CSP-AC-01 · 03 · 04 · 05 · 06(html) · 07(html) · 08 · 10 단위 테스트 TDD(RED 먼저).
- meta 위치 CQ-01 A(charset 다음) · 메뉴 스크립트 해시 상수 옆 고정 + 대조 테스트(CQ-02 A, 런타임 계산 금지) · F-15 마크업 검사 개정(4.4 정본 문서 함께).
- 실화면 R1(1280·390 CSP 전·후 스크린샷 바이트 동일 · 위반 0) · R5(html, 390 메뉴 시트 닫힘) — Ego Lite 1회, preview `--port 4399 --strictPort`, 뷰포트 override는 측정과 같은 스크립트 안. preview 종료·리슨 0.
- **zip·React zip 코드는 건드리지 않는다**(2단계).
## 예산·규칙
- `/studio` 진입·복원 증분 0이어야 한다(생성기 청크 안). 증분이 생기면 감량 1회 → 그래도 있으면 멈추고 보고. 렌더 JS·CSS 판정 불변.
- Codex adversarial 1회(`--help` 금지)·반영 1회. 새 의존성 0, 킷·렌더·엔진 0, 단언 약화·skip 0.
- **git push·pull·fetch 등 원격 명령 일절 금지.** 첫 2턴 BRIEF·PROGRESS 커밋, REPORT 초안 10턴 안, 항목마다 커밋. 마감 전 `git status --short` 빈 값. 최대 55턴, 45턴부터 마감.
