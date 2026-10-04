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
| P7 공통 | 변이 검사 `logs/p7-mutation.txt` | (공통 커밋) | `kit/heroVariants.test.tsx` — KB-AC-30·32·33·35 [U]/[G] |

## 2. 변형별 판정 (KB-AC)
표기: [U] jsdom · [G] 파일 검사 · [B] 브라우저(127.0.0.1:4337 렌더 문서, 1280·768·390). [B] 칸은 브라우저 단계(P8)에서 채운다.

| KB-AC | 변형 | [U]/[G] | [B] | 판정 | 근거 |
|---|---|---|---|---|---|
| 10 | split | — | (P8) | (P8) | 같은 행 · 카피 왼쪽 / 390 카피 → 이미지 |
| 11 | split | PASS | (P8) | (P8) | `HeroSplit.test` 톤 면·부제 --kit-soft · [B] 계산 색 |
| 12 | split | PASS | (P8) | (P8) | 이미지 끔 figure 0 · kit-hx--solo |
| 13 | center | PASS | (P8) | (P8) | `HeroCenter.test` 두 톤 같은 클래스·primary 면 |
| 14 | center | 규칙 PASS | (P8) | (P8) | 가운데 축 ≤ 1 · prose-max |
| 15 | grid | PASS | — | PASS | `HeroGrid.test` img 1 · B·C aria-hidden · 글자 0 / 플레이스홀더 그라디언트 1 |
| 16 | grid | 규칙 PASS | (P8) | (P8) | 1280·768 타일 3 · A ≈ B + C + 간격 / 390 1 |
| 17 | grid | PASS | — | PASS | 이미지 끔 타일 격자 0 · solo |
| 18 | text | PASS | (P8) | (P8) | 톤 면 · 강조선 aria-hidden · h1 왼쪽 끝 |
| 19 | text | 규칙 PASS | (P8) | (P8) | h1 폭 ≤ 9/12 · 390 200% 넘침 0 |
| 20 | image | PASS(DOM) | (P8) | (P8) | 미디어 아래 끝 ≤ h1 위 끝 |
| 21 | image | 규칙 PASS | (P8) | (P8) | 21:9 · 16:9 · 4:3 ±1% · 폭 = 섹션 |
| 22 | image | PASS | — | PASS | 이미지 끔 미디어 0 · solo |
| 30 | 5 | PASS [G] | — | PASS | kitGuard(kit/ 전체) + `heroVariants.test` iframe·외부 URL 0 |
| 31 | 5 | — | (P8) | (P8) | 상한 글자 + 200% 1280·768·390 넘침 0 · 말줄임 0 |
| 32 | 5 | PASS [U] | — | PASS | 정적 HTML script = 고정 1개(바이트 일치) — hero 몫. header 3변형 몫은 1b |
| 33 | 5 | PASS [U] | — | PASS | 5쌍 등록 · 루트 1 · 폴백 표식 0 |
| 34 | 5 | — | (P8) | (P8) | 프로필 2벌 × 톤 base·alt 대비 |
| 35 | 5 | PASS [U]/[G] | (P8) | (P8) | 정적 HTML에서 hero 선택자 전부 매칭(변이 검사 포함) · [B] 캔버스 = 정적 계산 스타일 |

## 3. 번들 표 (gzip KB)
| 시점 | 렌더 JS | 렌더 CSS | `/studio` 진입 | 첫 화면 | 그 밖 |
|---|---|---|---|---|---|
| 기준 f113f2c | 80.12 | 6.32 | 127.38 | 91.78 | 공통 89.35 · /catalog 99.65/102.04 · /references 97.00/99.38 · /compare 98.83/121.70 · /profile 99.61/118.66 · /projects 94.02/100.29 |
| P1 grid 시제품 | 80.29 (+0.17) | 6.50 (+0.18) | 127.39 (+0.01) | 91.77 | ±0.01 |
| P1 끝 예상 | ≈ 80.97 (×5, 공유분 포함 보수) | ≈ 7.22 | 127.41 (문자열 5개 알파벳순 직접 실측 · 정밀 127,379 → 127,414 B = +35 B) | — | ±0.01 |
| P6 = 5변형 끝 (726392c) | **80.50 (+0.38)** | **6.72 (+0.40)** | **127.41 (+0.03)** | 91.78 | 공통 89.35 · /catalog 99.65/102.04 · /references 97.00/99.39 · /compare 98.83/121.71 · /profile 99.61/118.67 · /projects 94.02/100.30 (±0.01) |

- P1 판정: 멈춤 조건 아님(렌더 JS 끝 예상 ≤ 89.70 · /studio 끝 예상 +0.03 ≤ 0.03). RENDERED_VARIANTS 표현 실측(나열·알파벳순 127.41 · 나열·기존 순서 127.42 · 라이브러리 파생 127.43 · map 127.44) → 알파벳순 나열 채택. 첫 기록의 127.41은 목록 중복(grid 2회)으로 잘못 잰 값 — 같은 파일 끝에 정정. 근거 `logs/p1-budget.txt`

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
(작성 중)

## 6. Codex
(작성 중)

## 7. 남은 위험 · 1b 메모
1. **`/studio` 진입 여유 0** — 127.41(+0.03, 정밀 +35 B). 브리프 한도(±0.03) 안이지만 경계. 앱 쪽 증가는 `RENDERED_VARIANTS` 문자열뿐이라 **1b(header 3 + footer 3 = 문자열 6개 더)는 같은 방식이면 +0.03을 넘을 가능성이 높다** — 1b 시작 전 표현 방식(예: 가드 유지한 채 앱 청크 밖으로 옮기기)이나 한도를 Jarvis가 정해야 한다(이 레인은 바꾸지 않음).
2. **1b `heroTop`(D-1)이 읽을 hero 맨 위 면 — hero 쪽 사실(SPEC B-3 표와 대조)**: split·grid·text = 섹션 톤 면(루트 `data-surface` bg/surface, 맨 위 = kit-wrap 위 여백의 섹션 면) ✓ · center = primary 면(루트 전체) ✓ · image 이미지 켬 = 미디어 띠가 맨 위(그리드 영역 media 먼저, 플레이스홀더면 그라디언트) ✓ · image 이미지 끔 = 카피 띠(섹션 톤 면)가 맨 위 ✓. 표와 다른 점 없음.
3. SPEC 공백 — 보수적 해석: (가) hero 제목 줄 높이는 기존 `[data-kit] h1` 1.25 그대로(새 값 0) (나) image 변형 lg 2단에서 부제가 비면 CTA가 오른쪽 칸 맨 위(SPEC 4 "위 정렬")로 간다.

## 8. 서버
(작성 중)
