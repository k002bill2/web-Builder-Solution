# M2A-CLOSE-DEV — M2a 마감: Codex P2 6건 — REPORT

- 브리프 `docs/06-handoff/M2A-CLOSE_DEV_BRIEF.md` · 시작 커밋 `0180860`(main `b8a270b` + 브리프) · 브랜치 `k002bill2/m2a-close-dev`

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | b0066a8 | 수신 기록 · REPORT 골격 · `gate.sh` |
| D1 | (D1 커밋) | P2-2 생성기 청크 실패 기억 |

## 2. P2 6건
| # | 원인 | 수정 | 테스트(RED → GREEN) | 커밋 |
|---|---|---|---|---|
| D1 P2-2 | `memoryDocBook.ts` `browser ??= load().then(...)`가 rejected Promise를 그대로 기억 → 다시 시도해도 즉시 실패. 슬롯 로더(`exportFlow.ts`)가 `retryableImport`가 아니라 브라우저가 실패한 동적 import URL을 기억 | 실패 시 `browser = undefined`(다음 실행이 슬롯 로더를 다시 부름) · 슬롯 로더 = `retryableImport(() => import("./staticHtml/staticHtml"))` | RED `logs/d1-red.txt`(2 실패) → GREEN: `memoryExport.test.ts` "P2-2 첫 로드 실패 → INFRA → 같은 요청 재시도 → 성공 · 로더 2회" · `chunkRetryWiring.test.ts` "슬롯 로더도 retryableImport" · gate `logs/d1.txt` exit 0 | (D1 커밋) |
| D2 P2-3 | (진행 중) | | | |
| D3 P2-1 | (진행 중) | | | |
| D4 P2-a | (진행 중) | | | |
| D5 P2-b | (진행 중) | | | |
| D6 P2-c | (진행 중) | | | |

## 3. 번들
| 시점 | `/studio` 진입(≤127.70) | 렌더 JS(≤89.70) | 그 밖 | 로그 |
|---|---|---|---|---|
| 기준(3c 마감 `logs/c4-fix.txt`) | 127.20 | 80.12 | 공통 89.35 · catalog 102.03 · references 99.38 · compare 121.69 · profile 118.66 · projects 100.30 | `dev/active/m2a-3c/logs/c4-fix.txt` |
| D1 | 127.19 | 80.12 | 공통 89.34 · 102.03 · 99.38 · 121.69 · 118.65 · 100.28 (모두 ±0.03 안) | `logs/d1.txt` |

## 4. SPEC 차이
(진행 중)

## 5. Codex
(D7)

## 6. 남은 위험
(D7)

## 7. 서버
(D7)
