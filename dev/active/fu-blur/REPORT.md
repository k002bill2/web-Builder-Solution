# FU-BLUR REPORT — 청크 로딩 중 blur 경계 (FIELD-UNDO Codex r2 P2-1)

- 브랜치 `k002bill2/fu-blur` · base `2ad7221` · 미병합(push/merge 0)
- 결론: 첫 입력으로 `docEngine` 청크를 받는 동안 칸을 떠났다 같은 칸에 다시 치면 이제 **기록 2건**(전: 1건). 게이트 4종 통과 · Codex r1 P2 1건 반영 · r2 지적 0.
- **예산 몫 초과(0.01~0.02KB)** — 영환님 결정 필요(0절).

## 0. 결정 필요 — 예산 몫 초과

| 시나리오 | base `2ad7221` | HEAD `8a9e409` | 증가 | 몫 | 판정선 |
|---|---|---|---|---|---|
| `/studio/:projectId` | 129.57 | 129.63 | +0.06 | ≤ +0.05 | 129.65 (안) |
| 복원 진입 | 132.60 | 132.67 | +0.07 | ≤ +0.05 | 132.68 (안) |

- 이력: GREEN `53f4864`는 +0.05/+0.05(몫 꽉 참). Codex r1 P2(로딩 실패·언마운트 시 표시 리스너 누수) 반영을 `.finally(off)`로 하자 129.65/132.69(복원 판정선 초과 → build 실패). 감량 1회(해제를 묶음 `off`에 싣고 청크가 첫 처리에서 교체) → 129.63/132.67. 브리프 규칙대로 더 감량하지 않고 멈췄다.
- build는 exit 0(판정선 안)이라 `m2cBaseline.json` · `bundleBudget.test.mjs`는 고치지 않았다.
- 선택지:
  - **A(추천)** 그대로 승인 — ADR-004 개정 15 결정 2: 이 레인 몫 +0.05 외에 "미배분 0.05 + 기존 잡음 흡수분 0.09"가 있고 "다른 기능 사용은 새 개정"이다. 이번 초과(+0.01/+0.02)는 같은 기능(FU r2 P2-1)이지만 미배분·잡음분을 쓰는 것이라 영환님 승인이 필요하고, 병렬 SAVE-ON-LEAVE(B-RS-01 +0.15)와 같은 판정선(129.65→129.95 상한)을 나눠 쓴다 — 병합 때 합산 실측으로 확인 필요. 이점: 누수 수정(Codex r1 P2)까지 포함.
  - B r1 수정만 되돌리기(`53f4864` 상태, +0.05/+0.05) — 청크 로딩이 실패하면 focusout 표시 리스너 1개가 편집기 수명 동안 남음(언마운트 뒤 성공 응답이면 해제됨).
- 첫 화면 합계가 실행마다 91.85~91.87로 흔들림 = 해시·gzip 잡음 ±0.01 포함(L2).

## 1. 변경

| 파일 | 내용 |
|---|---|
| `app/src/features/studio/useSectionOps.ts` | `field()`가 새 묶음을 열 때 focusout 표시 리스너(`o.cut = true`)를 달고 해제 함수를 묶음 `off`에 둔다. 입력마다 `o.cut`을 읽어 지우고 청크(`fieldTyped`)에 넘긴다 |
| `app/src/features/studio/opAfter.ts` | `FieldOpen.cut?` · `on?` 추가. `fieldTyped(…, cut?)` — `cut`이면 다른 칸과 같은 경로로 앞 묶음을 앞 입력 문서까지로 닫고 새로 연다. 청크 첫 처리(`!o.on`)에서 진입 표시 리스너를 `o.off()`로 떼고 자기 리스너로 바꾼다 |
| `app/src/features/studio/useSectionOps.field.test.tsx` | 새 it 2건 — ① 청크 응답 전 입력 → blur → 같은 칸 재입력 = 기록 2건 · 실행 취소 2회 = 앞 입력 → 시작 문서 · 리스너 누적 0 ② 청크 응답 전 언마운트 = 리스너 누적 0 |
| `docs/06-handoff/BACKLOG.md` | B-ER-08 행 끝에 "Codex r2 P2-1" 결과 표기 |

브리프 제안("청크 미로드 시 `once` 리스너 + 청크 판정 1줄")과 다르게 한 점: `once`는 blur가 없으면 청크 로드 뒤에도 남아 P2-4(리스너 누적 0)와 어긋나고, 로딩 중 두 번째 blur를 놓친다. 그래서 "청크가 그 묶음을 처음 처리할 때까지만" 리스너를 유지한다. 청크가 이미 있으면 then이 바로 다음 마이크로태스크라 표시가 쓰일 틈이 없다(비용 = 묶음당 add/remove 1쌍).

## 2. TDD

- RED 예측: 기록 1건 → 첫 실행 취소가 바로 시작 문서로 감(제목 "하나" 기대 실패).
- RED 결과(fix 전): `expected '한 문장으로 소개하는 제목' to be '하나'` — 1 failed / 15 passed.
- GREEN: 같은 파일 17/17 · studio 관련 4개 파일 328/328.
- Codex r1 수정 RED→GREEN: it ②에 "언마운트 직후(청크 응답 전) 리스너 0" 단언. `53f4864` 코드로 되돌려 실행 = `expected 1 to be +0` 1 failed / 16 passed(RED) → HEAD 코드 = 17/17(GREEN). 응답 전 해제 = 로딩 실패 경로와 같은 메커니즘(언마운트 정리 `o.off`).
- 기존 FU-AC · FU-AC-13 · P2-4 단언 약화 0.

## 3. 게이트 (fresh, `8a9e409`)

| 명령 | 결과 |
|---|---|
| `npm ci` | exit 0 · lock 변경 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx vitest run` | 300 files · 2705 tests passed |
| `npm run build` | exit 0 (예산 판정 포함 — 0절 수치) |

## 4. Codex (`review --scope branch --base 2ad7221`)

- r1(`logs/codex-r1.txt`) [P2] 임시 focusout 리스너가 청크 로딩 성공에만 의존해 언마운트·로딩 실패 시 해제 안 됨 — **반영** `8a9e409`(해제를 묶음 `off`로 → 언마운트 정리 `o.current?.off?.()`·`closeField`·청크 첫 처리가 뗀다).
- r2(`logs/codex-r2.txt`) 지적 0.
- 두 라운드 모두 Codex 샌드박스에서 vitest가 EPERM으로 못 돌았다 — 테스트 근거는 3절 로컬 실행.

## 5. Ego 생략 사유

타이밍 경합(청크를 받는 수십 ms 안에 떠났다 돌아오기)이라 브라우저 재현이 불안정하다. 같은 틱 입력·focusout 주입으로 "청크 응답 전" 상태를 결정적으로 만든 훅 단위 테스트를 근거로 삼았다(브리프 허용).

## 6. 남은 것

- 0절 예산 결정(A/B). 병합은 Jarvis.
