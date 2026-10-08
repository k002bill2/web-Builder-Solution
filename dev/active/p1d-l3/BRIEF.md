# P1D-L3 Developer 브리프 — `/projects` 프로젝트 삭제

- 역할 Developer / Orca managed Claude Code / worktree p1d-l3 / base `557fe35`(P1D-L1 병합). `npm ci` 완료. **병렬 레인: L2(스냅샷 삭제, 4337)와 동시 진행 — 쓰기 파일 겹침 0 유지.**
- 정본: `docs/design/persistence/P1D-SPEC.md` **1.3(J-S12~J-S17 · 삭제 범위 1~4단계) · 1.5 강등 · 1.6 접근성 · 2절 PJ 문구 · 3절 `seq` 갱신 · 4절 번들 · 5절 AC-D01③④·D04·D05·D06(프로젝트)·D07(프로젝트)·D08(프로젝트) · 7절 L3 행**, `P1D-MQ.md` D1 A(IDB 직접 + 새로고침), ADR-007 개정 3, `dev/active/p1d-l1/REPORT.md`(seq 형식·검증), P1c D4 `app/src/features/projects/clearBrowserData.ts`·`ClearDataDialog.tsx`·`ClearDataDialogSlot`(잠금·cleared·sessionStorage·close() 먼저·탭 단위 처리기 패턴 — Codex r1·r2 교훈 그대로 적용).
- 쓰기 파일 = 7절 L3 행만: 새 `features/projects/deleteProject.ts`(IDB 직접 한 트랜잭션 — `envelope` import 금지 주석 따름) · 새 `components/projects/DeleteProjectDialog.tsx`(+ Slot — 버튼을 눌러야 받는 청크) · `ProjectRow.tsx` · `ProjectList.tsx` · `ProjectsPage.tsx` · `BUSY_TEXT`/`FAIL_TEXT` 공용 모듈 이동(+ `ClearDataDialog.tsx` 1줄) + 각 테스트. **`memoryDocBook`·`Snapshot*`·`projectRepository.ts`·`memoryProjectRepository.ts`·`studioStore.ts` 수정 0**(L2·L1 몫).

## 핵심 규칙
- 다른 탭이 쓰기 탭이면 차단(전역 잠금 — D4 `clearBrowserData`와 같은 판정; 같은 탭이 쓰기 탭이면 보유 잠금 안에서). 삭제 트랜잭션에서 `gen`·`meta/generation` +1 · `seq` = max(기존, 지운 번호) · 이미지 접두는 `${projectId}/`(슬래시 포함 — `project-10` 무접촉). 성공 → 커밋 뒤 BroadcastChannel `saved`(다른 탭 최신성) → `sessionStorage` 1회 키 → `/projects` 새로고침 이동. 지워진 프로젝트를 연 다른 탭이 저장하면 낡은 탭 실패·부활 0(AC-D05 추가).

## 번들 관문
- main 실측: `/studio` 진입 **129.64** / 멈춤 >129.65 · 복원 **132.68** / 멈춤 >132.68 · `/profile` 첫 화면 99.87 / 100 · `/projects` 104.49 / 125. 이 레인의 `/studio`·`/profile`·복원 몫 **0**(새 모듈을 진입 closure와 공유하지 말 것). 구현 첫 커밋 직후(**18턴 전**) build 확인 — 넘으면 멈추고 실측+원인 모듈 REPORT 후 종료.

## Ego Lite (필수 — 실화면, AC-D01④ E·D04·D05가 유일한 실측)
- build + `vite preview --port 4339`(dev 금지) · 창 minimized면 normal · `captureBeyondViewport:false`+clip ≤4장(`dev/active/p1d-l3/shots/`) · status·alert `textContent` evaluate 증거.
- 시나리오: 프로젝트 3개 만들기(비교 보드 확정 3회 — 단색 PNG 이미지 1장은 최소 1개 프로젝트에) → ① 탭 B 편집기 쓰기 탭 상태에서 탭 A `/projects` 삭제 → alert 1회·IDB 불변 → B 닫기 → ② A에서 **project-3(최대) 삭제** → 새로고침 뒤 "'{이름}' 프로젝트를 지웠습니다" 1회·h1 포커스 · IDB: `docs/project-3` 없음·`images` `project-3/` 접두 0·state에 그 계열·잡 0·`seq` 반영 → ③ 새 확정 = **`project-4`**(재발급 0) · ④ 확인 대화상자 Esc = 닫힘·포커스 그 줄 "삭제".
- 끝나면 `indexedDB.deleteDatabase("design-studio")` 결과 → 자기 공간만 `finish({keep:[]})` · `listTaskSpaces()` 결과 기록(L2 공간 무접촉) · 서버 종료·4339 리슨 0. 영환님 창·main 5480 무접촉.

## 검증·금지
- TDD(RED 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지**). typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. **Codex는 Jarvis 몫.**
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성·아이콘 0, 서브에이전트 0, push/merge/삭제 0(테스트 IDB 삭제·앱 삭제 실측 허용), 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: 구현 커밋 28턴 전, Ego Lite 30턴 전 시작·결과 44턴 전 커밋, 48턴부터 게이트·REPORT만, REPORT 초안 52턴 전 커밋. 한국어.
