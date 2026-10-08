# P2-L2 Developer 브리프 — 프로젝트 "파일로 내보내기" 화면

- 역할 Developer / Orca managed Claude Code / worktree p2-l2 / base `483c0db`(P2-L1 병합). `npm ci` 완료. **병렬 레인: P2-L3(가져오기, 4339)와 동시 진행.**
- 정본: `docs/design/persistence/P2-SPEC.md` — **머리 "Jarvis 채택 결정" 우선**(AC-P01은 이미지 바이트 동일이 아니라 "수·localId·형식·치수 동일 + 디코드 성공") · 1.2·1.3·3.6·4.1·EX 문구·6절 번들·7절 AC-P01(E 앞반 — 내려받기)·P07(내보내기)·P08(내보내기)·P09 · 8절 L2 행. `dev/active/p2-l1/REPORT.md`(`encodeProjectFile`·`exportLimitHolds`·EX-12) · P1d L3 `DeleteProjectDialog`·Slot 패턴(조작 뒤 청크·close() 먼저·alert key).
- 쓰기 파일 = 8절 L2 행: `ProjectRow.tsx`(버튼·`data-export-for`, 삭제 앞) · `ProjectList.tsx`(`onExport`) · `ProjectsPage.tsx`(Slot·EX-9 알림) · 새 `components/projects/ExportProjectFileDialog.tsx`(+Slot) · 새 `features/projectFile/readProject.ts`(readonly 한 트랜잭션) + 각 테스트. **L3 파일(`BrowserStorageSection`·`ImportProjectFileDialog`·`writeImport`·`ClearDataDialog`·`DeleteProjectDialog`) 수정 0.** `ProjectsPage.tsx`는 L3도 마지막에 고친다 — L2가 먼저 병합되므로 이 레인은 평소대로.
- 번들: main `/studio` 129.09(멈춤 >129.65) · 복원 132.13 · `/profile` 99.87 / 100 · `/projects` 104.69 / 125. 이 레인 `/studio`·`/profile`·복원 몫 **0**, `/projects`는 버튼·알림 정도. 대화상자·읽기·인코딩은 버튼 뒤 지연 import. 6절 "진입 closure 검증 함수 import가 공유 청크를 재분할하는가" — **배선 첫 커밋 직후(16턴 전) build 실측**, `/profile` >100 또는 `/studio` >129.65면 멈추고 원인 모듈 REPORT.

## Ego Lite (필수)
- build + `vite preview --port 4337` · 창 minimized면 normal · `captureBeyondViewport:false`+clip ≤3장(`dev/active/p2-l2/shots/`) · status/alert `textContent`·`document.activeElement` evaluate 증거.
- 시나리오: 프로젝트 1개(단색 PNG — 스크립트로 만든 것만, 저장소 밖 `$TMPDIR`) → `/projects` "파일로 내보내기" → 포커스 "파일 만들기" → 만들기 → 내려받기 시작(CDP `Browser.setDownloadBehavior`로 `$TMPDIR` 지정, 파일명 규칙 `${stem}_project_YYYYMMDD.json` 확인 · JSON 최상위 `format`·`formatVersion`·이미지 수) → EX-9 1회 → Esc 포커스 복귀. 내려받은 파일은 **삭제하지 말고 경로를 REPORT에** 남김(L3 Ego Lite 입력 후보 — 저장소 밖).
- 끝나면 `deleteDatabase("design-studio")` 결과 → 자기 공간만 `finish({keep:[]})` · `listTaskSpaces()` 기록(L3 공간 무접촉) · 서버 종료·4337 리슨 0. 영환님 창·main 5480 무접촉.

## 검증·금지
- TDD(RED 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지**). typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. **Codex는 Jarvis 몫.**
- 엔진·계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성·아이콘 0, 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 구현 커밋 25턴 전 · Ego Lite 28턴 전 시작·40턴 전 결과 커밋 · 44턴부터 게이트·REPORT만 · REPORT 초안 48턴 전 커밋. 한국어.
