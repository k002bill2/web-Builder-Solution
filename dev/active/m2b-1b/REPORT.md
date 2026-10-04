# M2B-1b header 3 + footer 3 실렌더 — REPORT

- 브리프 `docs/06-handoff/M2B-1_BOUND-VARIANTS_BRIEF.md` (레인 M2B-1b) · 정본 `docs/design/m2b/SPEC-BOUND.md` · 시작 커밋 `5970721` · 브랜치 `k002bill2/m2b-1b`

## 1. 커밋 표
| 단계 | RED | GREEN | 내용 |
|---|---|---|---|
| P0 | — | 7ee6c26 | 수신 · REPORT 골격 · gate.sh |
| P1 | — | 2e5fc19 | 예산 선행 실측 — two-tier 시제품 diff `logs/p1-two-tier-prototype.diff` · `logs/p1-budget.txt` |
| P2 D-1 | `logs/p2-herotop-red.txt` | f879f7c | `kitLinks().heroTop` (`kit/types.ts` `HeroTop` · `kit/text.ts`) |
| P3 sticky-hamburger | `logs/p3-hamburger-red.txt` | ced9934 | + 공유 `kit/headerParts.tsx`(MenuList·MenuButton·Sheet — K1-1도 사용, 출력 불변) · D-2 변형 클래스 `kit-header--burger` |
| P4 sticky-two-tier | `logs/p4-two-tier-red.txt` | d8293d7 | 보조 줄 · 시트 2구역 · D-3 `:has()` 1줄 |
| P5 transparent | `logs/p5-transparent-red.txt` | be0a800 | K1-1 마크업 재사용(면 클래스·data-surface만) · 면 클래스 3종 + 구분선 |
| P6 biz-extended-map | `logs/p6-map-red.txt` | fc38e5e | `FooterBizExtended`에 지도 칸 인자(K1-7 출력 불변) |
| P7 minimal | `logs/p7-minimal-red.txt` | f1a17ae | 공유 `FooterLinks` · 미니멀 띠 `FooterLine` |
| P8 minimal-biz | `logs/p8-minimal-biz-red.txt` | 3d37710 | + RENDERED_VARIANTS 바깥 3유형 라이브러리 파생 |
| P9 공통 | 변이 검사 `logs/p9-mutation.txt` | c726ce7 | `kit/boundVariants.test.tsx` — KB-AC-30·32·33·35 [U]/[G] · K-AC-04 |
| P10 | — | (이 커밋) | 브라우저 판정 15건 PASS · KB-AC-34 판정 스크립트 수정 · 캡처 45장 |

## 2. 변형별 판정 (KB-AC)
표기: [U] jsdom · [G] 파일 검사 · [B] 브라우저(127.0.0.1:4337 렌더 문서, 1280·768·390). [B] 근거 = `logs/qb-judge.txt`(`node judge.mjs` ← `logs/qb-b.json` ← `ego-browser nodejs < qb.mjs`) · QB-14 = `qb14.mjs` → `logs/qb14.json`. **판정 14 + QB-14 = 15건 전부 PASS.**

| KB-AC | 변형 | [U]/[G] | [B] | 판정 | 근거 |
|---|---|---|---|---|---|
| 01 | sticky-hamburger | 구조 PASS(바 nav 0 · nav 1벌 = 시트 안) | PASS | PASS | `HeaderStickyHamburger.test` · [B] 3폭 버튼 보임 · 바 nav 0 · 닫힘 nav 보임 0 → 열림 nav 1 |
| 02 | sticky-hamburger | — | PASS | PASS | [B] 1280 오른쪽 판 폭 426.7(=4/12) · 768 384(=6/12) · 390 전체 폭 390 |
| 03 | sticky-hamburger | PASS | — | PASS | nav 빈 값 → button[popovertarget]·[popover]·nav 0 |
| 04 | sticky-two-tier | 구조 PASS(nav 두 벌 · 보조 목록 두 벌 · 랜드마크 아님) | PASS | PASS | `HeaderStickyTwoTier.test` · [B] 1280 보조 줄+바 nav·버튼 none / 768 보조 줄+버튼 · 시트 nav / 390 보조 줄 숨김 · 시트 nav+hr+utility · nav 보임 최대 1 |
| 05 | sticky-two-tier | PASS | — | PASS | 기본 utility → 목록마다 li > span 2 · a 0 / 빈 값 → ul 0 · 보조 줄 0 · hr 0 |
| 06 | sticky-two-tier | D-3 선택자 [G] PASS | PASS | PASS | [B] 390·1280 앵커 4개 제목 위 끝 ≥ header 아래 끝(최소 여유 150.8) · scroll-margin-top 164px(K1-1 120px) |
| 07 | transparent | PASS | — | PASS | heroTop 7행(+split·grid·text 두 톤) → data-surface·면 클래스·구분선 (`HeaderTransparent.test` · `heroTop.test`) |
| 08 | transparent | — | PASS | PASS | [B] 5문서 × 3폭 position static · 겹침 0 · 면 이음 true · 구분선은 none 면만 |
| 09 | transparent | — | PASS | PASS | [B] 면 3종 × 프로필 2 × 톤 2 × 3폭 바 쌍 = on-primary/primary · ink/surface · ink/bg · 열린 시트 ink/bg만 · 링(실측 :focus-visible) on-primary/primary·ink/bg·ink/surface |
| 23 | biz-extended-map | PASS | — | PASS | 플레이스홀더 → 그라디언트 aria-hidden · img 0 / 사용자 이미지 → 렌더 blob:만 · serializeSite 결과 data:만 · http(s) 0 · iframe·script 0 |
| 24 | biz-extended-map | — | PASS | PASS | [B] 1280 글 칸·지도 칸 같은 행(지도 폭 440) · 768 지도 352 · 390 사업자정보→링크→지도→저작권 · 지도 경계 1px bg색(ink 면에서 보임) |
| 25 | biz-extended-map | PASS [U] | PASS | PASS | map 꺼짐 → figure 0 · 위 줄 직계 = address·ul(biz-extended와 같음) · [B] 1280 map 꺼짐 figure 0 · 사업자정보·링크 같은 행 |
| 26 | minimal | PASS [G] | PASS | PASS | 면 = .kit-body(톤 없음 → bg) · 위 구분선 muted · 링크 ink · 저작권 --kit-soft(= muted) · ink 면 0 · [B] 3폭 면 bg · 위 경계 1px solid muted · 링크 ink · 저작권 muted |
| 27 | minimal | PASS | — | PASS | 둘 다 빈 값 → footer#s-s-footer 1 · 글자 요소 0 · CTA 폴백 href 대상 = 이 footer |
| 28 | minimal-biz | PASS [U]/[G] | — | PASS | address 1 · 저작권 0 · 사업자정보 규칙 ink · white-space normal |
| 29 | minimal-biz | 클래스 같음 [U] | PASS | PASS | [B] 3폭 루트 background·border-top · 링크 목록·래퍼 계산 스타일 같음 · 사업자정보 ink |
| 30 | 6 | PASS [G] | — | PASS | kitGuard(kit/ 전체) + `boundVariants.test` iframe·외부 URL 0 |
| 31 | 6 | — | PASS | PASS | [B] 6변형 상한 글자+200% × 3폭(열린 시트 포함) 가로 넘침 0 · 밖 요소 0 · 말줄임 0 |
| 32 | 6 | PASS [U] | — | PASS | 판정 문서 10벌(header 3변형 · transparent 면 4상태 · two-tier nav 없음 · footer 3) 정적 HTML script = 고정 1개(바이트 일치) |
| 33 | 6 | PASS [U] | — | PASS | 6쌍 등록 · 루트 1 · 폴백 표식 0 · header·footer 사이트 루트 직계 |
| 34 | 6 | — | PASS | PASS | [B] 84측정 · 글자 488개 허용 밖 쌍 0 · 최소 4.61 · 링 허용 밖 0 (아래 KB-AC-34 판정 기록) |
| 35 | 6 | PASS [U]/[G] | PASS | PASS | 새 CSS 선택자 전부 정적 결과에 매칭 · `:has()` 1줄 대상 존재 · 변이 검사 2건 · [B] 30건(10문서 × 3폭) 정적 HTML 계산 스타일 = 캔버스 · 앵커 뒤 제목 header 아래 · script 1 |

**KB-AC-34 판정 기록 (P10 1회차 FAIL → 원인 = 판정 스크립트 (a), 코드 수정 0)**
- 1회차: 글자 쌍 허용 밖 0 · 최소 4.61인데 sticky-hamburger(light·base, 1280·768·390) 포커스 링이 `?0,0,0`.
- 원인 1 — 링을 계산 결과가 아니라 `getPropertyValue("--kit-ring")`로 읽고 비면 `rgb(0,0,0)`으로 채웠다. `kit.css` 0.3 규칙은 `outline: … var(--kit-ring, var(--site-ink))` — 변수 미지정 면(sticky-hamburger·two-tier 바·시트 = bg 면)에서는 CSS 폴백 `ink`로 그려진다. SPEC B-1 3 "포커스 링 `ink`"와 같다 → (b) SPEC 위반 아님.
- 원인 2 — 바 선택자가 쉼표 목록(`… .kit-bar, … .kit-tier`)인데 뒤에 `" button"`·`" *"`을 이어 붙여 앞 부분이 `.kit-bar` div 자체를 잡았다(링 대상에 div "브랜드 …" · 바 글자는 대비 측정에서 빠짐).
- 고침(`qb.mjs`): 각 a·button을 실제로 `focus()`해 `:focus-visible` 계산 `outline-color`를 읽는다(배경 탭이라 `Emulation.setFocusEmulationEnabled`, 안 그려지면 `?none` = 실패) · 쉼표 선택자 각 부분에 접미어를 붙인다. 재판정: 링 sticky-hamburger·two-tier 전부 `ink/bg` · 측정 글자 432 → 488개(바 글자 포함) · 허용 밖 0 · 최소 4.61 → PASS. 단언·허용 쌍 집합은 그대로(약화 0).
- 판정 스크립트만 바뀌어 RED→GREEN 코드 단계 없음.

## 3. 번들 표 (gzip KB)
| 시점 | 렌더 JS | 렌더 CSS | `/studio` 진입 | 첫 화면 | 그 밖 |
|---|---|---|---|---|---|
| 기준 5970721 | 80.50 | 6.72 | 127.41 | 91.78 | 공통 89.35 · /catalog 99.65/102.04 · /references 97.00/99.39 · /compare 98.83/121.71 · /profile 99.61/118.67 · /projects 94.02/100.30 |
| P1 two-tier 시제품 | 80.65 (+0.15) | 6.84 (+0.12) | 127.41 (0) | 91.78 | — |
| P1 끝 예상 | ≈ 81.41 (×6, 공유 부품 포함 보수) | ≈ 7.42 | 나열 127.46(+48 B, 멈춤) / 라이브러리 파생 127.40(−10 B) → 파생 | — | 파생안 ±0.01 |
| P2 heroTop | 80.59 | 6.72 | 127.41 | 91.78 | — |
| P3~P7 (중간값) | 80.70 → 81.11 | 6.80 → 7.10 | 127.42 → 127.47 (나열 중간값) | 91.77~91.79 | — |
| **P8 = 6변형 끝 (3d37710)** | **81.13 (+0.63)** | **7.12 (+0.40)** | **127.40 (−0.01, 127,414 → 127,404 B)** | 91.78 | 공통 89.34 · /catalog 99.65/102.04 · /references 97.00/99.38 · /compare 98.84/121.72 · /profile 99.62/118.67 · /projects 94.02/100.30 (±0.01) |

- 판정: 렌더 JS 81.13 ≤ 89.70 · CSS 7.12 ≤ 30 · `/studio` 진입 −0.01(±0.03 안) · 그 밖 ±0.01. 렌더 문서 중 앱과 공유 0(`logs/p8-minimal-biz-green.txt`).

## 4. SPEC과 다르게 한 곳 · 공유 근거
**공유**
- header 부품 = `kit/headerParts.tsx`(MenuList · MenuButton · Sheet)를 header 4변형이 쓴다. K1-1(`HeaderStickyRightCta`)은 출력 마크업 그대로(기존 테스트 변경 0).
- `header/transparent` = K1-1 컴포넌트를 `className`·`surface` 인자로 그대로 쓴다(슬롯에 CTA가 없어 CTA 0 → SPEC B-3 "K1-1에서 CTA를 뺀 것"과 같은 마크업). 면 = `kit-header--face-{primary|bg|surface}` + 값 없음일 때 `kit-header--edge`(구분선).
- `footer/biz-extended-map` = K1-7 컴포넌트에 지도 칸 인자(`map`) — 지도가 있으면 사업자정보·링크를 글 칸 하나로 묶는다. 지도 = 기존 `Media`(4:3 · lazy · 그라디언트 aria-hidden).
- 하단 링크 = `FooterLinks`(footer 4변형 공용). minimal·minimal-biz = 같은 `FooterLine`(앞 글자만 다름 → 루트·래퍼 클래스 같음, KB-AC-29).
- D-1 `heroTop` = `kit/text.ts` 안 함수(문서 데이터만 · 레지스트리 import 0 → 앱 청크 증가 0).

**SPEC과 다르게 한 곳**
- `footer/minimal`·`minimal-biz` 면: SPEC "면 `bg`"를 새 규칙 대신 본문 base 면 클래스 `.kit-body`(톤 속성 없음 → bg · `--kit-soft` = muted)로 건다. 이유: 기존 가드 `kitCommon.test` K-AC-11·36이 "kit.css에 muted 직접 글자색 0 · 보조 글자는 `--kit-soft`만"을 검사 — 저작권 muted(C-5, SPEC B-10 3)를 가드 변경 없이 같은 방식으로 낸다. 계산 색은 SPEC과 같다.
- `sticky-two-tier` `nav` 빈 값 + `utility` 있음: SPEC "390에서 보조 목록을 바 **아래** 보조 줄로" → 보조 줄을 **바 위 같은 자리**(md 이상과 같은 위치)에 모든 폭 보이게(`data-always`) 했다. 이유: DOM 순서·위치를 폭마다 바꾸지 않는 쪽이 단순하고(보조 줄 한 벌), 시트 없이 보조 목록이 보인다는 기능은 같다.
- RENDERED_VARIANTS 표현: 바깥 3유형을 `SECTION_LIBRARY.sections`에서 파생(본문 4쌍만 나열). 1a 방식(문자열 6개 나열)은 `/studio` 진입 +48 B(+0.05)로 **멈춤 조건에 걸린다**(`logs/p1-budget.txt`). 1a REPORT 7.1이 "Jarvis가 정할 것"으로 남긴 표현 변경이다 — 가드(`renderedVariants.test`, KIT_REGISTRY와 sort 비교)·한도는 그대로. 거부하면 나열로 돌아가 한도 결정이 필요하다.
- B-1 시트 높이 상한: `max-block-size: 100%` + `overflow-y: auto`(위 0 고정 · 아래 auto) — SPEC 4의 "inset + max-block-size" 그대로, 위·아래 0 동시 고정은 하지 않았다(내용만큼 높이).
- D-3 = SPEC 그대로 `:has()` 1줄(MQ-B5) — `KitLinks` 대안 안 씀.

## 5. 시각 QA 캡처
`shots/` 45장 = `shots.sh`(Chrome headless — ego `page.screenshot`이 CDP `Page.captureScreenshot` 시간 초과라 브리프대로 대체) · 정적 HTML `static/*.html`(127.0.0.1:4339 python http.server)을 1280×900 · 768×1024 · 390×844로.
- 390은 headless 창 최소 폭(≈500) 때문에 뷰포트가 넓어져 오른쪽이 잘림 → 390폭 iframe 래퍼(`static/_w390.html`, 실행 중에만 생성)로 찍고 가운데 크롭. footer 문서는 스크롤 사본이 빈 화면이라 높이 5000 전체 페이지(`*-full-*`).
| QB | 캡처 (×1280·768·390) | 확인 |
|---|---|---|
| QB-1 | `qb-1-hamburger` · `qb-1-hamburger-cap`(열린 판) | 바 = 브랜드+"메뉴" · 1280 오른쪽 판 · 768 6칸 판 · 390 전체 폭 판 |
| QB-2 | `qb-2-two-tier` · `qb-2-two-tier-cap` | 1280 2단 · 768 보조 줄+버튼 · 390 열린 시트 2구역(nav · 구분선 · 보조 목록) |
| QB-3 | `qb-3-transparent-center` | header·hero 한 primary 면 · 경계선 0 |
| QB-4 | `qb-4-transparent-fullbleed` | header bg 바 · 이미지 위 header 글자 0 |
| QB-10 | `qb-10-map-full` | 지도 칸 경계 ink 면에서 보임 · 그라디언트 폴백 · 7:5 / 6:6 / 1단 |
| QB-11 | `qb-11-minimal-full` · `qb-11-minimal-biz-full` | 같은 띠 모양 · 앞 글자만 다름 |
| QB-13 | `qb-13-{sticky-hamburger,sticky-two-tier,transparent}` · `qb-13-{biz-extended-map,minimal,minimal-biz}-full` | bright 프로필(ink 밝음) — 판정 QB-13 PASS |
| QB-14 | (캡처 아님) `logs/qb14.json` | 정적 HTML 3 header × 버튼 보이는 7건: 실제 클릭 열림 · Esc 닫힘 · 시트 안 앵커 닫힘·hash · script 1 — PASS |
- 육안 확인: `qb-1-hamburger-cap-1280` · `qb-2-two-tier-cap-390` · `qb-3-transparent-center-768` · `qb-10-map-full-1280` · `qb-11-minimal-full-390` 열어 위 내용과 같음.


## 6. Codex
(마감 단계)

## 7. 남은 위험
1. `/studio` 진입: 끝값 127.40은 RENDERED_VARIANTS 파생 표현 덕분이다(4절). 거부 시 +0.05.
2. 전체 vitest 흔들림: 시스템 부하(load average 84, 다른 세션) 때 기본 병렬 실행에서 페이지 테스트 시간 초과가 대량 발생 — 이 레인 전체 실행은 `--maxWorkers=4`로 했다. P6 1회차 `SectionRemove.test` 1건 실패는 단독 2회·재실행 통과(킷 밖 편집기 테스트).
3. (브라우저 단계에서 추가)

**이전 단언 이관** — 구현 변경 0 · 단언 약화·skip 0(같은 의도, 목록만)
| 테스트 | 전 | 후 | 근거 |
|---|---|---|---|
| `render/PageDocument.test.tsx` 레지스트리 정확 목록 | 12쌍 | 18쌍(+header sticky-hamburger·sticky-two-tier·transparent · footer biz-extended-map·minimal·minimal-biz, 이름표에 M2B-1b) — 변형 등록 커밋마다 1쌍씩 | 정확 목록 의도 유지. 모르는 쌍 예시는 1a가 이미 `hero/no-such-variant`로 옮겨 그대로 |

## 8. 서버
(마감 단계)
