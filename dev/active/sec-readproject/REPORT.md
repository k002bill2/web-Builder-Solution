# SEC-M4A-10 REPORT — 프로젝트 파일 가져오기 신뢰 경계 · 내보낸 HTML CSP

대상 base `41fcfd25`. 검토자 Security(Claude Code, Opus 5.5). 2026-10-18. 범위: 로컬 코드·로컬 vitest(jsdom)만, 외부 송신·네트워크 스캔 0, 브라우저 실측 0.
표기: [사실]=코드·실행 확인 · [추정] · [미확인].

## 판정

**PASS(머지 차단 없음) — Critical/High 0 · Medium 1 · Low 4 · Info 다수.**

- 마크업·스크립트 주입: 퍼즈 67건 중 렌더 iframe 마크업·정적 HTML(`buildStaticHtml`)에 `<script>`·`on*` 속성·`javascript:`/외부 URL 속성·외부 `url()` style·`meta[http-equiv]`/`base`/`link`/`iframe`/`template`이 **남은 경우 0** [사실, jsdom DOM 파싱 판정 `logs/fuzz-import.txt`].
  근거: 슬롯 값이 URL·style 속성으로 가는 경로 0 [사실 grep `href=|src=|srcSet|style=` kit·render]: href = `#s-${instanceId}`(`kit/text.ts:23` · instanceId는 `STRICT_ID`)뿐, img src = 부모가 준 UUID 키 맵(`kit/Media.tsx:33`), style = `kitVars`/`canvasVars`(팔레트 `isCssValue`). 슬롯 글자는 React 글자뿐 — 그래서 퍼즈가 첫 텍스트 슬롯 하나만 바꿔도 다른 섹션 유형으로 일반화된다.
  문서는 `validatePageDoc`(모르는 키·오염 키 거부·이미지 source = UUID v4/플레이스홀더만), 사용자 글자는 React 글자·속성·`textContent`로만 나간다.
- 남은 결함은 전부 **가용성(그 탭·그 프로젝트)** 과 **검증 비대칭(가져오기가 받는 값 ⊋ 렌더가 받는 값)** 이다.
- 이전 AppSec REPORT 도달성 4번 [미확인] 해소: 가져오기 경로로 렌더 문서 침해·raw HTML 슬롯에 이르는 길은 없다 [사실] → 그 REPORT의 AS-M1(`<template>`)·AS-M2(SMIL)는 여전히 Medium(도달 경로 없음) 유지. (이 문서에서 `AS-` = m4a-appsec REPORT 지적 번호)
- 용어 주의: BRIEF의 `readProject.ts`는 **내보내기 읽기**(IDB → 파일)다. 가져오기 신뢰 경계 = `checkFile.ts`(①~④) · `checkImages.ts`(⑤) · `rekey.ts` · `writeImport.ts` [사실].

## 1. 가져오기 데이터 흐름 (파일 → 저장 → 렌더/내보내기)

| 단계 | 코드 | 검사 | 결과물 |
|---|---|---|---|
| ① 크기 | `checkFile.ts:118` | 0 < size ≤ 96MB (읽기 전) | — |
| ② 파싱 | `checkFile.ts:107` `JSON.parse` | 예외 → IM-2 (깊은 중첩 200k도 IM-2, 11ms) | 원문 객체 |
| ③ 봉투 | `envelopeFailure` | format·formatVersion=1·schemaVersion=1·필드 타입 | — |
| ④ project | `projectOk` | 텍스트 6필드 `isString`·revision 정수·이름 1~40자 | **원문 객체 그대로**(모르는 키 유지) |
| ④ series | `seriesOk` + `profileShape.ts` | 버전 1..n·profileId·hex 엄격·열거 `Object.hasOwn`·문자열/숫자 타입 | **원문 그대로**(모르는 키 유지 · 숫자 범위 없음 · `family` 임의 문자열) |
| ④ doc | `docOk` → `checkSaveDoc` → `validatePageDoc` | 문서: 허용 키만·오염 키 거부·패턴·길이·UUID·hash 재계산 일치 | 문서 = 원문(검증 통과 = 아는 필드만 있음 [사실]) · **DocRecord 봉투·스냅샷 머리의 모르는 키 유지** |
| ⑤ 이미지 | `checkImages.ts` | 개수 24·합 60MB(선언)·localId 문자열(`/` 없음·중복 없음)·형식 3종·사다리·bytes 합·엄격 base64·magic → **디코드** → 치수 비교 → 같은 인코더로 재인코딩 | 재인코딩 Blob만 |
| 재매김 | `rekey.ts:46` | 새 projectId/profileId · `{...file.project}` 스프레드 · ④ 재검사 | 계획 |
| 쓰기 | `writeImport.ts:96` | 한 트랜잭션 · 상태 봉투 Map 검사 | IDB `studio/state`·`docs/<id>`·`images/<id>/<localId>` |
| 렌더 | `docKitTokens` → `readParentMessage`(`render/protocol.ts:105`) → `PageDocument` | `isKitTokens`: family `/^[\w -]+$/`·굵기 100~900·scale 1~2·grid·sectionGap 0~512 · 렌더 쪽 `validatePageDoc` | iframe(sandbox `allow-scripts`, 불투명 출처) |
| 내보내기 | 숨은 iframe 렌더 → `serialize` → `buildStaticHtml` | F-08~F-15 · img src = `data:image/(webp|jpeg|png);base64` / zip `assets/images/img-NN.ext` | `.html` / zip |

**검증을 우회해 저장소에 들어가는 필드 [사실, 퍼즈 P02·P03·S06·N01·N02·I03·I04]:**
- project 모르는 키(`hasDoc`·`candidateId`·`docSavedAt`·`latestProfileVersion`·JSON 자기 키 `__proto__`) — 그대로 저장·재내보내기.
- series 버전·base·색 토큰의 모르는 키, 스냅샷 머리의 모르는 키, DocRecord 봉투의 모르는 키.
- 이미지 `localId` — UUID 아님(`..`, 꺾쇠 포함 문자열)도 저장(문서는 UUID만 참조 가능 → 고아 레코드).
- 범위 밖 숫자(`headingWeight 1e9`·`scale 0`·`sectionGap -1`)·임의 `family`.

## 2. 지적 (심각도순)

### M-1 (Medium) 가져오기 이미지: 실제 바이트 헤더를 보지 않고 디코드 → 압축 폭탄으로 탭 메모리 소진
- [사실] `checkImages.ts:59` 한도(`isSide`·`exceedsPixelLimit`)는 JSON에 **선언된** width/height만 본다. 실제 이미지 헤더(PNG IHDR 등)는 읽지 않고 `reencode`가 `deps.createImageBitmap`(`:75`)을 먼저 부른 뒤에야 치수를 비교한다.
- 실증(`logs/bomb-header-check.txt`): 선언 640×480 + 33바이트 PNG(IHDR 16384×16384) → `readImageHeader` = 16384×16384(한도 초과) · **디코드 호출 1회 뒤** IM-6. 실브라우저에서 단색 16384² PNG(RGBA 약 1GiB 디코드)가 수백 KB~수 MB로 96MB 안에 들어간다 [추정]. 탭 크래시 여부 [미확인 — 브라우저 미실측].
- 업로드 경로는 같은 공격을 V5 `readImageHeader`로 디코드 전에 막는다(`ingestImage.ts:98-100`) [사실] — THREATS T4 "업로드와 같은 재통과" 의도와 어긋남.
- 영향: 받은 프로젝트 파일을 연 사용자의 탭 가용성. 쓰기 전 실패라 영속 피해 0 [사실 — ⑤는 트랜잭션 전].
- 패치(`patches/checkImages-header-before-decode.diff`, 임시 적용 검증): 디코드 전에 변형본마다 `readImageHeader(format, bytes)` = (사다리 폭, `variantHeight`)를 요구.
  - 결과: 폭탄 → IM-6 **디코드 0회** [사실].
  - 단, `src/features/projectFile` 스위트 **25건 실패** — 원인: `test/projectFileFixtures.ts` `fakeImageBytes`가 "서명 16B + 'WxH' 텍스트"라 실제 헤더가 없다. 픽스처를 실제 IHDR/SOF/VP8 헤더 바이트로 바꾸는 개정이 함께 필요(Developer 몫, 원복함).
```diff
+import { readImageHeader } from "../studio/images/ingest/header";
   if (decoded.some((b) => b === undefined)) return undefined;
+  // 디코드 전 헤더 = 사다리 치수(압축 폭탄 — 업로드 V5와 같은 파서). 선언 width·height만 믿지 않는다
+  if (decoded.some((b, i) => { const h = readImageHeader(format, b!); return h === null || h.width !== ladder[i] || h.height !== variantHeight(width, height, ladder[i]!); })) return undefined;
```

### L-1 (Low) 프로필 타이포·간격: 가져오기 범위 ⊋ 렌더 범위 → 가져온 프로젝트가 그려지지·내보내지지 않음 + 프로토타입 키 글꼴
- [사실] `profileShape.ts:55-56`은 `family` 임의 문자열·숫자 범위 없음. 렌더 경계 `isKitTokens`는 `/^[\w -]+$/`·100~900·1~2·0~512. 퍼즈 S01(`x"; } body{background:url(https://evil…)}`)·S07(굵기 1e9)·S16(scale 0) → **가져오기 PASS · 렌더 메시지 DROPPED**(편집 캔버스·미리보기·PNG·정적 내보내기 전부 실패/시간 초과). 주입은 렌더 경계가 막음 [사실] — `kitVars`에 외부 `url()`이 만들어지지만 `kitVars` 호출처는 `PageDocument`뿐이고 그 앞에 `readParentMessage`가 있다(`kitCssText`는 테스트만 호출) [사실 grep].
- [사실] S02~S04 `family` = `constructor`·`__proto__`·`toString`: 정규식 통과 → `siteFaces`의 `ALIAS[type.family]`(`kit/siteFonts.ts:25`)가 `Object.prototype` 멤버를 집어 family = 함수/객체 → 내보내기 `loadSiteFonts`가 규칙을 못 찾아 FontLoadError(내보내기 실패) · 캔버스는 `"function Object() { [native code] }"` 글꼴 이름(무해).
- 패치(`patches/profileShape-family-range.diff`, 임시 적용 검증 `logs/patch-profileShape-check.txt`): profileShape에 렌더와 같은 범위 + `siteFonts` `Object.hasOwn`. **84 files / 546 tests 통과**, S01·S07·S16 → IM-4, S02~S04 → `siteFaces=[]`(정상 폴백). 다른 66건 판정 불변. 원복함.
- **부분 해결 [사실, Codex 재현]**: 패치는 `spacing_tokens.grid`를 검사하지 않는다. `docKitTokens`가 `parseFloat(grid)`(NaN·≤0이면 8)로 바꾸고 렌더는 1~64만 받으므로 `grid` = `"0.5"`·`"65"`·`"1000000"`은 패치 후에도 가져오기 PASS·렌더 DROPPED. 보강 요건(미검증): `const g = parseFloat(grid); !(Number.isFinite(g) && g > 0) || (g >= 1 && g <= 64)` + 경계값(0.5·1·64·65) 회귀 테스트. 판정 L-1(Low) 불변 — 가용성만.
- 부작용(반영 시 판단 필요) [사실]: `recordsHold`는 가져오기·재매김뿐 아니라 **파일 내보내기(`readProject.ts:120`)** 도 쓴다 → 범위 밖 값을 이미 가진 기존 프로젝트는 파일 내보내기가 EX-6(unreadable)로 바뀐다. 또 가져오기가 열기(checkState)보다 엄격해진다. 정상 경로의 계열 이름은 `domain/fonts.ts:20-22` 3종(Pretendard·Noto Sans KR·Noto Serif KR) = ASCII라 `/^[\w -]+$/`에 걸리지 않음 [사실 grep]. 더 좁히려면 `isAllowedFontFamily`(`domain/fonts.ts:26`)를 리터럴 복제.

### L-2 (Low) 문서 밖 레코드의 모르는 필드가 그대로 저장·재수출됨
- [사실] `rekeyImport`가 `{...file.project}`·`{...version}`·`{...snapshot}`·`{...record}`로 원문을 펼친다. P02의 `candidateId`·`docSavedAt`·`latestProfileVersion` 등이 `studio/state`에 저장된다.
- 소비: `summaryOf`(`memoryProjectRepository.ts:112`) `{...project, updatedAt, latestProfileVersion, ...docPart}` — 문서 없는 프로젝트면 docPart = `{hasDoc:false}`라 가져온 `candidateId`·`docSavedAt`이 요약에 남는다 [사실]. `editStatusText`는 `hasDoc`로 먼저 막혀 표시 0 [사실]. 다른 소비처 영향은 [미확인](전수 아님). 출력은 React 글자라 주입 0.
- `__proto__` 자기 키(P03): 스프레드·structuredClone 후에도 프로토타입 불변·전역 오염 0 [사실, `protoPolluted=false`]. 다만 다음 내보내기 파일에 그대로 실림.
- 제안(미검증): `rekeyImport`에서 아는 필드만 골라 담기(`pick(PROJECT_TEXT + revision)`; series·스냅샷은 `profileShape`가 보는 키 집합으로). 데이터 위생·미래 필드 충돌 방지 목적.

### L-3 (Low) 이미지 `localId` 형식 미검사 — 고아 레코드
- [사실] `idOk`(`checkImages.ts:100`)는 비어 있지 않음·`/` 없음·중복만 본다. I03(꺾쇠·따옴표 포함)·I04(`..`) → 저장 키 `project-N/<그 값>`. 문서는 UUID v4만 참조하므로 렌더·내보내기 도달 0 [사실]. 다음 싱크의 `imageOps`가 참조 밖 이미지를 지운다 [추정 — checkFile 헤더 주석 근거, 미실행]. 그 전까지 24개·60MB 탭 한도를 차지.
- 제안: `idOk`에 `LOCAL_IMAGE_ID` 정규식(`engine/validate/localImageId.ts`) — 가져오기 청크 크기 규칙(6절) 때문에 리터럴 복제 + parity 테스트.

### L-4 (Low) 저장 이미지 레코드의 `Blob.type` 미검사 → 손상 레코드 하나로 내보내기 전체 실패 — 서브에이전트, 코드 확인
- [사실] `readImageRecord`(`data/persistence/imageRecord.ts:38-42`)는 Blob·사다리·bytes·magic만 본다. 정적 HTML data URL MIME = `blob.type` 그대로(`staticHtml.ts:125`) → `image/svg+xml`·`text/html` 레코드면 F 규칙(`staticMarkup.ts:156`)·zip `EXT`(`staticZip.ts:21`)가 throw → 해당 이미지만이 아니라 **내보내기 전체 실패**(fail-closed, 주입 0).
- 가져오기·업로드는 이런 레코드를 만들 수 없다: 재인코딩 결과 `out.type === choice.type` 검사(`checkImages.ts:79`, `ingestImage.ts:77`) [사실]. 같은 출처의 다른 코드가 IDB에 직접 써야 생긴다 → Low.
- 제안: 복원/내보내기 시 `type`을 `image/${format}`로 정규화.

### Info
- I-1 SVG: 업로드는 확장자·MIME·magic 3중으로 거절(TYPE_MISMATCH, 래스터화 0), 가져오기는 형식 3종 + magic(I01·I06 → IM-6) [사실]. 렌더는 `<img src=blob:>`라 SVG라도 스크립트 비활성 [사실(스펙)].
- I-2 폴리글롯(PNG 서명 + HTML, I05): 퍼즈는 가짜 인코더라 통과 — 실브라우저는 캔버스 재인코딩으로 덧붙은 바이트 제거 [추정, 코드 경로 사실].
- I-3 사용자 글자 XSS(D01~D04·D12·P01·S09·S10·N01): 렌더·정적 HTML 모두 잔존 0. `meta.title` = `textContent`, description = 속성 대입 [사실].
- I-4 URL·오염 키: `javascript:`·`data:`·`blob:`·`https:` 이미지 source, `__proto__`/`constructor` 슬롯·열거(`toString`)·형식 키 → 전부 IM-4/IM-6 [사실].
- I-5 크기: 섹션 1e5개 IM-4(272ms) · 버전 3000개 PASS(19ms) · 이미지 25개 IM-5 [사실].
- I-6 앱(`index.html`·`render.html`)에 CSP meta·헤더 없음, `vite.config` 헤더는 CORS뿐 — 렌더 sandbox(`allow-scripts`, `allow-same-origin` 없음)가 주 방어선 [사실, 서브에이전트]. 배포 헤더 [미확인].
- I-7 업로드 `ingestImage.ts:82-83` 디코드 결과 치수를 헤더와 대조하지 않음 — 파서·디코더 해석 차이 시 한도 우회 여지 [추정, 서브에이전트].

## 3. 이미지 Blob 경로 (항목 3 요약)

| 경로 | MIME 결정 | SVG | 폴리글롯 | 크기 폭탄 |
|---|---|---|---|---|
| 업로드 | 확장자·MIME·magic 일치 | 거절 | 재인코딩 제거 | 디코드 전 헤더 검사 ✅ |
| 가져오기 | 선언 format + magic · Blob type = `image/${format}` | 거절(IM-6) | 재인코딩 제거 | **선언값만 → 디코드 먼저 (M-1)** |
| 저장 → 렌더 | `blob:` object URL, `<img>` | — | — | — |
| 저장 → 내보내기 | `blob.type`(L-4) → `data:` 허용 3종 정규식 / zip `EXT[type]`, 이름 `img-NN` 고정 | 정규식이 throw | 원본 바이트 = 재인코딩본 | — |

## 4. CSP 권고안 (문서만 — 구현 0)

현재 산출물이 쓰는 리소스 [사실]: head `<style>`(킷 CSS + `@font-face` — html은 `data:font/woff2`, zip은 `assets/fonts/*.woff2`) · 사이트 루트 `style` 속성(`--site-*` 변수, 프로필마다 다름) · head 인라인 `<script>` 1개(`STATIC_MENU_SCRIPT`, 고정 196자) · `<img>` = html `data:image/…;base64` / zip `assets/images/img-NN.ext` · 인라인 `<svg>`(킷 `Media.tsx`, 외부 참조 없음) · 그 밖 네트워크 0.

**html(단일 파일) — 생성기 고정 meta, head 맨 앞:**
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg='; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">
```
**zip(`index.html`):** 위와 같되 `img-src 'self' data:; font-src 'self' data:`.

- **인라인 스크립트 해시: 필요하다.** `'unsafe-inline'` 없이 메뉴 스크립트를 살리려면 해시(위 값 = 현재 `STATIC_MENU_SCRIPT`의 sha256 — `logs/csp-hash.txt`, Codex도 일치 확인)가 필요하다. 상수가 바뀌면 해시도 바뀌므로 **생성기가 런타임에 계산하지 말고 상수 옆에 고정 + 테스트로 대조**를 권고(바뀌면 테스트 실패). 대안: 메뉴 스크립트를 없애고 `popover` 닫기를 CSS/HTML(`popovertarget` 버튼)로 대체하면 `script-src 'none'`.
- `style-src 'unsafe-inline'`이 불가피: 루트 `style` 속성이 프로필마다 다르다(`'unsafe-hashes'` + 속성별 해시는 가능하나 생성 복잡). 
- **보장 범위 (Codex 지적 수용)**: CSP는 **보조 방어**다 — 마크업 검사(F-08~F-15)·AS-M1/AS-M2 패치(`template`·SMIL 제거)를 대체하지 않는다.
  - html 단일 파일안: 외부 이미지·글꼴·스크립트·fetch 요청은 차단. 그러나 **일반 링크 탐색(`<a href=https://…>`)은 CSP가 막지 않는다**(`form-action`은 폼만) → 링크 규칙 F-11이 계속 필요. SMIL `href`로 만든 링크의 클릭 탐색도 CSP 밖 → AS-M2 "무력화"는 `javascript:` 실행(해시 불일치로 차단)과 외부 리소스 요청에 한정.
  - zip안: `'self'`는 assets 경로만이 아니라 **같은 출처 전체**를 허용 → HTTP(S)로 게시하면 `/collect?v=…` 같은 같은 출처 요청이 가능(다른 출처는 차단). zip은 마크업 검사를 주 방어로 유지.
- 효과: 이전 AppSec AS-M1(`<template shadowrootmode>` 안 script·외부 img)·AS-M2(SMIL `href`)·AS-L1(따옴표 섞인 `url()`)이 **열람 시점에 무력화**된다(meta CSP는 shadow root 안에도 적용 [사실(스펙)]).
- 단서 [사실]: F-15가 `meta[http-equiv]`가 있으면 throw(`staticMarkup.ts:182`) → 생성기 고정 CSP meta 1개를 예외로 하는 규칙 개정 필요(“정확히 그 문자열 1개만 허용”). meta CSP는 `frame-ancestors`·`report-uri`·`sandbox`를 무시한다. `file://`로 연 zip에서 `'self'` 매칭은 브라우저마다 다르다 [미확인] — `'self'`가 안 맞으면 zip 이미지·글꼴이 막히므로 **zip은 브라우저 실측 후 채택**. html 단일 파일안은 `'self'`를 쓰지 않아 이 문제 없음.
- 순서: CSP meta는 `<head>` 첫 자식이어야 그 앞 요소에 적용 공백이 없다.

## 5. 항목별 결과

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | 가져오기 경로 전수 | 통과 (L-2·L-3) | 1절 표 · 우회 필드 목록 |
| 2 | 주입 퍼즈 67건 | 마크업 주입 0 · L-1 | `logs/fuzz-import.txt`(67줄) · REJECT 37 / PASS 30 = 렌더·정적 HTML 검사 26(잔존 0) + 렌더 DROPPED 3 + 문서 없음 1(P02) |
| 3 | 이미지 Blob | **M-1** · L-4 · I-1·I-2·I-7 | 3절 · `logs/bomb-header-check.txt` |
| 4 | CSP | 권고안 | 4절 · 해시 필요 |
| 5 | 심각도·패치 | M1·L4 | `patches/` 2건 검증(1건은 픽스처 개정 필요) |

## Codex adversarial-review (1회, `logs/codex-adversarial.txt`)
- 명령: `adversarial-review --scope branch --base 41fcfd25 "<REPORT 판정 반박 focus>"`. 판정 needs-attention. 요약: **가져오기 → 스크립트 주입 반례 없음 · 메뉴 스크립트 해시 일치**.
- [medium][P2] L-1 패치가 `grid` 범위 미검사 → **수용**(사실, Codex가 메모리 적용으로 재현). L-1에 "부분 해결" + 보강 요건 추가. 심각도 Low 불변.
- [medium][P2] CSP를 유출 완전 차단책으로 쓴 문구 과장(zip `'self'` = 같은 출처 전체, 링크 탐색 미차단) → **수용**. 4절 "보장 범위" 추가, CSP = 보조 방어로 정정. 결함이 아니라 권고 문서의 정확성 문제.
- 재실행 없음(BRIEF 1회 한도).

## 서브에이전트
- code-explorer 1개(읽기 전용, 항목 3 이미지 Blob·sandbox·CSP·크기 폭탄) — 완료. M-1·L-4·I-1·I-6·I-7 반영. M-1 핵심 주장은 메인이 테스트로 실증, L-4는 메인이 코드 경로 일부(`checkImages.ts:79`) 재확인.
- 항목 1은 메인이 직접(이미 읽은 코드라 위임 이득 없음).

## 남은 것 / 미확인
- 브라우저 실측 0: M-1 실제 탭 크래시, I-2 폴리글롯 재인코딩 제거, zip `file://` `'self'` 매칭.
- L-2 모르는 필드의 소비처 전수 미실시.
- 패치 2건은 앱 코드 미반영(BRIEF: 앱 코드 커밋 0) — Developer 반영 + 회귀 테스트(폭탄 PNG·S01/S02 입력) 필요.
