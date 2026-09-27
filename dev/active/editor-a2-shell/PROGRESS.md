# EDITOR-A2-SHELL — PROGRESS

- 수신: 2026-09-27 · 브리프 `docs/06-handoff/EDITOR-A2-SHELL_BRIEF.md`(+ 초안 4~10절) · 브랜치 `k002bill2/editor-a2-shell` · base `f22bbc8`(HEAD `932d423`) · 포트 4337 · 서브에이전트 금지.
- 소유: `pages/StudioPage.tsx` · 새 `components/studio/{StudioToolbar,StudioLayout,SectionList,StructureCanvas,PreviewWidth,StudioTabs}.tsx` · 새 `features/studio/{useStudioDoc,selection,layoutMode}.ts` + 테스트. F 레인 파일 쓰기 금지.

## 체크포인트
- [x] S0 base build 실측 → `logs/base-build.txt` (exit 0 · /studio 90.73/104.33 · /profile 99.60/124.69 · /catalog 99.65 · 공통 89.34)
- [x] S1 문서 분기 + D1~D3 (RED→GREEN, 3회 반복) — `270bf6c` · RED `logs/s1-red.txt`(6 fail/1 pass) · GREEN 7/7 × 3회 `logs/s1-repeat.txt`
- [ ] S2 집중 모드 툴바 E-AC-03 — BLOCKED: 중지 규칙 — S1 빌드 /profile 진입 124.72(여유 0.28 < 0.3), 여유 확보 결정 필요
- [ ] S3 3단 배치·제목 구조 E-AC-04 · E-AC-13 — BLOCKED: 중지 규칙 — S1 빌드 /profile 진입 124.72(여유 0.28 < 0.3), 여유 확보 결정 필요
- [ ] S4 섹션 선택 E-AC-05 — BLOCKED: 중지 규칙 — S1 빌드 /profile 진입 124.72(여유 0.28 < 0.3), 여유 확보 결정 필요
- [ ] S5 탭 E-AC-14 — BLOCKED: 중지 규칙 — S1 빌드 /profile 진입 124.72(여유 0.28 < 0.3), 여유 확보 결정 필요
- [ ] S6 미리보기 폭·캔버스 E-AC-15 · E-AC-16 — BLOCKED: 중지 규칙 — S1 빌드 /profile 진입 124.72(여유 0.28 < 0.3), 여유 확보 결정 필요
- [x] 전체 vitest 1회 → `logs/full-vitest.txt` (112 files · 1279 passed · 실패 0)
- [x] Codex — 이관(중지 규칙 발동으로 S1에서 멈춤 · 병합 전 `review --scope branch --base f22bbc8` 1회 권장)
- [x] REPORT.md

## 결정 · 목업 차이
- 돌아가기 버튼: `chevron-left` Icon 대신 CSS 테두리 chevron(EM 추가 후보) — `ds/Icon` import 시 공통 +0.39KB, SVG `?url` 직접 import 시 공통 +0.08KB(실측). 접근 이름 "프로젝트로 돌아가기" 그대로.
- 문서 Tag: `ds/Tag` 대신 토큰 span — Tag(+cx) import가 공통 청크를 흔듦(실측, 작은 증가).
- `Wireframe` 재사용: S6 미착수라 판단 보류(`CandidatePlan`·`aria-hidden`·글자 없음 → PageDoc 슬롯 글자와 모양 불일치 가능성, import 시 profile 청크 공유 위험).
