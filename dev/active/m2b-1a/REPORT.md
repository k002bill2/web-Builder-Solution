# M2B-1a hero 5변형 실렌더 — REPORT

- 브리프 `docs/06-handoff/M2B-1_BOUND-VARIANTS_BRIEF.md` (레인 M2B-1a) · 정본 `docs/design/m2b/SPEC-BOUND.md` · 시작 커밋 `f113f2c` · 브랜치 `k002bill2/m2b-1a`

## 1. 커밋 표
| 단계 | RED | GREEN | 내용 |
|---|---|---|---|
| P0 | — | 56f0083 | 수신 · REPORT 골격 · gate.sh |
| P1 | — | 1c61468 · bf42e17(정정) | 예산 선행 실측 — grid 시제품 diff `logs/p1-grid-prototype.diff` · `logs/p1-budget.txt` |
| P2 split | `logs/p2-split-red.txt` | 9b6f894 | hero/split + 공유 카피 블록 `kit/heroCopy.tsx` · 톤 공통 CSS |
| P3 center | `logs/p3-center-red.txt` | 5bfb773 | hero/center — primary 면 · fullbleed 패널 글자·CTA 클래스 재사용 |
| P4 grid | `logs/p4-grid-red.txt` | a2af634 | hero/grid — 타일 A 이미지 1회 + 색 타일 B·C |
| P5 text | `logs/p5-text-red.txt` | f1a5595 | hero/text — 강조선 · 제목 9/12 |
| P6 image | `logs/p6-image-red.txt` | 726392c | hero/image — 미디어 위 · 카피 아래(영역 이름) |
| P7 공통 | 변이 검사 `logs/p7-mutation.txt` | a2e013a | `kit/heroVariants.test.tsx` — KB-AC-30·32·33·35 [U]/[G] |
| — | — | 9306662 | REPORT 2·3·4·7절(브라우저 전 갱신) |
| P8~P10 | — | 2c4d616 | 브라우저 판정 `qb.mjs`·`shots.sh`·logs·shots · Codex · REPORT 마감 |

## 2. 변형별 판정 (KB-AC)
표기: [U] jsdom · [G] 파일 검사 · [B] 브라우저(127.0.0.1:4337 렌더 문서, 1280·768·390). [B] 근거 `logs/qb-b.json`(원자료) · `logs/qb-judge.txt`(판정). 13건 PASS / FAIL 0 / 미판정 0 (header 3변형 KB-AC-32 몫은 1b).

| KB-AC | 변형 | [U]/[G] | [B] | 판정 | 근거 |
|---|---|---|---|---|---|
| 10 | split | PASS | PASS | PASS | 1280 카피·이미지 같은 행 6:6(528/528) · 768 7:5(383/274) · 390 카피 아래 끝 240 ≤ 이미지 위 264 (`logs/qb-judge.txt`) |
| 11 | split | PASS | PASS | PASS | [U] 톤 면·--kit-soft · [B] 부제 base=muted · alt=ink 3폭(QB-12) · 쌍 muted/bg·ink/surface만 |
| 12 | split | PASS | PASS | PASS | [B] 이미지 끔 figure 0 · 카피 폭 1280 500.4 = 60ch · 390 343 |
| 13 | center | PASS | PASS | PASS | [B] 두 톤 대비 쌍 on-primary/primary·primary/on-primary만 · 정적 = 캔버스 |
| 14 | center | 규칙 PASS | PASS | PASS | [B] h1 가운데 차이 1280·390 0 · 카피 폭 ≤ 60ch |
| 15 | grid | PASS | — | PASS | `HeroGrid.test` img 1 · B·C aria-hidden · 글자 0 / 플레이스홀더 그라디언트 1 |
| 16 | grid | 규칙 PASS | PASS | PASS | [B] 1280 A 377.5 = B 182.8 + C 182.8 + 간격 12 · 768 423.1 = 205.6+205.6+12 · 390 보이는 타일 1 |
| 17 | grid | PASS | — | PASS | 이미지 끔 타일 격자 0 · solo |
| 18 | text | PASS | PASS | PASS | [B] h1 왼쪽 = 래퍼 안쪽 왼쪽(88.5 · 32 · 16) |
| 19 | text | 규칙 PASS | PASS | PASS | [B] 1280 h1 폭 497.9 ≤ 9/12 816 · 390 상한+200% 넘침 0 |
| 20 | image | PASS(DOM) | PASS | PASS | [B] 미디어 아래 끝 ≤ h1 위 끝(1280 603<699 · 768 485<581 · 390 342<390) |
| 21 | image | 규칙 PASS | PASS | PASS | [B] 2.334/2.333 · 1.778/1.778 · 1.333/1.333 · 미디어 폭 = 섹션 폭 |
| 22 | image | PASS | — | PASS | 이미지 끔 미디어 0 · solo |
| 30 | 5 | PASS [G] | — | PASS | kitGuard(kit/ 전체) + `heroVariants.test` iframe·외부 URL 0 |
| 31 | 5 | — | PASS | PASS | [B] 5변형 상한 글자 + 200% × 1280·768·390 가로 넘침 0 · 밖으로 나간 요소 0 · 말줄임 0 |
| 32 | 5 | PASS [U] | — | PASS | 정적 HTML script = 고정 1개(바이트 일치) — hero 몫. header 3변형 몫은 1b |
| 33 | 5 | PASS [U] | — | PASS | 5쌍 등록 · 루트 1 · 폴백 표식 0 |
| 34 | 5 | — | PASS | PASS | [B] 프로필 light·dark(카드) × base·alt × 5변형 × 1280·390 허용 밖 쌍 0 · 최소 대비 4.61 (+QB-13 bright 0) |
| 35 | 5 | PASS [U]/[G] | PASS | PASS | [B] 5변형 × (alt 이미지 켬 · base 이미지 끔) × 3폭 = 30건 정적 HTML 계산 스타일 = 캔버스(배경·글자색·scroll-margin-top·격자) · 앵커 이동 뒤 contact h2가 header 아래 · script 1 |

## 3. 번들 표 (gzip KB)
| 시점 | 렌더 JS | 렌더 CSS | `/studio` 진입 | 첫 화면 | 그 밖 |
|---|---|---|---|---|---|
| 기준 f113f2c | 80.12 | 6.32 | 127.38 | 91.78 | 공통 89.35 · /catalog 99.65/102.04 · /references 97.00/99.38 · /compare 98.83/121.70 · /profile 99.61/118.66 · /projects 94.02/100.29 |
| P1 grid 시제품 | 80.29 (+0.17) | 6.50 (+0.18) | 127.39 (+0.01) | 91.77 | ±0.01 |
| P1 끝 예상 | ≈ 80.97 (×5, 공유분 포함 보수) | ≈ 7.22 | 127.41 (문자열 5개 알파벳순 직접 실측 · 정밀 127,379 → 127,414 B = +35 B) | — | ±0.01 |
| P6 = 5변형 끝 (726392c) | **80.50 (+0.38)** | **6.72 (+0.40)** | **127.41 (+0.03)** | 91.78 | 공통 89.35 · /catalog 99.65/102.04 · /references 97.00/99.39 · /compare 98.83/121.71 · /profile 99.61/118.67 · /projects 94.02/100.30 (±0.01) |

- P1 판정: 멈춤 조건 아님(렌더 JS 끝 예상 ≤ 89.70 · /studio 끝 예상 +0.03 ≤ 0.03). RENDERED_VARIANTS 표현 실측(나열·알파벳순 127.41 · 나열·기존 순서 127.42 · 라이브러리 파생 127.43 · map 127.44) → 알파벳순 나열 채택. 첫 기록의 127.41은 목록 중복(grid 2회)으로 잘못 잰 값 — 같은 파일 끝에 정정. 근거 `logs/p1-budget.txt`

- 마감 gate(`logs/final.txt`, HEAD 코드 = 726392c·a2e013a): 표적 src/kit + staticHtml 108/108 · 가드 76/76 · typecheck 0 · lint 0 · build 0 · 렌더 JS 80.50 / CSS 6.72 · /studio 127.41. 전체 vitest 3회는 브리프대로 Jarvis 몫(레인 미실행).

## 4. SPEC과 다르게 한 곳 · HeroFullbleedLeft 공유 근거
**공유 (브리프 "카피 블록 · CTA 대상 · Media")**
- 카피 블록 = `kit/heroCopy.tsx` `HeroCopy` 하나를 hero 6변형(fullbleed-left 포함)이 쓴다. 마크업(h1 id · data-slot · CTA 앵커/글자 분기 · 빈 슬롯 생략)이 같고 클래스 묶음만 면에 따라 둘: `PRIMARY_COPY`(primary 면 — fullbleed 패널 · center) / `TONE_COPY`(섹션 톤 면 — split·grid·text·image). HeroFullbleedLeft는 출력 마크업 그대로(기존 테스트 변경 0)이고 카피 부분만 HeroCopy로 바꿨다.
- CTA 대상 = 기존 `kitLinks`(0.10) 그대로 — 새 계산 0.
- 이미지 = 기존 `Media` 그대로(split = 프로필 media_ratio · grid 4:5 · image 16:9 속성값, 실제 비율은 CSS).
- 섹션 톤 면·보조 글자 = 기존 `.kit-body`(`data-tone` base bg·muted / alt surface·ink) + `bodySurface`·`headingId`(kit/body.ts) 재사용 → 새 `--kit-soft` 정의 0 · 톤 선택자 = `data-tone`(정적 HTML 보존).
- CTA 모양(섹션 톤 면) = header의 `.kit-cta`(K1-1 CTA와 같음 — SPEC 2절 공통) · center CTA·글자 = fullbleed 패널의 `.kit-hero-cta`·`.kit-hero-title`·`.kit-hero-lead`(SPEC B-5 "K1-2 패널 조합 재사용").

**SPEC과 다르게 한 곳**
- B-7 강조선: SPEC 구조의 `<span>` 대신 빈 `<div aria-hidden>` — 킷 공통 검사(K-AC-04)가 글자 없는 `span`을 빈 요소로 센다. 장식·글자 0·aria-hidden은 같다(그라디언트 `div`와 같은 방식).
- RENDERED_VARIANTS를 알파벳순으로 다시 늘어놓았다 — 같은 집합 중 `/studio` 진입 gzip이 가장 작은 순서(P1 실측, 기존 순서 대비 −5 B). 가드는 sort 비교라 의미 변화 0.
- split 이미지 칸: `img` width·height 속성 = 프로필 media_ratio, md 미만 실제 비율은 CSS 4:3(SPEC B-4 5와 같음 — 속성은 자리 이동 방지용).

## 5. 시각 QA 캡처
- 경로 `shots/` (이름에 변형 포함 — QB-13이 5변형 × 폭이라 번호·폭만으로는 겹침), 28장 = QB-5~9 각 1280·768·390(15) · QB-12 3폭(3, 한 문서에 split base·grid alt·text base·image alt) · QB-13 5변형 × 1280·390(10, 밝은 ink 팔레트 bright — 게이트 통과 확인 `gate-profiles`).
- **도구 변경**: ego-browser `Page.captureScreenshot`가 시간 초과(`logs/qb-probe.txt`, 재시도 무의미) → 브리프 대안대로 Chrome headless `--screenshot`(`shots.sh`, 390·768 = 해당 폭 iframe 감싸기, 뷰포트만). 찍는 대상 = 같은 문서의 정적 HTML(`static/*.html`, buildStaticHtml) — KB-AC-35 [B]로 캔버스와 계산 스타일 같음을 확인한 결과물. 수치 판정은 ego-browser(render.html 최상위, CDP 폭).
- QB-5 split 6:6/7:5/1단 ✓ · QB-6 center 가운데 축·prose-max ✓ · QB-7 grid A+B·C / 768 카피 위 3칸 / 390 A만 ✓ · QB-8 text 강조선·왼쪽 정렬 ✓ · QB-9 image 21:9/16:9/4:3, 1280 h1 위 끝 699 · 아래 끝 760 (첫 화면 800 안 — ⑪ 여백 조정 불필요) ✓ · QB-12 부제 base muted / alt ink 3폭 ✓ · QB-13 bright 대비 허용 밖 0 ✓ (육안: 캡처 3장 직접 확인 — grid 1280 · image 1280 · image 390)

## 6. Codex
- `node codex-companion.mjs review --scope branch --base f113f2c` 1회 (`logs/codex.txt`) — **지적 0건(P1 0)**: "기준 커밋 대비 변경에서 수정이 필요한 구체적인 결함을 발견하지 못했습니다". Codex 쪽 테스트 실행은 읽기 전용 샌드박스 EPERM으로 막혔다 — 테스트 증거는 레인 gate 로그(`logs/p*-green.txt`, `p7-common.txt`).
- 검토 시점 = 브라우저 판정 전 커밋(a2e013a, 코드 동일 — 이후 커밋은 기록·스크립트만).

## 7. 남은 위험 · 1b 메모
1. **`/studio` 진입 여유 0** — 127.41(+0.03, 정밀 +35 B). 브리프 한도(±0.03) 안이지만 경계. 앱 쪽 증가는 `RENDERED_VARIANTS` 문자열뿐이라 **1b(header 3 + footer 3 = 문자열 6개 더)는 같은 방식이면 +0.03을 넘을 가능성이 높다** — 1b 시작 전 표현 방식(예: 가드 유지한 채 앱 청크 밖으로 옮기기)이나 한도를 Jarvis가 정해야 한다(이 레인은 바꾸지 않음).
2. **1b `heroTop`(D-1)이 읽을 hero 맨 위 면 — hero 쪽 사실(SPEC B-3 표와 대조)**: split·grid·text = 섹션 톤 면(루트 `data-surface` bg/surface, 맨 위 = kit-wrap 위 여백의 섹션 면) ✓ · center = primary 면(루트 전체) ✓ · image 이미지 켬 = 미디어 띠가 맨 위(그리드 영역 media 먼저, 플레이스홀더면 그라디언트) ✓ · image 이미지 끔 = 카피 띠(섹션 톤 면)가 맨 위 ✓. 표와 다른 점 없음.
3. SPEC 공백 — 보수적 해석: (가) hero 제목 줄 높이는 기존 `[data-kit] h1` 1.25 그대로(새 값 0) (나) image 변형 lg 2단에서 부제가 비면 CTA가 오른쪽 칸 맨 위(SPEC 4 "위 정렬")로 간다.

## 8. 서버
- 띄운 것: vite 4337 — npx PID 16316 · node PID 16343 (`logs/vite.pid`). 4339는 쓰지 않았다(정적 HTML은 srcdoc iframe · file://).
- 종료: `kill 16316 16343` → `ps` 없음 · `lsof -nP -iTCP:4337 -sTCP:LISTEN` = 0줄 · `lsof -nP -iTCP:4339 -sTCP:LISTEN` = 0줄 (2026-10-04 22:0x KST). ego-browser·Chrome headless 프로세스 남음 0.
