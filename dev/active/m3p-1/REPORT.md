# M3P-1 REPORT — internal 조합 생성기 (생성 레퍼런스 데이터)

base `db9f25e` · branch `k002bill2/m3p-1` · 서브에이전트 0 · push/merge 0

## 결론
- 구현 완료: 팔레트 표(AA) → 뼈대 템플릿 3종 → `composeInternalReferences`(결정성·중복 제거·게이트) → 생성 스크립트(`--check`) → 생성 픽스처 2파일(카드 / 상세·비교) → 별도 청크 + 라우트 쪽 로더 → 저장소 병합·`sourceKind`·미측정 맨 뒤 정렬.
- 예산 멈춤선 3개 모두 통과(최종 빌드 7: /catalog 첫 99.86 ≤ 99.90 · /studio 진입 128.66 ≤ 128.70).
- 마감 게이트(typecheck·lint·build·전체 vitest)는 이번 재개 세션에서 **실행하지 않음** — Jarvis가 같은 worktree에서 병렬 검증 중(재개 지시). 결과는 Jarvis 보고가 정본.

## 변경 파일 (db9f25e..HEAD, 31개)
| 묶음 | 파일 |
|---|---|
| 생성기(도메인) | `app/src/domain/internalCompose.ts` · `internalComposeData.ts` · `internalComposeRun.ts` · `reference.ts`(sourceKind·점수 합 타입) · `comparisonCells.ts` |
| 생성 스크립트 | `app/scripts/generate-internal-refs.mjs` |
| 생성 픽스처 | `app/src/fixtures/generatedReferences.ts`(카드) · `generatedReferenceDetails.ts`(상세·비교) |
| 저장소·로더 | `app/src/data/generatedCatalog.ts` · `referenceRepository.ts` · `memoryCompareBoardRepository.ts` · `features/catalog/useCatalogRepository.ts` · `useFacetCounts.ts` · `useReferenceList.ts` · `features/detail/useReferenceDetail.ts` · `features/profile/useProfileDetail.ts` |
| 화면 | `components/catalog/ReferenceCard.tsx` · `components/detail/DetailPanels.tsx` · `DetailSidebar.tsx`(미측정·buildNote 표시) |
| 테스트 | `domain/internalCompose.test.ts` · `data/generatedCatalog.test.ts` · `data/referenceRepository.test.ts` · `pages/CatalogGenerated.test.tsx` · `CatalogPage.test.tsx` · `keyboardA11y.test.tsx` · `ReferenceDetailPage.test.tsx` |
| 문서 | `dev/active/m3p-1/BRIEF.md` · `PROGRESS.md` · `REPORT.md` · `shots/*.png` 3장 |

깨진 테스트 수정(CatalogPage 26 · keyboardA11y 6)은 SPEC 8.3 목록 안, "큐레이션 6개만 주입" 원칙 — 단언 변경·skip 0.

## AC 증거
| AC | 테스트 | 상태 |
|---|---|---|
| U1 결정성·입력 불변·출력 동결 | `internalCompose.test.ts:54` | 구현 세션에서 통과 |
| U2 생성 15 · 5업종×4 · hero 중복 0 · 상한 24 | `internalCompose.test.ts:66` | 통과 |
| U3 게이트 1~4 · 거부 후보 폐기 · 폴백/R-02 거부 | `internalCompose.test.ts:79·98·105` | 통과 |
| U4 정규 키·근접 중복 0 | `internalCompose.test.ts:111` | 통과 |
| U7 미측정 맨 뒤 | `referenceRepository.test.ts:138` | Red-Green(되돌리면 3 실패 → 복원 22/22) |
| G1 생성기 재실행 = 커밋 픽스처 | `internalCompose.test.ts:135·140` | 통과 |
| G2 URL·스크립트·이전 브랜드 0 | `internalCompose.test.ts:147` (0fbe4e8에서 가드 충돌 수정) | 통과 |
| G5 기존 6개 3벌 바이트 변경 0 | `internalCompose.test.ts:155` (db9f25e 해시) | 통과 |
| G4 번들 | 아래 예산 표(수동 합산) | 기록 |

"통과"는 구현 세션(cc5ab69·0fbe4e8) 실행 결과다. 이번 재개 세션은 실행 금지 지시로 fresh 재실행을 하지 않았다.

## 예산 반복 (kB, 멈춤선 /catalog 99.90 · /studio 128.70 · /compare 124.70)
| 빌드 | 배치 | /catalog 첫 | /profile 첫 | /studio 진입 | 판정 |
|---|---|---|---|---|---|
| 0 | 기준(db9f25e) | 99.65 | 99.61 | 128.62 | — (/compare 진입 121.70) |
| 1 | 공유 로더 모듈 + 훅 공유 + tiebreak 비교 함수 | 100.27 | 100.24 | 128.74 | 초과 → 멈춤선 |
| 2 | 로더 인라인·tiebreak 제거(생성 픽스처 id 순) | 99.91 | 99.76 | 128.67 | /catalog 초과 |
| 3 | isMeasured 함수 → `"status" in` | 99.88 | 99.73 | 128.64 | 통과 |
| 6 | 카드/상세 픽스처 분리 · 목록은 카드 청크만 | 99.82 | 99.71 | 128.63 | 통과 |
| 7 | + 테스트 교체 지점(GENERATED_CARDS) | 99.86 | 99.74 | 128.66 | 통과(최종) |

## Ego Lite (preview 4337, 구현 세션)
- 업종 5종 각 4개(카페 4 = 큐레이션 2 · 생성 2).
- 생성 카드 → 상세(미측정·buildNote) → 비교 추가 → 보드 열기 = 열 A, 셀 전부 표시 · "접근성·성능 미측정". 외부 요청 0.
- 캡처: `shots/1-catalog-education.png` · `2-detail-generated.png` · `3-compare-generated.png`. 창·서버 정리 완료(PROGRESS 기록).

## Codex review (`--scope branch --base db9f25e`)
- R1 완료(thread `01a1111c-06f7-7ca1-a8ae-1e52aeaae1be`): **P1 0 · P2 2**. Codex 샌드박스에서 typecheck 통과, vitest는 읽기 전용 환경 임시 파일 제한으로 실행 불가(Codex 보고).
- 재개 지시("P2는 REPORT에 기록만")에 따라 코드 수정 0 → diff 불변이라 R2 생략(1/2라운드 사용).

| # | 위치 | 지적 | 처리 |
|---|---|---|---|
| P2-1 | `app/src/features/catalog/useCatalogRepository.ts:19-21` | `CatalogPage`의 `useTrayReferences`가 큐레이션만 있는 기본 저장소로 `getById` → 생성 카드를 비교에 담으면 보드에는 들어가지만 **트레이 개수·제목·제거 버튼에서 누락**(생성 항목만 담으면 0개 표시) | 미반영. **후속 1순위** — 사용자에게 보이는 결함. 트레이 단건 조회에도 생성 카드 로더 연결 필요(+ 예산 재실측) |
| P2-2 | `app/src/domain/internalCompose.ts:278-279` | AA 필터 후 팔레트가 0개면 빈 배열로 `build` → `palette.primary` 접근 예외. 부족 리포트로 반환해야 함 | 미반영. 커밋된 팔레트 표는 12개 전부 AA 통과라 현재 생성 경로에선 발생 안 함(입력 방어 결함) |

## 목업·명세와 다르게 한 부분
- TDD 순서: 예산 상쇄 반복 때문에 로더·타입 구현을 테스트보다 먼저 씀. 핵심 동작은 Red-Green으로 보완(PROGRESS "TDD 기록").

## 남은 것
- typecheck·lint·build·전체 vitest 마감 1회 — 재개 지시로 이 세션 실행 금지. Jarvis 병렬 검증 결과로 확인 필요.
- Codex P2-1(트레이 생성 항목 누락) 수정 여부 결정 — 병합 전 수정 권장.
- Codex P2-2(빈 팔레트 예외) — 후속 정리 후보.
