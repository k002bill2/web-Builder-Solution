# M2B-1b-hardening REPORT — Popover 폴백·포커스 링 검증 공백 종결

- 책임 Developer / 실행 Orca managed Claude Code(Opus) 단일 레인 · 서브에이전트 0
- worker 시작 HEAD `c79bb65` (브리프·명세 결정 커밋) · 코드 baseline `9e87308` · 브랜치 `k002bill2/m2b-1b-hardening`
- 상태 표기
  - **기동완료**: 예 — 이 레인 기동, 로컬 서버 4337·4339 기동, 브라우저 판정 실행을 뜻한다. 2a 기동이 아니다.
  - **수정완료**: 예 — `kit.css` 최소 수정 1건 + 구조 가드 1파일
  - **검토완료**: Codex 1회 — 6절
  - **실제UA검증**: **아니오** — 미지원 실제 UA를 확보하지 못했다. 폴백은 모의 환경에서만 확인했다.
- 이 worker 자체 검증은 독립 QA가 아니다. 독립 QA는 구현자와 분리된 Orca QA 레인 몫이다.

## 결론
1. **폴백**
   - 원래 Codex 주장("burger lg 메뉴 링크 0")은 모의 미지원 환경에서 **재현되지 않았다**(링크 3/3 보임).
   - 2R 관찰("K1-1 계열 lg에서 nav 2벌")은 **재현됐다** — right-cta·two-tier·transparent, 1280.
   - 수정 뒤 폴백은 명시적인 `@supports` 블록과 구조 가드로 보호된다. 모의 판정 12/12 PASS, 지원 경로 회귀 0.
2. **링** — 수용 기준 2는 **부분 미충족**이다.
   - header 4변형(+transparent 면 3) 링 332건을 쟀다. 역할 허용 쌍 위반 0, 바깥 면 대비 최소 4.61(≥3).
   - 부정 표본 3종은 판정기가 FAIL로 잡았다.
   - **footer 실제 링크 링은 미판정(BLOCKED)이다.** footer 하단 링크는 SPEC상 글자 항목이라 실제 `a`가 0이다(아래 3.2).
   - 그래서 수용 기준 "footer 실제 링크 링 측정 0이 아님"은 **이 항목만 미충족(BLOCKED)**이다.
   - 브리프 전제였던 2R의 "제목 불일치 → span" 추정은 틀렸다.
3. **390 예외 상태** PASS — 보조 줄이 바 위에 있고, DOM 순서와 시각 순서가 같으며, 넘침 0. 위치 변경 0.
4. **전체 suite / 예산**
   - 전체 suite 1744/1744 통과, exit 0, Errors 0.
   - gate OK.
   - 번들: 렌더 CSS +0.01 KB만 늘었고 나머지 변화는 0.

## 1. 커밋표
| SHA | 내용 | 경로 |
|---|---|---|
| `17eef79` | PROGRESS·REPORT 골격·gate.sh | dev/active/m2b-1b-hardening |
| `8c60a4b` | 1b qb.mjs·judge.mjs 원문 복사(1b 파일 불변) · gate.sh가 표적 FAIL 줄도 남기게 · P0 baseline 로그 · RED 로그 | dev/active/m2b-1b-hardening |
| `86e5e79` | **fix(kit)** popover 폴백 명시 블록 + `popoverFallback.test.ts` + fb 판정 도구·로그·모의 표본 | app/src/kit/kit.css · app/src/kit/popoverFallback.test.ts · dev/… |
| `f6836e4` | 링 판정 개선 · P3 판정 · 캡처 | dev/active/m2b-1b-hardening |
| `f269053` | P4 gate·전체 vitest·번들 대조 | dev/active/m2b-1b-hardening |
| (이 REPORT 마감 커밋) | REPORT·PROGRESS·Codex 로그 | dev/active/m2b-1b-hardening |

변경 범위 확인:
- `git diff c79bb65 --stat -- app`: `kit.css` +13/−4, `popoverFallback.test.ts` +79. 두 파일뿐이다.
- 다음 경로는 모두 변경 0이다: `drawKit.tsx`, `staticHtml`(script 바이트), docs/, design/, package*.json.
- 다음은 모두 0이다: 킷 TSX, React state/event, 새 script, 새 의존성, 새 변형.
- 1b 증거 보존: `git diff c79bb65 --stat -- dev/active/m2b-1b` → 출력 없음(변경 0).

## 2. 폴백 증거 — 원본 구조 · 모의 미지원 · 실제 UA 구분

### 2.1 원본 구조 (c79bb65, 정적)
`kit.css` K1-1 lg 규칙은 `.kit-menu-button, .kit-sheet, .kit-sheet:popover-open { display:none }`이다. 이 하나의 선택자 목록에 `:popover-open`과 일반 선택자가 섞여 있다.
- `:popover-open`을 모르는 엔진은 이 목록을 통째로 버린다. 그 결과 시트 숨김도 함께 빠지고, burger 메뉴가 남는다. 이는 **우연에 기댄 동작**이다.
- 목록을 쪼개거나 `:is()`로 감싸면 burger lg 메뉴 링크가 0이 된다. 이것이 Codex가 우려한 상태다.

### 2.2 구조 가드 RED → GREEN (`app/src/kit/popoverFallback.test.ts`, 6 it)
- 가드 내용:
  - 게이트 밖에서 `:popover-open`과 일반 선택자를 섞은 목록이 0인지
  - `:popover-open` 숨김이 지원 블록 안에만 있는지
  - 미지원 블록에 `.kit-sheet{display:block}`이 있는지
  - lg 시트 숨김이 게이트 밖에 있고 burger를 제외하는지(`:not`)
  - 메뉴 버튼 보임이 지원 블록 안에만 있는지
  - 파서 자기 점검
- 결과:
  - RED: `logs/p1-fallback-red.txt` — 4 실패 / 6. 실패 = 섞인 목록, 게이트 밖 숨김, 미지원 블록 없음, lg burger 미제외.
  - GREEN: `logs/p1-fallback-green.txt` — 6/6.

### 2.3 최소 수정 (`kit.css`)
- 미지원 블록을 추가했다: `@supports not selector(:popover-open) { .kit-sheet { display: block } }`.
- lg 숨김을 다음과 같이 바꿨다:
  - `.kit-menu-button, .kit-header:not(.kit-header--burger) .kit-sheet { display:none }` — 게이트 밖이라 모든 엔진에서 유효하다.
  - `@supports selector(:popover-open) { .kit-sheet:popover-open { display:none } }`
- 효과:
  - burger 시트는 게이트 밖 어디에서도 숨겨지지 않는다.
  - K1-1 계열은 미지원에서도 lg에서 시트를 숨긴다. 바 메뉴가 있으므로 nav 중복이 0이 된다.
- 수정 방식 선택(①/②) — ②를 택했다:
  - ② = `:not()` 제외. 게이트 밖이라 `selector()`를 모르는 엔진에서도 burger 시트가 숨겨지지 않는다.
  - ① = burger 예외를 `@supports not` 안에만 두는 방식. `selector()`를 모르는 엔진에서는 적용되지 않는다.

### 2.4 모의 미지원 (브라우저, `fb.mjs` → `logs/fb-{base,fix}.json` → `fbjudge.mjs` → `logs/fb-judge.txt`)
- **방법** — 로컬 시험 사본 `static/fb-<phase>-<변형>-mock.html`만 변환했다. 운영 마크업과 CSS는 불변이다.
  1. CSS의 `:popover-open` 토큰을 엔진이 모르는 `:x-mock-no-popover`로 치환했다(base 7개 · fix 9개, `selector(:popover-open)` base 2 · fix 4 포함).
     - 그러면 **Chromium 파서가 스스로** 그 선택자 목록 전체를 버리고 `@supports selector()`를 거짓으로 판정한다.
     - 실측: CSSOM 규칙 수가 356→351(base), 360→355(fix)로 줄었다. 엔진이 5개 규칙을 버린 것이다.
     - `CSS.supports("selector(:x-mock-no-popover)")`는 false였다.
  2. 마크업 사본에서 `popover` 1개와 `popovertarget(action)` 3개 속성을 제거했다. 이로써 UA의 `[popover]:not(:popover-open)` 닫힘 숨김이 사라진다.
- **원본과 모의의 차이(한계)**
  - JS `showPopover` API는 그대로 있다. 모의에서는 popover 요소가 0이라 쓰이지 않는다.
  - 치환은 문자열로 했지만, 무효화 판단 자체는 실제 엔진 파서가 내렸다. 그래도 **"`selector()`는 알고 popover는 모르는 엔진"의 모의일 뿐**이다.
  - `selector()`를 모르는 구형 엔진은 재현하지 않았다.
- **base(수정 전 CSS) 모의**: FAIL 3/12. 1280에서 right-cta·two-tier·transparent의 보이는 nav가 2벌이다(2R 관찰 재현).
  - burger 1280: 시트가 일반 흐름(static)으로 보인다. 링크 3/3. → **Codex "링크 0" 비재현.**
- **fix(수정 뒤) 모의**: **PASS 12/12** (4변형 × 1280·768·390).
  - 메뉴·닫기 버튼 보임 0
  - 메뉴 항목 3/3 보임 · 링크 focus 성공 = 링크 수
  - 보이는 nav 1
  - two-tier utility 정확히 1벌
  - 가로 넘침 0
- **지원 경로 회귀** — 원본 정적 HTML, Chromium 네이티브 popover:
  - base와 fix 모두, 메뉴 버튼이 보이는 9건에서 다음이 전부 PASS였다: 열기 → `Escape` 키로 닫힘 → 포커스가 "메뉴" 버튼으로 복귀 → 다시 열기 → 시트 안 앵커 누름 → r4.12 고정 스크립트가 닫음.
  - lg(burger 제외): 버튼·시트 숨김, nav 1 PASS. 넘침 0.
  - 참고: `open1`은 `:popover-open` 일치만 본다. 열린 시트가 실제로 보인다는 근거는 다음 단계다. 시트 안에서 `checkVisibility()`가 참인 앵커를 찾아 클릭했고, 9건 모두 성공했다(`anchor.opened/closed`, href `#s-s-about`). burger 1280 포함이다. 이번 수정이 lg `:popover-open` 숨김을 건드렸으므로 이 근거를 명시해 둔다.

### 2.5 실제 UA
**미확보.** popover 미지원 실제 브라우저(예: Chrome < 114 · Safari < 17 · Firefox < 125)에서 실측하지 않았다. 위 2.4를 실제 구형 UA 검증이라고 하지 않는다.

## 3. 링 표본 / ratio (`qb.mjs` 개선 → `logs/qb-h.json` → `ringjudge.mjs` → `logs/ring-judge.txt`)

### 3.1 판정 개선 (1b `qb.mjs` 원문 `8c60a4b` 대비 diff = `f6836e4`)
1. 실제 `focus()` 뒤 `activeElement` 일치, `:focus-visible`, `outlineStyle ≠ none`, `outlineWidth > 0`을 모두 확인한다.
2. 바깥 면 = **부모의 실제 불투명 면**(`faceOf(el.parentElement)`)이다.
   - outline-offset > 0이면 링과 안쪽 간격이 모두 부모 면 위에 놓인다. 그래서 요소 자신의 fill은 링 배경이 아니다.
   - offset ≤ 0이면 자기 fill 쌍도 따로 판정한다(이번 실측에서는 offset이 전부 > 0).
3. 역할 허용 쌍과 **실제 대비 ≥ 3**을 둘 다 검사한다.
   - `RING_OK`에서 1b의 `ink/primary`를 뺐다. 이 쌍은 CTA 자기 fill을 면으로 오인한 결과였다.
4. 다음 경우는 fail-closed로 처리한다(FAIL/미판정): 면 없음, 색 파싱 실패, 반투명, focus 실패, 링 0.
5. 1b 판정 ①~⑦은 이번 범위 밖이라 복사본에서 뺐다. 1b 증거 `dev/active/m2b-1b/logs`는 보존했다(1b 파일 변경 0).
   - `judge.mjs`는 1b 원문을 참고용으로 복사만 했다. 이 레인 판정은 `ringjudge.mjs`·`fbjudge.mjs`가 한다.

### 3.2 결과
- **header 링 PASS**
  - 범위: light·dark × base·alt × [right-cta·hamburger·two-tier 바 + 열린 시트, transparent 면 primary·surface·bg 바 + 시트] × 1280·768·390 = 72 상태.
  - 측정 부분 172개, **링 332건**, 위반 0, **최소 대비 4.61**(dark·transparent primary 면 1280 바, on-primary/primary).
  - 역할 쌍 분포: ink/bg 100, on-primary/primary 12, ink/surface 12. 허용 밖 쌍 0.
  - CTA(자기 fill primary)는 이제 면 `bg`로 판정된다. 1b 방식이었다면 `ink/primary`로 기록됐을 것이다(N3).
- **footer 실제 링크 링: 미판정(BLOCKED)**
  - 측정 범위: footer 4변형(biz-extended·biz-extended-map·minimal·minimal-biz) × 3폭 × light·dark × base·alt = 48개 대상.
  - 결과: 실제 `a` 합 **0**, 링 측정 합 **0**.
  - `links` 슬롯에는 실제 본문 제목과 같은 글자(`소개 · 서비스 · 자주 묻는 질문 · 개인정보처리방침`)를 넣었다. 그래도 항목은 글자(`li` 텍스트)였다.
  - 원인 — 2R D-P2-1의 "제목 불일치로 span" **추정은 틀렸다.**
    - `FooterBizExtended.tsx`의 `FooterLinks`는 항상 `<li>{item}</li>`를 렌더한다.
    - SPEC이 하단 링크를 대상 슬롯 없는 글자 항목으로 정했다(m2a `SPEC.md:122`·`:463`, MQ-2).
    - 즉 footer에는 포커스 대상이 설계상 0이다.
  - 실제 `a`를 만들려면 킷 TSX 수정과 SPEC(MQ-2) 결정이 필요하다. 이는 이 레인 쓰기 범위 밖이므로 우회하지 않았다.
  - 판정기는 이 상태를 PASS로 내지 않는다. 링 0은 미판정으로 처리된다.
- **(보조, 실제 링크 측정 대체 아님) footer 탐침**
  - 방법: 판정 페이지 안에서 footer **복제본**(같은 class·같은 부모)의 첫 항목을 `a[href]`로 바꿔 잰 뒤 제거했다. React DOM은 건드리지 않았다.
  - 결과: 48개 대상에서 링 48건, 최소 대비 **16.82**, 쌍은 `bg/ink`(biz-extended ink 면)과 `ink/bg`(minimal) 두 가지다.
  - 이는 SPEC 481 "링크가 생기면 링 = 바깥 bg"의 CSS 계약(`--kit-ring`)이 유효하다는 증거다.
- **부정 표본(RED 증거, 기대 = 판정기 FAIL)** — 모두 기대대로 FAIL이 났다.
  - N1: header 바(면 bg)에 `--kit-ring = bg`를 줌 → FAIL 3/4(`bg/bg` · 대비 1). 남은 1건은 자기 `--kit-ring` ink를 가진 CTA로, 정상 쌍이다.
  - N1f: footer 탐침(면 ink)에 링 ink를 줌 → FAIL 1/1(`ink/ink` · 대비 1).
  - N2: 역할은 허용 쌍(ink/bg)이지만 저대비 프로필(`low`) → FAIL 4/4(대비 1.45). **역할 검사만으로는 놓칠 경우를 수치 검사가 잡는다**는 증거다.
- 참고: 같은 측정에서 글자 대비 4.5와 역할 위반도 0이었다.

## 4. 390 예외 상태 (two-tier nav 빈 값 + utility 있음)
- 판정: `logs/ring-judge.txt` P3 줄, 원자료 `qb-h.json` `p3-*`. **1280·768·390 모두 PASS**.
- 390 실측 결과:
  - utility 2항목(로그인·고객센터)이 있다.
  - nav 슬롯 0, 시트·popover 0, 버튼 0, nav 랜드마크 0.
  - 보조 줄은 보이며(`data-always`), y 0~23.2에 있다. 바는 y 23.2에서 시작한다. 즉 **보조 줄 → 바** 순서다.
  - DOM 순서도 tier → bar로, 시각 순서와 같다.
  - 가로 넘침 0, 화면 밖 요소 0.
- 캡처 1장: `shots/p3-two-tier-nonav-390.png`(390×844, viewport).
  - ego `page.screenshot`을 2회 시도했으나 모두 `Page.captureScreenshot` CDP 시간 초과였다(`qb-h.json` `p3-shot-try1/2`).
  - 그래서 `shot-p3.sh`로 찍었다. 1b `shots.sh` 방식(Chrome headless · `_w390` iframe 래퍼 · 가운데 크롭)이며, 대상은 같은 문서의 정적 HTML이다.
- 위치는 승인된 정본(바 위) 그대로다. 구현 변경 0.

## 5. 번들 / 전체 suite
- 전체 vitest 1회: `npx vitest run --maxWorkers=4`(1b와 같은 플래그, 시작 시 load 9.2).
  - 결과: **191 파일 / 1744 테스트 통과, exit 0**, Errors·Unhandled 0. 근거 `logs/full-vitest.txt`.
  - 사전 예측: tests 1738 + 6 = **1744 → 일치**.
  - 파일 수 예측: 로그 머리에 적은 "190"은 내 오기다. 1b 기준 190 + 1 = 191이 맞다.
  - 기존 테스트 변경 0(skip/단언 약화 0). 추가는 `popoverFallback.test.ts` 6 it뿐이다.
  - P0 전체 suite 기준은 도출값이다. 앱 변경은 두 파일이고 추가 테스트는 6개이므로 1744 − 6 = **1738**이다. 이는 1b Jarvis 로그(`dev/active/m2b-1b/logs/jarvis-vitest-1.txt`, 190 파일 / 1738)와 일치한다. 전체 suite 1회 제약 때문에 baseline 전체는 따로 재실행하지 않았다.
  - 로그의 `Not implemented: Window's scrollTo()` 줄(212회)은 jsdom 알림이며 Errors가 아니다. 1b Jarvis 로그에도 210회 있다.
- gate:
  - `logs/p4-gate.txt` — 표적 src/kit + PageDocument 126, 가드 76, typecheck·lint·build 모두 exit 0.
  - P0 baseline `logs/p0-gate.txt`, P1 `logs/p1-gate.txt`.
  - P0 1회차에서 표적 3 실패가 있었다(`logs/p0-gate-run1-flaky.txt`). 당시 load 54였고, 단독 재실행에서 115/115 통과, 재게이트 OK였다. 그래서 부하 흔들림으로 판단했다. 이후 gate.sh가 FAIL 줄을 남기도록 고쳤다.
- 번들: `logs/bundle-diff.txt`(P0 대비 P4)
  | 항목 | baseline | 결과 | 예산 | 판정 |
  |---|---|---|---|---|
  | 렌더 JS | 81.13 | 81.13 | ≤ 89.70 | PASS |
  | 렌더 CSS | 7.12 | 7.13 | ≤ 30 | PASS |
  | /studio 진입 | 127.40 | 127.40 | ≤ 127.70 · 증가 ≤ 0.03 | PASS |
  | 다른 화면 | — | ±0 | ±0.03 | PASS |

## 6. Codex
- 명령: `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs review --scope branch --base c79bb65`
  - 실행 위치: worktree 루트
  - CODEX_HOME: Orca 범위 `…/orca/codex-accounts/1aae10b5-…/home`. Orca 터미널 환경 그대로이며, 부모 HOME 대체는 없었다.
- 실행 시각: `2026-10-05 03:22:14 KST` → `03:23:30 KST`.
- 결과: **exit 0**, thread `01a10826-fc3c-7791-a7a7-19b0332adea9`.
  - 로그 끝에 `Reviewer finished`·`Turn completed`·"# Codex Review" 본문이 있다. 전체 로그: `logs/codex.txt`.
- 검토 HEAD는 `f269053`이다. 코드 변경 전부와 P4 기록까지 포함한다. 이 REPORT 마감 커밋은 포함하지 않는다.
- **지적: P1 0건 · P2 0건.** 본문: "변경 사항에서 조치가 필요한 결함을 발견하지 못했습니다. CSS 폴백 분기와 기존 헤더 동작의 일관성을 확인했으며…"
- 한계:
  - Codex의 vitest 재실행은 Codex 읽기 전용 샌드박스에서 Vite 임시 파일을 쓰지 못해 실패했다(exit 1, Codex 자기 고지). 따라서 Codex 검토는 **정적 검토**다.
  - 테스트 근거는 이 레인의 실행 결과(5절)다.
  - 실행 횟수는 1회다. 재시도·adversarial은 하지 않았다.

## 7. 한계 / 2a gate
1. **실제 미지원 UA 미검증**이다(2.5). 모의는 "`selector()`는 알고 popover는 모르는 엔진" 계열만 대표한다.
   - `@supports selector()`를 모르는 엔진(Chrome < 83 · Safari < 14.1 등)도 미검증이다.
   - 단, 그 계열에서도 다음 두 동작은 `@supports`에 기대지 않고 게이트 밖 규칙만으로 정해진다(정적 판단, 미실측):
     - 버튼 숨김 = 기본값 none
     - burger 시트 미숨김 = 게이트 밖 규칙에 burger 숨김 없음
2. **footer 실제 링크 링은 미판정(BLOCKED)**이다(3.2). footer에 실제 링크를 둘지는 MQ-2 SPEC 결정과 킷 변경이 필요하다. 이는 Jarvis/영환님 몫이다.
3. 이번 판정은 Chromium(ego-browser) 한 엔진에서만 했다. WebKit·Gecko는 측정하지 않았다.
4. 브리프는 "각 커밋에 PROGRESS·REPORT 동기화"를 요구했다. 실제로는 `86e5e79`·`f6836e4`·`f269053`에서 PROGRESS만 갱신했고, 그동안 REPORT는 골격 상태였다. REPORT 본문은 `8913296`과 마감 커밋에서 채웠다. 이력은 재작성하지 않았다.
5. 2a gate:
   - 이 레인의 코드 변경은 `kit.css` 폴백 블록뿐이다.
   - 2a 자동 기동 0. 2a 기동 여부는 Jarvis 회수 판정 뒤 영환님이 결정한다.
   - 2a가 `kit.css`를 수정할 때 `popoverFallback.test.ts`가 폴백 구조를 지킨다.

## 8. 서버
- 기동(03:09):
  - 4337: `npx vite --host 127.0.0.1 --port 4337 --strictPort` — npm exec PID 80388, vite PID 80410, cwd `…/m2b-1b-hardening/app`
  - 4339: `python3 -m http.server 4339 --bind 127.0.0.1` — PID 80390, cwd `…/m2b-1b-hardening/dev/active/m2b-1b-hardening/static`
- 종료(03:26): 직전에 `lsof -a -p <PID> -d cwd`로 세 PID의 cwd를 다시 확인했고, 위와 같았다. 그 세 PID만 `kill`했다.
  - `ps -p 80410,80388,80390` → 출력 없음
  - `lsof -nP -iTCP:4337 -iTCP:4339 -sTCP:LISTEN` → **출력 없음(0줄)**
- main 5480: `lsof -nP -iTCP:5480 -sTCP:LISTEN` → `node 82062 127.0.0.1:5480 (LISTEN)`. 무접촉이며 종료·재시작하지 않았다.
- `pgrep`에 걸린 오케스트레이터 PID 53974(hermes-claude-orca, 인자에 포트 문자열 포함)는 이 레인이 띄운 서버가 아니므로 무접촉이다.
- ego-browser 작업 공간은 실행마다 `task.finish({ keep: [] })`로 닫았다. Chrome headless(`shot-p3.sh`)는 저장 뒤 자기 PID를 종료했다.
- push·merge·삭제 0. 2a 자동 기동 0.
