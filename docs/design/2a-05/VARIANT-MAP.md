# VARIANT-MAP — 구조안 변형 → 엔진 변형 대응표 (2a-05 SPEC r4 8.2.1 · Q-21 A)

- 작성: Designer · 2026-09-27 · 브리프 `docs/06-handoff/EDITOR-A2-SPEC_BRIEF.md` · 기준 커밋 `c619958`(main `17f5cc9` + 브리프)
- 정본 규칙은 SPEC 8.2.1이다. 이 문서는 그 표의 **전체 내용과 근거 줄번호**만 담는다. 구현(a2)은 이 표를 새 모듈 1개에 옮기고, 그 모듈만 `startDoc` 쓰기 본문이 import한다.
- 근거 수준: 모든 줄번호 **L1**(아래 grep 명령을 이 커밋에서 직접 실행). 경로는 `app/src/` 기준.
- 키는 `type/variant` 쌍이다. 유형은 바꾸지 않는다.

## 0. 확인한 명령

```bash
cd app/src
grep -n 'type: "' fixtures/referenceComparisons.ts                 # 픽스처 sectionPlan 49줄 → 26쌍
sed -n 26,47p engine/sections/boundSections.ts                       # 엔진 header·hero·footer
sed -n 49,62p engine/sections/bodySections.ts                        # 엔진 본문 13개
grep -n 'GRID_LADDER = \|entry(' domain/composeCandidates.ts         # 컴포저가 만드는 쌍
grep -n 'DEFAULT_FOOTER_VARIANT =\|businessInfoVariant' domain/sectionLibrary.ts
grep -n 'UNKNOWN_VARIANT' engine/doc/createDocFromCandidate.ts       # :37 거부 지점
grep -n 'BY_KEY' engine/sections/registry.ts                         # :54 키 = `${type}/${variant}`
```

## 1. 엔진이 아는 쌍 (목적지 후보, L1)

| 유형 | 엔진 변형 (이름표) | 위치 |
|---|---|---|
| header | `sticky-right-cta` · `sticky-hamburger` · `sticky-two-tier` · `transparent` | `engine/sections/boundSections.ts:28-31` |
| hero | `fullbleed-left` · `split` · `center` · `grid` · `text` · `image` | `boundSections.ts:34-39` |
| footer | `biz-extended` · `biz-extended-map` · `minimal` · `minimal-biz` | `boundSections.ts:42-45` |
| about | `story`(이야기 + 이미지) :50 · `text`(글 중심 소개) :51 | `engine/sections/bodySections.ts` |
| services | `cards-3`(카드 3개) :52 · `list`(목록형) :53 | 〃 |
| portfolio | `grid-3`(이미지 그리드 3칸) :54 | 〃 |
| statistics | `stats-3`(수치 3개 한 줄) :55 | 〃 |
| testimonials | `quotes-2`(후기 2개) :56 | 〃 |
| pricing | `tiers-2`(요금제 2단) :57 | 〃 |
| faq | `accordion`(펼침 목록) :58 | 〃 |
| contact | `form`(문의 폼) :59 · `booking`(예약 폼, 예약 변형) :60 | 〃 |
| cta-band | `banner`(가로 띠 배너) :61 | 〃 |

- header·hero·footer 엔진 변형은 `SECTION_LIBRARY`(v1.4, `domain/sectionLibrary.ts:27-52`) 키에서 만들어진다(`boundSections.ts:53-55` — 슬롯 명세가 없으면 throw). 그래서 bound 행은 **그대로** 매핑이고, 가드 테스트는 "표 bound 행 = 라이브러리 키 집합"으로 본다.

## 2. 대응표 — 픽스처 `sectionPlan` 26쌍 (`fixtures/referenceComparisons.ts`)

구분: **같음** = 엔진에 같은 쌍 있음(알림 없음) · **근접** = 가장 가까운 엔진 변형으로 바꿈(SPEC 8.2.1 (a) 편집 알림 대상).

| # | 픽스처 쌍 | 픽스처 줄 (ref) | 엔진 쌍 | 구분 | 고른 이유 |
|---|---|---|---|---|---|
| 1 | header/sticky-right-cta | 14(a) · 87(e) · 105(f) | header/sticky-right-cta | 같음 | — |
| 2 | header/sticky-hamburger | 33(b) | header/sticky-hamburger | 같음 | — |
| 3 | header/sticky-two-tier | 50(c) | header/sticky-two-tier | 같음 | — |
| 4 | header/transparent | 69(d) | header/transparent | 같음 | — |
| 5 | hero/fullbleed-left | 15(a) | hero/fullbleed-left | 같음 | — |
| 6 | hero/split | 34(b) | hero/split | 같음 | — |
| 7 | hero/center | 51(c) | hero/center | 같음 | — |
| 8 | hero/grid | 70(d) | hero/grid | 같음 | — |
| 9 | hero/text | 88(e) | hero/text | 같음 | — |
| 10 | hero/image | 106(f) | hero/image | 같음 | — |
| 11 | about/split | 16(a) · 52(c) · 108(f) | about/story | 근접 | 글 + 이미지 두 칸 = 이야기 + 이미지 |
| 12 | about/team-grid-3 | 54(c) | about/story | 근접 | 인물 카드 = 사람 이미지가 있는 소개. 엔진에 팀 변형 없음 |
| 13 | about/team-carousel | 73(d) | about/story | 근접 | 〃 |
| 14 | about/team-grid-2 | 90(e) | about/story | 근접 | 〃 |
| 15 | services/grid-3 | 17(a) · 35(b) · 53(c) · 71(d) · 107(f) | services/cards-3 | 근접 | 카드 3열 = 카드 3개. **`portfolio/grid-3`와 이름만 같음 — 쌍 키 필요** |
| 16 | services/notice-list | 56(c) | services/list | 근접 | 목록형 |
| 17 | services/schedule-table | 72(d) | services/list | 근접 | 표 = 줄 목록(엔진에 표 변형 없음) |
| 18 | services/list | 89(e) | services/list | 같음 | — |
| 19 | portfolio/masonry | 18(a) · 36(b) · 109(f) | portfolio/grid-3 | 근접 | 엔진 portfolio 변형은 1개 |
| 20 | portfolio/case-list | 91(e) | portfolio/grid-3 | 근접 | 〃 |
| 21 | portfolio/insights-grid-3 | 92(e) | portfolio/grid-3 | 근접 | 〃 |
| 22 | testimonials/carousel | 19(a) · 37(b) | testimonials/quotes-2 | 근접 | 엔진 후기 변형은 1개 · 자동 넘김 없음(모션 예산 R-07에도 맞음) |
| 23 | faq/accordion | 20(a) · 55(c) | faq/accordion | 같음 | — |
| 24 | pricing/cards | 74(d) | pricing/tiers-2 | 근접 | 엔진 요금 변형은 1개 |
| 25 | contact/map-form | 21(a) · 57(c) · 111(f) | contact/form | 근접 | 지도는 엔진 contact에 없음(지도는 footer `biz-extended-map` 몫) |
| 26 | contact/form | 38(b) · 75(d) · 93(e) | contact/form | 같음 | — |
| 27 | contact/order-form | 110(f) | contact/form | 근접 | 주문 문의 = 문의 폼. **`booking`으로 바꾸지 않는다** — 예약 변형은 목적 R-04 판정을 바꾼다 |
| 28 | footer/biz-extended | 22(a) · 94(e) · 112(f) | footer/biz-extended | 같음 | — |
| 29 | footer/minimal | 39(b) · 76(d) | footer/minimal | 같음 | 보드 확정·컴포저가 R-12로 `minimal-biz`로 바꾼 뒤 오는 것이 보통(3절) |
| 30 | footer/biz-extended-map | 58(c) | footer/biz-extended-map | 같음 | — |

- 줄 수 확인(스크립트 `dev/active/editor-a2-spec/logs/variant-map-check.py`): 픽스처 `type:` 줄 **49**개(ref-a 9 · b 7 · c 9 · d 8 · e 8 · f 8) · 고유 쌍 **30**(header 4 · hero 6 · about 4 · services 4 · portfolio 3 · testimonials 1 · faq 1 · pricing 1 · contact 3 · footer 3) = 2절 1~30행. 줄번호 불일치 0 · 목적지가 엔진 26쌍 밖인 행 0 · 구분(같음/근접) 오류 0.
- 픽스처 유형은 모두 엔진 `SECTION_TYPES`(`engine/contracts/pageDoc.ts:8-22`) 안에 있다 — 유형을 바꿔야 하는 행 0.

## 3. 대응표 — 컴포저·보드 확정이 만드는 쌍 (픽스처에 글자로 없음)

| # | 만드는 곳 | 쌍 | 엔진 쌍 | 구분 |
|---|---|---|---|---|
| 31 | 그리드 축 `GRID_LADDER = ["grid-3","grid-2","masonry"]`(`domain/composeCandidates.ts:30`) → `entry(target.type, grid)`(:119, 첫 services/portfolio가 사다리 값일 때만) | services/grid-2 | services/cards-3 | 근접 |
| 32 | 〃 | services/masonry | services/cards-3 | 근접 |
| 33 | 〃 (첫 그리드 섹션이 portfolio일 때 — 현재 픽스처에선 services가 늘 먼저라 도달 0) | portfolio/grid-2 | portfolio/grid-3 | 근접 |
| — | 〃 | services/grid-3 · portfolio/grid-3 · portfolio/masonry | 2절 15 · 1절 · 2절 19 | — |
| 34 | Footer 없음 → `entry("footer", DEFAULT_FOOTER_VARIANT)`(:127, `sectionLibrary.ts:25` = `biz-extended`) | footer/biz-extended | footer/biz-extended | 같음 |
| 35 | Footer R-12 대체 `entry("footer", alt.variant)`(:135, `sectionLibrary.ts:47` `minimal` → `minimal-biz`) · 보드 확정 같은 규칙(`data/memoryBoardConfirm.ts`) | footer/minimal-biz | footer/minimal-biz | 같음 |
| 36 | 목적 '예약' → `entry("contact","booking")`(:148) | contact/booking | contact/booking | 같음 |
| 37 | 목적 '문의' → `entry("cta-band","banner")`(:152) | cta-band/banner | cta-band/banner | 같음 |
| — | Hero 축(:62-70) — B·C안은 `SECTION_LIBRARY.sections.hero` 키에서 고른다 | hero/* 6개 | 그대로(2절 5~10) | 같음 |

- **그리드 축 주의**: 한 픽스처의 3안이 그리드 축만 다르면(services `grid-3`·`grid-2`·`masonry`) 문서에서는 셋 다 `services/cards-3`이 된다. SPEC 8.2.1 (a) 편집 알림("Services 2열 → 카드 3개")이 이것을 알린다. 3안 화면(2a-04c)의 축 표시는 바꾸지 않는다.

## 4. 엔진 어휘 그대로 들어오는 쌍 (표를 전체 함수로 두기 위한 행)

| # | 쌍 | 엔진 쌍 | 구분 |
|---|---|---|---|
| 38 | about/story · about/text | 그대로 | 같음 |
| 39 | services/cards-3 | 그대로 | 같음 |
| 40 | statistics/stats-3 | 그대로 | 같음 |
| 41 | testimonials/quotes-2 | 그대로 | 같음 |
| 42 | pricing/tiers-2 | 그대로 | 같음 |

(portfolio/grid-3 · faq/accordion · contact/form·booking · cta-band/banner · bound 14개는 위에서 이미 같음 행.)

## 5. 불가 목록 (표 밖 → SPEC 8.2.1 (b) `UNKNOWN_VARIANT`)

- **현재 어휘에서 0쌍.** 픽스처 30쌍 + 컴포저 쌍 + 엔진 쌍이 모두 1~4절 표 안에 있다.
- (b)가 되는 경우(방어): 픽스처·라이브러리(`SECTION_LIBRARY` 새 버전·`variantMigrations`)·컴포저 사다리가 표보다 먼저 바뀐 경우, 또는 엔진 `SECTION_TYPES` 밖 유형(엔진 테스트 예시 `gallery/grid`, `engine/doc/createDocFromCandidate.test.ts:89-93`). 이때는 쓰기 0 · 재시도 없음 · 프로필 화면 알림(SPEC 8.2.1 (b)).
- 가드 테스트(a2)로 막는 것: 표 bound 행 = 라이브러리 키 · 표 목적지 ⊂ 엔진 레지스트리 · 픽스처 6개 × 3안 `startDoc` 성공 — 픽스처나 라이브러리를 바꾸는 커밋이 표를 같이 고치지 않으면 테스트가 깨진다.

## 6. 참고 — 매핑하지 않는 문자열

- `fixtures/referenceDetails.ts`의 `{name, variant}`(`sticky`·`map + form`·`table`·`grid-2`·`list`·`carousel` 등)는 상세 화면 표시용이며 생성·`startDoc` 경로에 들어가지 않는다(`domain/referenceDetail.ts:12-15` `SectionEntry`). 표 대상 아님.
