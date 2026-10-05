# M2B-2b REPORT — 갤러리·통계 4변형

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-2b` + Claude Code (Opus 5.5) · 서브에이전트 0
- 시작 SHA `425dfff`

## 1. 커밋표
| 커밋 | 내용 | 변경 경로 |
|---|---|---|
| 92e7992 | P0 BRIEF·PROGRESS·REPORT 골격·gate.sh·baseline 로그(1763 exit 0) | dev/active/m2b-2b/ |
| 66a6d9b | P1 공유 gallery 시제품 예산 실측(멈춤 아님) — 시제품 diff 보존 후 되돌림 | dev/active/m2b-2b/ |
| 8eaebab | portfolio grid-3·masonry·grid-2 — 공유 PortfolioGallery · 실렌더 25 · memoryExport 폴백 예시 이관 | kit/PortfolioGallery.tsx·.test.tsx · kit/kit.css · kit/registry.ts · features/studio/renderedVariants.ts · render/PageDocument.test.tsx · data/memoryExport.test.ts · dev/active/m2b-2b/ |
| 20e2c85 | statistics/stats-3 · 4변형 공통 KD-AC-06·07·08 테스트 · 실렌더 26 | kit/StatisticsStats3.tsx·.test.tsx · kit/bodyVariants2b.test.tsx · kit.css · registry · renderedVariants · PageDocument.test · dev/active/m2b-2b/ |
(경로 앞 `app/src/` 생략. 브라우저 판정·마감 커밋은 아래에 추가)

## 2. KD-AC 판정 (이 레인 4변형 범위)
(작성 중)

## 3. 번들
측정: `npm run build`(gate.sh) KB 표기 + 바이트 정밀 = `/tmp/m2b2b-bytes.mjs`(check-bundle-size.mjs 사본, sizeOf만 바이트 — 저장소 밖). 원문: logs/p1-baseline-bytes.txt · logs/p1-prototype-bytes.txt · logs/final-bytes.txt

| 항목 | baseline 425dfff | P1 시제품 | 최종(20e2c85 트리) | 증가 | 한도 |
|---|---|---|---|---|---|
| 렌더 문서 JS | 81,310 B (81.31) | 81,523 | 81,671 B (81.67) | +361 B | 멈춤선 89.70 |
| 렌더 문서 CSS | 7,247 B (7.25) | 7,371 | 7,589 B (7.59) | +342 B | ≤ 30 |
| /studio 첫 화면 | 91,766 (91.77) | 91,774 | 91,774 (91.77) | +8 B | ≤ 99.40 |
| /studio 진입 직후 | 127,409 (127.41) | 127,435 | 127,435 (127.44) | **+26 B** | 증가 ≤ 0.03 · ≤ 127.70 |
| 공통 JS | 89,340 | 89,347 | 89,347 | +7 | ±0.03 |
| /catalog 첫/진입 | 99,643 / 102,027 | 같음 | 같음 | 0 / 0 | ±0.03 |
| /references 첫/진입 | 96,993 / 99,377 | 96,994 / 99,378 | 같음 | +1 / +1 | ±0.03 |
| /compare 첫/진입 | 98,824 / 121,704 | 98,827 / 121,689 | 같음 | +3 / −15 | ±0.03 |
| /profile 첫/진입 | 99,603 / 118,662 | 99,604 / 118,656 | 같음 | +1 / −6 | ±0.03 |
| /projects 첫/진입 | 94,011 / 100,292 | 94,015 / 100,288 | 같음 | +4 / −4 | ±0.03 |
- 부모 쪽 증가 = RENDERED_VARIANTS 문자열 4개(portfolio 3 · statistics 1, 알파벳순 나열)뿐 → 진입 +26 B(2a 4개 +5 B보다 큼 — 새 어휘 `portfolio`·`statistics`·`stats-3`가 압축 사전에 없음). 엔진 registry import 0 · 부모 킷 import 0 · 예산·가드 변경 0. P1에서 끝 상태를 이미 넣어 시제품 = 최종(부모 바이트 동일).
- 끝 예상(2c 남은 4변형, SPEC 4절): JS +0.77 ~ 단순 곱 +1.04 → 렌더 JS ≈ 82.4 ~ 82.7 (멈춤선 89.70 아래) · CSS ≈ 7.9 (≤ 30).
- 단계별 KB(gate 로그): portfolio 81.55/7.37 · stats 81.67/7.59 (/studio 진입 127.44 · 127.44)
- CSS 실측(+342 B)이 SPEC L3 추정(갤러리 0.15 + 통계 0.12 = 0.27)보다 +0.07 큼 — 고정 비율 class 3개·통계 구분선 규칙. 30KB 한도 대비 무관.

## 4. 공유·명세 차이
### 4.1 공유 구조
- portfolio 3변형 = `kit/PortfolioGallery.tsx`의 `PortfolioGallery`(이미지 슬롯 번호 목록 `cells` · 변형 class `mod` · 판정 표시 `layout` · 고정 비율 `ratios`) + wrapper 3개(Grid3 · Grid2 · Masonry). 머리(제목 + 소개)는 2a `ServicesHead` 재사용(마크업 같음 — 이름만 services). `Media.tsx` 무변경(갤러리가 같은 조건 `images[image.source]`로 figure `aria-hidden`을 정함).
- statistics/stats-3 = 새 `kit/StatisticsStats3.tsx`(작음). 래퍼 class `kit-services-inner`(flex 세로 s5) 재사용.
- 스타일 선택자 = class만(`.kit-gallery--3`·`--2`·`--masonry` · `.kit-r1x1`·`.kit-r16x9`·`.kit-r4x5` · `.kit-stats`·`.kit-stat`·`.kit-stat + .kit-stat`). `data-layout="grid"|"masonry"`는 판정 표시로만 붙이고 CSS에서 쓰지 않음([U] 단언).
- figure에 `data-slot="imageN"`(판정 표시 — 정적 HTML KEPT_DATA 대상 아님, 스타일 0).

### 4.2 명세·목업과 다르게 한 것 / 판단
| 항목 | 내용 | 사유 |
|---|---|---|
| 고정 비율 위치 | 비율(`aspect-ratio`)을 figure가 아니라 안의 미디어(img·그라디언트 div)에 줌, figure = 둥근 모서리 + overflow hidden | about/story 미디어와 같은 방식(`.kit-about-img`) — img width·height 속성과 cover가 같은 상자를 씀 |
| masonry 비율 표시 | 슬롯 번호별 class(`kit-r1x1` 등)를 컴포넌트가 붙임 — `nth-child` 0 | 칸이 꺼져도 남은 칸이 자기 슬롯 비율 유지(SPEC B1-6 5 "슬롯 번호로 고정") |
| masonry 칸 아래 간격 | `margin-block-end: s5`(마지막 0) · 단 사이 768 s4 / 1280 s5 | 다단에서 gap은 세로 간격이 아님(2a cards-masonry와 같음) |
| portfolio 소개 크기 | md 이상 `t1`(lead) · md 미만 `t0` — `.kit-portfolio .kit-services-intro` | SPEC B1-5 3 "lead(md 이상) · body". 2a services 소개(t0 고정)는 그대로 둠 |
| stats 세로 구분선 | md 이상 `.kit-stat + .kit-stat`에 왼쪽 경계(muted stroke-1, 장식) + 안쪽 s5 — 3칸 트랙은 같은 폭, 2·3칸 글자 폭은 구분선·안쪽만큼 좁음 | 구분선을 칸 사이에 그리는 CSS만의 방법(grid gap 장식 미지원). 12자 한 줄은 P-B 실측으로 확인 |
| stats 칸 안쪽 | md 미만 위아래 s4 + 위 구분선 / md 이상 0 | SPEC 2 "390 칸마다 위 구분선" |

### 4.3 이전 단언 이관 (전/후/근거)
| 파일 · 테스트 | 전 | 후 | 근거 |
|---|---|---|---|
| render/PageDocument.test.tsx "레지스트리 = …" | 정확 목록 22쌍 | 정확 목록 26쌍(+portfolio/grid-2·grid-3·masonry · statistics/stats-3) · `no-such-variant` 미구현 예시 그대로 | 단계 목표 26 |
| data/memoryExport.test.ts "7 UNRENDERED_SECTIONS …" 외 2 it(FALLBACKS 공유) | 폴백 예시 `portfolio/masonry`(s-portfolio) + `testimonials/quotes-2` → 오류 sections `["s-portfolio","s-quotes"]` | 폴백 예시 `pricing/tiers-2`(s-pricing) + `testimonials/quotes-2` → `["s-pricing","s-quotes"]` | portfolio/masonry가 실렌더 → 2c 대상 미구현 변형으로 교체. 개수 2 · 문서 순서 · 멱등 0 · GATE/GENERATOR 순서 단언 그대로 |
| test/renderedVariants.test.ts | 집합 일치·중복 0·freeze | 변경 0 | — |
| (확인만) gateView.test · SectionAdd.test · FallbackCanvas.test · canvasLayouts.test 의 portfolio·statistics 사용 | — | 변경 0, 전체 suite GREEN | 폴백 캔버스·게이트 표시 경로를 직접 부르거나 렌더 여부와 무관한 단언 |

## 5. QB
(작성 중)

## 6. Codex
(작성 중)

## 7. 남은 위험 · 미완
(작성 중)

## 8. 서버
(작성 중)
