# RS6-L2 PROGRESS — liveness (저장 감시 · discard 포기 토큰 + L1 QA notes)

브랜치 `k002bill2/rs6-l2-liveness` · base `3a77c8eb` · 브리프 `BRIEF.md`

## 체크리스트
- [x] 0. BRIEF·PROGRESS 커밋 (`7ab50191`)
- [x] 1. 정본 읽기 (PLAN 3절 L2 · INTEGRATE-6 3절·8.1 · L1 REPORT 7·8절 · QA-REPORT 0·4절) · base 예산 실측
- [x] 2. CP1 LV-1 저장 감시 (`saving-slow`, view() mark·inflight) — RED 예측 → RED 로그 → GREEN 커밋 · 예산 기록
- [x] 3. CP2 LV-2 포기 토큰 (`blocked{timeout}`) + MC I7 주석 + L1 QA note 1 (`blocked{newer}`) — RED → GREEN · 예산
- [x] 4. CP3 `T_hang` alert 1회 · 재마운트 재발화 0 · 키 상수/`role=alert`/`aria-busy` — RED → GREEN · 예산
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
| CP3 1차(키를 `liveness.ts`에 둠) | 128.72 (+0.15) · 131.70 | 130.10(한도 130 초과) · 133.13 | 감량 1회 |
| CP3 감량(키 = `save/alertKeys.ts` 분리) | 128.63 (+0.06 · L2 누적 +0.08) · 131.61 (+0.05 · 누적 +0.08) | 129.96 · 132.99 | 기준선 128.63·131.61 · eagerKb 129.96·132.99 · note CP3 · bundleBudget.test 2줄 |
| CP2 (`core.discard()` 동기 진입 + `discards` 필드 진입 · 포기 판정은 coreIo 조작 뒤) | 128.57 (+0.02) · 131.56 (+0.03) | 129.90 · 132.93 | 기준선 갱신 normEagerKb 128.57·131.56 · eagerKb 129.90·132.93 · note "개정 17 배분 RS6-L2 CP2" · bundleBudget.test 기대값 2줄 |

## RED 예측 · 로그
- CP1 예측: `liveness.test.ts` 6건 중 RED 6(모듈 `./liveness` 없음 → 파일 전체 실패). 실측: 파일 실패(모듈 없음) = 6/6 RED (`logs/cp1-red.log`). GREEN 6/6 · 전체 323/2908(base 322/2902 +1/+6) · 기존 테스트 delta 0.
  - GREEN 중 테스트 결함 1건 수정: 코어 층 편집 B를 `c.save()` 직후 동기로 하면 제출 동결(connect 뒤) 전이라 newer=false가 정당 → `await ticks()` 뒤 편집으로 바로잡음(구현 변경 0).

- CP2 예측: `liveness.discard.test.ts` 7건 RED 7(`core.discard` 없음 — TypeError). 실측 7/7 RED (`logs/cp2-red.log`). GREEN 7/7 · save/ 59/59 · 전체 324/2915.
  - 변이 검출력: ① 진입 mark를 connect 뒤에 잡기 → note1 RED 1 (`logs/cp2-mut-note1.log`) ② finally 토큰 검사 제거(늘 해제·토큰 증가 0) → U5 늦은 결과 버림 RED 1 (`logs/cp2-mut-token.log`). 둘 다 원복.
  - 기존 테스트 변경: `saveCore.modes.test.ts` 헬퍼 `discardOf` 1줄 = `core.discard()`(제품 경로로 — 단언 변경 0 · CE-1·CX-3 h6-7·h6-8 포함 14건 GREEN).

- CP3 예측: `liveness.status.test.tsx` 3건 RED 3(키 상수 없음 · aria-busy 없음). 실측 3/3 RED (`logs/cp3-red.log`). GREEN 3/3 · 전체 325/2918 · `SaveStatus.test.tsx` 기존 GREEN(변경 0).

## 결정·차이
- `saving-slow` = `phase:"saving"` + `slow:true` 표지(I6 8.1 "(+)" 표기). 사유: 새 phase 리터럴이면 `useDocSave.ts:120` 떠나기 대기(`now === "saving"`)가 정지 중 false로 풀리고(L3 동작 변경) `saveStatusText` exhaustive switch(L4 본문)를 고쳐야 한다.
- `T_hang` alert = `SaveStatus` `role=alert`에 `data-alert-key="save-hang"`(키만 · 글자 본문은 L4). 재마운트 재발화 0 = 마운트 때 `state.hang`(저장 차례 번호)을 기억해 같은 차례면 키를 붙이지 않는다. `aria-busy` = 상태 글자 `<p>`(phase saving) — alert 영역의 조상에 두면 busy 동안 alert 낭독이 보류될 수 있어 컨테이너가 아닌 글자에 둔다.
- 감시 = `save/liveness.ts` `watchSaving(onChange)` 데코레이터(스케줄러 본문 변경 0 · 감량 1회 결과). 편집기(useDocSave)는 아직 붙이지 않는다(배선 = L3). 기존 테스트·편집기 동작 변화 0.
