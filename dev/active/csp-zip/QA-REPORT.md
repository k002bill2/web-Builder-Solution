# CSP-2 QA REPORT — 정적 zip·React zip CSP 독립 검증 (정적·회귀)

- 대상 tip `bf17d779` · 브랜치 `k002bill2/csp-zip` · QA = Claude Code(Orca) · 2026-10-20
- 제약: 브라우저·docker·Codex 금지 → 런타임 항목은 **기존 로그 재판독**만(재실행 0)
- 상태: **초안 — 진행 중**

## 1. fresh 게이트·예산
(진행 중)

## 2. 변이 5종
(진행 중)

## 3. CSP-AC 판정표 재판독
(진행 중)

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
(미확정)
