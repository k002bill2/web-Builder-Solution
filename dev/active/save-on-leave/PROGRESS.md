# SAVE-ON-LEAVE PROGRESS — B-RS-01 편집기 이탈 저장 미보장

- base main `2ad7221` · 브랜치 `k002bill2/save-on-leave`

## 체크리스트
- [x] `npm ci` (lock 변경 0)
- [ ] 현황 파악 (StudioLayout 이탈 · 스케줄러 · useDocSave)
- [ ] RED 테스트 (예측 · 결과 기록)
- [ ] GREEN 구현 (이탈 시 flush 대기 · 실패 시 이동 보류 · 저장 중 추가 편집 flush)
- [ ] 추가 테스트: 실패 주입 이동 보류·안내 / 성공 이동 1회 / 연타 1회 / 읽기 전용 탭 이동 허용
- [ ] 예산 실측 (`/studio` 진입·복원 각 ≤ +0.15)
- [ ] typecheck · lint · build · 전체 vitest
- [ ] Ego Lite 3회 + 캡처 + 정리
- [ ] Codex review r1 (r2 필요 시)
- [ ] BACKLOG B-RS-01 결과 표기
- [ ] REPORT.md

## 로그
