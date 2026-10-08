# P1D-L2 PROGRESS — 스냅샷 수동 삭제 UI + 자동 스냅샷 20개 보존

base `557fe35` · 브랜치 `k002bill2/p1d-l2` · 서브에이전트 0(브리프 금지)

## 체크리스트
- [x] BRIEF P0 커밋 (`ec533bf`)
- [x] RED 테스트 작성 + RED 확인(커밋 안 함)
- [x] memoryDocBook 자동 append+정리 공용 헬퍼(4곳 · 복원 예외 · 이행 · snapshotSeq 상향) — `45506b6`
- [x] SnapshotDialog 삭제 버튼 · 확인 대화상자 · SN 문구 · 캡션 · 포커스 — `45506b6`
- [x] SnapshotLayer onDeleted(onNotice · refresh) — `45506b6`
- [x] 구현 첫 커밋 → build 번들 관문(/studio ≤129.65 · 복원 ≤132.68 · /profile ≤100) — 129.65 · 132.68 · 99.86, build exit 0 (재개 세션에서 실측 — 중단 전 미측정)
- [x] typecheck · lint · build · 전체 vitest exit 0 (279 files · 2436 tests)
- [x] Ego Lite 실측(build + preview 4337) + shots 3장 + 정리(deleteDatabase success · finish(28) · listTaskSpaces · 73837 종료 · 4337 리슨 0)
- [x] REPORT.md

## TDD 예측 → 실측
| 테스트 | 예측 RED 원인 | 실측 |
|---|---|---|
| `data/autoSnapshotRetention.test.ts` 4 reason · 복원 예외 · 수동 30 | 정리 없음 → 자동 21개(길이 단언 실패) · 19+1=20 케이스는 통과 | 6 실패 / 1 통과 — "length 20 but got 21" · 복원 예외 = snapshot-3 남음 ✅ 예측대로 |
| `data/persistence/autoSnapshotPersist.test.ts` 25개 이행 · 20+1 | 열기 쓰기 0·write 1회는 통과, delete op 0 · 자동 목록 그대로 | 2 실패 — `expected [] to deeply equal [delete]` · 목록 snapshot-1 남음 ✅ (첫 시도는 테스트 결함: 같은 이미지 슬롯에 두 번 set → 수정) |
| `components/studio/SnapshotDelete.test.tsx` | "{이름} 삭제" 버튼·캡션 없음 → findByRole/getByText 실패 전부 | 실측 RED 출력 기록 누락(중단 전 세션) — 현재 GREEN만 확인 |

## Codex r1 수정 레인 (2026-10-08 · `codex-r1-jarvis.txt` P2 1건)
- [x] RED 예측 → 실측(아래 표) · RED 단독 커밋 0
- [x] SnapshotDialog: 삭제 확인 진입을 기존 `busy` ref로 직렬화(`ask`/`settle`) — 저장·미리보기 진행 중이면 열지 않음 · 확인 열린 동안(지우는 중 포함) 저장·미리보기 진입 0
- [x] typecheck · lint · build · 전체 vitest exit 0 (279 files · 2438 tests)
- [x] 번들 관문: /studio 129.648 ≤129.65 · 복원 132.681 ≤132.68(표기) · /profile 99.869 ≤100
- [x] REPORT "Codex r1 수정" 절

| 테스트 | 예측 RED 원인 | 실측 |
|---|---|---|
| 미저장 → '미리보기' flush 대기 중 '삭제' = 확인 열림 0 · 삭제 0 | 삭제 버튼이 busy 미확인 → 확인 대화상자가 열려 첫 `confirmGone` 실패 | 예측대로 — `confirmGone`(테스트 202행)에서 확인 dialog 발견 |
| 지우는 중 '미리보기'·'지금 상태 저장' = 진입 0 | 확인 열림을 preview가 모름 → 미저장 변경 없으니 flushed 즉시 true → 미리보기 열림 | 예측대로 — "스냅샷 '수동 1'를 보고 있습니다" h3 존재로 실패 |
- 기록 주의: 예측은 RED 실행 전에 세웠지만 이 표에는 실행 뒤 적었다(작성 순서 위반 1건).
