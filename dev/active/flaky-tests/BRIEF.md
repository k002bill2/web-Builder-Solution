# FLAKY-TESTS Developer 브리프 — 부하 시 흔들리는 테스트 안정화

- 역할 Developer / Orca managed Claude Code / worktree flaky-tests / base `a75f12e`. `npm ci` 완료. **병렬 레인: FIX-SIZE-LABEL(`ImportProjectFileDialog.tsx`+그 테스트) — 그 두 파일 수정 0.**
- 배경(관찰 3회 — 모두 병렬 레인 부하·build 직후에 전체 vitest 1회차만 실패, 단독·재실행 통과):
  1. P1D-L3 1차 Jarvis 검증 vitest-2: 10건 — `ProfileGenerateLoad.test.tsx`("받는 동안 버튼 aria-busy…" 5000ms 타임아웃) · `StudioPage.test.tsx`(문서 있음 → 편집 틀, "불러오는 중…"에 머묾) · `SectionMove.test.tsx` 2 · `SectionVariant.test.tsx` · `StudioLayoutImages.test.tsx` 2 · `trayBoard.test.tsx` 3. 로그: `/Users/younghwankang/.hermes/profiles/jarvis/cache/scratch/p1d-l3-final-gates/vitest-2.txt`가 덮였을 수 있음 — 남아 있지 않으면 아래 재현으로.
  2. P2-L1 수정 레인: `SectionAdd.test.tsx` 포커스 1건.
  3. P2-L2 수정 레인: "편집 · FAQ" heading 단언 1건.
- 목표: 원인을 **테스트 쪽**에서 찾아 고친다 — 고정 타임아웃·실시간 대기(`setTimeout` 실시간 경과에 의존)·`findBy` 기본 1000ms 대기·지연 import(lazy 청크) 첫 로드·전역 상태 누수(테스트 간 store/IDB 가짜/BroadcastChannel/locks 정리 누락)·`vi.useFakeTimers` 해제 누락 등. **단언 약화·skip·retry 추가·전역 testTimeout 상향으로 덮기 금지**(필요한 대기는 조건 기반 `waitFor`/명시적 의존성 주입으로). 앱 코드 변경은 테스트 가능성을 위한 최소 주입만, 동작 변경 0.
- 재현: 부하를 걸어 재현 — 예: `npx vitest --run` 을 `--pool=forks --poolOptions.forks.singleFork=false` 기본으로 2개 동시 실행 또는 `stress`성 병렬(`npm run build`와 동시) 3회. 재현 명령·실패 목록·횟수를 PROGRESS에 표로. 재현이 안 되면 위 목록 파일의 대기 패턴을 정적 점검해 위험 패턴만 고치고 "재현 실패" 정직 기록.
- 검증: 고친 뒤 같은 부하 조건으로 **전체 vitest 5회 연속 exit 0**(부하 동시 실행 포함) · typecheck·lint·build exit 0 · REPORT(원인별 표: 파일:줄 · 원인 · 수정 · 근거). Ego Lite 생략(UI 변경 0 — 사유 기록). Codex는 Jarvis 몫.
- 금지: 엔진·계약·docs·lock·CLAUDE.md 수정 0 · vitest 설정의 전역 타임아웃·retry 변경 0 · 새 의존성 0 · 서브에이전트 0 · push/merge/삭제 0 · amend·rebase 금지 · `set -o pipefail` · 승인 실패 우회 금지.
- 턴: BRIEF P0 3턴 전 · 재현표 커밋 14턴 전 · 수정 커밋 30턴 전 · 36턴부터 5회 검증·REPORT만 · REPORT 42턴 전. 한국어.
