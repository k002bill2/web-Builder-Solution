# Web Builder Solution — Hermes Design Benchmark Studio

디자인 레퍼런스를 탐색·비교하고, 요소를 골라 디자인 프로필로 확정한 뒤 홈페이지를 생성하는 솔루션.

## 구조
- `docs/` — 기획 문서 (PRD·TRD·개발계획서·TDD, 결정 기록 `docs/decisions/`)
- `design/claude-design-handoff/` — Claude Design 핸드오프 원본 (**수정 금지**). 구현 기준은 시안 **1a**
- `app/` — 웹 앱 (M1-UI에서 생성)

## 규칙
- 기본 브랜치 `main`에 직접 작업하지 않는다. 기능은 Orca worktree에서 진행한다.
- 원격 저장소 연결·push는 영환님 승인 후.
- 테스트 먼저 작성한다 (`docs/05-tdd/TDD.md`).
