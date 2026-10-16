# SPEC-4 r0.1b 독립 재검토 — 메인 판단 (Codex a2 출력 열람 전 기록)

- 대상: base `d71c852`(r0) → head `88d0b3e`(r0.1 + r0.1b + MQ-4 결정). 앱 `93f8111` 읽기 전용. 2026-10-15.
- 순서: Codex a2를 백그라운드로 먼저 시작했고, 출력은 이 파일을 저장한 뒤 열었다.
- 한계: 작성자(메인)가 직접 하는 재검토라 독립성이 약하다. 독립 근거는 Codex a2가 맡는다.

## 1. r0.1 지적 3건의 닫힘

| 지적 | r0.1/r0.1b 교정 | 판단 |
|---|---|---|
| Codex a1 P1-1 offline·dirty 편집 거짓 확인 | `PendingDraft`(내용·이미지 보관 → 재진입 저장으로만 해제) | 설계상 닫힘. 아래 Q-1은 경쟁 조건으로 남음 |
| Codex a1 P1-2 확인 중 편집 → saved 덮음 | 확인 시작 때 스케줄러 version을 기록하고 resolve 때 비교 | 닫힘 |
| Codex a1 P2 origin unknown 표현 불가 | `Origin.unknown` · F-6/F-6b · R-4u | 닫힘. F-6b 근거 L1 확인: `memoryDocBook.ts`·`memoryProjectRepository.ts`에 메모리 문서 삭제 경로 0(grep — `maps.delete`는 이미지 맵뿐) |

## 2. 새 의심 (메인)

### Q-1 [P2 후보] `saving` 중 POP하고 곧바로 재진입하면, 자기 저장과 거짓 충돌이 남는다

r0.1b는 재진입 때 메모리 `getDoc`을 읽고, draft 내용을 첫 `edit()`로 얹는다. 이렇게 해서 dispose 뒤에 커밋된 자기 저장과의 충돌을 피한다. 하지만 이 방법은 **재진입 시점에 진행 중이던 저장이 이미 커밋됐을 때만** 맞다.

1. POP한 뒤, 이전 저장의 request 단계가 끝나기 전에 앞으로가기로 재진입한다.
2. `getDoc`은 아직 r을 돌려준다.
3. 이전 저장이 커밋되어 메모리는 r+1이 된다.
4. 새 편집기가 expected r로 저장한다. 해시가 다르므로 `STALE_DOC`이 나고 충돌 화면이 뜬다.

- 근거: `memoryDocBook.ts:363`.
- `local.base`가 revision을 끌어올리는 조건(`localSync.ts:193-196` — unconfirmed + submitted가 같을 때)은 이 경우를 덮지 못한다.
- 완화 후보: draft에 "진행 중 저장 promise"를 함께 보관하고, 재진입 때 그 promise가 끝난 뒤 `getDoc`을 읽는다.

### Q-2 [P3] 언마운트 cleanup 순서

draft의 `images`는 컴포넌트 state(`StudioLayout.tsx:308`)에서 가져와야 한다. 저장소 맵을 쓰면 안 되는데, `maps.delete`(`memoryProjectRepository.ts:148`)가 effect cleanup 순서에 따라 먼저 실행될 수 있기 때문이다. 지금 SPEC은 "이미지 맵 항목을 함께 보관"이라고만 적고 어디서 가져오는지는 정하지 않았다. 구현 때 명시해야 한다.

### Q-3 [관찰] stale 탭의 draft

stale 탭은 쓰기가 영구히 거절된다. 그래서 이 탭의 draft는 폐기로만 끝난다. 이 동작은 정직하지만, 문구는 "편집기에서 이어 저장"이 아니라 C-E2b 계열(새로고침 안내)이어야 한다. 지금 SPEC 5.1의 `PendingDraft` 문구는 원인을 가르지 않는다.

## 3. 판단
- 새 P1: 0건(메인 판단).
- P2 후보: Q-1 1건. 구현 전에 SPEC에서 경쟁 조건 규칙을 정해야 한다.
- 메인 판단은 Codex a2와 대조해 REPORT에 정리한다.
