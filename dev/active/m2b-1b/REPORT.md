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
| P10 | — | (작성 중) | REPORT 갱신(브라우저 전) |

## 2. 변형별 판정 (KB-AC)
표기: [U] jsdom · [G] 파일 검사 · [B] 브라우저(127.0.0.1:4337 렌더 문서, 1280·768·390). [B]는 브라우저 단계에서 채운다.

| KB-AC | 변형 | [U]/[G] | [B] | 판정 | 근거 |
|---|---|---|---|---|---|
| 01 | sticky-hamburger | 구조 PASS(바 nav 0 · nav 1벌 = 시트 안) | (브라우저) | (브라우저) | `HeaderStickyHamburger.test` |
| 02 | sticky-hamburger | — | (브라우저) | (브라우저) | |
| 03 | sticky-hamburger | PASS | — | PASS | nav 빈 값 → button[popovertarget]·[popover]·nav 0 |
| 04 | sticky-two-tier | 구조 PASS(nav 두 벌 · 보조 목록 두 벌 · 랜드마크 아님) | (브라우저) | (브라우저) | `HeaderStickyTwoTier.test` |
| 05 | sticky-two-tier | PASS | — | PASS | 기본 utility → 목록마다 li > span 2 · a 0 / 빈 값 → ul 0 · 보조 줄 0 · hr 0 |
| 06 | sticky-two-tier | D-3 선택자 [G] PASS | (브라우저) | (브라우저) | |
| 07 | transparent | PASS | — | PASS | heroTop 7행(+split·grid·text 두 톤) → data-surface·면 클래스·구분선 (`HeaderTransparent.test` · `heroTop.test`) |
| 08 | transparent | — | (브라우저) | (브라우저) | |
| 09 | transparent | — | (브라우저) | (브라우저) | |
| 23 | biz-extended-map | PASS | — | PASS | 플레이스홀더 → 그라디언트 aria-hidden · img 0 / 사용자 이미지 → 렌더 blob:만 · serializeSite 결과 data:만 · http(s) 0 · iframe·script 0 |
| 24 | biz-extended-map | — | (브라우저) | (브라우저) | |
| 25 | biz-extended-map | PASS [U] | (브라우저) | (브라우저) | map 꺼짐 → figure 0 · 위 줄 직계 = address·ul(biz-extended와 같음) |
| 26 | minimal | PASS [G] | (브라우저) | (브라우저) | 면 = .kit-body(톤 없음 → bg) · 위 구분선 muted · 링크 ink · 저작권 --kit-soft(= muted) · ink 면 0 |
| 27 | minimal | PASS | — | PASS | 둘 다 빈 값 → footer#s-s-footer 1 · 글자 요소 0 · CTA 폴백 href 대상 = 이 footer |
| 28 | minimal-biz | PASS [U]/[G] | — | PASS | address 1 · 저작권 0 · 사업자정보 규칙 ink · white-space normal |
| 29 | minimal-biz | 클래스 같음 [U] | (브라우저) | (브라우저) | |
| 30 | 6 | PASS [G] | — | PASS | kitGuard(kit/ 전체) + `boundVariants.test` iframe·외부 URL 0 |
| 31 | 6 | — | (브라우저) | (브라우저) | |
| 32 | 6 | PASS [U] | — | PASS | 판정 문서 10벌(header 3변형 · transparent 면 4상태 · two-tier nav 없음 · footer 3) 정적 HTML script = 고정 1개(바이트 일치) |
| 33 | 6 | PASS [U] | — | PASS | 6쌍 등록 · 루트 1 · 폴백 표식 0 · header·footer 사이트 루트 직계 |
| 34 | 6 | — | (브라우저) | (브라우저) | |
| 35 | 6 | PASS [U]/[G] | (브라우저) | (브라우저) | 새 CSS 선택자 전부 정적 결과에 매칭 · `:has()` 1줄 대상 존재 · 변이 검사 2건 |

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
(브라우저 단계)

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
