# CSP-2 QA REPORT — 정적 zip·React zip CSP 독립 검증 (정적·회귀)

- 대상 tip `bf17d779` · 브랜치 `k002bill2/csp-zip` · QA = Claude Code(Orca) · 2026-10-20
- 제약: 브라우저·docker·Codex 금지 → 런타임 항목은 **기존 로그 재판독**만(재실행 0)
- 상태: **판정 확정**

## 1. fresh 게이트·예산 (tip 상태, 2026-10-20 18:36 실행)
| 게이트 | 명령 (`app/`) | 결과 |
|---|---|---|
| typecheck | `npm run typecheck` | exit 0 |
| lint | `npm run lint` | exit 0 |
| test | `npx vitest run --maxWorkers=4` | **379 files / 3416 tests passed** · exit 0 |
| build | `npm run build` | exit 0 |

예산(`check-bundle-size` 출력): `/studio` 정규화 **128.76KB**(기준선 128.76, 멈춤 > 128.79) · 복원 **131.76KB**(기준선 131.75, 멈춤 > 131.78) · 렌더 JS **84.30**/90 · CSS **8.89**/30 · "정적 zip CSP 가드(렌더 CSS @font-face 밖 url(data:) 0개) 통과" · React zip 진입 정적 포함 0 가드 통과 → BRIEF 기대값 전부 **재현**.


## 2. 변이 5종 (각각 적용 → 대상 테스트 → `git checkout`으로 되돌림 · 로그 `logs/qa-mutations.txt`)
| # | 변이 | 실행 테스트 | 결과 | 잡은 단언 |
|---|---|---|---|---|
| M1 | `STATIC_CSP_ZIP` `img-src 'self'` → `'self' data:` | `staticHtml/` | **FAIL** | AC-07 픽스처 2건 mismatch · meta 1회(split 길이) · SPEC 문자 동일 · 지시어 집합 |
| M2 | zip meta 제거(`if (target === "html") meta(...)`) | `staticHtml/` | **FAIL** | AC-02·04·06·07·11(zip) 전부 + `assertStaticHead` throw로 zip export 테스트(Blob·index.html·결정성)까지 연쇄 실패 |
| M3 | 템플릿 plugin `apply: "build"` 줄 삭제(항상 적용) | `reactZip/` | **FAIL** | `toContain('apply: "build"')` · 실행형 테스트 `csp.apply` = undefined |
| M4 | `injectTo: "head-prepend"` → `"body"` | `reactZip/` | **FAIL** | `toContain('injectTo: "head-prepend"')` · `transformIndexHtml()` 반환 deepEqual |
| M5 | `zipCssGuard` `.replace(FACE_RULE, "")` 제거 | `scripts/zipCssGuard.test.mjs` | **FAIL** | "@font-face 안 url()은 보지 않는다" — `['url(data:']` ≠ `[]` |

- 5/5 변이가 테스트로 잡힘. 각 변이 뒤 `restored: clean` · 최종 `git status`에 앱·픽스처 변경 0(파일 스냅샷은 `run` 모드라 덮어쓰지 않음).
- 관찰: M3·M4는 템플릿 **문자열** 단언 + `new Function` 실행형 단언 2겹. 실제 Vite가 `apply`/`injectTo`를 해석한 결과는 E1 docker 로그(C1 head 첫 자식 · C2 dev meta 0)가 유일한 증거 — 단위 테스트 범위 밖.


## 3. CSP-AC 판정표 재판독 (REPORT 표 ↔ 실제 단언·로그)
| AC | REPORT | QA 재판독 근거 | QA 판정 |
|---|---|---|---|
| AC-02 | 통과 | `staticCspZip.test.ts:50-55` meta 1 · `children[1]` · content = SPEC 1.2 리터럴(`SPEC_CSP_ZIP`, 생성기 상수와 독립) · M2 FAIL | 뒷받침됨 |
| AC-04(zip) | 통과 | `:58-65` 재파싱 유일 script sha256 = 정책 안 해시 · 정책 해시 = 상수 · M2 FAIL | 뒷받침됨 |
| AC-06(zip) | 통과 | `:73-98` 정상 통과 · html 정책 교차 · content 1글자 · 누락 · refresh · CSP 중복 · base · link · 위치(late) → throw | 뒷받침됨 |
| AC-07(zip) | 통과 | `:37-43` meta 제거 = `__fixtures__/csp-base-zip-*.html`(toMatchFileSnapshot) + meta 정확히 1회 · M1·M2 FAIL. 문서 범위는 픽스처 2건(basic·assets) | 뒷받침됨 |
| AC-08(zip) | 통과 | `:103-117` 지시어 집합 deepEqual · `data:`·http(s)·`*`·`'unsafe-eval'`·report/sandbox 0 · 브랜드 0 · M1 FAIL | 뒷받침됨 |
| AC-09 | 통과 | `reactZipCsp.test.ts` 4건(SPEC 1.3.2 리터럴 · 템플릿 문자열 · 실행형 transformIndexHtml · 소스 index.html http-equiv 0) + 허용표가 같은 `VITE_CONFIG` 상수(5절) · M3·M4 FAIL | 뒷받침됨 |
| AC-10 | 게이트 | 1절 fresh 재현 128.76 · 131.76 · 84.30/8.89 · React zip 진입 가드 | 뒷받침됨 |
| AC-11 | 통과(범위 주의) | 단위: 킷 CSS 원문만(`:132-140`, 양성 대조 포함). 빌드 CSS는 Codex 반영 `zipCssGuard`가 `npm run build`에서 판정 — fresh 빌드 "0개 통과" · M5 FAIL | 뒷받침됨(빌드 가드로 한계 보완) |
| C1 | 통과 | `e1-c1-docker-build.txt` 실제 생성기 · node:22 `npm ci && npm run build` exit 0 · dist head 첫 자식 meta · 인라인 0 · preview 위반 0(`e1-r4-preview.txt`) | 뒷받침됨 (RZ-AC-C1 Node 20.19 행렬은 5절 갭) |
| C2 | 통과 | `e1-c2-dev.txt` http-equiv 0 · HMR noReload | 뒷받침됨 |
| R3 | 통과(Chromium) | `e0-r3-file.txt` — **E0 임시 삽입본**(문자 동일 정책) · 이미지·글꼴·메뉴 = 무CSP 대조와 동일 · 양성 대조 유효 · Safari·Firefox [미확인] | 뒷받침됨(관찰 AC · 실제 생성기 출력 재측정 없음 [L2]) |
| R4 | 통과(범위 주의) | `e1-r4-preview.txt` 390 메뉴 닫힘·hash · 위반 0 · 양성 대조. SPEC 4.1 R4는 "REACTZIP 4.1 대조 통과"까지 — 라이브 대조 없음, SSR 단위(`fidelity.test.tsx`)만 | **부분** — REPORT가 범위 주의로 스스로 밝힘 |

- REPORT의 서술 1건 보정: E0 표 "인라인 `<script>` 0"의 E0 로그(`e0-c1-preview-measure.txt`)는 양성 대조 **뒤** 센 `inlineScripts:1`이라 단독 증거가 아니다. E1 `dist/index.html` 원문(`e1-c1-docker-build.txt`)이 직접 증거 → 결론 영향 없음.


## 4. 로그 재판독 (재실행 0 — 파일만 읽음)
| 로그 | 위반 0 주장 | 양성 대조(해시 밖 인라인 script) | 판독 |
|---|---|---|---|
| `e0-r3-file.txt` 정적 zip+CSP `file://` | `load1280.violations []` · `violationsMenu []` · csp 1 · 이미지 4/4 ok · Pretendard 400·700 loaded · 메뉴 open→`#s-contact-1`→open:false | `executed:false` · `newViolations` 1(`script-src-elem` inline) | **일치** |
| 같은 파일 무CSP 대조 | csp 0 · 위반 0 · 이미지·글꼴·메뉴 동일 | `executed:true` · 위반 0 (CSP 없음 = 정상 — 리스너는 CSP 있을 때만 발화) | **일치**(대조군 유효) |
| 같은 파일 static-html `file://` (**B-SEC-08 R1·R5**) | csp 1 · 이미지 4/4(data:) · 위반 0 · 메뉴 닫힘(R5) | executed:false · 위반 1 | **일치** — R1 위반 0·R5 닫힘이 양성 대조와 함께 보존됨 |
| `e0-c1-docker-build.txt` | node v22.23.3 · npm 10.9.9 · `BUILD_EXIT=0` | — | 빌드 성공만 기록. meta 위치·인라인 0은 이 파일에 없음 → E1 로그로 확인(아래) |
| `e0-c1-preview-measure.txt` | csp 1 · 위반 0(로드·메뉴) · 메뉴 닫힘 · `--site-primary #8B5E3C` | executed:false · 위반 1 | **일치**. 주의: `inlineScripts:1`은 `measure()`(양성 대조 주입) **뒤**에 센 값(`scripts/e0-c1-preview.mjs`) → 주입 script 1개 = 원래 0과 모순 아님. 단 이 로그 단독으로 "인라인 0"을 증명하지는 못함 |
| `e0-c1-preview-lazy.txt` | 스크롤 뒤 이미지 4/4 complete | — | 1280 `ok:false` 1건 = lazy 미로딩 설명과 일치 |
| `e1-c1-docker-build.txt` (실제 생성기) | `BUILD_EXIT=0` · `dist/index.html` 원문: CSP meta 1 · **head 첫 자식** · content(엔티티 디코드) = 1.3.2 상수 · 인라인 script 0(module `src` 1 + stylesheet link 1) | — | **일치** — C1 정적 계약(SPEC 195행) 직접 증거 |
| `e1-r4-preview.txt` (실제 생성기) | csp 1 · 위반 0 · 390 메뉴 open→anchor→닫힘 · hash `#s-contact-1` | executed:false · 위반 1 | **일치**. 관찰: 1280 이미지 3번 `ok:false`·`waitTimeout` — E1에선 lazy 재확인 로그 없음(E0와 같은 문서·같은 JS 해시 `index-BPHr-n2i.js`라 같은 원인으로 추정, [추정]) |
| `e1-c2-dev.txt` | dev HTML `http-equiv` 0 · `/@vite/client` 1 · react-refresh 인라인 프리앰블 1 · first csp 0 · 섹션 10 · outline `rgb(26,38,32)`→`rgb(1,2,3)` noReload | — (dev엔 CSP가 없어야 정상) | **일치** |
| 종료 확인 | `e0-c1-preview.txt`·`e1-r4-preview-server.txt`·`e1-c2-dev.txt` 끝: docker 0 · 4399 LISTEN 0 | — | 일치 |

- R3 증거의 성격: `static-csp/index.html`은 E0 **임시 삽입본**(`patches/insert-static-csp.py`)이다. 삽입 문자열 = `STATIC_CSP_ZIP`과 문자 동일(QA 대조) · 위치 = charset 바로 뒤(생성기와 같음) · E1 실제 생성기 출력으로 `file://` 재측정은 없음 — AC-07(zip) 테스트가 "meta 제거 = base 바이트 동일"을 보장하므로 동등성은 [추정, L2].


## 5. React zip 템플릿 ↔ lock·허용표·RZ-AC · 새 의존성
- 새 의존성 0: `git diff main...bf17d779 -- app/package.json app/package-lock.json app/src/features/studio/reactZip/template` = 빈 diff(산출 `package.json.tpl`·`package-lock.json.tpl` 불변). 템플릿의 `type Plugin`은 기존 직접 의존성 `vite`에서 import(새 패키지 아님).
- 허용표(REACTZIP 2.4): `checkReactZipEntries.ts:19` `"vite.config.ts": VITE_CONFIG` · `reactZip.ts:81` `textEntry("vite.config.ts", VITE_CONFIG)` — 생성기와 검사기가 **같은 상수**를 쓰므로 바이트 동일 계약 유지. SPEC 2.4 행도 "CSP plugin 포함 템플릿"으로 개정됨.
- lock 대조(`template.test.ts` RZ-AC-10·11·12·14·15·17): lock·package 템플릿 불변이라 영향 없음 — 1절 전체 테스트 결과로 재확인.
- C3 산출 예산: `e1-c1-docker-build.txt` JS 77.70KB · CSS 5.98KB gzip ≤ 90/30 — 통과.
- **관찰(갭)**: 개정된 RZ-AC-C1은 "고정 템플릿(`vite.config.ts`)이 바뀌면 이전 결과 증거 불인정 → 재실행"이고 행렬은 **Node 20.19 · 22**다. CSP-2 로그는 `node:22`(v22.23.3) **`npm ci`만** 있다 — Node 20.19와 `npm install && npm run build`(PRD 문구) 재실행 기록 없음. CSP-AC-C1(CSP-SPEC) 자체는 통과로 보되, RZ-AC-C1 행렬 완결은 미확인.


## 판정
**PASS (머지 차단 결함 0 · 관찰 3건)**
- 1 fresh 게이트 4종 exit 0 · 379/3416 · 예산 4값·zip CSS 가드 BRIEF 값 그대로 재현.
- 2 변이 5/5 FAIL로 잡힘 · 전부 되돌림.
- 3 AC-02·04·06·07·08·09·10·11·C1·C2·R3 뒷받침됨 · R4 = 부분(REACTZIP 4.1 라이브 대조 없음, REPORT가 이미 밝힘).
- 4 로그의 위반 0 주장과 양성 대조(위반 1·미실행)가 모두 실제로 찍혀 있음 · B-SEC-08 R1·R5 보존 확인.
- 5 새 의존성 0 · lock·package 템플릿 불변 · 허용표 = 같은 상수.

관찰(차단 아님, 후속 판단 대상):
1. RZ-AC-C1 행렬(Node **20.19**·22 · `npm install` 경로) — 템플릿 변경 후 재실행 기록은 node:22 `npm ci`뿐. CSP-AC-C1 자체는 충족.
2. R3는 E0 임시 삽입본 측정 — 실제 생성기 zip의 `file://` 재측정 없음(AC-07로 동등성 [추정 L2]).
3. E1 R4 1280 이미지 1장 `ok:false` — E0 lazy 재확인과 같은 원인으로 추정, E1 재확인 로그 없음.

