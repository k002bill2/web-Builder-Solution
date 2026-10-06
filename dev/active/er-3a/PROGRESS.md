# ER-3a PROGRESS — 스냅샷·충돌 저장소 메모리 구현

base `9d817bd` · 브랜치 `k002bill2/er-3a` · 서브에이전트 0

- [x] P0 BRIEF 명시 커밋
- [x] 기준선 빌드 `logs/build-base.txt`: /studio 진입 127.05 · 첫 91.75 · /projects 진입 100.29 · /profile 119.10 · /compare 121.69 · /catalog 102.03 · /references 99.38
- [x] 단계 1 createSnapshot(ER-AC-S1) — **예측: 새 테스트 5개 RED**(memoryProjectRepository.test 4 · memoryExport.test 1, 모두 NOT_FOUND/missing로 실패) → RED 5/5(`logs/red-s1.txt`) → GREEN 35/35 · 게이트(표적+src/test 112 · tc · lint · build `logs/build-s1c.txt`) · 번들 /studio 127.09(+0.04) · /projects 100.33(+0.04 — nameLength 공유 import 제거·위임 1개로 0.07→0.04, 최종 단계에서 재판정)
- [x] 단계 2 restoreSnapshot(ER-AC-S2) — **예측: 새 테스트 4개 RED**(memoryProjectRepository.test, 모두 missing NOT_FOUND·SCHEMA 불일치로 실패) — 예측 커밋 → RED 4/4(`logs/red-s2.txt`) → GREEN · 게이트(표적+src/test 116 · tc · lint · build `logs/build-s2.txt`) · 번들 /studio 127.09 · /projects 100.32
- [ ] 단계 3 resolveConflict(ER-AC-S5 · B-ER-02) — **예측: 새 테스트 4개 RED**(memoryProjectRepository.test 3 · memoryExport.test 1 번호열) — 예측 커밋 → RED → GREEN
- [x] 단계 4 내보내기 스냅샷 순서 — 단계 1(수동↔내보내기)·단계 3(복원·충돌 포함)에 접어 넣음
- [ ] 전체 vitest exit 0
- [ ] Codex review --scope branch --base 9d817bd (≤2)
- [ ] REPORT.md
