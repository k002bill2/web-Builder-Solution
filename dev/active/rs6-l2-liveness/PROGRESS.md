# RS6-L2 PROGRESS — liveness (저장 감시 · discard 포기 토큰 + L1 QA notes)

브랜치 `k002bill2/rs6-l2-liveness` · base `3a77c8eb` · 브리프 `BRIEF.md`

## 체크리스트
- [ ] 0. BRIEF·PROGRESS 커밋
- [ ] 1. 정본 읽기 (PLAN 3절 L2 · INTEGRATE-6 3절·8.1 · L1 REPORT 7·8절 · QA-REPORT 0·4절) · base 예산 실측
- [ ] 2. CP1 LV-1 저장 감시 (`saving-slow`, view() mark·inflight) — RED 예측 → RED 로그 → GREEN 커밋 · 예산 기록
- [ ] 3. CP2 LV-2 포기 토큰 (`blocked{timeout}`) + MC I7 주석 + L1 QA note 1 (`blocked{newer}`) — RED → GREEN · 예산
- [ ] 4. CP3 `T_hang` alert 1회 · 재마운트 재발화 0 · 키 상수/`role=alert`/`aria-busy` — RED → GREEN · 예산
- [ ] 5. L1 QA note 3 (`port.mode()`·`port.verify()` throw → `failed{infra}`) — RED → GREEN
- [ ] 6. L1 QA note 4 (HARNESS-MAP 집계 정정 · 가능 시 #28 등 보강)
- [ ] 7. L1 QA note 2 → REPORT "L3 전 조건" 이월 (고치지 않음)
- [ ] 8. 마감 게이트 fresh (typecheck·lint·test·build + 전 라우트 번들 표)
- [ ] 9. REPORT.md (AC 판정·notes·L3 전 조건·시간 잠정값·예산 표·MC I7 문장·사실/추정/미확인) 커밋

## 예산 (ADR-004 개정 17 · L2 목표 ≤ +0.10 정규화)
| 시점 | `/studio` 정규화 | raw | 비고 |
|---|---|---|---|
| base 3a77c8eb | (측정 예정) | | |

## RED 예측 · 로그
(CP별 기록)

## 결정·차이
(기록)
