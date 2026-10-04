# M2B-1a hero 5변형 실렌더 — REPORT

- 브리프 `docs/06-handoff/M2B-1_BOUND-VARIANTS_BRIEF.md` (레인 M2B-1a) · 정본 `docs/design/m2b/SPEC-BOUND.md` · 시작 커밋 `f113f2c` · 브랜치 `k002bill2/m2b-1a`

## 1. 커밋 표
| 단계 | RED | GREEN | 내용 |
|---|---|---|---|
| P0 | — | 56f0083 | 수신 · REPORT 골격 · gate.sh |
| P1 | — | 1c61468 · bf42e17(정정) | 예산 선행 실측 — grid 시제품 diff `logs/p1-grid-prototype.diff` · `logs/p1-budget.txt` |
| P2 split | `logs/p2-split-red.txt` | 9b6f894 | hero/split + 공유 카피 블록 `kit/heroCopy.tsx` · 톤 공통 CSS |
| P3 center | `logs/p3-center-red.txt` | (center 커밋) | hero/center — primary 면 · fullbleed 패널 글자·CTA 클래스 재사용 |

## 2. 변형별 판정 (KB-AC)
(작성 중)

## 3. 번들 표 (gzip KB)
| 시점 | 렌더 JS | 렌더 CSS | `/studio` 진입 | 첫 화면 | 그 밖 |
|---|---|---|---|---|---|
| 기준 f113f2c | 80.12 | 6.32 | 127.38 | 91.78 | 공통 89.35 · /catalog 99.65/102.04 · /references 97.00/99.38 · /compare 98.83/121.70 · /profile 99.61/118.66 · /projects 94.02/100.29 |
| P1 grid 시제품 | 80.29 (+0.17) | 6.50 (+0.18) | 127.39 (+0.01) | 91.77 | ±0.01 |
| P1 끝 예상 | ≈ 80.97 (×5, 공유분 포함 보수) | ≈ 7.22 | 127.41 (문자열 5개 알파벳순 직접 실측 · 정밀 127,379 → 127,414 B = +35 B) | — | ±0.01 |

- P1 판정: 멈춤 조건 아님(렌더 JS 끝 예상 ≤ 89.70 · /studio 끝 예상 +0.03 ≤ 0.03). RENDERED_VARIANTS 표현 실측(나열·알파벳순 127.41 · 나열·기존 순서 127.42 · 라이브러리 파생 127.43 · map 127.44) → 알파벳순 나열 채택. 첫 기록의 127.41은 목록 중복(grid 2회)으로 잘못 잰 값 — 같은 파일 끝에 정정. 근거 `logs/p1-budget.txt`

## 4. SPEC과 다르게 한 곳 · HeroFullbleedLeft 공유 근거
(작성 중)

## 5. 시각 QA 캡처
(작성 중)

## 6. Codex
(작성 중)

## 7. 남은 위험 · 1b 메모
(작성 중)

## 8. 서버
(작성 중)
