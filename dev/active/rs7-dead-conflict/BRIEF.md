# RS7-A BRIEF — 도달 0 충돌 경로 정리 (B-RS-07) · `/studio` 여유 회복 (B-RS-06) (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17 (영환님 "정리하고 다음 작업 진행하자")
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs7-dead-conflict` (브랜치 `k002bill2/rs7-dead-conflict`). Designer 생략 사유: 화면·문구 추가 0, 도달 0 코드 제거.

## 목적
RS6 L4 결정 ①(다른 탭 stale = stale 행) 뒤 `ConflictCallout`·`useDocSave.resolve`·`conflict` 상태가 제품에서 도달 0이다(`dev/active/rs6-l4-ux/REPORT.md` R2-2 표 · `dev/active/rs6-qa/REPORT.md` · BACKLOG B-RS-07). 이를 제거해 코드를 줄이고 `/studio` 여유(B-RS-06, 0.01)를 되찾는다.

## 절차
1. **CP0 도달 증명(삭제 전 필수)**: `STALE_DOC` 생산자·소비자 전수표(`grep -rn STALE_DOC app/src` — 비테스트 9파일). 각 생산 지점이 편집기 `conflict` 상태로 이어지는지 판정. **`restartFlow.ts`·`RestartDialog.tsx`·`ExportAfter.tsx`·`memoryDocBook.ts`·`projectRepository.ts`의 STALE_DOC는 다른 기능일 수 있다 — 편집기 충돌 경로와 무관한 것은 건드리지 않는다.** 도달 경로가 하나라도 있으면 그 경로를 REPORT에 쓰고 **삭제 중단**(멈추고 보고).
2. **CP1 제거**: 도달 0이 증명된 것만 — `ConflictCallout.tsx`(+lazy 래퍼) · `useDocSave.resolve` · 스케줄러 `stale` 단계/`save.conflict`가 도달 0이면 함께 · `DocConflict` 타입 · `coreIo`/`memoryDocBook.resolveConflict`는 **다른 호출처(스냅샷·restart rebase)가 있으면 유지**. 관련 단위 테스트(useDocSave 3 · ConflictCallout 3 · StudioLayout 등)는 삭제 사유를 표로. 삭제 대신 대체 단언이 필요한 것(예: "포트 stale → Callout 0")은 유지·이전.
3. **CP2 문서 정합 메모**: UX5-AC-04·05 · RS6-AC-B4 주석은 **수정하지 않는다**(문서 레인 아님). REPORT에 "충돌 경로 재도입 시 재판정" 인계 1줄.
4. 예산: 실측 하향분을 기준선 파일에 같은 커밋으로 반영(note "RS7-A 도달 0 정리").
- 쓰기 경로: `components/studio/**`·`features/studio/**`·`data/memoryDocBook.ts`·`app/scripts/m2cBaseline.json`·`app/scripts/bundleBudget.test.mjs`·`vite.config.ts`/`src/build/**`(청크 목록에서 ConflictCallout 제거가 필요할 때만). **금지**: `features/projects/**`·`components/projects/**`·`features/pending/**`·`features/profile/**`(RS7-B 경로).
- 실화면(짧게): build + preview `--port 4386 --strictPort` — 2탭 stale 행·버리고 새로고침 동작 그대로, 편집·저장·이탈 회귀 0. 정리 필수.
- 최대 70턴, 55턴부터 마감.

## 공통 규칙
- base origin/main `73289c90`(RS6 종료 PR #26). 병렬 레인 3개(`rs7-dead-conflict` · `rs7-rows-text` · `rs7-mutation-gaps`) — **다른 레인 쓰기 경로 접촉 0**.
- 예산(ADR-004 개정 17): `/studio` 정규화 129.12 / 상한 129.13 · 복원 132.10 / 132.11 · raw 130.43 / 130.5 · `/projects` 100/125 · `/profile` 첫 화면 99.52/100. **증분 금지**(줄면 좋다). 상한 초과 → 감량 1회 → 멈춤.
- 기준선 파일(`m2cBaseline.json`·`bundleBudget.test.mjs`)은 **`rs7-dead-conflict`만** 실측 하향 갱신 가능. 다른 레인 수정 금지. `check-bundle-size.mjs`·ADR·SPEC 수정 금지.
- TDD(RED 로그 `dev/active/<레인>/logs/`) · 기존 단언 약화·skip 0 — 바뀐 단언은 이전/이후·근거 표.
- fresh `typecheck`·`lint`·`npm test -- --run`(base 341/3027 ± 설명)·`build`. Codex review 1회(`--scope branch --base 73289c90`).
- `dev/active/<레인>/{PROGRESS,REPORT}.md`(사실/추정/미확인). 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. **REPORT 초안은 마감 10턴 전 커밋.** preview를 띄우면 반드시 종료·리슨 0.
- 서브에이전트 분할은 필요할 때만(레인당 ≤4, 쓰기는 worktree 격리).
