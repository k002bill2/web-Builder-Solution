# BUDGET-TRIM-1 REPORT — `/studio` 진입 여유 회복

base `601471ff` · 판정 = 해시 정규화 gzip(check-bundle-size.mjs) · 기준선 `m2cBaseline.json` 수정 0

## 0. 결론
- **목표 달성**: `/studio` 128.82 → **128.76**(−0.06, 목표 ≤128.77) · 복원 131.81 → **131.75**(−0.06, 목표 ≤131.76). raw 130.13 → 130.07 · 133.17 → 133.10
- 판정선(기준선 128.80·131.78 + 0.03) 대비 여유 0.07 · 0.06. 기준선 파일 수정 0 — 새 기준선 반영 여부는 Jarvis(ADR 개정)
- 다른 라우트 첫 화면·진입 직후·렌더 JS 정규화 증분 0 (`e0-base.txt` ↔ `e0-after.txt`)
- 동작 변화 0: 조작 뒤 대화상자 전용 문구 이동(T1) · 앱에서 도달 불가한 폴백 문장 제거(T2). 새 의존성·새 import() 0

## 1. E0 진단
도구: `e0-chunks.mjs`(빌드 dist — 청크별 정규화 gzip, 판정과 같은 규칙) · `e0-modules.mjs`(`vite build --sourcemap --outDir /tmp/sbt-sm` — 모듈 조각 단독 gzip, 근사)

### 1.1 청크별 (정규화 gzip KB, /studio 19청크 합 128.82 · 복원 23청크 합 131.81)
| KB | 청크 | 받는 시나리오(진입 기준) |
|---:|---|---|
| 85.58 | index (공통) | 전 라우트 |
| 19.32 | StudioLayout | studio |
| 7.98 | issue (엔진 공유) | studio |
| 3.23 | react | 전 라우트 |
| 2.46 | deferredStudio | cmp·prof·proj·studio |
| 2.21 | memoryProjectRepository | proj·studio |
| 1.54 | StudioPage | studio |
| 1.36 | referenceDetails | 전 라우트 |
| 1.04 | profileContrast | prof·studio |
| 0.98 | references | 전 라우트 |
| 0.88 | contrast | cmp·prof·studio |
| 0.64 | sectionLibrary | cmp·prof·studio |
| 0.41 | Callout | cmp·prof·proj·studio |
| 0.39 | projectRepository | proj·studio |
| 0.28 | chunkRetry | cat·cmp·prof·proj·studio |
| 0.19 | rovingFocus | cat·ref·cmp·prof·studio |
| 0.14 | useThrowToBoundary | cat·ref·prof·proj·studio |
| 0.14 | profileRepository | cmp·prof·proj·studio |
| 0.07 | gateCheck (facade `export{runGate}`) | studio |
| 복원만 +1.01 · 0.72 · 0.70 · 0.56 | imageStore · imageRestore · imageRecord · ladder | — |

### 1.2 모듈별 상위 20 (index 제외 — index는 react-dom 62.7·react-router 등 라이브러리가 대부분)
| raw KB | 근사 gz | 모듈 [청크] |
|---:|---:|---|
| 10.80 | 4.16 | StudioLayout.tsx [StudioLayout] |
| 7.78 | 2.94 | react.production.js [react] |
| 5.09 | 1.36 | fixtures/referenceDetails.ts |
| 5.01 | 2.15 | StructureCanvas.tsx [StudioLayout] |
| 3.45 | 1.57 | memoryProjectRepository.ts |
| 3.44 | 1.11 | useAutosaveScheduler.ts [StudioLayout] |
| 3.21 | 1.46 | engine/sections/bodySections.ts [issue] |
| 2.64 | 1.16 | StudioPanels.tsx [StudioLayout] |
| 2.61 | 0.98 | fixtures/references.ts |
| 2.26 | 1.12 | useSectionOps.ts [StudioLayout] |
| 2.18 | 0.99 | useDocSave.ts [StudioLayout] |
| 2.10 | 1.02 | GateList.tsx [StudioLayout] |
| 1.96 | 1.47 | engine/gate/gateText.ts [issue] |
| 1.78 | 0.74 | engine/gate/requiredSections.ts [issue] |
| 1.75 | 1.13 | engine/sections/boundSections.ts [issue] |
| 1.57 | 1.06 | PngSave.tsx [StudioLayout] |
| 1.53 | 0.80 | FieldEditor.tsx [StudioLayout] |
| 1.51 | 0.92 | EditFields.tsx [StudioLayout] |
| 1.48 | 1.01 | images/store/imageStore.ts [imageStore — 복원만] |
| 1.45 | 0.67 | memoryProfileRepository.ts [deferredStudio] |

### 1.3 M4-a · M4-b · RS8 이후 진입에 붙은 것 (`git diff ead47dcd..601471ff` ∩ 진입 모듈 126개)
- 런타임 헬퍼: 진입 청크에 `__exportAll`·`__toESM` 0건 — namespace import 몫 없음
- M4-a: ExportButtons 버튼 3개 문구 · `ExportFormat` `static-zip` · ExportRetryAlert 새로고침 분기 + `exportFlowFails`(`{fails}`·`EXPORT_RELOAD` — 편집기 청크 필수, 청크 실패 때 읽혀야 함) · exportFlowLoader `trackExportChunk` 래퍼 · render/protocol `serialize.refs`
- M4-b: `reactZipLabel` 모듈(버튼 글자 1줄) · CompareTrayContext `runQueued`(index — M3 RECO)
- RS8: PngSave `onAnnounce` · StudioToolbar `sticky` · saveCore `view().reason`
- 청크 경계: facade `gateCheck`(0.07) — 후보 제외: studioEngineChunk.ts 주석대로 번들 검사 manifest 키(facade)로 남아야 함 · 복원 4청크(imageStore·imageRecord·ladder·imageRestore) — importer가 exportFlow·ImageSlotPanel·ingest·localSync로 서로 달라 합치면 조작 뒤·다른 경로 증분(이번 범위 밖)
- 청크 합침 후보: 진입 청크 중 받는 시나리오 집합이 같은 짝(deferredStudio·profileRepository)은 ProfilePage가 profileRepository를 정적 import해 합치면 /profile 첫 화면 증가 → 제외. T1·T2로 목표를 채워 추가 합침은 하지 않음
- 문구 후보 중 제외: 내보내기·PNG 청크 로드 실패 때 뜨는 문구(ExportRetryAlert·PngSave 실패) — 실패한 청크에 기댈 수 없어 진입에 남김 · useSectionOps PROFILE_UNAVAILABLE — 엔진 청크 받기 전 판정

## 2. 감량 (항목별 — 정규화 KB, 전 시나리오 diff = `e0-scenarios.mjs` vs `e0-base.txt`)
| # | 항목 | /studio | 복원 | 다른 라우트·렌더 | 커밋 |
|---|---|---:|---:|---|---|
| T1 | 폐기 대화상자 전용 문구 `DISCARD_TIMEOUT_TEXT`를 진입 모듈 saveStatusText → `save/discardText`(DiscardDialog만 import = SaveActions 조작 뒤 청크). 문구 바이트 동일 · 새 import() 0 | 128.82 → 128.80 | 131.81 → 131.78 | 0 | 22a4b552 |
| T2 | GatePanel `exports ??` 폴백 문장("코드 생성기 연결 후(M2) 내보낼 수 있습니다.") 제거 — 유일한 호출(StudioLayout)이 늘 버튼 묶음을 넘겨 앱에서 도달 불가. `exports` 필수 prop | 128.80 → 128.76 | 131.78 → 131.75 | 0 | 6fa96816 |

## 3. 새 실측 (fresh `npm run build`, 6fa96816 코드)
| 시나리오 | base 첫 화면 · 진입 직후 | 감량 뒤 |
|---|---|---|
| /catalog | 100.28 · 102.62 | 같음 |
| /catalog (추천) | 100.28 · 108.95 | 같음 |
| /references/:id | 97.01 · 99.35 | 같음 |
| /compare | 98.46 · 121.59 | 같음 |
| /profile | 99.02 · 118.87 | 같음 |
| /profile (3안 있음) | 99.02 · 121.31 | 같음 |
| /projects | 98.42 · 108.37 | 같음 |
| /studio | 90.87 · 128.82 | 90.87 · **128.76** |
| /studio 복원 | 90.87 · 131.81 | 90.87 · **131.75** |
| render.html JS | 84.30 | 84.30 |

check-bundle-size 출력: `/studio/:projectId 해시 정규화 진입 128.76KB` · `(저장 데이터 복원 진입) 131.75KB` · raw 130.07 · 133.10 (한도 130.5 · 134) · 가드(preload·React zip·썸네일) 통과

## 4. 검증
- typecheck 0 · lint 0 · test 372 파일 / 3356 통과 · build exit 0 (예산 검사 포함)
- Codex adversarial (`--scope branch --base 601471ff`): (진행 중)
