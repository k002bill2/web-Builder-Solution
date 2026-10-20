# CSP-1 REPORT — static-html 고정 CSP (초안)

- 브랜치 `k002bill2/csp-html` · base `ec32f407` · 정본 CSP-SPEC r1 + 5a(1단계 = static-html)
- 상태: **초안** — 구현·검증 진행 중. 확정 수치는 마감 때 채운다.

## 결론
(마감 때)

## 변경 파일
(마감 때)

## 수용 기준
| AC | 결과 | 증거 |
|---|---|---|
| CSP-AC-01 | 대기 | |
| CSP-AC-03 | 대기 | |
| CSP-AC-04 | 대기 | |
| CSP-AC-05 | 대기 | |
| CSP-AC-06(html) | 대기 | |
| CSP-AC-07(html) | 대기 | |
| CSP-AC-08 | 대기 | |
| CSP-AC-10 | 대기 | |
| CSP-AC-R1 | 대기 | |
| CSP-AC-R5(html) | 대기 | |

## 스펙과 다르게 한 부분 (사유 한 줄씩)
- `STATIC_CSP_ZIP` 미정의 — 5a 1단계는 html만. zip 출력은 바이트 불변(meta 0)을 테스트로 고정.
- F-15를 `assertStaticHead(head, target)`로 export — head를 처음부터 만들어 주입 경로가 없으므로 AC-06을 순수 함수로 검사.
- AC-07 = base 출력 파일 스냅샷(4.2.3 "새 스냅샷 대신"과 다름) — 변경 전 출력이 있어야 바이트 비교가 성립.

## 예산
(base 진입·복원 수치 → 변경 후 수치)

## Codex
(adversarial 1회 · 반영 1회)

## 커밋
- `0c379708` BRIEF·PROGRESS 보존
