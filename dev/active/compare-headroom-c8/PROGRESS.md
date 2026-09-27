# COMPARE-HEADROOM-C8 — PROGRESS

브리프: `docs/06-handoff/COMPARE-HEADROOM-C8_BRIEF.md` · 기준 main `5562dc2` · 브랜치 `k002bill2/compare-headroom-c8` · 포트 4339

## 수신 (2026-09-27)
- 목표: `/compare`·`(조정 있음)` 첫 화면 −0.45KB 이상(99.66 → ≤ 99.21), 다른 라우트 증가 0, 동작·접근성 불변.
- 1순위 C8만. 부족할 때만 2순위(routes 측정 스파이크, 제품 코드 반영 금지).
- 금지: 예산·분류·번들 스크립트, profile 파일, data/**, routes.tsx, layout/**, main.tsx, engine/**, 새 의존성.

## 체크포인트
- [x] 브리프·a1-β REPORT·BUNDLE-01 C8·2a-04b1 14.1 읽기
- [x] 기준 build 실측 — `logs/baseline-build.txt` (/compare 99.66 / 120.57, 공통 89.13)
- [x] 로딩 구간 확인 — `useCompareBoard`가 엔진 import 완료 뒤에만 `phase="ready"`(로드 실패는 `error`). 페이지는 `loading`이면 `LoadingState`, `DraftPanel`·`DraftSummaryBar`는 ready + 열 ≥ 1 + `view`(엔진 필요)일 때만 그린다 → 진행 가능
- [ ] TDD RED: 엔진 청크에서 패널·요약 바를 받는다는 테스트
- [ ] C8 이동 + build 실측 로그
- [ ] 4게이트 (typecheck · lint · vitest 전체 · build)
- [ ] 127.0.0.1:4339 실제 클릭 1280/390 캡처
- [ ] (필요 시) 2순위 routes 스파이크
- [ ] Codex 검증
- [ ] REPORT.md + 로컬 커밋
