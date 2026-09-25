# M1-UI-01 PROGRESS

브리프: `docs/06-handoff/M1-UI-01_DEVELOPER_BRIEF.md` · 브랜치 `m1-ui-01` (로컬 커밋만)

## 단계 현황
| # | 단계 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(브리프 1절 순서) + `app/` 스캐폴드 | 완료 | afa7794 |
| 1 | 토큰 + 브랜드 분리 (`tokens.test.ts`, `brandIsolation.test.ts`) | 완료 | 27fc0d0 |
| 2 | 데이터 계층 (`referenceRepository.test.ts`) | 완료 | a4cb632 |
| 3 | 비교 트레이 (`compareTray.test.ts`) | 완료 | 20f4254 |
| 4 | DS 컴포넌트 + 카드 (`ReferenceCard.test.tsx`, `noHardcodedStyle.test.ts`) | 완료 | afd386f |
| 5 | 카탈로그 화면 + 라우팅 (`CatalogPage.test.tsx`) | 완료 | 9f0af08 |
| 6 | 검증 4종 + 390 폭 확인 + Codex 리뷰 | 진행 중 | (이 커밋: 브라우저 확인·버튼 수정) |

## 0단계 — 스캐폴드
- package.json 직접 작성(대화형 create 미사용), 버전 exact 고정.
  - react/react-dom 19.3.0, react-router 8.4.0, vite 8.3.1, tailwindcss·@tailwindcss/vite 4.3.3, vitest 5.0.1, jsdom 30.1.1
  - typescript **6.0.3** — 최신 7.0.2는 typescript-eslint 8.70.1 peer 범위(`<6.1.0`) 밖이라 제외.
- tsconfig 단일 파일(`include: src, vite.config.ts, eslint.config.js`). `typecheck = tsc --noEmit -p tsconfig.json`.
  - 무동작 함정 확인: 일부러 넣은 `const x: number = "s"` → `TS2322` 검출, 제거 후 통과.
- 빈 스캐폴드에서 typecheck·lint·build 통과.

## 설계 결정 (ADR-002 × 브리프 테스트 충돌 해소)
1. 테스트 1의 `--primary: #3366ff`와 ADR-002의 "`--primary`는 `--brand-*` 참조"가 충돌한다.
   → 토큰 파일 전체에서 `var()` 체인을 따라가는 resolver로 **해석값**을 검증한다(light `#3366ff`, dark `#5b84ff`).
2. 원본 `--brand-inverse*`가 colors.css에 있어 테스트 7("`--brand-*` 정의는 brand.css에만")에 걸린다. 트레이·secondary 버튼이 쓰는 중립 표면이므로 의미 토큰 `--surface-inverse`·`--surface-inverse-hover`·`--on-surface-inverse`로 이름을 바꾼다.
3. `--focus-ring`, `--primary-hover/pressed/container`의 값은 brand.css의 `--brand-*`로 옮긴다. `--apfs-*`는 삭제한다. `.apfs-*` 클래스는 `ds-*`로 바꾼다.

## RED / GREEN 기록

### 1단계 — 토큰·브랜드 격리
RED ① 테스트만 작성 (토큰·brand.config 없음):
```
 FAIL  src/styles/tokens.test.ts > 디자인 토큰 > 라이트 테마의 --primary는 #3366ff로 해석된다
Error: ENOENT: no such file or directory, scandir '.../app/src/styles/tokens/'
 FAIL  src/test/brandIsolation.test.ts > 브랜드 격리 (ADR-002) > brand.config.ts가 제품명과 로고 컴포넌트를 제공한다
Error: Cannot find module '/src/brand/brand.config'
      Tests  8 failed | 2 passed (10)
```
RED ② 원본 토큰을 그대로 복사(출처 주석만 추가)한 직후 — 브랜드 격리 테스트가 실제 위반을 잡음:
```
 × src에 apfs/APFS/농업정책 문자열이 없다 (출처 경로 주석 제외)
AssertionError: expected [ …(30) ] to deeply equal []
+   "styles/tokens/base.css:26  .apfs-icon {",
+   "styles/tokens/colors.css:71  --apfs-blue: #1a75ff;",
+   "styles/tokens/colors.css:74  --apfs-gradient: linear-gradient(105deg, var(--apfs-blue) 0%, var(--apfs-cyan) 100%);",
+   "styles/tokens/typography.css:59  .apfs-title1   { font: ... }",
    … (30줄)
 × --brand-* 정의는 brand.css에만 존재한다   (colors.css의 --brand-inverse)
      Tests  3 failed | 1 passed (4)
```
GREEN (토큰 정리 + brand.css + brand.config.ts + theme.css):
```
 ✓ 디자인 토큰 > 라이트 테마의 --primary는 #3366ff로 해석된다
 ✓ 디자인 토큰 > 다크 테마의 --primary는 #5b84ff로 해석된다
 ✓ 디자인 토큰 > --radius-lg는 16px이다
 ✓ 디자인 토큰 > --font-size-body1은 16px이다
 ✓ 디자인 토큰 > --primary는 브랜드 토큰(--brand-primary)을 참조한다 (ADR-002)
 ✓ 디자인 토큰 > 토큰 복사본마다 원본 번들 경로를 출처 주석으로 남긴다
 ✓ 브랜드 격리 (ADR-002) > src에 apfs/APFS/농업정책 문자열이 없다 (출처 경로 주석 제외)
 ✓ 브랜드 격리 (ADR-002) > --brand-* 정의는 brand.css에만 존재한다
 ✓ 브랜드 격리 (ADR-002) > --brand-* 참조는 토큰 계층(styles/tokens) 밖에 없다
 ✓ 브랜드 격리 (ADR-002) > brand.config.ts가 제품명과 로고 컴포넌트를 제공한다
      Tests  10 passed (10)
```
Tailwind 연결 확인(빌드 산출 CSS): `.rounded-lg{border-radius:var(--radius-lg)}` → base 레이어 `--radius-lg:16px`이 theme 레이어 기본값 `.5rem`을 이김. `.shadow-4{--tw-shadow:var(--shadow-4)}`, `.p-7{padding:calc(var(--space-100) * 7)}`, `.bg-primary{background-color:var(--primary)}`.

### 2단계 — 데이터 계층
RED ① 테스트만 작성: `Failed to resolve import "../fixtures/references"` (Test Files 1 failed)
RED ② 타입·픽스처 + 필터 없는 스텁 저장소(`list = 전체 반환`):
```
 × 업종=카페·F&B 필터는 A·F 2개를 돌려준다
AssertionError: expected [ 'A', 'B', 'C', 'D', 'E', 'F' ] to deeply equal [ 'A', 'F' ]
 × external_observed 레코드는 목록·단건 조회 어디에도 나오지 않는다 (FR-CAT-04)
 × 같은 그룹 안의 선택은 OR로 결합한다
 × 서로 다른 그룹의 선택은 AND로 결합한다
 × 타깃·레이아웃·목적·라이선스·모션 필터를 각각 적용한다
 × 점수순은 접근성+성능 합계 내림차순, 최신순은 등록일 내림차순이다
      Tests  6 failed | 3 passed (9)
```
GREEN:
```
 ✓ 필터 없이 목업 레퍼런스 6개를 돌려준다
 ✓ 업종=카페·F&B 필터는 A·F 2개를 돌려준다
 ✓ external_observed 레코드는 목록·단건 조회 어디에도 나오지 않는다 (FR-CAT-04)
 ✓ 같은 그룹 안의 선택은 OR로 결합한다
 ✓ 서로 다른 그룹의 선택은 AND로 결합한다
 ✓ 타깃·레이아웃·목적·라이선스·모션 필터를 각각 적용한다
 ✓ 점수순은 접근성+성능 합계 내림차순, 최신순은 등록일 내림차순이다
 ✓ id로 단건을 조회한다
 ✓ 입력 레코드 배열을 변경하지 않는다
      Tests  9 passed (9)
```

### 3단계 — 비교 트레이
RED (id 기반 순수 함수, 제한 없는 스텁 `addToTray = 항상 추가`):
```
 × 이미 담긴 레퍼런스는 다시 담지 않는다
 × 6개가 찬 상태에서 7번째 추가는 거부한다
AssertionError: expected { ok: true, tray: [ 'ref-1', …(6) ] } to deeply equal { ok: false, reason: 'limit', …(1) }
      Tests  2 failed | 5 passed (7)
```
GREEN:
```
 ✓ 최대 개수는 6개다 (FR-CMP-02)
 ✓ 추가하면 끝에 담긴다
 ✓ 이미 담긴 레퍼런스는 다시 담지 않는다
 ✓ 6개가 찬 상태에서 7번째 추가는 거부한다
 ✓ 6번째 추가까지는 허용한다
 ✓ 해제하면 해당 레퍼런스만 빠진다
 ✓ 추가·해제는 입력 트레이를 변경하지 않는다
      Tests  7 passed (7)
```

### 4단계 — DS 컴포넌트 + 카드 + 하드코딩 가드
RED ① 테스트만 작성:
```
 FAIL  src/components/catalog/ReferenceCard.test.tsx
Error: Failed to resolve import "./ReferenceCard" from "src/components/catalog/ReferenceCard.test.tsx". Does the file exist?
 × 검사할 화면·컴포넌트 파일이 있다
AssertionError: expected 0 to be greater than 0
```
RED ② 카드 초안을 목업 인라인 스타일 그대로 옮긴 상태 — 카드 테스트 6개는 통과, 하드코딩 가드가 실제 위반을 잡음:
```
 × src/components·src/pages에 hex·px 하드코딩이 0건이다
+   "components/catalog/ReferenceCard.tsx:17 [hex 색상] <article … background: \"#fff\" }}>",
+   "components/catalog/ReferenceCard.tsx:17 [인라인 style px] <article … border: \"1px solid var(--line-neutral)\" …",
+   "components/catalog/ReferenceCard.tsx:18 [인라인 style px] <div … padding: \"12px 14px\" …",
+   "components/catalog/ReferenceCard.tsx:20 [인라인 style px] <span style={{ width: \"28px\", height: \"5px\", background: p.ink }} />",
    … (8건)
      Tests  1 failed | 7 passed (8)
```
GREEN (DS 컴포넌트 10종 + 토큰·Tailwind 유틸리티 카드):
```
 ✓ 스타일 하드코딩 금지 > 검사할 화면·컴포넌트 파일이 있다
 ✓ 스타일 하드코딩 금지 > src/components·src/pages에 hex·px 하드코딩이 0건이다
 ✓ ReferenceCard > 목업 카드 필드를 빠짐없이 표시한다 (FR-CAT-02)
 ✓ ReferenceCard > 이름은 레퍼런스 상세로 연결된다
 ✓ ReferenceCard > 저장 버튼은 이름을 포함한 aria-label과 눌림 상태를 가진다
 ✓ ReferenceCard > 비교 버튼은 이름을 포함한 aria-label을 갖고, 트레이 상태에 따라 문구가 바뀐다
 ✓ ReferenceCard > 트레이에 담긴 카드는 '비교 중'으로 표시된다
 ✓ ReferenceCard > licensed 레퍼런스는 licensed 배지를 표시한다
      Tests  8 passed (8)
```
- 하드코딩 가드 범위: `src/components`·`src/pages`의 `.ts/.tsx/.css`(테스트 파일 제외). 규칙 4종: hex(`#[0-9a-f]{3,8}`, 대소문자 무시), `text-[..px]`, 임의값 px 유틸리티, 인라인 style px.
- 목업의 비토큰 값(2px·5px·6px 등)은 4px 그리드 토큰 배수로 표현: `h-1.25`, `rounded-[--spacing(1.5)]`, `border-(length:--border-thick)`. 빌드 산출 CSS로 전부 `calc(var(--space-100) * n)`·`var(--토큰)`으로 생성됨을 확인.

### 5단계 — 카탈로그 화면 + 라우팅
RED ① 테스트만 작성: `Failed to resolve import "../app/routes" from "src/test/renderApp.tsx"`
RED ② 라우트·프로바이더·자리표시 페이지 + **필터 없는 카탈로그 골격**(카드만 나열):
```
 × 업종 칩을 누르면 카드가 줄고 URL 쿼리에 남는다 (FR-CAT-01)
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "카페·F&B"
 × 체크박스 필터는 그룹 안 OR로 URL에 쌓인다
 × 모션 강도를 고르면 해당 카드만 남고 URL에 반영된다
 × 새로고침(초기 URL)하면 필터 상태를 복원한다
 × 정렬을 바꾸면 순서와 URL이 바뀐다
 × 초기화는 필터 쿼리를 지우고 전체를 보여준다
 × 저장한 레퍼런스는 저장함 탭에서 모아 본다
 × 비교 추가·해제가 하단 트레이에 반영된다 (FR-CMP-02)
 × 7번째 비교 추가는 막고 안내한다
 × 비교 보드 열기는 /compare 로 이동한다
      Tests  10 failed | 7 passed (17)
```
GREEN:
```
 ✓ CatalogPage (1a-01) > 필터 없이 진입하면 노출 가능한 레퍼런스 6개를 보여준다 129ms
 ✓ CatalogPage (1a-01) > 업종 칩을 누르면 카드가 줄고 URL 쿼리에 남는다 (FR-CAT-01) 109ms
 ✓ CatalogPage (1a-01) > 체크박스 필터는 그룹 안 OR로 URL에 쌓인다 119ms
 ✓ CatalogPage (1a-01) > 모션 강도를 고르면 해당 카드만 남고 URL에 반영된다 49ms
 ✓ CatalogPage (1a-01) > 새로고침(초기 URL)하면 필터 상태를 복원한다 46ms
 ✓ CatalogPage (1a-01) > 알 수 없는 쿼리 값은 무시한다 21ms
 ✓ CatalogPage (1a-01) > 정렬을 바꾸면 순서와 URL이 바뀐다 72ms
 ✓ CatalogPage (1a-01) > 초기화는 필터 쿼리를 지우고 전체를 보여준다 42ms
 ✓ CatalogPage (1a-01) > 저장한 레퍼런스는 저장함 탭에서 모아 본다 62ms
 ✓ CatalogPage (1a-01) > 비교 추가·해제가 하단 트레이에 반영된다 (FR-CMP-02) 89ms
 ✓ CatalogPage (1a-01) > 7번째 비교 추가는 막고 안내한다 266ms
 ✓ 라우팅 > / 는 /catalog 로 이동한다 16ms
 ✓ 라우팅 > /references/ref-a 는 다음 단계 자리표시 페이지다 5ms
 ✓ 라우팅 > /compare 는 다음 단계 자리표시 페이지다 4ms
 ✓ 라우팅 > /profile 는 다음 단계 자리표시 페이지다 5ms
 ✓ 라우팅 > /studio 는 다음 단계 자리표시 페이지다 5ms
 ✓ 라우팅 > 비교 보드 열기는 /compare 로 이동한다 42ms
      Tests  17 passed (17)
```
- URL 쿼리 키: `industry`, `audience`, `concept`, `layout`, `purpose`, `license`, `motion`, `sort`(기본 score 생략), `tab`(기본 all 생략). 값은 한글 라벨이 아닌 id, 다중값은 쉼표 구분, 모르는 값은 버림.
- 저장·비교 트레이 상태는 앱 수준 Context(세션 메모리)라 라우트를 오가도 유지된다. 영구 저장은 범위 밖.

### 6단계 — 브라우저 확인(ego-browser, `vite preview`)
| 폭 | scrollWidth / innerWidth | 카드 열 | 비고 |
|---|---|---|---|
| 1280 | 1265 / 1280 (스크롤바 15) | 3열 (305.7px×3) | 반경 16px, `--primary` #36f |
| 390 | 375 / 390 | 1열 (343px) | 레일→그리드 순으로 쌓임, 트레이는 개수+버튼 |

- 실제 브라우저에서 발견한 결함: **outline 버튼 테두리가 투명**. Tailwind 산출 CSS에서 `.border-transparent`가 `.border-line-normal`보다 뒤에 있어 덮어씀.
  - RED: `Button.test.tsx` — `expected [ 'border-transparent', …(1) ] to deeply equal [ 'border-line-normal' ]` (1 failed | 4 passed)
  - 수정: `border-transparent`를 공통 클래스에서 빼고 primary·secondary·assistive 변형에만 둠
  - GREEN: 5 passed. 브라우저 재확인 `borderColor: rgba(112, 115, 124, 0.22)`
- 폰트: jsDelivr CDN 로드가 느려 `load` 이벤트가 15초 안에 끝나지 않았고 확인 시점엔 폴백 글꼴로 렌더됨(질문 3 참조).

검증 4종 (fresh):
```
typecheck exit=0
lint exit=0
 Test Files  8 passed (8)
      Tests  56 passed (56)
test exit=0
✓ built in 191ms
build exit=0
```

### Codex 리뷰 1라운드 (`review --scope branch --base main`)
| 등급 | 지적 | 처리 |
|---|---|---|
| P1 | FR-CAT-01의 색상·디바이스 필터 없음 | **보류** — 브리프 2절 5는 목업 1a-01 필터 레일(타깃·콘셉트·레이아웃·목적·라이선스·모션 + 업종 칩)이 범위이고 목업에 두 필터가 없다. 질문 5로 기록 |
| P2 | `/catalog?tab=saved`에서 GNB '카탈로그'가 활성, '보관함'은 비활성 | 반영 — 쿼리까지 보고 `aria-current="page"` 결정 |
| P2 | '비교 중' 상태 버튼의 접근성 이름이 여전히 '비교 추가' (보이는 문구와 불일치, WCAG 2.5.3) | 반영 — 이름을 `{이름} 비교 중, 비교에서 빼기`로, `aria-pressed` 제거 |

RED (테스트 먼저 수정):
```
 × 트레이에 담긴 카드는 '비교 중'으로 표시되고, 접근성 이름이 보이는 문구와 빼기 동작을 담는다
 × 비교 추가·해제가 하단 트레이에 반영된다 (FR-CMP-02)
 × 보관함(/catalog?tab=saved)에서는 GNB의 보관함만 현재 위치로 표시한다
      Tests  3 failed | 22 passed (25)
```
GREEN: `Tests  25 passed (25)` (카드·페이지), 전체 58 passed.

## 목업과 다른 부분
1. **Logo → BrandMark**: APFS 그라디언트 워드마크 대신 중립 단색 사각 마크(`bg-label-normal`) + `brand.name` 텍스트 (ADR-002).
2. **`--brand-inverse*` → `--surface-inverse*`** 개명 (설계 결정 2).
3. **SegmentedControl 시맨틱**: 번들은 `tablist/tab`, 필터 용도라 `radiogroup/radio`로 구현. 모양은 동일.
4. **Avatar sm 글자 크기**: 번들 32px×0.4=12.8px → 토큰 `caption2`(12px).
5. **카드 저장 아이콘**: 목업은 장식용 `<i>`, 구현은 `aria-pressed` 토글 버튼(저장 시 `bookmark-fill`+primary 색).
6. **카드 썸네일 흰 박스**: 목업 `#fff` → `--common-100`(테마와 무관한 "사이트 캔버스" 흰색), 카드 배경 `#fff` → `--surface-elevated`.
7. **초기 필터 상태**: 목업은 카페 칩·20~30대·미니멀·따뜻한·예약·internal·licensed·모션 낮음이 선택된 정적 그림이지만, 그대로 쓰면 결과가 0~1개다. 초기 상태는 **필터 없음(6개)**.
8. **모션 강도에 '전체' 추가**: 목업 세그먼트는 낮음/중간/높음 3개뿐이라 "제약 없음"을 고를 수 없다. 맨 앞에 '전체'를 두었다.
9. **탭 카운트**: 목업 20/5/3 고정값 대신 현재 필터 결과 기준 실제 값. '추천' 탭은 추천 로직이 범위 밖이라 카운트 없이 "다음 단계" 안내를 보여준다. '추천 받기' 버튼은 추천 탭으로 전환한다.
10. **검색 입력**: 목업처럼 표시만 하고 필터링은 하지 않는다(브리프 동작 목록에 없음).
11. **비교 트레이 초기값**: 목업은 A·B·C가 담긴 상태, 구현은 빈 트레이에서 시작(사용자 상태). 빈 상태 안내 문구 추가, 7번째 추가 시 트레이 안에 `role=status` 안내.
12. **정렬 Select 높이**: 목업 hint 32px, 번들 sm 규격(40px)을 따랐다. 업종 칩도 번들 md(36px).
13. **390 폭 대응**: GNB 메뉴는 md 미만에서 숨김, 필터 레일은 lg 미만에서 그리드 위로 쌓임, 카드 1열(sm 2열·xl 3열), 트레이 칩 목록은 md 미만에서 숨기고 개수·버튼만 표시.

## 질문
1. **타깃·콘텐츠 목적·등록일 데이터가 목업에 없음.** 목업 refs에는 audience·purpose·createdAt이 없어 필터·최신순이 동작하려면 값이 필요하다. `fixtures/references.ts`에 **임시값**을 넣었다(A 20~30대/예약, B 20~30대/예약, C 가족/예약·문의, D 20~30대/예약, E B2B/문의, F 가족·20~30대/판매, createdAt 2026-08-30~09-19). 실제 값 확정 필요.
2. **모션 단계.** TRD 4.1은 L0~L3(4단계), 목업은 낮음·중간·높음(3단계). 이번엔 목업 3단계(`low|mid|high`)로 구현했다. 백엔드 연결 시 매핑 규칙 확정 필요.
3. **폰트 원격 로드.** 복사한 `fonts.css`는 jsDelivr CDN에서 Pretendard를 받는다(ADR-001 "확인 필요"에 기록된 현 상태 유지). 브리프 5절 "외부 사이트 URL 금지"를 레퍼런스 사이트 한정으로 해석했다. 자체 호스팅(npm `pretendard`)으로 바꿀지 결정 필요.
4. **검색·추천.** 검색 입력은 표시만 하고, '추천' 탭과 '추천 받기'는 다음 단계 안내만 한다. 이번 범위에 넣어야 하면 알려 달라.
5. **FR-CAT-01의 색상·디바이스 필터.** PRD는 컬러·디바이스 필터도 요구하지만 목업 1a-01 레일에는 없다. 이번엔 목업 기준으로 구현했다(Codex P1 보류). 다음 handoff에 넣을지 결정 필요.

