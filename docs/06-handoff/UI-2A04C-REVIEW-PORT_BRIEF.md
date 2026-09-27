# UI-2A04C-REVIEW-PORT — /code-review 수정 2커밋을 main 구조로 이식

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 작업 공간 `ui-2a04c`, 브랜치 `k002bill2/ui-2a04c` HEAD `a38fddd`. 포트 4341.
- 대상 커밋(main에 없음): `d459813` fix(2a-04c): 선택·조회 응답 순서 경쟁 · 끝난 잡 재계측 · 경고 key 중복 (/code-review 반영), `a38fddd` test(2a-04c): 생성 흐름 테스트가 계산 청크 첫 로드를 기다리게. 근거는 `dev/active/ui-2a04c/REPORT.md` 9절과 `logs/red-green-4-review-fixes.log`.
- 문제: main(`cdbad18`)은 그 사이 `profile-v2-compact`·`profile-visual-align`에서 3안 카드 로그·경고를 **접힘(상세) 구조**로 바꿔 `CandidateCard.tsx`·`ProfileCandidates.test.tsx`가 충돌한다(`git merge-tree --write-tree main k002bill2/ui-2a04c` → 두 파일 CONFLICT).
- **목표**: 이 브랜치에 `git merge --no-ff main`을 하고 충돌을 해결한다. **main의 카드 구조·접근성·문구를 기준**으로 두고, 이 브랜치의 수정 의미 3건(선택 응답은 선택한 안만 반영 + 마지막 선택 기억 / 끝난 잡이면 계측·알림 재발행 없음 / 경고 key에 순번)과 회귀 테스트 2개·테스트 대기 수정을 옮긴다. 기능 추가 없음.

## 쓰기 범위 / 금지
- 쓰기: `app/src/features/profile/{CandidateCard.tsx,useGeneration.ts}`, `app/src/data/writeBodyLoader.ts`(주석만), `app/src/pages/ProfileCandidates.test.tsx`, `dev/active/ui-2a04c/`.
- 금지: 다른 profile 파일 구조 변경, compare·engine·domain·라우트·레이아웃·AppHeader(병렬 레인 `editor-a1-beta`가 수정), 번들 스크립트·예산, `design/`·`docs/design/`, 새 의존성, 단언 약화·삭제·skip·retry.

## 검증
- 회귀 테스트 2개가 수정 되돌리면 실패·복원하면 통과(RED/GREEN 로그 갱신). `ProfileCandidates.test.tsx` 단독 5회 연속 통과. 전체 vitest 1회 · typecheck · lint · build(로그+exit).
- 번들: main 기준 `/profile` 99.56 / 124.74 — **순증가 ≤ 0**(진입 직후 여유가 이미 0.26으로 멈춤선 아래; 늘리면 중지·보고).
- 서버 실측은 선택(필요하면 4341, 자기 PID만 종료 + lsof).
- 서브에이전트 분할: 불필요.
- `--max-turns` 30, 22턴부터 REPORT 우선. 병합 커밋·체크포인트를 로컬 커밋. push·main 병합·삭제 금지. fable 무접촉.
- REPORT(9절 뒤에 10절 추가): 충돌 해결 방식, 옮긴 수정 3건 위치, 로그, 번들, 미검증.
