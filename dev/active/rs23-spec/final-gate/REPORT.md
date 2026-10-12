# SPEC-3 r0.2 최종 독립 안전 검토 — REPORT

- 판정: **구현 BLOCKED** — 새 P1 1건(Codex r3, QA 확인) + 새 P2 1건(QA). 지시대로 설계·코드는 고치지 않았다.
- 대상: base `93f8111` · head `f9feeef`(SPEC-3 r0.2). 2026-10-13. 책임 QA(Orca Claude Code). 서브에이전트 0.
- 이 게이트는 설계 문서 검토만이다. **예산(ADR-004)·runtime·브라우저·테스트·코드 검증은 실행하지 않았다.**
- 이 검토가 PASS였더라도 구현 승인을 대신하지 않는다. MQ-3-4 "경고 없음" 선택은 처음 근거(무손실)가 틀렸으므로 **사용자 재확인 대기**다.

## 1. 산출물
| 파일 | 내용 |
|---|---|
| `QA-JUDGMENT.md` | QA 독립 판단 — Codex r3 출력 열람 **전** 기록 |
| `codex-r3.txt` | Codex r3 원문(진행 로그 + 결과). `.txt`라 `.gitignore`의 `*.log`에 걸리지 않음(확인) |
| `codex-r3.started` | r3 시작 시각(2026-10-13 01:47:14) |
| `REPORT.md` | 이 파일 |

실행 명령(1회, help 미실행):
`node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs adversarial-review --scope branch --base 93f8111 "<r2 반영분 집중 문장>"` → exit 후 결과 `needs-attention`.
순서 고지: 시간 예산 때문에 r3를 QA 판단 작성 전에 백그라운드로 시작했다. 출력은 QA-JUDGMENT.md를 저장한 뒤에 열었다.

## 2. 과제 1 — 기억 삭제·링크 복원의 정직성 (코드 대조)
- **same-key replay → STALE/DOC_EXISTS 안 남 추론: 성립(L1, 이 탭 범위).** 재생 `memoryDocBook.ts:374-376`이 판정 `:384-386`보다 앞이고, `state.starts` 쓰기는 `:403` 1곳(초기 `:169`), 다른 `state =` 대입은 모두 `...state`로 보존, DocBook은 저장소당 1개(`memoryProjectRepository.ts:61`). 전제 "기억이 있는 동안 다른 start 없음"은 `restartFlow.ts:43-44`가 진입을 막는 데 기대며, 구현 때 RS3-AC-07d로 고정해야 한다.
- **r2 실패 경로 3개**: P1-a(처음 요청 거짓 음성)·P2(R-E5 고착)는 6절 3-1/3-2로 설계상 닫힘. P1-b(무손실 단정)는 RS3-R1 안전 경고로 정직하게 교정됨 — 위험 자체는 남음(MQ-3-1 B 전까지).
- **R-E6/C-E6 표현**: "확인하지 못했을 수 있습니다"는 거짓이 아니다. 그러나 행동 지시가 실행 불가능하다 → QA-1(아래).
- 다른 탭 writer 개입 시 STALE 추론, P-U6 알림 수명: **미확인**(이 탭 범위 밖 / 미구현).

## 3. 새 지적

### F1 [P1 · Codex r3 · QA 확인 L1] create 재시도의 before 재조회가 미확인 기억을 지운다
- SPEC-3 5.1(`:133-135`)은 "create 직전 before를 읽고, before가 문서면 음성 → 기억 삭제"이고, 재시도도 "같은 판정 순서를 다시 탄다"(`:153`). C-E4(처음 create 커밋 뒤 flush 실패) 재시도 시 before에는 이미 그 문서가 있다 → 같은 키 재생(`memoryDocBook.ts:374-376`) 뒤 flush가 또 실패하면 5.1대로는 **음성 → 기억 삭제 → 링크 복원**. 6절 3-1(`:191`, create 음성 = `before === undefined && now === undefined`)과 모순이고, 기억 값 `{mode, projectId, version, selected}`에는 처음 before가 없다.
- 사용자 결과: 영속 확인 없는 문서가 미확인 안내 없이 열리고, 새로고침 시 그 문서와 후속 편집이 사라질 수 있다.
- QA 독립 판단에서는 **놓쳤다**(QA-JUDGMENT에 없음). r3 출력을 본 뒤 SPEC 행을 직접 대조해 확인했다.

### F2 [P2 · QA 단독] R-E6/C-E6 복구 지시 "편집기에서 한 번 저장하면 확인됩니다"를 따를 수단이 없다
- 편집기는 `idle`로 시작(`useAutosaveScheduler.ts:59`), 저장은 편집(dirty)에서만 일어나고 수동 저장 버튼이 없다. "다시 저장"은 실패 때만 보인다(`SaveStatus.tsx:20,58-59`).
- 경로 ②(그 사이 편집이 commit 뒤 실패)에서 R-E6/C-E6는 기억을 지워 `/projects` 게이트를 없애고, 편집기는 상태 글자·떠나기 경고 없이 열린다 → 사용자가 새로고침하면 메모리에만 있던 그 사이 편집이 소실. 이 경로는 SPEC 5.3 "남는 경로" 표에도 없다(RS3-R1은 history 재진입만).
- Codex r3는 이 지적을 내지 않았다.

## 4. QA ↔ Codex 불일치 정리
| 항목 | QA | Codex r3 | 근거 | 미확인 |
|---|---|---|---|---|
| F1 create 재시도 before | 독립 판단에서 놓침 → 대조 후 동의 | P1 | SPEC `:133-135`·`:153` vs `:191` 문서 모순(L1) | 구현 없음 — 실제 동작은 구현 선택에 달림 |
| F2 R-E6/C-E6 지시 실행 불가 | P2 | 지적 없음 | `useAutosaveScheduler.ts:59`·`SaveStatus.tsx:58-59`(L1) | 알림 수명·문구 최종본 |
| same-key STALE 추론 | 성립 | 반론 없음(재생 경로를 근거로 인용) | `memoryDocBook.ts:374-386,403` | 다른 탭 writer |

## 5. 사용자 결정 필요 (MQ-3-4 재확인)
새로고침은 **이전 IDB 문서만 보존**한다. 저장이 확인되지 않은 새 문서(create)·새로 시작(restart)과 그 뒤 편집은 사라질 수 있다. 그래서 다음 중 하나를 다시 골라야 한다.
1. **경고 없음 유지(MQ-3-4 A)**: 위 손실을 "남는 경로"로 받아들인다. 필요 조건 — SPEC 5.3에 R-E6/C-E6 게이트 해제 뒤 경로(F2)를 추가하고, P-U5·R-E6/C-E6 문구가 "새로고침하면 저장 안 된 편집이 사라질 수 있음"과 **실행 가능한** 확인 방법을 말해야 한다(현재 "한 번 저장"은 수단이 없음).
2. **이탈 보호 확장**: 미확인 기억이 있는 동안 `/projects`·프로필에도 `beforeunload` 가드를 둔다(또는 MQ-3-1 B — 편집기 인계). 필요 조건 — `/studio`·진입 청크 바이트 영향이 있을 수 있어 ADR-004 예산 실측과 MQ 재상신이 먼저다(판정선 수정 금지).
어느 쪽이든 F1(5.1 ↔ 6절 3-1 모순)은 설계 교정이 먼저다.

## 6. 증거
- `git diff --stat 93f8111..HEAD -- app` = 출력 없음(앱 변경 0). 이 레인 커밋도 `dev/active/rs23-spec/final-gate/` + `PROGRESS.md`만.
- `git diff --check` (staged) = 출력 없음 — 커밋 전 실행 결과는 커밋 메시지 직전 기록과 같다.
- `*.log`는 `.gitignore`에 있다. 원문은 `.txt`로 저장해 커밋된다.
