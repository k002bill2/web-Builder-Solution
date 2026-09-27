# EDITOR-A2-DATA PROGRESS

- 브리프: `docs/06-handoff/EDITOR-A2-DATA_BRIEF.md`(우선) + 초안 `EDITOR-A2_BRIEF.draft.md` 4~10절 — 수신 2026-09-27
- 기준 main `2c30862` · 브랜치 `k002bill2/editor-a2-data` · 포트 4337 · 서브에이전트 없음(메인 단독)
- 멈춤선: 어느 시나리오든 첫 화면 여유 < 0.3 또는 진입 직후 여유 < 0.3 → 그 커밋 남기고 중지·REPORT

## 재개
- RESUME-1 (2026-09-27, Claude Code 메인 단독): C0~C3 완료·C4 WIP `87a1e78`에서 이어받음. 순서: C4 누수 수정 → C5 → C6 → 전체 vitest → (턴 남으면) 4337·Codex → REPORT.

## 체크포인트
- [x] C0 base-build 실측 커밋 (`logs/base-build.txt`)
- [x] C1 가드 허용 목록 + `@source not "./engine"` + CSS 전후 (`logs/c1-css.txt`)
- [x] C2 엔진 `motion?` (예외 2파일, RED→GREEN)
- [x] C3 `data/engineVariantMap.ts` + `data/startDocWrite.ts` + 8.2.1 가드·픽스처 6×3
- [x] C4 `projectRepository.ts`(UNKNOWN_VARIANT·바뀐 쌍) + `memoryProjectRepository.ts`(getDoc·saveDoc·startDoc) — 누수 수정: 본문 → 조작 뒤 청크 `memoryDocBook.ts`, 상수 → `generatorVersion.ts` (`logs/c4-fix-build.txt`)
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
| C1 | 99.60 / 124.44 | 99.64 / 102.02 | 98.74 / 121.36 | 90.73 / 103.73 | 89.34 | 동일 sha 4e999d61 (바뀐 규칙 0) |
| C2 | 99.60 / 124.44 | 99.64 / 102.02 | 98.74 / 121.36 | 90.73 / 103.73 | 89.34 | 동일 (index-5C_vcWjl) |
| C3 | 99.60 / 124.44 | 99.64 / 102.02 | 98.74 / 121.36 | 90.73 / 103.73 | 89.34 | 동일 (index-5C_vcWjl) — 새 파일 미연결 |
| C4 WIP 87a1e78 | 99.62 / 124.56 | 99.66 / 102.05 | 98.76 / 121.49 | 90.74 / 105.24 | 89.36 | 동일 — 누수(/projects 107.90) |
| C4 fix | 99.60 / 124.46 | 99.64 / 102.02 | 98.74 / 121.38 | 90.73 / 104.33 | 89.34 | 동일 — /projects 106.99 (+0.60, 계약 표면) |
