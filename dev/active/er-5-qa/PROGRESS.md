# ER-5 QA PROGRESS (base fbc6379)

- [x] 0. 브리프·SPEC 5.5·PLAN 4절 읽기 / build exit0 (logs/build.txt)
- [x] 1. QB-R2 (부분 — 개수 문구 미검증, REPORT) (B-M2C-09 ①) 이미지 2장 → 이탈·복귀 → HTML·PNG 개수 문구
- [x] 2. QB-R3 PASS (r2-01~05) / ER-AC-T8 대비 미달 → 보정 → 테마 바꾸기
- [x] 3. QB-R4 스냅샷 저장·편집·미리보기·복원
- [x] 4. QB-R5 (부분 PASS — 개수 문구 미검증) 이미지 A 스냅샷 → 교체 → 이탈·복귀 → 복원
- [x] 5. QB-R6 PASS (섹션 07·08 + 테마 r2-06·07) 키보드 실행 취소/다시 실행
- [ ] 6. QB-R7 — BLOCKED: 30턴 상한으로 새 측정 중단 1280·1024·390 넘침·포커스
- [ ] 7. B-ER-07 — BLOCKED: 재현 증거 없음·턴 상한 CPU 스로틀 재현
- [ ] 8. B-M2C-09 ② — BLOCKED: 시간 없음 (시간 될 때)
- [x] 9. C2 재측정 (build 표 → REPORT)
- [x] 10. 전체 vitest 239/2124 EXIT 0
- [x] 11. Ego Lite finish · listTaskSpaces=[] · 서버 종료
- [x] 12. REPORT 커밋

서브에이전트: 0 (브리프 지시)
space id = 1 (taskSpace 'er-5 qa'), 첫 goto = /catalog (fixture 생성 스크립트 안)
- 캡처 시간 초과 원인: Ego 창 windowState=minimized → Browser.setWindowBounds normal 뒤 브리프 방식 캡처 56ms OK
- QB-R4 PASS(shots 04~06), QB-R6 섹션 PASS(07·08) — 테마 부분은 QB-R3에서
- 2회차: space 2, 창 normal 확인, 첫 goto /catalog 1회, finish closedSpace·listTaskSpaces=[] · 4337 리슨 0
