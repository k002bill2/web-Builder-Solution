# QA-PROGRESS — RS6 설계 독립 검토 (QA-BRIEF.md)

대상 tip `7189816e` (base `c7a7a2a8`). 읽기 전용. 산출물: QA-REVIEW.md.

- [x] QA-BRIEF·QA-PROGRESS 커밋 (`077c89fd`)
- [x] 1. 사실 대조 (L1 표본 ≥10) — 서브에이전트 ① 38건 + 메인 7건
- [x] 2. 12건 커버리지 표 — 서브에이전트 ②
- [x] 3. 설계 위험 판정 (LV-1·BD-1·포트·예산) — 메인 (초안: D6-9 readonly 사실 오류·이탈 뒤 save 주체 미정·코어 열기 시점 vs lazy LocalSync·ADR-007 4-2·계획 쓰기 경로 누락)
- [x] 4. MQ 품질 검토 — 메인
- [x] 5. 계획 실행 가능성 검토 — 메인
- [x] QA-REVIEW.md 작성·커밋 — 판정 **보완 후 가능** (P1 3: R1 이탈 save 주체·R2 코어 생성 시점·R7 G1 레코드 재쓰기)

## 서브에이전트 결과
| # | 범위 | 결과 | 반영 |
|---|---|---|---|
| ① | I6·PLAN·MQ-6 코드 주장 대조(읽기 전용) | 38건: 일치 25 / 부분 9 / 오류 3 / 확인불가 1. 결론 변경 = `deleteSnapshot` 등 DocBook 경로 레코드 재쓰기(G1 공백) · `StudioLeave.test.tsx` 11절 누락 · D6-9 vs SPEC-4 RS4-AC-06 | QA-REVIEW 1.1 · R7 · R1 |
| ② | backlog-rs-status 12건 커버리지(읽기 전용) | 원보고 해결 4 / 범위 밖 1 / 누락 7 → 메인 재분류 해결 4 / 부분 2 / 범위 밖 1 / 누락 5. RS4-R8·CE-4 = 해결 주장→부분 · RS4-B1 누락 · BD-2 포트 시그니처 재발 경로 | QA-REVIEW 2절 · 6절-6 |

- 메인 재확인: `imageOps.ts:19,25` · `memoryProjectRepository.ts:65-66,149` · `localSync.ts:155-157` · `SnapshotDialog.tsx:260` · `restartFlow.ts:135,166` · `SPEC-4.md:349`.
- 실행: `npx vitest --run src/components/studio/StudioLeave.test.tsx` → 14 passed (14).
