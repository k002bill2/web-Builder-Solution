# M1-UI-01-FIX PROGRESS

브리프: `docs/06-handoff/M1-UI-01-FIX_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-01-fix` (`main` @ `0ef57de` 분기, 로컬 커밋만)

## 단계 현황
| # | 단계 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(브리프 0절 순서) + 번들 실측 | 완료 | — |
| A | D04·D05·D06 시각 결함 | 완료 | 317b192 |
| B | D07·D08·A01·A02·A03 키보드 접근성 | 완료 | (그룹 B 커밋) |
| C | 초기 JS ≤ 90KB gzip | 진행 중 | |
| D | 라우트 스크롤·경쟁 상태 테스트 | 대기 | |
| E | 검증 4종·브라우저·Codex·보고서 | 대기 | |

## 0단계 — 읽기와 사전 실측
- 읽음: CLAUDE.md, ADR-002, `docs/qa/1a-01/REPORT.md` 전체, `dev/active/m1-ui-01/PROGRESS.md`, `dev/active/m1-ui-02/REPORT.md`, 목업 55~125행.
- `npm ci` 후 기준 빌드: `index-*.js` 367.84KB / **gzip 113.85KB** (단일 청크).
- 번들 구성 실측 (임시 설정, 커밋 안 함 · gzip):
  | 청크 | data router(`createBrowserRouter`) | 선언형(`BrowserRouter`) |
  |---|---|---|
  | react-dom + scheduler | 68.10KB | 68.10KB |
  | react-router | **31.68KB** | **13.86KB** |
  | 합계(앱 코드 제외) | 약 100KB → 예산 90KB 초과 | 약 83KB |
  - 결론: data router를 유지하면 앱 코드 0바이트여도 90KB를 넘는다. 선언형 모드로 바꿔야 한다(그룹 C). 이 경우 `ScrollRestoration`(data 전용)을 못 쓰므로 그룹 D 스크롤은 직접 구현한다.
- TRD 8절의 "초기 JS ≤ 90KB gzip"은 원문상 **코드 생성 산출물(export/)** 규격이다. 브리프가 이를 앱에 적용했으므로 브리프를 따르고, 보고서 질문에 남긴다.
- 원인 추정(D04·D05): 번들 CSS와 앱 타입 토큰의 line-height 차이.
  | 컴포넌트 | 앱 | 번들 |
  |---|---|---|
  | Checkbox | `text-body2` 15/24 | 15/22 → 행 32 vs 30 |
  | Tabs | `text-body1` 16/26 | 16/24 → 탭 50 vs 48 |
  | SegmentedControl sm | `text-caption1` 13/18 | 13/20 |

## 그룹 A — 시각 결함

### 도구 메모
- ego-browser(TaskSpace 73)는 `evaluate`·뷰포트 변경은 되지만 `Page.captureScreenshot`이 매번 타임아웃됐다(clip·raw·새 Page·bringToFront 모두 실패). 수치 측정은 ego 1280으로 하고, 캡처 이미지는 `aside repl` 스크린샷으로 남겼다. aside 탭 뷰포트는 1440이라 캡처는 1440 폭이다. 레일(232px 고정)·탭의 세로 치수는 lg 이상에서 폭과 무관하며, 캡처 시 함께 찍은 수치가 1280 실측과 같다.
- 목업은 `python3 -m http.server --bind 127.0.0.1 4318`로 열었다(목업 자체가 unpkg React를 로드).

### D04·D05 — 실측 (1280, 목업은 1a-01 카드 상단 기준, 앱은 header 상단 기준 → 전 항목 공통 1px 오프셋)
| 항목 | 목업 | 수정 전 | 수정 후 |
|---|---|---|---|
| 체크박스 행 높이 / 간격 | 22 / 30 | 24 / 32 | 22 / 30 |
| 체크박스 그룹 높이 (3행) / 그룹 간격 | 110 / 132 | 116 / 138 | 110 / 132 |
| 라이선스 그룹 (2행) | 80 | 84 | 80 |
| 모션 강도 그룹 / 세그먼트 높이 | 64 / 36 | 62 / 34 | 64 / 36 |
| 결과 탭 높이 / tablist | 48 / 49 | 50 / 51 | 48 / 49 |
| 밑줄 `::after` bottom | -1px | -1px | -1px |
- 원인: 번들 CSS의 line-height와 앱 타입 토큰 차이. 수정은 토큰 참조로만 했다.
  - Checkbox `leading-(--line-height-body3)`(22), Tabs `leading-(--line-height-heading2)`(24), SegmentedControl `leading-(--line-height-label)`(20, sm·md 모두 번들 20).
- 캡처: `screens/mockup-rail-tabs.png`, `screens/before-rail-tabs.png`, `screens/after-rail-tabs.png`.
- 상세 화면(1a-02)의 Tabs도 같은 컴포넌트라 48px가 된다(번들 Tabs 규격과 같음).

### D06 — 한국어 줄바꿈
- `styles/tokens/base.css`의 `body`에 `word-break: keep-all; overflow-wrap: anywhere;` (상속으로 제목·본문 전역 적용).
- 테스트 `src/styles/textWrap.test.tsx`: vitest가 `css: false`라 base.css를 `<style>`로 주입하고 카탈로그 h1·본문의 계산 스타일을 본다.
  - 함정: `?raw` import는 `css: false`에서 빈 문자열이 되고, jsdom 환경에서는 `new URL(.., import.meta.url)`이 file 스킴이 아니다 → `import.meta.dirname` + `readFileSync`.
- RED (규칙 없음):
```
     × 카탈로그 제목은 어절 단위로 줄바꿈하고(keep-all) 긴 영문·URL은 넘치지 않게 끊는다(anywhere)
     × 본문 텍스트에도 같은 규칙이 적용된다
Received: "normal"
      Tests  2 failed (2)
```
- GREEN: `Tests  2 passed (2)`. 규칙을 다시 지우면 같은 2건 실패 → 복원 후 통과(Red-Green 재확인).
- 브라우저 390: h1 줄 = `["업종에 맞는 좋은 사이트를 찾고, ", "근거와 함께 비교하세요"]`, 가로 넘침 요소 0. 1280: 한 줄, 넘침 0.

### 그룹 A 게이트
```
typecheck exit=0
lint exit=0
 Test Files  12 passed (12)
      Tests  93 passed (93)
```

## 그룹 B — 키보드 접근성

테스트: `src/pages/keyboardA11y.test.tsx` (9건, `userEvent.keyboard`/`userEvent.tab`)

RED (구현 전):
```
     × 다음 칩 → 이전 칩 → 트레이 영역 순으로 포커스가 이동한다 366ms
     × 다른 컨트롤과 같은 --focus-ring을 쓴다 64ms
     × Tab 정지점은 선택된 라디오 하나다 43ms
     × ←/→·↑/↓로 이동하며 선택하고, Home/End로 처음·끝을 고른다 52ms
     × Tab 정지점은 선택된 탭 하나이고, ←/→는 포커스만 옮기며 Enter·Space로 선택한다 47ms
     × 상세 화면(1a-02)의 탭도 같은 방식으로 동작한다 29ms
     × 첫 Tab에 '본문으로 건너뛰기'가 나오고, 누르면 main으로 포커스가 간다 263ms
     × 카탈로그에서는 두 번째 Tab의 '결과로 건너뛰기'로 레퍼런스 목록에 바로 간다 207ms
     × 상세 화면에도 '본문으로 건너뛰기'가 있고, '결과로 건너뛰기'는 없다 111ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 9 ⎯⎯⎯⎯⎯⎯⎯
      Tests  9 failed (9)
```
실패 이유: D07 포커스가 body / D08 `focus-visible:underline`만 있음 / A01 라디오 4개 모두 Tab 정지점 `['전체','낮음','중간','높음']` / A02 탭 3개(상세 4개) 모두 정지점 / A03 '본문으로 건너뛰기' 링크 없음.

구현:
- `components/ds/rovingFocus.ts` — ←/↑ 이전, →/↓ 다음(양 끝 순환), Home/End. 이동 키가 아니면 null.
- A01 `SegmentedControl`: roving tabindex(선택 항목만 `tabIndex=0`, 값이 옵션에 없으면 첫 항목), 방향키로 이동하면서 선택(APG radio group).
- A02 `Tabs`: **수동 활성화** — 방향키·Home/End는 포커스만 옮기고 Enter·Space(클릭)로 선택. 근거: 카탈로그 탭 변경은 URL push라 자동 활성화면 방향키마다 history가 쌓인다. 옮겨 간 탭이 Tab 정지점이 되고, 목록 밖으로 포커스가 나가면 선택된 탭으로 되돌린다. 상세 화면 탭도 같은 컴포넌트.
- D07 `CompareTrayBar`: 제거 **전에** 다음→이전→트레이 영역을 계산하고, 칩이 사라진 뒤(`useEffect([references])`) 포커스. 트레이 `section`은 `tabIndex=-1` + 포커스 표시 outline.
- D08 카드 이름 링크: `focus-visible:underline` → `rounded-xs focus-visible:shadow-(--focus-ring) focus-visible:outline-none`.
- A03 `components/layout/SkipLinks.tsx`: 첫 Tab '본문으로 건너뛰기', 카탈로그에서만 둘째 Tab '결과로 건너뛰기'. `href="#id"` 기본 동작을 막고 대상에 직접 `focus()` (해시 이동이 history를 만들지 않게).
  - `<main>`을 `AppLayout` 한 곳(`#main-content`, `tabIndex=-1`)으로 옮기고 페이지(카탈로그·상세·404·로딩·자리표시)의 `<main>`은 `div`/Fragment로 바꿨다. 이전에는 페이지마다 `main`이 따로 있었다.
  - 결과 영역 `section#catalog-results`에 `tabIndex=-1`.

GREEN: `keyboardA11y.test.tsx` 9 passed. 전체 게이트:
```
typecheck exit=0
lint exit=0
 Test Files  13 passed (13)
      Tests  102 passed (102)
```
