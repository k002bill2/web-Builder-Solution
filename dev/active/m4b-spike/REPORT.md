# M4-b-0 REPORT — React zip(FR-PUB-02) 실현성 스파이크

> 상태: **완료(측정 전용)** · base `41fcfd25` · 2026-10-18. 표기: [사실]=실행·파일 근거 · [추정] · [미확인].
> 앱 커밋 0 · 앱 package.json 변경 0. 시제품은 `patches/`에만 있습니다. 임시 빌드는 모두 `$TMPDIR/m4b`에서 했습니다(앱 사본 포함).

## 결론 줄
`실현 가능(실측) · 생성기 = (a)안(킷 소스 ?raw 동봉 + site.json 주입) · 위치 제안 `app/src/features/studio/reactZip/`(staticHtml 청크에서 동적 import) · 조작 뒤 청크 reactZip 36.83KB gzip(raw 135.09KB · 시제품 생성기 2파일 약 170줄) · /studio 진입 증분 +0.01(버튼+배선: 정규화 128.80→128.81 · 복원 131.78→131.79 · 렌더 84.29 불변) · 산출 zip 의존성 = react·react-dom 19.3.0 · motion 14.3.0 / dev: vite 8.3.1 · @vitejs/plugin-react 6.1.1 · tailwindcss·@tailwindcss/vite 4.3.3 · typescript 6.0.3 · @types/react·@types/react-dom 19.3.0 · 빌드 검증 = $TMPDIR에 풀어 npm install && npm run build(tsc --noEmit && vite build) exit 0, ego-browser로 렌더 문서와 비교: DOM 정규화 일치 · 64요소 위치·크기 차이 0 · 1280×900 첫 화면 스크린샷 바이트 동일`

## 1. 코드 생성 방식

| 안 | 내용 | 생성기 크기 | 충실도(렌더 iframe 대비) | 판단 |
|---|---|---|---|---|
| **(a) 킷 소스 동봉 + JSON 주입** | `src/kit/*`(테스트 제외 36파일)와 `kit.css`·`motion.css`를 `import.meta.glob(?raw)`로 생성기 청크에 넣습니다. 산출물에서는 `site.json`(doc·kitTokens·실효 모션·main 변수)을 `PageDocument`(폴백 제외판)가 그립니다 | [사실] 청크 36.83KB gzip(raw 135.09KB). 그중 킷 원문이 대부분입니다(킷 TS 18.6KB + CSS 10.0KB, gzip -9 단독 기준) | [사실] 같은 컴포넌트를 쓰므로 DOM이 정규화 후 완전히 같습니다. 남은 차이는 아래 "차이" 참조 | **권장** |
| (b) 섹션별 TSX 코드 생성 | 30개 변형마다 문구를 박아 넣은 JSX 문자열 템플릿을 둡니다 | [추정] 킷 1,486줄에 맞먹는 두 번째 구현(1,500줄 이상). 청크도 (a)와 비슷하거나 큽니다(킷 CSS는 어차피 필요) | [추정] 구현이 두 벌이라 변형마다 대조 테스트가 필요하고, 킷을 바꿀 때마다 어긋날 위험이 있습니다 | 비권장 |
| (c) 직렬화 HTML을 JSX로 감싸기 | 정적 내보내기 markup을 `dangerouslySetInnerHTML` 또는 JSX로 변환합니다 | [추정] 2~3KB | [추정] 높습니다(정적 내보내기와 같은 결과) | "React 프로젝트"라는 요구(편집 가능한 컴포넌트)에 맞지 않습니다 |

- [사실] 킷의 런타임 import는 `react`와 킷 내부뿐입니다(`app/src/test/kitGuard.test.ts`가 강제). 킷 밖 의존은 type-only 2곳(`engine/contracts/pageDoc`·`render/protocol`)이며, 생성기는 경로만 바꿔(`../types/*`) 원문을 함께 넣습니다. 산출물 `tsc --noEmit` strict도 통과했습니다.
- [사실] 엔진 의존(`render/sectionMotion.ts` → `engine/sections/registry` maxMotion)은 생성 시점에 계산해 `site.json.motion`에 넣습니다. 산출물에 엔진 코드는 0입니다.
- [사실] `thumbs/entry.tsx`가 Node에서 `renderToStaticMarkup(<PageDocument/>)`를 쓰는 선례가 있습니다. (a)안의 "킷이 iframe 밖에서도 같은 DOM" 전제와 같은 근거입니다.

### 충실도 실측 (ego-browser, 1280×900, 문서 `ref-a`의 header/sticky-right-cta · hero/fullbleed-left · services/cards-3)
- A = 앱 `dist/render.html`(vite preview)에 같은 `render` 메시지를 보냄 / B = zip 빌드 `dist`(vite preview). 원본: `raw/fidelity.json`, `raw/react-zip-1280.png`
- [사실] `[data-site-root]` outerHTML은 `data-motion-play=""`를 빼면 **같습니다**. 이 속성은 정적 내보내기와 같게 B만 켭니다(모션 재생 스위치).
- [사실] 64개 요소의 계산 스타일·위치·크기를 비교했을 때 **차이는 2개**입니다. 루트·main의 `line-height`(22px vs 21px)이며 배치 영향은 0입니다(문서 높이 1188 = 1188). 글꼴은 양쪽 모두 Pretendard 400·700을 불러왔습니다.
- [사실] 첫 화면 스크린샷 PNG 2장이 **바이트 동일**합니다(`cmp`).
- **차이 1 — 앱 DS 값 누수**: [사실] 킷이 글자 크기·색을 정하지 않은 요소(예: `kit-card-body`)는 렌더 문서에서 앱 `styles/tokens/base.css`의 body 값(body3 14px · `--label-normal` · 흰 배경)을 상속합니다. 1차 비교에서는 카드 본문 16px vs 14px로 services 높이가 416 vs 422였습니다. 시제품 `index.css`에 그 값을 rem/rgb로 풀어 넣어 맞췄습니다. 이는 정적 HTML·zip 내보내기에도 같은 경로로 들어가는 값입니다(결정 질문 Q6).
- **차이 2 — 메뉴 닫기 스크립트**: [사실] 정적 내보내기는 `STATIC_MENU_SCRIPT`(앵커 클릭 시 popover 닫기, `staticMarkup.ts:14`)를 붙이지만 시제품에는 없습니다. [추정] main.tsx에 같은 리스너 1개를 넣으면 됩니다(M4-b 필수 항목).
- [미확인] 업로드 이미지가 있는 문서, 모바일 폭, 30개 변형 전체는 시제품 범위 밖입니다(이미지 슬롯은 자체 그래픽 경로만 확인).

## 2. 산출 zip 구성안 (시제품 실측: 53파일 · 681,956 bytes, 글꼴 2개 538KB 포함 — `raw/zip-listing.txt`)
```
package.json         scripts: dev=vite · build="tsc --noEmit && vite build" · preview  (raw/zip-package.json)
index.html           title·description = 문서 meta(HTML 이스케이프)
vite.config.ts       plugins: react() · tailwindcss()
tsconfig.json        strict · moduleResolution bundler · resolveJsonModule
LICENSES.md          (문안 미정 — Q5)
src/main.tsx         createRoot → <PageDocument site={site.json}/>
src/PageDocument.tsx 앱 render/PageDocument.tsx에서 폴백·편집기 경로를 뺀 것(뼈대·data-* 같음)
src/index.css        @import "tailwindcss" + kit.css + motion.css + body 기본값 + fonts.css
src/fonts.css        쓰는 계열·굵기 @font-face만(faceRule 재사용)
src/site.json        { doc, kitTokens, motion, mainStyle }
src/types/{pageDoc,protocol}.ts   타입 원문(MotionPreset만 치환)
src/kit/*            킷 원문 36파일 + kit.css · motion.css
src/assets/fonts/*.woff2 + OFL.txt
```
- [사실] **앱 의존성 0**: 산출 package.json·vite.config 등은 생성기 안의 문자열입니다(`patches/reactZip/templates.ts`). `motion`은 앱 package.json에 없고 추가도 하지 않았습니다. 생성기 import는 앱 기존 모듈(`storeZip.zipParts`·`siteFontEmbed.faceRule`·`staticZip.fontFileName`·`canvasVars`·`sectionMotion`)뿐입니다.
- [사실] 버전은 앱 설치본과 같게 고정했습니다. motion은 `npm view motion` 기준 14.3.0이며 peer `react ^18 || ^19`입니다.
- [사실] 설치 45패키지의 라이선스: MIT 35 · Apache-2.0 2 · ISC 2 · **MPL-2.0 2(lightningcss · lightningcss-darwin-arm64, tailwind 빌드 도구)** · BSD-3-Clause 1 · 0BSD 1.
- [사실] 산출 빌드 결과는 JS 246.32KB(gzip 76.22) · CSS 30.65KB(gzip 5.97)입니다. motion은 미사용이라 번들 0입니다. 렌더 문서 예산(90/30)으로 보면 안에 듭니다. 정적 내보내기(스크립트 1줄)보다 JS가 76KB 많습니다.
- [사실] M4-a `checkZipEntries`는 index.html·LICENSES.md·assets 외 파일을 실패 처리하므로 재사용할 수 없습니다. 시제품은 `zipParts`만 직접 씁니다. React zip 전용 허용표가 필요합니다(Q4).
- [사실] Tailwind는 preflight + 유틸 2개(`flex flex-col`)만 씁니다. 렌더 문서도 `@import "tailwindcss"`(preflight)를 쓰므로, 충실도를 위해 필요합니다.
- [사실] package-lock.json(설치 결과)은 52,758 bytes(gzip 10.3KB)입니다. 의존성 집합이 고정이라 lock도 내보내기마다 같습니다. 생성기에 문자열로 넣을 수 있습니다(Q3).

## 3. 최소 시제품 (patches/로만)
- `patches/reactZip/{reactZip.ts,templates.ts,reactZip.spike.test.tsx}`: 생성기 + 고정 템플릿 + `$TMPDIR/m4b/react.zip`을 쓰는 임시 vitest입니다. 문서 = `thumbs/referenceDoc.referenceRenderInput("ref-a")`에서 header·hero·services 3종만 남긴 것입니다(`raw/render-input.json`).
- [사실] `unzip -t` 오류 0 → 빈 디렉터리에 풀어 `npm install --no-audit --no-fund && npm run build` **exit 0**: 최종 zip은 npm 캐시가 데워진 상태에서 45패키지 설치+빌드 4초입니다(`raw/zip-npm-install-build.txt`). 첫 실행 18초 로그(`raw/zip-npm-install-build-first.txt`)는 kit.css가 0바이트였던 1차 zip의 것입니다(의존성 집합은 같음). `tsc --noEmit` 통과(`raw/zip-npm-install-build.txt`, `raw/zip-npm-ls.txt`). 레지스트리 `npm ping` PONG 182ms → BLOCKED 아님.
- [사실] 함정: vitest 설정 `css: false`에서는 `?raw` CSS가 **빈 문자열**입니다. 1차 zip은 kit.css 0바이트인데도 빌드는 성공해서 놓칠 뻔했습니다. 시제품은 빈 원문이면 throw하고, 테스트는 CSS를 주입합니다. 실제 vite 빌드 청크에는 킷 CSS가 들어 있음을 확인했습니다(`raw/budget-b2-chunks.txt` hasKitCss true).
- [사실] 시제품에서 고정한 것: 업로드 이미지 미지원(images 0), LICENSES.md 임시 문안, 메뉴 닫기 스크립트 없음.

## 4. 예산 (`$TMPDIR` 앱 사본에서 `npm run build` 3회 — 저장소 앱은 수정하지 않음)
| 단계 | 변경(`patches/budget-step2-wiring.patch`) | /studio 정규화 | 복원 진입 정규화 | raw | 렌더 JS |
|---|---|---|---|---|---|
| b0 기준(사본) | 없음 — 저장소 기준 빌드와 같음 | 128.80 | 131.78 | 130.10 | 84.29 |
| b1 ① 버튼 | `ExportButtons` FORMATS에 react-zip 1줄 | **128.81 (+0.01)** | **131.79 (+0.01)** | 130.11 | 84.29 |
| b2 ② 배선 | ① + `memoryDocBook` react-zip 게이트 제거 + `staticHtml.ts` react-zip 분기(동적 import) + 파일 이름 | **128.81 (+0.01)** | **131.79 (+0.01)** | 130.11 | 84.29 |
- [사실] 생성기 청크 `reactZip` 36.83KB gzip는 조작 뒤(내보내기 버튼 → staticHtml 청크 → 동적 import)라 판정 밖입니다. staticHtml 청크는 10.80KB입니다.
- [사실] 멈춤선(기준선 128.79 + 0.03 = 128.82) 안이라 빌드 검사는 통과합니다. 다만 개정 18 결정 1은 **M4-a 몫**입니다. 개정 17 결정 5의 관례(기능별 몫, 다른 기능은 새 개정)에 따르면 M4-b의 +0.01은 별도 개정이 필요합니다(Q2).
- [사실] 배선 시 기존 테스트 2건이 깨집니다. 둘 다 M4-a 단언이 바뀌는 것이라 예상된 변경입니다(`raw/tests-b2-wiring.txt`):
  - `ExportFlow.test.tsx` "React zip 버튼 0"
  - `memoryExport.test.ts` "react-zip은 계속 GENERATOR_UNAVAILABLE"

## 5. 결정 질문

| # | 질문 | 선택지 | 권장 |
|---|---|---|---|
| Q1 ★ | 생성 방식 | (a) 킷 소스 동봉 + JSON / (b) 섹션별 TSX 생성 / (c) HTML 감싸기 | **(a)** — 실측 충실도 동일, 구현 1벌 |
| Q2 ★ | 예산 개정 | A: 개정 20 M4-b 몫 +0.03 배정(상한 129.13·132.11·raw·렌더 불변) / B: M4-a 몫 남은 분으로 처리 | **A** — 실측 +0.01, 여유 0.02는 이미지·메뉴 스크립트 추가분 |
| Q3 ★ | 산출물 의존성 허용 목록 + lock | 위 10개 고정 + package-lock.json 문자열 동봉(설치는 `npm ci` 안내) / lock 없음 | **lock 동봉** — 하위 의존성이 흔들리면 TRD 빌드 성공률 100%를 장담할 수 없습니다(청크 +~10KB gzip, 조작 뒤). [사실] mac에서 만든 lock에도 rolldown·lightningcss·tailwind oxide의 linux·win32 선택 바인딩 38항목이 들어 있습니다(다른 OS `npm ci`는 미실측). lock은 CI 리눅스 설치본에서 뜨기를 권장합니다 |
| Q4 | React zip 허용표 | 2절 트리 기준 새 허용표(경로 규칙·개수·서명) | 새 허용표(M4-a 표와 분리) |
| Q5 | LICENSES.md 문안 | 킷 소스(생성 도구 산출물) · npm 의존성 라이선스(MPL-2.0 lightningcss 포함, devDependency) · 글꼴 OFL | Hemingway 문안 요청 |
| Q6 | 앱 DS 값 누수(body3 14px·색) | A: zip 템플릿에 값 복사(시제품) / B: 킷이 `[data-site-root]` 기본 글자 크기·색을 직접 정함(렌더·PNG·정적 내보내기 모두 영향 — 별건) | 단기 A + B는 백로그 |
| Q7 ★ | motion/react | A: 의존성만 명시(킷은 CSS keyframes, 번들 0) / B: 빼고 PRD FR-PUB-02 문구 개정 / C: 킷 모션을 motion/react로 재구현 | **A 또는 B 사용자 결정** — C는 충실도 위험이 있고 킷이 두 벌이 됩니다 |
| Q8 | build 스크립트의 `tsc --noEmit` | 포함(타입 3패키지 추가) / vite build만 | 포함 — strict 통과 실측 |
| Q9 | 산출 package.json `engines` | `"node": "^20.19.0 \|\| >=22.12.0"`(= `npm view vite@8.3.1 engines`) 명시 / 생략 | 명시 — Node 18 사용자는 vite 8에서 실패하므로 설치 단계에서 먼저 알리는 편이 낫습니다 |

### 사용자 질의 대상 (별도 표)
| # | 묻는 내용 | 이유 |
|---|---|---|
| U1 (=Q2) | M4-b 진입 몫 +0.03 개정 승인 | ADR-004 개정은 영환님 승인 사항 |
| U2 (=Q7) | motion/react를 쓰지 않는 의존성으로 둘지, PRD 문구를 고칠지 | PRD 수용 기준 문구 해석 |
| U3 (=Q3) | 산출물 의존성 10개 버전 고정 + lock 동봉 승인 | 산출물 공급망 범위 결정 |

## 6. 위험·미확인
- [미확인] Linux·Windows·다른 Node 버전에서의 설치·빌드. 실측 환경은 darwin-arm64 · Node v24.12.0 · npm 11.6.2 하나입니다.
- [미확인] 앱 실제 경로(버튼 → staticHtml 청크 → 동적 import → 내려받기) 실행. 설치·빌드한 zip은 vitest 경로에서 CSS를 주입해 만든 것입니다. 실제 vite 빌드 청크에 킷 CSS·`data-site-root`가 들어 있다는 것까지만 확인했습니다(`raw/budget-b2-chunks.txt`).
- [미확인] 업로드 이미지(Blob → `src/assets/images/*` + import 맵), 모바일 폭, 30개 변형 전체의 충실도. M4-b 착수 시 변형 전체 DOM 대조 테스트를 권장합니다(thumbs SSR 선례 활용).
- [추정] 서브셋 글꼴: 내보낸 뒤 사용자가 문구를 고치면 서브셋 밖 글자는 대체 글꼴로 보입니다. LICENSES·README에 고지가 필요합니다.
- [사실] 시제품 생성기는 렌더 iframe을 열지 않습니다(글꼴 바이트만 `loadSiteFonts` 경로를 재사용). 따라서 정적 내보내기보다 실패 경로가 적습니다.

## Codex 검증 (1회 · `review --scope branch --base 41fcfd25`)
- 결과: 지적 0건. "앱 코드는 변경되지 않았으며 … 수정이 필요한 버그는 발견하지 못했습니다. 이미지 지원과 메뉴 닫기 등 명시적으로 제외한 기능은 범위 밖 결함으로 판단하지 않았습니다. 테스트·빌드는 재실행하지 않았습니다."

## 서브에이전트
- Explore 1개(읽기 전용, 킷 구조 조사) — 완료. 결과는 1·2절과 PROGRESS 로그에 반영했습니다.
