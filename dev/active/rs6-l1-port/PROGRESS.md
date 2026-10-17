# RS6-L1 PROGRESS — 저장 코어 포트·코어 이식

브리프: `BRIEF.md` · 브랜치 `k002bill2/rs6-l1-port` · base `0c196b81` · 시작 2026-10-17

## 체크리스트
- [x] 0. BRIEF·PROGRESS 커밋 (`bc631f4d`)
- [x] 0b. 정본 읽기(PLAN L1 표 · INTEGRATE-6 r1 · 코어 원본 · s6c-slim 패치) + base 게이트 실측
- [x] 1. 하네스 37건 3분류 대응표(서브에이전트 읽기 전용) → REPORT
- [x] CP1 코어 상태기 이식 + 포트 mode·head·verify (h1·h2) — RED 예측 → RED 로그 → GREEN 커밋 · 예산
- [x] CP2 이미지 동결·엄격 참조 · 포트 commit · G1 · U14 · U15 — RED → GREEN · 예산
- [ ] CP3 h4·h5 · U10 · mode = gate·cleared — RED → GREEN · 예산
- [ ] CP4 G2 import 가드 · 동기 생성·포트 늦게 붙이기 · CoreKeeper 레지스트리 — RED → GREEN · 예산
- [ ] 마감 게이트 fresh typecheck·lint·test·build
- [ ] REPORT.md (AC 판정 · 37건 표 · 예산 표 · 깨진 테스트 대조 · ④b vs 9.2 · 사실/추정/미확인)

## 예산 표 (정규화 /studio · 복원 · raw)
| 시점 | /studio 정규화 | 복원 | raw eager | 비고 |
|---|---|---|---|---|
| base 0c196b81 | 128.09 | 131.07 | 129.40 (복원 132.43) | BRIEF·L0 기준 |
| CP1 | 128.53 (+0.44) | 131.52 (+0.45) | 129.84 (복원 132.87) | 기준선 128.50→128.53 · 131.48→131.52 · eagerKb 129.84·132.87 (개정 17 배분 RS6-L1) · raw ≤130 → eagerBudgetKb 변경 불필요 |
| CP2 | 128.55 (+0.02) | 131.53 (+0.01) | 129.88 (복원 132.92) | 기준선 128.55·131.53 · eagerKb 129.88·132.92 · catalog 첫 100.07 · profile 첫 99.58 · projects 첫 99.17(전부 한도 안, base 대비 +0.02) |

## 로그
- 0b 정본 읽기 완료 · 37건 대응표 = `HARNESS-MAP.md`(서브에이전트 analyzer 1회, 읽기 전용 — ①30 ②6 ③1).
- 배치 결정(advisor 점검): s6c-slim A안 중 L1 몫만 — saveCore(①·②′) · coreIo · DocBook `coreLink`(①′·④b) · localSync `corePort` · 레지스트리. **제외**: StudioLayout·useDocSave·studioRepository(L3) · `LocalSync.base` 삭제·DocBook save `base` 우회(S6c 대체 코드 제거 = 옛 편집기 경로가 살아 있는 L1에서는 동작 변화).
- 순서 차이: 레지스트리(`core()`)는 CP1로 당김 — 테스트 장치가 실제 DocBook+LocalSync에 닿으려면 필요. CP4는 G2 가드·memory 모드·포트 늦게 붙이기·CoreKeeper 확인.
- **CP1 RED 예측**: 새 테스트 11건(`save/saveCore.port.test.ts`) 전부 FAIL(레지스트리 `core` 없음 → TypeError). 기존 테스트 영향 0.
- CP1 RED: `logs/cp1-red.log` — 11 failed(예측 11 일치, TypeError `repo.core` 없음). GREEN 중 h2-3은 테스트 타이밍 문제(확인 await 전에 편집) → 장치에 `holdRead` 추가(구현 변경 아님).
- CP1 GREEN 게이트(fresh): lint exit 0 · build exit 0(위 표) · test 318 files / 2867 tests passed(base 317/2856 + 1 파일·11건) — `logs/cp1-{lint,build,test}.log`. 중간 1회 engineImportGuard FAIL(memoryDocBook이 engine `PageDoc` 타입 import) → `ReturnType<CoreLink["book"]>`로 교체.
- **CP2 RED 예측**: 새 테스트 15건(`save/saveCore.images.test.ts`) 중 7±1 FAIL — 엄격 이미지(image-missing)·M9 verify 이미지·checkSaveDoc·CE-2 사본·U14 deleteSnapshot·createSnapshot(chain 뒤 아님)·U15 verify. 이미 CP1 구현으로 통과 예상: quota 원자·IDB 기존 이미지·abort 재시도·U3·U15 가드·제출 바인딩 동결.
- CP2 RED: `logs/cp2-red.log` — 8 failed / 14(예측 7±1). 8번째 = U15 가드가 jsdom에서 `new URL` 실패(환경) → 가드는 CP4 node 가드 파일로 이동, 실질 RED 7. U15 단언 테스트는 순서 결함(바인딩이 남아 있어 두 번째 save가 정당하게 saved)으로 순서만 고침 — CP1 코드에서도 첫 save가 saved라 RED 유지.
- CP2 GREEN 게이트(fresh): tsc 0 · lint 0 · build 0 · test 319 files / 2880 passed — `logs/cp2-*.log`.
- 설계 메모: CE-2 문서 사본 = 얕은 사본(I6 G2 "엔진 문서는 불변이면 얕은"). 하네스 h6-125는 imageIds 배열(중첩) 변경까지 봤다 → 제품 테스트는 최상위 필드 교체만 단언(차이, REPORT).
