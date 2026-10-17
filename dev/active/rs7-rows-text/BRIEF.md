# RS7-B BRIEF — `/projects`·`/profile` 행 문구 정합 (B-RS-09 · B-RS-15 · B-RS-17) (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs7-rows-text` (브랜치 `k002bill2/rs7-rows-text`). Designer 생략 사유: 문구 원문은 UX-5(2.3·4.1 D1)에 있음 — 새 문장 0 목표, 필요하면 UX-5 원문만.

## 범위
1. **B-RS-09**: 다른 탭 stale 코어의 `/projects` 행 첫 표시가 일반 "저장하지 못했습니다"+"다시 저장"이다(`pendingRows.ts:35-42`가 inflight·dirty만 읽음). 행 판정이 코어 reason(stale·cleared·readonly)을 읽어 **처음부터** 맞는 문구·버튼을 보이게(stale면 UX-5 2.3 stale 문구 · "다시 저장" 숨김 또는 UX-5가 정한 버튼). 같은 문자열 2벌(`coreRowText.ts:18`·`save/reasonText.ts`) — `reasonText.ts`는 **RS7-A 경로라 수정 금지**; `/projects` 쪽에서 import로 1벌화가 `/studio`·`/projects` 바이트를 늘리면 2벌 유지 + 가드 테스트(두 문자열 동일 단언)로 대체하고 REPORT에 근거.
2. **B-RS-15**: `retryRow` 폴백이 기억·코어 모두 없을 때 `{ok: true, "다시 저장했습니다"}` — 저장 0인데 성공 문구. 폴백을 거짓 성공이 아닌 결과(행 새로고침 + 중립 문구 또는 무문구)로. 경합 재현 테스트를 RED로.
3. **B-RS-17**: `/profile` "저장 다시 시도"(`restartText`) → UX-5 D1 "시작 다시 시도". `/profile` 첫 화면 여유 0.48 — 증분 0 목표.
- 쓰기 경로: `features/projects/**`·`components/projects/**`·`features/pending/**`·`features/profile/restartText*`(+그 테스트)·`pages/ProjectsPage.tsx`. **금지**: `components/studio/**`·`features/studio/**`·`data/**`(RS7-A) · 기준선 파일.
- 실화면(짧게): build + preview `--port 4387 --strictPort` — 2탭 stale 행 첫 표시 · `/profile` 버튼 문구. 정리 필수.
- 최대 60턴, 45턴부터 마감.

## 공통 규칙
- base origin/main `73289c90`(RS6 종료 PR #26). 병렬 레인 3개(`rs7-dead-conflict` · `rs7-rows-text` · `rs7-mutation-gaps`) — **다른 레인 쓰기 경로 접촉 0**.
- 예산(ADR-004 개정 17): `/studio` 정규화 129.12 / 상한 129.13 · 복원 132.10 / 132.11 · raw 130.43 / 130.5 · `/projects` 100/125 · `/profile` 첫 화면 99.52/100. **증분 금지**(줄면 좋다). 상한 초과 → 감량 1회 → 멈춤.
- 기준선 파일(`m2cBaseline.json`·`bundleBudget.test.mjs`)은 **`rs7-dead-conflict`만** 실측 하향 갱신 가능. 다른 레인 수정 금지. `check-bundle-size.mjs`·ADR·SPEC 수정 금지.
- TDD(RED 로그 `dev/active/<레인>/logs/`) · 기존 단언 약화·skip 0 — 바뀐 단언은 이전/이후·근거 표.
- fresh `typecheck`·`lint`·`npm test -- --run`(base 341/3027 ± 설명)·`build`. Codex review 1회(`--scope branch --base 73289c90`).
- `dev/active/<레인>/{PROGRESS,REPORT}.md`(사실/추정/미확인). 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. **REPORT 초안은 마감 10턴 전 커밋.** preview를 띄우면 반드시 종료·리슨 0.
- 서브에이전트 분할은 필요할 때만(레인당 ≤4, 쓰기는 worktree 격리).
