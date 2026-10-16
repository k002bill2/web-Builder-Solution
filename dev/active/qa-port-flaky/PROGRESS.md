# QA-PORT-FLAKY PROGRESS

- [x] 1. A 검출력 표본 — M3·M4·M5 3개 모두 FAIL 재현, 가드 별칭·네임스페이스 FAIL / 주석 PASS. 매번 `git checkout -- src` 복원
- [x] 2. A 단언 범위 — 테스트 파일만, `-` 줄 = import 2줄 + 텍스트 정규식 테스트 1건(가드로 이동)
- [x] 3a. B 회귀 테스트 수정 전 RED (base ProjectsPage.tsx 임시 복원 → FAIL, 복원 → PASS)
- [x] 3b. B import 실패 시 빈 상태·저장소 영역 렌더 — 임시 테스트 PASS, failed 분기 제거 변이 시 FAIL (임시 파일 삭제)
- [x] 3c. B 로딩 미종료 경로 코드 판정 — LoadingState 유지, 빈 화면 회귀 없음
- [x] 4. B ProjectsPage.test.tsx diff 0
- [x] 5. 통합 게이트 — typecheck·lint·test×2(315/2842)·build 모두 exit 0
- [x] 6. 최종 git status app/ 변경 0
- [x] QA-REPORT.md 작성·커밋 (A·B 모두 PASS with notes)
