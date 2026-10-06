# ER-3a PROGRESS — 스냅샷·충돌 저장소 메모리 구현

base `9d817bd` · 브랜치 `k002bill2/er-3a` · 서브에이전트 0

- [x] P0 BRIEF 명시 커밋
- [x] 기준선 빌드 `logs/build-base.txt`: /studio 진입 127.05 · 첫 91.75 · /projects 진입 100.29 · /profile 119.10 · /compare 121.69 · /catalog 102.03 · /references 99.38
- [ ] 단계 1 createSnapshot(ER-AC-S1) — **예측: 새 테스트 5개 RED**(memoryProjectRepository.test 4 · memoryExport.test 1, 모두 NOT_FOUND/missing로 실패) → RED → GREEN
- [ ] 단계 2 restoreSnapshot(ER-AC-S2) — 예측 커밋 → RED → GREEN
- [ ] 단계 3 resolveConflict(ER-AC-S5 · B-ER-02) — 예측 커밋 → RED → GREEN
- [ ] 단계 4 내보내기 스냅샷 순서(memoryExport.test) — 예측 → RED/GREEN
- [ ] 전체 vitest exit 0
- [ ] Codex review --scope branch --base 9d817bd (≤2)
- [ ] REPORT.md
