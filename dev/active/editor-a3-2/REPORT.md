# EDITOR-A3-2 REPORT — 캔버스 시각 충실도 · 예시 문구 · portfolio/grid-2

- 브리프 `docs/06-handoff/EDITOR-A3-2_BRIEF.md` · 기준 SPEC `docs/design/2a-05/SPEC.md` r4.7(5.7 · 8.2.1 · 10절 · 이력 r4.7)
- 시작 커밋 `669a328` · 브랜치 `k002bill2/editor-a3-2` · 서브에이전트 0 · push·병합 0

## 1. 커밋 표
| 단계 | RED | GREEN | 내용 |
|---|---|---|---|
| V0 | — | `cca5f3a` | 수신 기록 · 기준 build(`logs/v0-build.txt`) · `shots/v0-1280.png` · gate/캡처 스크립트 |
| V1 | `b60baee` | `923a542` | 엔진 `portfolio/grid-2`("이미지 2열") + 매핑 쌍 그대로 (A3-Q6) |
| V2 | `43471d4` | `690cf8a` | `features/studio/canvasLayouts.ts` 표 · `docPalette` · 캔버스 `--canvas-*` · 변형별 모양 · 줄무늬 (A3-Q7) |
| V3 | `0a42744` | `5b35f03` | 진입 알림(바뀐 쌍) 한 줄 요약 + `details` (A3-Q7) |
| V4 | `a4bb188` | `d7b84bd` | `data/sampleCopy.ts` 예시 문구 표 · `startDocWrite` 채우기 (A3-Q8) |
| V5 | — | `a9a8057` | 캡처 1280·1024·390 |
| FIX1 | `61c30be` | `9ac7f8a` | 접힌 알림 요약 N = 원문 "섹션 N개"(Codex r1 P2) |
| FIX2 | `984ff00` | `ab0996c` | 색 면(Footer·Hero) 위 문제 표시를 흰 앱 면 안에 — 대비가 데이터와 무관(5.7 B-03, 자체 점검) |
| V6 | — | (이 커밋) | 전체 vitest 3회 · Codex 1회 · REPORT |

RED 로그: `logs/v{1..4}-red.txt` · GREEN 게이트 로그: `logs/v{1..4}-green.txt`(표적 + `src/test` 가드 + typecheck + lint + build).

## 2. AC 판정
| 항목 | 판정 | 근거 테스트 |
|---|---|---|
| A3-Q6 portfolio/grid-2 정의·매핑 | PASS | `engine/sections/registry.test.ts`(변형 목록 · 이름표 · 슬롯 = grid-3 − image3 · maxMotion 준용) · `data/engineVariantMap.test.ts`(`portfolio/grid-2 → grid-2`) · `data/startDocWrite.test.ts` "masonryFirst 구조안 → 3안 portfolio 변형이 서로 다르다"(`[masonry] [grid-3] [grid-2]`) |
| A3-Q7 캔버스 변형별 모양 (5.7) | PASS | `features/studio/canvasLayouts.test.ts`(레지스트리 전 변형이 표에 있음 · 대표 모양 · 모르는 변형 = 기본 블록 · CSS 변수) · `components/studio/StructureCanvas.test.tsx`(data-layout · 카드 칸 수 · 줄무늬 `aria-hidden` · 팔레트/중립 변수) |
| A3-Q7 팔레트 = 문서 프로필 버전 · 조회 1회 · 실패 시 중립 | PASS | `features/studio/docPurpose.test.ts` docPalette(문서 버전 · corrections 적용 · 없음 → undefined) · `components/studio/CanvasPalette.test.tsx`(편집 틀 연결 · 프로필 없음 → 중립 + 편집 계속). 조회는 `useSectionOps`의 `ops.series` 재사용(새 조회 0) |
| E-AC-16 캡션 · hex 0 · opacity 글자 0 · 선택 칩 | PASS(불변) | `src/test/noHardcodedStyle.test.ts` 통과 · 캡션·칩 문자열·`IssueText`(2중 테두리·배지·문장 id) 유지, 기존 `StructureCanvas.test` 단언 그대로 통과 |
| A3-Q7 진입 알림 접기 (8.2.1 (a)) | PASS | `pages/StudioPage.test.tsx` "편집 알림 접기" 2건 + 기존 D2 3건(문장·role·1회·`history.replaceState` 소거·location key 불변) 그대로 |
| A3-Q8 예시 문구 | PASS | `data/sampleCopy.test.ts`(모든 문구 ≤ 권장/상한 · 빈 문구 0 · 범위 · 낡은 행 0 · 엔진 기본값과 다름 · 픽스처 브랜드 0) · `data/startDocWrite.test.ts` "예시 문구 채우기"(픽스처 6×3안: 텍스트 빈 값 0 · 글자 수 게이트 행 0 · 해시·`checkSaveDoc` 유효 · 멱등 · 엔진 `defaultText` 불변) |
| E-AC-24 · E-AC-40~42 | PASS(불변) | 섹션 추가·변형 교체는 엔진 `defaultSlots` 그대로(`startDocWrite.test` 마지막 건 · `engineInvariance.test.ts`) · `memoryDocBook`/`ProfileCandidates` startDoc 경쟁·멱등 테스트 전부 통과 |

## 3. 번들 (gzip KB 첫 / 진입, 체크포인트별)
| 화면 | V0 | V1 | V2 | V3 | V4 | FIX1(최종) |
|---|---|---|---|---|---|---|
| 공통 | 89.33 | 89.35 | 89.34 | 89.34 | 89.34 | 89.34 |
| /catalog | 99.64 / 102.02 | 99.64 / 102.03 | 99.65 / 102.03 | 99.64 / 102.03 | 99.64 / 102.03 | 99.65 / 102.03 |
| /references/:id | 96.98 / 99.37 | 96.99 / 99.38 | 97.00 / 99.38 | 96.99 / 99.38 | 96.99 / 99.38 | 97.00 / 99.38 |
| /compare · (조정 있음) | 98.75 / 121.39 | 98.75 / 121.39 | 98.76 / 121.40 | 98.75 / 121.39 | 98.75 / 121.40 | 98.76 / 121.41 |
| /profile | 99.60 / 123.64 | 99.60 / 123.63 | 99.61 / 123.65 | 99.61 / 123.65 | 99.60 / 123.65 | 99.61 / 123.66 |
| /projects | 94.00 / 107.05 | 94.00 / 107.05 | 94.00 / 107.06 | 94.00 / 107.05 | 94.00 / 107.06 | 94.01 / 107.07 |
| /studio/:projectId | 91.64 / 122.81 | 91.65 / 122.84 | 91.65 / 124.12 | 91.66 / 124.24 | 91.66 / 124.25 | 91.72 / 124.31 |

- `/studio` 진입 최종 124.31 ≤ 124.70(브리프 한도) · 예산 125 대비 여유 0.69(멈춤선 0.3 위). V2 캔버스 +1.28 · V3 +0.12 · FIX1 +0.06.
- FIX2 뒤 `/studio` 진입 124.31
[bundle]   /studio/:projectId 조작 뒤 src/features/studio/docEngine.ts: +1.45KB (2개 파일, 예산 판정 밖)
[bundle]   /studio/:projectId 조작 뒤 src/components/studio/AddSectionDialog.tsx: +1.17KB (1개 파일, 예산 판정 밖)
[bundle]   /studio/:projectId 조작 뒤 src/components/studio/VariantOptions.tsx: +1.05KB (1개 파일, 예산 판정 밖)(`logs/fix2-green.txt`, gate exit 0 전부). Codex·전체 ×3은 FIX2 전 코드 기준(FIX2는 표적 + 가드 게이트만).
- 그 밖 화면·공통 V0 대비 +0.02 이내(±0.03 한도 안). 예시 문구 표는 `memoryDocBook` 청크(편집 시작 조작 뒤)에만 들어감(`dist/assets/memoryDocBook-*.js` grep 확인).

## 4. SPEC·브리프 차이 · 결정 (ADR-003)
- **단언 변경 1건(요구 변경, 약화 아님)**: `engineVariantMap.test.ts` `mapVariant("portfolio","grid-2")` `"grid-3"` → `"grid-2"` — SPEC r4.7 A3-Q6. 표 행 수 43 그대로(키 불변). VARIANT-MAP.md 33행은 Jarvis 몫(브리프).
- **테스트 값 교체**: V2 RED의 팔레트 견본 hex를 `rgb()` 문자열로 바꿈 — `noHardcodedStyle`가 `components/` 테스트 파일도 검사해서. 단언 의미 불변(값 전달 확인).
- **grid-2 슬롯** = grid-3 스키마에서 `image3` 제외(`cards-2` = `cards-3` − `card3*` 선례).
- **알림 요약 N** = 원문 "구조안의 섹션 N개"의 N(바뀐 섹션 수, 같은 쌍 여러 섹션 포함). V3 첫 구현은 `changes.length`(고유 쌍)라 적게 셀 수 있었음 → Codex r1 P2로 FIX1. `StudioEntryState` 모양은 바꾸지 않고(/profile 청크 무접촉) `StudioPage`가 SPEC 고정 문장에서 수를 읽음, 없으면 `changes.length`. 이 레인 V3 테스트 기대값 2 → 3 정정(원문 "섹션 3개"와 일치하게).
- **캔버스 글자 색**: 블록 글자는 프로필 색(`--canvas-ink` / 색 면 위 `--canvas-bg`)을 쓴다. 대비는 앱 UI 대비가 아니라 게이트 "대비 AA" 대상(5.7 B-12). 빈 자리표시는 기존 `text-label-alternative` 유지(E-AC-24 단언).
- **Hero fullbleed-left·center의 이미지 슬롯**은 줄무늬 대신 전면 색 면으로 표시(`media: false`) — 목업 252행도 색 면만.
- **contact 제목·제출 버튼**은 예시 문구 표에 두지 않음 — 변형(문의/예약)마다 엔진 기본값이 달라서.
- **예시 문구 방식**: `createDocFromCandidate` 뒤 엔진 `setSlot`(기존 조작 청크 경로)으로 넣고 `hashDoc` 재계산. revision·updatedAt 불변.

## 5. 목업 대조 (V5 — 구조 기준, `design/claude-design-handoff-v2/project/Design Studio v2.dc.html` 249~261행)
| 요소 | 목업 | 구현(`shots/v5-1280.png` · `v5-1024.png` · `v5-390.png`) | 판정 |
|---|---|---|---|
| Header | 로고 글자 + 메뉴 막대 3 + CTA 색 칩 | 브랜드 글자 + 메뉴 글자 + CTA 글자 한 줄(바) | 구조 같음 · 막대 대신 실제 슬롯 글자(5.7 "실제 슬롯 글자") |
| Hero | fullbleed 전면 색 면(프로필 주 색) + 좌하단 카피 + 버튼 | 변형 6종: cover/center = 주 색 면, split = 카피 + 줄무늬, grid = 줄무늬 + 카피 패널, text = 큰 글자, image = 줄무늬 + 카피. 캡처 흐름(B안)은 `text` 변형 | 구조 같음(fullbleed는 단위 테스트 `canvasLayouts.test`) |
| Services | 제목 + 카드 3열(테두리 칸) | 제목 + 소개 + 카드 N열(테두리 칸, cards-3 = 3 · cards-2 = 2 · 벽돌형 columns-3) | 같음 · 칸 안에 실제 카드 글자 |
| 문제 표시 | 카드 바깥 경고 테두리 + 아래 문장 | 기존 2중 테두리 + 배지 + 문장(E-AC-16 유지) | 같음(기존) |
| Portfolio | (목업 캔버스에 없음) | 이미지 칸 = 대각 줄무늬 `aria-hidden` · grid-2/3/masonry | 목업 밖 — SPEC 5.7 이미지 슬롯 규칙 |
| Footer | 어두운 면 + 사업자 줄 2 + 링크 | 어두운 면(`--canvas-ink`) + 사업자정보 · 링크 · 저작권 | 같음 · 목업 `rgba(...,.6)` 흐린 글자는 쓰지 않음(5.7 EM) |
| 캔버스 틀 | 최대 640 카드 + 그림자, muted 바탕 | 미리보기 폭(데스크톱/태블릿/모바일) 프레임 + `zoom` 축소, 테두리 | 기존 a2 설계 유지(폭 전환 FR-EDT-01) |
| 390 | (목업 없음) | 탭 배치 아래 캔버스 · 모양 동일 · `zoom`이라 미디어쿼리 없음 → 카드 열 수 고정 | 차이 기록 — 캔버스는 선택한 미리보기 폭의 축소 보기 |

## 6. 검증
- 매 GREEN: `gate.sh`(표적 + `npx vitest run src/test` + engineImportGuard + typecheck + lint + build) — 모두 exit 0(`logs/v*-green.txt`).
- V1·V4 뒤 전체 `npx vitest run`: 1399 · 1418 통과.
- 최종 전체 3회(FIX1 뒤 코드): `logs/final-full-x3.txt` — 138 파일 · 1418 테스트 × 3 통과(load 22.9~44.7). FIX1 전 3회도 1418 × 3 통과.
- Codex 1회: `node codex-companion.mjs review --scope branch --base 669a328` → `logs/codex-r1.txt` — P2 1건(알림 요약 N 과소 계산) → FIX1 반영(RED → GREEN). 그 밖 조치 필요 결함 없음. 라운드 상한상 재검토는 돌리지 않음.

## 7. 남은 위험
- 접힌 알림: 상태 영역 안 닫힌 `details` 원문은 보조기기에서 요약 줄만 읽힐 수 있음(원문은 펼친 뒤) — 브리프 A3-Q7 접기 설계의 결과.
- `/studio` 진입 여유 0.75 — A3-3(테마·이미지)은 대화상자·고르기를 조작 뒤 로드(S-B5)로 두어야 한다.
- 캔버스 글자 대비는 사용자 팔레트에 따라 낮을 수 있음(설계상 게이트 대비 행 대상, a4 게이트 표시 전까지 화면 경고 없음).
- 요약 N은 알림 문장 형식(8.2.1 (a))에서 읽는다 — 문장 형식이 바뀌면 `changes.length`로 떨어진다(테스트가 잡음).
- 예시 문구 사업자 줄("대표 홍길동 · 000-00-00000")은 자리표시 성격 — 게이트는 필수 비어 있음만 보므로 내보내기 전 사용자 확인 필요(a4 게이트·내보내기 경고 후보).
