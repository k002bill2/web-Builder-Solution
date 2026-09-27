# EDITOR-A1-BETA — REPORT (RESUME-1 · store 확장에서 `/profile` 진입 직후 여유 게이트 불합격 · 중지)

**결론: 1단계 첫 공통 변경(store 프로젝트 레코드 + 보드 확정 대상)만으로 `/profile` 진입 직후가 124.74KB(여유 0.26)가 되어 멈춤선 0.3 아래 → 브리프대로 예산·분류를 바꾸지 않고 실측·REPORT 커밋 후 1단계 화면 연결을 중지했다.** store·트랜잭션·멱등 키·프로젝트 저장소(목록·이름 바꾸기)와 번들 0 작업(12.4 테스트 · D3 · 미사용 파일 정리)은 끝냈다.

- 기준: HEAD `90e9d89`(재개 기준 실측) + 브리프 `477b5c5` · 재개 수신 `ffb0063` · 브랜치 `k002bill2/editor-a1-beta` (push·병합·삭제 없음)
- 로컬 커밋: `6fa96fa`(store·확정 대상 — 측정 상태, 병합 대상 아님) · `afd64c0`(12.4 헤더·/studio 단언 + 미사용 파일 삭제, 서브에이전트) · `67e5ac2`(QA D3, 서브에이전트 — **결정 필요**) · `5607c04`(12.4 P-AC-03 → /projects) · 이 REPORT 커밋
- 근거 수준: 번들 수치 L1(`npm run build` → `scripts/check-bundle-size.mjs`, gzip KB, 로그 `logs/r1-*`) · 청크별 분해 L1(빌드 출력 청크 크기 diff) · 남은 비용 추정 L3

## 1. 번들 전후 표 (첫 화면 / 진입 직후, 예산 100 / 125, 멈춤선 여유 0.3)

| 시나리오 | 재개 기준 `90e9d89` | R1 첫 구현 | R1 최소화(커밋 `5607c04`) | 여유 | 판정 |
|---|---|---|---|---|---|
| 공통 JS | 89.32 | 89.35 | 89.34 (+0.02) | — | — |
| `/catalog` | 99.63 / 102.01 | 99.65 / 102.04 | 99.65 / 102.03 | **0.35** / 22.97 | 통과 |
| `/references/:id` | 96.97 / 99.36 | 97.00 / 99.38 | 96.99 / 99.38 | 3.01 / 25.62 | 통과 |
| `/compare` · (조정 있음) | 98.39 / 121.25 | 98.41 / 121.49 | 98.41 / 121.38 | 1.59 / 3.62 | 통과 |
| **`/profile`** | 99.38 / 124.62 | 99.41 / 124.86 | 99.41 / **124.74** | 0.59 / **0.26** | **불합격** |
| `/projects` | 93.64 / 106.18 | 93.96 / 107.06 | 93.96 / 106.94 | 6.04 / 18.06 | 통과 |
| `/studio/:projectId` | 90.71 / 103.43 | 90.74 / 104.40 | 90.73 / 104.28 | 9.27 / 20.72 | 통과 |

- 청크별(재개 기준 → 최소화): `memoryStudio` 4.26 → **4.36 (+0.10)** · `index`(공통) 86.95 → 86.97 (+0.02) · `memoryBoardConfirm`(조작 뒤, 예산 밖) 1.50 → 1.82 · `projectName` 새 공유 청크 0.38(조작 뒤·`/projects`) · `memoryProjectRepository` 0.27 → 0.62(`/projects` 진입 직후).
- `memoryStudio`는 `/profile`·`/compare` 진입 직후에 자동으로 붙는다. 늘어난 것: store `projects` 슬롯·reader 2개·`putProject`, 보드 `view()`의 `projectId`·`projectName`(J-S10 라디오 이름), `getProfile`의 `project`(프로필 "프로젝트: <이름>"), 프로젝트 로더에 store 전달.
- 최소화 1회(R1 첫 구현 → 최소화): 확정 대상 판정·멱등 재생·계열 검사를 저장소에서 확정 본문(`memoryBoardConfirm`, 조작 뒤)으로 옮김 → `/profile` 진입 직후 −0.11.
- 실험(커밋 안 함, 로그만):
  - `logs/r1-exp-inline-build.txt` — `projectName` 공유 청크를 없애면(검증·기본 이름을 인라인) `/profile` 124.71(여유 0.29). **이것만으로도 0.3 미달.**
  - `logs/r1-exp-b-loader-common.txt` — 프로젝트 로더를 `memoryStudio` 밖(공통 `main.tsx` 핸들)으로 옮기면 `memoryStudio` −0.08이지만 공통 +0.07 → `/profile` 124.74 그대로, `/catalog` 99.70(여유 0.30). **해법 아님.**
- 남은 1단계 화면 연결의 추가 비용(L3): 프로필 머리 "프로젝트: <이름>" 링크 · J-S11 알림 · 편집 시작 `projectId` 전달은 모두 `ProfilePage` 청크(= `/profile` 첫 화면과 진입 직후 둘 다) — +0.05~0.10 → 진입 직후 여유 ≈ 0.16~0.21. S-B9 라디오(보드 첫 화면)는 `/compare` 여유 1.59 안이라 이것만은 가능하다(L3 +0.10~0.20).

## 2. 한 일 (체크리스트 R0~R9 대응)
- **R1 store · 확정(12.2)** — `data/studioStore.ts`(projects 슬롯 · `projects()`·`projectOf()` · `putProject` 동결) · `data/memoryBoardConfirm.ts`(`confirmFirst`·`confirmVersion` — 새 계열이면 프로젝트를 같은 트랜잭션에 생성 ④, 기본 이름 = a1-α `defaultProjectName`, 멱등 키 = (보드 id, revision, expectedLatest, 대상), 재생은 계열마다 마지막 커밋에서 찾고 계열 검사보다 먼저) · `data/compareBoardRepository.ts`(`ConfirmTarget`, `createProfileVersion(…, target)` 필수 인자 — 공통 deferred 래퍼는 나머지 인자 그대로 넘김) · `data/memoryCompareBoardRepository.ts`(`ConfirmedRef` `projectId`·`projectName`) · `data/memoryProfileRepository.ts`(`getProfile`에 `project`) · `domain/compareBoard.ts`·`domain/profile.ts` 타입 · `features/compare/useCompareBoard.ts`(재확정 `"current"`).
- **R3 프로젝트 저장소** — `data/memoryProjectRepository.ts` 실제 구현: `listProjects`(마지막 변경 = 이름·프로필 새 버전 중 최신, 내림차순) · `getProject` · `renameProject`(a1-α `validateProjectName` 1~40자 코드포인트 · `STALE_PROJECT` 최신 동봉 · `NOT_FOUND`) · 문서 관련은 문서 없음. `data/memoryStudio.ts` 로더가 store·now를 넘긴다.
- **R5 12.4 테스트** — 아래 3절. 미사용 `components/profile/ProfileList.tsx`·`features/profile/useProfileList.ts`·`pages/PlaceholderPage.tsx` 삭제(사용처 0, grep).
- **R6 D3** — 서브에이전트 `67e5ac2`. 아래 5절.
- 새 테스트: `data/boardConfirmProject.test.ts` 12건(J-AC-04 데이터 · J-AC-06 · J-AC-07 ①②③ · `defaultProjectName` · 이름 바꾸기 저장소 · RED 9건 확인 후 GREEN).

## 3. 12.4 깨질 테스트 처리 (삭제·완화 없음)
| # | 파일 · 단언 | 처리 | 의미 보존 |
|---|---|---|---|
| 1~5 | `AppHeader.test` 헤더 구성 `it.each`(5행) | 경로 `/profile` → `/projects`, "새 프로젝트" role `button` → `link` + `href="/compare?new=1"` | 보이는 글자·위치 단언 유지. "프로젝트" `href` 단언 추가 + 새 테스트 J-AC-01(`aria-current`는 `/projects`·`/profile/:id`에서만) |
| 6 | `CatalogPage.test` `["/studio","편집기"]` 자리표시 | 같은 자리에서 `/studio` → `/projects`(h1 "프로젝트") + 뒤로 가기 = `/catalog`(replace 검증) | SPEC은 "줄 삭제"지만 브리프가 삭제를 금지 → 리다이렉트 단언으로 교체. `replace`를 빼면 FAIL 실측(서브에이전트) |
| 7 | `ProfilePage.test` P-AC-03 "프로필 0" | `/profile` → `/projects`(replace) + J-S02 안내 문장 · "비교 보드로" · "카탈로그에서 고르기" · `role=alert` 없음 · 뒤로 가기 | 문장은 J-S02로 바뀜(12.1: "빈 상태 문장은 J-S02가 잇는다") |
| 8 | `ProfilePage.test` P-AC-03 "목록" | `/projects` 줄: h2 "모던 카페 브랜드 프로젝트" · "프로필 v2" · `<time datetime>` · "프로필 보기" → `/profile/profile-1` | 기준 레퍼런스 제목·최신 버전·시각·열기 링크 그대로. `renderApp`에 같은 store의 프로젝트 저장소를 넘기는 인자 추가. 인자를 빼면 FAIL(Red-Green 확인) |
| — | 재확정 호출(`createProfileVersion`) 32곳 · `CompareBoardPage.test` 호출 인자 단언 | `"current"` 추가 | 12.4 표 5행 그대로. 첫 확정 단언·`/profile/profile-1` 경로 단언 불변 |
| — | `memoryCompareBoardRepository.test` AC-25 `confirmed` 전체 모양 | `projectId`·`projectName` 추가(기대 객체 확장) | 더 엄격해짐 |
| — | `ProfileCandidates.test` P-AC-29 "B안으로 편집 시작 → /studio" | **미처리 — 실패 1건으로 남음.** 12.4 표에 없음(0단계 `/studio` 리다이렉트가 깸, 12.3 → `/studio/:projectId`). 고치려면 `ProfilePage` 청크 변경 → 중지 조건 | — |

## 4. 검증 (fresh, `app/`, 로그 `logs/`)
| 명령 | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | exit 0 | `r1-typecheck.txt` |
| `npm run lint` | exit 0 | `r1-lint.txt` |
| `npx vitest run` (전체 1회) | **1 failed / 1226 passed (1227)**, exit 1 — 실패 = P-AC-29(3절 마지막 줄) | `r1-vitest.txt` |
| `npm run build` | exit 0 (예산 100/125 안 — 여유 게이트는 `/profile` 불합격) | `r1-final-build.txt` |
| Codex `review --scope branch --base ffb0063` | 1차 실패 — Codex 사용량 한도("try again at 3:26 PM") | `codex-r1-attempt1.txt` |

- 127.0.0.1:4337 실제 클릭·캡처: 6절.

## 5. D3 (390 헤더 Tab 순서) — 결정 필요
- 서브에이전트 실측(ego-browser): <768에서 nav `order-last`를 빼고 3행(로고 / 주 메뉴 / 새 프로젝트·아바타)으로 → DOM 순서 = 보이는 순서 = Tab 순서. 1280·768은 좌표 불변(높이 52). **390 헤더 높이 87 → 131px(+44)**. 공통 89.32 → 89.32, `/catalog` −0.01.
- 2행 불가 이유: 390 가용 폭 358 < 메뉴 251 + 간격 + 버튼 104.
- 목업과 다르게 한 곳(ADR-003): <768 헤더 2행 → 3행 — DOM 순서 = 보이는 순서(QA D3, WCAG 2.4.3). 받아들이지 않으면 `git revert 67e5ac2` 한 번.

## 6. 브라우저 (127.0.0.1:4337)
(아래 R8 결과 참조 — 이 절은 실행 뒤 갱신)

## 7. BLOCKED · 미검증
- **1단계 화면 연결 — BLOCKED(중지 조건)**: S-B9 라디오(J-S09·J-S10·J-S11 화면), 프로필 "프로젝트: <이름>" 링크, "편집 시작" → `/studio/:projectId`, `/studio/:projectId` 셸의 실데이터 확인. 저장소 쪽은 준비됨(`ConfirmedRef.projectName` · `ProfileSeries.project` · `createProfileVersion(…, "new")`).
- **`startDoc` — BLOCKED(Q-17)**: 엔진 `createDocFromCandidate(plan, profileVersion, start: DocStart)` 세 번째 필수 인자가 Q-17 미승인 계약(`docs/qa/post-merge/REPORT.md` 63행) + `engine/engineImportGuard.test.ts`가 engine 밖 import를 막는다(L1). 메모리 구현은 문서 없음(E-S03)만 돌려준다.
- J-AC-07 ③ 한계: 이 저장소에서는 "new" = `expectedLatest` 0이라 대상 성분이 없어도 키가 달라진다 → 테스트는 "키에 대상이 들어 있음"을 따로 증명하지 못한다(동작은 맞음).
- 이름 바꾸기 화면(J-AC-08) · J-AC-10(5폭) · Codex 검증: 4절·6절 참조.

## 8. 결정이 필요한 것 (Jarvis·영환님 — 에이전트가 정하지 않음)
1. **`/profile` 진입 직후 여유 확보**: (a) `memoryStudio`(보드·프로필·생성 메모리 구현 묶음) 일부를 조작 뒤로 옮기는 별도 과제(`compare-headroom-c8`와 같은 방식, `/profile` 대상) · (b) ADR-004 예산 판단. 1단계 전체에는 R1 +0.12에 화면 연결 +0.05~0.10(L3)이 더해지므로 **약 0.2~0.25 확보**가 필요하다. 로더 공통 이동은 실측상 효과 0(1절).
2. D3 3행 헤더 유지 여부(5절).
3. P-AC-29 테스트는 편집 시작 연결(12.3)과 함께 고친다 — 1의 결정 뒤.
4. `startDoc`·Q-17 승인 여부(편집 시작의 문서 생성).

---

# (이전) 0단계 1차 보고 — 기록 보존

# EDITOR-A1-BETA — REPORT (0단계 번들 게이트 불합격 · 중지)

**결론: 0단계 불합격 — `/compare` 첫 화면 여유 0.15KB(멈춤선 0.3 미만).** 브리프대로 예산·분류는 바꾸지 않았고, 실측 상태를 커밋한 뒤 중지했다. 1단계(store·라우트 완성·GNB 테스트·프로필 링크·편집 시작)는 시작하지 않았다.

- 기준: main `5562dc2` + 브리프 `567e3ea` · 실측 커밋 `6c5f0bc` · 브랜치 `k002bill2/editor-a1-beta` (push·병합 없음)
- 근거 수준: 수치 = L1(`npm run build` → `scripts/check-bundle-size.mjs`, gzip KB, 로그 `logs/`) · 변경별 분해 = L2(파일 하나씩 되돌려 다시 빌드한 차이 — gzip은 더해지지 않아 근사)

## 1. 판정표 (첫 화면 / 진입 직후, 예산 100 / 125, 멈춤선 여유 0.3)

| 시나리오 | 기준 `567e3ea` | 0단계 `6c5f0bc` | 차이 | 여유 | 판정 |
|---|---|---|---|---|---|
| **공통 JS** | 89.13 | 89.33 | **+0.20** | — | 순증가 ≤ 0 원칙(10.1) 위반 |
| `/catalog` | 99.43 / 101.82 | 99.63 / 102.02 | +0.20 / +0.20 | 0.37 / 22.98 | 통과(아슬) |
| `/references/:id` | 96.78 / 99.17 | 96.98 / 99.36 | +0.20 / +0.19 | 3.02 / 25.64 | 통과 |
| **`/compare`** · (조정 있음) | 99.66 / 120.57 | **99.85** / 120.83 | +0.19 / +0.26 | **0.15** / 4.17 | **불합격** |
| `/profile` | 99.54 / 124.67 | 99.37 / 124.57 | −0.17 / −0.10 | 0.63 / 0.43 | 통과(S-B10 덕) |
| `/projects` (신규) | — | 93.64 / 106.18 | — | 6.36 / 18.82 | 통과(자리 구현) |
| `/studio/:projectId` (신규) | 89.57 / 91.96 (자리표시) | 90.71 / 103.43 | — | 9.29 / 21.57 | 통과(자리 구현) |

- `npm run build` exit 0은 **예산 100/125 통과**라는 뜻일 뿐, 브리프의 **여유 ≥ 0.3 게이트**와는 다른 판정이다.
- `/projects`·`/studio/:projectId`는 1단계 구현 전 자리(목록 빔 · E-S02/E-S03 셸)라 최종 크기가 아니다.
- 로그: `logs/baseline-build.txt`(기준) · `logs/step0a-build.txt`(S-B10 전) · `logs/step0-final-build.txt`(최종, 커밋 상태).

## 2. 공통 변경별 분해 (L2 — 파일 하나를 기준으로 되돌려 다시 빌드)

| 변경 | 실측 공통 증감 | SPEC 10.4 추정 | 비고 |
|---|---|---|---|
| S-B1① `routes.tsx` lazy 2 + `Navigate` 2 − 상쇄 1순위(`PlaceholderPage` lazy 제거) | **≈ +0.11** (나머지로 계산) | +0.02~0.04 | 추정의 약 3배. 가장 큰 개선 여지 — lazy 청크마다 preload 의존 목록이 엔트리에 붙는다 |
| S-B1② `AppHeader` 목적지 2 + "프로젝트" 현재 표시 − 상쇄 2순위(`Button`+`useNavigate` → 버튼 모양 `Link`) | +0.05 | +0.00~0.04 | `Button`은 `RouteErrorBoundary`가 공통에서 계속 쓴다 → 링크 클래스 문자열이 순증 |
| S-B2 `AppLayout` 집중 모드 분기 | +0.02 | +0.01~0.02 | 추정대로 |
| S-B3 로더 핸들(`ProfileRepositoryProvider`에 `projects` 1개 · `main.tsx` 1줄) | +0.02 | +0.01~0.03 | 추정대로. **단, `memoryStudio`의 `projects` 로더(dynamic import 1개)가 `/compare`·`/profile` 진입 직후에 +0.05~0.06 더 붙는다** — SPEC 추정에 없던 비용 |
| **합계** | **+0.20** | +0.04~0.14 | 상한 초과 |

- S-B10(`/profile` 목록 분기·`ProfileList` import 제거): `/profile` 첫 화면 −0.35 · 진입 직후 −0.37(S-B10 전 99.72 / 124.94 → 99.37 / 124.57). 공통 영향 0.

## 3. S-B9 (보드 확정 대상) — 미실측
(a)에서 이미 중지 조건을 충족해 UI 스파이크를 만들지 않았다. 결과를 바꾸지 못하는 이유:
- 공통 증가가 0이라 해도 `/compare` 첫 화면 여유는 0.34다. S-B9 라디오 첫 화면안(L3 +0.10~0.20)을 더하면 0.3 아래로 내려간다.
- 대체안 1(조작 뒤 청크 + 캡션 한 줄, L3 +0.03~0.07)은 J-S10·J-AC-05 문구 개정이 필요하다. 브리프상 그 자체로 중지·보고 조건이다.

## 4. 커밋 상태의 코드 (측정용 — 병합 대상 아님)
- 공통: `app/routes.tsx`(`/projects`·`/studio/:projectId` lazy, `/profile`·`/studio` → `/projects` `Navigate replace`, `PlaceholderPage` lazy 제거) · `AppHeader.tsx`("프로젝트" → `/projects`, `aria-current` = `/projects`·`/profile/*` · "새 프로젝트" = `/compare?new=1` 버튼 모양 링크) · `AppLayout.tsx`(`/studio/*`에서 헤더 없음) · `ProfileRepositoryContext.tsx`·`AppProviders.tsx`·`main.tsx`(`projects` 로더 핸들).
- 라우트 청크: `pages/ProjectsRoute.tsx`(a1-α `ProjectsPage` 연결 · 제목 "프로젝트") · `pages/StudioPage.tsx`(E-S01~E-S04 셸) · `features/projects/useProjectRepository.ts`.
- `data/memoryStudio.ts` `projects` 로더 + `data/memoryProjectRepository.ts`(**자리 구현**: 목록 빔, 쓰기 `NOT_FOUND` — store 프로젝트 레코드는 1단계).
- S-B10: `ProfilePage`의 목록 분기 제거. `ProfileList.tsx`·`useProfileList.ts` 파일은 남겨 둠(미사용 — 12.4 처리와 함께 1단계에서 정리).
- `scripts/check-bundle-size.mjs`: S-B11 시나리오 `/projects`·`/studio/:projectId` 추가, `/studio (자리표시)` 제거. **예산 상수·분류 규칙은 바꾸지 않음.**
- `test/renderApp.tsx`: `projects` 로더 주입 · 새 라우트 모듈 선로드 · `PlaceholderPage` 선로드 제거.

## 5. 검증 (fresh 실행, app/)
| 명령 | 결과 | 로그 |
|---|---|---|
| `npm run build` (기준 `567e3ea`) | exit 0 | `logs/baseline-build.txt` |
| `npm run typecheck` | exit 0 | `logs/step0-typecheck.txt` |
| `npm run lint` | exit 0 | `logs/step0-lint.txt` |
| `npm run build` (커밋 상태) | exit 0 (예산 100/125 안, 여유 게이트는 불합격) | `logs/step0-final-build.txt` |
| `npx vitest run` 12.4 대상 + ProjectsPage + `src/test` 가드 | **8 failed / 142 passed**, exit 1 | `logs/step0-test-12.4.txt` |

- 실패 8건은 모두 SPEC 12.4가 예상한 "깨질 테스트"다(처리는 1단계 범위라 미실행): `AppHeader.test` 헤더 구성 5건(버튼 → 링크, `/profile` 리다이렉트) · `CatalogPage.test` "/studio 자리표시" 1건 · `ProfilePage.test` P-AC-03 목록 2건.
- 전체 vitest · 브라우저 실측(127.0.0.1:4337) · 5폭 캡처 · Codex 리뷰: **미실행**. 게이트 불합격으로 중지했고, 커밋은 병합 대상이 아닌 측정 상태다. 서버·백그라운드 프로세스는 띄우지 않았다.

## 6. 결정이 필요한 것 (Jarvis·영환님 — 에이전트가 정하지 않음)
1. **`/compare` 여유 확보 방식**: (a) 상쇄 3순위(BUNDLE-01 C8 · 2a-04b1 FIX3 방식 — 보드 첫 화면 코드 일부를 조작 뒤 청크로)를 별도 과제로 먼저 진행 · (b) S-B9 대체안 1 + J-S10·J-AC-05 문구 개정(Designer 경유) · (c) ADR-004 예산 판단. S-B9까지 넣으려면 (a)가 사실상 필요하다(공통 +0.20과 S-B9 ≥ +0.03을 합쳐 약 0.2 이상 줄여야 함, L3).
2. **routes 비용(+0.11) 줄이기**를 (a)와 함께 볼지 — 두 라우트 모듈의 preload 의존 목록이 원인으로 보이나 원인 분해는 하지 않았다(L3).
3. `memoryStudio` 경유 로더가 `/compare`·`/profile` 진입 직후에 +0.05~0.06을 더한다 — 1단계 store 확장(ConfirmedRef 프로젝트 이름 등)까지 더하면 `/profile` 진입 직후 여유 0.43도 줄어든다.
4. 이 브랜치를 (a) 결정 뒤 이어서 쓸지, 버리고 새로 시작할지.
