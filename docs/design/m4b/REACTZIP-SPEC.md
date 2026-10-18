# M4-b REACTZIP-SPEC — React 프로젝트(zip) 내보내기 명세

- 작성: Designer (M4-b-1) · 2026-10-18 · r0
- 범위: 내보내기 형식 **React 프로젝트(zip)**(`react-zip`) — 진입·상태 · 산출 zip 구성·허용표 · 의존성·lock · 충실도 계약 · 수용 기준·테스트 · LICENSES 항목 · 설계 질문. 정적 zip·HTML 1개·PNG는 M4-a(`docs/design/m4a/EXPORT-SPEC.md` r1) 그대로다.
- 정본(이 문서가 따르는 결정): 스파이크 `dev/active/m4b-spike/REPORT.md`(결론 줄·2절·5절) · PRD FR-PUB-02(2026-10-18 개정 — `motion/react` 제외, 버전 고정 + package-lock 동봉) · TRD:70(산출 스택) · TRD:314(내보내기 zip 빌드 성공률 100%) · EXPORT-SPEC r1(버튼·결과·실패·Q18) · ADR-004 개정 20(M4-b 진입 몫 +0.03).
- 영환님 결정(2026-10-18 "1"): Q1 (a)안(킷 소스 `?raw` 동봉 + `site.json`) · Q2 개정 20 +0.03 · Q3 버전 고정 + lock 동봉 · Q7 `motion/react` 제외(PRD 개정).
- 사용자에게 보이는 문구는 전부 **[문안 미정]**(Hemingway 작성)이다. 이 문서는 자리·키·조건만 정한다. 키 이름은 M4-a 관례(`export.*`)를 따른다.
- 근거 표기: **[사실]** = 코드·문서·로컬 파일 직접 확인(L1) · **[추정]** = 코드 읽기 기반 판단(L3) · **[미확인]** = 측정 필요.

---

## 0. 현재 상태 (근거)

| 항목 | 현행 | 근거 |
|---|---|---|
| 형식 키 | `ExportFormat`에 `"react-zip"`이 남아 있다(잡 기록 호환) · `isFormat`도 3개 리터럴 | [사실] `data/memoryDocBook.ts:121` |
| 버튼 | `FORMATS` 2개 — `static-zip`(위) · `static-html`(아래). React zip은 M4-a Q18 A로 뺐다 | [사실] `components/studio/ExportButtons.tsx:10-13` |
| 생성기 게이트 | `format !== "react-zip" && load`일 때만 슬롯 생성기 → react-zip은 `GENERATOR_UNAVAILABLE` | [사실] `data/memoryDocBook.ts:174,188` |
| 결과 분기 | `unavailable` · `unrendered` · `refused READ_ONLY`(B-M4A-12) · `retryable` · `refused` | [사실] `features/studio/exportFlow.ts:118-128` |
| 청크 재시도 | 생성기 청크 = `retryableImport(() => import("./staticHtml/staticHtml"))` · 내보내기 청크 = `retryableImport(() => import("./exportFlow"))` · 연속 실패 계수 `exportChunk.fails`(B-M4A-08) | [사실] `exportFlow.ts:34-53` · `exportFlowLoader.ts:17` |
| 읽기 전용 탭 | INFRA 중 메시지가 `READ_ONLY_TAB`으로 끝나면 refused `READ_ONLY`(재시도 불가) | [사실] `exportFlow.ts:80-81,125` · BACKLOG B-M4A-12(닫힘) |
| zip 작성기 | `storeZip.zipParts(entries, date, limits)` · 정적 zip 허용표 `checkZipEntries` · 글꼴 이름 `fontFileName` | [사실] `features/studio/zip/storeZip.ts:119` · `zip/staticZip.ts:28,61` |
| 글꼴 고지 | 계열별 저작권 문장 + OFL 전문 `fontLicenseText(family)` | [사실] `staticHtml/siteFontEmbed.ts:48-58` |
| 예산 분류 | `exportFlow.ts` 등 = `STUDIO_AFTER_ACTION`(판정 밖·크기만 출력) | [사실] `scripts/check-bundle-size.mjs:58-70` |
| 킷 원문 | `app/src/kit/` 테스트 제외 39파일(스파이크 glob `*.ts`·`*.tsx`·`kit.css`·`motion.css` = 38) | [사실] `ls app/src/kit` · 스파이크 `raw/zip-listing.txt` |

---

## 1. 진입·버튼·상태

### 1.1 버튼 자리

- `FORMATS`에 3번째 항목 `{ format: "react-zip", label: [문안 미정 — 키 export.format.reactZip] }`을 **HTML 1개 아래**에 넣는다(★ RZQ-01). 순서 = 정적 zip → HTML 1개 → React zip.
  - 이유: M4-a Q18 A의 기본 위치(zip 위)를 유지한다. React zip은 개발자용이라 기본값이 아니다.
  - 진입 변화 = `FORMATS` 1줄(글자 + 형식 키). 새 부품 0. 스파이크 b1 실측 +0.01 [사실 REPORT 4절].
- 버튼 아래 설명 줄은 넣지 않는다(M4-a Q2 A — 진입 글자 증분). "언제 쓰나"는 결과 Callout(조작 뒤 청크)에만 둔다.
- 차단 이유가 있으면 3버튼 모두 `aria-disabled` + `aria-describedby`(현행 그대로). 게이트는 정적 형식과 **같은 8줄**을 적용한다(FR-PUB-01 "차단 0일 때만 내보내기").

### 1.2 흐름

정적 형식과 같은 흐름을 형식 키만 바꿔 쓴다: 검사 재계산 → 차단이면 멈춤 → 경고면 확인 대화상자 → 저장 먼저 → `requestExport(projectId, "react-zip", revision)` 1회 → 잡 조회(250ms × 40) [사실 EXPORT-SPEC 0절].

- 저장소: `memoryDocBook`의 `format !== "react-zip"` 게이트를 없애고 형식별 슬롯을 고른다(`static-html`·`static-zip` 슬롯과 같은 전역 심볼 방식, 새 키 `Symbol.for("design-studio/react-zip-generator")`).
- 생성기 로드(★ RZQ-02 A): `exportFlow.ts`에 `loadReactZip = retryableImport(() => import("./reactZip/reactZip"))`를 **별도로** 둔다. 정적 HTML 생성기 청크를 거치지 않는다(스파이크는 staticHtml 청크 안에서 동적 import했다). 로드 결과는 같은 `exportChunk.fails` 계수에 더한다(B-M4A-08과 같은 규칙).
- 생성기 위치: `app/src/features/studio/reactZip/`(스파이크 제안 위치) [사실 REPORT 결론 줄].
- 생성기는 렌더 iframe을 열지 않는다. 입력 = 저장된 revision의 문서·킷 토큰·글꼴 바이트(`loadSiteFonts` 경로)·이미지 Blob(`readImage`) [사실 REPORT 6절].
- 미렌더 섹션(`UNRENDERED_SECTIONS`) 판정은 형식 무관 공통 경로를 그대로 탄다 — React zip만 따로 건너뛰지 않는다.

### 1.3 상태표 (EXPORT-SPEC 6.1을 react-zip에 적용 — 새 자리 0)

| 상태 | 트리거 | 버튼 | 결과 자리 | live region | 문구 |
|---|---|---|---|---|---|
| 대기 | — | 3개 활성 / 차단 시 3개 `aria-disabled` | 없음 | — | — |
| 경고 확인 | 경고만 | — | `ExportConfirmDialog`(현행) | 대화상자 안 | 현행 |
| 진행(저장 먼저·생성 중) | 요청~잡 종료 | 누른 버튼 `aria-busy` + 진행 글자(현행 "내보내는 중…" 재사용) · 나머지 `aria-disabled` | 없음 | 없음(현행) | 현행 재사용 |
| 성공 | 잡 succeeded | 원래 글자 | Callout info + "내려받기" 링크 + 결과 줄 + 결과 해시 | `role=status`(현행 P-3 예외 자리) | 결과 줄 [문안 미정 — `export.note.reactZip`: 크기·이미지 수·글꼴 수] · 다음 할 일 안내 [문안 미정 — `export.note.reactZipNext`: 압축 해제 → `npm ci` → `npm run dev`, Node 버전 조건] · 내려받기 차단 보조 문장(현행 `export.hint.blocked`) |
| 성공 + 이미지 누락 | `lost > 0` | — | 결과 줄에 `lostImageText`(현행) | status 1회 | 현행 |
| 실패 — 재시도 가능 | 시간 초과 · INFRA · NETWORK · 생성기 청크 로드 실패 · 글꼴/이미지 읽기 실패 | 원래 글자 | `ExportRetryAlert` + "다시 시도" | `role=alert` | 현행. 다시 시도 = 같은 형식으로 흐름 재실행 · 청크는 `?retry=N` 새 URL(`retryableImport`) |
| 실패 — 읽기 전용 탭 | INFRA + `READ_ONLY_TAB` | 원래 글자 | refused 자리(현행) | `role=alert` | 현행 B-M4A-12 본문 재사용(형식 무관 — "다시 시도" 없음) |
| 실패 — 용량 초과 | `ZIP_MAX`(2.4) 초과 | 원래 글자 | refused Callout negative | `role=alert` | 현행 `export.fail.tooLarge` 재사용 |
| 실패 — 생성기 단언 | 허용표(2.4)·킷 원문 빈 문자열·`site.json` 스키마 검증 실패 | 원래 글자 | 재시도 가능 실패와 같은 자리, "다시 시도" 없음 | `role=alert` | 현행 `export.fail.pattern` 재사용 |
| 취소 | 경고 확인에서 취소·Esc | 원래 | 없음 | 없음 | 현행 |

- 결과 분기 `unavailable`(GENERATOR_UNAVAILABLE)은 react-zip 경로에서 **나오지 않아야** 한다(RZ-AC-03). 분기 코드 자체는 다른 형식·저장소 호환을 위해 남긴다.
- 파일 이름(★ RZQ-03 A): `<stem>_r<rev>_react.zip` — `exportFileStem` 계승. 정적 zip(`<stem>_r<rev>.zip`)과 같은 폴더에 받아도 덮어쓰지 않는다. 함수 `reactZipFileName`(형식만 다름).
- 생성 중 취소 버튼은 두지 않는다(M4-a Q15 A 승계). 생성기는 iframe 렌더가 없어 정적 형식보다 짧다 [추정] — RZ-AC-R3에서 시간을 기록한다.
- 390: 검사 탭 안 같은 순서, 버튼 3개 전폭(현행 배치). 1280: 오른쪽 패널 같은 순서.

---

## 2. 산출 zip 구성 (M4-a 허용표와 분리 — 스파이크 Q4)

### 2.1 파일 트리 (zip 루트 기준, 상위 폴더 없음 — M4-a Q3 A 승계)

```
package.json                     고정 템플릿(3절) — name "site" · private · type module · engines · scripts · 버전 고정 의존성 9개
package-lock.json                고정 문자열(3.2 — Linux CI 산출본)
index.html                       title·description = 문서 meta(HTML 이스케이프) · <div id="root"> · /src/main.tsx
vite.config.ts                   plugins: react() · tailwindcss()
tsconfig.json                    strict · moduleResolution bundler · resolveJsonModule · types vite/client
README.md                        [문안 미정] 실행 방법·Node 조건·서브셋 글꼴 고지 (★ RZQ-04 A)
LICENSES.md                      6절 항목
src/main.tsx                     createRoot → <PageDocument site={site}/> + 메뉴 닫기 리스너(4.3)
src/PageDocument.tsx             앱 render/PageDocument.tsx에서 폴백·편집기 경로를 뺀 것(뼈대·data-* 같음)
src/images.ts                    고정 템플릿 — import.meta.glob("./assets/images/*", { eager, query "?url" })로 키 → URL (★ RZQ-05 A)
src/index.css                    @import "tailwindcss" + ./kit/kit.css + ./kit/motion.css + body 기본값(4.2 Q6 A) + ./fonts.css
src/fonts.css                    쓰는 계열·굵기 @font-face만(faceRule 재사용, src = ./assets/fonts/<이름>)
src/site.json                    2.3 스키마
src/types/pageDoc.ts             타입 원문(경로만 치환)
src/types/protocol.ts            타입 원문(MotionPreset만 치환)
src/kit/<킷 원문>                 app/src/kit/ 의 테스트 제외 .ts/.tsx + kit.css + motion.css
src/assets/fonts/<Family>-<weight>.woff2   쓰는 계열 1 × 굵기 ≤ 2 (M4-a와 같은 서브셋 바이트)
src/assets/fonts/OFL.txt         fontLicenseText(family)
src/assets/images/img-<NN>.<webp|jpg|png>  업로드 이미지(2.2)
```

- 그 밖 파일 0. 디렉터리 entry 0. 경로 ASCII만(M4-a 2.1 승계). `node_modules`·`dist`·`.npmrc`·`.gitignore`·`.env*` 0.
- 생성기 고정 문자열(템플릿·킷 원문·lock)은 모두 생성기 청크 안에만 둔다(ADR-004 개정 20 결정 2).

### 2.2 이미지

1. 고르는 바이트 = 정적 zip과 같은 `exportImages` 규칙(id당 1장 · 목표 폭 = 그 id 슬롯 최대 · `pickVariant`) [사실 EXPORT-SPEC 2.2-2].
2. 번호 = 문서 섹션 순서 → 슬롯 순서에서 id 첫 등장 순(01부터, 99 초과 시 3자리) — 정적 zip과 같다.
3. 확장자 = Blob type(`image/webp`·`image/jpeg`·`image/png` → `webp`·`jpg`·`png`). 그 밖 = 생성 실패.
4. 참조(★ RZQ-05 A): `site.json.doc` 안 이미지 참조 id를 **`img-NN` 키로 바꿔** 넣는다. 로컬 UUID가 산출물에 남지 않는다. `src/images.ts`가 `./assets/images/img-NN.ext` → Vite가 해시 붙인 URL로 바꾼다. `PageDocument`는 키 → URL 맵을 킷 이미지 슬롯에 넘긴다(앱의 id → objectURL 표 자리).
   - [사실] 킷 `<img>`는 id를 DOM에 내보내지 않는다 — 속성은 `data-media="image"`·`src`·`alt`·`width`·`height`·`style`·`fetchPriority`/`loading`·`className`뿐이다(`kit/Media.tsx:45-55`). 키 치환은 DOM에 흔적을 남기지 않으므로 DOM 정규화는 `src`만 다룬다(4.1).
5. 잃은 이미지 = 파일 없이 킷 자체 그래픽(현행) · 결과 줄 `lostImageText`.
6. 같은 id를 여러 슬롯이 쓰면 파일 1개 · 키 1개.

### 2.3 `site.json` 스키마 (v1)

```ts
interface SiteJsonV1 {
  readonly schema: 1;                                   // 이후 구조 변경 시 올린다
  readonly doc: PageDoc;                                // 저장된 revision 문서. 폴백 표식·편집기 전용 필드 제외판 · 이미지 참조 = "img-NN"
  readonly kitTokens: KitTokenInput;                    // 문서 킷 토큰(팔레트·타이포·간격 — 앱 입력 그대로)
  readonly motion: Readonly<Record<string, MotionPreset>>; // instanceId → 실효 모션(생성 시점 sectionMotion.motionOf + firstScreenIds 계산 결과, 엔진 코드 동봉 0)
  readonly mainStyle: Readonly<Record<`--${string}`, string>>; // canvasVars(kitTokens.palette) 결과 — main 요소 CSS 변수
  readonly images: Readonly<Record<string, string>>;   // "img-NN" → "img-NN.ext" (파일 이름만, 경로 0)
}
```

- 스파이크 실측 필드는 `{ doc, kitTokens, motion, mainStyle }` 4개 [사실 `patches/reactZip/reactZip.ts:58`]. `schema`·`images`는 이 SPEC이 더한다.
- 사용자 글자는 `doc` 안에만 있다(본문·alt·meta). 앱 내부 값(프로젝트 id·사용자 이름·저장 시각·잡 id)은 넣지 않는다.
- 생성기는 직렬화 전에 위 형태를 런타임 검증한다(경계 검증 원칙). 실패 = 1.3 "생성기 단언".
- 결정성: `JSON.stringify(value, null, 2) + "\n"` · 키 순서 = 위 순서 고정. 같은 revision → 같은 바이트.

### 2.4 허용표 (`checkReactZipEntries` — M4-a `checkZipEntries`와 분리)

| 경로 패턴 | 개수 | 내용 검사 |
|---|---|---|
| `package.json` | 정확히 1 | 템플릿 상수와 바이트 동일 |
| `package-lock.json` | 정확히 1 | 템플릿 상수와 바이트 동일(3.2 대조 테스트가 내용 보장) |
| `index.html` | 정확히 1 | `<script>` = `/src/main.tsx` 1개 · 외부 URL 0 · title·description 이스케이프 |
| `vite.config.ts` · `tsconfig.json` · `src/main.tsx` · `src/PageDocument.tsx` · `src/images.ts` · `src/index.css` | 각 정확히 1 | 템플릿 상수와 바이트 동일 |
| `README.md` · `LICENSES.md` | 각 정확히 1 | 브랜드 문자열 0(M4-a F-14 규칙) · LICENSES 필수 절(6절) 존재 |
| `src/fonts.css` | 정확히 1 | `url()` = `./assets/fonts/[A-Za-z]+-\d{3}\.woff2`만 · `@import` 0 |
| `src/site.json` | 정확히 1 | 2.3 스키마 통과 |
| `src/types/(pageDoc\|protocol)\.ts` | 정확히 2 | 생성기 원문 상수와 동일 |
| `src/kit/[A-Za-z]+\.(tsx?\|css)` | **킷 목록과 정확히 같은 집합** | 생성기 원문과 동일 · 빈 원문 0(스파이크 함정 — `css: false`면 `?raw` CSS가 빈 문자열) |
| `src/assets/fonts/[A-Za-z]+-\d{3}\.woff2` | 1~2 | 첫 4바이트 `wOF2` |
| `src/assets/fonts/OFL.txt` | 정확히 1 (글꼴 ≥ 1일 때) | 계열 고지 포함 |
| `src/assets/images/img-\d{2,3}\.(webp\|jpg\|png)` | 0~64 | 확장자 ↔ 서명(RIFF/WEBP · FFD8FF · 89504E47) |

- 공통(M4-a 4.3 승계): 경로 ASCII · `/` 구분 · 선행 `/`·`..`·`\`·`:` 0 · 대소문자만 다른 중복 0 · 길이 ≤ 100자.
- **참조 무결성**: `site.json.images`의 값 집합 = `src/assets/images/*` entry 집합 · `doc` 안 `img-NN` 참조 = `images` 키 집합 · `fonts.css`의 `url()` = 글꼴 entry 집합(고아 0 · 끊긴 참조 0).
- 개수 상한: 고정 파일 15 + 킷(스파이크 38) + 글꼴 ≤ 3 + 이미지 ≤ 64 → 약 120 [추정] — entry < 65,535(ZIP64 불필요).
- 크기 상한: 정적 zip과 같은 `ZIP_MAX` 64MB 재사용(이미지 보관 30MB + 고정 파일 약 0.2MB + 글꼴 ≤ 0.6MB) [추정 — 스파이크 이미지 0 문서 681,956 B].
- entry 순서(결정적): `package.json` → `package-lock.json` → `index.html` → `vite.config.ts` → `tsconfig.json` → `README.md` → `LICENSES.md` → `src/*` 고정 파일(이름순) → `src/types/*` → `src/kit/*`(이름순) → `src/assets/fonts/*`(이름순) → `src/assets/images/*`(번호순).
- zip 바이트: `storeZip.zipParts` 재사용(무압축 store · M4-a 2.4 규칙 · entry 시각 = revision `updatedAt`, M4-a Q6 B). 결과 = Blob(`application/zip`) + SHA-256 앞 12자.

### 2.5 글꼴

- M4-a 정적 zip과 **같은 바이트**를 쓴다(`loadSiteFonts` → 쓰는 계열 1 × 굵기 ≤ 2, 이름 `fontFileName`) [사실 `zip/staticZip.ts:28`]. 새 서브셋을 만들지 않는다.
- `fonts.css` = `faceRule(face, "./assets/fonts/<이름>")` 재사용 + `[data-site-root] { font-synthesis: none; }`(스파이크 그대로) [사실 `reactZip.ts:48`].
- 고지: 서브셋이라 내보낸 뒤 문구를 고치면 서브셋 밖 글자는 대체 글꼴로 보인다 [추정 REPORT 6절] → README·LICENSES 고지 항목(문안 Hemingway).
- [사실] 스파이크 zip의 Pretendard 2면(267,096 B · 270,784 B)은 앱 `assets/fonts/Pretendard-{Regular,Bold}.subset.woff2`와 같은 크기다 — Pretendard는 업스트림 공식 서브셋 무수정이고(`kit/siteFonts.ts:3`), Kit Sans KR(172,048 · 175,888 B)·Kit Serif KR은 수정 서브셋이다. 계열마다 크기가 다를 뿐 M4-a와 같은 원천이다(RZ-AC-09가 바이트 동일을 고정).

---

## 3. 의존성 · lock · engines · build

### 3.1 버전 고정 9개 (스파이크 10개에서 `motion` 제외 — PRD FR-PUB-02 개정)

| 구분 | 패키지 | 버전 | 라이선스 | 출처 |
|---|---|---|---|---|
| dependencies | `react` | 19.3.0 | MIT | https://github.com/react/react |
| dependencies | `react-dom` | 19.3.0 | MIT | https://github.com/react/react |
| devDependencies | `vite` | 8.3.1 | MIT | https://github.com/vitejs/vite |
| devDependencies | `@vitejs/plugin-react` | 6.1.1 | MIT | https://github.com/vitejs/vite-plugin-react |
| devDependencies | `tailwindcss` | 4.3.3 | MIT | https://github.com/tailwindlabs/tailwindcss |
| devDependencies | `@tailwindcss/vite` | 4.3.3 | MIT | https://github.com/tailwindlabs/tailwindcss |
| devDependencies | `typescript` | 6.0.3 | Apache-2.0 | https://github.com/microsoft/TypeScript |
| devDependencies | `@types/react` | 19.3.0 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| devDependencies | `@types/react-dom` | 19.3.0 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |

- 근거: [사실] 버전·라이선스·repository = 로컬 앱 설치본 `node_modules/<이름>/package.json`(메인 체크아웃) · 스파이크 `raw/zip-package.json`·`raw/zip-npm-ls.txt`. 외부 조회 0.
- 버전 표기는 정확 고정(`^`·`~` 0). 이것이 TR-SEC-06 **의존성 허용 목록**이다 — 이 9개 밖 직접 의존성 0.
- 하위 의존성(스파이크 설치 45패키지 — `motion` 제외 시 [미확인] 개수)은 lock이 고정한다. 그중 **`lightningcss` MPL-2.0**(Tailwind 빌드 도구의 하위 devDependency, 앱 설치본 1.32.0)과 플랫폼 바인딩 `lightningcss-<platform>`이 있다 [사실 REPORT 2절 · 앱 `node_modules/lightningcss/package.json`].
- 버전 출처 규칙: 산출 의존성 버전 = **앱 `package.json`·lock의 설치 버전과 같다**(앱이 실제로 빌드·테스트하는 조합). 앱이 의존성을 올리면 3.2 갱신 절차를 같이 돈다. 대조 테스트 RZ-AC-12가 어긋남을 잡는다.

### 3.2 `package-lock.json` 생성·갱신 절차

1. **원본 위치**: 생성기 디렉터리의 고정 파일(예: `reactZip/template/package-lock.json`)을 `?raw`로 생성기 청크에 넣는다. 크기 52,758 B · gzip 약 10.3KB(스파이크, `motion` 포함 기준) [사실 REPORT 2절].
2. **생성 환경**: Linux CI(ubuntu, Node 22 LTS 계열 · npm 버전 기록) — 스파이크 Q3 권장. 이유: mac에서 만든 lock에도 linux·win32 선택 바인딩 38항목이 들어 있지만 다른 OS `npm ci`는 미실측 [사실 REPORT 5절 Q3].
3. **생성 명령**(CI 잡 `react-zip-lock`, 수동 트리거): 빈 디렉터리에 템플릿 `package.json`만 쓰고 `npm install --no-audit --no-fund` → 산출 `package-lock.json`을 아티팩트로 올린다. 사람이 받아 원본 위치에 커밋한다(CI가 저장소에 직접 쓰지 않는다).
4. **갱신 조건**: 3.1 버전 표 변경 · 앱 의존성 갱신으로 RZ-AC-12 실패 · 보안 공지 대응. 갱신 PR에는 lock diff와 6절 라이선스 표 갱신을 함께 넣는다.
5. **대조 테스트(오프라인 단위, 매 CI)**: lock의 `lockfileVersion` = 3 · `packages[""].dependencies`·`devDependencies` = 템플릿 `package.json`과 정확히 같음 · `packages["node_modules/<9개>"].version` = 3.1 표 · 모든 `resolved`가 `https://registry.npmjs.org/`로 시작 · 모든 비-링크 항목에 `integrity` 존재 · 라이선스 필드 집합 ⊆ 허용 집합(MIT·Apache-2.0·ISC·BSD-2/3-Clause·0BSD·MPL-2.0(devDep 한정)) — 새 라이선스 종류가 나타나면 실패.
6. **설치 안내**: README·결과 안내는 `npm ci`를 권한다(lock 그대로 설치). PRD 수용 문구 `npm install && npm run build`도 lock이 있으면 같은 집합을 설치한다 [추정 — npm은 lock과 package.json이 맞으면 lock을 따른다]. CI 잡(5.3)은 둘 다 돈다.

### 3.3 `engines` (스파이크 Q9 ★)

- `package.json`에 `"engines": { "node": "^20.19.0 || >=22.12.0" }`.
- 근거: [사실] 로컬 설치본 `vite@8.3.1`·`@vitejs/plugin-react@6.1.1`의 `engines.node`가 정확히 이 값이다. 나머지 7개는 더 넓거나 없음(react `>=0.10.0` · typescript `>=14.17`).
- npm 기본 동작은 경고(EBADENGINE)만 낸다 — 설치를 막을지는 RZQ-06(★ A: 막지 않음, README에 조건 명시).
- 갱신 규칙: 3.1 버전이 바뀌면 9개의 `engines.node` 교집합으로 다시 정한다(대조 테스트 항목).

### 3.4 scripts (스파이크 Q8 ★)

- `dev` = `vite` · `build` = `tsc --noEmit && vite build` · `preview` = `vite preview`.
- `tsc --noEmit`이 strict로 통과해야 한다 — 스파이크 실측 통과 [사실 `raw/zip-npm-install-build.txt`]. 타입 3패키지(`typescript`·`@types/react`·`@types/react-dom`)가 이 때문에 있다.
- `motion` 0: 킷 모션은 CSS keyframes(`kit/motion.css`)로 그대로 동작하고 번들 영향 0 [사실 REPORT 2절].

---

## 4. 충실도 계약

### 4.1 기준 — 렌더 iframe 대비

비교 대상: **A** = 앱 렌더 문서(`render.html`, vite preview)에 같은 `render` 메시지를 보낸 결과 · **B** = zip을 풀어 `npm ci && npm run build` 후 `vite preview`한 결과.

| 층 | 기준 | 정규화 |
|---|---|---|
| DOM | `[data-site-root]` outerHTML이 정규화 후 **문자 단위 동일** | ① `data-motion-play` 속성 제거(B만 켜는 재생 스위치 — 정적 내보내기와 같음) ② `img[data-media="image"]`의 `src` → 이미지 키(`img-NN`)로 치환(A = `blob:` · B = 해시 URL). 그 밖 정규화 0 |
| 배치 | 비교 요소(섹션·제목·본문·이미지·버튼)의 위치·크기 차이 0 · 문서 높이 동일 | 계산 스타일 차이는 기록만(스파이크: line-height 22 vs 21px, 배치 영향 0) |
| 픽셀 | 같은 브라우저·같은 기기에서 첫 화면 스크린샷 **바이트 동일** 목표(스파이크 1280×900 `cmp` 동일) · 같지 않으면 다른 픽셀 비율을 기록하고 원인(글꼴 로드 시점·이미지 디코드)을 판정한다 — 원인 미상이면 실패 | 글꼴 `document.fonts.ready` 뒤 · 모션 끝난 뒤(또는 `prefers-reduced-motion`) 캡처 |

- 단위 대조(오프라인): 앱 `render/PageDocument`와 zip `src/PageDocument`를 각각 `renderToStaticMarkup`해 같은 정규화 후 비교한다(thumbs SSR 선례 `thumbs/entry.tsx`) [사실 REPORT 1절]. 30개 변형 전부 · 모든 CI.

### 4.2 앱 DS 값 누수 — Q6 A (템플릿에 값 복사)

- [사실 REPORT 1절 차이 1] 킷이 글자 크기·색을 정하지 않은 요소는 렌더 문서에서 앱 `styles/tokens/base.css` body 값(body3 14px · `--label-normal` · 흰 배경)을 상속한다.
- 규칙: zip `src/index.css`에 그 값을 **rem/rgb 값으로 복사**한다(스파이크 방식). 앱 토큰 이름(`--label-normal` 등)·앱 CSS 파일은 산출물에 넣지 않는다.
- 어긋남 가드: 단위 테스트가 앱 `base.css` body 규칙(크기·줄 높이·색·배경)과 템플릿 값이 같은지 대조한다. 앱 토큰이 바뀌면 이 테스트가 실패해 템플릿을 같이 고치게 한다.
- 근본 해결(킷이 `[data-site-root]` 기본값을 직접 정함 — Q6 B)은 렌더·PNG·정적 내보내기에 모두 영향이 있어 별건 백로그.

### 4.3 메뉴 닫기 스크립트 (필수)

- [사실 REPORT 1절 차이 2] 정적 내보내기는 `STATIC_MENU_SCRIPT`(앵커 클릭 시 popover 닫기, `staticMarkup.ts:14`)를 붙인다. 시제품에는 없다.
- 규칙: `src/main.tsx` 템플릿에 **같은 동작**의 리스너 1개를 둔다 — `STATIC_MENU_SCRIPT`와 같은 판정(문서 click 위임 → `closest('a[href^="#"]')` → 그 앵커의 `closest("[popover]")` → `hidePopover`가 함수면 호출) [사실 `staticMarkup.ts:14-15`]. 원문은 ES5 문자열이라 strict TS에서 `e.target.closest`가 타입 오류이므로 문자열을 그대로 붙이지 않고 TS로 옮긴다(`e.target instanceof Element` 확인).
- 동작 동등성: 정적 HTML과 zip을 같은 시나리오(390 폭 · 햄버거 메뉴 열기 → 항목 클릭)로 돌려 popover 닫힘 + 앵커 이동을 확인한다(RZ-AC-15·R2).

### 4.4 검증 매트릭스

| # | 문서 | 폭 | 층 | 비고 |
|---|---|---|---|---|
| M1 | `ref-a` 3섹션(스파이크 문서) | 1280 · 390 | DOM·배치·픽셀 | 회귀 기준선 |
| M2 | 업로드 이미지 문서 — webp·jpg·png 각 1 + 같은 id 2슬롯 + 잃은 이미지 1 | 1280 · 390 | DOM·배치·픽셀 | 이미지 키 치환·참조 무결성 |
| M3 | 30개 변형 전부(변형별 최소 문서) | — | DOM(SSR 단위) | 모든 CI |
| M4 | 30개 변형 묶음 2~3문서 | 1280 · 390 | 배치·픽셀 | 실화면 QA |
| M5 | 글꼴 3계열(Pretendard · Kit Sans KR · Kit Serif KR) × 굵기 2 | 1280 | 픽셀 | 서브셋 바이트 동일 |
| M6 | 모션 프리셋 켬/끔 · 첫 화면 섹션 | 1280 | DOM(`motion` 값)·관찰 | `site.json.motion` = 앱 실효 모션 |
| M7 | 햄버거 메뉴 헤더 | 390 | 동작 | 4.3 |

- 경로 A 문서(모던 카페 + 보정값 v2 + 새로 시작) 사용 — 시드 문서는 대비 AA 차단 [사실 메모리 `export-gate-seed-block`].

---

## 5. 수용 기준 · 테스트 계획 · 예산 가드

### 5.1 수용 기준 (U = 단위·오프라인 · C = CI 네트워크 잡 · R = 실화면 build+preview)

| ID | 구분 | 기준 |
|---|---|---|
| RZ-AC-01 | U | 버튼 목록 = 정적 zip · HTML 1개 · React zip 순서 3개, 형식 `static-zip`·`static-html`·`react-zip`. React zip 글자 = 키 `export.format.reactZip` |
| RZ-AC-02 | U | `react-zip` 요청도 검사 재계산 → 차단 멈춤 → 경고 확인 → 저장 먼저 → `requestExport` 1회 |
| RZ-AC-03 | U | react-zip 요청에서 `GENERATOR_UNAVAILABLE` 0 · 저장 잡 기록 재읽기(`isFormat`) 통과 |
| RZ-AC-04 | U | 생성기 청크 로드 1회 실패 → retryable · 다시 시도 → `?retry=1` URL로 성공 · `exportChunk.fails` 증가·리셋 |
| RZ-AC-05 | U | 읽기 전용 탭(INFRA + `READ_ONLY_TAB`)에서 react-zip → refused `READ_ONLY` · "다시 시도" 0 |
| RZ-AC-06 | U | entry 집합 = 2.4 허용표만 · 순서 2.4 · 디렉터리 entry 0 · 경로 ASCII · 킷 entry 집합 = 킷 목록 · 빈 원문 0 |
| RZ-AC-07 | U | 같은 문서·revision 두 번 생성 → 결과 해시 동일 |
| RZ-AC-08 | U | `site.json` = 2.3 스키마 · 로컬 UUID 0 · 이미지 키 ↔ entry ↔ doc 참조 무결성 |
| RZ-AC-09 | U | 글꼴 entry 바이트 = 같은 문서의 정적 zip 글꼴 entry 바이트 · `OFL.txt` = `fontLicenseText` |
| RZ-AC-10 | U | `package.json` = 9개 정확 고정 · `motion` 0 · `engines.node` = `^20.19.0 \|\| >=22.12.0` · `build` = `tsc --noEmit && vite build` |
| RZ-AC-11 | U | lock 대조(3.2-5) 전 항목 |
| RZ-AC-12 | U | 3.1 버전 = 앱 설치 버전(앱 lock 기준) — 어긋나면 실패 |
| RZ-AC-13 | U | 30개 변형 SSR DOM 정규화 동일(4.1) |
| RZ-AC-14 | U | 템플릿 body 값 = 앱 `base.css` body 값(4.2) |
| RZ-AC-15 | U | `main.tsx` 메뉴 리스너: popover 안 `#` 앵커 클릭 → `hidePopover` 호출(jsdom) |
| RZ-AC-16 | U | 생성기 고정 부분(템플릿·README·LICENSES)에 브랜드 문자열·`apfs` 0 · 사용자 글자는 `site.json`·`index.html` meta에만 |
| RZ-AC-17 | U | LICENSES.md 필수 항목(6절) 존재 · 결정적 · 의존성 표 = 3.1 + lock 라이선스 집합 |
| RZ-AC-18 | U | `ZIP_MAX` 초과 → refused `export.fail.tooLarge` · 단언 실패 → `export.fail.pattern` |
| RZ-AC-19 | U | 파일 이름 `<stem>_r<rev>_react.zip`(K-AC-32 케이스 재사용) |
| RZ-AC-20 | U | 예산: `/studio` 정규화 진입 ≤ 128.83 · 복원 ≤ 131.81(개정 20) · 진입 정적 클로저에 생성기·킷 원문·lock 0(5.4 가드) |
| RZ-AC-C1 | C | 매트릭스 M1·M2 문서 zip을 풀어 `npm ci && npm run build` exit 0 · `npm install && npm run build` exit 0(PRD 문구) — ubuntu Node 20.19 · 22 |
| RZ-AC-C2 | C | 같은 zip을 windows·macOS 러너에서 `npm ci && npm run build` exit 0(lock 플랫폼 바인딩) — ★ RZQ-07 |
| RZ-AC-C3 | C | 빌드 산출 JS ≤ 90KB · CSS ≤ 30KB gzip(TRD 산출물 예산 — 스파이크 76.22 / 5.97) 기록·판정 |
| RZ-AC-R1 | R | 앱 실제 경로(버튼 → 생성기 청크 → 내려받기)로 받은 zip이 C1과 같은 결과(스파이크 미확인 항목) |
| RZ-AC-R2 | R | 매트릭스 M1·M2·M4·M7을 ego-browser로 4.1 기준 비교(1280·390) |
| RZ-AC-R3 | R | 이미지 20MB+ 문서 생성 시간·zip 크기 기록 |
| RZ-AC-R4 | R | 성공 status·실패 alert 각 1개 · 포커스가 누른 버튼에 남음 · 390에서 3버튼 터치 가능 |

### 5.2 테스트 계획 (오프라인 단위 — 매 CI · 네트워크 0)

| 묶음 | 파일(제안) | 덮는 AC |
|---|---|---|
| 생성 단위 | `features/studio/reactZip/reactZip.test.ts` — 입력 문서 → entry 목록·바이트 | 06·07·08·09·16·19 |
| 허용표 | `reactZip/checkReactZipEntries.test.ts` — 위반 entry 주입(추가 파일·빈 킷·`..` 경로·끊긴 이미지 참조·서명 불일치) 각각 실패 | 06·08·18 |
| 템플릿·lock 대조 | `reactZip/template.test.ts` — package.json·engines·scripts·lock 3.2-5·앱 버전 대조·base.css 값 대조 | 10·11·12·14 |
| DOM 대조 | `reactZip/fidelity.test.tsx` — 30변형 SSR 정규화 비교 | 13 |
| 메뉴 리스너 | `reactZip/menuScript.test.ts` | 15 |
| LICENSES | `reactZip/licenses.test.ts` | 17 |
| 흐름·배선 | `components/studio/ExportFlow.test.tsx`(버튼 3개로 갱신) · `data/memoryExport.test.ts`(GENERATOR_UNAVAILABLE 단언 교체) · `features/studio/exportFlow.test.ts`(재시도·READ_ONLY) | 01~05 |

- 함정 대응: vitest `css: false`에서는 `?raw` CSS가 빈 문자열이다 [사실 REPORT 3절] → 생성 단위 테스트는 CSS 원문을 주입하고, 별도로 **빌드 산출 생성기 청크에 킷 CSS가 들어 있음**을 검사기(5.4)에서 확인한다.
- 깨질 기존 테스트(예상, 스파이크 실측 [사실 `raw/tests-b2-wiring.txt`]): `ExportFlow.test.tsx` "React zip 버튼 0" · `memoryExport.test.ts` "react-zip은 계속 GENERATOR_UNAVAILABLE". 둘 다 M4-a 단언이 바뀌는 예상 변경이다.

### 5.3 CI 잡 설계 (네트워크 필요 단계 분리)

- `react-zip-build`(네트워크 · PR 필수 체크 후보): ① 오프라인 단계 — vitest로 매트릭스 M1·M2 zip을 `$RUNNER_TEMP`에 쓴다(생성기 함수 직접 호출, CSS 주입) ② 네트워크 단계 — 빈 디렉터리에 `unzip` → `npm ci --no-audit --no-fund` → `npm run build` → 산출 크기 기록(C3) → 같은 zip으로 `npm install && npm run build`(C1 PRD 문구).
- 행렬: ubuntu × Node 20.19·22 필수 · windows·macOS × Node 22는 RZQ-07(★ 주 1회 + lock 갱신 PR).
- `react-zip-lock`(네트워크 · 수동): 3.2-3.
- 오프라인 단위 테스트(5.2)는 기존 `npm test -- --run`에 포함 — 네트워크 0이 계약이다.
- 실화면 R(ego-browser)은 QA 레인 — CI에 넣지 않는다(브라우저 도구 규칙).

### 5.4 예산 가드 (진입 정적 포함 0)

- 개정 20 결정 1: `/studio` 정규화 진입 기준선 128.80 → 판정 ≤ 128.83 · 복원 131.78 → ≤ 131.81. 상한 129.13·132.11 · raw 130.5 · 렌더 JS 90·CSS 30 불변.
- 진입에 허용되는 변화: `FORMATS` 1줄 · `memoryDocBook` 게이트 조건 · 파일 이름 분기(스파이크 b2 합계 +0.01).
- 검사기 추가(개정 20 결정 2 — 구현 범위): `check-bundle-size.mjs`가 `/studio` 진입 정적 클로저(진입 청크 + modulepreload 목록)에 다음이 **0개**인지 판정한다 — 생성기 청크 파일 · 킷 원문 표식(예: `kit.css` 원문 첫 줄 문자열) · lock 표식(`"lockfileVersion"`). 하나라도 있으면 빌드 실패.
- `src/features/studio/reactZip/reactZip.ts`를 `STUDIO_AFTER_ACTION`에 넣어 크기만 출력(스파이크 36.83KB gzip + lock 약 10KB − motion 몫 [추정]).
- 몫 초과 시: 감량 1회 → 그래도 넘으면 멈추고 새 개정 상신(개정 20 결정 3). M4-a 남은 0.01과 합산하지 않는다.

---

## 6. LICENSES.md 구성 항목 (문안은 Hemingway — 항목·출처·라이선스 종류만)

- 형식: Markdown · UTF-8 · 고정 순서 · 결정적(생성 시각·사용자 이름·프로젝트 이름 0 — M4-a Q8 A) · 제품 브랜드 0(M4-a Q10 A).

| 순서 | 절 | 필수 항목 | 라이선스 종류 | 출처 |
|---|---|---|---|---|
| 1 | 머리 | 제목 · 묶음 구성 요약(파일 수) · `node_modules`는 들어 있지 않고 설치 시 받는다는 사실 | — | 생성기 고정 [문안 미정] |
| 2 | 사이트 코드(킷 소스) | `src/kit/*`·`src/PageDocument.tsx`·`src/main.tsx`·`src/images.ts`·`src/types/*`·설정 파일 = 생성 도구 산출물 · 사용 조건(M4-a Q9 A와 같은 결정 — "제약 없이 사용·수정") | M4-a Q9 결정 문장 | 생성기 고정 [문안 미정] |
| 3 | npm 직접 의존성 9개 | 패키지 이름 · 고정 버전 · 구분(dependencies/devDependencies) · 라이선스 · 출처 URL — 3.1 표 그대로 | MIT ×8 · Apache-2.0 ×1(typescript) | 3.1 표 |
| 4 | 하위 의존성 고지 | lock이 고정한 하위 패키지의 라이선스 종류별 개수 · **MPL-2.0 `lightningcss`(+ 플랫폼 바인딩) = Tailwind 빌드 도구의 하위 devDependency, 산출 사이트 번들에 포함되지 않음** · 출처 https://github.com/parcel-bundler/lightningcss | MIT · Apache-2.0 · ISC · MPL-2.0 · BSD-3-Clause · 0BSD(스파이크 45패키지 기준 — motion 제외 후 재집계) | lock 생성 시 CI가 설치본 `package.json`에서 뽑은 표(3.2-4) |
| 5 | 글꼴 | 계열 이름 · 파일 경로(`src/assets/fonts/*`) · 저작권 문장(`COPYRIGHT` 표) · Modified Version·Reserved Font Name 고지 · 라이선스 전문 위치(`src/assets/fonts/OFL.txt`) · **서브셋 고지**(고친 글자가 대체 글꼴로 보일 수 있음) | SIL Open Font License 1.1 | `siteFontEmbed.ts:48-58` · `assets/site-fonts/<family>/OFL.txt` |
| 6 | 이미지 — 사용자 업로드 | 파일 경로 목록(`src/assets/images/*`) · 권리는 올린 사람에게 있다는 취지 · 도구는 권리 주장 0 | — | M4-a 3절 3과 같음 |
| 7 | 그래픽 — 자체 생성 | 이미지가 없거나 잃은 슬롯의 킷 자체 그래픽(SVG·CSS) · 사용 조건(Q9) | M4-a Q9 결정 문장 | M4-a 3절 4와 같음 |

- 이미지 0장이면 6절은 "올린 이미지 없음" 1줄. 잃은 이미지가 있으면 7절에 개수 1줄(M4-a 규칙).
- 4절 표는 생성 시점에 계산하지 않는다 — lock과 함께 커밋한 고정 표(생성기 청크 상수)이며 RZ-AC-17이 lock과 대조한다.
- Apache-2.0(typescript)·MPL-2.0(lightningcss)은 zip이 패키지 자체를 재배포하지 않는다(설치 시 레지스트리에서 받음) [사실 2.1 — `node_modules` 0]. NOTICE·소스 공개 의무 판단은 법무 확인 항목(Hemingway·영환님 — 릴리스 게이트 전, M4-a Q9와 같은 경로).

---

## 7. 설계 질문 (★ = 권장)

| # | 질문 | 선택지 | ★ |
|---|---|---|---|
| RZQ-01 | React zip 버튼 위치 | A HTML 1개 아래(3번째) · B 맨 위 · C 버튼 대신 대화상자(M4-a 1.2 B — 형식 3개 이상 시 재검토 조건) | **A** — 기본 형식(정적 zip) 위치 유지 · 진입 1줄 |
| RZQ-02 | 생성기 청크 로드 위치 | A `exportFlow`에 별도 `retryableImport` 슬롯 · B 스파이크처럼 staticHtml 청크 안 동적 import | **A** — 정적 HTML 청크를 받지 않아도 되고, 재시도·계수 규칙이 한 곳 |
| RZQ-03 | 파일 이름 | A `<stem>_r<rev>_react.zip` · B 정적 zip과 같은 이름 | **A** — 같은 폴더에서 덮어쓰기 0 |
| RZQ-04 | README.md 동봉 | A 넣음(실행 방법·Node 조건·서브셋 고지 — 문안 Hemingway) · B 결과 Callout 안내만 | **A** — `npm ci` 안내·engines 조건을 zip 안에 남긴다 |
| RZQ-05 | 이미지 참조 방식 | A `site.json` 이미지 id → `img-NN` 치환 + 고정 `src/images.ts`(glob) · B UUID 유지 + 생성 import 맵 파일 | **A** — 내부 id 0 · 생성 코드 0(고정 템플릿) |
| RZQ-06 | Node 버전 불일치 시 설치를 막을까 | A `engines`만(npm 경고) + README 조건 · B `.npmrc` `engine-strict=true` 동봉(설치 실패) | **A** — 파일 수 최소 · 경고로 충분 [추정] |
| RZQ-07 | windows·macOS CI 러너 | A 주 1회 + lock 갱신 PR에서만 · B 모든 PR · C 하지 않음 | **A** — 비용 대비 lock 플랫폼 위험만 잡는다 |
| RZQ-08 | 픽셀 비교 기준 | A 같은 브라우저·기기에서 바이트 동일 목표 + 원인 판정 · B 허용 오차(예: 0.1% 픽셀) | **A** — 스파이크가 바이트 동일을 보였다. 허용 오차는 실패 원인을 숨긴다 |
| RZQ-09 | lock 생성 Node 버전 | A Node 22 LTS 계열(TRD 생성기 Node 22와 같음) · B engines 최소(20.19) | **A** — lock v3는 두 버전 모두 읽는다 [추정] |

### 7.1 사용자 질의 대상 (예산 상향 · 엔진 계약 · 앱 새 의존성 · 백엔드)

| # | 묻는 내용 | 이유 |
|---|---|---|
| — | 없음(r0 기준) | 진입 몫 +0.03은 개정 20으로 이미 승인 · 생성기는 앱 기존 모듈만 import(앱 새 의존성 0 [사실 REPORT 2절]) · 엔진 계약(`engine/contracts/*`) 변경 0 — 타입은 원문 복사 · 백엔드 0(브라우저 안 생성) |

- 조건부: 구현 실측이 +0.03을 넘으면(5.4) 새 개정 상신 = 사용자 질의. 충실도 대조(4.1)가 킷 DOM 변경을 요구하면 렌더·PNG·정적 내보내기 영향이라 별도 질의(Q6 B 백로그와 같은 경로).

---

## 8. 출처·관찰 기록

- 외부 리서치 0. 라이선스·버전·engines = 메인 체크아웃 `app/node_modules/<이름>/package.json`(2026-10-18 로컬 읽기) · 스파이크 `raw/zip-package.json`·`raw/zip-npm-ls.txt`·`raw/zip-listing.txt`.
- 실화면 관찰: 이번 레인은 명세만 — preview·ego-browser 미실행. 실측은 RZ-AC-R*·C*로 구현·QA 레인이 한다.
