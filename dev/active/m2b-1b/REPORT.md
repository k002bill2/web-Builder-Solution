# M2B-1b header 3 + footer 3 실렌더 — REPORT

- 브리프 `docs/06-handoff/M2B-1_BOUND-VARIANTS_BRIEF.md` (레인 M2B-1b) · 정본 `docs/design/m2b/SPEC-BOUND.md` · 시작 커밋 `5970721` · 브랜치 `k002bill2/m2b-1b`

## 1. 커밋 표
| 단계 | RED | GREEN | 내용 |
|---|---|---|---|
| P0 | — | 7ee6c26 | 수신 · REPORT 골격 · gate.sh |
| P1 | — | (이 커밋) | 예산 선행 실측 — two-tier 시제품 diff `logs/p1-two-tier-prototype.diff` · `logs/p1-budget.txt` |

## 2. 변형별 판정 (KB-AC)
(작성 중)

## 3. 번들 표 (gzip KB)
| 시점 | 렌더 JS | 렌더 CSS | `/studio` 진입 | 첫 화면 | 그 밖 |
|---|---|---|---|---|---|
| 기준 5970721 | 80.50 | 6.72 | 127.41 | 91.78 | 공통 89.35 · /catalog 99.65/102.04 · /references 97.00/99.39 · /compare 98.83/121.71 · /profile 99.61/118.67 · /projects 94.02/100.30 |
| P1 two-tier 시제품 | 80.65 (+0.15) | 6.84 (+0.12) | 127.41 (0) | 91.78 | — |
| P1 끝 예상 | ≈ 81.41 (×6, 공유 부품 포함 보수) | ≈ 7.42 | 나열 127.46(+48 B, 멈춤) / 라이브러리 파생 127.40(−10 B) → 파생 | — | 파생안 ±0.01 |

## 4. SPEC과 다르게 한 곳
(작성 중)

## 5. 시각 QA 캡처
(작성 중)

## 6. Codex
(작성 중)

## 7. 남은 위험
(작성 중)

## 8. 서버
(작성 중)
