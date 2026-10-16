# STUDIO-PRELOAD-SLIM QA REPORT — 독립 검증

작성 2026-10-17 · QA(Claude Code, Orca) · 대상 `k002bill2/studio-preload-slim` 구현 `4f4a7be7` · REPORT `2b5048b7` · base `92522714` · 같은 머신

## 0. 판정 — **PASS with notes**
- 동작 변화 0 논리 성립, 가드 변이 3건 전부 검출(build exit 1), 기준선 인용 원문 일치, 실화면 오류 0, fresh 게이트 4종 exit 0 · 317/2856 · 번들 표 REPORT와 전 항목 일치, 기존 테스트 변경 0.
- notes(차단 아님):
  - N1. 변이 ①(resolveDependencies 제거)은 **예산 판정으로는 안 잡힌다** — 정규화 128.24 < 멈춤 128.53. 감량분 회귀를 막는 것은 preload 가드 하나뿐이다(가드 제거·약화 시 조용한 회귀). 현 상태는 정상 동작.
  - N2. `preloadDedup.plugin`은 render·thumbs 빌드에도 등록된다(번들 잡기만 하고 resolveDependencies 미사용 → 산출물 무영향, 렌더 JS 84.22 불변으로 확인). REPORT "렌더·thumbs 빌드 무변경"은 산출물 기준으로 맞다.
  - N3. 엔트리 닫힘 제외는 "앱 빌드 엔트리 1개(index.html)" 전제다. 앞으로 앱 빌드에 HTML 엔트리를 더 넣으면 다른 엔트리 닫힘까지 빠져 preload만 줄어든다(정확성 무영향·성능만). 현재 앱 manifest isEntry = `index.html` 1개(사실).
  - N4. REPORT의 개정 13 인용 "다음 레인 여유"는 원문 "P2 레인 여유(약 0.53)"의 의역 — 취지 동일.

## 1. 변이 표 (매번 `git checkout -- .`(app/)로 복원 · 복원 뒤 `git status --porcelain app/` 빈 출력 확인)
| # | 변이 | `npm run build` | 검출 내용 |
|---|---|---|---|
| ① | `vite.config.ts` modulePreload에서 `resolveDependencies` 제거 | **exit 1** | 가드 ① 16개 청크 중복(예: `index` 목록에 react · `StudioLayout` 목록에 issue·sectionLibrary·index·react…). 예산은 통과(정규화 128.24/131.23 · raw 129.63/132.66) → N1 |
| ② | `polyfill: false` 제거 | **exit 1** | 가드 ③ `엔트리 assets/index-BaAgVHNX.js에 modulepreload polyfill이 있습니다` |
| ③ | `dedupPreloads`의 HTML 통과 분기 제거 | **exit 1** | 가드 ② `dist/index.html에 assets/react-yIOJJ3r4.js modulepreload 링크가 없습니다`(index.html modulepreload 0개). 단위 테스트도 1건 실패(`HTML 호스트는 그대로 돌려준다`) |
- ③ 첫 시도(줄 삭제)는 `tsc` TS6133(hostType 미사용)으로 exit 2 — 가드까지 못 가서 `void hostType;` 치환으로 재시도한 결과가 위 표.
- 변이 뒤 깨끗한 dist 재빌드 exit 0 · 가드 통과(`dist`는 gitignore).

## 2. 논리 검토 (동작 변화 0)
- Vite 8.3.1 호출부(`node_modules/vite/dist/node/chunks/node.js` ~26985): `resolveDependencies(normalizedFile, otherDeps, { hostId: file, hostType: "js" })` — `file`은 `for (const file in bundle)` 키 = 청크 fileName, deps는 **JS만**(CSS는 따로 뒤에 붙임). → `staticClosure`가 bundle 키·`imports`(정적 import만)로 비교하는 것이 형식상 맞고, CSS preload는 손대지 않는다.
- 제외 집합 = 호스트 청크 정적 닫힘 ∪ 앱 엔트리 정적 닫힘. 호스트가 `import()`를 실행했다면 호스트와 그 정적 닫힘은 이미 링크·평가됐고, 모든 JS 호스트는 엔트리 실행 뒤에만 도달하므로 엔트리 닫힘도 이미 받은 상태다(앱 엔트리 1개 — N3). 정적 의존은 평가 전에 전부 fetch되므로 엔트리 평가 중 top-level `import()`도 안전.
- preload는 최적화일 뿐 import 자체가 모듈을 받으므로, 설령 과제외가 생겨도 정확성은 안 바뀌고 순서·속도만 바뀐다(안전한 방향).
- HTML 호스트: `hostType !== "js"`면 그대로 → index.html 링크 유지(변이 ③으로 가드가 보호함을 확인).
- 다른 빌드로 새는지: `modulePreload` 설정은 앱 모드 분기에만 있음. render manifest 엔트리 `render.html` 1개 · 동적 엔트리 0 · 렌더 JS 84.22 불변. thumbs는 SSR 도구 빌드.
- 플러그인 상태: `createPreloadDedup()` 클로저 변수 하나. `build` 스크립트는 `vite build` 3회를 **별도 프로세스**로 실행하고, 같은 프로세스여도 `generateBundle(pre)`가 사용 직전마다 덮어쓴다 → 빌드 간 섞임 없음. 순서가 바뀌면 bundle `{}` → 필터 0건(기존 출력)이며 가드 ①이 잡는다(변이 ①과 같은 증상).
- 실제 브라우저에서 `StudioLayout` 등 동적 청크 주입 링크에 index·react 중복이 없음을 확인(4절).

## 3. 기준선 인용 대조 (`docs/decisions/ADR-004-performance-budgets.md`)
| REPORT 인용 | 원문 | 판정 |
|---|---|---|
| 개정 16 결정 5 "배분 관례(개정 15 결정 3) 그대로 — 배분 레인은 정규화 실측으로 `normEagerKb`와 테스트 기대값을 같은 커밋에서 올린다" | "배분 관례(개정 15 결정 3)는 그대로다. 앞으로 배분 레인은 정규화 실측으로 `normEagerKb`와 `bundleBudget.test.mjs` 기대값을 같은 커밋에서 올린다." (L271) | 일치(축약) |
| 개정 8 감량분 잠금 128.67 → 128.19, 영환님 "★A" | 개정 8 제목·결정 1 (L146·152) | 일치 |
| 개정 13 ENTRY-SLIM −0.56, "기준선·한도·멈춤선은 바꾸지 않는다 — 감량분은 잠금하지 않고 해시·공유 청크 잡음 흡수와 다음 레인 여유로" | L225~228: 129.65 → 129.09(−0.56) · "…잡음 흡수와 **P2 레인 여유(약 0.53)**로 남긴다" | 일치(의역 — N4) |
| 정규화 기준선 128.50·131.48 | 개정 16 결정 2 · `m2cBaseline.json` normEagerKb 128.5·131.48 | 일치 |
- 판단: 감량 레인이 기준선을 내려야 한다는 규정은 원문에 없고, 개정 13 선례(Jarvis 감량·기준선 불변)와 일치 → "변경 안 함"은 근거 있음. 잠금 여부는 REPORT대로 Jarvis/영환님 결정 사항.

## 4. 실화면 (Ego Lite · preview `127.0.0.1:4372`, 사전 리슨 0 확인)
- 흐름(첫 goto 1회 뒤 앱 안 클릭만): `/` → `/catalog` 첫 진입 → 모던 카페·로컬 베이커리 비교 추가 → 비교 보드 → "이 레퍼런스로 전부 선택: A" → 프로필 확정 v1 → 3안 만들기 → A안 선택 → 편집 시작 `/studio/project-1` → Hero 제목 "아침을 여는 한 잔 QA" → "이 브라우저에 저장됨" → 새로고침(복원 진입) → 제목 유지 → "프로젝트로 돌아가기" `/projects`(프로젝트 1건 표시).
- 구간별 CDP 이벤트: `Network.loadingFailed` · `Log` 항목 · console error/warning · `Runtime.exceptionThrown` · 4xx/5xx **전 구간 0**. JS 응답: 카탈로그 13(304) · 비교 15 · 프로필 29 · 3안 2 · 편집기 8 · 편집 1(docEngine) · 새로고침 19 · 프로젝트 7 — 전부 200/304. 레이지 청크 정상 로드.
- 새로고침 뒤 문서 modulepreload: HTML `react` + 동적 import 헬퍼 주입 17개(StudioPage·StudioLayout·issue·gateCheck…) — `index`·`react` 재주입 없음.
- 캡처: `qa-shots/01-catalog.png` · `02-studio-saved.png` · `03-studio-restored.png` · `04-projects.png`.
- 정리: `indexedDB.deleteDatabase("design-studio")` → deleted · `finish({keep:[]})` · `listTaskSpaces()` `[]` · preview 종료 · 4372 리슨 0. 영환님 창·main 5480 무접촉(5480 리슨 없음 확인).
- 참고: 첫 `goto` 직전 이벤트 묶음의 loadingFailed 1·Log 1은 빈 탭(`chrome://resources`) 시작 구간 것이라 이벤트를 비운 뒤 같은 진입을 다시 재서 0을 확인했다(원인 URL 미기록 — 미확인).

## 5. fresh 게이트 (`app/`, HEAD 코드 = `4f4a7be7`)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test -- --run` | exit 0 — Test Files **317** passed · Tests **2856** passed (기대 317/2856 일치) |
| `npm run build` | exit 0 — preload 가드 통과(17개 청크 · modulepreload 1개) · 썸네일 가드 통과 |
- 번들 표 REPORT 대조: `/studio` 정규화 128.09 · raw 129.40 · 복원 131.07/132.43 · 첫 화면 91.53 · 공통 89.10 · `/catalog` 100.05/102.39 · `/references` 97.46/99.80 · `/compare` 98.95/122.70 · `/profile` 99.56/120.10 · 3안 122.58 · `/projects` 99.15/108.38 · 렌더 84.22/8.89 — **전 항목 일치**.
- 기존 테스트: `git diff --name-status 92522714 -- app/` 테스트 파일 = `A preloadGuard.test.mjs` · `A preloadDedup.test.ts`만(추가). 기존 테스트 수정·삭제 0.
- 최종 `git status --porcelain`: `app/` 변경 0.

## 6. 사실 / 추정 / 미확인
- 사실(L1): 1·4·5절 명령 출력, 2절 Vite 호출부 코드, 3절 원문 대조.
- 추정(L2): 2절 "모든 JS 호스트는 엔트리 실행 뒤에만 도달" — 엔트리 1개 구조에서의 추론(manifest로 엔트리 수는 확인).
- 미확인: Firefox/Safari(modulepreload 미지원 범위) 실기기 · 첫 goto 직전 loadingFailed 1건의 URL(앱 진입 재측정은 0).
- 서브에이전트 0(브리프 "불필요") · Codex 0(브리프 금지) · push·원격 쓰기 0.
