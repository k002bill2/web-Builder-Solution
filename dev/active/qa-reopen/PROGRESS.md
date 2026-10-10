# QA-REOPEN PROGRESS (포트 4345, base 6fc4668)

- [x] P0 BRIEF·PROGRESS 커밋
- [x] 환경: npm ci · build · preview 4345
- [x] 1. B-ER-11 — RESUME-1: **FAIL**(재현 3/3, 되돌리기 t=-246 · 원인 StructureCanvas 선택 상자 scrollIntoView가 뒤따라 덮어씀) `logs/ber11.txt` · shots ber11-*
- [x] 2. D-QA01 1280 상세 GNB 반복
- [ ] 3. B-ER-07 — BLOCKED: 900초 실행 상한
- [ ] 4. B-M2C-09 ② — BLOCKED: 900초 실행 상한
- [ ] 5. B-M2B-09 — BLOCKED: 900초 실행 상한 (Safari·Firefox 환경 없음)
- [x] 정리: override·스로틀 해제 · IDB 삭제 · finish · 서버 종료
- [x] REPORT.md 커밋

## RESUME-1 (60분 상한)
- [x] 환경: build EXIT 0(`logs/build-r1.txt`) · preview 4345 · Ego space 3(시작 listTaskSpaces=[])
- [x] 경로 A 문서: ref-e → 프로필 v1 → 3안 → B안 → `/studio/project-1` → 페이지 정보 → 게이트 전 통과 · 프로필 조정(촘촘) v2 저장
- [x] B-M2C-09 ② **PASS**(768 높이 차 0 · 390 1px · 차 1.59%·2.65% · `logs/m2c09-*.txt` · shots m2c09-*-side) · [ ] B-ER-07 · [ ] B-M2B-09 · [ ] 정리 · [ ] REPORT 갱신
