# M1-UI-01-FIX REPORT

- 브리프: `docs/06-handoff/M1-UI-01-FIX_DEVELOPER_BRIEF.md` + 이어하기 `M1-UI-01-FIX-R_DEVELOPER_BRIEF.md` · 판단 기준 ADR-003
- 브랜치 `k002bill2/m1-ui-01-fix` (로컬 커밋만, push·원격 없음) · 상세 기록은 `PROGRESS.md`

## 1. 결론
모든 범위 항목(A D04~D06 · B D07·D08·A01~A03 · C 번들 · D 스크롤·경쟁 상태 · B-DET-02)을 완료했습니다. 검증 4종 통과, 초기 JS는 gzip **87.22KB**(예산 90KB)입니다. Codex 리뷰는 2라운드 돌렸고 P2 3건을 모두 반영했습니다. 3라운드는 턴 예산 때문에 돌리지 않았습니다.

## 2. 항목별 완료 여부와 근거
| ID | 결과 | 근거 |
|---|---|---|
| D04 레일 행·그룹 간격 | 완료 (317b192) | 행 32→30, 그룹 138→132 (1280 실측). ADR-003 이후 px 항목은 결함에서 제외됐지만 이미 반영돼 있어 그대로 둠 |
| D05 탭 높이·밑줄 | 완료 (317b192) | 탭 50→48. D04와 같은 처리 |
| D06 한국어 줄바꿈 | 완료 (317b192) | `body`에 `keep-all` + `overflow-wrap:anywhere`. 390 폭 h1이 어절 단위로 줄바꿈되고 가로 넘침 0 |
| D07 트레이 칩 제거 후 포커스 | 완료 (7a46d4b) | 다음 칩 → 이전 칩 → 트레이 영역 순서 |
| D08 카드 링크 포커스 링 | 완료 (7a46d4b) | `--focus-ring` |
| A01 모션 세그먼트 | 완료 (7a46d4b) | roving tabindex, ←→↑↓·Home/End |
| A02 결과 탭 | 완료 (7a46d4b) | tablist, 수동 활성화(URL push라 방향키마다 history가 쌓이지 않게 함). 상세 탭도 같은 컴포넌트라 함께 적용 |
| A03 건너뛰기 링크 | 완료 (7a46d4b) | 첫 Tab "본문으로 건너뛰기" → `#main-content`. 카탈로그에는 "결과로 건너뛰기"도 있음. 브라우저 확인함 |
| C 초기 JS ≤ 90KB | 완료 (1ffd4e8) | 113.51KB → 87.22KB. 선언형 라우터, 라우트 lazy, 픽스처 지연 로드, `CURRENT_USER` 분리. `check-bundle-size.mjs`가 build 안에서 예산 초과 시 실패시킴. 로딩 중에는 "불러오는 중…"(`role=status`) 표시 |
| D 스크롤 명시 제어 | 완료 (d825166, 9f3a229) | 상세 진입·유사 이동 → 맨 위, 필터·탭 → 위치 유지, 뒤로 가기 → 위치 복원. 1280·390 브라우저 실측 |
| D 경쟁 상태 테스트 | 완료 (d825166) | 저장소 응답을 늦춰 id 일치 검사를 지우면 실패하는 테스트로 교체 |
| B-DET-02 유사 이름 말줄임 | 완료 (5dcd61a) | 한 줄 말줄임을 `line-clamp-2`로 바꾸고 링크에 `title`로 전체 이름을 붙임. 30자 이상 이름 픽스처로 테스트. 브라우저에서 1~2줄, 잘림 없음 |

## 3. 변경 파일 (이번 실행: 그룹 C 이후, `app/` 기준)
- 라우팅·레이아웃
  - `src/main.tsx`, `src/app/routes.tsx`
  - `src/app/useRouteScroll.ts`(신규)
  - `src/components/layout/AppLayout.tsx`
  - `LoadingState.tsx`·`RouteErrorBoundary.tsx`(신규)
- 데이터
  - `src/data/deferredReferenceRepository.ts`(신규)
  - `src/data/useThrowToBoundary.ts`(신규)
  - `src/fixtures/currentUser.ts`(신규), `catalogFilters.ts`
- 훅·화면
  - `src/features/catalog/useReferenceList.ts`
  - `src/features/detail/useReferenceDetail.ts`
  - `src/features/compare/useTrayReferences.ts`
  - `src/pages/ReferenceDetailPage.tsx`
  - `src/components/detail/DetailSidebar.tsx`, `src/components/layout/AppHeader.tsx`
- 빌드
  - `scripts/check-bundle-size.mjs`(신규), `package.json`, `vite.config.ts`, `eslint.config.js`
- 테스트
  - `src/test/renderApp.tsx`, `src/test/setup.ts`
  - 신규: `src/app/routeScroll.test.tsx`, `AppLayout.test.tsx`, `RouteErrorBoundary.test.tsx`, `deferredReferenceRepository.test.ts`
  - `ReferenceDetailPage.test.tsx`에 경쟁 상태·긴 이름 테스트 추가
- 그룹 A·B 파일 목록은 PROGRESS.md 참조

## 4. RED/GREEN 요약
- A: textWrap 2건 RED(`normal`) → GREEN. 규칙을 지웠다 되살려 Red-Green 재확인
- B: keyboardA11y 9건 RED → GREEN
- C
  - 분할 전 HEAD를 임시 worktree에서 빌드: `예산 초과: 초기 JS 113.51KB > 90KB` exit=1
  - 로딩 상태(`role=status` 없음)·지연 저장소(모듈 없음) RED → GREEN
- D
  - 스크롤 3건 RED(`2500→0`, `900→0`, `300→1200` 기대 불일치) → GREEN
  - 경쟁 상태는 `loaded.id !== id`를 지우면 FAIL → 되돌리면 14 passed
- B-DET-02: `title` 부재로 RED → GREEN
- Codex 반영분
  - R1 두 건: 스크롤 `0 ≠ 700`, `role=alert` 없음
  - R2 두 건: 카탈로그·상세 모두 `role=alert` 없음
  - 모두 RED → GREEN

## 5. 검증 4종 + 번들 예산 (마지막 커밋 e4f99e3 기준, 새로 실행)
```
typecheck exit=0
lint exit=0
 Test Files  17 passed (17)
      Tests  115 passed (115)
build exit=0
[bundle] 초기 JS (gzip): 87.22KB / 예산 90KB   (Vite 빌드 출력 표기 88.11 kB)
```
- 측정값 차이: Vite 8의 gzip 표기는 네이티브 리포터 값이라 스크립트가 쓰는 Node zlib 레벨 6보다 약 1% 큽니다. 분할 직후에는 스크립트 89.46, Vite 90.35로 통과·실패 판정이 갈렸습니다. 그래서 두 값 모두 예산 안에 들도록 여유를 확보했습니다.
- 벤더 청크 분리와 폰트 preload는 하지 않았습니다. 벤더 청크를 나눠도 초기 합계는 같습니다. woff2는 웨이트당 약 268KB이고 `font-display: swap`을 씁니다. 근거는 PROGRESS에 있습니다.
- 브라우저 확인(ego-browser, `vite preview` 127.0.0.1:4317, 1280·390)
  - 스크롤과 유사 레퍼런스 이름 줄 수는 2절과 같습니다.
  - 건너뛰기 링크 동작을 확인했습니다.
  - 콘솔 exception/error는 0건입니다.
  - 가로 넘침은 0입니다.
  - 스크린샷은 ego `captureScreenshot` 타임아웃(그룹 A와 같은 증상)으로 남기지 못했습니다. 수치로 대신합니다.
- 서버 종료 후 `lsof -iTCP:4317 -iTCP:4318 -sTCP:LISTEN` → 출력 없음(exit 1). 4318은 이번 실행에서 띄우지 않았습니다.

## 6. Codex 결과 (`review --scope branch --base main`)
| 라운드 | 지적 | 처리 |
|---|---|---|
| R1 | [P2] 쿼리만 바뀐 이동은 새 history 항목에 스크롤 위치가 기록되지 않아, 뒤로 가면 맨 위로 감 | 반영 (9f3a229) |
| R1 | [P2] lazy 청크 로드 실패 시 오류 경계가 없어 앱 전체가 빈 화면이 됨 | `RouteErrorBoundary` 추가 — 헤더 유지, 새로고침 제공, 경로가 바뀌면 초기화 (9f3a229) |
| R2 | [P2] 지연 로드 데이터 청크 실패가 훅에서 처리되지 않음 | 거부를 오류 경계로 전달 (e4f99e3) |
| R3 | — | 턴 예산 때문에 미실행. R2 수정분은 Codex가 재검토하지 않았습니다 |

## 7. 목업과 다른 부분 (ADR-003)
- 유사 레퍼런스 이름: 목업은 한 줄 말줄임입니다. 이름을 식별할 수 있도록 2줄까지 보이고 툴팁을 붙였습니다(사용성).
- 로딩·오류 상태: 목업에 없는 상태라 기존 토큰(`ds-body2`, `ds-title1`, DS `Button`)으로 새로 정의했습니다.
- 스크롤 복원 한계: 위치는 메모리에만 기록합니다. 그래서 새로고침 뒤 뒤로 가기는 복원하지 않습니다. 또 복원 중 최대 약 1초 동안은 사용자 스크롤이 목표 위치로 당겨질 수 있습니다.

## 8. 질문
1. TRD 8절의 "초기 JS ≤ 90KB gzip"은 원문상 코드 생성 산출물(export/) 규격입니다. 이 앱에도 계속 예산으로 적용할까요? 현재 여유는 약 2.8KB입니다. 1a-03 이후 화면이 늘면 라우트 lazy만으로 유지해야 합니다.
2. 오류 화면의 복구 방법은 새로고침 하나뿐입니다. "다시 시도"(재조회)를 따로 둘지는 Designer의 상태 정의가 필요합니다(ADR-003 적용 규칙).

## 9. 커밋
| 커밋 | 내용 |
|---|---|
| 317b192 | 그룹 A — D04·D05·D06 |
| 7a46d4b | 그룹 B — D07·D08·A01~A03 |
| 1ffd4e8 | 그룹 C — 초기 JS 86.6KB, 예산 검사 스크립트 |
| d825166 | 그룹 D — 스크롤 제어, 경쟁 상태 테스트 |
| 5dcd61a | B-DET-02 — 유사 이름 2줄, 툴팁 |
| 9f3a229 | Codex R1 반영 |
| e4f99e3 | Codex R2 반영 |
| (이 커밋) | REPORT.md |
