# STUDIO-SLIM 재개 지시 (영환님 ★A, 2026-10-03 · Jarvis)

- 결정: **안 A 채택**(`dev/active/studio-slim/REPORT.md` 3절 — 새 `data/deferredStudio.ts`, store + 프로필 즉시, 보드·생성·프로젝트는 같은 store를 쓰는 `createSharedLoader` 지연 로더, 비교 픽스처는 보드 로더 안). 시제품 `logs/s1-protoA.patch` · `logs/s1-protoA-deferredStudio.ts.txt`에서 시작한다.
- **`/compare` 첫 +0.09 · 진입 +0.31은 허용**(ADR-004 개정 3 결정 1, main에 기록). 이 레인의 번들 판정은 아래로 바뀐다:
  - `/studio/:projectId` 진입 직후 ≤ 118.60(시제품 118.44 + 0.16) · `/projects` 진입 ≤ 100.30
  - `/compare` 첫 ≤ 98.87 · 진입 ≤ 121.74(시제품 +0.03)
  - 그 밖 화면·공통: 기준선 ±0.03 이내 또는 감소. 렌더 문서 변화 0.
  - 예산 상수·멈춤선 변경 금지(개정 3의 127은 **M2A-3a 몫** — 이 레인은 건드리지 않는다).
- 이번 실행 범위: **S2(RED → GREEN) · SCENARIOS 목록 갱신 · S4(브라우저 흐름 1회 · 전체 vitest 3회 · Codex 1회) · REPORT 마감.** S3은 하지 않는다(`useAutosaveScheduler` 후보는 REPORT 기록만 유지).
- RED 설계는 REPORT 5절 그대로: (1) `profiles.getProfile` + `projects()`만 부른 뒤 보드·생성 import 호출 0 (2) 같은 팩토리로 확정 → 프로필 → 3안 → `startDoc`이 store 하나로 이어짐.
- 나머지 규칙은 `docs/06-handoff/STUDIO-SLIM_BRIEF.md` 그대로.
