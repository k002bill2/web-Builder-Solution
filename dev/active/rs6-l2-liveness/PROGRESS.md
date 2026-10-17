# RS6-L2 PROGRESS — liveness (저장 감시 · discard 포기 토큰 + L1 QA notes)

브랜치 `k002bill2/rs6-l2-liveness` · base `3a77c8eb` · 브리프 `BRIEF.md`

## 체크리스트
- [x] 0. BRIEF·PROGRESS 커밋 (`7ab50191`)
- [x] 1. 정본 읽기 (PLAN 3절 L2 · INTEGRATE-6 3절·8.1 · L1 REPORT 7·8절 · QA-REPORT 0·4절) · base 예산 실측
- [x] 2. CP1 LV-1 저장 감시 (`saving-slow`, view() mark·inflight) — RED 예측 → RED 로그 → GREEN 커밋 · 예산 기록
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
| base 3a77c8eb | 128.55 (복원 131.53) | 129.88 (복원 132.92) | `logs/base-build.log` · 상한 129.13/132.11 · L2 목표 ≤128.65 |
| CP1 1차(감시 = 스케줄러 본문) | 128.66 (+0.11) · 131.64 | 129.98 · 133.01 | 멈춤선 128.58 초과 → 감량 1회 |
| CP1 감량(감시 = `watchSaving` onChange 데코레이터, 미배선) | 128.55 (+0.00) · 131.54 (+0.01) | 129.89 · 132.92 | 기준선 변경 0 · 감시 결합 비용(≈+0.1 추정 — 1차 실측)은 L3가 훅에 붙일 때 진입에 실린다 |

## RED 예측 · 로그
- CP1 예측: `liveness.test.ts` 6건 중 RED 6(모듈 `./liveness` 없음 → 파일 전체 실패). 실측: 파일 실패(모듈 없음) = 6/6 RED (`logs/cp1-red.log`). GREEN 6/6 · 전체 323/2908(base 322/2902 +1/+6) · 기존 테스트 delta 0.
  - GREEN 중 테스트 결함 1건 수정: 코어 층 편집 B를 `c.save()` 직후 동기로 하면 제출 동결(connect 뒤) 전이라 newer=false가 정당 → `await ticks()` 뒤 편집으로 바로잡음(구현 변경 0).

## 결정·차이
- `saving-slow` = `phase:"saving"` + `slow:true` 표지(I6 8.1 "(+)" 표기). 사유: 새 phase 리터럴이면 `useDocSave.ts:120` 떠나기 대기(`now === "saving"`)가 정지 중 false로 풀리고(L3 동작 변경) `saveStatusText` exhaustive switch(L4 본문)를 고쳐야 한다.
- 감시 = `save/liveness.ts` `watchSaving(onChange)` 데코레이터(스케줄러 본문 변경 0 · 감량 1회 결과). 편집기(useDocSave)는 아직 붙이지 않는다(배선 = L3). 기존 테스트·편집기 동작 변화 0.
