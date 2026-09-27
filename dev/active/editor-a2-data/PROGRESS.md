# EDITOR-A2-DATA PROGRESS

- 브리프: `docs/06-handoff/EDITOR-A2-DATA_BRIEF.md`(우선) + 초안 `EDITOR-A2_BRIEF.draft.md` 4~10절 — 수신 2026-09-27
- 기준 main `2c30862` · 브랜치 `k002bill2/editor-a2-data` · 포트 4337 · 서브에이전트 없음(메인 단독)
- 멈춤선: 어느 시나리오든 첫 화면 여유 < 0.3 또는 진입 직후 여유 < 0.3 → 그 커밋 남기고 중지·REPORT

## 체크포인트
- [ ] C0 base-build 실측 커밋 (`logs/base-build.txt`)
- [ ] C1 가드 허용 목록 + `@source not "./engine"` + CSS 전후 (`logs/c1-css.txt`)
- [ ] C2 엔진 `motion?` (예외 2파일, RED→GREEN)
- [ ] C3 `data/engineVariantMap.ts` + `data/startDocWrite.ts` + 8.2.1 가드·픽스처 6×3
- [ ] C4 `projectRepository.ts`(UNKNOWN_VARIANT·바뀐 쌍) + `memoryProjectRepository.ts`(getDoc·saveDoc·startDoc)
- [ ] C5 `CandidatesSection.tsx` 편집 시작 연결
- [ ] C6 `useCompareBoard.ts` 첫 확정 알림 + `CompareBoardTarget.test.tsx` 케이스
- [ ] 전체 vitest 1회
- [ ] 4337 agent-browser 흐름 1회 + 캡처 1280
- [ ] Codex review 1회 (branch --base 2c30862)
- [ ] REPORT.md

## 번들 기록
| 시점 | /profile 첫/진입 | /catalog | /compare 첫/진입 | /studio 첫/진입 | 공통 | CSS |
|---|---|---|---|---|---|---|
| base 2c30862 | 99.60 / 124.44 | 99.64 / 102.02 | 98.74 / 121.36 | 90.73 / 103.73 | 89.34 | index-5C_vcWjl.css 45808B |
