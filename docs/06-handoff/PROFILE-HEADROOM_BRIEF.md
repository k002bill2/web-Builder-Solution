# PROFILE-HEADROOM — `/profile` 진입 직후 여유 확보 (a1-β 선행)

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 작업 공간 `profile-headroom`, 브랜치 `k002bill2/profile-headroom`, HEAD `f8bc3ef` = main `17f5cc9` + editor-a1-beta `c035888`(store 확장 포함). 포트 4339.
- 영환님 결정 ★A(2026-09-27): a1-β 1단계 화면 연결 전에 `/profile` 여유를 먼저 확보한다. ADR-004 예산·분류 변경은 거부됨.
- 기준 실측(Jarvis, `dev/active/profile-headroom/logs/baseline-build.txt`): `/profile` 99.40 / **124.80**(진입 직후 여유 0.20) · `/catalog` 99.64 · `/compare` 98.41 / 121.37 · 공통 89.34. 진입 직후에 붙는 것: `memoryStudio` 4.36(보드·프로필·생성 메모리 구현 + store) 등.
- **목표: `/profile` 진입 직후 −0.40KB 이상(≤ 124.40)**. 근거: a1-β 남은 화면 연결 +0.05~0.10(L3) 뒤에도 여유 ≥ 0.3. 다른 시나리오 첫 화면·진입 직후 순증가 0(특히 `/catalog` 여유 0.36 · 공통).

## 방법 (선례를 먼저 읽는다)
- 선례: `dev/active/compare-headroom-c8/REPORT.md`(보드 첫 화면 → 엔진 청크), `docs/perf/bundle-01/REPORT.md`(C8 등 후보), `dev/active/2a-04b1/REPORT.md` 438~470행(FIX3 조작 뒤 청크), `dev/active/editor-a1-beta/REPORT.md` 1절(`memoryStudio` +0.10 분해 · 효과 없던 실험 2개 — 되풀이 금지).
- 0단계: 진입 직후 `/profile` 구성 청크별 크기 표 + 후보 3개 이상(각 L2 실측: 하나씩 적용 → build)을 PROGRESS에 먼저 커밋.
- 방향(후보 예): 진입 때 꼭 필요 없는 코드(첫 조회 뒤 조작에서만 쓰는 검증·보조·쓰기 경로)를 조작 뒤 청크(`writeBodyLoader.ts` 로더 재사용, 새 로더를 늘리지 않는 쪽 우선)로 옮김. `memoryStudio`를 읽기/쓰기로 나누기. `ProfilePage` 청크에서 첫 화면 밖 부품 lazy.
- 동작·문구·접근성·로딩 상태는 바꾸지 않는다. 조작 뒤로 옮긴 코드는 첫 조작 때 로딩 상태가 SPEC에 맞는지 테스트로 보인다(CompareBoardEngineLoading 방식).

## 금지
- 예산 상수·분류·`check-bundle-size.mjs` 판정 로직 변경. `engine` 런타임 import. 새 의존성. 단언 약화·삭제·skip. `design/`·`docs/design/`. a1-β가 이어서 만질 화면 연결(프로필 프로젝트 링크·편집 시작·S-B9 라디오)을 먼저 구현하지 않는다. fable 무접촉.

## 검증
- TDD(옮긴 경로 로딩·실패 상태 RED→GREEN). 전체 vitest 1회 · typecheck · lint · build(로그+exit). 번들 전후 표(모든 시나리오).
- 127.0.0.1:4339 실제 흐름: `/catalog` → 비교 → 확정 → `/profile/:id` 보정·조정 저장·3안 생성 1회. 자기 PID만 종료 + lsof.
- 서브에이전트 분할: 권장(후보별 실측을 읽기 전용 조사로 병렬 — 쓰기는 메인만, 또는 worktree 격리).
- `--max-turns` 60, 45턴부터 REPORT 우선. 단계마다 로컬 커밋. 목표 미달이면 달성분·남은 후보를 REPORT에 남기고 중지. push·병합·삭제 금지.
- REPORT `dev/active/profile-headroom/REPORT.md`: SHA, 변경 파일, 후보별 실측, 번들 표, 로딩 상태 테스트, 미검증.
