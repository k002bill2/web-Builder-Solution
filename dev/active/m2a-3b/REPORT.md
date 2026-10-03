# M2A-3b 정적 HTML 생성기 + 내려받기 — REPORT

- 브리프 `docs/06-handoff/M2A-3B_STATIC-HTML_BRIEF.md` · 시작 커밋 `a51de92` · 브랜치 `k002bill2/m2a-3b`

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | 08640e5 | 수신 기록 · REPORT 골격 · `gate.sh`(실패 시 exit 1) |
| G0 | 1f81368 | 3a Codex(P1 0 · P2 3 → 3c) · F6 브라우저 GENERATOR_UNAVAILABLE·대화상자 캡처 — 코드 변경 0 |
| G1~G4 | (이 커밋) | PoC 비교표 · serialize/html 프로토콜 · 정적 HTML 생성기 · 전역 슬롯 등록 · 완료 문구·내려받기·파일 이름 · RED 로그 · 번들 시도 7회 |

## 2. G0 이관 확인 (3a Codex · F6 브라우저)
### 2.1 Codex `review --scope branch --base bec1b38` (원문 `logs/g0-codex-3a.txt`)
**P1 이상 0 → 이 레인 코드 변경 0.** P2 3건 판정:
| # | 지적 | 판정 |
|---|---|---|
| P2-1 | `useExportFlow.ts:30-32` `loadFlow()`(조작 뒤 청크 import) 실패 시 `running`이 남아 두 버튼 영구 비활성 | **사실(재현 경로: 청크 교체·오프라인).** 3b 범위 밖(정적 HTML 생성기와 무관) — M2A-3c로 넘김(9절). 고칠 때 `retryableImport` + `finally` 해제 |
| P2-2 | 저장 대기 중 편집이 새 경고를 만들면 확인 대화상자 없이 요청 | **사실(드묾 — 저장 대기 수백 ms 사이 편집).** 서버 게이트는 경고를 막지 않으므로(8.3.2 5단계 = 차단만) 결과 피해는 "확인 안 한 경고"뿐. M2A-3c로 넘김(9절) |
| P2-3 | 2단 배치에서 필수 섹션 이동 대상이 닫힌 `<details>` 안이라 포커스 실패 | **사실 가능성 높음(2단 배치 한정).** 게이트 이동(3a E2) 영역 — 3b 범위 밖, M2A-3c로 넘김(9절) |

### 2.2 F6 브라우저 (`logs/g0-flow.txt` · vite dev 127.0.0.1:4337 · 앱 안 클릭만)
- **게이트 통과 가능 확인**: A안 진입 = SEO 메타 차단 2 + 구조 미리보기 2(Portfolio·Testimonials). r4.11로 대체텍스트 차단 **0**. 폴백 2개 삭제 → "페이지 정보"에서 제목·설명 입력 → 게이트 7줄 통과(성능 예산 측정 전) · 이유 0 · 두 버튼 열림. 우회 픽스처 0.
- **G0 시점(생성기 없음) "정적 HTML 내보내기"** → info Callout "정적 HTML은 생성기 연결 후(다음 단계) 내보낼 수 있습니다. 지금 문서는 이 탭에 저장돼 있습니다 — …" · `role=alert` 아님 · 콘솔 오류 0 → `shots/g0-1440-unavailable.png`
- **경고만 상태**(제목 63자 = R-11 warn) → 확인 대화상자 `open` · `:modal` true · 첫 포커스 "경고를 확인했습니다 · 내보내기" · 배경 지점 최상위 = dialog(배경 조작 불가) · Esc → 닫힘 → `shots/g0-1440-dialog.png`
- **캡처 폭 1440(브리프 1280과 다름)**: ego-browser는 흐름·DOM 조회는 됐으나 `Page.captureScreenshot`이 매번 CDP 시간 초과(창 viewport 160×113 상태, 새 page·bringToFront·raw 모두 실패) → aside repl로 캡처. aside는 뷰포트 조절 수단이 없어 창 기본 1440×900. 파일 이름에 실제 폭을 적었다.
- 관찰 1건: Esc 뒤 포커스가 body(연 버튼 아님). aside `click()`이 버튼에 포커스를 주지 않아 opener가 body였던 것으로 추정 — G6에서 키보드(포커스 → Enter → Esc)로 재확인(6절).

## 3. 생성 방식 PoC · 결정 (G1)
**결정: (a) 숨은 sandbox iframe 직렬화 + (b) 부모가 `/render.html` 스타일시트 텍스트를 인라인.** 판정 기준 = 캔버스와 같은 마크업(FR-PUB-03) · 렌더 문서 예산 · `/studio` 진입 증가 · 새 의존성 0.
| 안 | 결과 = 캔버스 마크업 | 렌더 JS(멈춤선 89.70) | `/studio` 진입 | 새 의존성 | 판정 |
|---|---|---|---|---|---|
| (a)+(b) 숨은 iframe(`/render.html`, `sandbox="allow-scripts"`, 폭 80rem=1280)에 잡 스냅샷 문서를 render → 첫 `rects` 뒤 `serialize` → `html{markup}` | 같은 킷 코드·같은 DOM(새로 그림 → `details`·시트 닫힘, K-AC-06) | **80.12**(+0.23 — `serialize` 처리·`serializeSite`만) | 126.70(7절) | 0 | **채택** |
| 렌더 문서 안 `react-dom/server` `renderToStaticMarkup` | 같은 컴포넌트지만 서버 렌더 경로(popover·이미지 URL 처리 별도) | **140.55**(+60.66, 예산 90 초과 — `logs/g1-poc-react-dom-server.txt`, 임시 import로 빌드 후 원복) | 0 | 0(react-dom 안) | 기각 — 예산 |
| 보이는 캔버스 iframe을 직렬화 | 지금 문서(잡 스냅샷 아님) · 사용자가 연 `details`·시트 상태가 섞임(K-AC-06 위반) | 0 | 0 | 0 | 기각 — 잡 문서·K-AC-06 |
- CSS: 불투명 출처 iframe 안에서는 `link` 시트의 `cssRules`를 읽을 수 없어 부모(같은 출처)가 `/render.html` → `link[rel=stylesheet]` → CSS 텍스트를 받는다. 렌더 CSS 6.32KB(gz) 전체를 넣는다(폴백 와이어프레임 규칙 제거는 하지 않음 — 크기 이득 작고 규칙 선택 오류 위험). **dev 서버는 CSS를 JS로 주입해 링크가 없으므로 생성기가 실패한다(빌드 산출물 전용 — 9절).**

## 4. 직렬화 프로토콜 (G2)
- `protocol.ts`: 부모→렌더 `serialize`(다른 필드 무시) 추가 · 렌더→부모 `HtmlMessage{type:"html", markup}` 타입 추가. **읽기 함수 `readHtmlMessage`·상한 `HTML_MAX`(8,000,000자)는 `render/htmlMessage.ts`**(protocol.ts에 두면 편집기 진입 청크에 실림 — 8절). 편집기 다리 `readRenderMessage`는 html을 읽지 않는다(테스트).
- 렌더 쪽 `serializeSite`: `[data-site-root]` 복제의 outerHTML(클릭 받는 래퍼 0) · 렌더 문서 `blob:` 이미지 → data URL · 원본 DOM 불변 · 루트 없으면 답 없음(부모 시간 초과).
- 부모 쪽 `buildStaticHtml`(정리·조립, `features/studio/staticHtml/staticMarkup.ts`): 불활성 문서(`createHTMLDocument`)에 innerHTML → 폴백 표식 있으면 실패(정리 전 판정) → `script·iframe·object·embed` 제거 · `on*` 속성 제거 · CSS가 쓰지 않는 `data-*` 제거(남김 = `data-site-root·data-kit·data-layout·data-tone·data-always` — kit.css·render.css 선택자 실측) · `details[open]` 제거 → `blob:` 남으면 실패 → head(charset·viewport·title·description·style)를 DOM으로 조립. CSS에 `@import`·data: 아닌 `url()` = 실패(외부 요청 0).
- RED: `logs/g2g3g4-red.txt`(7 파일 실패 — 모듈 없음·html 미지원) → GREEN 표적 342/342(`logs/g4.txt`).
- 테스트: `render/protocol.test.ts`(+2) · `render/serializeSite.test.ts`(3) · `staticHtml/staticMarkup.test.ts`(7 — 문서 머리·사용자 글자 DOM 대입·script/on*/details[open]/편집기 흔적 0·K-AC-08·폴백 실패·blob:/외부 CSS 실패·루트 없음).

## 5. 생성기 · 내려받기 (G3 · G4)
- **생성기** `features/studio/staticHtml/staticHtml.ts` `createStaticHtmlGenerator(store)` — 입력 `{projectId, doc}`(잡의 스냅샷 문서, 3a F3) → 킷 토큰 = `docKitTokens(store 계열, doc.profileVersion)`(없으면 실패) → CSS 텍스트 → 숨은 iframe `ready → render{doc, kitTokens} → rects → serialize → html` → `buildStaticHtml`(title·description = 문서 `meta` 값) → `TextEncoder` 바이트 1번 → SHA-256 앞 12자리(`crypto.subtle`) · 같은 바이트로 Blob `text/html;charset=utf-8` → object URL. 상한 8초(exportFlow 조회 상한 10초보다 짧게) 넘으면 `JOB_TIMEOUT`, 그 밖(렌더 오류·폴백·CSS 없음) = 저장소가 `INFRA`로 기록. iframe은 `finally`에서 제거.
- 숨은 iframe: `sandbox="allow-scripts"`(그대로, allow-same-origin 0) · `aria-hidden` · `tabIndex -1` · 화면 밖(`left:-200vw`, 폭 80rem) · 받는 쪽 `event.source === iframe.contentWindow`.
- **등록(8절 · 7절)**: 생성기 청크 import는 편집기 조작 뒤 청크 `exportFlow`가 하고, 저장소 본문(`memoryDocBook`, 조작 뒤)은 **전역 심볼 슬롯** `Symbol.for("design-studio/static-html-generator")`(`STATIC_HTML_SLOT`)으로 받는다. 주입 생성기(`generators`)가 있으면 그것이 먼저, 없고 슬롯이 채워졌으면 static-html = 브라우저 생성기(store당 1개, 처음 쓸 때 생성), 둘 다 없으면 6단계 `GENERATOR_UNAVAILABLE`(3a 기본·테스트 그대로). `deferredStudio`·`memoryProjectRepository`·`ExportJob`·`ExportGenerator` 변경 0. react-zip = 계속 `GENERATOR_UNAVAILABLE`.
- **object URL 해제**: 같은 프로젝트 재생성(같은 잡 재실행 포함) → 생성기가 이전 URL 해제 · 편집기 이탈 → 결과 화면의 `DownloadLink`가 내려질 때 경로가 바뀌었으면 `releaseDownloads()`(새 요청·탭 전환으로 내려질 때는 같은 경로라 유지).
- **결과(G4 · E-S27)**: `role=status` info Callout "정적 HTML을 만들었습니다 · 내보내기 전 상태는 스냅샷 '내보내기 전 · HH:MM'에 있습니다" + 부모 문서 `<a href=blob: download="<정리된 이름>_r<revision>.html">내려받기</a>` + "결과 해시 xxxxxxxxxxxx". 파일 이름 = K-AC-32 정리 규칙(`exportFileName.ts`) HTML판. 계측 `export_succeeded(format)`만(프로젝트·파일 이름 0).
- 테스트: `staticHtml.test.ts`(6 — 순서·Blob·해시 = 결과 바이트 SHA-256·결정적·재생성 해제·release·JOB_TIMEOUT·렌더 오류/폴백 = 실패(JOB_TIMEOUT 아님)·CSS 없음/킷 토큰 없음 = iframe 안 엶·iframe sandbox/출처 검사/제거) · `exportFileName.test.ts`(9) · `memoryExport.test.ts`(+2 — exportFlow 청크가 슬롯 채움 · 슬롯 비면 UNAVAILABLE/채우면 succeeded·받은 문서 = 잡 문서·react-zip UNAVAILABLE) · `ExportFlow.test.tsx`(+1 — 완료 문구·내려받기 href/download·해시·export_succeeded format만).

## 6. K-AC · E-AC 판정 (G5 · G6)
(작성 예정)

## 7. 번들 표 (체크포인트별)
| 시점 | 공통 | `/studio` 첫/진입 | `/compare` 진입 | `/profile` 진입 | `/projects` 진입 | 렌더 JS/CSS | 근거 |
|---|---|---|---|---|---|---|---|
| 기준선 a51de92 | 89.34 | 91.75 / **126.67** | 121.69 | 118.65 | 100.28 | 79.89 / 6.32 | `logs/g0-baseline.txt` |
| 시도 1: deferredStudio에 지연 import 래퍼 | 89.35 | 91.75 / **126.75 ✗** | 121.77 | 118.74 | 100.37 | 79.89 | `logs/g3-wrapper-stub.txt` |
| 시도 2: 래퍼 단순화(default export) | 89.34 | 91.75 / **126.74 ✗** | 121.77 | 118.73 | 100.36 | 79.89 | `logs/g3-wrapper-stub2.txt` |
| 시도 3: 래퍼를 memoryDocBook(조작 뒤)로 + 앱은 `"browser"` 표식 | 89.35 | 91.77 / **127.00 ✗** | 121.72 | 118.68 | 100.31 | 80.12 | 생성기가 data 청크에서 import → protocol·docPurpose가 새 공유 청크로 분리(+0.33) |
| 시도 4: 생성기 import를 exportFlow로 + 작은 등록 모듈 | — | **126.84 ✗** | 121.74 ✗ | 118.69 | 100.34 ✗ | 80.12 | 등록 모듈 청크가 docBook preload 목록에 붙음 |
| 시도 5: 등록을 memoryDocBook에 + exportFlow가 정적/동적 import | — | 126.47 / 126.90 | **121.89·121.92 ✗** | 118.84 ✗ | 100.44 ✗ | 80.12 | `studioStore`가 deferredStudio에서 분리(+0.44 청크) |
| 시도 6: 전역 심볼 슬롯 + `useExportFlow` 이탈 해제 effect | 89.34 | 91.75 / **126.72 ✗** | 121.70 | 118.65 | 100.29 | 80.12 | effect·export 접착 코드 |
| **최종(G4)**: 이탈 해제를 조작 뒤 `ExportAfter`로 · `readHtmlMessage`를 `htmlMessage.ts`로 | 89.35 | 91.76 / **126.70** | 121.72 | 118.67 | 100.31 | **80.12 / 6.32** | `logs/g4.txt` · `logs/g3-bundle.txt` |
- 최종 증감: `/studio` 진입 **+0.03(=멈춤선 126.70)** · 첫 +0.01 · 공통 +0.01 · `/compare` +0.03 · `/profile` +0.02 · `/projects` +0.03 · `/catalog` +0.01 · `/references/:id` +0.01 · 렌더 JS +0.23(serialize만). 남은 `/studio` +0.03 = `StudioLayout` 청크가 생성기 청크에 내보내는 접착 코드(`docKitTokens`·`readRenderMessage`)와 청크 이름 해시 변화(gzip ±수 B). 진입 청크에 생성기 코드 0.
- 청크별 gzip 비교(기준선 vs 최종, `/tmp` 실측): `deferredStudio`·`memoryProjectRepository` 변경 0 · `StudioLayout` +약 50B · 생성기 `staticHtml` 2.3KB · `exportFlow` +0.7KB · `ExportAfter` +0.1KB · `memoryDocBook` +0.1KB(전부 조작 뒤).

## 8. SPEC 차이
- 파일 이름: m2a 3.3(PNG) `{이름}_{폭}_r{revision}` → HTML판은 **폭 표기 없음** `<정리된 이름>_r<revision>.html`(정적 HTML은 반응형 한 파일 — 폭이 없다). 정리 규칙은 같다.
- 브리프 G2 "protocol.ts에 html 추가": 타입은 protocol.ts, **읽기 함수·상한은 `render/htmlMessage.ts`**(protocol.ts는 편집기 진입 청크라 `/studio` +0.05 — 7절).
- 브리프 G3 "등록: deferredStudio/memoryProjectRepository 생성기 주입 경로에 지연 import 래퍼": 래퍼만으로 진입 +0.07~0.08(멈춤선 초과, /compare·/profile·/projects ±0.03도 초과) → **조작 뒤 청크 두 곳(exportFlow → 전역 심볼 슬롯 → memoryDocBook)**으로 등록. 주입 경로(`generators`)는 그대로이고 먼저 쓴다.
- 결과 Callout: 3a는 완료 문구에 role 없음 → `role=status`로 감쌈(완료 알림을 읽게).

## 9. 남은 위험 · M2A-3c에 넘길 것
(작성 예정)
