# M1-UI-02 PROGRESS

브리프: `docs/06-handoff/M1-UI-02_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-02` (main에서 분기, 로컬 커밋만)

## 단계 현황
| # | 단계 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(브리프 0절 순서) + `npm ci` | 완료 | — |
| 1 | 폰트 자체 호스팅 (`fonts.test.ts`) | 완료 | 18a0c52 |
| 2 | 색상·디바이스 필터 (`colorFamily.test.ts`, 저장소·카탈로그 테스트) | 완료 | 1f9eb6d |
| 3 | 1a-02 레퍼런스 상세 (`ReferenceDetailPage.test.tsx`, 저장소 상세·유사 테스트) | 완료 | 08d8fa0 |
| 4 | 검증 4종 + Codex 리뷰 + REPORT.md | 완료 | (보고서 커밋) |

## 작업 1 — 폰트 자체 호스팅

### 결정
1. **서브셋 static woff2 4개** (`pretendard@1.3.9` `dist/web/static/woff2-subset`, KS X 1001 한글 2,350자 + 라틴·기호).
   번들 크기 근거(4웨이트 합계):
   | 형식 | 합계 | 파일 수 | 비고 |
   |---|---|---|---|
   | **subset (채택)** | **1.07MB** | 4 | 브라우저는 실제 쓰는 웨이트만 받는다 |
   | variable | 2.06MB | 1 | 단일 face라 웨이트별 @font-face 불가 |
   | static 전체 | 3.12MB | 4 | |
   | dynamic-subset | 웨이트당 92조각 | 368 | unicode-range CSS만 약 230KB |
   | Pretendard JP static | 8.29MB | 4 | 서브셋 형식 없음 |
   - 커버리지 실측: `subset_glyphs.txt`(3,729자)가 `app/src`·`index.html`의 한글 음절 374자를 전부 포함(누락 0). 서브셋 밖 글자는 글자 단위로 다음 시스템 폴백 글꼴이 그린다.
2. **Pretendard JP 제외.** 같은 서브셋 형식이 없고, 전체 static은 웨이트당 약 2MB(합계 8.3MB)다. 한국어 제품이라 가나·한자 글리프가 필요 없다. `--font-sans`에서도 `"Pretendard JP"`를 뺐다 — 남기면 로컬 설치본이 잡혀 404가 가려졌던 문제가 되살아난다. "폴백 체인 유지"는 시스템 폴백(-apple-system … sans-serif) 유지로 해석했다.
3. **`local()` 미사용.** 이 PC에 Pretendard가 설치돼 있어 번들 파일이 깨져도 정상으로 보인다(원래 404가 가려진 방식). 테스트로 고정.
4. 파일 위치 `app/src/assets/fonts/`, fonts.css 기준 상대 url. Vite가 해시 파일명으로 `dist/assets`에 내보낸다.
5. 라이선스: 저장소 루트 `LICENSES.md`에 출처·저작권·OFL-1.1 원문. fonts.css에는 URL이 든 OFL 헤더를 넣지 않는다(원격 URL 0건 테스트).

### RED
```
 × 원격 URL(http·https)을 참조하지 않는다
AssertionError: expected [ 'https://', 'https://', …(6) ] to deeply equal []
 × @font-face가 참조하는 파일은 저장소에 실제로 존재하는 woff2다
AssertionError: https://cdn.jsdelivr.net/gh/orioncactus/pretendard-jp@v1.3.9/…/PretendardJP-Regular.woff2 없음
 × --font-sans의 첫 글꼴은 자체 호스팅한 Pretendard다
AssertionError: expected '"Pretendard JP"' to be '"Pretendard"'
      Tests  3 failed | 2 passed (5)
```
- 구현 직후 `local()` 검사가 fonts.css 주석 문구("local()은 쓰지 않는다")에 걸려 실패 → 테스트가 주석을 제거한 선언만 보도록 수정(원격 URL 검사는 주석 포함 원문 유지).

### GREEN
```
 ✓ 원격 URL(http·https)을 참조하지 않는다
 ✓ Pretendard 400·500·600·700 웨이트 @font-face가 모두 있다
 ✓ @font-face가 참조하는 파일은 저장소에 실제로 존재하는 woff2다
 ✓ 로컬 설치 폰트(local())로 번들 파일 누락을 가리지 않는다
 ✓ --font-sans의 첫 글꼴은 자체 호스팅한 Pretendard다
      Tests  11 passed (11)   (styles 전체)
```

### 수용 확인
- 빌드 산출물: `dist/assets/Pretendard-{Regular,Medium,SemiBold,Bold}.subset-<hash>.woff2` 4개(267~271kB), CSS의 `url(/assets/Pretendard-…woff2)` 4건이 이 파일을 가리킴.
- 브라우저(ego-browser, `vite preview` :4719, 캐시 비활성):
  - `document.fonts` → Pretendard 400·500·600·700 모두 `loaded`
  - 네트워크 응답: 문서·JS·CSS·woff2 4건 전부 200/304, **4xx 0건**
  - 콘솔 error·warning·예외 **0건**
  - `body` font-family 첫 항목 `Pretendard`
- 검증 4종: typecheck 0 · lint 0 · test 63 passed (9 files) · build 0

## 작업 2 — 색상·디바이스 필터 (FR-CAT-01 보완)

### 결정
1. **색 계열은 저장하지 않고 계산**한다: `domain/colorFamily.ts` — `colorPalette.primary`(목업 c1) → HSL → 계열. 경계값은 `COLOR_FAMILY_RULES` 상수 + 테스트로 고정.
   | 계열(id) | 라벨 | 규칙 |
   |---|---|---|
   | neutral | 무채색 | 채도 < 15% 또는 명도 < 8% 또는 명도 > 95% (먼저 판정) |
   | warm | 따뜻한 계열 | 색상각 [0°, 70°) ∪ [330°, 360°) |
   | green | 그린 계열 | [70°, 170°) |
   | cool | 차가운 계열 | [170°, 330°) |
   - 픽스처 결과: A 26°·F 34° → 따뜻한, B(채도 0)·E(채도 5%) → 무채색, C 216° → 차가운, **D 167°(#00A884) → 그린**(경계 170° 바로 아래라 경계 양쪽 값을 테스트).
   - 명도 극단을 무채색으로 둔 이유: `#1a0000` 같은 아주 어두운 색은 HSL 채도가 100%로 나오지만 눈에는 검정이다.
   - 라벨을 "따뜻한 계열"로 한 이유: 콘셉트 그룹의 "따뜻한" 체크박스와 접근성 이름이 겹치지 않게.
2. **디바이스**: `DesignReference.devices: DeviceId[]` (`desktop|mobile|responsive`). 픽스처 값은 임시값(주석). 기존 `responsive: true`와 모순되지 않게 6개 모두 `responsive`를 넣고 desktop·mobile로 차이를 둠 — A·C 데스크톱+모바일, B·D·F 모바일, E 데스크톱. `responsive` 불리언과 필드가 겹친다(질문으로 남김).
3. **레일 배치**: 기존 `FILTER_GROUPS`는 모션 강도 앞에 렌더되므로 `TRAILING_FILTER_GROUPS`(색상·디바이스)를 따로 두고 모션 강도 뒤에 같은 `fieldset + Checkbox` 그룹으로 렌더(`CheckboxGroup`으로 추출, 간격 `gap-5.5` 공유). URL 파싱·직렬화는 `ALL_FILTER_GROUPS` 기준 — 키 `color`, `device`, 그룹 안 OR·쉼표 구분·모르는 값 버림은 기존과 동일.
4. 칩 색 견본은 넣지 않음(브리프 "가능" 항목). 기존 `Checkbox`가 문자열 라벨만 받아 DS 컴포넌트를 바꿔야 하므로 범위를 넓히지 않았다.

### RED
```
 FAIL  src/domain/colorFamily.test.ts
Error: Failed to resolve import "./colorFamily" from "src/domain/colorFamily.test.ts". Does the file exist?
 × 색상 계열 필터는 대표색(c1) 계열로 거른다 (FR-CAT-01)
AssertionError: expected [ 'A', 'B', 'C', 'D', 'E', 'F' ] to deeply equal [ 'A', 'F' ]
 × 디바이스 필터는 지원 디바이스 중 하나라도 겹치면 통과한다 (FR-CAT-01)
AssertionError: expected [ 'A', 'B', 'C', 'D', 'E', 'F' ] to deeply equal [ 'A', 'C', 'E' ]
 × 색상·디바이스 그룹은 레일 맨 아래, 모션 강도 다음에 있다
AssertionError: expected [ '콘텐츠 목적', '라이선스', '모션 강도' ] to deeply equal [ '모션 강도', '색상', '디바이스' ]
 × 색상 계열·디바이스를 고르면 카드가 줄고 URL 쿼리에 남는다 (FR-CAT-01)
TestingLibraryElementError: Unable to find an accessible element with the role "checkbox" and name "따뜻한 계열"
 × 새로고침(초기 URL)하면 색상·디바이스 필터를 복원한다
AssertionError: expected [ <article …(2)>…(2)</article>, …(5) ] to have a length of 2 but got 6
      Tests  5 failed | 28 passed (33)
```

### GREEN
```
 ✓ colorFamily: 경계값 상수 고정 / hex→HSL / 잘못된 hex 거부 / 픽스처 6개 분류 / 채도 15% 경계 / 명도 8%·95% 경계 / 색상각 70°·170°·330° 경계   (7)
 ✓ 저장소: 색상 계열 필터 / 디바이스 필터 (그룹 안 OR, 다른 그룹과 AND)
 ✓ 카탈로그: 레일 순서(모션 강도 → 색상 → 디바이스) / 체크 → 카드 수·URL(color=warm, device=desktop) / 초기 URL 복원 + 초기화
 ✓ 기존 '알 수 없는 쿼리 값은 무시한다'에 color=pink&device=tv 추가
      Tests  75 passed (75)
```
- 전체 첫 실행에서 `필터 없이 진입하면 6개` 테스트가 5초 타임아웃(6.7초, 콜드 트랜스폼)으로 1회 실패 → 바로 3회 재실행 모두 75 passed(3.4~3.9초). 재현되지 않는 콜드 스타트 지연으로 기록.

### 확인
- 브라우저(1280, `/catalog?color=warm&device=desktop`): 레일 순서 필터·타깃·콘셉트·레이아웃·콘텐츠 목적·라이선스·모션 강도·**색상·디바이스**, 그룹 간격 동일, 카드 1개(A), 체크 상태 복원. scrollWidth 1265(스크롤바 15).

## 작업 3 — 1a-02 레퍼런스 상세 (`/references/:id`, FR-CAT-03)

### 구조
- 도메인 `domain/referenceDetail.ts`: `ReferenceDetail`(섹션·팔레트 5역할·본문 대비·타이포·간격·모션·모바일 구조·측정 도구·유사 id 목록), `SimilarGroup`, `SIMILAR_KINDS`, `SIMILAR_LIMIT = 6`.
- 픽스처 `fixtures/referenceDetails.ts`: ref-a는 목업 값(126~183행 + renderVals `refSections`·`mobileFlow`·`similarGroups`·`palette`), **ref-b~f는 임시값**(비교 보드 rowDefs의 폰트·섹션 수·모바일 구조를 따른 것 외에는 지어낸 값, 주석 명시).
- 저장소: `get` → **`getById`로 개명**(같은 일을 하는 메서드를 둘 두지 않음, 호출처 `useTrayReferences`·테스트 수정), `getDetail(id)`, `getSimilar(id)` 추가. `createMemoryReferenceRepository(records, details = {})`.
  - `getSimilar`: 큐레이션 id 목록 → 중복 제거 → 자기 자신 제외 → 비노출·없는 id 제외 → 그룹당 6개. 항상 3그룹(업종·콘셉트·레이아웃) 순서. 원본 id가 비노출·없음이면 3그룹 모두 빈 배열, `getDetail`은 undefined.
- 화면: `pages/ReferenceDetailPage.tsx` + `components/detail/{ReferencePreview,DetailPanels,DetailSidebar}.tsx`, 데이터 훅 `features/detail/useReferenceDetail.ts`, 탭 URL 규칙 `features/detail/detailTabs.ts`.
- 공유 정리(동작 불변): 카드의 `LICENSE_TONE`·`formatDate` → `components/catalog/referenceDisplay.ts`, 카탈로그의 7번째 추가 안내 문구 → `COMPARE_LIMIT_NOTICE`(compareTray.ts), `PURPOSE_LABELS` 추가.
- DS 확장: `Tag`에 `variant="outline"`(번들 규격: 투명 배경 + currentColor 1px 테두리), `Icon`에 `chevron-left`(design/ 원본 복사).
- GNB: `/references/*`에서 '카탈로그'를 현재 위치로 표시(목업 1a-02 GNB).

### 결정
1. **유사 추천은 큐레이션 id 목록 + 저장소 규칙.** 픽스처 6개는 visualTags가 서로 하나도 겹치지 않고 layoutType도 전부 달라 동등 비교 규칙이면 콘셉트·레이아웃 그룹이 모든 레퍼런스에서 빈다. 목업 `similarGroups`도 규칙이 아니라 큐레이션(A '유사 업종'에 뷰티·피트니스)이다. 계산 규칙은 백엔드(T-API-CAT-04) 몫으로 남긴다.
2. **탭은 패널 전환**(`role=tabpanel`). 목업 정적 그림은 '섹션 구성' 탭에서 섹션·토큰·모바일 블록이 모두 보이지만, 탭이 URL로 유지되는 전환 UI라 선택 탭의 패널만 보여준다. 탭 상태는 쿼리 `?tab=tokens|mobile|scores`(기본 sections 생략, 모르는 값은 sections), 전환은 `replace`(뒤로 가기가 탭을 되감지 않음).
3. **로딩·재조회**: `{id, …}` 상태로 응답이 현재 id 것일 때만 사용 → 로드 전 404 깜빡임 없음, 유사 항목으로 `:id`만 바뀌어도 이전 레퍼런스가 남지 않는다. 뷰는 `key={id}`로 안내 문구 등을 초기화.
4. **404**: 없는 id·비노출(external_observed) id 모두 "레퍼런스를 찾을 수 없습니다" + 카탈로그 링크. 레퍼런스는 있는데 상세 데이터가 없는 경우도 404로 둔다(노출 6개 모두 상세 보유를 테스트로 고정).
5. **저장·비교**: 1a-01과 같은 `SavedReferencesContext`·`CompareTrayContext`. 상세에는 트레이 바가 없어 7번째 추가 거부 안내를 점수 카드 안 `role=status`로 표시. "템플릿으로 가져오기"는 같은 자리에 다음 단계 안내만.
6. **점수 색**: Lighthouse 구간(90↑ positive, 50↑ cautionary, 그 아래 negative). 목업 A(96·92)는 초록 그대로.
7. 목업 스타일 → 토큰: 340px 열 `--spacing(85)`, 미리보기 모서리 8px `rounded-sm`, 막대 3px `rounded-[--spacing(0.75)]`, 제목 22px `ds-title2`, 점수 24px `text-title1`.

### RED
```
     × external_observed 레코드는 목록·단건 조회 어디에도 나오지 않는다 (FR-CAT-04)   TypeError: withExternal.getById is not a function
     × id로 단건을 조회한다                                                           TypeError: repo.getById is not a function
     × 노출 레퍼런스는 모두 상세 데이터(섹션·팔레트·모바일 구조·유사 3그룹)를 가진다      TypeError: repo.getDetail is not a function
     × A의 유사 레퍼런스는 목업 3그룹(업종·콘셉트·레이아웃) 순서이고 자기 자신은 빠진다  TypeError: repo.getSimilar is not a function
     × 그룹마다 최대 6개, 자기 자신·중복·비노출·없는 id는 제외한다
     × 없는 id·비노출 id는 상세가 없고 유사 그룹도 비어 있다
     × 필수 영역을 모두 보여준다: 브레드크럼·제목·라이선스·메타·태그·미리보기·탭·점수·액션·유사 레퍼런스
                                                   TestingLibraryElementError: Unable to find role="heading" and name "모던 카페 브랜드"
     × 토큰·모바일·점수 이력 탭을 전환하고 URL 쿼리(tab)에 남긴다
     × 새로고침(초기 URL)하면 선택한 탭을 복원하고, 모르는 탭 값은 기본 탭으로 둔다
     × 모르는 탭 값은 섹션 구성 탭으로 연다
     × 없는 id는 404 안내와 카탈로그 링크를 보여준다    Unable to find role="heading" and name "레퍼런스를 찾을 수 없습니다"
     × 비노출(external_observed) 레퍼런스도 404로 처리한다 (FR-CAT-04)
     × 유사 레퍼런스를 누르면 해당 상세로 바뀌고 이전 레퍼런스 내용이 남지 않는다
     × 템플릿으로 가져오기는 다음 단계 안내만 한다
     × 카탈로그 카드 이름을 누르면 상세로 이동한다      Unable to find role="heading" and name "동네 치과 클리닉"
     × 상세에서 저장·비교 추가한 상태가 카탈로그 카드와 트레이에 그대로 보인다
     × 카탈로그에서 담은 비교 상태가 상세에 보이고, 상세에서 빼면 트레이에서도 빠진다
     × 트레이가 6개로 차 있으면 상세에서의 7번째 비교 추가를 막고 안내한다
     × 상세 화면에서는 GNB의 카탈로그를 현재 위치로 표시한다   expect(element).toHaveAttribute("aria-current", "page")
 Test Files  2 failed | 9 passed (11)
      Tests  19 failed | 72 passed (91)
```
- 의도된 테스트 변경: `CatalogPage.test.tsx` 라우팅 표에서 `/references/ref-a는 자리표시 페이지` 행 제거(이제 실제 화면).
- (RED 시점엔 타입·픽스처만 만들고 저장소·화면은 손대지 않음)

### GREEN
```
 Test Files  11 passed (11)
      Tests  91 passed (91)
```
변이 검사(규칙이 테스트에 실제로 걸리는지):
- `getSimilar`에서 자기 제외 필터 삭제 → 3 failed(A 3그룹, 6개 상한 규칙, 상세 필수 영역) → 복원 후 통과
- 6개 상한(`slice`) 삭제 → `그룹마다 최대 6개…` 1 failed → 복원 후 통과

### 확인
- 브라우저(ego-browser, `vite preview`):
  | 폭 | scrollWidth / innerWidth | 넘치는 요소 | 레이아웃 |
  |---|---|---|---|
  | 1280 | 1280 / 1280 | 0 | 본문 852 + 사이드 340, 사이드 sticky |
  | 390 | 375 / 390 | 0 | 1열 스택(본문 → 점수 카드 → 유사), 섹션·모바일 칩 줄바꿈 |
- 카탈로그 카드 '모던 카페 브랜드' 클릭 → `/references/ref-a`, '토큰' 탭 → `?tab=tokens`, 콘솔 error·warning 0, 4xx 0.
- 폰트 서브셋 커버리지 재확인: 제품 코드 한글 음절 392자 누락 0.
- typecheck 0 · lint 0 · build 0

## 마무리 — 검증 4종 + Codex
- fresh: typecheck 0 · lint 0 · test 91 passed (11 files) · build 0. `git diff main -- design/` 0줄.
- Codex 1라운드(`review --scope branch --base main`): "No actionable correctness issues were found in the diff." (Codex 샌드박스가 읽기 전용이라 vitest는 Codex 쪽에서 미실행) → 지적 0건으로 종료.
- 최종 보고: `REPORT.md`.
