# CSP-APP REPORT — 앱 배포 헤더(Vercel) CSP·nosniff

브랜치 `k002bill2/csp-headers` · base `b2330fd0` · 근거: 보안 감사 2026-10-18 F-02 · `dev/active/sec-readproject/REPORT.md` I-6 · `docs/design/csp/CSP-SPEC.md:5`(앱 CSP는 별건)

## 결론
- `app/vercel.json`에 규칙 2개(앱 `/((?!render\.html$).*)` · 렌더 `/render.html`)를 두었다. 1단계는 **Report-Only**다. 강제 전환은 아래 "강제 전환 조건"을 충족한 뒤 한다.
- 강제 모드로 로컬 실측한 결과, 기능 회귀는 0이었다. 남은 위반은 모두 기능에 영향이 없다(아래 표).

## 사실 확인 (2026-10-30)
- Vercel 루트 디렉터리 = `app`: 브랜치 프리뷰 응답에 새 헤더가 붙은 것으로 확인했다(`/`·`/render.html`·`/assets/*.js` 규칙 분리 정상).
- 기존 프리뷰는 모든 응답에 `Access-Control-Allow-Origin: *`를 보낸다(Vercel 기본값) → `vercel.json`에서 ACAO를 설정하지 않는다(값이 2개면 불투명 출처 iframe 모듈 CORS 실패). 가드: `app/src/test/vercelHeaders.test.ts`.
- 프리뷰는 Vercel Authentication 뒤에 있다(비로그인 curl은 302). 확인은 로그인된 ego-browser로 했다.

## 실측 — 강제 모드 (Ego Lite · 로컬 서버가 `dist`를 `vercel.json` 헤더로 서빙, Report-Only 키를 `Content-Security-Policy`로 바꿈 + ACAO `*`)
경로: 모던 카페 A v1 → 보정값 v2 → B안 새로 시작 → SEO 입력 → 게이트 통과(이동은 앱 안 클릭만).
수집: `securitypolicyviolation` 리스너. 렌더 iframe은 별도 프로세스(OOPIF)라서 `Target.attachToTarget`과 `sendMessageToTarget`으로 리스너를 넣었다. **양성 대조:** 렌더 문서에 인라인 `<style>`을 주입하면 `style-src-elem` 위반 1건이 수집된다.

| 흐름 | 결과 | 위반 |
|---|---|---|
| 카탈로그 · 비교 · 프로필 · 3안 | 정상 | zod eval 1건(아래 ①) |
| 편집기 캔버스(렌더 iframe) | 4133px 렌더 · 게이트 전부 통과 | 렌더 0 |
| 이미지 업로드 | 패널 미리보기(blob:)와 캔버스 표시 | 0 |
| PNG | 1280×4735, 스타일 정상 | ② |
| HTML 1개(이미지 포함) | `data:image/webp` 1 · `blob:` 0 → 캡처 iframe의 blob: fetch 정상 | ② |
| HTML zip · React zip | 생성 정상 · React zip 56개 파일 | ② |
| 프로젝트 파일 | json 내려받기 | 0 |
| 3안 실제 화면 비교 | iframe 3개 1733–1888px | 0 |

남은 위반(기능 영향 0):
- ① `script-src` eval — zod `allowsEval`가 `Function("")`을 try/catch 안에서 시험한다(`node_modules/zod/v4/core/util.js:218`). 막히면 JIT 없이 파싱하므로 콘솔 기록만 남는다. 없애려면 zod를 쓰는 청크에서 `z.config({ jitless: true })`를 설정한다(별건).
- ② `style-src-attr`·`style-src-elem` — `pngCapture.ts:77-81` · `staticMarkup.ts:194` · `kitCss` 청크. 렌더되지 않는 별도 문서에 style을 넣고 문자열로 직렬화하는 코드라, 결과물에 `<style>`과 `style=""`이 그대로 남는다(실측 HTML 확인). 콘솔 기록만 남는다.

프리뷰(Report-Only) 고유 위반: Vercel 툴바(`vercel.live` 스크립트·frame, closed shadow root 인라인 style 6건). 프리뷰에만 주입된다.

## 강제 전환 조건 (후속)
1. 프로덕션 도메인이 정해지면 `has: [{ "type": "host", "value": "<prod>" }]`로 그 호스트에만 `Content-Security-Policy`를 걸고, 프리뷰는 Report-Only로 둔다(Vercel 툴바·Preview Comments 보존).
2. 선택: ①·②의 콘솔 기록 정리.

## 후속 #89 — 콘솔 위반 정리 (2026-10-31)
- ① zod eval: **해결.** zod를 쓰는 세 모듈(`jobRecord.ts`·`adjustmentSchema.ts`·`boardInput.ts`)이 스키마를 만들기 전에 `z.config({ jitless: true })`를 부른다. zod는 `z.object`를 **만들 때** JIT 시험을 하므로(`zod/v4/core/schemas.js` `allowsEval.value`) 진입점이 아니라 각 모듈 안이어야 한다. 공용 설정 모듈은 두지 않았다(조작 뒤 청크 3곳이 공유 청크를 새로 만든다). 가드: `app/src/test/zodJitless.test.ts`(zod를 import하는 모듈을 찾아 각각 불러온 뒤 jitless 확인). 번들: 공통 JS +0.02 · `/studio` +0.01(ADR-004 toleranceKb 0.03 안). 실측(강제 CSP 로컬 서버 · Ego Lite · 카탈로그→비교→프로필→보정값 v2→3안): 수정 전 main 빌드 `script-src` eval 1건(zod 청크) → 이 브랜치 0건. `__zod_globalConfig.jitless === true` 확인.
- ② 비렌더 문서 style: **설계상 남긴다.** 강제 CSP(`style-src 'self'`) 시험 페이지(Ego Lite)에서 방식별 위반을 셌다.

| 방식 | 위반 |
|---|---|
| `createHTMLDocument` + `innerHTML`(style 속성 2) | style-src-attr 2 |
| `createHTMLDocument` + `createElement("style")` | style-src-elem 1 |
| `createHTMLDocument` + `setAttribute("style")` | style-src-attr 1 |
| `DOMParser.parseFromString`(style 속성 + `<style>`) | elem 1 · attr 1 |
| `<template>.innerHTML`(style 속성 + `<style>`) | attr 1 |

  내보낸 HTML의 `style=""` 2개는 사이트 테마 토큰(`--site-primary` 등 CSS 변수)이다. 마크업을 어떤 DOM으로 파싱해도 위반이 기록되므로 0으로 만들려면 DOM 없이 문자열로 정리해야 한다. 그러면 `clean()`(script·on*·외부 출처 제거)을 정규식으로 해야 해서 정리 경계가 약해진다. 차단이 아니라 기록일 뿐이고 결과물은 그대로이므로(위 실측) 남긴다. 강제 전환(#88) 뒤 report-uri를 붙이면 이 위반은 내보내기 1회마다 기록되므로 그때 필터한다.
