# P1D-L3 PROGRESS — `/projects` 프로젝트 삭제

base `557fe35` · 브랜치 `k002bill2/p1d-l3` · 서브에이전트 0 · Codex = Jarvis 몫.

## 체크리스트
- [x] P0 BRIEF 커밋 (b7e75d9)
- [x] TDD RED 예측 기록(아래) → RED 실측(4파일 FAIL — ProjectsDelete는 단언 단계 7 FAIL·1 GREEN, REPORT TDD 절)
- [x] `features/projects/deleteProject.ts` — 순수 판정 `planDelete` · 이미지 접두 `projectImageKeys` · IDB 껍데기 `runDelete`(한 트랜잭션) · 탭당 흐름 `deleterFor`
- [x] `features/projects/dialogText.ts` — BUSY_TEXT·FAIL_TEXT 공용 이동 + `ClearDataDialog.tsx` import 1줄
- [x] `components/projects/DeleteProjectDialog.tsx` + `DeleteProjectDialogSlot.tsx`(조작 뒤 청크)
- [x] `ProjectRow.tsx`·`ProjectList.tsx` — "삭제" 버튼(local만, `data-delete-for`)
- [x] `ProjectsPage.tsx` — 대화상자 열기·포커스 복귀·PJ-10 1회 알림·h1 포커스
- [x] 구현 커밋(04c959e) + build 번들 관문 — /studio 129.63 · 복원 132.66 · /profile 99.87 · /projects 104.86(/studio ≤129.65 · 복원 ≤132.68 · /profile ≤100 · /projects ≤125)
- [x] typecheck · lint · 전체 vitest exit 0(280 files / 2456 tests)
- [x] Ego Lite 실측(TaskSpace 29 — ①②③④ 통과, shots 3장)(AC-D01④E · D04 · D05 · D06) + 정리(deleteDatabase · finish · listTaskSpaces · 서버 종료)
- [x] REPORT.md

## TDD RED 예측 (구현 전 기록)
- `deleteProject.test.ts`: 모듈 없음 → import 실패로 파일 전체 FAIL.
- `DeleteProjectDialog.test.tsx`: 모듈 없음 → import 실패로 파일 전체 FAIL.
- `ProjectsDelete.test.tsx`: `DELETED_NOTICE_KEY` export 없음 · "삭제" 버튼 없음 → import/단언 FAIL(파일 전체 — import 단계).
- `dialogText.test.ts`: 모듈 없음 → FAIL.
- 기존 `ClearDataDialog.test.tsx`·`ProjectsPage.test.tsx`는 GREEN 유지(회귀 고정).

## 결정·메모
- deleteProject.ts는 `envelope`·`entryRead`·`idbPersistence`·`studioStore` 런타임 import 0(진입·복원 closure 공유 청크 방지 — clearBrowserData 선례). DB 이름·SCHEMA_VERSION 1 리터럴 복제 + parity 테스트. 허용 import = `writerLock.tryLock` · `seqId.seqOf`.
- 트랜잭션 원자성(실제 IDB)은 jsdom에 IDB가 없어 손 가짜 + Ego Lite 실측.
- ST-1 문구 교체(BrowserStorageSection)는 L3 쓰기 목록 밖 — 손대지 않음.
