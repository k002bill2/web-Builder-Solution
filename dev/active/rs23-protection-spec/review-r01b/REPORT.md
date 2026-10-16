# SPEC-4 r0.1b 독립 재검토 — REPORT

- **판정: 구현 BLOCKED** — 새 P1 1건(Codex a2), 새 P2 2건(Codex a2 1건 · 메인 Q-1 1건). 지시 범위가 재검토였으므로 SPEC은 고치지 않았다.
- 검토 대상: base `d71c852`(r0) → head `88d0b3e`(r0.1 + r0.1b + MQ-4 결정). 앱 `93f8111`은 읽기 전용으로 대조했다. 2026-10-15.
- 실행 명령(1회, help 실행 없음): `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs adversarial-review --scope branch --base d71c852 "<r0.1/r0.1b 집중>"`. 결과는 needs-attention이다. 원문은 `codex-a2.txt`, 시작 시각은 `codex-a2.started`에 있다.
- 메인 판단은 Codex 출력을 열기 전에 `QA-JUDGMENT.md`에 기록했다.
- 실행하지 않은 것: 예산 빌드, 테스트, runtime·브라우저 검증.

## 1. r0.1 지적 3건 (a1)
| a1 지적 | 상태 |
|---|---|
| P1-1 offline·dirty 편집에 거짓 "확인" | 닫힘. 단 `PendingDraft`가 새 결함 N1·N2·N3을 만들었다 |
| P1-2 확인 중 편집을 saved로 덮음 | phase 쪽은 닫힘. 기억 해제 쪽은 N1로 다시 열림 |
| P2 origin unknown 표현 불가 | 닫힘. F-6b 근거를 L1로 확인했다(메모리 문서 삭제 경로 0) |

## 2. 새 지적
### N1 [P1 · Codex a2] 늦게 끝난 "저장 확인"이 새로 보존한 draft를 지운다
- 발생 순서:
  1. 편집기에서 "저장 확인"을 제출한다.
  2. 확인이 끝나기 전에 새 편집을 한다.
  3. 디바운스가 끝나기 전에 POP한다. cleanup이 최신 내용을 `PendingDraft`로 보존한다.
  4. 앞서 제출한 확인이 resolve되면서 `release(repo, projectId)`를 부른다.
- 원인: `release`는 기억 세대를 보지 않는다(SPEC-4 3.2). 그래서 4단계에서 draft가 지워진다.
- 결과: 저장되지 않은 내용과 이미지, 모듈 경고가 함께 사라진다. "draft는 재진입 후 실제 저장으로만 해제한다"는 SPEC-4 3.1 규칙과도 모순된다.
- 교정 방향: 해제할 때 요청 당시 기억 세대(토큰)를 같이 넘긴다. 지금 기억이 새 draft로 바뀌었으면 지우지 않고, 확인된 `under`만 정리한다.

### N2 [P2 · Codex a2] stale draft로 재진입하면 충돌 선택 없이 자동으로 덮어쓴다
- SPEC 3.3-5는 stale draft를 재진입 때 충돌 선택으로 다시 보여 준다고 쓴다.
- 그런데 같은 절의 복원 절차는 모든 draft를 같은 방식으로 처리한다. 최신 `getDoc` 위에 첫 `edit()`로 얹는다.
- 그러면 expectedRevision이 최신 값과 같아져 `STALE_DOC` 검사(`memoryDocBook.ts:363`)를 통과한다. 내 편집이 최신 문서를 덮고, `resolveConflict`가 만드는 보존 스냅샷도 생기지 않는다.
- 교정 방향: draft에 충돌 상태(`stale` + 그때의 최신 doc)를 보관한다. stale draft는 stale 상태로 복원해 자동 저장을 막고, 사용자가 고른 뒤 `resolveConflict`로만 저장한다.

### N3 [P2 · 메인 Q-1] `saving` 중 POP 직후 재진입하면 자기 저장과 거짓 충돌이 난다
- 발생 순서:
  1. 저장 중(`saving`)에 POP한다.
  2. 진행 중이던 저장이 커밋되기 전에 재진입한다. `getDoc`은 아직 r을 돌려준다.
  3. 그 뒤 진행 중이던 저장이 커밋되어 메모리는 r+1이 된다.
  4. 새 편집기가 expected r로 저장하고, 해시가 다르므로 `STALE_DOC`이 난다. 사용자는 자기 직전 저장을 "다른 편집"으로 보는 충돌 화면을 받는다.
- 원인: `local.base`(`localSync.ts:193-196`)는 이 경우를 덮지 못한다.
- 교정 방향: draft에 진행 중 저장의 promise를 보관한다. 재진입은 그 promise가 끝난 뒤 `getDoc`을 읽는다.
- Codex a2는 이 지적을 내지 않았다.

### 관찰 (결함 아님 — 구현 메모)
- Q-2: draft의 `images`는 컴포넌트 state(`StudioLayout.tsx:308`)에서 가져와야 한다. 저장소 맵(`memoryProjectRepository.ts:148` cleanup)을 쓰면 effect 정리 순서에 따라 이미 지워졌을 수 있다.
- Q-3: stale 탭의 draft 문구는 "편집기에서 이어 저장"이 아니라 새로고침 안내 계열이어야 한다. N2와 함께 고치면 된다.

## 3. 영향 범위
- 세 결함 모두 **CP4(편집기 인계·`PendingDraft`)** 안에 있다.
- CP1~3(기억 모듈·보호·프로필 판정·`/projects` 행)의 판정표 F-1~F-10과 R-1~R-5·R-4u에서는 새 지적이 없다.
- 그래도 SPEC은 하나이므로 r0.2 교정과 검토를 마치기 전에는 구현을 시작하지 않는다.

## 4. 다음 (사용자 결정)
1. **r0.2 교정 레인**: N1~N3을 SPEC-4에 한 번 반영한다. 그다음 Codex 적대검토를 1회 돌린다. 이것이 SPEC-4의 3라운드이고, 전역 규칙의 상한이다.
2. 또는 CP4를 분리한다. CP1~3만 별도 SPEC 범위로 확정해 측정 관문을 먼저 진행하고, CP4는 r0.2 뒤에 다룬다.
- 권장은 1이다. 세 결함의 교정 방향이 정해져 있어 문서 수정 범위가 작다.
