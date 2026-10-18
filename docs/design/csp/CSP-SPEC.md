# CSP-SPEC — 내보낸 HTML·zip 고정 CSP 명세 (B-SEC-04)

- 작성: Designer · 2026-10-18 · r0 (초안) · 2026-10-19 r1 (2단계 grep 확정 3건 · Codex adversarial 반영)
- 범위: 내보내기 산출물 3형식에 **생성기 고정 CSP**를 넣는 규칙. 형식별 정책 · 메뉴 스크립트 해시 · 렌더 불변 계약 · React zip 빌드 산출물 처리 · 수용 기준 · 테스트 계획 · 예산 · 설계 질문.
- 범위 밖: 앱 자체(`index.html`·`render.html`)의 CSP·배포 헤더(SEC REPORT I-6 — 별건) · PNG(리소스 로드 없음) · 마크업 검사(F-03~F-15) 완화. **CSP는 보조 방어**이며 마크업 검사를 대체하지 않는다(SEC REPORT 4절 "보장 범위").
- 정본: `dev/active/sec-readproject/REPORT.md` 4절(CSP 권고안·메뉴 스크립트 sha256) · `docs/design/m4a/EXPORT-SPEC.md` r1(4.1·4.2 금지 패턴, 7.1 EXP-AC) · `docs/design/m4b/REACTZIP-SPEC.md` r1(2.4 허용표, 4.1 충실도, 4.3 메뉴 리스너, 5.4 예산).
- 근거 표기: **[사실]** = 코드·문서·로컬 실행 직접 확인(L1) · **[추정]** = 코드 읽기·도구 동작 지식 기반 판단(L3, 외부 리서치 0) · **[미확인]** = 측정 필요.
- 이 레인은 명세만 — 앱 코드 변경 0 · 브라우저 실측 0. 실측은 CSP-AC-R*로 구현·QA 레인이 한다.

---

## 0. 현재 상태 (근거)

| 항목 | 현행 | 근거 |
|---|---|---|
| 생성기 | 정적 HTML·정적 zip 둘 다 `buildStaticHtml({…, target})` 하나 — `target`만 `"html"`/`"zip"` | [사실] `features/studio/staticHtml/staticMarkup.ts:138` · `zip/zipSite.ts:33-40` |
| head 조립 | `head.replaceChildren()` 뒤 순서 고정: `meta charset` → `meta viewport` → `title` → `meta description` → (글꼴 고지 주석) → `<style>` → `<script>` | [사실] `staticMarkup.ts:161-180` |
| 고정 스크립트 | `STATIC_MENU_SCRIPT` 196자 · ASCII · head `<script>` 1개 | [사실] `staticMarkup.ts:14-15` |
| 메뉴 스크립트 해시 | `sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg=` | [사실] 이 레인 재계산(아래 명령) = SEC REPORT 4절 값 = Codex 일치 확인 |
| F-15 | head에 `base`·`link`·`meta[http-equiv]`가 있으면 throw | [사실] `staticMarkup.ts:182` |
| F-13 | 본문(`[data-site-root]` 안) `link`·`base`·`meta` 0 | [사실] `staticMarkup.ts:114` |
| F-14 | 브랜드 검사 고정 목록 = `[notice, STATIC_MENU_SCRIPT]` | [사실] `staticMarkup.ts:159` |
| 루트 style | `<div data-site-root style={kitVars(…)}>` — 프로필마다 값이 다름 | [사실] `render/PageDocument.tsx:52` |
| 킷 style | `Media.tsx` `style: { aspectRatio }`(비율 있을 때) | [사실] `kit/Media.tsx:52` |
| 킷 SVG | 인라인 `<svg viewBox…>` — 외부 참조 0 | [사실] `kit/Media.tsx:39-41` · SEC REPORT 4절 |
| 폼 | `<form>`에 `action` 없음 · 입력·제출 버튼이 전부 `<fieldset disabled>` 안 → 제출 경로 0 | [사실] `kit/ContactForm.tsx:78,82,102,106` |
| 메뉴 시트 | 네이티브 `popover="auto"` · 여는/닫기 버튼 = `popoverTarget` · 시트 안 항목 = `<a href="#s-…">` | [사실] `kit/headerParts.tsx:16-26` |
| React zip `index.html` | 소스 템플릿: charset · viewport · title · description · `<script type="module" src="/src/main.tsx">` | [사실] `reactZip/templates.ts:12-25` |
| React zip `vite.config.ts` | `defineConfig({ plugins: [react(), tailwindcss()] })` — 허용표가 상수와 **바이트 동일** 검사 | [사실] `templates.ts:28-32` · REACTZIP-SPEC 2.4 |
| React zip 메뉴 | `MENU_LISTENER`가 `src/main.tsx`에 들어가 **번들된다**(인라인 스크립트 아님) | [사실] `templates.ts:46-53` · REACTZIP-SPEC 4.3 |
| 예산 분류 | `exportFlow.ts`·`reactZip/reactZip.ts` = `STUDIO_AFTER_ACTION`(판정 밖·크기만 출력) | [사실] `scripts/check-bundle-size.mjs:58-66` |
| 현행 CSP | 산출물 3형식 모두 CSP 0 | [사실] F-15가 막고 있음 · templates.ts에 없음 |
| 산출물 소비처 | `buildStaticHtml` 호출 = `staticHtml.ts:170`(html) · `zipSite.ts:33`(zip) 2곳뿐 · 앱 안 `srcdoc`·iframe 재로드 0 → CSP meta가 **앱 화면·PNG 캡처에 영향 0**(다운로드 파일에만 적용) | [사실] grep `buildStaticHtml(`·`srcdoc` |
| 킷 CSS의 `url()` | `kitCss` = `/render.html` 빌드 CSS. 빌드 산출물의 `url()`은 `@font-face` 6개(`/assets/*.woff2`)뿐 → 생성기가 `stripFontFaces`로 제거(`staticHtml.ts:168,170`). 킷 ts·tsx의 `style`에 `url(` 0 | [사실] 메인 checkout `app/dist/assets/render-ncA71k8b.css` grep · `src/kit` grep |
| 결과 해시 | `hex12(결과 바이트)`(`staticHtml.ts:174` · `reactZip.ts:148`) — meta 추가로 **값이 바뀐다**(같은 문서 전·후 비교 시 정상 차이) | [사실] |

해시 재계산 명령(이 레인, `app/`에서):
```bash
node --input-type=module -e 'import {readFileSync} from "fs"; import {createHash} from "crypto";
const m=readFileSync("src/features/studio/staticHtml/staticMarkup.ts","utf8").match(/export const STATIC_MENU_SCRIPT =\n  (.*);\n/);
const s=eval(m[1]); console.log(s.length, "sha256-"+createHash("sha256").update(s,"utf8").digest("base64"));'
# → 196 sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg=
```

---

## 1. 형식별 정책

### 1.0 공통 원칙

- **생성기 고정 문자열**: 정책은 형식별 상수 1개(문서 값 0 · 문서마다 바이트 동일). 생성기가 런타임에 조립·계산하지 않는다.
- **`default-src 'none'`에서 시작해 쓰는 리소스만 연다** — 아래 각 표의 "근거(쓰는 리소스)" 열이 없는 지시어는 넣지 않는다.
- meta CSP가 무시하는 지시어(`frame-ancestors`·`report-uri`·`report-to`·`sandbox`)는 넣지 않는다 [사실 SEC REPORT 4절].
- `form-action 'none'`: 킷 폼은 제출 경로가 없다([사실] 0절 폼 행) → 동작 변화 0. 나중에 문의 폼 전송 기능이 생기면 그때 이 지시어를 다시 정한다(PRD 백엔드 미정).
- `base-uri 'none'`: `<base>`는 F-13·F-15가 이미 막는다 — 열람 시점 이중 방어.

### 1.1 정적 HTML 1개 (`static-html`, `target: "html"`)

| 지시어 | 값 | 근거(쓰는 리소스) |
|---|---|---|
| `default-src` | `'none'` | 그 밖 네트워크 0(connect·frame·media·object·worker·manifest) [사실 SEC REPORT 4절] |
| `script-src` | `'sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg='` | head 인라인 `<script>` 1개 = `STATIC_MENU_SCRIPT` |
| `style-src` | `'unsafe-inline'` | head `<style>`(킷 CSS + 글꼴 `@font-face`, 문서마다 다름) · 루트 `style`(`--site-*`) · `Media` `style`(aspect-ratio) |
| `img-src` | `data:` | `<img src="data:image/(webp\|jpeg\|png);base64,…">`만(생성기 규칙) |
| `font-src` | `data:` | `@font-face src: url(data:font/woff2;base64,…)` |
| `base-uri` | `'none'` | — |
| `form-action` | `'none'` | — |

상수(1줄):
```
default-src 'none'; script-src 'sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg='; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'
```

- `style-src 'unsafe-inline'`이 불가피한 이유: head `<style>`은 글꼴 data URL이 문서마다 달라 해시하려면 **런타임 계산**이 필요하고(1.0 위반), 루트 `style` 속성 값도 프로필마다 달라 `'unsafe-hashes'`도 같은 문제다 → 채택하지 않는다. 위험 평가: 인라인 CSS가 낼 수 있는 요청은 `img-src`·`font-src`가 `data:`로 묶으므로 외부 요청 0.
- `'self'` 미사용 → `file://` 출처 해석과 무관(단일 파일안의 장점) [사실 SEC REPORT 4절].

### 1.2 정적 zip `index.html` (`static-zip`, `target: "zip"`)

| 지시어 | 값 | 근거(쓰는 리소스) |
|---|---|---|
| `default-src` | `'none'` | 1.1과 같음 |
| `script-src` | 1.1과 같은 해시 | 같은 `STATIC_MENU_SCRIPT`(같은 `buildStaticHtml`) |
| `style-src` | `'unsafe-inline'` | head `<style>`(킷 CSS + `@font-face src: url(assets/fonts/…)`) · 루트·`Media` `style` · ★ `assets/site.css`로 분리하지 않음(EXPORT-SPEC Q4) |
| `img-src` | `'self'` | `<img src="assets/images/img-NN.ext">` · `data:` 불필요(1.2.1) |
| `font-src` | `'self'` | `@font-face url(assets/fonts/<Family>-<weight>.woff2)` · `data:` 불필요(1.2.1) |
| `base-uri` · `form-action` | `'none'` | — |

상수(1줄):
```
default-src 'none'; script-src 'sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg='; style-src 'unsafe-inline'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'
```

#### 1.2.1 zip에 `data:`가 필요한가 — **불필요 [사실, r1 확정]**

- 생성기 규칙상 zip의 `img src`는 `assets/images/…`만이다([사실] `staticMarkup.ts:34` `ZIP_IMAGE`). 그러나 CSS 검사는 zip에서도 `data:`를 허용한다(`assertNoExternalCss:51` — `data:` 또는 `assets/fonts` · 본문 CSS `:108` — `data:`만).
- 확인 결과: 킷 CSS의 `url()`은 `@font-face`뿐이고 생성기가 지운다 · 킷 `style`에 `url(` 0 · zip 글꼴은 `assets/fonts` 파일(0절). → zip 산출물에 `data:` 리소스 0 → **zip 정책에서 `data:`를 뺀다.**
- 남는 위험 = **검사와 CSP의 어긋남**: 나중에 킷 CSS·`style`에 `url(data:…)`가 생기면 마크업 검사는 통과하고 CSP가 조용히 막아 zip 화면만 달라진다. → CSP-AC-11이 zip `index.html`의 `data:` 0을 단언해 그 시점에 테스트가 실패하게 한다(그때 이 절을 개정).

#### 1.2.2 `'self'`의 한계 (SEC REPORT 4절 승계)

- HTTP(S) 게시 시 `'self'`는 같은 출처 **전체**를 허용 → zip은 마크업 검사가 주 방어. CSP는 다른 출처 요청만 막는다.
- `file://`로 연 폴더에서 `'self'` 매칭은 브라우저마다 다르다 [미확인 — 외부 리서치 0]. 안 맞으면 zip 이미지·글꼴이 막힌다.
  - 판정 기준 = 로컬 웹서버(`python3 -m http.server`, EXP-AC-R1·R2 경로). `file://`은 관찰 항목(EXP-AC-R1b와 같은 성격).
  - EXPORT-SPEC Q19 A(Chromium `file://` 글꼴 로드 확인)는 **CSP 없는 상태의 측정**이다 → CSP 적용 뒤 재측정한다(CSP-AC-R3). Chromium `file://`에서 막히면 CQ-03으로 간다.

### 1.3 React zip (`react-zip`) — 소스 `index.html` · 빌드 산출물 `dist/index.html`

#### 1.3.1 meta를 어디에 넣나 — 소스 `index.html`에 넣지 않는다

- 소스 `index.html`은 `npm run dev`(Vite dev 서버)와 `npm run build` 둘 다의 입력이다.
- dev 서버는 [추정 — Vite·plugin-react 동작 지식, 외부 리서치 0]: ① `@vitejs/plugin-react`가 react-refresh 프리앰블을 **인라인 모듈 스크립트**로 index.html에 주입 ② CSS를 JS가 `<style>` 요소로 주입 ③ HMR이 같은 호스트 WebSocket(`ws:`) 연결 ④ `/@vite/client` 등 모듈. → 빌드용 정책(`script-src 'self'` · `connect-src` 없음)을 소스에 넣으면 dev에서 프리앰블·HMR이 막혀 **`npm run dev`가 깨진다**.
- ★ 규칙(CQ-04 A): `vite.config.ts` 템플릿 안 **인라인 plugin 객체 1개**가 **build에서만** `dist/index.html` head 맨 앞에 meta를 주입한다.

```ts
// vite.config.ts 템플릿 (모양 — 구현이 확정)
const CSP = "<1.3.2 상수>";
const csp = {
  name: "site-csp",
  apply: "build",
  transformIndexHtml: () => [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CSP }, injectTo: "head-prepend" }],
};
export default defineConfig({ plugins: [react(), tailwindcss(), csp] });
```

- 새 패키지 0 → `package.json`·`package-lock.json` 불변 · 앱 새 의존성 0. CSP 플러그인 패키지를 쓰는 안은 새 의존성이라 채택하지 않는다(쓰려면 사용자 질의).
- API 이름 [사실, r1 확인]: React zip이 고정하는 `vite` 8.3.1(`reactZip/licenses.ts:18` · 앱 `package.json:40`과 같은 버전)의 `dist/node/index.d.ts` — `apply?: "serve" | "build" | …`(:2208) · `injectTo?: "head" | "body" | "head-prepend" | "body-prepend"`(:1962) · `assetsInlineLimit?:`(:2845). 확인 위치 = 메인 checkout `app/node_modules`(이 worktree는 `node_modules` 없음). `transformIndexHtml` 반환 형태(태그 배열)는 구현이 타입으로 한 번 더 확인한다.
- `head-prepend`는 meta를 charset 앞에 둔다. charset 선언은 문서 첫 1024바이트 안이면 되고 CSP meta는 약 200B라 문제없다 [추정]. 핵심 조건은 **Vite가 head에 넣는 `<script type="module">`·`<link rel="stylesheet">`보다 앞**이다.
- dev 서버 영향: `apply: "build"`라 0. `vite preview`는 `dist/`를 그대로 서빙 → **preview에는 CSP가 걸린다**(충실도 대조 4.1 B가 CSP 아래에서 돈다 — 3.2).

#### 1.3.2 빌드 산출물 정책

| 지시어 | 값 | 근거(쓰는 리소스) |
|---|---|---|
| `default-src` | `'none'` | 런타임 네트워크 0(site.json·이미지 URL은 번들·정적 파일) |
| `script-src` | `'self'` | Vite가 내는 `/assets/index-<hash>.js`(외부 파일) · 메뉴 리스너는 그 안에 번들 → **해시 불필요** · 인라인 스크립트 0 [추정 → CSP-AC-C1이 확인] |
| `style-src` | `'self'` | `/assets/index-<hash>.css`(Tailwind + 킷 CSS + fonts.css). React `style` prop은 CSSOM으로 적용 → 인라인 style 속성 정책 대상 아님 [추정 → CSP-AC-C1 위반 0 실측]. 위반 나오면 CQ-05 B |
| `img-src` | `'self' data:` | `import.meta.glob(…?url)` 이미지 URL. Vite 기본 `assetsInlineLimit`(작은 파일 data: 인라인)가 작은 이미지를 `data:`로 바꿀 수 있다 [추정] → CQ-06 |
| `font-src` | `'self'` | `fonts.css` `./assets/fonts/*.woff2`(서브셋 ≥ 170KB라 인라인 한도 밖 [추정]) |
| `base-uri` · `form-action` | `'none'` | — |

상수(★안 기준, 1줄):
```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'
```

- `'self'` + `file://`: React zip은 원래 `file://`로 열 수 없다(모듈 스크립트) [추정] — `vite preview`·웹서버 게시만 대상이라 1.2.2의 `file://` 문제 없음.
- 하위 경로 게시(base `/` 고정)는 CSP와 무관한 기존 조건 — 범위 밖.
- Vite modulepreload polyfill: 단일 엔트리면 preload 링크가 없거나 최신 브라우저에서 no-op [추정]. 막혀도 모듈 import는 동작 — `connect-src`는 열지 않는다.

---

## 2. 메뉴 스크립트 해시

### 2.1 규칙 — 상수 옆 고정 + 대조 테스트 (런타임 계산 금지)

- `staticMarkup.ts`의 `STATIC_MENU_SCRIPT` **바로 아래**에 `STATIC_MENU_SCRIPT_HASH = "sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg="`를 두고, 정책 상수 2개(`STATIC_CSP_HTML`·`STATIC_CSP_ZIP`)는 이 값을 **템플릿 리터럴로 이어 붙인 상수**로 만든다(모듈 평가 시 1회 · 문서 값 0 · 해시 계산 0).
- 생성기는 `crypto.subtle`을 부르지 않는다 — 비동기화·실패 경로·예산 증가를 만들지 않는다.
- 스크립트를 고치면 해시 상수를 손으로 갱신해야 한다. 잊으면 **대조 테스트가 실패**한다(CSP-AC-03·04). 테스트는 Node `crypto`로 계산한다(테스트 코드만).

### 2.2 대안 비교 — 메뉴 스크립트를 없애고 `script-src 'none'`

| 기준 | A ★ 해시 고정 | B 스크립트 제거(HTML popover만) |
|---|---|---|
| 동작 | 현행 그대로: 시트 안 항목 클릭 → 앵커 이동 + 시트 닫힘 | `popovertarget`(·`popovertargetaction`)은 **버튼에만** 붙는다 [사실(스펙) · 시트 항목 = `<a href>` `headerParts.tsx`]. 시트 안 클릭은 light dismiss 대상이 아니다 → **이동 + 닫힘을 HTML만으로 동시에 만들 수 없다** |
| B의 변형 | — | B1 항목을 `<button popovertarget popovertargetaction="hide">`로 → 닫히지만 **이동 0**(기능 손실) · B2 앵커 유지 → 390 폭에서 열린 시트(top layer)가 목적지를 덮음 · B3 `:target` CSS 시트로 교체 → popover의 Esc·포커스 복귀·top layer 접근성 손실 |
| 영향 범위 | 생성기 청크 상수 2~3개 | 킷 DOM 변경 = 렌더·PNG·정적 내보내기·React zip 공용(REACTZIP 4.1 DOM 동일 계약 재기준) |
| CSP 강도 | 해시 1개(그 196자만 실행) | `script-src 'none'` |
| 유지 비용 | 스크립트 수정 시 해시 갱신(테스트가 강제) | 없음 |

- **★ A.** B의 이득(해시 1개 → 0)은 작고, 손실(메뉴 동작 또는 접근성)은 사용자 흐름 우선순위(CLAUDE.md 규칙 3)에 걸린다. 해시는 그 196자 외 모든 인라인·외부 스크립트를 막으므로 공격면 차이는 사실상 0 [추정].
- 재검토 조건: 킷이 메뉴를 바꿔 시트 안 항목이 앵커가 아니게 되면 B를 다시 본다(CQ-02).

---

## 3. 렌더 결과 불변 계약

### 3.1 정적 HTML·정적 zip

| 층 | 계약 | 정규화 |
|---|---|---|
| head | CSP 적용 전(현행 base `2531ebf8`) 출력에서 `meta[http-equiv]` 1개를 **지우면 바이트 동일** | 그 meta 요소 1개 제거 외 0 |
| 본문 | `[data-site-root]` outerHTML 바이트 동일(head와 무관) | 0 |
| 스크립트 | `<script>` = 1개 · textContent = `STATIC_MENU_SCRIPT` · **다시 파싱한** textContent의 sha256 = 정책 안 해시 | 0 |
| 픽셀(R) | 같은 문서를 CSP 전·후 생성 → 같은 브라우저·같은 폭(1280·390)에서 첫 화면 스크린샷 **바이트 동일** 목표 · 다르면 원인 판정(원인 미상 = 실패) — REACTZIP RZQ-08 A 기준 승계 | `document.fonts.ready` 뒤 · `prefers-reduced-motion` 또는 모션 끝난 뒤 |
| 위반(R) | 로드 · 메뉴 열기 · 시트 항목 클릭 · Esc 동안 **CSP 위반 0** | 수집 방법 = `securitypolicyviolation` 이벤트 기록 또는 콘솔 — QA 레인 확정(ego-browser) |

- meta 위치(★ CQ-01 A): `meta charset` **바로 다음 2번째**. charset·viewport·title·description은 리소스를 가져오지 않으므로 그 앞에 둬도 적용 공백이 없다 [추정]. 지켜야 할 조건 = `<style>`·`<script>`보다 앞. charset을 1번째로 유지해 문자 인코딩 판정을 바꾸지 않는다.
- F-15 개정: "head의 `meta[http-equiv]` = **정확히 1개**, 값이 그 `target`의 정책 상수와 문자 동일, 위치 = head 두 번째 자식. 그 밖 `meta[http-equiv]`·`base`·`link` = throw." 본문 `meta`는 F-13이 이미 막는다(변경 0).
- F-14: 정책 상수 2개를 `assertNoBrand` 고정 목록에 추가(브랜드 문자열 0 — 상수에 없음 [사실]).
- F-07(고정 스크립트 외 script 0) 불변 — 해시는 F-07을 대체하지 않는다.

### 3.2 React zip

- REACTZIP-SPEC 4.1 계약(DOM `[data-site-root]` 문자 동일 · 배치 차이 0 · 픽셀 바이트 동일 목표)을 **그대로 승계**한다. 비교 B(`npm ci && npm run build` → `vite preview`)에 CSP가 걸린 상태로 돈다 → 별도 비교 축을 만들지 않고 **기존 대조가 CSP 아래에서도 통과**하는 것이 계약이다. 추가 조건 = 같은 시나리오 동안 CSP 위반 0(CSP-AC-C1·R4).
- `dist/index.html` 계약: `meta[http-equiv=Content-Security-Policy]` 1개 · head 첫 자식 · content = 1.3.2 상수 문자 동일 · 인라인 `<script>`(src 없음) 0 · 외부 출처 URL 0.
- 소스 `index.html`(zip 안 entry)은 **불변**(meta 0) — dev 서버 영향 0의 근거.
- SSR 단위 대조(REACTZIP 4.1 RZQ-12 A)는 head를 보지 않으므로 영향 0.

---

## 4. 수용 기준 · 테스트 계획 · 예산

### 4.1 수용 기준 (U = 단위·오프라인 · C = 로컬 Linux 컨테이너 빌드(RZQ-10 B) · R = 실화면 build+preview, ego-browser)

| ID | 구분 | 기준 |
|---|---|---|
| CSP-AC-01 | U | `static-html` 결과 head: `meta[http-equiv="Content-Security-Policy"]` 정확히 1개 · head 두 번째 자식(charset 다음) · content = `STATIC_CSP_HTML` 문자 동일 |
| CSP-AC-02 | U | `static-zip` `index.html`: 같은 조건 · content = `STATIC_CSP_ZIP` |
| CSP-AC-03 | U | `STATIC_MENU_SCRIPT_HASH` = Node `crypto` sha256(`STATIC_MENU_SCRIPT`, utf8) base64 — 상수 대조 |
| CSP-AC-04 | U | 최종 HTML 문자열을 **다시 파싱**해 얻은 유일 `<script>` textContent의 sha256이 CSP content 안 `'sha256-…'` 값과 일치(html·zip 각 1) — 직렬화 차이를 잡는다 |
| CSP-AC-05 | U | RED 확인: `STATIC_MENU_SCRIPT`를 1글자 바꾼 사본으로 03·04 판정 함수를 돌리면 실패(테스트가 해시 불일치를 잡는다는 증거) |
| CSP-AC-06 | U | F-15 개정: head에 두 번째 `meta[http-equiv]`(refresh 등) 주입 · CSP content 1글자 변경 · 위치 변경 → 각각 throw. 정상 1개 = 통과 |
| CSP-AC-07 | U | 불변: 기준 픽스처(현행 생성기 출력)에서 CSP meta 1개를 지운 결과와 새 출력이 바이트 동일 — html·zip, 기존 정적 HTML 테스트 문서 전부 |
| CSP-AC-08 | U | 정책 상수 형식: `default-src 'none'` 시작 · 지시어 집합 = 1절 표와 정확히 같음 · `'unsafe-eval'` 0 · `script-src`에 `'unsafe-inline'` 0 · `http:`·`https:`·`*` 0 · 브랜드 문자열 0(F-14) |
| CSP-AC-09 | U | React zip `vite.config.ts` entry = 새 템플릿 상수 바이트 동일(REACTZIP 2.4 행 갱신) · 그 안 CSP 문자열 = `REACT_ZIP_CSP` 상수 · `apply: "build"` 포함 · 소스 `index.html` entry에 `http-equiv` 0 |
| CSP-AC-10 | U | 예산: `check-bundle-size` `/studio` 진입·auto 증분 0 · 렌더 JS 90KB·CSS 30KB 판정 불변 · REACTZIP 5.4 진입 정적 클로저 검사(생성기 표식 0) 통과 |
| CSP-AC-11 | U | zip `index.html`: head `<style>`·`style` 속성·`img src`에 `data:` 0 — zip 정책(`data:` 없음)과 마크업 검사 허용 범위의 어긋남을 잡는다(1.2.1) |
| CSP-AC-C1 | C | React zip 산출물 `npm ci && npm run build` 성공 → `dist/index.html`: CSP meta 1개 · head 첫 자식 · 인라인 `<script>` 0 · `vite preview`에서 로드·메뉴 시나리오 CSP 위반 0(컨테이너 headless 또는 R4로 대체) |
| CSP-AC-C2 | C | `npm run dev` 기동 → 첫 화면 렌더·HMR 동작(dev 영향 0 확인) · dev HTML에 CSP meta 0 |
| CSP-AC-R1 | R | 정적 HTML(경로 A 문서 — 모던 카페+보정값 v2+새로 시작)을 CSP 전·후로 생성 → 1280·390 첫 화면 스크린샷 바이트 동일(3.1 픽셀) · 위반 0 |
| CSP-AC-R2 | R | 정적 zip을 `python3 -m http.server`로 열어 R1과 같은 조건 · 네트워크 = 같은 출처 `assets/*`만 · 404 0 · 위반 0 |
| CSP-AC-R3 | R(관찰) | 정적 zip을 `file://`로 열어 이미지·글꼴 적용 여부 기록(Chromium 필수 · Safari·Firefox 가능하면). Chromium에서 막히면 CQ-03 판정 |
| CSP-AC-R4 | R | React zip `vite preview`(390): 햄버거 메뉴 열기 → 항목 클릭 → 시트 닫힘 + 앵커 이동 · 위반 0 · REACTZIP 4.1 대조 통과 |
| CSP-AC-R5 | R | 390 정적 HTML·zip에서 같은 메뉴 시나리오 — 해시가 맞아 스크립트가 실행됨(시트 닫힘)을 확인. 해시 불일치면 시트가 안 닫힌다 = 실패 |

### 4.2 테스트 계획

1. **RED 먼저**(TDD): CSP-AC-01·02·03·04·06·08·09 테스트를 쓰고 실패를 확인한다(현행 출력에 meta 0 · 해시 상수 없음 · F-15가 meta를 throw).
2. **AC-05 RED-GREEN**: 해시 판정을 순수 함수(`scriptHashOf(text)` 테스트 헬퍼 — Node `crypto`)로 두고, 바꾼 스크립트로 실패 · 원문으로 통과를 같은 테스트 파일에서 보인다.
3. **AC-07 기준 픽스처**: 구현 커밋 **전** base에서 대표 문서 출력(html·zip)을 테스트 안에서 재현할 수 있게 입력을 고정하고, "meta 제거 후 = 기존 기대값"을 기존 테스트 기대값 재사용으로 표현한다(새 스냅샷 파일 대신 기존 단언 유지 + meta 제거 헬퍼) [추정 — 구현이 형태 확정].
4. **깨질 기존 테스트(예상 — 파일 기준 grep [사실], 실패 여부는 구현 때 확인)**:

| 파일 | 이유 |
|---|---|
| `features/studio/staticHtml/staticMarkup.test.ts` | [사실] `:242` `meta http-equiv="refresh"` 주입 → throw 단언 — **유지**(refresh는 개정 F-15에서도 throw). head 구조·순서 단언이 있으면 CSP meta 1개만큼 갱신 |
| `features/studio/staticHtml/staticHtml.test.ts` | [사실] head 관련 단언 있음(grep `head`) · 결과 해시(`hex12`) 고정값 단언이 있으면 갱신 |
| `kit/bodyVariants2a/2b/2c.test.tsx` · `heroVariants.test.tsx` · `boundVariants.test.tsx` | `buildStaticHtml` 결과의 script 단언 — script 단언 자체는 불변, head·meta 개수 단언이 있으면 영향 [추정] |
| `features/studio/zip/staticZip.test.ts` | [사실] head 관련 단언 있음(grep `head`) — `index.html` 내용 |
| `features/studio/reactZip/checkReactZipEntries.test.ts` · `template.test.ts` · `reactZip.test.ts` | `vite.config.ts` 바이트 동일 상수 변경 |

5. **C 레인**: REACTZIP 7a(RZQ-10 B)대로 docker `node:22`에서 `react-zip-build`를 **다시 실행**(vite.config.ts가 바뀌었으므로 이전 C1 결과는 증거 불인정) → `dist/index.html` 검사 + dev 기동 확인 로그를 PROGRESS에 남긴다.

### 4.3 예산 영향

- 새 문자열: 정책 상수 3개(각 약 120~200자) + 해시 상수 1개 → gzip 수백 B [추정].
- 위치: 정적 상수 2개·해시 = `staticMarkup.ts`(생성기 청크 — `memoryDocBook`이 처음 쓸 때 import, 진입 밖) · React zip 상수 = `reactZip/templates.ts`(`reactZip.ts` 청크, `STUDIO_AFTER_ACTION`).
- **`/studio` 진입 증분 0 · auto 증분 0 · 렌더 문서(90KB) 0**(렌더 문서는 생성기를 import하지 않는다 [추정 — 구현 시 `check-bundle-size` 출력으로 확인]). 진입이 +0.01이라도 나오면 멈추고 개정 상신(EXPORT-SPEC 8a 예산 조건 승계).
- 산출물 크기: html·zip `index.html` +약 250B · React zip `vite.config.ts` +약 400B — `ZIP_MAX`·3MB 안내 판정 영향 무시 가능.

### 4.4 개정이 필요한 정본 (구현 PR에서 함께)

- EXPORT-SPEC 4.1 F-15 행("CSP meta 1개 예외") · F-07 행(해시 언급) · 7.1에 CSP-AC 참조 1줄.
- REACTZIP-SPEC 2.4 `vite.config.ts` 행(바이트 동일 상수 = CSP plugin 포함 템플릿) · 2.1 트리 주석 · 5.1 RZ-AC-C1 재실행 조건.
- `staticMarkup.ts` 머리 주석의 "결과 규칙" 줄(CSP meta 1개 추가).

---

## 5. 설계 질문 (★ = 권장)

| # | 질문 | 선택지 | ★ |
|---|---|---|---|
| CQ-01 | 정적 HTML·zip meta 위치 | A charset 다음 2번째 · B head 첫 자식(charset 앞) | **A** — 리소스를 부르는 `<style>`·`<script>`보다 앞이면 공백 0 · charset 1번째 유지 |
| CQ-02 | 메뉴 스크립트 처리 | A sha256 고정 + 대조 테스트 · B 스크립트 제거(popover만) | **A** — 2.2: B는 이동+닫힘 동시 불가 · 킷 DOM 공용 변경 |
| CQ-03 | 정적 zip `'self'`가 `file://`에서 막힐 때(CSP-AC-R3) | A zip은 웹서버 열람 기준 유지 + `file://` 제약을 LICENSES/결과 안내 대신 **관찰 기록**만 · B zip 정책에 `file:` scheme 추가 · C zip은 CSP 제외(html만) | **A**(Chromium 통과 시 질문 소멸). Chromium에서 막히면 **C**로 전환 — 현행 동작(EXPORT-SPEC Q19 A `file://` 글꼴 로드)을 깨지 않는 쪽. B는 로컬 파일 전체 허용이라 비채택 |
| CQ-04 | React zip CSP 주입 위치 | A `vite.config.ts` 인라인 plugin(`apply: "build"`) · B 소스 `index.html`에 meta 직접 · C React zip은 CSP 없음 + README에 서버 헤더 권고 | **A** — dev 영향 0 · 새 의존성 0 · 산출 `dist`에 고정. B는 dev 서버를 깬다 [추정 1.3.1] |
| CQ-05 | React zip `style-src` | A `'self'`(React style = CSSOM) · B `'self' 'unsafe-inline'` | **A** — CSP-AC-C1·R4 위반 0이면 확정, 위반 1건이라도 나오면 B로 바꾸고 기록 |
| CQ-06 | React zip 작은 이미지의 `data:` 인라인 | A `img-src 'self' data:` 유지 · B 템플릿에 `build.assetsInlineLimit: 0` 추가 후 `img-src 'self'` | **A** — 템플릿 변경 최소 · 이미지 `data:`는 외부 요청이 아니다 |
| CQ-07 | 구현 순서 | A html·zip·React zip 한 PR · B html 먼저(실측 위험 0), zip·React zip은 R3·C1 실측 뒤 | **B** — html은 `'self'`·빌드 도구 [미확인]이 없다. zip·React zip은 실측 결과로 CQ-03·05 확정 후 |
| CQ-08 | zip 정책의 `data:`(1.2.1) | A `data:` 없음 + CSP-AC-11 가드(어긋나면 테스트 실패 → 그때 개정) · B zip 생성기 검사도 `data:`를 거부하도록 좁힘(F 규칙 개정) · C 미래 대비로 `data:`를 미리 연다 | **A** — 쓰지 않는 리소스는 열지 않는다(1.0) · B는 마크업 검사 개정이라 이 레인 범위 밖(필요해지면 별건) |

### 5.1 사용자 질의 대상 (예산 상향 · 엔진 계약 · 새 의존성 · 백엔드)

| # | 묻는 내용 | 이유 |
|---|---|---|
| — | 없음 | 예산: 진입·auto·렌더 증분 0(4.3) · 엔진 계약(`engine/contracts/*`) 변경 0 · 새 의존성 0(CSP plugin = vite.config 인라인 객체, CQ-04 A) · 백엔드 0 |

- 조건부: 진입 실측 > 0 → 개정 상신 · CQ-04에서 플러그인 패키지 안으로 가야 하면 새 의존성 질의 · 문의 폼 전송 기능(백엔드)이 생기면 `form-action` 재결정.

---

## 6. 출처·관찰 기록

- 외부 리서치 0. 브라우저·Vite 동작 서술 중 코드로 확인하지 않은 것은 전부 [추정]/[미확인]으로 표시했다.
- 로컬 확인: 해시 재계산(0절 명령) · `staticMarkup.ts`·`zipSite.ts`·`templates.ts`·`headerParts.tsx`·`ContactForm.tsx`·`Media.tsx`·`render/PageDocument.tsx`·`check-bundle-size.mjs` 읽기.
- Codex adversarial-review 1회(2026-10-19, `--scope branch --base 2531ebf8`, r1 `c0441256` 대상): **verdict approve · No material findings**. 검토 범위 = 리소스 허용 범위·재파싱 해시 검증·build 전용 주입·회귀 AC(코드 대조). 빌드·브라우저 실측은 하지 않음 → CSP-AC-C*·R*가 구현·QA 레인 몫으로 남는다.
- r1 이후 추가: CQ-08(zip `data:` 결정) — Codex 대상 커밋 뒤 표 1행 추가, 정책 값 변경 0.
