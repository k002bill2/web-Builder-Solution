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
