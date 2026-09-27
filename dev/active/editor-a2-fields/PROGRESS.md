# EDITOR-A2-FIELDS PROGRESS

- 브리프: `docs/06-handoff/EDITOR-A2-FIELDS_BRIEF.md`(우선) + 초안 `EDITOR-A2_BRIEF.draft.md` 4~10절 — 수신 2026-09-27
- 기준 main `f22bbc8` · 브랜치 `k002bill2/editor-a2-fields` · 포트 4339 · 서브에이전트 없음(메인 단독)
- 쓰기 금지: `pages/StudioPage.tsx` · S 소유(`StudioToolbar`·`StudioLayout`·`SectionList`·`StructureCanvas`·`PreviewWidth`·`StudioTabs`·`useStudioDoc`·`selection`·`layoutMode`) · `design/`·`docs/design/`·`engine/**`
- 멈춤선: 어느 화면이든 여유 < 0.3KB → 그 커밋 남기고 중지·REPORT
- 재사용(F0 확인): `useAutosaveScheduler`(2초·30초·저장 중 변경 1회·offline/online·STALE 멈춤·`needsUnloadGuard`+beforeunload 등록) · `saveStatusText`(상태 글자·상대 시각·`saveAnnouncement`) · engine `gateText`(`overMax`·`recommendedNote`)·`charCount` 규칙

## 체크포인트
- [x] F0 base build 실측 (`logs/base-build.txt`, exit 0)
- [ ] F1 필드 카운터 E-AC-06 (`fieldCounter` + `FieldEditor`)
- [ ] F2 자동 저장 훅 E-AC-07 (`useDocSave`)
- [ ] F3 저장 상태 E-AC-08·09 (`SaveStatus`)
- [ ] F4 충돌 E-AC-10 (`ConflictCallout`)
- [ ] F5 떠남 가드 E-AC-12
- [ ] F6 페이지 정보 필드 (`PageInfoFields`)
- [ ] 전체 vitest 1회 (`logs/full-vitest.txt`)
- [ ] Codex review 1회 (branch --base f22bbc8)
- [ ] REPORT.md

## 번들 기록 (gzip KB)
| 시점 | /catalog 첫/진입 | /references 첫/진입 | /compare 첫/진입 | /profile 첫/진입 | /projects 첫/진입 | /studio 첫/진입 | 공통 |
|---|---|---|---|---|---|---|---|
| base f22bbc8 | 99.65 / 102.03 | 96.99 / 99.38 | 98.75 / 121.39 | 99.60 / 124.69 | 93.97 / 106.99 | 90.73 / 104.33 | 89.34 |
