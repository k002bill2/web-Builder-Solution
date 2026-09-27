# EDITOR-A2-FIELDS PROGRESS

- 브리프: `docs/06-handoff/EDITOR-A2-FIELDS_BRIEF.md`(우선) + 초안 `EDITOR-A2_BRIEF.draft.md` 4~10절 — 수신 2026-09-27
- 기준 main `f22bbc8` · 브랜치 `k002bill2/editor-a2-fields` · 포트 4339 · 서브에이전트 없음(메인 단독)
- 쓰기 금지: `pages/StudioPage.tsx` · S 소유(`StudioToolbar`·`StudioLayout`·`SectionList`·`StructureCanvas`·`PreviewWidth`·`StudioTabs`·`useStudioDoc`·`selection`·`layoutMode`) · `design/`·`docs/design/`·`engine/**`
- 멈춤선: 어느 화면이든 여유 < 0.3KB → 그 커밋 남기고 중지·REPORT
- 재사용(F0 확인): `useAutosaveScheduler`(2초·30초·저장 중 변경 1회·offline/online·STALE 멈춤·`needsUnloadGuard`+beforeunload 등록) · `saveStatusText`(상태 글자·상대 시각·`saveAnnouncement`) · engine `gateText`(`overMax`·`recommendedNote`)·`charCount` 규칙

## 체크포인트
- [x] F0 base build 실측 (`logs/base-build.txt`, exit 0)
- [x] F1 필드 카운터 E-AC-06 (`fieldCounter` + `FieldEditor`) — RED `logs/f1-red.txt`(모듈 없음) → GREEN 18/18 `logs/f1-green.txt` · build exit 0. 결정: 상한·권장 동시 초과 = block 문장 하나만 · HTML `maxLength`=상한+10(UTF-16 단위라 이모지는 코드 포인트보다 일찍 멈춤 — 위험 목록)
- [x] F2 자동 저장 훅 E-AC-07 (`useDocSave`) — `useAutosaveScheduler` 그대로 사용(수정 0). RED `logs/f2-red.txt` → GREEN 7/7 `logs/f2-green.txt`(2초·maxWait·저장 중 3변경 → 1회·반환 revision 사용·실제 메모리 저장소 연속 2회·E-AC-12 server 실패/STALE 등록) · build exit 0
- [x] F3 저장 상태 E-AC-08·09 (`SaveStatus`) — `saveStatusText`·`saveAnnouncement` 재사용(수정 0). RED `logs/f3-red.txt` → GREEN 5/5 `logs/f3-green.txt` · build exit 0. 결정: 자체 `role=status` 없음(편집 알림 영역 1개 = S 소유, E-AC-33) → status 문장은 `onAnnounce` 콜백 · `role=alert`는 SaveStatus가 가진다(6.3 "저장 실패" 행, STALE 문장 포함)
- [x] F4 충돌 E-AC-10 (`ConflictCallout` + `useDocSave.resolve`) — RED `logs/f4-red.txt`(5 실패) → GREEN 73/73(studio 폴더) `logs/f4-green.txt` · build exit 0. `useAutosaveScheduler`에 `settle()` 추가(기존 테스트 단언 불변 — 필요 사유: `resume()`은 미저장 변경을 즉시 flush해 "불러오기" 뒤 내 문서를 저장하고 "내 편집" 뒤 한 번 더 저장함). 목 저장소 검증: 고르기 전 saveDoc 0 · mine = resolveConflict 1회·추가 저장 0 · theirs = 최신 표시·내 문서 저장 0
  - BLOCKED(스냅샷 부분): 메모리 저장소 `resolveConflict`·`createSnapshot` = `missing`(NOT_FOUND, `data/memoryProjectRepository.ts:99-101`). "auto·conflict 스냅샷 1개" 검증은 저장소 구현 필요 — 스냅샷은 a4 범위(초안 2절 "제외(a3·a4): … 스냅샷", SPEC 13.1 a4 행) · 브리프 지시대로 새로 만들지 않음. 화면은 해결 거부 시 STALE 유지(테스트 있음)
- [x] F5 떠남 가드 E-AC-12 — **재사용, 새 파일 없음**: `useAutosaveScheduler`가 이미 `needsUnloadGuard` + `beforeunload` 등록(memory 늘 · server idle/saved 미등록, 기존 `useAutosaveScheduler.hook.test.tsx:30` 2건). `leaveGuard.ts`를 따로 두면 두 번째 리스너(중복 등록) 위험 → 만들지 않음. 빠진 경우(server 목 실패·STALE 등록)는 F2 `useDocSave.test.tsx` "떠나기 경고" 2건으로 추가
- [x] F6 페이지 정보 필드 (`PageInfoFields`) — RED `logs/f6-red.txt` → GREEN 83/83(studio 폴더+가드) `logs/f6-green.txt` · build exit 0. 권장 60/160은 로컬 상수(엔진 `SEO_FIELDS` export 없음) + `seoIssues` 경계 대조 테스트 · canonical 캡션 · 경고 문장 "…검색 결과에서 잘릴 수 있습니다"는 유추(SPEC 문장 없음)
- [x] 전체 vitest 1회 (`logs/full-vitest.txt`) — 117 파일 · 1308/1308 통과 · exit 0
- [ ] Codex review 1회 (branch --base f22bbc8)
- [ ] REPORT.md

## 번들 기록 (gzip KB)
| 시점 | /catalog 첫/진입 | /references 첫/진입 | /compare 첫/진입 | /profile 첫/진입 | /projects 첫/진입 | /studio 첫/진입 | 공통 |
|---|---|---|---|---|---|---|---|
| base f22bbc8 | 99.65 / 102.03 | 96.99 / 99.38 | 98.75 / 121.39 | 99.60 / 124.69 | 93.97 / 106.99 | 90.73 / 104.33 | 89.34 |
| F1 | 99.64 / 102.03 | 96.99 / 99.38 | 98.74 / 121.38 | 99.60 / 124.70 | 93.97 / 106.99 | 90.73 / 104.33 | 89.34 | 새 파일 미연결 — ±0.01은 CSS 해시(새 유틸리티 클래스) 파일명 변화. /profile 여유 0.30 |
| F2 | 99.64 / 102.03 | 96.99 / 99.38 | 98.74 / 121.38 | 99.60 / 124.70 | 93.97 / 106.99 | 90.73 / 104.33 | 89.34 | 미연결 — 변화 0 |
| F3 | 99.64 / 102.03 | 96.99 / 99.38 | 98.74 / 121.38 | 99.60 / 124.70 | 93.97 / 106.99 | 90.73 / 104.33 | 89.34 | 미연결 — 변화 0 |
| F4 | 99.64 / 102.03 | 96.99 / 99.38 | 98.74 / 121.38 | 99.60 / 124.70 | 93.97 / 106.99 | 90.73 / 104.33 | 89.34 | 스케줄러 수정(settle) — 변화 0 |
| F6 | 99.64 / 102.03 | 96.99 / 99.38 | 98.74 / 121.38 | 99.60 / 124.70 | 93.97 / 106.99 | 90.73 / 104.33 | 89.34 | 미연결 — 변화 0 |
