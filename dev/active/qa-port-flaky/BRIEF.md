# QA-PORT-FLAKY BRIEF — rs23-port-gaps · flaky-projects-alerts 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17

## 대상
- 워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/qa-port-flaky` (브랜치 `k002bill2/qa-port-flaky`, main `3454702f` + 두 브랜치 병합 커밋 `0fa484b7`·`5163af0b`)
- A. `k002bill2/rs23-port-gaps` (`99bc4d74`) — 테스트만 변경: `app/src/data/persistence/createLock.test.ts`, `restartRealRepo.test.ts`, 신규 `app/src/test/tryLockGuard.test.ts`. 보고: `dev/active/rs23-port-gaps/REPORT.md`
- B. `k002bill2/flaky-projects-alerts` (`7dd94e45`) — 앱 수정 `app/src/pages/ProjectsPage.tsx`(settled 조건) + 신규 `app/src/pages/ProjectsPendingGate.test.tsx`. 보고: `dev/active/flaky-projects-alerts/REPORT.md`
- `app/node_modules`는 Jarvis가 `npm ci` 완료.

## 검증 항목
1. **A 검출력 표본**: REPORT 변이 표 M3·M4·M5 중 2개와 tryLock 가드(별칭/네임스페이스 import 추가 → FAIL, 주석 속 단어 → PASS)를 임시 변이로 재확인. 매번 `git checkout -- app/src`로 되돌림. A에 `it.todo`·skip이 있으면 사유 기록.
2. **A 단언 범위**: `git diff 3454702f -- app/`에서 A 쪽은 테스트 파일만, 기존 단언 삭제·완화 0인지(특히 `createLock.test.ts`·`restartRealRepo.test.ts`의 `-` 줄 검토).
3. **B 원인·수정**: `ProjectsPage.tsx` 변경을 읽고 (a) 회귀 테스트가 수정 전 코드에서 RED인지 임시 되돌림으로 확인 (b) `pendingRows` import 실패 시 빈 상태·저장소 영역이 여전히 그려지는지(기존 테스트 근거 또는 임시 확인) (c) 로딩이 끝나지 않는 경로(목록 null·import 무한 대기)에서 화면이 빈 채로 남는 회귀가 없는지 코드로 판정.
4. **B 기존 단언 완화 0**: `ProjectsPage.test.tsx` diff 0 확인.
5. **통합 게이트(fresh, `app/`)**: `npm run typecheck`·`npm run lint`·`npm test -- --run` 2회·`npm run build`. exit·수치(파일/테스트 수, `/projects`·`/studio` 예산 줄)를 기록. 기대 대략 base 313/2830 + A·B 증분.
6. 최종 `git status --porcelain`에 `app/` 변경 0.

## 제외
- 앱·테스트 수정 커밋 금지(변이는 임시). push·원격 쓰기·다른 워크트리 접촉 금지. Codex 실행 금지. 브라우저 QA 불필요.

## 산출물
- `dev/active/qa-port-flaky/QA-REPORT.md`: 0. 판정 A·B 각각 PASS / PASS with notes / FAIL 1. 변이 표 2. diff 범위 3. B 경로 판정 4. 명령·exit·수치 5. 사실/추정/미확인
- `dev/active/qa-port-flaky/PROGRESS.md` 체크포인트 갱신
- 로컬 커밋 1~2개(`dev/active/qa-port-flaky/`만, 명시 경로 add).

서브에이전트 분할: 불필요(변이가 같은 소스를 순차로 건드림).
