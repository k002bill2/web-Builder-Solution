# P2-L3 PROGRESS — 프로젝트 파일 가져오기

- [x] P0 BRIEF 커밋
- [ ] 정본 읽기 (P2-SPEC 머리·3.1·3.5·4.2·IM·FX-1·I-S07·6·7·8절 L3, p2-l1 REPORT, deleteProject·tabLockHold)
- [ ] RED 예측 기록 + RED 확인 (AC-P02 쓰기 0 · AC-P06 abort · Quota IM-11)
- [ ] writeImport.ts + 테스트
- [ ] ImportProjectFileDialog(+Slot) + 테스트
- [ ] BrowserStorageSection 버튼·hidden input + 테스트
- [ ] FX-1 (ClearDataDialog·DeleteProjectDialog) · IM-9 상수(dialogText)
- [ ] 배선 첫 커밋 직후 build 번들 실측
- [ ] ProjectsPage(IM-15·키·포커스) = 마지막 커밋
- [ ] Ego Lite ①~⑤ + 정리
- [ ] 게이트 typecheck·lint·build·vitest
- [ ] REPORT

## RED 예측 (R1 — writeImport·대화상자)
- writeImport.test: 모듈 없음 → import 실패로 파일 전체 FAIL (AC-P06 abort·Quota=IM-11·IM-8·IM-9 포함)
- ImportProjectFileDialog.test: 모듈 없음 → 파일 전체 FAIL (AC-P02 손상 파일 = IM-2 + factory.open 호출 0 포함)
