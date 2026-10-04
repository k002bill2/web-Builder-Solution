# M2A-3c PNG 내려받기 + 3b 이관 — REPORT

- 브리프 `docs/06-handoff/M2A-3C_PNG_BRIEF.md` · 시작 커밋 `eaa3d5e` · 브랜치 `k002bill2/m2a-3c`

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | 7fac872 | 수신 기록 · REPORT 골격 · `gate.sh` |
| C0(1)·C1 | 5c92add | 3b Codex(P1 0 · P2 3 → M2a 마감) · 전역 슬롯 판단(유지) · C1 공간 실측 → 진입 ≤126.70 경로 없음, 정지 — 코드 변경 0 |
| C0(2)·C5 | a9c59fb | K-AC-12·30 브라우저 판정 · vitest ×3 · REPORT 마감 · 서버 0 — 코드 변경 0 |
| C1 보강 | 3a64e22 | 후보안 2 실측(126.79 / 126.74 — 둘 다 초과) · K-AC-12 원인 정정(렌더 문서 스크립트) · 게이트 순서 공개 |
| R1 | c068b5a | `/studio` 진입 한도 128 — ADR-004 개정 4(3.R절) |
| R2 | ff525ff | 정적 HTML 고정 인라인 스크립트(r4.12) · RED→GREEN · 이관 표(2.4절) |
| R2 [B] | 262b396 | K-AC-12 5항 PASS(새로 내보낸 HTML · 390) |
| C2 | 1d5103a | 캡처 방식 PoC — data: SVG foreignObject 채택 · 브라우저별 오염 표(4절) |
| C3 | a6dc714 | PNG 묶음 진입 · 캡처 청크 · 4상태 · 파일 이름 · 계측(5절) — 진입 127.20 |
| C4 수정 | d84f31a | 캡처 iframe 화면 안·투명(`openCaptureFrame`) · 바닥 > 0 rects 대기(`settled`) — RED `logs/c4-fix-red.txt`·`c4-frame-red.txt` · gate `logs/c4-fix.txt` exit 0(5.1절) |
| C4 판정 · C5 | 마감 커밋(브랜치 HEAD) | K-AC·E-AC 판정(6절) · PNG 1280·390(`shots/c4-png-*.png`) · Codex(10절) · REPORT 마감 |

## 2. C0 이관 (3b Codex · 전역 슬롯 · K-AC-12·30)
### 2.1 Codex `review --scope branch --base a51de92` (원문 `logs/c0-codex-3b.txt` · 진행 로그 `logs/c0-codex-3b.raw.txt`)
- 범위 주의: `--scope branch`는 HEAD 기준이라 3b(`a51de92..3fb670a`)에 p2fix(`0b8c9e5`)·브리프 문서까지 들어갔다. 지적 3건은 모두 3b 파일이다.
- **P1 이상 0 → 이 레인 코드 변경 0.** (Codex 메모: 읽기 전용 샌드박스라 vitest는 못 돌렸고 typecheck만 통과 확인)

| # | 지적 | 판정 |
|---|---|---|
| P2-1 | `ExportAfter.tsx:73-75` 편집기 이탈 때 내려받기 URL을 해제 → 돌아와 같은 revision을 다시 요청하면 멱등 잡이 해제된 `downloadRef`를 돌려줘 "내려받기"가 죽는다(문서를 고치기 전까지 복구 안 됨) | **사실.** 3b가 알고 둔 한계(`exportDownloads.ts` 주석 · 3b REPORT 9절). 고치는 길 = 잡이 살아 있는 동안 URL 유지(누수 vs 죽은 링크) 또는 해제된 결과 재생성 — 잡·멱등 규칙(8.3.2) 판단이 필요해 **M2a 마감으로**(9절) |
| P2-2 | `memoryDocBook.ts:96-99` 생성기 청크 첫 로드가 실패하면 rejected Promise가 `browser`에 남아 다시 시도해도 즉시 실패 | **사실.** 슬롯 로더(`exportFlow.ts`의 `import("./staticHtml/staticHtml")`)가 `retryableImport`가 아니고 `browser ??=`가 실패를 기억한다. 오프라인·청크 교체 때만. 고치기 = 실패 시 `browser = undefined` + 슬롯 로더를 `retryableImport`로(조작 뒤 청크 안이라 진입 증가 0 예상) — **M2a 마감으로**(9절) |
| P2-3 | `staticMarkup.ts:44` `blob:` 검사가 `outerHTML` 전체 정규식이라 본문·대체텍스트에 글자 "blob:"이 있으면 정상 문서도 영구 INFRA 실패 | **사실(드묾).** 검사 대상을 URL 속성(`src`·`href`·`srcset`·`style` url())으로 좁히면 된다 — **M2a 마감으로**(9절) |

### 2.2 전역 심볼 슬롯 판단 (`Symbol.for("design-studio/static-html-generator")`)
**결정: M2a 동안 유지. 실서버 저장소(M4) 때 제거(서버 생성기로 대체).** 근거와 비용:
| 안 | 내용 | 진입 영향(근거) | 비용·위험 | 판정 |
|---|---|---|---|---|
| 유지(지금) | exportFlow(조작 뒤)가 슬롯을 채우고 memoryDocBook(조작 뒤)이 읽음 | 0(3b 7절 최종) | 숨은 전역 — 테스트 격리는 `memoryExport.test.ts` `afterEach delete`로 처리 중. 모듈 캐시 때문에 한 파일에서 슬롯을 지운 뒤 exportFlow를 다시 import해도 다시 안 채워짐(테스트는 이를 피해 가짜 공장을 직접 넣음). P2-2(실패 기억)가 이 경로 | **유지** |
| A. `deferredStudio`/저장소 생성 때 `generators` 주입 + 지연 import 래퍼 | 3b 브리프 원안 | **+0.07~0.08**(3b 시도 1·2 실측) — 지금 여유 0.06 초과 | 진입 초과 | 기각 |
| B. 작은 등록 모듈(정적 import) | 등록 함수만 진입에 | **+0.20**(3b 시도 4 — docBook preload에 붙음) | 진입 초과 | 기각 |
| C. `ProjectRepository`에 `registerGenerator(format, loader)` 메서드 | 전역 대신 저장소 인스턴스에 등록 | 추정 +0.02~0.05(L3, 빌드 안 함 — memoryProjectRepository가 진입 자동) | **저장소 인터페이스 변경**(브리프 금지 범위 경계 — `ExportGenerator`는 그대로지만 계약 표면 증가), 여유 0.06 소모 | M4 판단 대상 |
| D. M4 실서버 저장소 | 생성은 서버(또는 서버가 지정한 생성기) → 브라우저 슬롯 불필요 | 0 | M4 범위 | **대체 시점** |
- 번들 영향 요약: 슬롯을 없애는 모든 진입 쪽 대안은 3b 실측상 +0.07 이상이라 **지금 여유(0.06)로는 불가**. 대체는 M4(D) 또는 진입 여유가 생긴 뒤(C).

### 2.3 K-AC-12 · K-AC-30 브라우저 판정 (`logs/c0-kac12-30.txt`)
- 대상: 3b 결과 HTML `dev/active/m2a-3b/logs/j-export-sample_r2.html`(앱 새 내보내기는 C1 정지로 생략 — `git diff --stat 3fb670a eaa3d5e -- app/src/kit app/src/features/studio/staticHtml app/src/render` 결과 빈 출력, 즉 3b 이후 킷·생성기·렌더 코드 변경 0이라 같은 결과). python `http.server` 127.0.0.1:4339 · ego-browser · 뷰포트 390×844(CDP) · 입력은 CDP 실제 마우스·키 이벤트.
| AC | 항목 | 결과 |
|---|---|---|
| K-AC-12 | "메뉴" 누름 → 시트 열림(`:popover-open`) | **PASS** |
| | Tab 다음 = "닫기" | **PASS** |
| | Esc → 닫힘 + 포커스 = "메뉴" 버튼 | **PASS** |
| | 시트 안 앵커("문의" → `#s-contact-1`) → 대상 섹션 이동 · 제목이 header에 안 가려짐 | **PASS**(hash 바뀜 · 제목 top 168 > sticky header bottom 61) |
| | 시트 안 앵커 → **시트 닫힘** | **FAIL** — `:popover-open` 그대로. 킷 `HeaderStickyRightCta`는 스크립트 0(네이티브 popover)이고 `<a>`는 `popovertarget`을 가질 수 없어 앵커 누름이 시트를 닫지 않는다. 캔버스에서는 렌더 문서 스크립트(`render/RenderApp.tsx:87` `anchor.closest("[popover]")?.hidePopover()`)가 닫아 주지만, 정적 HTML은 생성기가 스크립트를 지우므로(3b 4절) 이 동작이 빠진다 |
| K-AC-30 | 입력칸 누름 + Enter · 버튼 누름 + Enter → 페이지 이동·요청 0 | **PASS** — URL 불변 · resource 항목 0→0 · 입력 `:disabled`(fieldset disabled)라 포커스도 안 들어감 · `form action` 없음 |
- **K-AC-12 FAIL 1항은 정적 HTML 생성기 쪽 사안**(캔버스 동작은 렌더 문서 스크립트가 담당 — 정적 결과에 같은 닫기를 넣으려면 생성기가 작은 인라인 스크립트를 넣거나(3b "script 0" 규칙 개정) 스크립트 없는 대안을 SPEC이 정해야 함) → 3c 범위 밖, **M2a 마감 판단으로**(9절). 이 레인 코드 변경 0.
- 캡처: `Page.captureScreenshot` CDP 시간 초과 2회(3b 2.2와 같은 증상). 열린 시트 상태는 Chrome headless `--screenshot`으로 재현할 수 없어 판정은 DOM 조회로만 했다(캡처 0).

### 2.4 재개 R2 — 정적 HTML 고정 인라인 스크립트 (2a-05 SPEC r4.12 · K-AC-12)
- 구현: `staticMarkup.ts` `STATIC_MENU_SCRIPT`(생성기 상수) — `document` 위임 `click` 리스너 1개 → `a[href^="#"]`가 `[popover]` 안이면 그 popover `hidePopover()` · `hidePopover`가 함수가 아니면 아무것도 안 함 · `preventDefault` 0(앵커 이동은 기본 동작 그대로 — 스크립트가 꺼져도 이동은 됨). `buildStaticHtml`이 `<head>` 끝(`style` 다음)에 `script` 요소 1개로 넣는다(`textContent` = 상수, 속성 0). 사용자 글자·URL·문서 값 0 · `on*` 속성 0 · 외부 요청 0.
- RED: `logs/r2-red.txt`(6 실패 — 상수 없음) → GREEN: `src/features/studio/staticHtml` 26/26 · gate `logs/r2.txt` exit 0.
- 새 테스트(`staticMarkup.test.ts` "고정 인라인 스크립트" 3개): ① 서로 다른 문서 2개에서 결과에 `<script>{상수}</script>` 정확히 1개(바이트 일치) · 상수에 fetch·import·URL·innerHTML·eval 0 ② 제목·설명·슬롯 마크업에 `</script><script>…`가 있어도 파서 기준 script 1개 = 상수 · 고정 블록 문자열 1회 ③ 동작: 시트 안 앵커 → `hidePopover` 1회 · 시트 밖 앵커·외부 링크 → 0 · `hidePopover` 없는 시트 → 오류 0 · 기본 동작 안 막음.
- 판정 [B] K-AC-12 5항(390, **앱에서 새로 내보낸 HTML** `logs/r2-export_r2.html` — script 1개 = 상수 바이트 그대로): `logs/r2-kac12.txt` · vite preview 4337에서 내보냄(dev 서버는 render.html CSS link가 없어 생성기가 설계대로 실패 — `staticHtml.ts` kitCss) · python 4339 · 390×844 CDP · 실제 입력(CDP 마우스·키).
| K-AC-12 항목 | 결과 |
|---|---|
| "메뉴" 누름 → 시트 열림(`:popover-open`) | **PASS** |
| Tab 다음 = "닫기" | **PASS** |
| Esc → 닫힘 + 포커스 = "메뉴" | **PASS** |
| 시트 안 앵커("문의" → `#s-contact-1`) → **시트 닫힘** | **PASS**(C0 FAIL → r4.12 고정 스크립트로 해소) |
| → 대상 섹션 이동 · 제목이 header에 안 가려짐 | **PASS**(hash 바뀜 · 제목 top 168 > sticky header bottom 61) |

**이관 표 — "script 0"을 보던 3b 단언 중 r4.12로 바뀐 것만** (그 밖 단언 변경 0)
| 파일 · 테스트 | 3b 단언 | 바뀐 단언 | 근거 |
|---|---|---|---|
| `staticMarkup.test.ts` "사용자 글자는 DOM으로만…" | `querySelectorAll("script")` 길이 0 | script 목록 = `[STATIC_MENU_SCRIPT]`(제목·설명의 `<script>`는 여전히 글자 — `doc.title`·`content` 단언 그대로) | r4.12 "고정 스크립트 1개만 허용" — 사용자 글자가 요소가 되지 않는다는 원래 뜻은 유지 |
| `staticMarkup.test.ts` "script 0 · on* 속성 0 …" → "고정 스크립트(바이트 일치) 외 script 0 · on* 속성 0 …" | 더러운 마크업(`<script>alert(1)</script>` 삽입) 뒤 script 0 | script 목록 = `[STATIC_MENU_SCRIPT]` — 삽입된 스크립트는 여전히 지워짐(on*·data-*·details 단언 그대로) | r4.12 생성기 검사 = "그 고정 스크립트(바이트 일치) 외 `script` 0" |
| `staticHtml.test.ts` "ready → render … iframe 닫음" | `html` 에 `/<script\|<link/` 0 | `<link` 0 · `src` 있는 script 0 · script 블록 전체 = `[<script>{상수}</script>]` | 같음 — 외부 자원 0 뜻은 유지 |

## 3. C1 공간 실측 — **결론: 진입 ≤ 126.70 경로가 실측으로 보이지 않음 → C2 전에 정지(브리프 C1)** → **재개에서 해소**(ADR-004 개정 4 · 3.R절 · 진입 127.20 ≤ 127.70)
SPEC 3.3·K-AC-19는 PNG 이름표·버튼·캡션·"준비 전" 이유가 **진입 때부터** 보이길 요구한다 → 이 묶음은 `/studio` 진입 청크(StudioLayout)에 있어야 한다. 예산 상수·멈춤선은 바꾸지 않았다.

| 측정 (`/studio/:projectId` 진입 직후, gzip KB) | 진입 | 멈춤선 126.70 대비 | 근거 |
|---|---|---|---|
| 기준선 `eaa3d5e` | **126.64** | 여유 0.06 | `logs/c1-baseline.txt` |
| 시제품 전체(PngSave 4상태·캡션·계측 진입 · 캔버스 `onDrawn` · 캡처 청크는 자리만) | 127.16 | **+0.46 초과** | (빌드 출력, 이 표) |
| + `ConflictCallout` 지연(lazy) | 127.07 | +0.37 | **기각** — 충돌 회복 UI를 지연 청크에 두면 3a P2-1 r2 원칙("회복 안내는 지연 청크에 기대지 않는다")과 충돌 · 스크립트 `afterAction` 목록에 없는 동적 import라 진입 합계에서 조용히 빠진 숫자 |
| **최소 시제품**(진입 = 이름표·버튼·캡션 2문장·준비 전 이유·실패 alert 문장 · 성공 문장·계측·오류 코드·인자 조립은 캡처 청크로 · ConflictCallout 원복) | **127.10** | **+0.40 초과** | `logs/c1-proto-min.txt` · 패치 `logs/c1-proto.patch` |
| 후보안 2: PNG 묶음을 "검사 · 내보내기" 누른 뒤 lazy로(+ 준비 전 `onDrawn` 진입) | 126.79 | +0.09 초과 | `logs/c1-option2.txt` (조작 뒤 PngSave +1.29) |
| 후보안 2b: 위에서 `onDrawn` 배선도 뺌(준비 전 상태 없음) | 126.74 | +0.04 초과 | `logs/c1-option2b.txt` |
| 원복 뒤 | 126.64 | 여유 0.06 | `logs/c1.txt` · `logs/c5.txt` |

- **필요 절감량 = 127.10 − 126.70 = 0.40KB.** 시제품은 하한이다(실구현은 상태 정리·테스트 훅·폭 라벨 연결로 더 붙는다 — 3a 2절과 같은 성격).
- 모듈별 분해(StudioLayout 청크 16.40KB, `logs/c1-attr.txt` — 비례 추정): PngSave **0.59** · StudioLayout 2.34 · StructureCanvas 1.31 · useAutosaveScheduler 0.85 · GateList 0.64 · StudioPanels 0.60 · gateView 0.58 · FieldEditor 0.50 · useSectionOps 0.46 · **useExportFlow 0.42** · ConflictCallout 0.22 · ExportRetryAlert 0.14.
- 우선순위 1(S-B5 "조작 뒤" 진입 코드 이동): 진입에 남은 조작 뒤 코드는 사실상 `useExportFlow`뿐인데, 버튼 상태·저장 대기 effect·확인 대화상자 상태는 진입에 있어야 하므로 옮길 수 있는 것은 그 일부다. **모듈 전체(0.42)를 빼야 겨우 0.40을 덮는 상한 계산 → 실제 경로 없음**(리팩터 없이 증명). ConflictCallout·ExportRetryAlert·SaveStatus 실패 문장은 회복 UI라 지연 금지(P2-1 r2).
- 우선순위 2(중복·미사용 정리): 3a 2절 실측과 같다 — 진입 큰 항목은 모두 S-B4 첫 화면·자동 조건 코드. 이번 분해에서도 1KB 단위 미사용 코드 없음.
- 우선순위 3(문구 상수 공유): 캡션 "구조 미리보기 섹션 {N}개"는 같은 청크의 `fallbackReason`과 이미 gzip 창 안에서 겹친다 — 공유해도 0.0x.

**후보안 (영환님 결정 — 추천 순, 이 레인은 C2~C4를 진행하지 않음)**
1. **3a 옵션 B — `/studio`가 진입 때 받지만 부르지 않는 보드·생성 저장소 코드를 공유 store 로더 밖으로(별도 레인)**: 3a 추정 −4.5~5.5(L3, 3a 2절). 큰 여유를 만드는 유일한 안. 위험 = 2a-04 store 배선 변경 · `/compare`·`/profile` ±0.03 규칙. 이 레인 범위 밖(브리프 "중복·미사용 정리"를 넘는 구조 변경).
2. **SPEC 3.3 개정 — PNG 묶음을 조작 뒤 청크로 늦게 그림**("검사 · 내보내기"를 누른 뒤 `lazy` PngSave를 그림 · `STUDIO_AFTER_ACTION`에 PngSave 등록해 조작 뒤 크기 출력): **실측 진입 126.79(+0.09 초과)** · 조작 뒤 +1.29 (`logs/c1-option2.txt`). "준비 전" 배선(캔버스 `onDrawn`)까지 빼면 **126.74(+0.04 초과)** (`logs/c1-option2b.txt`). **이 안만으로도 멈춤선 안에 들지 않는다** — 남는 진입분 = lazy 래퍼·표시 상태·캡처 인자 조립 클로저. 1과 묶거나 3과 묶어야 성립. 비용 = K-AC-19 "준비 전"·3.3 "진입 때부터"·1280 오른쪽 열 상시 표시 문장 개정.
3. **ADR-004 개정 — `/studio` 진입 멈춤선 +0.40 이상(실구현 여유 포함 +0.5 권장; 2와 묶으면 +0.1 이상)**: ADR-004 개정 3이 "추가 상향 금지"라 영환님 결정 사안.

### 3.R 재개 — R1 `/studio` 진입 한도 128 (ADR-004 개정 4 · 영환님 1-★A)
- 변경: `app/scripts/check-bundle-size.mjs` `/studio/:projectId` `eagerBudgetKb` 127 → **128**(주석 "ADR-004 개정 4"). 다른 라우트·첫 화면·렌더 예산 변경 0. `scripts/bundleBudget.test.mjs`의 127은 가짜 시나리오(`/page`) 고정값이라 그대로.
- 판정선: 진입 ≤ **127.70**(멈춤선, 상향 금지 — 개정 4 결정 3·4).
| 빌드 출력 `/studio/:projectId` | 진입 | 한도 | 근거 |
|---|---|---|---|
| 바꾸기 전(HEAD `1c4e389`) | 126.64 | 127KB | `logs/r1-before.txt` |
| 바꾼 뒤 | 126.64 | **128KB** | `logs/r1-after.txt` · gate `logs/r1.txt` exit 0 |

## 4. 캡처 방식 PoC (재개 C2 — `logs/c2.txt` · `logs/c2-poc.html`)
**결론: 기본안 채택 — 숨은 렌더 iframe `serialize` 마크업 + 킷 CSS → XHTML → SVG `foreignObject` → **`data:` URL** `Image` → `canvas` → `toBlob("image/png")`.** 새 의존성 0. `blob:` URL로 SVG를 그리면 세 엔진 모두 캔버스가 오염된다 → `data:` 고정(테스트로 고정).
- 재료: R2에서 앱이 새로 내보낸 HTML의 사이트 루트 + 인라인 CSS(= serialize + kitCss와 같은 재료). PoC는 브라우저 자동화 없이 각 브라우저를 `open -a`로 열고 결과를 python 서버 접근 로그(`/log?…`)로 받았다.

| 브라우저 | `data:` 1280 | `data:` 390 | `blob:` 1280 | 그려짐 확인 |
|---|---|---|---|---|
| Chromium 152(ego) | 오염 0 · PNG 1.09MB | 오염 0 · 0.35MB | **오염**(toBlob SecurityError) | `shots/c2-poc-{1280,390}.png` — 캔버스와 같은 배치(1280 = 바 nav·CTA, 390 = "메뉴" · 1단) |
| Chrome 154 | 오염 0 · 1.09MB | — | — | 흰색 아닌 픽셀 65.1% · hero 픽셀 갈색 |
| Edge 151 | 오염 0 · 1.09MB | 오염 0 · 0.35MB | **오염** | 63.6%(390) |
| Safari 27.0.1(WebKit) | 오염 0 · 1.70MB | 오염 0 · 0.31MB | **오염**("The operation is insecure.") | 65.6% / 63.6% · hero 픽셀 갈색 |
| Firefox | **미실측 — 이 기기에 설치돼 있지 않음** | | | 9절 위험 |
- 미디어 쿼리는 SVG 이미지 폭으로 판정된다(390 결과가 모바일 배치) → 원래 폭 캡처 = SVG `width` = 프레임 폭.
- 실제 경로가 PoC와 다른 점(C3에서 처리): ① 폴백 섹션 허용(정적 HTML 생성기는 폴백 = 실패 — PNG 빌더는 따로) · `data-kit-marker` 등 data-* 유지(표식 색 CSS 선택자) ② 숨은 iframe 폭 = 미리보기 폭 · 높이 = 렌더 문서 rects 바닥(부모는 불투명 출처라 문서 높이를 직접 못 잼) ③ 캔버스 높이 상한 초과 = 실패 상태.

## 5. PNG 흐름 (재개 C3 — 버튼 · 4상태 · 캡션 · 파일 이름 · 계측)
- RED `logs/c3-red.txt`(14 실패 — 모듈·함수 없음) → GREEN: `src/features/studio/png` + `PngSave.test.tsx` 16/16 · gate `logs/c3.txt` exit 0(표적 = `src/components/studio`·`src/features/studio` 237/237).
- **진입 청크(`StudioLayout`)** — `components/studio/PngSave.tsx`: 내보내기 묶음(두 버튼 · 이유 목록 · 결과) 다음, 위 구분선 + 이름표 `h3` "이미지로 저장" · outline "PNG 내려받기"(아이콘 0) · 캡션 상시 "지금 미리보기 폭({폭 이름} · {폭})의 페이지 전체를 한 장으로 저장합니다." + 폴백 N>0이면 "구조 미리보기 섹션 N개는 표식과 함께 담깁니다." · `aria-describedby` = `png-caption`(준비 전엔 `png-wait png-caption`) — 내보내기 이유 id와 분리 · 4상태: 준비 전 `aria-disabled` + "미리보기를 그리는 중입니다" / 진행 `aria-busy` "PNG 만드는 중…"(두 번 누름 무시) / 성공 `role=status` "PNG를 내려받았습니다 · {파일 이름}" / 실패 `role=alert` "PNG를 만들지 못했습니다 — 다시 눌러 주세요"(같은 버튼 재시도 · 캡처 청크를 못 받아도 뜸). 준비 = 캔버스 `onDrawn`(렌더 문서 rects 받음) + 저장 대기 아님. 1280·1024 오른쪽 열 / 390·768 "검사" 탭 = 같은 `GatePanel exports` 자리(배치별 코드 없음).
- **조작 뒤 청크** `features/studio/png/pngCapture.ts`(+4.55KB, `STUDIO_AFTER_ACTION` 등록): `savePng` → `png_requested(view)` → 숨은 렌더 iframe(폭 = `FRAME_REM[view]` — 축소 비율 무시) render → rects → serialize → 마크업 + `kitCss` → `buildCaptureSvg`(폴백 허용 · data-* 유지 · script/iframe/on*/details[open] 제거 · XHTML) → **`data:` URL** → `Image.decode` → canvas(높이 = 섹션 rects 바닥) → `toBlob("image/png")` → 부모 `<a download>` 클릭 · 1초 뒤 object URL 해제 → `png_succeeded(view, fallback_count)`. 실패 = `png_failed(reason = RENDER_TIMEOUT | CANVAS_TOO_TALL | CANVAS_TAINTED | INFRA)`. 상한: 높이 16384 · 넓이 16,777,216px.
- 파일 이름 `pngFileName` = 3b `exportFileStem` 재사용 + `_{폭}_r{revision}` + 폴백 있으면 `_구조포함`(K-AC-32 6사례 테스트).
- 공유 변경(조작 뒤 청크만): `staticHtml.ts` — (C3 때 `openRenderFrame(widthRem = 80)` → C4 수정에서 3b 원형 `openRenderFrame()`으로 되돌리고 PNG는 `openCaptureFrame` — 5.1절) · `renderAndSerialize`가 `{markup, rects}`를 돌려줌·export · `kitCss`/`defaultFetchText` export · kitTokens 없으면 render에서 뺌. 정적 HTML 생성기 동작·`ExportGenerator`/`ExportJob`/엔진 계약 변경 0 · `requestExport` 경로 0(PngSave는 저장소를 모른다 — 통합 테스트로 `requestExport` 0 확인). sandbox `allow-scripts` 그대로.
- `tEXt` 메타데이터: 하지 않음(브리프 제외 — SPEC 선택 항목).
- 스냅샷 미리보기 중 캡처(E-S29): 스냅샷 미리보기 UI가 아직 없어 해당 없음(9절).

### 5.1 C4 중 발견한 수정 (`d84f31a`)
- 증상(브라우저 실측): 앱에서 "PNG 내려받기" → rects가 모두 0 → 높이 0. 원인 = Chrome은 화면 밖(`left:-200vw`)·`visibility:hidden` 교차 출처 iframe을 배치하지 않는다. 또 렌더 문서는 레이아웃 전 0 크기 rects를 먼저 보낼 수 있다.
- 수정: `openCaptureFrame(widthRem, heightRem)` — 화면 안(`left/top 0`) · `opacity 0` · `pointer-events none` · `z-index -1` · 높이 = 캔버스 상한 1024rem(내용보다 낮으면 세로 스크롤바만큼 폭이 줄어 배치가 달라짐) · `sandbox="allow-scripts"`·`aria-hidden`·`tabIndex -1` 그대로. `renderAndSerialize(…, settled)` — PNG는 `pageBottom(rects) > 0`인 보고까지 기다림.
- RED: `logs/c4-fix-red.txt`(0 크기 rects 먼저 → 2 실패) · `logs/c4-frame-red.txt`(`openCaptureFrame` 없음 → 1 실패) → GREEN gate `logs/c4-fix.txt`(표적 `src/components/studio`·`src/features/studio` 238/238 · 가드 76/76 · typecheck·lint·build exit 0).
- **3b 정적 HTML 경로 영향 0**: `openRenderFrame()`은 3b 원형(−200vw · 80rem · hidden — `git show a6dc714`의 − 줄과 같음)으로 되돌아갔고 `settled` 기본값 = 항상 true라 생성기 흐름은 그대로. `staticHtml.test.ts`·`staticMarkup.test.ts`(3b·R2 단언)는 같은 gate 표적에서 변경 없이 통과 → 8절 항목 없음.

## 6. K-AC · E-AC 판정
- [B] 근거 = 앱(서버 4337)에서 실제로 내려받은 PNG를 `shots/`에 복사한 것: `shots/c4-png-1280.png`(1280×3364) · `shots/c4-png-390.png`(390×3198). 수정 뒤 결과인 근거: 캡처 12:39:19·12:40:00 > 소스 마지막 수정 12:38:43, 그리고 수정 전 코드는 rects 0 → 높이 0이라 이 크기의 PNG가 나올 수 없다 → 다시 캡처하지 않음.
- 이전 실행은 버튼 상태·status 문장·계측(`__ev`)을 로그로 남기지 않았다 → 아래 K-AC-19·32·34·E-AC-49·50은 **[U]로 판정**(근거 = `logs/c4-fix.txt` 이번 fresh 실행 238/238). 실제 내려받기 파일 이름도 `~/Downloads`에 남아 있지 않아 [B] 확인 불가.

| AC | 판정 | 근거 |
|---|---|---|
| K-AC-12 | **PASS**(5항 — 재개 R2, 고정 스크립트) · C0 때 부분 FAIL | 2.4절 · 2.3절 |
| K-AC-30 | **PASS** | 2.3절 |
| K-AC-17 | **PASS [B]·[U]** | PNG 1280·390 모두 "구조 미리보기" 표식 2개(최근 작업 · 이용하신 분들의 이야기)가 원래 크기(1:1 폭 PNG)로 담김 · 빗금 플레이스홀더 그대로. 캡처 규칙: sticky header 맨 위 · details(FAQ) 닫힘 · 390 메뉴 시트 닫힘 · 오버레이·편집기 UI 0 · 390 = "메뉴" 1단 / 1280 = 바 nav·CTA. [U] `pngCapture.test.ts` "폴백 섹션이 있어도 실패하지 않는다 · 표식…" |
| K-AC-19 | **PASS [U]** | `PngSave.test.tsx` "PNG 버튼 4상태" 4개(이름표·캡션·describedby / 준비 전 aria-disabled + 이유 / 진행 aria-busy · 두 번 누름 무시 → 성공 role=status / 실패 role=alert · 같은 버튼 재시도) |
| K-AC-32(PNG판) | **PASS [U]** | `pngCapture.test.ts` "파일 이름 (K-AC-32 PNG판)" — `{이름}_{폭}_r{revision}.png` · `_구조포함` · `???`→page · con→page-con · 40자 · 서로게이트 쌍 + "캡처 흐름" 파일 이름 = 폭·revision·_구조포함 |
| K-AC-34 | **PASS [U]** | `pngCapture.test.ts` "내려받기 · 계측" — `png_requested(view)` · `png_succeeded(view, fallback_count)` · `png_failed(reason)` · 이름·파일 이름·슬롯 글자 0 |
| E-AC-49 | **PASS [U]** | PNG = `requestExport` 밖 — "캡처 흐름 … requestExport 경로 0" · PngSave는 저장소를 모름 |
| E-AC-50 | **PASS [U]** | `PngSave.test.tsx` "게이트 차단 + 폴백 → 내보내기 두 버튼은 막혀도 PNG는 열림 · … requestExport 0" |

- **캔버스 캡처와 나란히: 하지 않음.** 편집기 캔버스는 앱 안 클릭으로만 도달하는 메모리 store 상태라 Chrome headless `--screenshot`으로 재현할 수 없고, ego-browser `Page.captureScreenshot`은 3b·3c 내내 시간 초과(2.3절 · 9절 5번). 대신 C2 PoC(4절 · `shots/c2-poc-*.png` — 캔버스와 같은 배치 확인)와 같은 배치임을 이 PNG로 확인했다.

## 7. 번들 표
| 시점 | 공통 | `/studio` 첫/진입 | `/compare` 진입 | `/profile` 진입 | `/projects` 진입 | `/catalog` 진입 | `/references/:id` 진입 | 렌더 JS/CSS | 근거 |
|---|---|---|---|---|---|---|---|---|---|
| 기준선 eaa3d5e | 89.35 | 91.78 / **126.64** | 121.71 | 118.67 | 100.30 | 102.03 | 99.38 | 80.12 / 6.32 | `logs/c1-baseline.txt` |
| C1 최소 시제품(원복됨) | 89.35 | 91.78 / **127.10 ✗** | 121.71 | 118.66 | 100.29 | — | — | — | `logs/c1-proto-min.txt` |
| C1 원복 뒤 | 89.35 | 91.78 / 126.64 | 121.71 | 118.67 | 100.30 | 102.03 | 99.38 | 80.12 / 6.32 | `logs/c1.txt` |
| C3 PNG 묶음 | 89.35 | 91.78 / **127.20** ≤127.70 | 121.71 | 118.66 | 100.29 | 102.04 | 99.39 | 80.12 / 6.32 | `logs/c3.txt` · 조작 뒤 pngCapture +4.55 |
| C4 수정 뒤(마감) | 89.35 | 91.78 / **127.20** / 한도 128 · 멈춤선 127.70 | 121.69 | 118.66 | 100.30 | 102.03 | 99.38 | **80.12** ≤89.70 / 6.32 | `logs/c4-fix.txt` · 조작 뒤 pngCapture +4.64 |

## 8. SPEC 차이
- (재개 C3) **"준비 전"에 저장 대기(`dirty`·`saving`)도 포함** — 파일 이름 `{revision}`이 캡처한 문서의 revision이 되게(저장 전 편집이 있으면 `savedRevision`과 문서가 어긋남). 이유 문장은 SPEC 그대로 "미리보기를 그리는 중입니다"(편집 직후 캔버스도 다시 그림).
- (재개 C3) 이름표는 `h3`(GatePanel `h2` 아래 위계) · object URL 해제는 클릭 1초 뒤(즉시 해제하면 일부 브라우저가 내려받기를 끊음).
- (재개 C3) SPEC "다시 그리는 중" 준비 전: 캔버스는 첫 rects 뒤 `drawn` 유지(문서 교체마다 끄지 않음) — 캡처는 숨은 iframe에 지금 문서를 새로 그리므로 결과는 항상 지금 문서.
- (C4 수정) SPEC·브리프의 "숨은 렌더 iframe"을 PNG 캡처에서는 **화면 안 · 투명 · 누름 통과 · 맨 뒤** iframe으로 — Chrome이 화면 밖·hidden 교차 출처 iframe을 배치하지 않아 rects 0(5.1절). 사용자에게는 보이지 않고 누름·포커스·접근성 트리 밖이라 뜻(숨김)은 유지, sandbox 그대로.
- (C4) 실제 PNG와 캔버스 캡처 나란히는 하지 않음 — 캡처 도구 시간 초과(6절 끝).
- 게이트 순서: 골격 커밋 `7fac872`는 `gate.sh` 실행 전에 커밋했다(문서만). 직후 기준선 gate `c1-baseline` exit 0(GATE OK). 그 뒤 커밋은 모두 gate exit 0 확인 뒤.
- 브리프 C0 Codex 범위: `--scope branch --base a51de92`가 HEAD 기준이라 p2fix·브리프 문서 커밋도 포함됐다(지적 3건은 모두 3b 파일 — 2.1절).
- K-AC-12·30 대상: 앱에서 새로 내보낸 HTML 대신 3b 결과 파일(브리프가 허용한 대안).

## 9. 남은 위험 · M2a 마감에 넘길 것
1. ~~[결정 필요] PNG 진입 공간~~ → ADR-004 개정 4(영환님 1-★A)로 해소 · 진입 127.20(멈춤선 127.70 대비 여유 0.50). 다음 `/studio` 진입 증가분은 이 여유 안에서만.
2. ~~K-AC-12 "시트 안 앵커 → 시트 닫힘" FAIL~~ → 재개 R2(r4.12 고정 스크립트)로 해소(2.4절).
3. 3b Codex P2 3건(2.1절): 이탈 후 같은 잡 재요청 시 죽은 내려받기 링크 · 생성기 청크 실패 기억 · `blob:` 글자 오탐.
4. 전역 심볼 슬롯 — M2a 유지, M4 실서버 저장소 때 제거(2.2절). P2-2를 고칠 때 슬롯 로더를 `retryableImport`로.
5. 캡처 도구: ego-browser `Page.captureScreenshot` 시간 초과가 계속된다(3b·3c). 상호작용 상태 캡처가 필요한 판정은 DOM 조회로만 가능.
6. 스냅샷 미리보기 중 캡처(E-S29) — 스냅샷 미리보기 UI가 아직 없음(브리프 제외).
7. **3c Codex P2 3건(10절 · `logs/c5-codex.txt`) — 이 레인 미반영(P1만 수정 규칙) → M2a 마감으로:**
   - P2-a `StudioLayout.tsx:347-350` 자동 저장 `failed`·`offline`·`stale`이면 미저장 편집이 남아도 PNG가 열려 파일 이름 `r{savedRevision}`과 내용이 어긋남(8절 "준비 전 = dirty·saving"이 이 세 상태를 덮지 않음). 고치기 = 준비 조건을 `idle`·`saved`로 좁히거나 미저장 표기.
   - P2-b `pngCapture.ts:82-84` `kitTokens` 없음(프로필 조회 실패) → 렌더 문서의 `NO_KIT_TOKENS`를 `renderAndSerialize`가 즉시 실패로 처리 → 캔버스엔 중립 폴백이 보이는데 PNG는 실패. 고치기 = PNG 경로만 이 메시지를 무시하고 폴백 rects를 기다림(정적 HTML 실패 정책 유지).
   - P2-c `pngCapture.ts:78-79` 브라우저 기본 글꼴 ≠ 16px이면 iframe rem 폭과 SVG `rem*16` 폭이 달라 배치·높이 불일치. 고치기 = `StructureCanvas`처럼 실제 rem px로 좌표계 통일.
8. 캔버스와 실제 PNG 나란히 비교 — 캡처 도구 문제로 미실시(6절 끝). 도구가 고쳐지면 1회 확인 권장.
9. Firefox 캡처 오염 여부 미실측(4절 — 미설치).

## 10. C5 마감 검증
- 전체 vitest ×3(`app`, `npx vitest run`, HEAD 코드 = `eaa3d5e`와 같음): **run1·2·3 exit 0 · 173 파일 · 1632/1632 · Errors 줄 0** (`logs/c5-vitest-x3.txt`).
- gate(`gate.sh c5`): 아래 커밋 직전 실행 — typecheck·lint·build·가드 exit 0, 번들 = 7절 기준선과 같음(`logs/c5.txt`).
- Codex `review --scope branch --base eaa3d5e`: **해당 없음** — 이 레인 코드 변경 0(문서·로그만). C0 Codex는 2.1절.
- 서버: 이 레인이 띄운 것은 python `http.server` 127.0.0.1:4339(PID 58386) 하나 — K-AC 판정 뒤 종료. vite dev·preview 0. `lsof -nP -iTCP:4337 -sTCP:LISTEN` → 결과 0(rc=1) · `:4339` → 결과 0(rc=1).

### 10.R 재개 C5 마감 (축소 재개 · 2026-10-04)
- Codex `review --scope branch --base 38852bf`(재개 전체 = R1·R2·C2·C3·C4 수정, 원문 `logs/c5-codex.txt`): **P1 0 · P2 3**(9절 7번) → 코드 변경 0. Codex 메모: typecheck 통과 · 읽기 전용 샌드박스라 vitest는 EPERM으로 못 돌림.
- gate(`gate.sh c5r`): 마감 커밋 직전 실행 — **GATE OK**(표적 238/238 · 가드 76/76 · typecheck·lint·build exit 0 · `/studio` 진입 127.20/128 ≤127.70 · 렌더 JS 80.12 ≤89.70) `logs/c5r.txt`.
- 전체 vitest ×3: **Jarvis 담당 — 이 레인은 실행하지 않음**(축소 재개 지시). 이 레인의 vitest 근거는 gate 표적·가드뿐.
- 서버: 축소 재개 실행은 서버를 띄우지 않음(앞 실행이 남긴 4337 vite PID 64375 · 4339 python PID 80528은 Jarvis가 종료). 마감 확인: `lsof -nP -iTCP:4337 -sTCP:LISTEN` → 결과 0 · `:4339` → 결과 0.

