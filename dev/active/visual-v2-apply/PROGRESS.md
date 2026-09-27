# PROGRESS — visual-v2-apply

- 브리프: `docs/06-handoff/VISUAL-V2-APPLY_BRIEF.md` · 입력: `docs/06-handoff/visual-v2-input/{REPORT,IMPLEMENTATION-HANDOFF}.md` (Designer 1c7adfe)
- 기준: main 9bcf0d2 + 브리프 커밋 78e745c · 브랜치 `k002bill2/visual-v2-apply` · 보고 Jarvis (task_001d97efc671 상태는 Jarvis 회수)
- 수신: 2026-09-27. 범위 = 브리프 "쓰기 범위" 1~7만. ProfilePage/profile/routes/domain/data/engine/features/compare/store·Q17~24·가드·Chip·필 문구·툴바 캡션 금지.

## 체크리스트
- [ ] 0. 수신·범위 체크포인트(이 파일) 커밋
- [ ] 1. 전(before) 캡처 1280/390 (4345 strictPort, 자기 PID 기록)
- [ ] 2. 묶음1 DS/토큰: base.css body3 · Button lg40(+md/sm 계층) · TextField 40 · Checkbox 16/행24 · AppHeader text-body3 — RED→GREEN
- [ ] 3. 묶음2 카탈로그: ReferenceCard 제목 ds-body2 semibold 2줄 · CatalogHero md — RED→GREEN
- [ ] 4. 묶음3 상세: 태그 중립/보라 · 링크 primary-text · 데스크톱 주요행동 mt-auto — RED→GREEN
- [ ] 5. 묶음4 비교: 표 외곽 테두리 제거 · PickButton 테두리/밀도 · 패널 300 — RED→GREEN
- [ ] 6. 통합마다 build + 번들 여유(≥0.3KB) 기록
- [ ] 7. typecheck / lint / 표적 test
- [ ] 8. 후(after) 캡처 1280/390 + 768/320 넘침·터치·긴문자열·비교 선택·이동 + profile spot-check
- [ ] 9. 서버 자기 PID 종료(lsof 근거)
- [ ] 10. REPORT 커밋

## 예상 테스트 증감 (RED 전 기록)
- 신규: DS 밀도 회귀(Button size 계층·TextField·Checkbox), base.css body3, AppHeader 메뉴 body3, ReferenceCard 제목/CatalogHero md, 상세 태그톤·링크·mt-auto, 비교 표 외곽선/PickButton/패널 폭. 기존 단언 수정은 사유 기록. 삭제 0.

## 로그
