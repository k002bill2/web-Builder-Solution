# EDITOR-A1-BETA 재개 브리프 2 (RESUME-2) — 1단계 화면 연결 마무리

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 작업 공간 `editor-a1-beta`, HEAD = `770648b` 이후(= `8231e9b` + D3 결정 기록 `66cb86e` + profile-headroom 병합 `770648b`). 포트 4337.
- 먼저 읽기: 이 문서 · `docs/06-handoff/EDITOR-A1-BETA_RESUME-1.md` · `dev/active/editor-a1-beta/REPORT.md` 7·8절(BLOCKED 목록).
- 재개 기준 실측(Jarvis, `dev/active/editor-a1-beta/logs/resume2-base-build.txt`): `/profile` 99.40 / **124.23**(진입 직후 여유 0.77, 첫 화면 0.60) · `/catalog` 99.64(**0.36 — 가장 빠듯**) · `/compare` 98.41 / 120.81 · 공통 89.34.

## 남은 범위 (REPORT 7절 BLOCKED 항목 — 이것만)
1. **S-B9 보드 확정 대상 라디오**(J-S09·J-S10·J-S11, SPEC 2.5 원안, 보드 첫 화면). 저장소 쪽(`createProfileVersion(…, "new")`)은 준비됨.
2. **프로필 머리 "프로젝트: <이름>" 링크** → `/projects`(SPEC 12.1·2.3).
3. **"편집 시작" → `/studio/:projectId` 이동**(12.3). 문서는 만들지 않는다 — 편집기는 E-S03(문서 없음) 셸을 보인다. `startDoc`·engine 호출은 **a2 D 레인 몫**(SPEC r4 8.2.1, 영환님 결정 Q-17·Q-18·Q-21·Q-24 — `k002bill2/editor-a2-spec`)이라 여기서 구현하지 않는다.
4. **P-AC-29 복구**: 기대 경로를 `/studio/:projectId`로(단언 의미 보존 — 선택 유지·aria-disabled·이유 문장 그대로).
5. `/studio/:projectId` 셸이 실데이터(프로젝트 이름·E-S03)를 보이는지 실제 클릭 확인.

## 번들 게이트
- 변경마다 build. 모든 시나리오 첫 화면 ≤100 · 진입 직후 ≤125 · **여유 ≥0.3**. 특히 `/catalog` 첫 화면(0.36)·`/profile` 첫 화면(0.60)·`/compare` 첫 화면(1.59). 미달이면 예산·분류 변경 없이 실측·REPORT 커밋 후 중지.
- 공통 JS 순증가 0 목표(라디오·링크·이동은 각 라우트 청크 안).

## 검증
- TDD RED→GREEN. 전체 vitest 1회(실패 0이 목표) · typecheck · lint · build(로그+exit).
- 127.0.0.1:4337 실제 클릭: `/catalog` → 비교 → 확정(라디오 "새 프로젝트"·"현재 프로젝트") → `/profile/:id` 프로젝트 링크 → 3안 → B안 선택 → "편집 시작" → `/studio/:projectId`(E-S03) → "프로젝트로 돌아가기". 1280·390 캡처. 자기 PID만 종료 + lsof.
- **Codex 리뷰**: 사용 한도가 15:26 해제됨. `review --scope branch --base ffb0063` 1회(최대 3라운드). 실패하면 대체 독립 리뷰 + BLOCKED 기록.
- 서브에이전트 분할: 권장(S-B9 라디오 ∥ 프로필 링크·편집 시작 — 쓰기 파일 분리, worktree 격리).
- `--max-turns` 70, 55턴부터 REPORT 우선. 단계마다 로컬 커밋. push·main 병합·삭제 금지. fable 무접촉. Q-19·20·22·23 결정 금지.
- REPORT: 새 절 "RESUME-2" 추가(SHA, 파일, 번들 표, 테스트, 캡처, Codex, 남은 것).

## 이어받기 (RESUME-2b, Jarvis 2026-09-27 15:4x)
- 3번째 실행이 21턴에 **API rate limit**(429)으로 중단. S1 진행분을 Jarvis가 WIP 커밋으로 보존(`DraftPanel`·`DraftSummaryBar`·`draftLabels`·`useCompareBoard`·`CompareBoardPage` + 새 `CompareBoardTarget.test.tsx`, tsc 통과 · 테스트 미실행).
- **먼저** `git show HEAD --stat`과 새 테스트를 읽고, 표적 테스트 실행으로 S1이 RED/GREEN 어디인지 판정한 뒤 이어서 S1 → S2 → S3 → S4~S7.
- **서브에이전트 분할: 불필요**(rate limit 완화 — 이번 실행은 메인 단독). 이전 서브에이전트 worktree(`.claude/worktrees/agent-a6c8fc…`)는 쓰지 않는다.
- Codex review는 S4 뒤 1회. 한도·실패면 BLOCKED 기록 후 진행.
