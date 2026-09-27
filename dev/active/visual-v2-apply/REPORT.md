# REPORT — VISUAL-V2-APPLY (기존 화면 v2 밀도·타이포 적용)

- 보고 대상 Jarvis · run_3e572deefb13 · task_001d97efc671(상태는 Jarvis 회수) · 브랜치 `k002bill2/visual-v2-apply` · 기준 main 9bcf0d2 + 브리프 78e745c
- 근거 수준: L1 = 메인이 이번 실행에서 직접 실행·측정·캡처 / L2 = 서브에이전트 보고(메인이 통합 후 테스트 재실행으로 확인한 부분은 L1로 표기)

## 요약
1. 브리프 쓰기 범위 1~6을 실제 코드에 적용했다. 본문·메뉴 16/15 → 14, Button lg·TextField 52/48 → 40, 체크박스 20 → 16(행 최소 24), 카드 제목 17 → 15/600, 비교 선택 버튼 36 → 32. 수치는 4345 실측(L1)이다.
2. 게이트: typecheck 0 · lint 0 · 표적 테스트 21파일 277/277 · build 0. 번들 /compare 99.57KB(여유 0.43), /profile 99.38KB(여유 0.62). 예산은 올리지 않았다.
3. 전체 test suite는 실행하지 않았다(브리프: ui-2a04c 전담). 통합 회수 때 전체 게이트를 기다린다. 독립 QA(VoiceOver·Safari)는 하지 않았다.

## 커밋 (로컬, push 없음)
| SHA | 내용 |
|---|---|
| 12eee17 | 수신·범위 체크포인트 |
| 69289b4 | 묶음1: base.css body3, Button·TextField·Checkbox 밀도, AppHeader 메뉴 body3 + before 캡처·RED/GREEN 로그 |
| d1c8eed | 묶음4 비교: 서브에이전트 6ca4cb1을 cherry-pick |
| 03714d3 | 묶음2·3 카탈로그·상세: 서브에이전트 bbffaf1을 cherry-pick |
| 313c573 | after 캡처·지표·통합 빌드·서버 종료 근거 |
| b2a0a9f | REPORT·PROGRESS·Codex 1라운드 |
| (이 커밋) | 긴 문자열 검증·REPORT 수치 정정 |

## 변경 파일 (app/src, `git diff --name-only 12eee17 HEAD -- app` 19개 = 코드 12 + 테스트 7)
- 토큰·DS
  - `styles/tokens/base.css`: body `font-size: var(--font-size-body3)`, `line-height: var(--line-height-body3)`. 토큰 이름·브랜드는 바꾸지 않았다.
  - `components/ds/Button.tsx`: lg `h-13 px-5.5 text-body1` → `h-10 px-5 text-body3`, lg 아이콘 22 → 20. md(h-10)·sm(h-8)은 그대로다.
  - `components/ds/TextField.tsx`: `h-12` → `h-10`, 입력 글자 `text-body1` → `text-body3`.
  - `components/ds/Checkbox.tsx`: 상자 `size-5` → `size-4`, 체크 svg `size-3.25` → `size-3`, 행 `min-h-6 text-body3`.
- 셸: `components/layout/AppHeader.tsx`는 nav `text-body2` → `text-body3` 한 곳만 바꿨다. 링크·라우트·구조는 그대로다.
- 카탈로그
  - `components/catalog/ReferenceCard.tsx`: 제목 `ds-heading2` → `ds-body2 font-semibold`. `line-clamp-2`·hover·URL은 그대로다.
  - `components/catalog/CatalogHero.tsx`: 추천 받기 `lg` → `md`.
- 상세
  - `pages/ReferenceDetailPage.tsx`: 태그 톤 blue/orange → 앞 둘 violet, 나머지 neutral. 404 링크 `text-primary` → `text-primary-text`.
  - `components/detail/DetailSidebar.tsx`: 행동 묶음에 `lg:mt-auto`를 붙였다. 모바일은 흐름 그대로다.
- 비교
  - `components/compare/ComparisonTable.tsx`: 표 외곽 `rounded-lg border`를 제거했다. 포커스 링과 tabIndex는 유지한다. 행 머리글·값 셀 `p-3` → `px-3.5 py-2.5`.
  - `components/compare/PickButton.tsx`: 테두리를 제거하고 `h-9` → `h-8`. aria-pressed·접근 이름·"선택됨" 글자·원 표시·포커스는 유지한다.
  - `pages/CompareBoardPage.tsx`: xl 패널 `calc(var(--spacing)*90)`(360) → `--spacing(75)`(300). 한 줄만 바꿨다.
- 테스트
  - 신규: `ds/density.test.tsx`(4), `catalog/CatalogHero.test.tsx`(1), `compare/compareBoardV2.test.tsx`(3), `pages/CompareBoardV2.test.tsx`(1)
  - 추가: `AppHeader.test.tsx`(+1), `ReferenceCard.test.tsx`(+1), `ReferenceDetailPage.test.tsx`(+2, 404 단언 강화 1)

## 테스트 증감 (L1: 통합 후 메인이 재실행)
- 새 회귀 테스트 +13건(density 4 · CatalogHero 1 · compareBoardV2 3 · CompareBoardV2 1 · AppHeader 1 · ReferenceCard 1 · ReferenceDetailPage 2) + 기존 404 테스트 강화 1. 삭제 0, 완화 0. 기존 단언을 새 디자인에 맞춰 바꾼 곳 0(모두 추가·강화).
- RED 확인
  - 메인 묶음1: 5 failed(`logs/red-ds.txt`).
  - 카탈로그·상세 서브에이전트: 5 failed / 44(L2).
  - 비교 서브에이전트: 4 failed / 21(L2).
- GREEN
  - `npx vitest run src/components/{catalog,detail,ds,layout} src/pages/{ReferenceDetailPage,CatalogPage,keyboardA11y}.test.tsx src/styles src/test/{noHardcodedStyle,tokenUsage,brandIsolation,tokenContrast}.test.ts` → 21 files, 277 passed(`logs/green-integrated.txt`).
  - `npx vitest run src/components/compare src/pages/CompareBoard src/test/noHardcodedStyle.test.ts src/test/tokenUsage.test.ts` → 12 files, 129 passed.
- 가드(noHardcodedStyle·tokenUsage·brandIsolation·tokenContrast)는 수정하지 않았고 통과했다.

## 빌드 수치 (`npm run build` exit 0, 첫 화면 gzip / 예산 100KB)
| 시점 | /catalog | /references/:id | /compare | /profile |
|---|---|---|---|---|
| baseline(브리프) | — | — | 99.59 / 자동 118.99 | 99.39 / 118.97 |
| 묶음1 뒤 (`build-1-ds.txt`) | 99.36 | 96.70 | 99.60 / 119.00 | 99.40 / 118.98 |
| +비교 (`build-2-compare.txt`) | 99.35 | 96.70 | 99.57 / 118.98 | 99.38 / 118.97 |
| 통합 (`build-3-integrated.txt`) | 99.36 | 96.71 | **99.57 / 118.97** | **99.38 / 118.96** |
- 최소 여유는 /compare 0.43KB(≥0.3 충족)다. 예산·분류는 바꾸지 않았다.

## 캡처·실측 (127.0.0.1:4345 strictPort, ego-browser, 외부 접근 0)
- 캡처 `shots/{before,after}-{catalog,detail,compare,profile}-{1280,390}.png`, 지표 `logs/metrics-{before,after}.json`, 스크립트 `logs/capture.mjs`(before)·`logs/capture-after.mjs`
- 실측 before → after(L1)
  - body·메뉴 글자: 16/15 → 14/14
  - 검색 필드: 48 → 40
  - 버튼 최대 높이(1280): 52 → 40
  - 체크 상자 16, 체크 행 24
  - 카드 제목: 17px/600 → 15px/600
  - 비교 선택 버튼: 36 → 32(선택 뒤 aria-pressed=true, 글자 "선택됨")
- 가로 넘침(scrollWidth−clientWidth): catalog·detail·compare(3개 채움 + 선택 1회)·profile × 1280/768/390/320 전부 0이다.
- 이동: 카탈로그 → 상세(카드 링크) → 뒤로 → 비교 3개 담기 → 비교 보드 → 선택 → 프로필. 4폭 모두 성공했다.
- 시각 검토 1회 결과는 결함 0이다. 그래서 수정 확인 라운드는 쓰지 않았다.
  - 1280 상세: 행동 버튼이 패널 바닥에 있다. 단 before에서도 같은 위치다. 이 fixture는 패널이 미리보기보다 길어 행 높이를 패널이 정하므로, `lg:mt-auto`는 이 데이터에선 시각 변화가 없고 미리보기가 더 길 때만 효과가 있다(단위 테스트로 클래스만 고정).
  - 태그: 앞 둘은 보라, 나머지는 중립 외곽형이다.
  - 비교표: 외곽선이 없고 행 윗선만 남았다. 패널이 좁아진 만큼 열이 넓어졌다.
  - 390 비교: 아코디언과 하단 초안 바가 정상이다.
- 캡처 주의
  - 1280 비교 캡처에서 초안 패널 아래가 잘린 것은 before에도 똑같이 있다. 스티키 패널을 전체 페이지로 캡처해서 생긴 것이라 결함으로 보지 않는다.
  - 390 전체 캡처 중간의 고정 바도 캡처 합성 탓이다.
  - `minButtonH` 20은 before에도 있던 기존 요소다(이번 변경 무관).
- `metrics-after.json`의 `detailActionGap`은 무효 지표다. catalog 페이지의 필터 레일 aside를 잡았고(1280 312), detail에서는 null이다.
- 긴 문자열(L1, `logs/longtext*.mjs`·`longtext*-result.json`): 공백 없는 90자를 주입했다.
  - 카드 제목: 4폭 모두 넘침 0, 2줄에서 잘림(`line-clamp` 2).
  - 체크 행(1280, 필터 레일이 보이는 폭): 줄바꿈되어 높이 110, 행 넘침 0.
  - 상세 h1: 넘침 0.
  - **상세 태그: 넘침 발생**(1280 +483, 320 +545). 원인은 `components/ds/Tag.tsx`의 `whitespace-nowrap`이다. 기준 12eee17부터 있던 코드이고 이번 변경(톤만)과 무관하다. Tag.tsx는 쓰기 범위 밖이라 고치지 않고 보고한다. 실데이터 태그는 짧은 콘셉트 단어라 현재 발현은 0이다.
- profile spot-check: 빈 상태만 확인했다. 넘침 0, 버튼 32. 프로필 채움 상태는 재현하지 않았다.
- 픽셀 완전 일치는 주장하지 않는다. 목업 React 렌더는 외부 자산이 필요해 하지 않았고, 대조는 Designer REPORT의 마크업·토큰 수치 기준이다.

## 의도된 목업 차이 (한 줄씩)
- Button md 40 = lg 40: 목업은 md 38 / lg 40이다. 필드 40 기준으로 추천 받기(md)와 검색창 높이를 맞췄고, md는 기본값이라 전역 파급을 막으려고 바꾸지 않았다. lg와 md는 여백으로만 구분하며 계층은 역전되지 않는다(lg ≥ md ≥ sm, 테스트로 고정).
- TextField 40: 목업은 38이다. 브리프 기준 40을 따랐다.
- 카드 hover는 `hover:text-primary`를 그대로 뒀다. Designer 표에는 primary-hover로 적혀 있지만 브리프는 "기능 불변"이고 링크 색 일괄 교체는 묶음5(프로필 레인) 소관이다.
- PickButton 원은 16px 그대로다. 목업은 18인데 브리프 최소수정 범위 밖이다.
- 상세 패널 최소 높이는 추가하지 않았다. lg 그리드 행 높이로 늘어나므로 `lg:mt-auto`만으로 바닥에 붙는다(CSS 판단 · 테스트 고정. 1280 캡처는 before/after 모두 바닥이라 이 변경의 효과 증거가 아니다).
- Chip(B-4)·비교 필 문구(C-05)·툴바 캡션은 브리프대로 그대로 뒀다.

## DS 변경의 파급 (의도, 목록)
- `size="lg"` 사용처 3곳: CatalogHero(이제 md), DetailSidebar 가져오기, DraftPanel 확정 버튼. 뒤의 둘은 52 → 40이 됐다.
- TextField: FilterRail 없음, CatalogHero 검색, CustomStyleFields. Checkbox: FilterRail.
- body 14 영향: 클래스 없는 글자만. `Icon`은 항상 크기 클래스를 가져 `.ds-icon` 1.5em 파급이 없다.

## 서브에이전트 분할·회수
| 에이전트 | 범위 | 격리 | 결과 |
|---|---|---|---|
| worker A | 카탈로그·상세(범위 4·5) | worktree `worktree-agent-aced0264f65624049` | bbffaf1 → cherry-pick 03714d3. RED 5 → GREEN 44/44(L2), 통합 후 메인 재실행 통과(L1) |
| worker B | 비교(범위 6) | worktree `worktree-agent-a030de691dc38c74f` | 6ca4cb1 → cherry-pick d1c8eed. RED 4 → GREEN 119/119(L2), 통합 후 메인 재실행 129/129(L1) |
- 메인이 한 것: DS·토큰·AppHeader(묶음1), 통합, 빌드 측정, 캡처·실측, 서버 관리, Codex 리뷰.
- 동시 실행 최대는 2다. 워크트리·브랜치는 삭제 금지라 남겨 뒀다(각 워크트리에 untracked `app/node_modules` 심볼릭 링크가 있다).

## 서버
- `npx vite --host 127.0.0.1 --port 4345 --strictPort`: npx PID 84721, listener node PID 84738.
- 자기 PID 2개만 kill했다. 종료 뒤 `lsof -iTCP:4345 -sTCP:LISTEN` exit 1(listener 없음)을 확인했다(`logs/server-shutdown.txt`).

## 실행상 사고 (기록)
- 첫 after 캡처에서 `PHASE` 환경변수가 ego-browser 런타임에 전달되지 않았다. 그래서 스크립트가 before 파일을 after 상태로 덮어썼다.
- 커밋 69289b4의 before 원본으로 복원했다(`metrics-before.json` 16px 16건 확인). after는 phase를 고정한 `capture-after.mjs`로 다시 찍었다.

## Codex 검증
- `codex-companion review --scope branch --base 12eee17` 1라운드를 실행했다. 결과는 아래 "Codex 결과" 절에 적는다.

## 미완료 / 대기
- 범위 밖 발견 1건: `ds/Tag.tsx` `whitespace-nowrap`로 긴 태그가 가로로 넘친다(기존 결함). 수정하려면 DS Tag 쓰기 승인이 필요하다.
- 전체 test suite는 ui-2a04c 전담이다. 통합 회수 때 전체 게이트를 기다린다.
- 독립 QA 대기: VoiceOver·Safari, 터치 실기기, 프로필 채움 상태 DS 회귀.
- 묶음5(프로필·링크 가드)는 ui-2a04c 병합 뒤 별도 레인에서 한다. 이번 범위가 아니다.

## Codex 결과 (1라운드, `logs/codex-review-r1.txt`)
- 판정: "변경된 동작에서 확인된 버그는 없습니다." 지적 0건이므로 추가 라운드는 하지 않는다.
- 한계: Codex 샌드박스에서는 파일 쓰기 제한(EPERM)으로 테스트를 시작하지 못했다. 테스트 근거는 메인 실행 로그다(위 GREEN 절).

## 사용자 결정 반영 (2026-09-27)
1. `ds/Tag.tsx` 긴 문자열 넘침은 이 레인이 아니라 **별도 레인에서 진행**한다. 이 브랜치에서는 Tag.tsx를 바꾸지 않았다.
   - 후속 레인 입력: 재현 스크립트 `logs/longtext-detail.mjs`, 결과 `logs/longtext-detail-result.json`(1280 +483 / 320 +545). 원인은 `whitespace-nowrap`이다. 수정 시 비교 필·라이선스 Tag 등 Tag 사용처 전체에서 회귀를 확인해야 한다.
2. 서브에이전트 워크트리 2개와 브랜치를 **정리**했다.
   - 정리 전 patch-id로 대조했다: bbffaf1 = 03714d3, 6ca4cb1 = d1c8eed(SAME). 내용은 이 브랜치에 보존돼 있다.
   - 심볼릭 링크 `app/node_modules`만 `rm`으로 지우고 `git worktree remove`, `git branch -D worktree-agent-{aced0264f65624049,a030de691dc38c74f}`를 실행했다.
   - 메인 `app/node_modules`는 그대로다.
