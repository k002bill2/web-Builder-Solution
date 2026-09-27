# EDITOR-A1-BETA 재개 브리프 (RESUME-1)

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 작업 공간 `editor-a1-beta`, 브랜치 `k002bill2/editor-a1-beta` HEAD `90e9d89` (= 이전 0단계 커밋 `9d1ae3e` + main `cdbad18` 병합 `4d2de87` + 재개 기준 실측). 포트 4337.
- 원 브리프 `docs/06-handoff/EDITOR-A1-BETA_BRIEF.md`와 이전 REPORT `dev/active/editor-a1-beta/REPORT.md`를 먼저 읽는다. SPEC `docs/design/2a-05/SPEC.md` r3(2.1~2.5, 10, 11.1 J-AC, 12.1~12.4, 13.1 a1 행). SPEC 재설계 금지.
- 영환님 결정 ★A: 여유 확보(`compare-headroom-c8`, main 반영) 뒤 a1-β 재개.

## 0단계 재판정 (Jarvis 실측, `dev/active/editor-a1-beta/logs/resume-base-build.txt`) — 통과
- 공통 89.32 · `/compare` 98.39 / 121.25 (여유 1.61) · `/catalog` 99.63 / 102.01 (여유 **0.37**) · `/profile` 99.38 / **124.62** (진입 직후 여유 **0.38**) · `/projects` 93.64 / 106.18 · `/studio/:projectId` 90.71 / 103.43.
- 남은 0단계 항목: **S-B9 보드 확정 대상** — 이제 `/compare` 여유가 충분하므로 **SPEC 원안(라디오 첫 화면)**으로 구현하고 실측. 대체안 1(J-S10 문구 개정) 쓰지 않는다.
- 구속 조건이 바뀌었다: 이제 가장 빠듯한 곳은 **`/catalog` 첫 화면(0.37)**과 **`/profile` 진입 직후(0.38)**. 공통 JS를 늘리는 변경(store 레코드 확장, AppHeader, routes)은 매번 build로 두 값을 확인. 하나라도 여유 0.3 미만이면 예산·분류 변경 없이 실측·REPORT 커밋 후 **중지**.

## 1단계 (원 브리프 "1단계 이후 범위" 그대로)
- store 프로젝트 레코드(자리 구현 → 실제), `/projects` 목록·`/studio/:projectId` 라우트 완성, GNB, 프로필 "프로젝트: <이름>" 링크, "편집 시작" 연결, SPEC 12.4 깨질 테스트 8건 처리(단언 의미 보존, 삭제·완화 금지), 미사용 `ProfileList.tsx`·`useProfileList.ts` 정리.
- 추가(QA `docs/qa/profile-visual-align/REPORT.md` D3): 390에서 헤더 Tab 순서가 보이는 순서와 어긋남(로고 → 메뉴 → "새 프로젝트"). AppHeader를 고치는 김에 DOM 순서 = 보이는 순서로 맞춘다(번들 증가 0 목표).
- Q-17~24 결정 금지 — startDoc 등이 Q17에 걸리면 중지·보고.

## 검증
- TDD RED→GREEN. 전체 vitest 1회 · typecheck · lint · build(로그+exit). 번들 전후 표(위 재판정 값 기준).
- 127.0.0.1:4337 실제 클릭: /catalog → 비교 → 확정(대상 라디오) → /profile/:id(프로젝트 링크) → 편집 시작 → /studio/:projectId, /projects 목록·이름 변경. 1280/768/390 캡처. 390 헤더 Tab 순서 기록. 자기 PID만 종료 + lsof.
- 서브에이전트 분할: 권장(12.4 테스트 처리 ∥ store·라우트 구현 조사 — 쓰기는 worktree 격리, 같은 파일 금지).
- `--max-turns` 100, 80턴부터 REPORT 우선. 단계마다 PROGRESS 커밋. push·병합·삭제 금지. fable 무접촉.
- REPORT: 로컬 SHA, 변경 파일, 번들 표, 캡처, 12.4 처리 목록, 미검증, 결정 필요.
