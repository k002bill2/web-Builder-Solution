# RS23-SPEC REPORT — B-RS-02 · B-RS-03 상태/복구 설계

- 레인: Designer · worktree `rs23-fix` · branch `k002bill2/rs23-fix` · base `93f8111` · **앱 코드 변경 0**(문서만).
- 산출물: `docs/design/restart/SPEC-3.md`(r0.2) · `docs/design/restart/MQ-3.md` · 이 REPORT · `PROGRESS.md`.

## 0. 결론

1. **B-RS-02**: create도 커밋 전에 기존 `guardWrite()`를 부른다. 단 메모리에 문서가 없을 때만이다(★ MQ-3-2 A · Codex r1 P2).
   - 잠금 소유자는 탭당 `LocalSync` gate 하나다. 흐름별 `tryLock`·`held`는 없다.
   - 거절되면 메모리와 IDB 둘 다 변화 0이다.
   - 커밋 뒤 실패(flush INFRA·응답 단계)는 restart와 같은 "커밋 확인 → 사유" 순서로 미확인(C-E4)·확인 불가(C-E5)·사유별 거절(C-E2/2b/2c/3)로 나눈다(★ MQ-3-3 A).
2. **B-RS-03**: 미확인 기억을 의존성 없는 탭 메모리 모듈로 옮긴다. `/projects` 행이 그 기억을 읽어 "편집기 열기" 대신 "저장 다시 시도"(같은 인자 `startDoc` 재생)를 보여 준다(★ MQ-3-1 A, `/studio` 진입 0B).
   - 편집기 진입 인계(B)는 `/studio` 예산 상향이 필요해 결정 질문으로 남겼다.
3. **영속 판정**: 미확인 상태는 메모리 전달로 충분하다. 새로고침하면 메모리가 IDB로 돌아가 상태가 일치하므로 기록할 대상이 없다. **안전 경고(r2 P1-b)**: 일치는 보존이 아니다 — 이전 IDB 문서는 보존되지만, 저장을 확인하지 못한 새 문서·새로 시작·후속 편집은 사라질 수 있다. 무손실은 보장하지 않는다. 새 스키마·저장소 인터페이스·엔진 계약·의존성·백엔드가 모두 0이다. 예산 상향은 ★안에서 0이다.
4. **예산 precondition**: 구현 전에 스파이크 2개로 `/studio` 129.87→판정선 129.90 · 복원 132.91→132.94, `/profile`, `/projects`를 실측한다. 넘으면 감량 1회 뒤 멈추고 재상신한다. 판정선은 수정하지 않는다.

## 1. 결정 (MQ-3 — 확정)

| ID | 확정 | 조건·남는 것 |
|---|---|---|
| MQ-3-1 | **A** `/projects` 행 게이트(`/studio` 0B) | history 뒤로/앞으로 재진입(RS3-R1)은 **미해결**로 남김 |
| MQ-3-2 | **A** create 가드 — 메모리에 문서 없을 때만, `restartLock.test.ts:136-142` 유지 | 허용된 유일한 내부 변경(가드 순서) |
| MQ-3-3 | **A** 커밋 확인 → 사유 | r2로 음성 판정 축소·STALE 분리 추가(RS3-D6) |
| MQ-3-4 | **A** 경고 없음 | 근거 정정(후속 편집 손실 포함) → **2026-10-15 사용자 재확인 A** |

- 결정 주체: Jarvis — 사용자 1→2→3(B-RS-02·03 착수) 승인과 ★안 자동 진행 위임에 따름(RESUME-REVIEW).
- 조건: 새 스키마·엔진/저장소 인터페이스·의존성·백엔드·예산 상향 0. 기록 위치 `MQ-3.md` 결정 기록.

## 2. 원인 trace 통합 (서브에이전트 결과 · 메인 재확인)

| 조사 | 방식 | 결과 | 메인 재확인 |
|---|---|---|---|
| RS02 | Explore 읽기 전용(19 tool) | create 잠금 확인 없음(`memoryProjectRepository.ts:121-122`) · 응답 단계 실패 = flush 0회(`:66,79-81`) · 같은 안·다른 버전 `DOC_EXISTS`로 IDB에 없는 문서 편집기 진입 · stale에도 일반 문장 + 다시 시도 · `restartLock.test.ts:136`이 지금 동작 고정 | `memoryProjectRepository.ts`·`localSync.ts`·`writerLock.ts`·`infra.ts`·`restartFlow.ts` 직접 판독 — 일치 |
| RS03 | Explore 읽기 전용(30 tool) | 기억 = `restartFlow.ts:28-35` WeakMap(저장소 인스턴스 키) · `/projects`는 메모리 요약 + state 없는 링크 · 편집기 `idle` 시작(경고·`leave` 없음) · 편집 저장·복원·내보내기가 레코드 전체 flush로 확정 · 큐 `status`는 인터페이스 밖 | `RestartDialog.tsx`·`useDocSave.ts`·`saveStatusText.ts`·`memoryDocBook.ts:353-367`·`check-bundle-size.mjs` 직접 판독 — 일치 |
| advisor | 방향 점검 | B-RS-03 ★를 `/studio` 0B 안으로(예산 여유 30B) · 앱 안 `/studio` 진입 경로 표 · `tabLockHold` 재진입 확인 · 기존 단언 교체 허용 명시 · create 커밋 확인 | 전부 반영(SPEC-3 2.3·3·5·7) |

원래 계약 vs 구현: 현재 구현은 SPEC r2와 일치한다(create는 MQ-S2 C로 의도적 제외, RS-R7은 BACKLOG 후보). 따라서 이번 변경은 계약 위반 수정이 아니라 **승인이 필요한 범위 확장**이다(SPEC-3 2.4).

## 3. 목업과 다르게 한 곳
- 목업(design/)에는 미확인 상태 화면이 없다. ADR-003 우선순위(기능·흐름 → 사용성 → DS 일관성)에 따라 기존 Callout·행 버튼 관례를 썼다.

## 4. Codex 적대검토
- r1(`node codex-companion.mjs adversarial-review --scope branch --base 93f8111`, 원문 `logs/codex-r1.txt`): **needs-attention · P1 1 · P2 1 — 둘 다 반영(SPEC-3 r0.1)**.
  - [P1] 기억 재시도 음성 판정이 revision+1만 양성으로 봐서, 후속 편집(quota 실패)으로 revision이 앞선 미확인을 "반영 안 됨"으로 풀어 버린다. → 음성은 "요청 전 상태 그대로"일 때만으로 좁힌다(6절 3-1). RS3-AC-07b 추가. 이 판정은 기존 `restartFlow.committed()`의 재시도 경로도 고친다.
  - [P2] 조건 제거만 하면 가드가 `DOC_EXISTS`보다 앞서, 다른 탭 writer일 때 저장된 문서 열기·F4 진입이 막힌다. → 가드는 메모리에 문서가 없을 때만 건다(3절 4). `restartLock.test.ts:136-142`는 유지한다(RS3-AC-02). RS3-D5를 정정했다.
- 자체 점검(r1 전후): create 커밋 확인 before 읽기(거짓 양성 0 — RS3-AC-05) · P-U4 create 문형.
- r2(`node codex-companion.mjs adversarial-review --scope branch --base 93f8111 "<r1 반영분 집중>"`, 원문 `logs/codex-r2.txt`, 대상 = r0.1 커밋본): **needs-attention · P1 2 · P2 1 — 셋 다 SPEC만 교정(r0.2). 계약·예산 변경 0.**
  - [P1-a] 처음 요청도 후속 revision으로 거짓 음성 → 기억이 안 생김. → 음성은 처음 요청에도 "요청 전 그대로"만(6절 3-1). 처음 요청 `STALE_DOC`은 커밋 확인 앞에서 분리해 SPEC r2 R-E1/R-E1b 유지(6절 3-2). RS3-AC-07c · RS3-D6.
  - [P1-b] 새로고침 안내가 후속 편집 손실을 숨김. → 무손실 단정 삭제, 안전 경고 명시(0절 6 · 2.3 · 4절 · P-U5 · RS3-R1·R4 · RS3-AC-08 · MQ-3-1 A · MQ-3-4). RS3-AC-08b.
  - [P2] R-E5 커밋 전 실패 + 후속 편집 → 옛 `expectedRevision` 재시도가 `STALE_DOC`로 영구 고착. → 기억이 있는 재시도가 `STALE_DOC`(create는 `DOC_EXISTS`)로 끝나면 종결 R-E6/C-E6(기억 삭제·링크 복원·"저장을 확인하지 못했을 수 있음" 경고). 근거 L1: `state.starts`는 start 커밋(`memoryDocBook.ts:403`)에서만 쓰이고 같은 키 재생(`:374-376`)이 판정보다 앞이다. Codex 제안의 확인 저장(같은 내용 `saveDoc`)은 새 쓰기(revision 증가·다른 탭 stale 신호)라 채택하지 않음. RS3-AC-07d.
  - **r0.2 반영분은 Codex 미재검토**(r3 자동 실행 금지 — RESUME-REVIEW).
- 부수 실행 1회(r2 아님): 사용법 확인용 `adversarial-review --help`가 옵션을 무시하고 working-tree 리뷰를 한 번 실행했다(대상 = 미추적 RESUME-REVIEW.md 1개, approve, 지적 0). 판정에 쓰지 않았다.

## 4.1 남은 게이트 (Developer 착수 전)
1. **Codex r3**(r0.2 반영분 6절 3-1·3-2, RS3-AC-07c·07d·08b) — 사용자/Jarvis가 트리거. 자동 실행 금지.
2. ~~MQ-3-4 근거 정정 재확인~~ — 완료(2026-10-15 사용자 A).
3. **Developer precondition**: ① 예산 스파이크 2개(9절 — `/studio` ≤129.90 · 복원 ≤132.94 · `/profile` 100/125 · `/projects`) ② `STALE_DOC` 재시도 = 커밋 0 추론 테스트(같은 키 재생이면 STALE 안 남) ③ r2 시나리오 3개(RS3-AC-07c·07d·08b) RED 먼저.
4. 남는 위험(미해결 확정): history 재진입(RS3-R1) · 새로고침 시 저장 미확인 편집 손실(안전 경고로 밝힘).

## 5. 검증
- 코드 변경 0 → typecheck·lint·test·build 게이트 대상 없음. `git diff 93f8111 -- app/ | wc -l` = **0**(실행 확인).
