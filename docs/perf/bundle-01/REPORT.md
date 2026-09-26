# BUNDLE-01 REPORT — 공통 청크 증가 원인과 `/compare` 여유 회복 방안 (조사 전용)

- 브리프: `docs/06-handoff/BUNDLE-01_DEVELOPER_BRIEF.md` · 기준: main `8981da3`(= app 코드는 `878a749`와 동일, 브리프 문서만 추가) · 브랜치 `k002bill2/bundle-01`
- 도구: Vite 8.3.1 · rolldown 1.2.11(설치본) · Node 내장(`zlib`)만 사용. 새 의존성·`npx` 일회성 도구·서버 없음
- 단위: gzip(Node zlib 기본 레벨), KB = 1000B — `app/scripts/check-bundle-size.mjs`와 같은 규칙
- 재현 스크립트(이 디렉터리): `measure.mjs`(임의 dist를 예산 규칙으로 측정) · `attribute.mjs`(소스맵으로 모듈별 raw·gzip 비례·gzip 한계 기여 귀속)
- 근거 수준: **L1** 이 작업에서 직접 실행·측정 · **L2** 코드/기록 확인(실행은 안 함) · **L3** 추정

## 0. 결론 (먼저)

| 질문 | 답 |
|---|---|
| 공통 JS 구성 | 89.58KB = `index` 86.26 + `jsx-runtime` 3.33. react-dom+scheduler **66.5**(74%) · react-router **11.9** · 앱 소스 **7.5** · react **3.1** (L1, 1절) |
| React 분리 원인 | **비교 보드 엔진 동적 청크(`boardEngine`)가 `react`에 정적으로 의존하는 것.** JSX가 아니어도 `react` 값 import 하나로 분리된다(e9b). rolldown 청크 설정 7가지로는 되돌려지지 않는다 (L1, 2절). 내부 규칙은 L3 |
| 청크 경계 비용 | **+0.50KB**(공통) — 거의 전부 gzip 압축 문맥 분리 손실(0.56KB). import/export 문 자체는 raw +111B (L1, 2.3) |
| 권고안 | **R1: `/compare` 첫 화면에 안 그려지는 인라인 아이콘 5개를 파일로 (e15)** → `/compare` 99.30 → **98.38**(여유 0.70 → **1.62**). 설정 1줄, 2~4턴 (L1) |
| V2-4 전 확보 가능 여유 | **1.62KB (R1, L1) ~ 약 2.5KB (R1 + 대안 A1, L3)**. 예산 조정은 마지막 대안(A3) |

## 1. 현재 공통 청크 구성 (main, L1)

### 1.1 라우트별 합계 (브리프 1절 수치 재현)

`npx vite build` + `node scripts/check-bundle-size.mjs` (fresh):

| 항목 | 첫 화면 | 진입 직후 |
|---|---|---|
| 공통 JS | 89.58 (`index-oPnLMSc7.js` 86.26 + `jsx-runtime-Dk72oS4N.js` 3.33) | — |
| `/catalog` | 99.07 | 101.45 |
| `/references/:id` | 96.10 | 98.49 |
| `/compare` | **99.30** | 121.73 |
| 자리표시 | 90.04 | 92.42 |

- `/compare` 첫 화면 = 공통 89.58 + `CompareBoardPage` 8.92 + `referenceDisplay` 0.79.
- 소스맵은 `--sourcemap hidden`으로 따로 빌드했고, JS 16개 파일 **바이트가 기준 빌드와 동일**함을 `cmp`로 확인했다(귀속 대상 = 실제 배포 파일).

### 1.2 모듈별 gzip 기여 상위 20 (공통 두 청크 합산, 55개 모듈)

- **비례** = 청크 gzip × raw 비율(합계가 청크 gzip과 일치). **한계** = 그 모듈 구간만 뺀 청크를 다시 압축했을 때 줄어드는 양(= 그 모듈을 빼면 실제로 얻는 값의 근사).

| # | 모듈 | 청크 | raw KB | gzip 비례 | gzip 한계 |
|---|---|---|---|---|---|
| 1 | `react-dom/cjs/react-dom-client.production.js` | index | 202.94 | 64.13 | 61.87 |
| 2 | `react/cjs/react.production.js` | jsx-runtime | 7.78 | 2.95 | 2.76 |
| 3 | `react-router/…/lib/hooks.js` | index | 8.38 | 2.65 | 2.64 |
| 4 | `react-router/…/lib/router/utils.js` | index | 7.06 | 2.23 | 2.63 |
| 5 | **`src/components/ds/Icon.tsx`** (인라인 SVG data URI 7개 포함) | index | 6.50 | 2.05 | 1.73 |
| 6 | `react-router/…/lib/dom/lib.js` | index | 6.30 | 1.99 | 2.03 |
| 7 | `react-dom/cjs/react-dom.production.js` | index | 3.57 | 1.13 | 0.78 |
| 8 | `scheduler/cjs/scheduler.production.js` | index | 3.51 | 1.11 | 1.22 |
| 9 | `react-router/…/lib/dom/ssr/components.js` | index | 2.93 | 0.93 | 0.90 |
| 10 | `react-router/…/lib/router/history.js` | index | 2.79 | 0.88 | 0.93 |
| 11 | `react-router/…/lib/dom/dom.js` | index | 2.08 | 0.66 | 0.71 |
| 12 | `react-router/…/lib/dom/ssr/links.js` | index | 1.86 | 0.59 | 0.56 |
| 13 | `react-router/…/lib/components.js` | index | 1.85 | 0.58 | 0.56 |
| 14 | `src/components/layout/AppHeader.tsx` | index | 1.69 | 0.53 | 0.51 |
| 15 | `src/features/compare/CompareTrayContext.tsx` | index | 1.64 | 0.52 | 0.46 |
| 16 | `src/components/ds/Button.tsx` | index | 1.53 | 0.48 | 0.44 |
| 17 | `src/domain/compareBoard.ts` | index | 1.43 | 0.45 | 0.49 |
| 18 | `react-router/…/lib/dom/ssr/single-fetch.js` | index | 1.43 | 0.45 | 0.50 |
| 19 | (unmapped: rolldown 런타임·청크 래퍼·import/export 문) | index | 1.30 | 0.41 | 0.60 |
| 20 | `src/main.tsx` | index | 1.22 | 0.39 | 0.41 |
| — | 나머지 35개 | | 13.96 | 4.47 | |

묶음: react-dom+scheduler 66.51 · react-router 11.87(그중 `dom/ssr/*` 2.09, 한계 합 2.06) · 앱 소스 7.46 · react 3.11 · unmapped 0.63.
재현: `node docs/perf/bundle-01/attribute.mjs <dist> assets/index-*.js 20`

관찰:
- 공통의 74%는 react-dom이라 앱 코드로 줄일 수 있는 몫은 작다. 앱 소스 7.46 중 가장 큰 것이 `Icon.tsx`(인라인 아이콘).
- 비교 전용 도메인(`compareBoard` 0.49 · `CompareTrayContext` 0.46 · `colorFamily` 0.39 · `boardColumns` 0.36 · `deferredCompareBoardRepository` 0.13, 한계값)이 공통에 있다. `/compare`도 필요하므로 `/compare` 여유에는 효과가 없고 다른 라우트에만 효과가 있다(4절 표 C7).

### 1.3 `/compare` 페이지 청크 상위 (참고, L1)

`CompareBoardPage` 8.92KB: `useCompareBoard` 한계 2.05 · 페이지 1.49 · `DraftPanel` 0.94 · `ComparisonTable` 0.62 · `ComparisonAccordion` 0.51 · `ColumnHeader` 0.40 · `PickButton` 0.26 · `DraftSummaryBar` 0.22 · `DraftItem` 0.20 · `Callout` 0.20.

## 2. React 코어 분리 원인

### 2.1 원인 (L1 — 원인 제거/재투입 실험)

| 실험 | 바꾼 것 (끝나고 `git checkout`으로 되돌림) | 공통 | React 분리 |
|---|---|---|---|
| base | 없음 | 89.58 | 분리됨 (`jsx-runtime` 3.33) |
| e6 | 엔진에서 `CustomStyleFields` 제거, 타입은 `import { type PrimaryColorCheck }` | 89.58 | **분리됨** — 인라인 `type` 지정자만 남은 import가 **부수효과 import**(`import"./TextField-…"`)로 남아 CustomStyleFields → TextField/Select → react 사슬이 유지됨 |
| **e6b** | 같은 제거, 타입은 `import type { … }` | **89.08** | **해소** — React가 `index`로 합쳐짐 (JS 청크 16 → 14) |
| **e9b** | e6b + 엔진이 `import { useState } from "react"`만 (JSX 없음) | 89.56 | **다시 분리** (`react` 3.23) |

→ **원인: 동적 엔트리 `boardEngine`의 정적 의존 그래프에 `react` 패키지가 들어가는 것.** JSX 여부와 무관하다. V2-1에서 `CustomStyleFields`(JSX)를 엔진으로 옮긴 순간(SPEC B-5)부터 발생했고, V2-1 PROGRESS의 실험 기록(별도 동적 import로 해도, 엔트리에서 엔진을 불러도 같은 분리 — L2)과 일치한다.
- e6b는 기능을 지운 **진단용** 빌드다. 회수 효과로 쓰지 않는다(진입 직후 −2.34에는 기능 제거분이 섞임).
- 부수 발견: 코드베이스에 인라인 `type`만 있는 import(`import { type X } from`)는 **현재 0건**(grep, L1) — 같은 함정으로 새는 바이트는 없다. 다만 V2-4에서 엔진 쪽 타입 import를 쓸 때 `import type`을 써야 한다(주의사항).

### 2.2 rolldown 규칙 쪽 (L1 실패 증거 + L3 내부 규칙)

설치본 타입 문서(`node_modules/rolldown/dist/shared/define-config-*.d.mts`, L1 문서): `experimental.chunkOptimization.mergeCommonChunks`(기본 true)는 공통 청크를 엔트리에 합치되 "**순환 청크 의존을 만들거나 strict 엔트리 export 시그니처를 바꾸면 합치지 않는다**". `output.codeSplitting`(구 `advancedChunks`, `manualChunks`는 deprecated)이 현재 방식이다.

| 실험 | 설정 (`build.rolldownOptions`) | 결과 |
|---|---|---|
| e1 | `experimental.chunkOptimization: false` | JS 27개, 공통 93.80 (+4.22) — 최적화 전에는 react가 단독 청크이고, `Button`·`lib`·`preload-helper` 등 11개 공통 청크가 모두 그것을 import한다 |
| e2 | `chunkOptimization: { avoidRedundantChunkLoads: false }` | 공통 91.12 (+1.54), 분리 유지 |
| e3 | `chunkOptimization: { mergeCommonChunks: false }` | e2와 동일 |
| e4 | `preserveEntrySignatures: false` | base와 동일 (시그니처 조건은 원인이 아님) |
| e5 | `output.strictExecutionOrder: true` | 공통 91.34 (+1.76), 분리 유지 + 런타임 청크 추가 |
| e13 | `codeSplitting.groups: [{ name: "index", test: react·scheduler }]` | 공통 89.87 (+0.29) — 엔트리와 합쳐지지 않고 이름만 같은 별도 청크 |
| e14 | `codeSplitting.groups: [{ name: "vendor", test: node_modules }]` | 공통 95.17 (+5.59) |

- **설정만으로 React를 엔트리에 되돌리는 방법은 찾지 못했다(L1, 7가지).** `codeSplitting` 그룹은 새 청크를 만들 뿐 엔트리에 합치는 수단이 아니다.
- 합치지 않는 내부 판단: react 단독 청크를 import하는 공통 청크들이 엔트리에 먼저 합쳐지지 않은 상태에서 react를 엔트리로 옮기면 엔트리 ↔ 공통 청크 순환이 생겨 "순환이면 합치지 않음" 조건에 걸리는 것으로 추정(**L3** — rolldown은 네이티브 바이너리라 소스 확인 불가). 엔진이 react를 안 쓰면 react의 도달 집합이 다른 공통 모듈과 같아져 처음부터 같은 청크가 되므로 문제가 없다.

### 2.3 청크 경계 오버헤드 (L1)

| 측정 | 값 |
|---|---|
| raw: 분리(`index`+`jsx-runtime`) 281,743B vs 합침(e6b `index`) 281,632B | **+111B** (index의 `import{…}from"./jsx-runtime-…"` 67B + export 문 35B 등) |
| gzip: 따로 압축 89,583B vs 두 파일을 이어 한 번에 압축 89,022B | **+561B** — 압축 문맥 분리(react 코드가 react-dom과 사전을 공유 못 함) + gzip 헤더 |
| 페이지·공유 청크의 jsx-runtime import 문 | 청크당 raw 46~60B (9개 청크) → 라우트 첫 화면에 +0.03~0.07KB |

→ 분리 비용 +0.50KB는 import 문 바이트가 아니라 **거의 전부 압축 효율 손실**이다. `/compare` 첫 화면 비용은 0.57(공통 0.50 + 페이지 청크 import 문 0.07).

## 3. 실험 기록 (전부 되돌림)

- 방법: 추적되지 않는 임시 설정 `app/vite.exp.config.ts`(`mergeConfig(기존 설정, EXP)`)로 `--outDir /tmp/b01/<id>`에 빌드 → `measure.mjs`로 측정. 소스를 바꾼 실험(e6·e6b·e9·e9b·e15)은 각각 직후 `git checkout -- <파일>`. 끝에 임시 설정 삭제.
- e0(래퍼만, 설정 변경 없음) = base와 완전히 같음 → 래퍼가 결과를 바꾸지 않음을 확인.

| id | 바꾼 것 | 공통 | `/catalog` 첫/직후 | 상세 | `/compare` 첫/직후 | 자리표시 | 되돌림 |
|---|---|---|---|---|---|---|---|
| base | — | 89.58 | 99.07 / 101.45 | 96.10 / 98.49 | **99.30** / 121.73 | 90.04 / 92.42 | — |
| e1 | chunkOptimization 끔 | 93.80 | 103.43 / 105.81 | 100.44 / 102.82 | 103.65 / 126.16 | 94.26 / 96.64 | 설정만 |
| e2·e3 | 최적화 한쪽만 끔 | 91.12 | 100.64 / 103.03 | 97.67 / 100.06 | 100.89 / 123.37 | 91.58 / 93.96 | 설정만 |
| e4 | preserveEntrySignatures false | 89.58 | 99.07 / 101.45 | 96.10 / 98.49 | 99.30 / 121.73 | 90.04 / 92.42 | 설정만 |
| e5 | strictExecutionOrder | 91.34 | 101.68 / 104.21 | 98.40 / 100.94 | 101.71 / 125.40 | 91.85 / 94.38 | 설정만 |
| e6 | 엔진 CustomStyleFields 제거(인라인 type) | 89.58 | 99.06 / 101.45 | 96.10 / 98.48 | 99.30 / 120.46 | 90.04 / 92.42 | ✅ checkout |
| e6b | 같은 제거(`import type`) — 진단용 | 89.08 | 98.17 / 100.55 | 95.55 / 97.93 | 98.73 / 119.39 | 89.51 / 91.90 | ✅ checkout |
| e9b | e6b + 엔진 `react` 값 import | 89.56 | 98.66 / 101.05 | 96.04 / 98.42 | 99.23 / 119.92 | 89.99 / 92.38 | ✅ checkout |
| e10 | `assetsInlineLimit: 0` (아이콘 전부 파일) | 88.30 | 97.79 / 100.17 | 94.82 / 97.20 | 98.02 / 120.45 | 88.76 / 91.14 | 설정만 |
| e11 | `build.target: "esnext"` | 89.58 | 99.07 / 101.45 | 96.10 / 98.48 | 99.30 / 121.73 | 90.04 / 92.42 | 설정만 |
| e12 | `output.minify` 옵션(maxIterations·toplevel mangle) | 89.58 | (base와 해시까지 동일) | | | | 설정만 |
| e13 | codeSplitting group "index" | 89.87 | 99.38 / 101.76 | 96.42 / 98.80 | 99.61 / 122.04 | 90.32 / 92.71 | 설정만 |
| e14 | codeSplitting group "vendor" | 95.17 | 104.69 / 107.08 | 101.72 / 104.11 | 104.91 / 121.69 | 95.61 / 97.99 | 설정만 |
| **e15** | `NOT_INLINED_ICONS`에 bookmark·bookmark-fill·search·arrow-right·chevron-left 추가 | **88.66** | 98.15 / 100.53 | 95.19 / 97.57 | **98.38** / 120.81 | 89.12 / 91.51 | ✅ checkout |

- e9(인라인 `type` + react import)는 e6과 같은 오염으로 판정에서 제외하고 e9b로 다시 했다.
- e12는 "효과 없음"이 아니라 **미적용·미검증**이다(출력 해시 동일 → Vite가 `output.minify`를 자체 값으로 덮는 것으로 보임, L3). 더 파지 않았다.
- e11: Vite 8 기본 target(baseline-widely-available)이 이미 충분히 현대적이라 변화 0.

## 4. 회수 후보

| # | 후보 | `/compare` 첫 화면 효과 | 다른 라우트 | 위험 | 변경 범위 | 근거 |
|---|---|---|---|---|---|---|
| **C1** | **`/compare` 첫 화면에 안 쓰는 인라인 아이콘 5개를 파일로** (bookmark·bookmark-fill·search·arrow-right·chevron-left) | **−0.92** (98.38) | 공통 −0.92 → 모든 라우트 −0.92 | 낮음~중: 바이트가 없어지는 게 아니라 SVG 요청으로 옮겨진다. `/catalog`는 SVG 4개 1.52KB(gzip) 요청 추가, 상세는 3개 1.27KB. `/compare`·자리표시는 추가 요청 없음(해당 아이콘을 그리지 않음 — grep L2). CSS mask라 첫 페인트 뒤 아이콘이 늦게 뜰 수 있음 | `vite.config.ts` 배열 1줄 + 주석 | e15 L1 |
| C2 | 아이콘 전부 파일로 (`assetsInlineLimit: 0` 또는 배열에 plus·close 추가) | −1.28 (98.02) | 모든 라우트 −1.28 | 중: 셸 헤더 `plus`까지 요청으로 → 모든 라우트 첫 화면 아이콘 지연. ADR-004 개정 1의 "예산 우회 방지" 취지와 충돌 소지가 C1보다 큼 | 1줄 | e10 L1 |
| C3 | React 분리 해소 (엔진의 react 의존 제거 = `CustomStyleFields`를 페이지 청크로 되돌림) | **약 +0.8 악화**(추정 약 100.1, **예산 초과**) | 다른 라우트 −0.50 (여유 회복) | 높음(`/compare`): V2-1 이동의 총효과 약 −1.40(순효과 −0.83(99.98 → 99.15, V2-1 기록 L2) + 분리 비용 0.57)을 잃고 분리 비용 0.57만 회수 | 파일 3~4개 | e6b·e9b L1 + V2-1 기록 L2 → 순효과 L3 |
| C4 | 청크 설정(`chunkOptimization`·`codeSplitting`·`strictExecutionOrder`·`preserveEntrySignatures`) | 0 또는 악화(+0.29~+5.6) | 같음 | — | — | e1~e5·e13·e14 L1 — **후보 아님** |
| C5 | minify·target 옵션 | 0 (target) / 미적용 (minify) | — | — | — | e11 L1 · e12 미검증 |
| C6 | react-router `dom/ssr/*`(components·links·single-fetch, 한계 합 2.06)를 SPA에서 빼기 | 최대 −2.0 (L3) | 모든 라우트 | 높음: `Link`/`NavLink`의 prefetch 경로가 끌고 오는 것으로 보임(L3, 미확인). 빼려면 링크 컴포넌트 교체 또는 라우터 사용 방식 변경 — 라이브러리 내부에 기대는 변경 | 넓음 | 귀속 L1, 원인·효과 L3, **실험 안 함** |
| C7 | 비교 전용 도메인(`compareBoard`·`CompareTrayContext`·`colorFamily`·`boardColumns` 등, 한계 합 약 1.8)을 공통 밖으로 | **0** (`/compare`는 어차피 받음) | `/catalog`·상세·자리표시 최대 −1.8 (L3) | 중: 트레이 컨텍스트는 셸이 쓴다 | 중 | 귀속 L1, 효과 L3 |
| C8 | B-5 추가: 보드 준비(엔진 로드) 뒤에만 그려지는 페이지 컴포넌트를 엔진 청크로 (`DraftPanel`·`DraftItem`·`DraftSummaryBar` 등 한계 합 약 1.4) | 약 −0.8~−1.2 (L3) | 없음 | 중: 진입 직후 합계는 거의 그대로(121.7 → 약 122), 로딩 표시 구간이 이미 있는지 확인 필요. React 분리 비용은 이미 치렀으므로 추가 분리 비용 없음(e9b 근거) | 파일 3~5개 + 테스트 | 귀속 L1, 효과 L3, **실험 안 함** |

## 5. 권고안과 V2-4 전 여유

### 권고안 R1 — C1 (부분 아이콘 파일화)
- 효과: `/compare` **99.30 → 98.38**, 여유 **0.70 → 1.62KB** (L1). `/catalog` 여유 0.93 → 1.85, 상세 3.90 → 4.81, 자리표시 9.96 → 10.88.
- 이유: 설정 한 줄, 코드·테스트 동작 변경 없음, `/compare`에는 추가 요청이 없다(해당 아이콘을 그리지 않음). 기존 `NOT_INLINED_ICONS` 규칙(vite.config.ts 주석, ADR-004)의 연장이다.
- 주의: 옮긴 바이트는 `/catalog`(4개 1.52KB)·상세(3개 1.27KB)의 SVG 요청이 된다. JS 예산 밖으로 옮기는 것이므로 REPORT/ADR 비고에 요청 수 증가를 함께 적을 것. QA에서 카탈로그 카드 북마크·검색 아이콘이 늦게 뜨는지 확인 필요(브라우저 확인은 이번에 안 함).
- 작업 크기: **2~4턴** (배열 수정 + 주석 갱신 + 필요 시 가드 테스트 1개 + 검증 4종·번들 실측).

### 대안
- **A1 — R1 + C8 (B-5 추가)**: 여유 약 **2.4~2.8KB**(L3). V2-4 증가분이 1.6KB를 넘을 것 같을 때. 작업 크기 **6~10턴**(이동 + 기존 테스트 조정 + 번들 실측). 진입 직후 합계(125)는 약 3KB 여유 유지 예상.
- **A2 — C2 (아이콘 전부 파일화)**: R1보다 −0.36 더(여유 1.98). 셸 아이콘 지연을 받아들일 수 있을 때만.
- **A3 (마지막) — ADR-004 예산 조정**: 공통의 74%가 react-dom(66.5KB)이라 앱 코드로 줄일 몫이 구조적으로 작고, 라우트 청크가 늘 때마다 같은 압박이 반복된다. 그래도 R1·A1로 V2-4를 흡수할 수 있는 동안에는 권하지 않는다. 조정한다면 대상은 "첫 화면 100KB"이며, React 분리 비용(0.5)처럼 번들러 구조 비용이 설정으로 회수되지 않는다는 실측(2.2절)을 근거로 쓸 수 있다.

### V2-4 전 확보 가능 여유 추정 범위
| 조치 | `/compare` 첫 화면 | 여유 | 근거 |
|---|---|---|---|
| 현재 | 99.30 | 0.70 | L1 |
| R1 | 98.38 | **1.62** | L1 (e15) |
| R1 + C8 | 약 97.2~97.6 | **약 2.4~2.8** | L3 |
| C2 + C8 | 약 96.8~97.2 | 약 2.8~3.2 | L3 |

## 6. 되돌림 확인 · 산출물

- 제품 코드 변경: 없음. `app/vite.exp.config.ts`(추적 안 됨) 삭제 후
  - `git diff --stat -- app` → **빈 출력** (L1)
  - `git status --porcelain -- app` → **빈 출력** (L1, 추적 안 되는 파일까지 없음)
- 커밋: `docs/perf/bundle-01/`만 (REPORT.md · attribute.mjs · measure.mjs). push·원격 없음, `design/` 변경 없음.
- 실험 산출물(빌드·로그)은 `/tmp/b01/`에만 있다(커밋 안 함).

## 7. 남은 위험·확인 필요

| # | 내용 | 수준 |
|---|---|---|
| U-1 | React 분리의 rolldown 내부 판단(순환 회피)은 추정. rolldown 버전이 오르면 자동 해소될 수도 있다 — 업그레이드 때 `measure.mjs`로 재측정 권장 | L3 |
| U-2 | C1의 아이콘 지연 표시(UX)는 브라우저로 확인 안 함 | 확인 필요 |
| U-3 | C6(react-router ssr 모듈)·C8(B-5 추가) 효과는 귀속 수치 기반 추정, 실험 안 함 | L3 |
| U-4 | e12 minify 옵션은 적용 여부부터 미확인 | 미검증 |
| U-5 | 병렬 작업 `v2-3-detail`이 공통 청크를 바꾸면 이 수치는 main 병합 뒤 다시 재야 한다 | 중 |
