# PROFILE-HEADROOM-C6 — REPORT

> 브랜치 `k002bill2/profile-headroom-c6` · base main `f22bbc8`(+브리프 `dbd91cf`) · 2026-09-27 · 서브에이전트 0 · studio 파일 수정 0 · push·병합 없음.

## 1. 요약
- **H1 여유 확보: 달성치 0 (목표 ≤124.45 미달)**. 1순위(실패 분기를 조작 뒤 청크로)는 실측 **+0.15 역효과**라 되돌렸다. 2순위도 조건에 맞는 후보가 없다(3절).
- **H2 C6 재시도: 적용**. 첫 확정에도 `projectCreated`를 넘긴다. 프로필 화면은 이 state를 `history.replaceState`로 비운다(라우터 이동 없음).
  - `/profile` 진입 124.69로 base와 같다(여유 0.31).
  - 전체 vitest 3회 결과는 5절.
- **브리프 이탈 1건**: 지운 조정(P-S25) 경로는 기존 `navigate(replace)`를 유지했다. 근거는 4절.

## 2. 커밋
| SHA | 내용 |
|---|---|
| `139babb` | H0 base build · H1 1순위 실측 역효과 기록(PROGRESS, `logs/base-build.txt`, `logs/h1-red.txt`, `logs/h1-attempt-dynimport.diff`) |
| `ca179d1` | H2 — `app/src/pages/ProfilePage.tsx` · `app/src/features/compare/useCompareBoard.ts` · `app/src/pages/CompareBoardTarget.test.tsx` |
| (이 커밋) | H2·H3 로그 · REPORT · PROGRESS |

## 3. H1 — 왜 달성치 0인가 (실측, L1)
| 변형 (vite build, profileEngine gzip) | profileEngine | 차이 |
|---|---|---|
| base(C5 포함) | 9.98 | — |
| C5 이전 CandidatesSection(편집 시작 연결 전체 제거) | 9.75 | −0.23 |
| 실패 알림 JSX만 제거 | 9.95 | −0.03 |
| 1순위 구현: `memoryDocBook.startEdit()`이 `{ state } \| { alert?, retry }` 반환 + CandidatesSection `import("../../data/memoryDocBook")` | **10.13** | **+0.15** |

- **C5 전체를 없애도 124.46이다.** 목표 124.45에 못 미치므로 1순위만으로는 목표에 닿을 수 없다.
- **역효과 원인:** base profileEngine에는 `import()` 지점이 하나도 없다. 새 지점 하나가 `__vitePreload` 호출과 `__vite__mapDeps`(해시 파일명 4개: memoryDocBook·sectionLibrary·generatorVersion·projectRepository)를 청크에 싣는다. 그 비용이 옮긴 분기 코드(약 0.1)보다 크다.
- **판정 규칙:** 조작 뒤로 옮겨 이득을 보려면 옮기는 코드가 gzip 약 0.2 이상이어야 한다.
- **기존 경로 재사용 불가:** 이미 있는 `loadProjects()` 경로에 태우려면 `projectRepository`(인터페이스)나 `memoryProjectRepository`를 고쳐야 한다. 둘 다 소유 파일 밖이다.
- **증거 보존:** 시도한 diff는 `logs/h1-attempt-dynimport.diff`, 계약 테스트 RED(6/6 실패)는 `logs/h1-red.txt`에 있다. 구현을 되돌리면서 계약 테스트도 지웠다(고아 import 방지).
- **2순위 실측 목록**(`profileEngine` 모듈별 gzip B, 임시 분석 빌드):
  - CandidatesSection 2191 · AdjustmentPanel 2238 · CandidateCard 1998 · profileMessages 1855 · PaletteContrast 1653 · useGeneration 1405 · ProfilePanel 1195 · generationText 1125 · CandidateTable 1099 · adjustmentDraft 885 · profileDiff 828
  - 모두 진입 렌더(카드·패널·표·대비 표시)에 쓰인다.
  - 핸들러 전용 덩어리는 `saveMessages`·`revertMessages`(문구 객체, 수백 B)뿐이다. `import()` 비용을 넘지 못하고, 옮길 곳(`memoryProfileAdjust`)도 소유 밖이라 시도하지 않았다.
- **다음 여유 확보 후보(제안, 미측정):**
  - `ProjectLoader` 결과에 편집 시작 분기를 얹는다. 저장소 계약 변경이라 Jarvis 결정이 필요하다.
  - 또는 profileEngine이 이미 받는 조작 뒤 청크가 생길 때 그 청크에 합류시킨다.

## 4. H2 — C6 재시도
- **`useCompareBoard.ts`:** `created = toNew || confirmed === undefined`(`f50aaba` 한 줄 그대로).
- **`CompareBoardTarget.test.tsx`:** `f50aaba` 케이스를 복원했다.
  - RED: `expected null to match object { projectCreated: true }`(`logs/h2-red.txt`)
  - GREEN: 관련 10파일 149/149(`logs/h2-green.txt`)
- **`ProfilePage.tsx`:**
  - `projectCreated`(첫 확정 포함)는 마운트 때 ref(`announceCreated`)에 잡는다. 비우기는 `history.replaceState({ ...history.state, usr: null }, "")`다.
  - 라우터 이동이 없으므로 "늦은 replace가 화면을 프로필로 되돌리는" 경쟁이 C6 경로에서 사라진다.
- **브리프 이탈 — 지운 조정 경로는 `navigate(location, { replace: true, state: null })` 유지:**
  - 소유 밖 기존 테스트 `CompareBoardCarryOver.test.tsx:292·299`가 **MemoryRouter의 `router.state.location.state`에서 `droppedCount`가 비워졌는지**를 단언한다.
  - `history.replaceState`는 MemoryRouter state를 바꾸지 못한다. 따라서 브리프대로 전부 바꾸면 이 단언이 깨진다(약화 금지·소유 밖).
  - 지운 조정 경로는 재확정 + 조정 있음일 때만 탄다. main에서 3/3 통과하던 기존 동작이다. 첫 확정(C6)은 이 경로를 타지 않는다.
  - 브리프의 `useState`로 1회 읽는 형태는 번들 때문에 쓰지 않았다(4-1 참고). `droppedCount`는 매 렌더 읽지만 navigate replace 뒤 state가 null이라 다시 알리지 않는다.
- **4-1. 번들 조정:**
  - 첫 구현(`useState` 1회 읽기 + 가드 ref 2개 + `window.history`)은 ProfilePage 7.19→7.25로 `/profile` 124.77(**여유 0.23 < 0.3**)이었다. 커밋 전에 줄였다.
  - 2차 124.73, 3차 124.74도 멈춤선 아래였다.
  - 최종(`history` 전역 · `navigate(location, …)` · deps `[location, …]`)은 ProfilePage 7.18로 **124.69**다.
- **알림 문구:** P-S25 "조정 M개를 지웠습니다"(CarryOver 13.7 테스트)와 J-S11 "새 프로젝트 '…'을 만들었습니다"(Target 두 케이스)는 문장·1회성이 그대로다. 기존 테스트가 통과하는 것으로 확인했다.

## 5. 전체 vitest 3회 (`logs/h2-full-x3.txt`)
`npx vitest run` 3회 연속 실행(순차 실행, 다른 부하 없음) — **3회 모두 exit 0 · Test Files 111/111 · Tests 1273/1273 · 실패 0**.
- 이전에 C6 되돌림의 원인이던 `CompareBoardPage.test.tsx` "S-15·S-16 / AC-25" 계열을 포함해 재현되지 않았다. 원시 로그는 `logs/h2-full-run{1,2,3}.txt`에 있다.

## 6. 번들 (gzip KB, `[bundle]` 판정 줄)
| 시점 | /profile 첫/진입 | /catalog 첫/진입 | /compare 첫/진입 | /projects 진입 | /studio 첫/진입 | 공통 |
|---|---|---|---|---|---|---|
| base `dbd91cf` | 99.60 / 124.69 | 99.65 / 102.03 | 98.75 / 121.39 | 106.99 | 90.73 / 104.33 | 89.34 |
| H2 `ca179d1` | 99.60 / **124.69** | 99.63 / 102.02 | 98.74 / 121.38 | 106.98 | 90.72 / 104.32 | 89.33 |
| H3 final | 99.60 / 124.69 | 99.63 / 102.02 | 98.74 / 121.38 | 106.98 | 90.72 / 104.32 | 89.33 |

- **청크별 변화(base → H2):**
  - ProfilePage 7.19 → 7.18
  - profileEngine 9.98 → 9.98
  - CompareBoardPage 8.13 → 8.14(한 줄 +0.01)
  - index 86.97 → 86.96(해시 변동)
- 새 청크 0. 여유 최소는 `/profile` 0.31이다(멈춤선 0.3 이상).

## 7. H3 최종 build
`npm run build` exit 0(`logs/final-build.txt`, tsc 포함). 수치는 H2와 같다(6절 표). 멈춤선 해당 없음.

## 8. 남은 위험 · 이관
- **`/profile` 여유 0.31 그대로:** 요동 폭(±0.02~0.03) 안이다. a2·a3 변경이 `/profile`을 +0.02만 흔들어도 멈춤선에 걸린다. H1 목표(≥0.55)는 소유 범위 안에서는 달성 불가다(3절). 저장소 계약 변경을 포함한 별건 결정이 필요하다.
- **지운 조정 경로의 navigate replace 잔존(4절):** 재확정 직후 곧바로 보드로 돌아가는 경쟁은 이론상 남아 있다(기존 동작). 없애려면 `CompareBoardCarryOver.test.tsx` 13.7 단언을 "라우터 state"가 아니라 "재알림 없음"으로 바꾸는 결정이 필요하다(소유 밖).
- **실브라우저 확인은 병합 뒤 QA로 이관:** BrowserRouter에서 `history.replaceState` 뒤 뒤로·앞으로 가기로 재알림이 없는지, 새로고침 뒤에도 재알림이 없는지 확인해야 한다(긴 브라우저 흐름 금지 — 이관).
- **Codex `review --scope branch --base f22bbc8`:** 턴 예산이 부족해 이관한다.
