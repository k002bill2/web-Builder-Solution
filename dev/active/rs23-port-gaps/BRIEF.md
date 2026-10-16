# RS23-PORT-GAPS BRIEF (Developer)
책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-16
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs23-port-gaps` (브랜치 `k002bill2/rs23-port-gaps`, base origin/main `3454702f`)
근거: main의 `dev/active/rs23-port/QA-REPORT.md` 5절 notes 1~3.

## 범위 (테스트만 — 앱 코드 수정 금지)
1. **RS3-AC-04 ①·② 검출력**: `app/src/data/persistence/createLock.test.ts:124,138` 테스트가 잠금 재요청·`tabLockHold` 동작이 깨지면 FAIL하는지 변이로 확인(예: writer 재사용 분기 제거, tabLockHold 해제 누락). FAIL 안 나면 단언을 보강해 검출되게 한다. 변이는 임시, 매번 `git checkout -- app/src`로 되돌림.
2. **tryLock 가드 강화**: 같은 파일 :168 텍스트 정규식 대신 주석 제거 후 import 그래프 기준(모듈 지정자 `writerLock` import 여부 + 식별자 사용)으로 판정. `app/src/test/pendingImportGuard.test.ts`의 검출기 방식을 재사용해도 된다. 주석 속 단어 = 통과, 별칭/네임스페이스 import(`import * as w from ".../writerLock"`) = FAIL을 검출기 자체 테스트로 고정.
3. **미이식 단언**: RS3-AC-05 "before 읽기 실패 → C-E5"·"C-E4 상태 편집기 이동 0", RS3-AC-07b 프로필 R-E4 재시도 경로 + create(C-E4) 변형 + "반영되지 않았다" 문장 0 — SPEC-4 기대값 우선(`docs/design/restart/SPEC-4.md` 4절·6절). 원본은 `git log`로 찾을 수 없으므로 SPEC-3 7절 문장에서 직접 작성. RED가 나면 앱 수정하지 말고 원문·원인을 REPORT에 기록하고 그 테스트는 `it.todo`로 남김.
- 수정 파일 범위: `app/src/data/persistence/createLock.test.ts`, `app/src/data/persistence/restartRealRepo.test.ts`, 필요 시 신규 `app/src/test/*.test.ts`. **`app/src/pages/ProjectsPage.test.tsx`는 다른 레인 소유 — 접촉 금지.**

산출물: `dev/active/rs23-port-gaps/REPORT.md`(변이 표 포함), `PROGRESS.md`
서브에이전트 분할: 권장(항목 3 단언 작성 ∥ 항목 2 검출기, 서로 다른 파일, 쓰기는 isolation: worktree, 최대 2개) / 항목 1 변이와 통합 검증은 메인이 직접.

## 공통 규칙
- 먼저 `cd app && npm ci`(설치 부산물·`package-lock.json` 변경은 커밋 금지, `git add`는 명시 경로만).
- push·merge·원격 쓰기 금지. 다른 워크트리 접촉 금지. 예산 판정선·ADR·SPEC 수정 금지. 새 의존성 금지. Codex 실행 금지.
- 체크포인트마다 `dev/active/rs23-port-gaps/PROGRESS.md` 갱신 + 로컬 커밋.
- 마지막에 `app/`에서 `npm run typecheck`·`npm run lint`·`npm test -- --run`·`npm run build` fresh 실행, exit·수치를 REPORT에(base main `3454702f` = 313 files / 2830 tests).
- REPORT는 사실/추정/미확인을 구분한다.
