# 병렬 레인 운영 (2026-09-26 KST 결정)

- 결정: 영환님 "1, A, A" — Jarvis 검토안(순차 필수 구간과 병렬 가능 구간 분리)
  - **Q-P1 = 1**: 3레인 병렬. 엔진 레인은 2a-04b2 종료 뒤 시작.
  - **Q-P2 = A**: 엔진 계약은 새 의존성 없이 수기 TS 타입 + 검증 함수(zod 미도입).
  - **Q-P3 = A**: DS-CHECK-01 결과 직후 2a-05·07 편집기 설계(SPEC) 착수.

## 레인
| 레인 | 담당 | 작업 순서 | 코드 영향 |
|---|---|---|---|
| L1 화면 | Developer | 2a-04b2 + FIX F2(`b68f0ac`) → NARROW(`25db457`) → **BUNDLE-HEADROOM + F1 + 스타일 가드**(작업 공간 `bundle-headroom`, 영환님 A) → **FIX-2A04B2-P1**(QA-2A04B2 P1·P3 2·관찰 ②) → 2a-04c(3안) · 2a-05a1 · 별건: 라우트 문서 제목 | `app/src` 프로필·보드, 번들 |
| L2 설계 | Designer | DS-CHECK-01(`fd8312e`) → DS-2A-05 SPEC r0(`bc27011`) → r1(Codex j1 반영, 병합 `c302c26`, AC 57) → Codex j2(Jarvis, 결과에 따라 r2) → 2a-05a1 착수 전 대기 | `docs/design/2a-05/`만 |
| L3 검증 | QA | QA-2A04AB(`3b2aa0e`) → QA-2A04B2(FAIL P1 1·P3 2, `4af9f9a`) → 다음: HEADROOM+P1 FIX 병합분 회귀 | `docs/qa/`만 |
| L4 엔진 | Developer 2번째 작업 공간 | L4a 계약·검증·연산(병합 `23fd46f`, Codex j3 approve) → **L4b** `runGate`(8줄)·`createDocFromCandidate`(작업 공간 `l4-engine-b`) → L4c composer(seed, 2a-04c와 조율)·R-05 풀블리드·토큰→테마 | 순수 TS, 화면 import 0 → 번들 0. b2 병합 뒤 main에 rebase |

## 규칙
1. `ProfilePage`·`useProfileDetail`·프로필 저장소를 고치는 작업은 동시에 1개(L1).
2. 공통 청크·`/compare` 진입 직후 합계를 늘릴 수 있는 브랜치는 동시에 1개(여유 0.57KB).
3. 편집기 구현(2a-05)은 SPEC + PageDoc 계약 + 렌더러 준비 전 시작하지 않는다.
4. 동시에 도는 작업이 있으면 전체 테스트 반복(5회)은 한 레인만, 나머지는 1회 + 실패 파일 단독 재실행.
5. 병합 순서: L1 먼저, L4는 뒤에서 rebase. 재검증·Codex 검토는 Jarvis가 레인별로 순서대로.
6. 미리보기 포트 분리: Developer 스모크 4337, QA 4341, Designer 4345.
