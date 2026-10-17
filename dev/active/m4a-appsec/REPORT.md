# M4-a-3 AppSec REPORT — 정적 zip 내보내기 보안 검토

대상 `k002bill2/m4a-appsec` = m4a-impl tip `a834eb88`. 검토자: Security(Claude Code, Opus 5.5). 2026-10-18.
범위: 로컬 코드·로컬 단위 테스트(vitest/jsdom)만. 외부 송신·네트워크 스캔 0. preview 미기동.
표기: [사실]=코드·실행으로 확인 · [추정] · [미확인].

## 판정

**PASS(머지 차단 없음) + Medium 2건 — 머지 전 Jarvis 판단 필요.** Critical/High 0.

- 근거: 퍼즈에서 생성기 방어층(`staticMarkup.ts`) 우회를 실증했으나, **사용자 문서 → 우회 마크업에 이르는 도달 경로를 찾지 못했다**(아래 "도달성"). 따라서 결함은 "헤더 주석·SPEC 4.1/4.2가 보장한다고 적은 규칙이 실제로 강제되지 않음"(방어 심층화 공백) = Medium.
- 도달 경로가 하나라도 생기면(렌더 문서 침해·raw HTML 슬롯·가져오기 검증 구멍) M-1은 내보낸 파일 열람 시 스크립트 실행 = High로 격상된다.

### 도달성 (판정의 핵심) [사실]
1. 마크업은 sandbox(`allow-scripts`, 불투명 출처) 렌더 iframe이 React로 그린 사이트 루트의 `outerHTML`(`render/serializeSite.ts:17-24`). 테스트 외 코드에 `dangerouslySetInnerHTML`·`setHTMLUnsafe` 0, 문서 값으로 태그명을 고르는 코드 0(grep). `innerHTML` 대입은 생성기 3곳(불활성 문서)뿐.
2. style 경로: 사이트 루트 `style` = `kitVars`(`kit/tokens.ts:25`) — 팔레트는 `isCssValue`(`render/protocol.ts:70` — `; { } < > " ' \` 금지), 글꼴 `type.family`는 `/^[\w -]+$/`, 나머지 숫자. 따옴표가 막혀 M-2 우회(따옴표 섞기)는 이 경로로 못 만든다. 무따옴표 `url(https://…)`은 본문 CSS 검사(`hasExternalCss`)가 잡는다.
3. 링크 `href`는 킷 링크(`#s-…`)만 — F-11이 그 밖을 실패시킨다.
4. [미확인] `readProject.ts`(프로젝트 파일 가져오기) → `validatePageDoc`가 신뢰 경계. 이번에 깊게 보지 않음(시간). 문서 값은 React 글자/속성으로만 나가므로 마크업 구조 주입은 [추정] 불가.

## 지적 (심각도순)

### M-1 (Medium) `<template>` 안은 정리·검사가 닿지 않음 → declarative shadow DOM으로 열람 시 활성화
- [사실] `clean()`·F-08~F-13 검사는 `querySelectorAll`을 쓰는데 `<template>` 내용(DocumentFragment)은 대상 밖이다. `outerHTML`은 그 내용을 그대로 직렬화한다.
- 퍼즈(`logs/fuzz-staticMarkup.txt` M12·M13, `-2.txt` M43): `<template shadowrootmode="open"><img src="https://evil.example/x" onerror="alert(1)"><script>alert(2)</script></template>` → **PASS(통과)**, 결과에 `onerror`·`<script>`·외부 `href`·`@import url(https://…)` 잔존.
- [사실(스펙)] `innerHTML` 파싱은 `shadowrootmode`를 처리하지 않아 생성기 문서에서는 비활성. [추정, 브라우저 미실측] 제3자가 파일을 열면 HTML 파서가 shadow root를 붙여 스크립트 실행·외부 요청. "script 0 · on* 0 · 외부 요청 0" 결과 규칙 위반.
- M14(일반 `<template>`, shadowrootmode 없음)는 열람 시에도 비활성 → Info.
- 패치(임시 적용 검증 완료 `logs/patch-clean-selector.txt`: M12·M13·M06·M41 전부 제거, staticHtml+zip 9 files / 116 tests 통과, 되돌림):
```diff
-  for (const el of site.querySelectorAll("script, iframe, object, embed")) el.remove();
+  for (const el of site.querySelectorAll("script, iframe, object, embed, template, animate, set, animateMotion, animateTransform")) el.remove();
```
  킷·렌더는 `<template>`를 쓰지 않는다 [사실 grep 0]. 회귀 테스트로 M12/M41 입력을 `staticMarkup.test.ts`에 추가 권고. (`animateMotion` 대소문자 선택자 일치는 [미확인] — 필요 시 `localName` 비교로.)

### M-2 (Medium) SVG `<animate>`/`<set>`로 URL 속성을 바꾸는 우회 — F-11·F-13 미강제
- [사실] 퍼즈 M06·M07(`<svg><a><animate attributeName="href" values="javascript:alert(1)"/>…`)·M41·M42(`<svg><image><set attributeName="href" to="https://evil.example/x"/>`) → PASS. F-13은 정적 속성만 본다(`staticMarkup.ts:89-101`).
- 영향: `javascript:` 경로는 브라우저의 SMIL href 애니메이션 차단 여부에 달림 [미확인]. 외부 `image href`는 열람 시 외부 요청 [추정].
- 패치: M-1과 같은 한 줄(위 diff)로 함께 해소(검증 완료).

### L-1 (Low) CSS `url()` 정규식이 따옴표 섞인 URL을 못 읽음 → F-10·F-13 우회 (본문 style·style 요소·킷 CSS)
- [사실] `CSS_URL = /url\(\s*(['"]?)([^'")]*)\1\s*\)/` — 따옴표 안에 다른 따옴표·`)`가 있으면 매치 자체가 실패해 검사 대상에서 빠진다. 퍼즈 M28·M29·M30·C06: `url("https://evil.example/a'b")`·`url('https://evil.example/a)b')` → PASS, 외부 URL 잔존.
- 도달성: 본문 style은 위 2번으로 사용자 경로 없음, 킷 CSS는 빌드 산출물 → Low(생성기 고정 입력). 단 M-1 수준의 "규칙 미강제"라 Medium과 묶어 고치기를 권고.
- 킷 CSS 쪽 추가 공백 [사실]: `@\69mport "…"`(C03)·`u\72l(…)`(C04)·`image-set("…")`(C05) → PASS. `assertNoExternalCss`는 `CSS_TRICK`을 쓰지 않는다. 킷 CSS에 `\` 금지를 그대로 넓히면 Tailwind 이스케이프 선택자(`.md\:x`)·`content:"\201C"`로 정상 빌드가 깨질 수 있다.
- 패치 제안(미검증): "`url(`·`image-set(`·`@import` 출현 수 = 엄격 패턴 매치 수, 다르면 실패" 또는 이스케이프 해석 후 검사.
```diff
-const CSS_URL = /url\(\s*(['"]?)([^'")]*)\1\s*\)/gi;
+const CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^'")\s]*))\s*\)/gi; // 값 = m[1] ?? m[2] ?? m[3]
+const countUrlOpen = (css: string) => (css.match(/url\(/gi) ?? []).length; // ≠ 매치 수 → 실패
```

### L-2 (Low) `09c4309d` — F-14 자체가 넓게 좁아짐(다른 검사는 영향 없음)
- [사실] 치환은 `assertNoBrand`의 로컬 사본(`fixed.map`)에만 적용 — F-10(`assertNoExternalCss`)·F-13(`hasExternalCss`)·F-11은 원본 문자열/DOM을 본다. 변이(09c4309d^로 되돌린 뒤 같은 54건, `logs/mutation-09c4309d.txt`): **바뀐 행은 B01·B03·B05·B06(브랜드)뿐**, M·C 행 결과 동일.
- [사실] 넓게 좁아진 부분: CSS 문자열·주석 안의 `url(data:…)` 모양(B03 `content:"url(data:apfs)"`, B06 `/* url(data:apfs) */`)에 든 브랜드도 통과. 대상이 생성기 고정 CSS라 Low.
- [사실] `url(data:image/svg+xml,…<image href=https://…><script>…)`(C08·M32)는 09c4309d 전후 동일하게 통과 — 원래 F-10이 `data:` 전체를 허용. CSS 이미지로 쓰인 SVG는 스크립트·외부 리소스가 막힌다 [추정, 미실측] → Info.
- [사실, Codex 재현·본 검토 재확인] 주석 경계 넘김: `/* url(data: */ .apfs-banner{color:red} /* ) */`는 무따옴표 분기 `[^'")]*`가 `)`까지 실제 규칙을 소비해 통과(09c4309d^는 거부). 치환이 notice·고정 스크립트에도 적용돼 notice 안 `url(data:…)` 모양도 통과.
- 패치 제안: 치환을 CSS 입력에만, `data:font/…;base64,` + base64 글자로 한정(공백·`*`·`{` 불가 → 주석 경계 못 넘음). 정규식 단독 검증(`logs/regex-09c-patch-check.txt`): Codex 입력·B03 → 검출, 실제 인라인 글꼴 → 통과. 앱 코드 적용·회귀 테스트는 Developer 몫.
```diff
-const CSS_DATA_URL = /url\(\s*(['"]?)data:[^'")]*\1\s*\)/gi;
+const CSS_DATA_URL = /url\(\s*(['"]?)data:font\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]*\1\s*\)/gi;
-function assertNoBrand(site: Element, fixed: readonly string[]) {
-  if ([...fixed.map((text) => text.replace(CSS_DATA_URL, "url()")), ...names].some(…))
+function assertNoBrand(site: Element, css: string, fixed: readonly string[]) {
+  if ([css.replace(CSS_DATA_URL, "url()"), ...fixed, ...names].some(…))   // 호출: assertNoBrand(site, css, [notice ?? "", STATIC_MENU_SCRIPT])
```

### L-3 (Low) zip 이름 범용 검사 `assertNames`가 허용표보다 약함 (현재 도달 불가) — 서브에이전트, 직접 확인
- [사실] `storeZip.ts` `BAD_NAME = /^\/|(^|\/)\.\.(\/|$)|\\|:|\/$/` — `a/./b`·`a//b`·Windows 금지 문자·끝 `.`/공백 통과. 현재 호출자 `zipSite.ts`는 앞서 `checkZipEntries` 허용표(`^assets/…$` 고정)를 거친다 → 도달 불가.
- 제안: `/^\/|(^|\/)\.{1,2}(\/|$)|\/\/|\\|[:*?"<>|]|[. ]$|\/$/`.

### L-4 (Low) zip DOS 시각이 로컬 시간대 의존 — 서브에이전트
- [사실] `dosDateTime`이 로컬 getter 사용, 입력 `new Date(head.updatedAt)`. 같은 revision이라도 시간대가 다르면 zip 바이트·`resultHash`가 달라진다. SPEC 2.4가 "로컬 시각"을 명시해 의도된 설계 — 결정성(Q6) 의도와 기기 간 충돌만 기록.

### L-5 (Low) SPEC 4.3 "LICENSES.md F-14" 미구현
- [사실] `zip/`에 브랜드 검사 0(grep `BRAND|assertNoBrand|brand` 0). 내용은 상수·숫자·고정 글꼴 계열뿐이라(아래 항목 5) 실제 위험 없음 — SPEC 불일치 기록.

### L-6 (Low) 다운로드 파일명 `exportFileStem` — 양방향 제어 문자·`con.x` — 서브에이전트
- [사실] U+202E 등 bidi·제로폭 문자 미제거, 예약 이름은 stem 전체 일치만(`exportFileName.ts`). 사용자 자기 제목이 자기 기기 표시에만 영향. 경로 문자·`..`는 제거돼 탈출 불가.

### Info
- I-1 참조 직렬화: 부모 → 렌더 `postMessage(…, "*")`(불투명 출처라 대상 출처 지정 불가). 렌더 문서가 먼저 침해된 뒤에만 의미.
- I-2 `noscript` mXSS(M33): jsdom에서는 이미지 규칙에서 실패. 실브라우저 `createHTMLDocument`(스크립팅 꺼짐)는 다르게 파싱하나, Chrome 138+/Firefox 140+는 속성 직렬화에서 `<`·`>`를 이스케이프 [미확인 — 브라우저 미실측].
- I-3 `ZIP_MAX`는 전부 메모리 적재·CRC 후 검사(사후). 상류 상한으로 도달 어려움 [추정].
- I-4 일반 `<template>`(M14) 잔존 — 열람 시 비활성.

## 항목별 결과

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | zip 작성기 | 통과 (L-3·L-4·I-3) | 이름은 전부 고정 규칙(사용자 입력 0) · 허용표 `^…$` · `..`·`/`·`\`·`:`·대소문자 중복·100자 차단 · 로컬/중앙 헤더 `writeCommon` 공유로 CRC·크기 정합 · 항목 ≥0xFFFF·4GiB throw · zip/staticHtml 115 tests 통과(서브에이전트 실행) |
| 2 | 금지 패턴 F-09~F-15 퍼즈 58건 | **Medium 2(M-1·M-2) · Low 1(L-1)** | `logs/fuzz-staticMarkup.txt`(54) · `-2.txt`(4). 이벤트 핸들러·`javascript:`(엔티티·널바이트)·`xlink:href`·foreignObject img·svg image·use data:·meta refresh·form/formaction·ping·poster·link·@import·url 이스케이프·image-set·srcdoc·object/embed는 차단/제거 확인 |
| 3 | `09c4309d` | Low(L-2) — 다른 검사 축소 0, F-14 자체 회귀(주석 경계·notice) | 변이 diff = B행만 · Codex 2회차 P2 재현 확인 |
| 4 | 참조 직렬화 | 통과 (I-1) | 부모 `event.source === frame.contentWindow`(`staticHtml.ts:61`) · 렌더 `event.source !== host.parent` 거부 · `Object.hasOwn(images, id)` = 그 문서 images 맵만 → 다른 Blob 끼워넣기 불가 · `idOf` 실패 = `image:undefined` → 이미지 규칙 실패(거짓 성공 0) · 잃은 이미지는 `lost`로 요약·LICENSES에 숫자 기록(설계) |
| 5 | LICENSES.md·OFL.txt | 통과 (L-5) | 고정 경로·숫자·`COPYRIGHT` 3계열 중 하나·상수 OFL 본문. 사용자 제목·설명 0(`licenses.test.ts:38` 단언). 코드 펜스 탈출 불가(OFL 본문 백틱 3개 0) |
| 6 | CSP/sandbox | 권고만 | 결과 HTML에 CSP meta 없음 [사실], SPEC에 CSP 요구 없음(grep `csp` 0 — sandbox는 렌더 iframe만, `EXPORT-SPEC.md:19`) |

### 항목 6 권고 (새 설계 아님 — 다음 SPEC 개정 후보)
- 생성기가 고정 CSP meta를 head에 넣으면 M-1·M-2·L-1이 열람 시점에 무력화된다: `default-src 'none'; script-src 'sha256-<STATIC_MENU_SCRIPT 해시>'; style-src 'unsafe-inline'; img-src data: assets/; font-src data: assets/; base-uri 'none'; form-action 'none'`.
- 단서: F-15가 `meta[http-equiv]`에서 실패하므로 생성기 고정 CSP meta는 예외로 둬야 한다. file://로 연 zip에서 상대 경로·`'self'` 매칭은 브라우저마다 다르다 [미확인]. meta CSP는 shadow root 안에도 적용된다.

## Codex adversarial-review

- 1회차(오발, 내 실수): `adversarial-review --help`를 옵션 확인용으로 실행 → `--help`가 focus 텍스트로 처리돼 **working-tree(당시 임시 퍼즈 파일)**를 리뷰. 지적 P2 1건(임시 테스트의 절대 경로 쓰기) — 파일 삭제로 해당 없음. 09c4309d와 무관.
- 2회차(의도한 실행, BRIEF 허용 1회를 오발로 소진해 1회 초과 — 3회차 없음): `adversarial-review --scope branch --base 09c4309d^ "<집중 문구>"`. 원문 `logs/codex-adversarial-09c4309d.txt`.
  - 판정 needs-attention. 요약: F-10/F-11/F-13은 원본 입력을 검사(축소 0 — 본 검토 변이 결과와 일치). SVG data URL 안 스크립트·외부 참조 통과는 이전 버전과 동일(실행 여부 미검증).
  - 지적 [medium][P2] `staticMarkup.ts:107-110`: `/* url(data: */ .apfs-banner{color:red} /* ) */` — 무따옴표 분기 `[^'")]*`가 주석 경계를 넘어 실제 규칙까지 소비해 F-14 통과(이전 버전은 거부). notice `Generated by url(data:Design Studio)`도 새로 통과(치환이 fixed 전부에 적용).
  - 수용: **사실로 확인**(`logs/regex-09c-patch-check.txt`). 심각도는 Low 유지 — 입력이 생성기 고정 CSS·고정 notice(빌드 산출물)라 공격자 경로가 없고, F-14는 브랜드 위생 통제다. L-2에 통합, 패치가 이 입력도 막는 것을 확인.

## 서브에이전트
- code-explorer 1개(읽기 전용, 항목 1·5·파일명) — 완료. 결과는 L-3·L-4·L-6·I-3·항목 1·5에 반영. 핵심 주장(BAD_NAME, licenses 입력)은 메인이 코드로 재확인.

## 남은 것 / 미확인
- 브라우저 실측 없음(M-1 열람 시 실행, M-2 SMIL 차단, I-2) — Ego Lite로 내보낸 파일 열기 1회면 확정 가능.
- `readProject.ts` 가져오기 경로 심층 검토 미실시.
