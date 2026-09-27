# EDITOR-A2-DATA PROGRESS

- 브리프: `docs/06-handoff/EDITOR-A2-DATA_BRIEF.md`(우선) + 초안 `EDITOR-A2_BRIEF.draft.md` 4~10절 — 수신 2026-09-27
- 기준 main `2c30862` · 브랜치 `k002bill2/editor-a2-data` · 포트 4337 · 서브에이전트 없음(메인 단독)
- 멈춤선: 어느 시나리오든 첫 화면 여유 < 0.3 또는 진입 직후 여유 < 0.3 → 그 커밋 남기고 중지·REPORT

## 재개
- RESUME-1 (2026-09-27, Claude Code 메인 단독): C0~C3 완료·C4 WIP `87a1e78`에서 이어받음. 순서: C4 누수 수정 → C5 → C6 → 전체 vitest → (턴 남으면) 4337·Codex → REPORT.

- RESUME-2 (2026-09-27, 메인 단독): C6 → build → 전체 vitest → REPORT. 4337·Codex 이관.

## 체크포인트
- [x] C0 base-build 실측 커밋 (`logs/base-build.txt`)
- [x] C1 가드 허용 목록 + `@source not "./engine"` + CSS 전후 (`logs/c1-css.txt`)
- [x] C2 엔진 `motion?` (예외 2파일, RED→GREEN)
- [x] C3 `data/engineVariantMap.ts` + `data/startDocWrite.ts` + 8.2.1 가드·픽스처 6×3
- [x] C4 `projectRepository.ts`(UNKNOWN_VARIANT·바뀐 쌍) + `memoryProjectRepository.ts`(getDoc·saveDoc·startDoc) — 누수 수정: 본문 → 조작 뒤 청크 `memoryDocBook.ts`, 상수 → `generatorVersion.ts` (`logs/c4-fix-build.txt`)
- [x] C5 `CandidatesSection.tsx` 편집 시작 연결 — RED 4 → GREEN 149/149(표적 11파일). ⚠ /profile 진입 +0.23(허용 +0.03~0.08 초과, 여유 0.31 — 멈춤선 안쪽) → REPORT 기록
- [x] C6 `useCompareBoard.ts` 첫 확정 알림 + `CompareBoardTarget.test.tsx` 케이스 — `f50aaba` RED 1 → GREEN 7/7 · /profile 여유 0.30
- [x] 전체 vitest 1회 — 1272/1273 (CompareBoardPage AC-25 1건, 단독 36/36 통과 · 미수정) `logs/full-vitest.txt`
- [ ] 4337 agent-browser 흐름 1회 + 캡처 1280 — BLOCKED: RESUME-2 범위 밖, 병합 뒤 QA 이관
- [ ] Codex review 1회 (branch --base 2c30862) — BLOCKED: RESUME-2 범위 밖, Jarvis 이관
- [x] REPORT.md

## 번들 기록
| 시점 | /profile 첫/진입 | /catalog | /compare 첫/진입 | /studio 첫/진입 | 공통 | CSS |
|---|---|---|---|---|---|---|
| base 2c30862 | 99.60 / 124.44 | 99.64 / 102.02 | 98.74 / 121.36 | 90.73 / 103.73 | 89.34 | index-5C_vcWjl.css 45808B |
| C1 | 99.60 / 124.44 | 99.64 / 102.02 | 98.74 / 121.36 | 90.73 / 103.73 | 89.34 | 동일 sha 4e999d61 (바뀐 규칙 0) |
| C2 | 99.60 / 124.44 | 99.64 / 102.02 | 98.74 / 121.36 | 90.73 / 103.73 | 89.34 | 동일 (index-5C_vcWjl) |
| C3 | 99.60 / 124.44 | 99.64 / 102.02 | 98.74 / 121.36 | 90.73 / 103.73 | 89.34 | 동일 (index-5C_vcWjl) — 새 파일 미연결 |
| C4 WIP 87a1e78 | 99.62 / 124.56 | 99.66 / 102.05 | 98.76 / 121.49 | 90.74 / 105.24 | 89.36 | 동일 — 누수(/projects 107.90) |
| C4 fix | 99.60 / 124.46 | 99.64 / 102.02 | 98.74 / 121.38 | 90.73 / 104.33 | 89.34 | 동일 — /projects 106.99 (+0.60, 계약 표면) |
| C5 | 99.60 / 124.69 | 99.65 / 102.03 | 98.75 / 121.39 | 90.73 / 104.33 | 89.34 | 동일 — profileEngine +0.23(startDoc 호출·분기·알림 JSX·실패 문구) |
| C6 | 99.60 / 124.70 | 99.64 / 102.02 | 98.74 / 121.39 | 90.73 / 104.32 | 89.34 | 동일 — CompareBoardPage +0.01, /profile 여유 0.30 |
