# M1-UI-02 PROGRESS

브리프: `docs/06-handoff/M1-UI-02_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-02` (main에서 분기, 로컬 커밋만)

## 단계 현황
| # | 단계 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(브리프 0절 순서) + `npm ci` | 완료 | — |
| 1 | 폰트 자체 호스팅 (`fonts.test.ts`) | 완료 | 18a0c52 |
| 2 | 색상·디바이스 필터 (`colorFamily.test.ts`, 저장소·카탈로그 테스트) | 완료 | (작업 2 커밋) |
| 3 | 1a-02 레퍼런스 상세 | 대기 | |
| 4 | 검증 4종 + Codex 리뷰 + REPORT.md | 대기 | |

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
