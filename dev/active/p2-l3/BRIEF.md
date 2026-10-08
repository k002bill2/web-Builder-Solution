# P2-L3 Developer 브리프 — "프로젝트 파일 가져오기" 화면·쓰기

- 역할 Developer / Orca managed Claude Code / worktree p2-l3 / base `483c0db`(P2-L1 병합). `npm ci` 완료. **병렬 레인: P2-L2(내보내기, 4337)와 동시 진행.**
- 정본: `docs/design/persistence/P2-SPEC.md` — **머리 "Jarvis 채택 결정" 우선**(이미지는 재인코딩 저장 · AC-P01 E는 SHA-256 동일이 아니라 "이미지 수·localId·형식·치수 동일 + 편집기 표시") · 3.1·3.5(쓰기 — DB_VERSION 2 + upgradeDatabase로 열기 · 한 트랜잭션 · gen+1 · saved · `design-studio-imported` 키 · 새로고침)·4.2·IM 문구·FX-1·I-S07 · 6절 번들 · 7절 AC-P01(E 왕복)·P02(E)·P04·P05(E)·P06·P07(가져오기)·P08(가져오기)·P11 · 8절 L3 행. `dev/active/p2-l1/REPORT.md`(`checkFile`·`checkImages`·`rekeyImport`·`mergeImport` API · 전수 점검 표) · P1d L3 `deleteProject.ts`·`tabLockHold.ts`(잠금·멈춤·새로고침 패턴 — 그대로 재사용).
- 쓰기 파일 = 8절 L3 행: `BrowserStorageSection.tsx`(버튼·hidden input) · 새 `components/projects/ImportProjectFileDialog.tsx`(+Slot) · 새 `features/projectFile/writeImport.ts` · `ClearDataDialog.tsx`·`DeleteProjectDialog.tsx`(FX-1 한 줄씩) · `features/projects/dialogText.ts`(IM-9 BUSY 상수) · **`ProjectsPage.tsx`(키·IM-15·포커스) = 레인 마지막 커밋으로 분리**(L2도 고치는 파일 — L2 먼저 병합 뒤 Jarvis가 main을 이 브랜치에 병합해 충돌을 해소; rebase 금지) + 각 테스트. **L2 파일(`ProjectRow`·`ProjectList`·`ExportProjectFileDialog`·`readProject`) 수정 0.**
- 번들: main `/studio` 129.09(멈춤 >129.65) · 복원 132.13 · `/profile` 99.87 / 100 · `/projects` 104.69 / 125. 이 레인 `/studio`·`/profile`·복원 몫 **0**. 검증·재인코딩·쓰기는 버튼 뒤 지연 import. 배선 첫 커밋 직후(**18턴 전**) build 실측 — 넘으면 멈추고 원인 모듈 REPORT.

## Ego Lite (필수 — P2 핵심 실측)
- build + `vite preview --port 4339` · 창 minimized면 normal · `captureBeyondViewport:false`+clip ≤4장(`dev/active/p2-l3/shots/`) · status/alert `textContent`·activeElement·IDB 덤프 evaluate 증거. 이미지 = 스크립트로 만든 단색 PNG만(`$TMPDIR`).
- 입력 파일: 이 레인 브라우저에서 `features/projectFile/encode`로 만든 파일 대신 **앱 화면으로 만들 수 없으므로**(내보내기 UI는 L2), 실측용 파일은 build된 앱 안에서 evaluate로 IDB를 읽어 `encodeProjectFile`과 같은 형식으로 만든다(또는 테스트 fixture 생성 스크립트 — 저장소 밖 `$TMPDIR`, 방법 REPORT 기록). L2가 먼저 끝나 그 레인이 남긴 내보내기 파일 경로가 있으면 그것을 써도 된다.
- 시나리오: ① 프로젝트(단색 PNG 1장·스냅샷 1개) → 파일 준비 → "이 브라우저 데이터 지우기" → 가져오기 → 요약 → 포커스 "가져오기" → 성공 새로고침 뒤 IM-15 1회 + 포커스 가져온 줄 → 편집기에서 문서·스냅샷·이미지 표시(이미지 IDB 레코드 형식·치수 일치) ② 같은 파일 2회 → `project-2`(또는 다음 id) · 포커스 새 줄 ③ 손상 파일(문자 하나 지움) → IM-2/IM-4 · IDB 레코드 수 불변 ④ 탭 B 편집기 쓰기 탭 상태에서 가져오기 → IM-9 1회·IDB 불변 → B 닫고 성공. ⑤ 가져오기 뒤 새로고침 → 모든 프로젝트 편집기 열림(AC-P05).
- 끝나면 `deleteDatabase("design-studio")` 결과 → 자기 공간만 `finish({keep:[]})` · `listTaskSpaces()` 기록(L2 공간 무접촉) · 서버 종료·4339 리슨 0. 영환님 창·main 5480 무접촉.

## 검증·금지
- TDD(RED 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지**). AC-P02 "IDB 쓰기 호출 0"·AC-P06 abort 원자성·Quota=IM-11 RED 출발. typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. **Codex는 Jarvis 몫.**
- 엔진·계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성·아이콘 0, 서브에이전트 0, push/merge/삭제 0(테스트 IDB 삭제·앱 지우기 실측 허용), 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 구현 커밋 28턴 전 · Ego Lite 30턴 전 시작·46턴 전 결과 커밋 · 50턴부터 게이트·REPORT만 · REPORT 초안 54턴 전 커밋. 한국어.
