# FIX-2A04-NARROW REPORT — 좁은 폭 버전 비교(E안, CSS만 쌓기) + `summarizeVersion` 정리

- 브리프: `docs/06-handoff/FIX-2A04-NARROW_DEVELOPER_BRIEF.md`(`bf82068`) · 작업 공간 `2a-04-narrow` · 2026-09-26 KST
- 결과: **N1·N2 완료.** `/profile` 진입 직후 124.59 → **124.68KB(여유 0.32)**, 예산 상수 변경 0. 검증 4종 0 · 전체 테스트 5회 연속 709/709.
- 근거 수준: 번들·테스트·브라우저 수치 = L1(아래 로그) · WebKit·Firefox·VoiceOver 동작 = 미확인

## 1. 커밋
| 해시 | 내용 |
|---|---|
| `cdfaff0` | refactor: `summarizeVersion`(base 기준) 삭제, 요약 단언은 `summarizeVersions`로 (N2) |
| `9754c7e` | fix: 좁은 폭 버전 비교 표 한 벌 + CSS 쌓기(E안) · 버전 줄 요약 둘째 줄 (N1) — 코드 + RED/GREEN·번들·브라우저 전후 로그 |
| (이 커밋) | REPORT + Codex 결과 |

## 2. N1 — 구현 (E안)
- **마크업 한 벌**: 기존 `<table>` 그대로. JS 훅·`matchMedia`·새 컴포넌트 0. 이전 패치 `ref/fix-f3.patch`는 적용하지 않았다(768 nowrap·A-05 클래스 발상만 재사용).
- **role 명시**(`VersionDiff.tsx`): `table` · `thead/tbody = rowgroup` · `tr = row` · `th scope=col = columnheader` · `th scope=row = rowheader` · `td = cell`.
- **값 셀 `data-col`** = 열 이름(`v1`·`v3`). <768에서 값 앞에 `::before { content: attr(data-col) / "" }`로만 보인다 — 대체 글자 `""`라 낭독에서 빠지고, 열 이름은 열 머리글 관계로 읽힌다.
- **폭별 배치는 `app/src/styles/versionDiff.css`**(index.css가 import, 표 클래스 `version-diff`):
  - 768↑: 항목(열·행 머리글)·차이 열 `whitespace-nowrap`. 값의 어절 단위 줄바꿈은 body 전역 `word-break: keep-all`(base.css)이 이미 하므로 `break-keep`은 넣지 않았다.
  - <768: 표·caption·tbody `block`, 행 `flex flex-col py-1.5`, 셀 여백 0, thead는 **`sr-only`**(display:none 아님 — columnheader가 AX 트리에 남는다).
  - 값은 모두 Tailwind `@apply max-md:…`/토큰(`--space-100`·`--label-alternative`·`--font-weight-normal`). hex·px 0.
  - 레이어 밖 규칙: 셀의 Tailwind 여백 유틸리티(`py-1.5 pr-3`)를 <768에서 덮어야 해서 `@layer`에 넣지 않았다.
- **A-05** `VersionList.tsx`: 요약 `basis-full md:basis-auto md:flex-1` → <768 둘째 줄 전체 폭.
- **왜 CSS 파일인가(ADR-003 한 줄)**: 같은 규칙을 JSX Tailwind 클래스로 넣었을 때 `/profile` 진입 직후 **124.78KB(여유 0.22, +0.19)** 로 멈춤선 아래였다(콘솔 실측, 그 빌드의 로그 파일은 뒤 빌드가 덮어씀). 클래스 문자열을 전역 CSS로 옮겨 JS 증가를 +0.09로 줄였다. CSS는 번들 예산 대상 밖(8.68 → 8.86KB gzip).

## 3. 테스트 (TDD)
- 새 파일 `app/src/pages/ProfileVersionNarrow.test.tsx` 6건:
  1. `table > rowgroup > row > columnheader/rowheader/cell role이 속성으로 명시된다(display를 바꿔도 표 의미 유지)`
  2. `값 셀의 열 이름(data-col) = 같은 위치의 열 머리글 — 쌓인 배치의 'v1'·'v3' 글자는 이 값을 CSS로만 보이고 낭독 대체 글자는 비운다`
  3. `<768 쌓기 규칙(versionDiff.css): 표·caption·본문은 블록, 행은 세로 줄, 열 머리글은 숨기지 않고 sr-only(열 관계 유지)`
  4. `768: 항목(열·행 머리글)·차이 열은 줄바꿈 없음 — 값은 body의 keep-all로 어절 단위`
  5. `중복 낭독 0: 제목·항목 이름이 DOM에 한 번씩, 표 이름 = caption, 셀 이름에 열 이름을 덧붙이는 aria 속성 없음`
  6. `<768은 요약이 줄 전체 폭 둘째 줄(basis-full), 768부터 남은 폭(md:flex-1)`
- **RED** `logs/n1-red.txt`: 5 실패 / 1 통과(5번 = 회귀 가드, 기존 표도 만족). **GREEN** `logs/n1-green.txt` 6/6(첫 구현 시점).
- **RED 뒤 테스트 수정(기록)**: 번들 때문에 규칙을 CSS 파일로 옮기면서 3·4번(및 2번의 content 단언)을 "JSX 클래스" 단언에서 "표 클래스 `version-diff` + `versionDiff.css` 원문 규칙 + index.css import" 단언으로 바꿨다. vitest는 `css: false`라 `textWrap.test`처럼 파일 원문을 읽는다. 최종 6/6 통과(5회 실행에 포함).
- N2: `profileDiff.test.ts` "요약(적용된 값 기준) = 직전 버전과의 차이 최대 2개 + '외 N', 첫 버전·차이 없음 문장" — 기존 `summarizeVersion` 단언 3개(외 N·첫 버전·바뀐 값 없음)를 `summarizeVersions(ProfileVersion)`로 옮기고 `rest > 0`을 단언으로 고정. 삭제 리팩터링이라 RED 단계 없음(옮긴 테스트는 기존 함수로 바로 통과). 화면 동작 변화 0(`summarizeVersions`는 그대로).

## 4. 브라우저 (127.0.0.1:4337 `vite preview`, ego-browser TaskSpace 26, CDP 폭 변경)
- 절차 스크립트 `logs/measure.mjs`: 카탈로그 3개 비교 추가 → Hero A 확정 v1 → 전부 C 재확정 v2 → 전부 B 재확정 v3 → `?v=1&diff=3`(pushState, 메모리 저장소라 새로고침 없음).
- 파일: 수치 `logs/browser-{before,after}.json` · AX `logs/ax-{before,after}.txt` · 캡처 `screens/{before,after}-{768,390,320}.png`

| 폭 | 항목 셀 폭 전→후 | "레이아웃 방향" 행 높이 전→후 | 버전 줄 요약 v3 [폭,높이] 전→후 | 문서 가로 넘침 · 래퍼 scrollWidth≤clientWidth |
|---|---|---|---|---|
| 768 | 45 → 118px (표 유지) | 79 → 35px | [371,18] → [371,18] (변화 없음, 한 줄) | 0 · 671≤671 전후 모두 |
| 390 | 32 → 317px (쌓기) | 145 → 101px (항목·v1·v3·바뀜 4줄) | [17,234] → [343,18] | 0 · 317≤317 |
| 320 | 30 → 247px (쌓기) | 145 → 101px | [89,54] → [273,18] | 0 · 247≤247 |

- 390·320 쌓인 표: 표 display `block`, thead 1×1(sr-only), 값 셀 `::before` 계산값 `"v1" / ""`.
- **AX 트리(Chromium, 후)**: 세 폭 모두 `table "v1과 v3 비교" > caption · rowgroup > row > columnheader 항목/v1/v3/차이 · rowgroup > row > rowheader/cell`. 값 셀 이름은 값만(`cell "풀블리드 히어로"`) — 생성 글자 "v1"이 이름에 붙지 않음(`cell "v…"` 0건). 전에는 tbody rowgroup이 트리에서 빠져 있었고 후에는 명시 role로 나타난다.
- **포커스(P-AC-09)**: 768·390·320 각각 `?v=1` → "v1과 비교 (v3)" 클릭 → `activeElement = CAPTION "v1과 v3 비교"`, "비교 닫기" → `BUTTON "v1과 비교 (v3)"`(`browser-after.json` `focus`).
- 종료: TaskSpace 26 `finish({keep: []})`(이후 조회 "task space not found: 26"), 서버 종료 뒤 `lsof -iTCP:4337 -sTCP:LISTEN` 결과 없음(`logs/server-stop.txt`).

## 5. 번들 (gzip KB, 진입 직후 자동 로드 포함 / 예산 125 · 첫 화면 / 100)
| 시나리오 | 전 `bundle-before.txt` | JSX 클래스안(멈춤선 아래, 폐기) | 후 `final-build.txt` |
|---|---|---|---|
| `/profile` 진입 직후 | 124.59 (여유 0.41) | 124.78 (0.22) | **124.68 (0.32)** · +0.09 |
| `/profile` 첫 화면 | 99.27 | 99.46 | 99.36 |
| `/compare`·`(조정 있음)` 진입 직후 | 124.58 | 124.58 | 124.59 (+0.01) |
| `/compare` 첫 화면 | 99.59 | — | 99.60 |
| `/catalog` 진입 직후 · 첫 화면 | 101.74 · 99.35 | — | 101.74 · 99.36 |
| `/references/:id` 진입 직후 · 첫 화면 | 99.09 · 96.70 | — | 99.09 · 96.71 |
| `/studio` 진입 직후 · 첫 화면 | 91.88 · 89.50 | — | 91.88 · 89.50 |
| 공통 JS | 89.06 | — | 89.06 |
- `ProfilePage` 청크 7.13 → 7.22KB. CSS 8.68 → 8.86KB(예산 밖).
- `/compare`·`/catalog`·`/references` 첫 화면 +0.01은 공통 JS(89.06) 그대로인 상태의 반올림·청크 해시 문자열 차이로 보인다(L2, 파일별 비교 안 함).

## 6. 검증 (최종 코드 `9754c7e` 상태)
- typecheck 0 · lint 0 · build 0(번들 검사 통과) — `logs/final-{typecheck,lint,build}.txt`
- 전체 테스트 **5회 연속 709/709 통과** — `logs/final-run{1..5}.txt`, 요약 `logs/final-runs-summary.txt`

## 7. Codex
- `node codex-companion.mjs review --wait --scope branch --base bf82068` 1회(코드 커밋 `9754c7e` 뒤, 원문 `logs/codex-review.txt`) — **지적 0건.**
  요지: "변경된 비교·요약 로직과 좁은 화면 표 레이아웃에서 확실히 수정이 필요한 결함은 발견되지 않았습니다."
- Codex 쪽 `npm test`는 샌드박스가 Vite 설정 임시 파일 쓰기를 막아 기동 실패(코드 문제 아님 — 로컬 5회 709/709는 6절). 반영할 지적이 없어 재리뷰 없음.

## 8. 남은 위험
- **WebKit·Firefox·VoiceOver·NVDA 미확인** — Chromium만 실측. `content: … / ""`(대체 글자) 미지원 브라우저는 규칙 전체를 버려 <768 값 앞 "v1"·"v3" 글자가 안 보인다(값·순서는 남음). Safari는 display를 바꾼 표에 명시 role이 있어도 낭독이 다를 수 있다.
- 쌓인 배치에서 열 머리글은 sr-only로 남는다 — 스크린리더가 thead 행을 한 번 읽는다(표와 같음).
- 비교를 연 채 768 경계를 넘어 창 크기를 바꿔도 마크업이 같아 포커스는 유지된다(이전 F3 패치의 위험은 없음, 실측은 안 함).
- `/profile` 진입 직후 여유 0.32 — 2a-04c 등 `/profile` 진입 직후에 붙는 작업의 여지는 +0.02.

## 9. 설계 질문
1. **폭 전환 규칙을 전역 CSS 파일(`styles/versionDiff.css`, `@apply` + 토큰)로 둔 것**이 브리프 "폭 전환은 CSS(Tailwind 반응형 유틸리티/토큰)만"에 맞는지. JSX 유틸리티로 두면 여유 0.22라 멈춤선 아래였다. 컴포넌트 전용 CSS 파일이 이 저장소의 첫 사례다.
2. **`break-keep` 생략**: body 전역 `keep-all`과 중복이라 넣지 않았다. 브리프 A-04 문구대로 명시 클래스를 원하면 +수 바이트.
3. <768 "바뀜"만 있고 "차이" 열 이름은 붙이지 않았다(글자 자체가 뜻을 가짐). 같은 줄(바뀌지 않음)은 빈 셀이라 높이 0.
