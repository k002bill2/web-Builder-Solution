# P1D-L2 PROGRESS — 스냅샷 수동 삭제 UI + 자동 스냅샷 20개 보존

base `557fe35` · 브랜치 `k002bill2/p1d-l2` · 서브에이전트 0(브리프 금지)

## 체크리스트
- [x] BRIEF P0 커밋 (`ec533bf`)
- [x] RED 테스트 작성 + RED 확인(커밋 안 함)
- [ ] memoryDocBook 자동 append+정리 공용 헬퍼(4곳 · 복원 예외 · 이행 · snapshotSeq 상향)
- [ ] SnapshotDialog 삭제 버튼 · 확인 대화상자 · SN 문구 · 캡션 · 포커스
- [ ] SnapshotLayer onDeleted(onNotice · refresh)
- [ ] 구현 첫 커밋 → 즉시 build 번들 관문(/studio ≤129.65 · 복원 ≤132.68 · /profile ≤100)
- [ ] typecheck · lint · build · 전체 vitest exit 0
- [ ] Ego Lite 실측(build + preview 4337) + shots ≤4 + 정리(deleteDatabase · finish · listTaskSpaces · 서버 종료)
- [ ] REPORT.md

## TDD 예측 → 실측
| 테스트 | 예측 RED 원인 | 실측 |
|---|---|---|
| `data/autoSnapshotRetention.test.ts` 4 reason · 복원 예외 · 수동 30 | 정리 없음 → 자동 21개(길이 단언 실패) · 19+1=20 케이스는 통과 | 6 실패 / 1 통과 — "length 20 but got 21" · 복원 예외 = snapshot-3 남음 ✅ 예측대로 |
| `data/persistence/autoSnapshotPersist.test.ts` 25개 이행 · 20+1 | 열기 쓰기 0·write 1회는 통과, delete op 0 · 자동 목록 그대로 | 2 실패 — `expected [] to deeply equal [delete]` · 목록 snapshot-1 남음 ✅ (첫 시도는 테스트 결함: 같은 이미지 슬롯에 두 번 set → 수정) |
| `components/studio/SnapshotDelete.test.tsx` | "{이름} 삭제" 버튼·캡션 없음 → findByRole/getByText 실패 전부 | (아래 갱신) |
