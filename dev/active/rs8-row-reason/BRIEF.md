# RS8-2 BRIEF — 저장 코어 마지막 실패 사유(`view().reason`) · `/projects` stale 행 첫 표시 (B-RS-09) (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs8-row-reason` (브랜치 `k002bill2/rs8-row-reason`). Designer 생략 사유: 문구는 UX-5 2.3 원문(이미 `reasonText.ts`·`coreRowText.ts`에 있음), 새 화면 0.

## 승인 범위 (영환님 2026-10-18 "순서대로 진행해" — 직전 보고 2번 = B-RS-09 + 새 조회 인터페이스)
- **최소안 채택**: `SaveCore.view()`에 **마지막 저장 결과 사유 `reason?: string`(읽기 전용, 잠금 0)** 추가. 코어가 이미 받는 `failed{reason}` 결과를 기록하고, 다음 `saved`/clean 전환에서 지운다. `port.mode()`·`gate.enter()` 호출 추가 **금지**(Codex P2 — 잠금 획득). 별도 `peek()` 포트 메서드는 만들지 않는다(필요해지면 멈추고 보고).
- 공개 `ProjectRepository` 확장 0(MQ-6-1 A 유지) — `CoreKeeper.cores` 레지스트리 읽기만.

## 할 일
1. **CP1 코어**: `features/studio/save/{saveCore,coreIo}.ts` — reason 기록·해제 규칙(saved·discard·rebase(`rebased`)·memory `not-persistent` 각각) TDD. 기존 `view()` 소비처 영향 표(grep).
2. **CP2 행**: 되돌린 커밋 `bd3163a3`(`git show bd3163a3`)의 `ProjectsReasonRows.test.tsx` 3건·`pendingRows`/`coreRowText`/`pendingRetry` 판정을 **`port.mode()` 대신 `view().reason`** 으로 재적용. stale·cleared·readonly 행 첫 표시 = UX-5 2.3 문구·버튼 규칙(stale = "다시 저장" 숨김 등 — bd3163a3 의도 유지). 2벌 문구 가드(`coreRowText.test.ts`) 유지.
3. **잠금 회귀 가드(필수)**: `/projects` 행 판정·표시 과정에서 `navigator.locks.request`/`gate.enter`/`port.mode` 호출 0을 단언하는 테스트(스파이) — Codex P2 재발 방지. 변이: 판정에 `port.mode()` 재도입 → FAIL.
4. 예산: `/studio` 정규화 128.66 / 상한 129.13 · 복원 131.64/132.11 · `/projects` 첫 99.09/100 · 진입 109.53/125. **`/studio`·복원 증분 ≤ +0.05**, `/projects` 첫 ≤ 99.5. 넘으면 감량 1회 → 멈춤. 기준선 파일은 실측 상향 시에만 같은 커밋에서(개정 17 상한 안).
5. Ego Lite(짧게): build + preview `--port 4390 --strictPort` — 2탭(실제 `navigator.locks` held 기록) A writer · B 편집 → B 링크 이탈 → `/projects` 행 **첫 표시**가 stale/readonly 문구 · 이때 `navigator.locks.query()` held에 B 탭 writer 없음. 정리 필수.
- 쓰기 경로: `features/studio/save/**`·`features/projects/**`·`components/projects/**`·`pages/ProjectsPage.tsx`·기준선 2파일. **금지**: `features/profile/**`·`components/studio/**`(RS8-3 문서 레인과 무관하지만 범위 밖)·docs.
- TDD(RED 로그 `logs/`) · 기존 단언 약화·skip 0. fresh typecheck·lint·test(base 347/3035 + 증분)·build. Codex review 1회(`--scope branch --base 494a7c6f`) — 잠금·거짓 상태 관점 명시.
- 서브에이전트 분할: 불필요. 최대 80턴, 65턴부터 마감.

## 공통
- base origin/main `494a7c6f`. 병렬 레인 3개(`rs8-roadmap-status` · `rs8-row-reason` · `rs8-ux-polish-spec`) — 다른 레인 쓰기 경로 접촉 0.
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. REPORT 초안은 마감 10턴 전 커밋. 사실/추정/미확인 구분.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 출력 0을 REPORT에 기록.
- **마감 전 `git status --short`가 node_modules 외 빈 값**(로그도 커밋하거나 지운다).
