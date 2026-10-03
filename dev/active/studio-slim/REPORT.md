# STUDIO-SLIM — REPORT

- 브리프 `docs/06-handoff/STUDIO-SLIM_BRIEF.md` · 시작 커밋 `c855719` · 브랜치 `k002bill2/studio-slim`
- **결론: S1에서 정지 — 실측한 두 구조안 모두 "다른 화면 ±0.03 이내 또는 감소" 규칙을 어겨 채택 불가. 코드 변경 0**(시제품은 `logs/s1-*.patch`로 보존 후 원복).
  `/studio` 감소 자체는 실측으로 확인됨(안 A **124.70 → 118.44, −6.26**). 채택 여부는 영환님 결정(6절).

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | b8d83b5 | 수신 기록 · REPORT 골격 · `gate.sh` |
| S0·S1 | (이 커밋) | 기준선 · 모듈별 기여 · 시제품 2안 실측 · **정지 보고** (코드 변경 0) |

## 2. 원인 (S0 — 브리프 원인 확인 + 추가 사실)
- 확인: `createMemoryStudio`가 store 하나로 보드·프로필·생성 저장소를 즉시 만든다 → `memoryStudio` 청크(3.83: 보드 1.20 · 생성 0.88 · 프로필 0.66 · store 0.58 …)와
  정적 의존 `profileDraft` 청크(3.89: profileDraft 1.73 · comparisonCells 0.96 · boardPicks 0.67 …) · `sectionLibrary` 0.68 · `profileRepository` 0.18 · 비교 픽스처 1.06이 `/studio`·`/projects` 진입 직후에 실린다(`logs/s0-attr-studio.txt`).
- **브리프 전제 보정**: `/studio`는 진입 때 프로필 저장소를 **부른다** — `useSectionOps` effect가 `profiles.getProfile(profileId)`(`app/src/features/studio/useSectionOps.ts:43`). 그래서 프로필 구현·store는 진입에 남아야 하고, 뺄 수 있는 것은 보드·생성(+초안 계산·비교 픽스처)뿐이다.
- 보드 저장소 생성은 store에 쓰지 않는다(보드 상태는 인스턴스 안 `let board`) → 지연 생성해도 프로필·프로젝트가 보는 상태는 같다. 트레이 진입 조회는 deferred 래퍼 `initial`이라 로드를 일으키지 않는다.
- 모듈별 기여는 sourcemap 빌드(`attr.mjs`, 청크 gzip × 모듈 생성 바이트 비율)라 합계가 게이트와 다르다(91.96/125.48 vs 91.72/124.70) — **비율 근거로만** 쓰고 표 숫자는 게이트 값.

## 3. 바꾼 구조 (S1 — 시제품 비교, 채택 0)
| 안 | 내용 | `/studio` 진입 | `/projects` 진입 | `/profile` 첫/진입 | `/compare` 첫/진입 | 공통 · `/catalog` 첫 | 판정 |
|---|---|---|---|---|---|---|---|
| 기준선 | — | 124.70 | 107.07 | 99.60 / 123.64 | 98.75 / 121.40 | 89.34 · 99.64 | — |
| **A** 지연 로더 | 새 `data/deferredStudio.ts`: store + 프로필 즉시, 보드·생성·프로젝트는 같은 store를 쓰는 `createSharedLoader` 지연 로더(비교 픽스처는 보드 로더 안). main은 이 모듈만 받음. `createMemoryStudio`(테스트 동기 경로)·저장소 인터페이스 그대로 | **118.44 (−6.26)** | 100.16 (−6.91) | 99.62 (+0.02) / 118.68 (−4.96) | **98.84 (+0.09) / 121.71 (+0.31)** | 89.35 (+0.01) · 99.66 (+0.02) | ✗ `/compare` 첫 +0.09·진입 +0.31 |
| **B** A + 청크 묶기 | A에 `advancedChunks`로 초안 계산 계열(profileDraft·comparisonCells·boardPicks·fonts·hash·palette·compareBoardRepository)을 한 청크로 | 121.73 | 104.08 | 102.99 / 121.97 | 102.78 / 120.89 | **93.35 (+4.01)** · 103.66 | ✗ 공통이 그 그룹을 끌어옴 → 첫 화면 100 초과 5건 |

- 근거: `logs/s1-protoA-bundle.txt` · `logs/s1-protoA.patch` + `logs/s1-protoA-deferredStudio.ts.txt` · `logs/s1-protoA-chunk-diff.txt`(청크별 gzip 바이트 전후) · `logs/s1-protoB-bundle.txt` · `logs/s1-protoB-vite.patch`.
- **A의 `/compare` 증가 원인(청크 비교)**: store·프로필을 보드와 다른 청크로 떼면 Rolldown이 예전 `profileDraft` 청크에 있던 작은 모듈을 따로 쪼갠다 — `chunkRetry` 0.31 · `compareBoardRepository` 0.19 · `fonts` 0.26 · `hash` 0.17 · `generationRepository` 0.16 · `generatorVersion` 0.08(새 청크) — 청크마다 머리·import 문이 붙고, `CompareBoardPage`의 preload 목록(`__vite__mapDeps`)에 경로 4개가 늘어 **첫 화면** +0.07, 보드 구현이 별도 청크가 되며 +0.36. `/compare`가 생성 구현을 안 받아 −0.88이지만 이 오버헤드가 더 크다.
- 브리프 예시 (b) "store·팩토리만 두고 구현은 화면별 청크가" 는 A와 같은 분할 지점이라(store·프로필 ≠ 보드 청크) 같은 쪼개짐이 생긴다 → 따로 시제품하지 않았다(B가 그 쪼개짐을 막는 시도).

## 4. 번들 전후 표
| 체크포인트 | 공통 | `/catalog` 첫/진입 | `/references/:id` 첫/진입 | `/compare` 첫/진입 | `/profile` 첫/진입 | `/projects` 첫/진입 | `/studio` 첫/진입 | 렌더 JS / CSS |
|---|---|---|---|---|---|---|---|---|
| S0 기준선(= 정지 후, 코드 변경 0) | 89.34 | 99.64 / 102.03 | 96.99 / 99.38 | 98.75 / 121.40 | 99.60 / 123.64 | 94.00 / 107.07 | 91.72 / 124.70 | 79.89 / 6.32 |
| S1 시제품 A(참고, 커밋 안 함) | 89.35 | 99.66 / 102.05 | 97.01 / 99.39 | 98.84 / 121.71 | 99.62 / 118.68 | 94.01 / 100.16 | 91.73 / 118.44 | 79.89 / 6.32 |
- 조작 뒤 목록 포함 전체: `logs/s0-bundle-full.txt` · 게이트: `logs/g0-receive.txt` = `logs/s0-bundle.txt`, `logs/s1-gate.txt`.

## 5. 테스트
- 코드 변경 0 → S2(RED·GREEN)·S4(브라우저 흐름·전체 vitest 3회·Codex) 미진행. 게이트(가드 76/76 · typecheck · lint · build) exit 0 — `logs/s1-gate.txt`.
- S2를 재개할 때 RED 설계(시제품 A 기준): `createDeferredStudio(loadCatalog, imports)`가 import 함수를 주입받으므로 (1) `profiles.getProfile` + `projects()`만 부른 뒤 `imports.board`·`imports.generations` 호출 0 (2) 같은 팩토리로 확정 → 프로필 → 3안 → `startDoc`이 store 하나로 이어짐을 단언.

## 6. 남은 차이 · M2A-3a에 넘길 것 (영환님 결정 필요)
- 목표 감소 ≥ 6.27 대비 **안 A 실측 −6.26 → 부족 0.01**(M2A-3a 시제품 +6.27을 넣으면 124.71, 멈춤선 124.70 대비 +0.01 · 실한도 125 안).
- 막힌 이유: 안 A는 `/compare` 첫 화면 +0.09 · 진입 +0.31로 브리프 "다른 화면 ±0.03 이내 또는 감소, 늘면 버린다"에 걸린다(절대값은 98.84/100 · 121.71/125로 예산 안). `/profile` 진입 −4.96 · `/projects` −6.91은 감소.
- 선택지(추천 순):
  1. **A 채택 + `/compare` 증가 허용(추천)** — `/compare` +0.31(진입 여유 3.29 유지)을 받아들이면 `/studio` 여유 6.56KB(멈춤선 124.70 기준 6.26). M2A-3a +6.27과는 0.01 차이라 S3 후보(아래) 하나와 함께 가야 한다.
  2. **A + 청크 정리 추가 레인** — 작은 청크 쪼개짐(`chunkRetry`·`fonts`·`hash`·`compareBoardRepository`)을 import 경로 조정으로 되돌려 `/compare`를 ±0.03에 넣는 시도(L3 추정, 미실측: 쪼개짐 오버헤드 ≈ 0.5 중 일부). `advancedChunks` 묶기는 B에서 공통 +4로 실패.
  3. 이 레인 종료 — M2A-3a는 m2a-3a REPORT 2절 선택지(A 게이트 접힘 SPEC 개정 / C 예산 개정)로.
- S3 후보(SPEC 분류 변경 필요 여부 미확인, 이동하지 않음): `useAutosaveScheduler` 1.48(진입 자동 — 자동 저장 S-B4 근거 행 확인 필요) · `/studio` 진입의 `sectionLibrary` 0.68은 안 A에서 이미 빠짐.
- 4337 서버: 띄우지 않음.
