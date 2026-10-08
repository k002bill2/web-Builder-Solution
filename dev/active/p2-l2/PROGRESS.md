# P2-L2 PROGRESS — 프로젝트 "파일로 내보내기"

- [x] P0 BRIEF·PROGRESS 커밋
- [x] 정본 읽기 (P2-SPEC 머리·1.2·1.3·3.6·4.1·EX·6·7·8절 L2, p2-l1 REPORT, DeleteProjectDialog·Slot)
- [ ] readProject.ts (readonly 한 트랜잭션) — RED 예측 → RED → GREEN
- [ ] ExportProjectFileDialog(+Slot) — RED 예측 → RED → GREEN
- [ ] ProjectRow 버튼(data-export-for, 삭제 앞) · ProjectList onExport · ProjectsPage Slot·EX-9 — RED → GREEN
- [ ] 배선 첫 커밋 직후 build 번들 실측 (/profile ≤100, /studio ≤129.65)
- [ ] 구현 커밋
- [ ] Ego Lite (build+preview 4337, 내려받기·파일명·JSON·EX-9·Esc 포커스, 정리)
- [ ] 게이트: typecheck·lint·build·전체 vitest exit 0
- [ ] REPORT.md

## TDD RED 예측
- R1 `readProject.test.ts`: 모듈 없음 → 파일 import 실패(전체 FAIL).
- R2 `ExportProjectFileDialog.test.tsx`: 모듈 없음 → 파일 import 실패.
- R3 `ProjectsExport.test.tsx`: Slot 모듈 없음 → import 실패(줄 버튼·EX-9 미구현).
- R4 `ProjectsDelete.test.tsx` 줄 버튼 순서 단언을 `slice(-3)` = 이름 바꾸기·파일로 내보내기·삭제로 강화 → 그 1건 FAIL(버튼 없음), 나머지 PASS.
