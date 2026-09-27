# EDITOR-A1-BETA — 2a-05a1 나머지: 프로젝트 IA 연결 (번들 실측 우선) 

> 기준 main `5562dc2`(profile-v2-compact + editor-a1-alpha 병합). 작업 공간 `editor-a1-beta`. 병렬 레인: QA `qa-profile-visual`(읽기 전용, `docs/qa/profile-visual/`만 씀, 포트 4341) — 쓰기 경로 겹침 없음. main 전체 게이트는 Jarvis가 동시에 실행 중.
> 체크포인트: `dev/active/editor-a1-beta/PROGRESS.md`를 단계마다 갱신·로컬 커밋(턴 한도 대비).

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis.
- 설계: `docs/design/2a-05/SPEC.md` r3 — 2.1~2.5, 10(번들), 11.1 J-AC, 12.1·12.2·12.3·12.4, 13.1 a1 행. SPEC 재설계 금지.
- a1-α 산출(`dev/active/editor-a1-alpha/REPORT.md` "a1-β로 넘길 연결 지점" 1~6)을 연결한다.
- Designer 생략 사유: SPEC r3(Designer 작성)이 구조·상태·수용 기준을 확정. 단 S-B9 대체안 1을 쓰면 J-S10 문구 개정이 필요 → 멈추고 보고(Designer 경유).

## 0단계 — 번들 실측 게이트 (코드 작성 전 필수, 결과를 REPORT 먼저 커밋)
Jarvis 사전 검토(추정, L3):
- 기준(profile-v2-compact `96fcee2` 실측, 병합본과 코드 동일): 공통 89.13 · `/compare` 첫 화면 **99.66(여유 0.34)** / 진입 직후 120.57 · `/profile` 99.54 / **124.67(여유 0.33)**. 병합본에서 다시 잰다.
- **구속 조건은 `/compare` 첫 화면**(여유 0.34, 멈춤선 0.3). SPEC 10.4 공통 순증가 추정 +0.04~0.14가 그대로 더해지면 멈춤선 아래 또는 초과 가능. S-B9 보드 라디오(+0.10~0.20)까지 더하면 **초과가 유력**.
- 따라서 순서: (a) 공통 변경(S-B1①②·S-B2·S-B3)을 상쇄 1·2순위(PlaceholderPage lazy 제거, "새 프로젝트" Link화)와 **같은 커밋**으로 넣고 S-B11 전 시나리오 실측, 공통 전후 따로 기록. (b) S-B9는 **대체안 1(조작 뒤 청크 + 캡션 한 줄)부터 실측**하고, 라디오 첫 화면안은 여유가 0.3 이상 남을 때만.
- 판정: 모든 라우트 첫 화면 ≤100 · 진입 직후 ≤125 · **여유 ≥0.3**. 하나라도 어기면 예산·분류 변경 없이 실측·REPORT 커밋 후 **중지**. S-B9 대체안 1 적용 시 J-S10·J-AC-05 문구 개정 필요 → 중지·보고.
- S-B10(`/profile` 목록 코드 → `/projects`)은 `/profile` 청크 감소 요인 — 실측으로 확인.

## 1단계 이후 범위 (0단계 통과 시)
- store: 프로젝트 메모리 구현(`ProjectRepository`, a1-α 인터페이스) · 보드 확정 대상 `current|new`·트랜잭션 ④·멱등 키(12.2).
- 라우트: `/projects` lazy · `/studio/:projectId` 집중 모드 셸(E-S01~S04, a1-α 빈 상태 재사용) · `/studio`·`/profile` → `/projects` Navigate replace.
- GNB 목적지(12.1) · 프로필 화면 "프로젝트: <이름>" 링크(12.1) · 편집 시작 → `/studio/:projectId` + `startDoc`(12.3, 8.3.1).
- 12.4 깨질 테스트 처리(단언 의미 보존, 삭제·완화 금지).
- **금지**: Q-17~24 관련 계약(`createDocFromCandidate` 3번째 인자 등) 결정·변경 — 미승인. `startDoc`이 Q17에 걸리면 멈추고 보고. engine 코드 변경 금지(`import type`만). 새 의존성·아이콘 금지. `design/`·`docs/design/` 수정 금지.

## 검증
- TDD RED→GREEN, J-AC-01~10 · E-AC-01·02. 전체 vitest 1회·typecheck·lint·build 로그+exit.
- 127.0.0.1:4337 실제 클릭: 보드 확정(첫/재확정 current·new) → 프로필 → 3안 → 편집 시작 → `/studio/:id` 셸, `/projects` 목록·이름 바꾸기. 5폭 캡처(J-AC-10 포함), 가로 넘침·포커스. 자기 PID만 종료+lsof.
- 서브에이전트 권장 2(store·트랜잭션 ∥ 라우트·GNB·화면), 쓰기 worktree 격리. 0단계 실측·통합은 메인.
- `--max-turns` 100, 80턴부터 REPORT 우선. push·병합·삭제 금지. fable 무접촉.
