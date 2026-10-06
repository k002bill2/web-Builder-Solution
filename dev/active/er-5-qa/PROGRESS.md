# ER-5 QA PROGRESS (base fbc6379)

- [x] 0. 브리프·SPEC 5.5·PLAN 4절 읽기 / build exit0 (logs/build.txt)
- [ ] 1. QB-R2 (B-M2C-09 ①) 이미지 2장 → 이탈·복귀 → HTML·PNG 개수 문구
- [ ] 2. QB-R3 / ER-AC-T8 대비 미달 → 보정 → 테마 바꾸기
- [x] 3. QB-R4 스냅샷 저장·편집·미리보기·복원
- [ ] 4. QB-R5 이미지 A 스냅샷 → 교체 → 이탈·복귀 → 복원
- [ ] 5. QB-R6 키보드 실행 취소/다시 실행
- [ ] 6. QB-R7 1280·1024·390 넘침·포커스
- [ ] 7. B-ER-07 CPU 스로틀 재현
- [ ] 8. B-M2C-09 ② (시간 될 때)
- [x] 9. C2 재측정 (build 표 → REPORT)
- [ ] 10. 전체 vitest
- [ ] 11. Ego Lite finish · listTaskSpaces=[] · 서버 종료
- [ ] 12. REPORT 커밋

서브에이전트: 0 (브리프 지시)
space id = 1 (taskSpace 'er-5 qa'), 첫 goto = /catalog (fixture 생성 스크립트 안)
- 캡처 시간 초과 원인: Ego 창 windowState=minimized → Browser.setWindowBounds normal 뒤 브리프 방식 캡처 56ms OK
- QB-R4 PASS(shots 04~06), QB-R6 섹션 PASS(07·08) — 테마 부분은 QB-R3에서
