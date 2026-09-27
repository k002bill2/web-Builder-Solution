# EDITOR-A2-SHELL — PROGRESS

- 수신: 2026-09-27 · 브리프 `docs/06-handoff/EDITOR-A2-SHELL_BRIEF.md`(+ 초안 4~10절) · 브랜치 `k002bill2/editor-a2-shell` · base `f22bbc8`(HEAD `932d423`) · 포트 4337 · 서브에이전트 금지.
- 소유: `pages/StudioPage.tsx` · 새 `components/studio/{StudioToolbar,StudioLayout,SectionList,StructureCanvas,PreviewWidth,StudioTabs}.tsx` · 새 `features/studio/{useStudioDoc,selection,layoutMode}.ts` + 테스트. F 레인 파일 쓰기 금지.

## RESUME-1 (2026-09-27 · 브리프 끝 절)
- base `d216990`(main `e13f2b6` + 브리프). S1 병합됨. /profile 여유 1.34 확보로 중지 사유 해소 → S2~S6 + S7 재개. 번들: `/studio` 첫 ≤ 99.40, 그 밖 ±0.03, 멈춤선 0.3. 포트 4337 · 서브에이전트 금지 · 로컬 커밋만.
- 범위 판단: 게이트 목록·내보내기·스냅샷·더보기(실행 취소)는 a4(SPEC 13.1) → 제목 구조(E-AC-04)용 h2 "품질 게이트"·h3 "내보내기" 자리만 둔다. 섹션 연산(추가·삭제·이동·변형·테마)·이미지 슬롯은 a3.

## 체크포인트
- [x] S0 base build 실측 → `logs/base-build.txt` (exit 0 · /studio 90.73/104.33 · /profile 99.60/124.69 · /catalog 99.65 · 공통 89.34)
- [x] S1 문서 분기 + D1~D3 (RED→GREEN, 3회 반복) — `270bf6c` · RED `logs/s1-red.txt`(6 fail/1 pass) · GREEN 7/7 × 3회 `logs/s1-repeat.txt`
- [x] S2 집중 모드 툴바 E-AC-03 — RED `logs/s2-red.txt`(title 1 fail) → GREEN 8/8 `logs/s2-green.txt` · build /studio 95.50/108.48 · 그 밖 ±0.01
- [ ] S3 3단 배치·제목 구조 E-AC-04 · E-AC-13
- [ ] S4 섹션 선택 E-AC-05
- [ ] S5 탭 E-AC-14
- [ ] S6 미리보기 폭·캔버스 E-AC-15 · E-AC-16
- [ ] S7 A2-F 연결 (FieldEditor·PageInfoFields·SaveStatus·ConflictCallout·useDocSave) + 저장소 어댑터
- [ ] 전체 vitest 3회 → `logs/final-full-x3.txt`
- [ ] REPORT 갱신 (RESUME-1 절)
- [ ] Codex 1회(`review --scope branch --base e13f2b6`) 또는 이관
- [x] 전체 vitest 1회 → `logs/full-vitest.txt` (112 files · 1279 passed · 실패 0)
- [x] Codex — 이관(중지 규칙 발동으로 S1에서 멈춤 · 병합 전 `review --scope branch --base f22bbc8` 1회 권장)
- [x] REPORT.md

## 결정 · 목업 차이
- 돌아가기 버튼: `chevron-left` Icon 대신 CSS 테두리 chevron(EM 추가 후보) — `ds/Icon` import 시 공통 +0.39KB, SVG `?url` 직접 import 시 공통 +0.08KB(실측). 접근 이름 "프로젝트로 돌아가기" 그대로.
- 문서 Tag: `ds/Tag` 대신 토큰 span — Tag(+cx) import가 공통 청크를 흔듦(실측, 작은 증가).
- `Wireframe` 재사용: S6 미착수라 판단 보류(`CandidatePlan`·`aria-hidden`·글자 없음 → PageDoc 슬롯 글자와 모양 불일치 가능성, import 시 profile 청크 공유 위험).
