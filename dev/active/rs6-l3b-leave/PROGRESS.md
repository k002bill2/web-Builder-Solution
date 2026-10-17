# RS6-L3b PROGRESS — 상쇄 먼저 → 링크 이탈(MQ-6-7) · POP · 화면 호출처

브리프: `dev/active/rs6-l3b-leave/BRIEF.md` · base `860d530d` · 예산 상한 `/studio` 정규화 129.13 (현재 129.04)

## 체크리스트
- [ ] 0. BRIEF·PROGRESS 커밋
- [ ] CP-A 상쇄
  - [ ] A1 `useDocSave` 코어 없는 폴백 제거 + 폴백 의존 테스트 → 코어 있는 저장소 이전(단언 유지)
  - [ ] A2 S6c 제거 목록(L0 REPORT 3절) 적용 · `LocalSync.base`·DocBook `base` 우회 삭제
  - [ ] A3 상쇄 실측(정규화·raw·복원) 기준선 파일 갱신 · 커밋
- [ ] CP-B 화면 호출처 전환 (PLAN CP3)
- [ ] CP-C 링크 이탈·POP·beforeunload (PLAN CP4 · MQ-6-7 A)
- [ ] Ego Lite 1회
- [ ] 게이트 fresh: typecheck · lint · test · build
- [ ] REPORT.md

## 로그
