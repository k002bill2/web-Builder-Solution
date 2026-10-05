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
[U]/[G] = vitest(표적 파일) · [B] = ego-browser `qb.mjs` → logs/qb-run.txt · logs/qb.json (render.html 127.0.0.1:4337 최상위 페이지, CDP 폭 1280·768·390 — innerWidth 1280/768/390 기록, clientWidth = 스크롤바 제외 1265/753/375). 표본 문서 = header + grid-3 · grid-3(image2 끔) · masonry · grid-2 · stats(세 수치 모두 `1,234,567,89`) + footer, 프로필 media_ratio 기본 4:5.
| KD-AC | 방법 · 표본 | 결과 |
|---|---|---|
| 01 상태·효과·핸들러·모션·vh·hex·px·앱 DS 0 | [G] `src/test/kitGuard.test.ts`(킷 전체, 새 파일 자동 포함) — gate guards 76 pass | PASS |
| 02 상한 글자 + 200% 넘침 0 · 말줄임 0 | [B] 전 슬롯 상한(제목 40 · 소개 160 혼합 무공백 · 수치 12 · 설명 30) + `html{font-size:200%}` × 3폭: overflowX 0 · 밖으로 나간 요소 0 · 말줄임 0 · 내부 스크롤 넘침 0 · stats 칸/갤러리 칸 겹침 0 (logs/qb.json long200-*) | PASS |
| 03 입력 = 출력 | [U] Portfolio·Stats 테스트(상한 글자·`" 100+ "` 공백 포함 그대로) + [B] textLens 40·160·12·30 | PASS |
| 04 선택 슬롯 빈 값 → 요소 0 | [U] portfolio intro · 이미지 끔 → figure 0 · 셋 다 끔 → 갤러리 0 · 수치 빈 값 → li 0 · 수치 전부 빈 값 → ul 0 · 빈 p·li 0 | PASS |
| 05 색 조합 | [B] light·dark × 톤 교대·뒤집기(5섹션 각각 base·alt) × 3폭 = 12 문서: 위반 0 · 쌍 = ink/bg · ink/surface · muted/bg(base 소개·설명만) · 최소 4.93(light muted/bg) · 불투명도 < 1 글자 0 · primary 글자 0 · 포커스 요소 0 | PASS |
| 06 script 0 추가 | [U] bodyVariants2b.test(정적 HTML script = 고정 1개 바이트 일치 · on* 0) + [B] 같은 문서 정적 HTML n=1 sameBytes · on* 0 | PASS |
| 07 순서 = 문서 순서 | [G] 이번 CSS 블록 order·reverse·grid-area·grid-row 0 · [U]/[B] figure 1·2·3(꺼짐 시 1·3) · li stat1·2·3 | PASS |
| 08 헤딩 | [U]+[B] h2 각 1 · h3 0(4변형) | PASS |
| 13 portfolio 공통 | [U] figure 수 = 켜진 칸 · 그라디언트 figure aria-hidden + img 0 · 로컬 이미지 img alt(장식 "") + width·height + lazy · ul·figcaption 0 · 셋 다 끔 → 갤러리 0 · [B] ul 0 · figcaption·dl 0 | PASS |
| 14 grid-3 · grid-2 | [B] 열 수 3·2(1280·768) / 1(390) · 칸 비율 0.8001·0.7999(4:5 = 0.8, ±1% 안) · media_ratio 16:9 프로필 → 1.7775~1.7781(16/9 = 1.7778) · image2 끔 → 남은 칸 폭 346.7 = 켬 346.7(1280) · 219 = 219(768), 3열 트랙 유지 | PASS |
| 15 masonry | [B] column-count 2(1280·768) · 390 display grid 1열(column-count auto) · 비율 1 · 1.7775 · 0.8(16:9 프로필에서도 같음) · DOM 1·2·3 · 칸 break-inside avoid · 조각남 0 · 단 배정(참고, 단언 안 함) = [0,0,1] | PASS |
| 16 stats | [U] li = 수치 p → 설명 p · dl·h3 0 · 글자 그대로 · 빈 수치 → li 0 · [B] `1,234,567,89` 세 칸 모두 한 줄(1280 h 39.06 = 줄 높이 39.06 · 768 31.25 = 31.25 · 390 31.25 = 31.25) · 1280·768 같은 행(3칸 트랙 346.7 / 213.7) · 390 세로 3행 · white-space normal | PASS |
| 정적 HTML 계산 스타일 동등성 | [B] 같은 문서의 정적 HTML(4339) vs 렌더 문서: 5섹션 박스·계산 스타일 3폭 모두 일치(static-eq-* same=true) | PASS |
- 참고 관찰(단언 아님): 상한 문서 100%에서 정규 시험 문자열 외 넓은 글자 12자(`가나다라마바사아자차카타` 1280·768, `wwwwwwwwwwww` 768)는 두 줄 — SPEC 2 "넘침 대신 줄바꿈" 허용 범위. 시험 문자열 단언은 약화하지 않음.

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

## 5. QB (캡처 = shots/, 3폭 × 8문서 = 24장)
방식: qb.mjs가 같은 문서의 정적 HTML(static/*.html, CSS = 렌더 문서 `<style>` 원문 — cssText 직렬화 0)을 저장 → `shots.sh`(2a 복사, 문서 목록만 교체) Chrome headless로 정적 사이트 문서 창 캡처(렌더 sandbox iframe fullPage 아님) · 390 = 390폭 iframe 래퍼 + sips 크롭.
| QB | 캡처 | 판정 |
|---|---|---|
| QB-5 grid-3 | qb-5-{1280,768,390} · **하나 끔 qb-5-off-*** | PASS — 세 칸 같은 비율 4:5 · 그라디언트 왼쪽 위 primary → 오른쪽 아래 ink · 끔 상태 오른쪽 셋째 칸 비고 두 칸 크기 그대로 |
| QB-6 grid-2 | qb-6-* | PASS(관찰) — 1280 두 칸 532×665 세로로 큼. 화면 높이(900) 안에 한 칸이 거의 다 들어와 과하다고 보지 않음 → MQ 올리지 않음(M2B-6 시각 QA 재확인 대상) |
| QB-7 masonry | qb-7-* | PASS — 1:1·16:9 왼쪽 단 · 4:5 오른쪽 단 엇갈림 · 칸 잘림 없음 / 390 1열 |
| QB-8 stats | qb-8-* | PASS — 수치 먼저·제목 굵기 · 12자 한 줄 · 1280/768 세로 구분선 2개 · 390 세로 3행 + 위 구분선 |
| QB-13 톤 교대 | qb-13-* · qb-13-flip-* | PASS — alt 섹션에 muted 글자 0([B] 05 쌍 목록) |
| QB-15 상한 + 200% | qb-15-* (html 200% 사본) | PASS — 넘침·겹침 없음([B] 02), 긴 수치는 칸 안 줄바꿈 |
- 시안(mock-body.html)과 다른 점: 없음(구조·배치 SPEC 부록 B 실측과 같은 열 수·한 줄 높이 39.06/31.25). 값(px·색)은 토큰 기준(ADR-003).
- 판정 스크립트 결함 1건(제품 결함 아님): 1차 실행(logs/qb-run-1st.txt)은 stats 제목에 판정용 nonce 글자를 넣어 qb-8 캡처 제목이 무의미한 글자였음 → nonce 제거 후 전체 재실행(logs/qb-run.txt · qb.json)·재캡처. 판정 수치는 1·2차 같음.
- QB-14(카드 dark)는 이 레인 4변형에 카드 면이 없어 범위 밖 — dark 프로필 색 쌍만 [B] 05로 확인.

## 6. Codex
(작성 중)

## 7. 남은 위험 · 미완
(작성 중)

## 8. 서버
- 이 worktree에서 vite 127.0.0.1:4337(`npm exec vite --host 127.0.0.1 --port 4337 --strictPort`, cwd …/m2b-2b/app) + `python3 -m http.server 4339 --bind 127.0.0.1`(cwd …/m2b-2b/dev/active/m2b-2b/static). 로그 logs/server-4337.txt · server-4339.txt.
- 종료(logs/server-stop.txt): cwd 확인 후 자기 PID 41390(vite) · 41365(npm exec 부모) · 41366(http.server)만 kill → lsof 4337·4339 **LISTEN 0**, 남은 PID 0. main 5480(PID 82062)은 무접촉.
