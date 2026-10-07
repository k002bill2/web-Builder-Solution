# STUDIO-OFF3 AUDIT — `/studio/:projectId` 진입 청크 구조 점검 (1단계, 코드 변경 전)

- base `713947d`(+P0 `d91a898`) · 2026-10-06 · 측정은 모두 현재 코드로 새로 함(er-off·er-off2 수치 재사용 0)
- **첫 줄: 진입 128.67 중 /studio 전용 청크는 28.69뿐(나머지 99.98은 다른 라우트 진입과 공유). 새로 찾은 (A) 레버 = 청크 경계 압축 손실 — `_issue`+`_runGate` 공유 청크 병합 시제품 128.67 → 128.19(−0.48), 다른 라우트 −0.00~−0.03.**

## 0. 측정 방법
- 합계: `npm run build`(check-bundle-size) 그리고 같은 page·auto 목록을 쓰는 `logs/routes.mjs`(실제 `vite build` 산출물, gzip Node zlib 기본 레벨, KB=1000B). base 재현 = check-bundle-size와 7개 행 모두 일치(128.67 등).
- 청크 표: `dist/.vite/manifest.json` 정적 닫힘(index.html + StudioPage) + auto 목록(references·referenceDetails·deferredStudio·memoryProjectRepository·StudioLayout·gateCheck) 정적 닫힘 = 23개 청크.
- 모듈 표: `vite build --sourcemap --outDir /tmp/so3/sm`(같은 해시·같은 청크)에서 sourcemap 매핑으로 소스별 생성 문자를 세고 **청크 gzip × 문자 비율**로 나눈 추정치(`logs/modules.mjs`). gzip은 더해지지 않으므로 L2 추정 — 판단은 모두 시제품 빌드 Δ(L1)로 한다.
- 도달성: `logs/reach.mjs`(vite build API + 그래프 덤프)로 진입 청크 안 모듈이 진입 루트에서 정적 import만으로 닿는지 검사. 이 스크립트의 합계(126.86)는 vite 후처리 전 코드라 수치 인용에 쓰지 않는다(그래프 전용).
- 시제품: `logs/proto.sh <id>` = 작업 트리를 `/tmp/so3/<id>`로 앱 빌드 → routes.mjs. `logs/chunkdiff.mjs`로 청크별 비교. 시제품 뒤 원복(`git status` 깨끗 확인).

## 1. 청크별 gzip (base)
## 청크 (gzip KB, Node zlib)
| 청크 | src | 구간 | gz | 공유(다른 라우트 진입) |
|---|---|---|---|---|
| assets/index-B45FGMCE.js | index.html | 첫화면 | 86.09 | catalog,compare,profile,projects |
| assets/StudioLayout-Bkig9JM4.js | src/components/studio/StudioLayout.tsx | 자동 | 18.30 | studio 전용 |
| assets/issue-Crpqhy1b.js | _issue-Crpqhy1b.js | 자동 | 6.04 | studio 전용 |
| assets/react-DB-4Zxce.js | _react-DB-4Zxce.js | 첫화면 | 3.28 | catalog,compare,profile,projects |
| assets/runGate-C_SRmB2T.js | _runGate-C_SRmB2T.js | 자동 | 2.49 | studio 전용 |
| assets/deferredStudio-D5NIESQE.js | src/data/deferredStudio.ts | 자동 | 2.08 | compare,profile,projects |
| assets/StudioPage-BKrWnRUP.js | src/pages/StudioPage.tsx | 첫화면 | 1.79 | studio 전용 |
| assets/memoryProjectRepository-CgkA-h98.js | src/data/memoryProjectRepository.ts | 자동 | 1.42 | projects |
| assets/referenceDetails-C7TYk5GK.js | src/fixtures/referenceDetails.ts | 자동 | 1.41 | catalog,compare,profile,projects |
| assets/references-Dy8ZbmG9.js | src/fixtures/references.ts | 자동 | 0.98 | catalog,compare,profile,projects |
| assets/contrast-C4VxygO4.js | _contrast-C4VxygO4.js | 자동 | 0.89 | compare,profile |
| assets/profileContrast-GTeTNoX9.js | _profileContrast-GTeTNoX9.js | 자동 | 0.76 | profile |
| assets/sectionLibrary-50WmVJEd.js | _sectionLibrary-50WmVJEd.js | 자동 | 0.64 | compare,profile |
| assets/Callout-B4kMHaHK.js | _Callout-B4kMHaHK.js | 자동 | 0.42 | compare,profile |
| assets/projectName-DWJvWhhu.js | _projectName-DWJvWhhu.js | 자동 | 0.39 | projects |
| assets/effectiveProfile-CIFNkz4g.js | _effectiveProfile-CIFNkz4g.js | 자동 | 0.38 | profile |
| assets/chunkRetry-D8ua4dCF.js | _chunkRetry-D8ua4dCF.js | 자동 | 0.29 | compare,profile,projects |
| assets/useProjectRepository-XM7kUgxK.js | _useProjectRepository-XM7kUgxK.js | 첫화면 | 0.24 | projects |
| assets/projectRepository-Bp8fCprM.js | _projectRepository-Bp8fCprM.js | 첫화면 | 0.23 | projects |
| assets/rovingFocus-C627c-M6.js | _rovingFocus-C627c-M6.js | 자동 | 0.19 | catalog,compare,profile |
| assets/useThrowToBoundary-e3Nrf3la.js | _useThrowToBoundary-e3Nrf3la.js | 첫화면 | 0.16 | catalog,profile,projects |
| assets/profileRepository-Cf1X6rgu.js | _profileRepository-Cf1X6rgu.js | 자동 | 0.14 | compare,profile,projects |
| assets/gateCheck-DjkOorQo.js | src/features/studio/gateCheck.ts | 자동 | 0.07 | studio 전용 |
| **합** | | | **128.67** | |
studio 전용 청크 합: 28.69

- 공유 = 그 청크가 다른 라우트(catalog·compare·profile·projects)의 첫 화면/진입 닫힘에도 있음 → 바꾸면 그 라우트 행도 바뀐다(±0.03 규칙).

## 2. 모듈별 gzip 기여 상위 30 (추정, 방법 0절)

| # | 모듈 | 청크 | 구간 | 문자 | gz추정 | 공유 |
|---|---|---|---|---|---|---|
| 1 | node_modules/react-dom/cjs/react-dom-client.production.js | index-B45FGMCE.js | 첫화면 | 202951 | 64.89 | catalog,compare,profile,projects |
| 2 | src/components/studio/StudioLayout.tsx | StudioLayout-Bkig9JM4.js | 자동 | 10594 | 3.70 | studio 전용 |
| 3 | node_modules/react/cjs/react.production.js | react-DB-4Zxce.js | 첫화면 | 7780 | 3.26 | catalog,compare,profile,projects |
| 4 | node_modules/react-router/dist/production/lib/hooks.js | index-B45FGMCE.js | 첫화면 | 8374 | 2.68 | catalog,compare,profile,projects |
| 5 | node_modules/react-router/dist/production/lib/router/utils.js | index-B45FGMCE.js | 첫화면 | 7070 | 2.26 | catalog,compare,profile,projects |
| 6 | node_modules/react-router/dist/production/lib/dom/lib.js | index-B45FGMCE.js | 첫화면 | 6294 | 2.01 | catalog,compare,profile,projects |
| 7 | src/components/studio/StructureCanvas.tsx | StudioLayout-Bkig9JM4.js | 자동 | 4921 | 1.72 | studio 전용 |
| 8 | src/engine/sections/bodySections.ts | issue-Crpqhy1b.js | 자동 | 3203 | 1.52 | studio 전용 |
| 9 | src/features/studio/useAutosaveScheduler.ts | StudioLayout-Bkig9JM4.js | 자동 | 4128 | 1.44 | studio 전용 |
| 10 | src/data/memoryProjectRepository.ts | memoryProjectRepository-CgkA-h98.js | 자동 | 2224 | 1.42 | projects |
| 11 | src/fixtures/referenceDetails.ts | referenceDetails-C7TYk5GK.js | 자동 | 5104 | 1.41 | catalog,compare,profile,projects |
| 12 | node_modules/react-dom/cjs/react-dom.production.js | index-B45FGMCE.js | 첫화면 | 3570 | 1.14 | catalog,compare,profile,projects |
| 13 | node_modules/scheduler/cjs/scheduler.production.js | index-B45FGMCE.js | 첫화면 | 3509 | 1.12 | catalog,compare,profile,projects |
| 14 | src/fixtures/references.ts | references-Dy8ZbmG9.js | 자동 | 2613 | 0.98 | catalog,compare,profile,projects |
| 15 | node_modules/react-router/dist/production/lib/dom/ssr/components.js | index-B45FGMCE.js | 첫화면 | 2928 | 0.94 | catalog,compare,profile,projects |
| 16 | src/engine/gate/gateText.ts | issue-Crpqhy1b.js | 자동 | 1963 | 0.93 | studio 전용 |
| 17 | src/components/studio/StudioPanels.tsx | StudioLayout-Bkig9JM4.js | 자동 | 2665 | 0.93 | studio 전용 |
| 18 | node_modules/react-router/dist/production/lib/router/history.js | index-B45FGMCE.js | 첫화면 | 2782 | 0.89 | catalog,compare,profile,projects |
| 19 | src/domain/contrast.ts | contrast-C4VxygO4.js | 자동 | 1343 | 0.89 | compare,profile |
| 20 | src/engine/sections/boundSections.ts | issue-Crpqhy1b.js | 자동 | 1746 | 0.83 | studio 전용 |
| 21 | src/engine/gate/requiredSections.ts | runGate-C_SRmB2T.js | 자동 | 1771 | 0.78 | studio 전용 |
| 22 | src/domain/profileContrast.ts | profileContrast-GTeTNoX9.js | 자동 | 1388 | 0.76 | profile |
| 23 | src/components/ds/Icon.tsx | index-B45FGMCE.js | 첫화면 | 2341 | 0.75 | catalog,compare,profile,projects |
| 24 | src/data/memoryProfileRepository.ts | deferredStudio-D5NIESQE.js | 자동 | 1446 | 0.74 | compare,profile,projects |
| 25 | src/components/studio/GateList.tsx | StudioLayout-Bkig9JM4.js | 자동 | 2106 | 0.74 | studio 전용 |
| 26 | src/components/studio/StudioEmptyStates.tsx | StudioPage-BKrWnRUP.js | 첫화면 | 1011 | 0.68 | studio 전용 |
| 27 | node_modules/react-router/dist/production/lib/dom/dom.js | index-B45FGMCE.js | 첫화면 | 2085 | 0.67 | catalog,compare,profile,projects |
| 28 | src/data/studioStore.ts | deferredStudio-D5NIESQE.js | 자동 | 1284 | 0.66 | compare,profile,projects |
| 29 | src/domain/sectionLibrary.ts | sectionLibrary-50WmVJEd.js | 자동 | 885 | 0.64 | compare,profile |
| 30 | src/engine/ops/rules.ts | issue-Crpqhy1b.js | 자동 | 1302 | 0.62 | studio 전용 |

- /studio 전용 모듈 전체 목록(68개)은 `logs/audit-base-all.md`.

## 3. 구조 사실 (현재 코드 실측)
1. **모듈 단위 잘못 배치 0** — 진입 23청크의 모든 모듈이 진입 루트에서 정적으로 닿는다(예외: vite modulepreload polyfill·rolldown runtime). → 모듈을 통째로 다른 청크로 옮길 대상 없음.
2. **청크 경계 압축 손실** — 진입 23청크를 한 파일로 이어 gzip하면 122.61(−6.06). /studio 전용 5청크(StudioPage·StudioLayout·issue·runGate·gateCheck)만 이으면 28.69 → 27.10(**−1.59 = 청크 병합의 이론 상한**). 이 중 StudioPage+StudioLayout 병합(−0.67)은 첫 화면이 100을 넘으므로 불가, issue를 StudioLayout에 넣으면 /profile 조작 뒤가 StudioLayout을 받게 된다(아래 B2).
3. `_issue`(6.04) importer = StudioLayout · docEngine · AddSectionDialog · VariantOptions · ImageSlotPanel · `_sectionOps` · `_runGate` · `_startDocWrite`. `_runGate`(2.49) importer = gateCheck · `_startDocWrite`. 스튜디오 밖 경로는 `/profile` 조작 뒤(CompareDialog·memoryDocBook → startDocWrite)뿐이고 그 경로는 **이미 두 청크를 함께 받는다** → 둘을 한 청크로 합쳐도 어느 경로도 바이트가 늘지 않는다.
4. `gateCheck.ts`는 manifest 키(검사기 auto 목록)라 facade 청크로 남아야 한다. 시제품 R1(startDocWrite가 runGate를 gateCheck 경유로 import)은 **키가 사라져 탈락**(검사기 실패 조건).
5. 작은 공유 청크 10개(projectRepository 0.23·useThrowToBoundary 0.16·useProjectRepository 0.24·chunkRetry 0.29·profileRepository 0.14·projectName 0.39·Callout 0.42·rovingFocus 0.19·effectiveProfile 0.38·gateCheck 0.07)는 importer 집합이 서로 달라 갈라진 것. gateCheck 말고는 모두 다른 라우트 진입과 공유.

## 4. 분류

### (A) 동작 변화 0 감량
| id | 내용 | 시제품 Δ(/studio 진입) | 다른 라우트 | 비고 |
|---|---|---|---|---|
| **A1** | 앱 빌드 설정(`vite.config.ts` 앱 모드만)에 codeSplitting 그룹 1개: `_issue` 14모듈 + `_runGate` 6모듈을 한 청크로(`includeDependenciesRecursively:false`, 모듈 경로 정확 목록) | **128.67 → 128.19 (−0.48)** (`/tmp/so3/g2`) | catalog −0.01·references −0.00·compare −0.01·profile −0.02·profile(3안) −0.02·projects −0.03 (모두 감소) | 판정 로직·검사기·기준선 변경 0, 빌드 설정 변경. gateCheck facade 키 유지 확인. 부수: StudioPage(첫 화면) 1.79→1.83(+0.05, StudioLayout 미리 받기 목록에 contrast·effectiveProfile·profileContrast 3개 파일명 추가 — 이 3청크는 원래 진입 직후 자동 닫힘에 있었고 이제 StudioLayout과 같이 미리 받음, 총 바이트 동일). 조작 뒤 exportFlow +0.06(같은 이유, 판정 밖) |
| A1-g1 | 같은 그룹을 의존 재귀 포함(기본값)으로 | 126.84 | **모든 라우트 +9.6** | 탈락 — 공통 청크 모듈을 끌어감 |
| R1 | startDocWrite → gateCheck 경유 import | — | −0.01~−0.02 | 탈락 — gateCheck manifest 키 소실 |

- 그 밖 (A) 후보 없음: 모듈 잘못 배치 0(3절-1). 연산 뒤 꼬리는 er-off2가 이미 옮겼고 남은 진입 청크 코드는 첫 페인트·첫 상호작용 전에 쓰이거나(아래 표) 옮기면 비동기 로드가 끼어든다.

### er-off2 이후 추가 코드 점검(ER-2~4b·M3′, 모듈 gz 추정)
| 모듈 | gz | 첫 화면 전 사용 | 분류 |
|---|---|---|---|
| useThemeSwap | 0.28 | 테마 버튼·대비 줄 행동·"새 버전" 문장 렌더 | 남김 — 판정·적용은 이미 ThemeDialog 조작 뒤 청크 |
| useSnapshots | 0.31 | 스냅샷 버튼·편집 경계(edit) — 모든 편집이 지난다 | 남김 — 대화상자·복원은 이미 SnapshotLayer 조작 뒤 청크 |
| SnapshotLayerLoader | 0.06 | lazy 래퍼 | 남김 |
| PngSave | 0.52 | 버튼·준비 이유·캡션 렌더. 실패 문장은 캡처 청크 실패 때도 떠야 해서 진입에 둔 설계(M2A-3a P2-1) | 옮기면 (B) |
| GateList | 0.74 | 게이트 펼침 진입(개정 3) | 남김 |
| undoStack | 0.18 | useSectionOps 마운트 때 생성 | 남김(단축키 리스너는 이미 ER-4b 조작 뒤) |
| docPurpose | 0.39 | 삭제 가능 여부·킷 토큰(캔버스 첫 그림) | 남김 |
| StudioEmptyStates(StudioPage) | 0.68 | 로딩·없음·오류 상태 — 문서 받기 전에 그린다 | 남김 |

### (B) 체감 변화가 있는 감량 (적용 안 함)
| id | 내용 | 예상 Δ | 체감 변화 | 위험 |
|---|---|---|---|---|
| B1 | 자동 저장 스케줄러(useAutosaveScheduler ≈1.44 추정)를 첫 편집 때 받기 | ≈−0.8~−1.2 [추정, 미시제품] | 첫 편집 직후 저장 상태 표시가 청크 도착까지 늦음(오프라인이면 실패 경로) | 저장 유실 경계·검사기 목록 갱신 필요(scripts 수정 금지) |
| B2 | `_issue`(+runGate)를 StudioLayout 청크로 병합(설정 그룹) | ≈−0.4~−0.9 [concat 상한] | `/profile` "3안 실제 화면으로 비교"·"편집 시작" 클릭 뒤 StudioLayout(18.3KB gz) 추가 내려받기 | 다른 라우트 조작 뒤 지연 |
| B3 | 충돌 Callout + resolve 본문 지연 | ≈−0.2 [추정] | 충돌 표시가 청크 도착까지 늦음 | STALE 가드 |
| B4 | PageInfoFields·PngSave 실패 문장 지연 | ≈−0.3~−0.5 [추정] | 페이지 정보 선택·PNG 실패 때 한 틱 늦음·포커스 | 접근성 |
| B5 | 게이트 열 클릭 이동(goToRow·openGate) 본문을 조작 뒤 청크로 | ≈−0.1 [추정] | 첫 클릭 때 청크 로드 대기(포커스 이동 지연) | — |

### (C) 예산 상향만 가능한 몫
- react-dom 64.89 + react-router 등 공통 청크 index 86.09·react 3.28 = 89.37(공통 JS) — 모든 라우트 공유, /studio만 줄일 수 없음.
- 다른 라우트 진입과 공유하는 자동 청크(deferredStudio 2.08·fixtures 2.39·memoryProjectRepository 1.42·contrast 계열 2.03·작은 공유 청크) ≈ 10.6 — 바꾸면 다른 라우트 행이 바뀜.
- /studio 전용 28.69 중 첫 페인트 필수(StudioLayout 본체·캔버스·패널·게이트·필드 편집) — A1 뒤 남는 전용 분량 ≈28.2는 기능 분량. 심볼 단위 엔진 분할(er-off A4형)은 `src/engine` 수정이 필요해 이 브리프 금지 범위 → 별도 승인 없으면 (C).
- 결론: A1 적용 시 판정선 128.70 대비 여유 0.03 → **0.51**. B-M3P-06·B-ER-08·B-ER-09 예산은 이 여유 + (B) 결정 또는 상향으로.
