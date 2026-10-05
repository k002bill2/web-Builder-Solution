# M2B-2c REPORT — 후기·가격·예약·CTA 4변형 (재개 ★A · 실렌더 30/30)

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-2c` + Claude Code (Opus 5.5, medium) · 서브에이전트 0
- 시작 SHA `2369a3e` · 1차 실행(P1 예산 멈춤) 마감 `a086383` · ★A 승인 기록 `0650df7` · 재개 구현 마감 `2913037`(실렌더 **30/30**)
- 이 문서는 브라우저 판정 **전에** 구현·번들·명세 차이(1·3·4절)를 먼저 채웠고, 2·5~8절은 판정 뒤(재개 2회차, HEAD ad8b6bc 이후) 채웠다.
- **Codex 검토(HEAD 2913037) 이후 변경 = 판정 도구만**: `qb.mjs` OVER의 scrollOver 보정(5.2) · 조사/재측정 스크립트 `over-probe.mjs`·`long200-recheck.mjs`. 제품 코드(app/) diff 0이라 vitest 재실행 없음.

## 0. 결론
- ★A(APPROVAL-A.md) 범위 안에서 P2~P5를 끝냈다: `testimonials/quotes-2` · `pricing/tiers-2` · `contact/booking` · `cta-band/banner` 킷 등록 → KIT_REGISTRY = 부모 RENDERED_VARIANTS = 엔진 SECTION_DEFINITIONS **정확 30쌍**.
- 부모 목록 파생(엔진 registry import 1건)은 P5에서만 적용했다. P2~P4는 명시 문자열로 단계별 GREEN.
- 파생 뒤 `/studio` 진입 **127,339 B**(기준 127,435 대비 **−96 B**) — 멈춤선(+30 B · 127,700 B) 안.
- 30/30은 킷 구현 마감일 뿐 M2b 전체 완료가 아니다(모션·폰트 M2B-3/4 · 3안 비교 M2B-5 · 독립 QA M2B-6 · 실제 로컬 갤러리 이미지·다른 브라우저 검증은 별건).

## 1. 커밋표 (2369a3e..HEAD)
| 커밋 | 단계 | 내용 | 변경 경로(명시 커밋) |
|---|---|---|---|
| 4f8def7 | P0 | BRIEF·PROGRESS·REPORT 골격 · gate.sh · baseline 로그 | dev/active/m2b-2c/ |
| 4f9b467 | P1 | 예산 실측 → 멈춤(+62 B) · 시제품 diff 보존 | dev/active/m2b-2c/ |
| a086383 | 1차 마감 | 전체 vitest 1777 · 승인 범위 정리 | dev/active/m2b-2c/ |
| 0650df7 | 승인 | ★A 기록(Jarvis) | dev/active/m2b-2c/APPROVAL-A.md |
| 6814690 | 재개 | 이관 도달성 조사(logs/migration-inventory.txt) · P2 예측 | PROGRESS · logs |
| 8dd555a | P2 | testimonials/quotes-2 · memoryExport 이관 · P3 예측 | kit/TestimonialsQuotes2(.test).tsx · kit.css · registry.ts · renderedVariants.ts · PageDocument.test · memoryExport.test · 기록 |
| 76e108f | P3 | pricing/tiers-2 · P4 예측 | kit/PricingTiers2(.test).tsx · kit.css · registry.ts · renderedVariants.ts · PageDocument.test · memoryExport.test · 기록 |
| 5b20b21 | P4 | contact/booking(ContactForm 공유 ContactKit) · SectionVariant 이관 · P5 예측 | kit/ContactBooking(.test).tsx · ContactForm.tsx · kit.css · registry.ts · renderedVariants.ts · PageDocument.test · SectionVariant(.Preview).test · 기록 |
| 427e1ed | P5 | cta-band/banner · 30쌍 엔진 파생(★A) · cta-band 폴백 전제 15건 이관 · P5b 예측 | kit/CtaBandBanner(.test).tsx · test/kitRegistryEngine.test.ts · renderedVariants.ts · registry.ts · kit.css · render/testing/drawKit.tsx · 이관 테스트 11파일 · 기록 |
| 2913037 | P5b | 12변형 합본 KD-AC-01·06·07·08(임시 변형 RED 실측) | kit/bodyVariants2c.test.tsx · 기록 |

## 2. KD-AC (판정 방법 · 표본 · 결과)
| ID | [U]/[G] (vitest) | [B] (브라우저) |
|---|---|---|
| 01 | PASS — bodyVariants2c "KD-AC-01" + 기존 kitGuard | — |
| 02 | — | PASS — 12변형 상한 글자 + 글자 200% · 3폭 문서 overflowX 0 · 말줄임 0 · 겹침 0 · 보정 scrollOver 0(5.2) |
| 03 | PASS — 4변형 각 "KD-AC-03"(상한 글자 = textContent) | — |
| 04 | PASS — 4변형 각 빈 슬롯 테스트 | — |
| 05 | — | PASS — light·dark × 톤 교대/뒤집기 × 3폭 bad 0 · badRings 0 · 최소 4.93(light)/4.56(dark) · CTA 링 `:focus-visible` fv=true · 캡처 5.3 |
| 06 | PASS — bodyVariants2c "KD-AC-06"(12변형 합본 정적 HTML script 1·바이트 일치·on* 0) | PASS — static-scripts n 1 · sameBytes · on* 0 · href=# 0 · form action/method null · placeholder 0 |
| 07 | PASS — bodyVariants2c "KD-AC-07" + 4변형 CSS 블록 단언 | PASS — headings-order docOrder true · 12변형 kit · 폴백 0 |
| 08 | PASS — bodyVariants2c "KD-AC-08"(h3 = cards-2·masonry·pricing만) | PASS — 12변형 h2 1 · h3 = c2 2·cm 3·pr 2 외 0 |
| 17 quotes | PASS [U] 구조·cite 0·빈 슬롯 | PASS — 1280·768 같은 행 2열·같은 높이 · 390 쌓임 · 인용 기울임 0 · pre-line |
| 18 pricing | PASS [U] 두 카드 class·속성 동일·글자 그대로·버튼/표식 0 | PASS — '문의'/'99,000' 카드·가격 계산값 동등(cardsEqual·pricesEqual) · tabular-nums · 표식 0 · 1280·768 2열 / 390 쌓임 |
| 19 booking | PASS [U] 이름표·for/id·legend·안내·type·placeholder 0·action 0·fieldset 안 | — |
| 20 booking | [G] 날짜·시간 묶음 CSS | PASS — 1280 2단 / 768·390 1단 · 날짜·시간 1280·768 같은 행 / 390 쌓임 · 칸 6 disabled · ink·opacity 1 · 정적 HTML Enter/버튼 이동 0·서버 요청 0·리소스 0 |
| 21 cta | PASS [U] 면 primary 양 톤·대상 4경로·href=# 0 · [G] CSS | PASS — 면 primary(alt 톤에도) · 1280·768 같은 행 / 390 아래·전체 폭 · CTA 44px · href #s-s-bk · 링 5.3 |

## 3. 번들 (측정 = `npx vite build && npx vite build --mode render` → /tmp/m2b2c-bytes.mjs(check-bundle-size.mjs 사본, 바이트 출력) · 원문 logs/p1-baseline-bytes.txt · logs/final-bytes.txt)
| 항목 | baseline 2369a3e | 최종(P5 파생) | 증가 | 한도 | 판정 |
|---|---|---|---|---|---|
| /studio 진입 직후 | 127,435 B | **127,339 B** | **−96 B** | ≤ +30 B · ≤ 127,700 B | PASS |
| /studio 첫 화면 | 91,774 B | 91,776 B | +2 B | ≤ 99.40 KB | PASS |
| 렌더 문서 JS | 81,671 B | 82,280 B | +609 B | ≤ 89.70 KB | PASS |
| 렌더 문서 CSS | 7,589 B | 7,818 B | +229 B | ≤ 30 KB | PASS |
| 공통 JS | 89,347 | 89,344 | −3 | ±30 | PASS |
| /catalog 첫/진입 | 99,643 / 102,027 | 99,654 / 102,038 | +11 / +11 | ±30 | PASS |
| /references 첫/진입 | 96,994 / 99,378 | 97,001 / 99,385 | +7 / +7 | ±30 | PASS |
| /compare 첫/진입 | 98,827 / 121,689 | 98,836 / 121,715 | +9 / +26 | ±30 | PASS(여유 4 B) |
| /profile 첫/진입 | 99,604 / 118,656 | 99,611 / 118,672 | +7 / +16 | ±30 | PASS |
| /projects 첫/진입 | 94,015 / 100,288 | 94,017 / 100,298 | +2 / +10 | ±30 | PASS |
- 중간(명시 문자열) /studio 진입: P2 127.46 · P3 127.47 · P4 127.48 KB(gate KB 표기, 기록만 — 승인서상 판정은 P5 파생 뒤).
- final-bytes.txt 끝의 "예산 검사 실패" 2줄은 사본 스크립트가 바이트를 KB 자리에 넣어 생긴 표기 잡음(판정 아님) — 실제 gate(npm run build의 check-bundle-size)는 exit 0(logs/combined-gate.txt).
- 다른 화면 +2~+26 B: 1차 실측(p1-budget.txt 원인 분해)과 같은 청크 해시 잡음(import 문자열 변화). 내용 변화 아님(L2 추정).

## 4. 공유·명세 차이 · 이전 단언 이관
### 4.1 공유 구조
- quotes·pricing = services 카드 면·2열(`.kit-cards--2` · `.kit-card`) 재사용(0.2-4 카드 면 공통). pricing 머리 = `ServicesHead` 재사용(B1-3과 같음).
- booking = 시제품 diff(logs/p1-booking-prototype.diff)의 ContactForm.tsx·ContactBooking.tsx 그대로(`ContactKit` + `FormSpec`), kit.css·registry는 P2·P3 뒤라 손으로 넣음. contact/form 마크업 추출 전후 동일(logs/contact-form-markup-after.txt — renderToStaticMarkup 1,609 B 문자열 일치).
- cta-band = `kitLinks`(m2a 0.10)의 cta 대상 재사용, hero CTA와 같은 a/span 분기.
### 4.2 명세와 다르게 한 곳 (ADR-003 한 줄씩)
- cta-band 섹션 루트 `data-surface="primary"`(bodySurface 미사용 — 톤 무관 띠, KD-AC-05·21 판정 표시). `data-tone`은 남김(판정 표시, CSS 선택자로 쓰지 않음).
- pricing 이름 ↔ 가격 s2 · 가격 ↔ 설명 s3: 카드 gap s2 + `.kit-plan-price + .kit-card-body { margin-top: calc(s3 − s2) }`(가격 빈 값이면 이름 ↔ 설명 = s3, B1-3 카드와 같음).
- booking 칸 `id` = `f-<instanceId>-<key>` (contact/form과 같은 규칙 — SPEC 예시 `f-<id>-name`과 같은 뜻).
- 시안(mock-body.html) px 대조는 하지 않았다(ADR-003: px은 기준 아님). 구조·위계 대조는 캡처(shots/qb-9~15)로 남김 — 별도 시각 검수 대상.
### 4.3 이전 단언 이관 (삭제·skip·약화 0 — 전/후/근거)
| 파일:단언 | 이전 예시(30/30 전) | 이후(이관) | 단언 문자열 | 근거 |
|---|---|---|---|---|
| data/memoryExport.test.ts 5·6·7단계(FALLBACKS) | pricing/tiers-2 · testimonials/quotes-2 = 미렌더 | 같은 2섹션 + 부모 목록 주입(vi.mock: 실제 − 2키) + 전제 it 1(주입 목록에만 없음 · 실제 목록에 둘 다 · 엔진 정의 변형) | 그대로(`["s-pricing","s-quotes"]`·코드) | 저장 = validatePageDoc가 모르는 변형 거부(engine/validate/validatePageDoc.ts:98) → no-such-variant로 7단계 도달 불가 |
| components/studio/SectionVariant.test.tsx "구조 미리보기" | contact/booking 접미어 1 | 새 파일 SectionVariantPreview.test.tsx(부모 목록 − booking 주입 + 전제 단언, 단언 그대로) · 원 it은 "접미어 0"으로 **강화** | 그대로(이관 파일) | 변형 선택지 = 엔진 정의 → 30/30이면 실데이터 도달 불가 |
| features/studio/canvasCaption.test.ts "일부 실렌더" | sampleDoc cta-band | 같은 자리 variant `no-such-variant`(withUnknownCta) + 전제 kitFor undefined | 그대로(partial(8,1)) | 순수 함수 — 렌더 경로 |
| kit/HeroSplit · heroVariants · boundVariants · kitCommon(site) | sampleDoc cta-band 폴백 1 | withUnknownCta(같은 자리·같은 섹션 수) | 그대로(폴백 1·[data-kit] 7) | 렌더 경로(kitFor) |
| staticHtml/staticMarkup · staticHtml · png/pngCapture | sampleDoc cta-band 폴백 마크업 | withUnknownCta 마크업 | 그대로(실패·INFRA·_구조포함·fallbackCount 1) | 렌더 경로 |
| components/studio/ExportFlow(2) · PngSave(1) · StructureCanvas(1) | passingDoc/sampleDoc cta-band 폴백 | 부모 목록 − cta-band/banner 주입(파일 단위 = 30/30 전과 같은 판정) + 각 it 전제 단언 | 그대로("구조 미리보기 섹션 1개(CTA Band)" 등) | 편집기 폴백 판정 = RENDERED_VARIANTS · 편집기 경로는 엔진에 없는 변형을 쓸 수 없음 |
| render/PageDocument.test.tsx 레지스트리 정확 목록 | 26쌍 | 27→28→29→30쌍(단계별) · 모르는 쌍 undefined 그대로 | 확장 | 브리프 3절 |
- 새 단언(별도): test/kitRegistryEngine.test.ts — KIT_REGISTRY = 엔진 SECTION_DEFINITIONS 정확 30·중복 0 · unknown(no-such-variant) 목록 밖·kitFor undefined·폴백 표식 1·캡션 '일부'. 기존 renderedVariants.test(집합·중복·freeze) 무수정.
- 사전 조사(logs/migration-inventory.txt)의 ProfileCompact DOM 순서 1건은 무관 flake로 판단 — 이후 중간 전체 실행(1797)·마감 실행에서 통과.

### 4.4 새 테스트 delta (예측 = RED 전 PROGRESS 커밋)
| 단계 | 예측 | 실제 | 일치 |
|---|---|---|---|
| P2 | +5 → 199 files · 1782 | RED 5 → GREEN 5 | ✓ |
| P3 | +4 → 200 · 1786 | RED 5(새 4 + 전제 1) → GREEN | ✓ |
| P4 | +5 → 202 · 1791 | RED 6(새 5 + 강화 it 1) → GREEN | ✓ |
| P5 | +6 → 204 · 1797 | RED 10(새 6 + 이관 전제 4) → GREEN · 중간 전체 204 · 1797 exit 0 | ✓ |
| P5b | +5 → 205 · 1802 | 작성 즉시 PASS(구현 뒤 검증 테스트) → 임시 변형 RED 5 → 복원 GREEN | ✓ |

## 5. QB
원시: `logs/qb-run.txt`(2회차 판정 실행, 36줄) · `logs/qb.json` · 1회차 `logs/qb-run-1st.txt`(같은 판정 + 캡처 CDP 시간 초과로 exit 1) · 보정 재측정 `logs/long200-recheck.{txt,json}` · 원인 조사 `logs/over-probe.{txt,json}`. 환경 = ego-browser, 렌더 문서 127.0.0.1:4337(이 worktree vite) 최상위 페이지, 폭 = CDP setDeviceMetricsOverride.

### 5.1 판정 요약 (qb-run.txt 1~26행 직접 확인)
| 항목 | 결과 |
|---|---|
| 대비(checkProfileContrast) | light C-1 8.09·C-2 16.82·C-4 15.31·C-5 4.93 · dark C-1 4.61·C-2 20.08·C-3 4.56·C-4 17.62·C-5 6.06 — 모두 pass |
| QB-9~11 레이아웃 3폭 | 문서 overflowX 0(3폭) · quotes/pricing/booking/cta 배치 2절 표 그대로 |
| 정적 HTML 계산 스타일 동등성 | 3폭 same true · 151요소 · diff {} |
| 예약 정적 HTML 제출 | Enter·버튼 뒤 moved false · newServerRequests 0 · newResources 0 · submits 0 · fieldset disabled |
| QB-13/14 색 조합 | light·dark × ALT/FLIP × 3폭 12행 모두 bad {} · 포커스 가능 요소 = cb 1개뿐 |
| QB-15 상한 글자 + 200% | 원 판정 bk scrollOver 1(3폭) → 5.2 원인 특정·보정 → bad {} |

### 5.2 long200 bk scrollOver=1 — 분류 (b) 판정 도구 오탐 (제품 수정 0)
- 원인 요소(over-probe, qb.mjs OVER와 같은 조건 `checkVisibility · scrollWidth > clientWidth + 1 · overflowX ≠ visible`): `<legend class="kit-visually-hidden">예약 양식</legend>` — scrollWidth 52 / clientWidth 2(200%)·1(100%) · overflow hidden · `clip-path: inset(50%)` · 0.0625rem 상자(kit.css `.kit-visually-hidden`, 스크린리더 전용 fieldset 이름).
- 같은 조건 contact/form 기준: `<legend class="kit-visually-hidden">문의 양식</legend>`가 **같은 값**(52/2·52/1). 이 legend·클래스는 baseline 2369a3e `ContactForm.tsx:46`·kit.css부터 있던 패턴(이번 diff가 만든 것 아님). 원 QB에 cf가 없어 bk에서만 보였다.
- 상한 글자 유무(long0/long1) × 글자 100%/200% × 3폭 × (bk+cf 단독 / 12변형+cf 합본) **24행 전부 같은 결과** → 글자 길이와 무관 = 내용 넘침 아님. 제외 외 다른 요소는 0.
- SPEC KD-AC-02 문자 그대로(문서 `scrollWidth − clientWidth = 0`)는 원 실행에서 이미 3폭 0. 요소 단위 scrollOver는 도구가 더한 엄격 검사.
- 보정: OVER scrollOver에 `clipPath ≠ "inset(50%)"` 1조건만 추가, `scrollOverRaw`·`clippedExcluded`(tag·class·clipPath·sw·cw·text)를 함께 기록. wider·ellipsis·overlap·문서 overflowX는 무변경.
- 재측정(long200-recheck.mjs = qb.mjs 2~76·239~256행 sed 절취, qb-15 캡처 1줄만 제외): 1280·768·390 모두 `overflowX 0 · bad {}` · 제외 = **폭마다 bk legend 1개뿐** → **KD-AC-02 PASS**.

### 5.3 QB-12 실제 :focus-visible 링 캡처
- ego-browser `page.screenshot` 3폭 × 2회 모두 `CdpRequestTimeoutError`(qb-run.txt 27~35행) — 같은 실행에서 CTA a `focus()` 뒤 `:focus-visible` 매칭은 3폭 true.
- 대체: shots.sh Chrome headless `--screenshot` · `static/qb-12-ring.html` = qb-12.html과 **CTA a의 `autofocus` 1속성만 다른** 판정용 사본(diff 1줄). 결과 `shots/qb-12-ring-{1280,768,390}.png` 3폭 모두 CTA에 이중 링이 보이고, 같은 문서 `qb-12-*.png`에는 없다. kit.css 링 선택자는 `[data-kit] :where(a, button, summary):focus-visible`(21행)뿐이라 링 표시 = :focus-visible 매칭.
- 브리프 표기와 차이: 390만 `_w390.html` iframe 래퍼(390폭 iframe), 768·1280은 창 폭 직접(창 폭 = 뷰포트).

## 6. Codex
- 실행: `codex-companion.mjs review --scope branch --base 2369a3e` 1회 · HEAD 2913037 · 원문 `logs/codex.txt`.
- 원문 결과: "기준 커밋 대비 변경에서 수정이 필요한 구체적인 결함을 발견하지 못했습니다. 타입 검사는 통과했으나, 테스트는 읽기 전용 환경의 파일 생성 제한(EPERM)으로 실행하지 못했습니다." → 지적 0.
- 한계: Codex 샌드박스는 vitest를 EPERM으로 못 돌렸다(typecheck만 실행). 테스트 증거는 별도 실측 = 전체 vitest 기본 1회 HEAD 4aee3b2(제품 코드 = 2913037) **205 files · 1802 passed · exit 0**(logs/full-vitest.txt).
- Codex 이후 변경 = 판정 도구(qb.mjs OVER 보정·조사/재측정 스크립트)뿐. 제품 diff 0이라 Codex 재실행 없음(라운드 1/3).

## 7. 남은 위험 · 결정
- KD-AC-02 요소 단위 검사 보정은 `clip-path: inset(50%)` 완전 잘림 요소만 제외한다. 앞으로 다른 의도적 잘림 패턴이 생기면 같은 근거(원시 기록)로 따로 분류해야 한다.
- QB-12 링 캡처는 autofocus 사본(판정용)으로 찍었다 — 제품 출력에는 autofocus 없음. 키보드 Tab 이동으로 생긴 링 캡처는 아님(ego-browser CDP 캡처 시간 초과).
- 브라우저 판정은 Chromium(ego-browser·Chrome headless)만. 다른 브라우저·실제 로컬 갤러리 이미지·모션/폰트(M2B-3/4)·3안 비교(M2B-5)·독립 QA(M2B-6)는 별건.
- /compare 진입 +26 B(한도 ±30, 여유 4 B) — 다음 변경에서 넘을 수 있음(3절).

## 8. 서버
- 판정 실행(qb-run): 4337 vite(app) · 4339 python http.server(static) loopback 127.0.0.1 — 종료 `logs/server-stop.txt`(pid 87898·87873·87875, cwd = 이 worktree, lsof exit 1).
- 재개 2회차(원인 조사·재측정): 같은 두 서버 재기동 → 종료 `logs/server-stop-r2.txt`(kill 20415 vite·20379 npm exec 부모·20381 http.server, cwd 확인 · 4337·4339 LISTEN lsof exit 1 = 0줄). main 5480(pid 82062) 미접촉.
