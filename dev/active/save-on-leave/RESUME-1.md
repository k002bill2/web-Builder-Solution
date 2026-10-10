# SAVE-ON-LEAVE RESUME-1 — main 동기화 · 다운로드 제외 복원 · 기준선 합산 정리

- Jarvis 회수 판정: 기능·Codex r1·r2 반영·Ego 3/3은 수용. 병합 전 아래 3가지만.
- 같은 worktree·브랜치 이어서. 시간 상한 45분 · 최대 40턴 · 30턴부터 REPORT만. 공통 제약은 BRIEF.md 그대로.

## 순서
1. `git merge --no-ff main`(현재 main `d68006e` — FU-BLUR `ab5f71a`가 `/studio` +0.06/+0.07을 이미 올림). 충돌 나면 `scripts/m2cBaseline.json`·`bundleBudget.test.mjs`는 이 레인 값 기준으로 두고 4단계에서 실측으로 다시 맞춘다. amend·rebase 금지.
2. **다운로드 제외 복원**: 링크 가로채기에서 `a[download]`(내보내기 결과 다운로드)는 저장 대기·보류 대상에서 제외(`:not([download])` 등) — 저장 실패가 이미 만든 파일 다운로드를 막지 않게. RED(저장 실패 주입 상태에서 다운로드 링크 클릭 → 지금은 보류됨) → GREEN(다운로드 진행 · 저장 0회 대기 없음) 테스트를 `StudioLeave.test.tsx`에 추가.
3. 게이트: typecheck·lint·전체 vitest 1회 · build.
4. **기준선 정리**: 병합 후 build 실측값으로 `m2cBaseline.json` `eagerKb` 두 값과 `bundleBudget.test.mjs` 기대값을 같은 커밋에서 갱신. note에 "개정 15 배분 B-RS-01 — main 합산 실측(FU-BLUR 포함)" 한 줄. **상한: `/studio` ≤ 129.88 · 복원 ≤ 132.92**(개정 15 판정선 129.95·132.98 아래, RESTART MQ-S2 +0.03 몫과 잡음분 남김). 넘으면 멈추고 보고(감량 시도 금지 — 수치만).
5. REPORT에 "RESUME-1" 절(병합 결과 · 다운로드 테스트 RED→GREEN · 최종 실측 · 기준선 값) 추가 커밋. Codex는 생략(변경이 선택자 1개 + 테스트) — REPORT에 사유.
