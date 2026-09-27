# PROFILE-HEADROOM — PROGRESS

- 브리프: `docs/06-handoff/PROFILE-HEADROOM_BRIEF.md` · 기준 HEAD `1a371a7`(= f8bc3ef + 브리프) · 포트 4339
- 목표: `/profile` 진입 직후 124.80 → ≤ 124.40 (−0.40↑), 다른 시나리오 첫 화면·진입 직후 순증가 0
- 수정 금지: `app/src/data/{memoryBoardConfirm.ts,memoryProjectRepository.ts,boardConfirmProject.test.ts}` · 예산/판정 로직 · engine 런타임 import · 새 의존성

## 수신
- [x] 브리프 전체 · 선례(compare-headroom-c8 REPORT, bundle-01 REPORT 4절, 2a-04b1 FIX3 14절, editor-a1-beta 1절) 읽음
- 되풀이 금지 실험: `projectName` 인라인(효과 부족) · 프로젝트 로더 공통 이동(공통 +0.07)

## 체크포인트
- [x] 0. 기준 빌드 재현 + `/profile` 진입 직후 청크 표
- [x] 0. 후보 3개 이상 L2 실측(하나씩 적용 → build) → PROGRESS 커밋
- [x] 1. 채택 후보 TDD — `ProfileGenerateLoad.test.tsx` RED(소스 가드 2 실패 · 특성 3 통과, `logs/red.txt`) → GREEN 5/5
- [x] 1. 구현 + 커밋 `48e474c`
- [x] 2. 4게이트: typecheck 0 · lint 0 · vitest 1233/1234(실패 1 = 기존 P-AC-29 `/studio`, 기준 코드에서도 실패 — editor-a1-beta REPORT 45행) · build 0
- [x] 2. 번들 전후 표 → REPORT
- [ ] 3. 127.0.0.1:4339 실제 흐름(catalog→비교→확정→profile 보정·조정 저장·3안 생성) + 자기 PID 종료·lsof
- [ ] 4. Codex 리뷰(companion)
- [ ] 5. REPORT.md + 커밋

## 0단계 — 기준 `/profile` 진입 직후 구성 (gzip KB, node zlib, `logs/base-rebuild.txt` = 기준 124.80 재현, L1)

| 구분 | 청크 | KB | 내용(소스맵 `vite build --sourcemap`) |
|---|---|---|---|
| 공통 | index | 86.06 | 셸·라우터·공통 도메인 |
| 공통 | react | 3.28 | |
| 첫 화면 | ProfilePage | 6.96 | 페이지·ProfileValues·VersionList·VersionDiff·useProfileDetail |
| 첫 화면 | catalogFilters·sectionLibrary·referenceDisplay·Callout·useThrowToBoundary·profileRepository·profileEvents | 3.11 | 공유 소청크 |
| 진입 직후 | profileEngine | 9.70 | 3안 영역·조정 패널·대비·비교·문구 |
| 진입 직후 | **memoryStudio** | **4.35** | studioStore·memoryCompareBoardRepository·**memoryGenerationRepository**·memoryProfileRepository·writeBodyLoader |
| 진입 직후 | **profileDraft (공유)** | **3.85** | chunkRetry·compareBoardRepository·hash·boardPicks·fonts·comparisonCells·palette·profileDraft — `/profile`에서는 **보드 저장소(memoryStudio 안) 때문에만** 붙는다 |
| 진입 직후 | 픽스처(referenceDetails·referenceComparisons·references) | 3.41 | |
| 진입 직후 | SegmentedControl·contrast·profileContrast·adjustmentText·effectiveProfile·rovingFocus·generation | 4.09 | |
| | **합계** | **124.80** | |

## 0단계 — 후보 L2 실측 (하나씩 기준에 적용 → `vite build` + `check-bundle-size`, 끝나고 되돌림)

| 후보 | 내용 | `/profile` 진입 직후 | 다른 시나리오 | 판정 | 로그·패치 |
|---|---|---|---|---|---|
| **A** | 3안 생성 저장소의 요청·재시도 **계산 뒤 잡 조립·실패 주입·재시도 판정**(`FAILURE_TEXT`·`RETRYABLE`·잡 모양·재시도 계산)을 조작 뒤 청크 `memoryGenerate`로(기존 `loadGenerate` 재사용, 새 로더 0) | **124.23 (−0.57)** | 공통 0 · `/catalog` 99.64/102.02(0/−0.01) · `/compare` 98.40/120.80(−0.01/−0.57) · `/projects`·`/studio` 진입 직후 −0.57 · `/profile` 조작 뒤 memoryGenerate 4.74→5.34 | **채택** — 목표(−0.40) 단독 달성, 순증가 0 | `logs/exp-A-generate-body.txt` · `exp-A.patch` |
| B | 보드 저장소가 `buildProfileDraft`를 정적 import하지 않고 확정 때 받기(새 로더 `loadProfileDraft`; B2 = 재수출 래퍼 모듈) | 123.55 / 123.58 (−1.25) | **공통 +0.27**(`compareBoard`가 index에서 공유 청크 0.74로 분리) → `/catalog` 첫 화면 99.90(여유 0.10) · `/compare` 진입 직후 +1.03 | 기각 — 순증가 위반(FIX3 noinject와 같은 재분할) | `exp-B-profileDraft-lazy.txt` · `exp-B2-wrapper.txt` · `exp-B2.patch` |
| C | `memoryStudio`의 보드 저장소를 deferred 래퍼 + `import()`로(프로필·프로젝트 화면은 보드 구현을 받지 않음) | **120.32 (−4.48)** | `/compare` 98.49/122.51(+0.08/+1.14) · `/projects` −5.12 · `/studio` −5.11 · 공통 0 | 기각 — `/compare` 순증가 + `COMPARE_AUTO`에 새 자동 import 등록 필요(분류 변경 금지). **후속 후보로 REPORT에 남김** | `exp-C-board-lazy.txt` · `exp-C.patch`(스크립트 목록 1줄은 실측용) |

- 되풀이하지 않음: editor-a1-beta의 `projectName` 인라인 · 프로젝트 로더 공통 이동.
- 첫 화면 밖 부품 lazy(ProfilePage → 엔진 청크): 화면은 엔진 도착 뒤에만 그리므로 첫 화면만 줄고 진입 직후 합계는 C8 선례처럼 같거나 늘어난다(+0.43, L2 선례) → 목표 지표(진입 직후)에 효과 없어 실측 생략.
