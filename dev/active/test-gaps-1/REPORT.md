# TEST-GAPS-1 REPORT (초안)

base `5444def5` · 브랜치 `k002bill2/test-gaps-1` · 테스트 전용(앱 코드 변경 0) · 원격 명령 0 · Codex 0

## 1. 대상 (BACKLOG 원문 기준)
| ID | 원문 요지 | 상태(착수 시) |
|---|---|---|
| B-RS-08 | 생존 변이 묶음 — L5 M1은 RS7-M1에서 이미 닫힘. 남은 것 = L1 U14-b(confirmDoc `idle()` 대기 제거) | U14-b만 대상 |
| B-M3-04 | 로드 조건 단위 테스트가 로더 호출 수만 잼 — 정적 side-effect import 미검출 | 대상 |
| B-SEC-05 | `checkImages.test` 헤더 < 사다리(639×480·640×479 → IM-6·디코드 0) · 변이 M2(`===`→`<=`) 생존 | 대상 |
| B-M4B-07 | RZ-AC 부분 단언 08·13·17·09·04 | 대상(서브에이전트 A) |
| B-M4B-08 | `StudioPanels.test.tsx:18` `exports={null}` 시 "내보내기" 제목 뒤 형제 0 단언 · 변이 M2a 생존 | 대상 |

## 2. RED/GREEN 표
(작성 중)

## 3. 서브에이전트
- A(worktree): B-M4B-07 — 진행 중
- B(worktree): B-RS-08 U14-b — 진행 중(30분 상한)

## 4. 게이트
(작성 중)

## 5. BACKLOG 닫기 제안
(작성 중)
