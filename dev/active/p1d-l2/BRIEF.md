# P1D-L2 Developer 브리프 — 스냅샷 수동 삭제 UI + 자동 스냅샷 20개 보존

- 역할 Developer / Orca managed Claude Code / worktree p1d-l2 / base `557fe35`(P1D-L1 병합). `npm ci` 완료. **병렬 레인: L3(프로젝트 삭제, 4339)와 동시 진행 — 쓰기 파일 겹침 0 유지.**
- 정본: `docs/design/persistence/P1D-SPEC.md` **1.1(D-S01~D-S10) · 1.2(자동 정리 규칙·복원 예외·이행) · 1.6 접근성 · 2절 SN 문구 · 4절 번들 · 5절 AC-D02·D03·D06(스냅샷)·D07(스냅샷)·D08(스냅샷 UI alert) · 7절 L2 행**, `dev/active/p1d-l1/REPORT.md`(deleteSnapshot 판정·snapshotSeq·`seqOf` 재사용), `app/src/components/projects/ClearDataDialog.tsx`(확인 대화상자·alert key·close() 먼저 패턴).
- 쓰기 파일 = 7절 L2 행만: `memoryDocBook.ts`(자동 append+정리 공용 헬퍼 — 4곳 requestExport·restoreSnapshot·resolveConflict·startDoc restart, 정리 시 `snapshotSeq` 상향) · `SnapshotDialog.tsx`(+ 확인 대화상자 — 같은 파일 또는 그 지연 import) · `SnapshotLayer.tsx`(onNotice·refresh) + 각 테스트. **`features/projects/**`·`components/projects/**`·`ProjectsPage`·`projectRepository.ts`·`memoryProjectRepository.ts`·`studioStore.ts` 수정 0**(L3·L1 몫).

## 번들 관문 (가장 중요 — 진입 여유 사실상 0)
- main 실측: `/studio` 진입 **129.64** / 멈춤 >129.65 · 복원 진입 **132.68** / 멈춤 >132.68 · `/profile` 첫 화면 99.87 / 100.
- `memoryDocBook`·`SnapshotDialog`는 조작 뒤 청크 — 이 레인의 진입 몫은 **0이어야 한다**. 구현 첫 커밋 직후(**18턴 전**) build로 확인. 넘으면 멈추고 실측 + 원인 모듈(어떤 import가 진입 closure로 끌려왔는지)을 REPORT에 쓰고 종료(우회 배선·KB 추정 금지).

## Ego Lite (필수 — 실화면)
- build + `vite preview --port 4337`(dev 금지) · 창 minimized면 `Browser.setWindowBounds normal` · `captureBeyondViewport:false`+clip ≤4장(`dev/active/p1d-l2/shots/`) · status·alert는 sr-only일 수 있으니 **`textContent`를 evaluate로 읽어 증거 기록**.
- 시나리오: 프로젝트 1개 편집기 → 수동 스냅샷 3개 → 확인 대화상자(포커스 "취소") → **Esc 1회 = 확인만 닫힘·스냅샷 대화상자 유지·포커스 그 줄 "삭제"** → 2번 지우기 → 편집 알림 1회·포커스 다음 줄 "미리보기" → 새로고침 → 2번 없음·새 수동 = `snapshot-4`(AC-D01② E). 자동 21개 정리는 U 테스트로(실화면은 캡션 D-S01만).
- 끝나면 `indexedDB.deleteDatabase("design-studio")` 결과 → 자기 공간만 `finish({keep:[]})` · `listTaskSpaces()` 결과 기록(L3 공간이 있을 수 있음 — 남의 공간 무접촉) · 서버 종료·4337 리슨 0. 영환님 창·main 5480 무접촉.

## 검증·금지
- TDD(RED 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지**). typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. **Codex는 Jarvis 몫.**
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성·아이콘 0, 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: 구현 커밋 25턴 전, Ego Lite 28턴 전 시작·결과 40턴 전 커밋, 44턴부터 게이트·REPORT만, REPORT 초안 48턴 전 커밋. 한국어.
