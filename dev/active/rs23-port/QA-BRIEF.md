# RS23-PORT QA BRIEF — 이식 테스트 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis (2026-10-16)

## 대상
- 워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs23-reconcile` (브랜치 `k002bill2/rs23-reconcile`, HEAD `4e5d7518`, base `origin/main` `d09f0cd9`)
- 검증 대상 테스트 4개: `app/src/data/persistence/createLock.test.ts`, `app/src/data/persistence/restartRealRepo.test.ts`, `app/src/pages/ProfileRestartOtherTab.test.tsx`, `app/src/test/pendingImportGuard.test.ts`
- Developer 보고: `dev/active/rs23-port/REPORT.md` (5항목 GREEN, 2830 tests)

## 검증 항목
1. **검출력(Red-Green 역검증)** — 핵심. 아래 앱 동작을 하나씩 **임시로** 깨뜨려 해당 테스트가 FAIL하는지 확인하고, 매번 `git checkout -- app/src`로 즉시 되돌린다:
   - `app/src/data/memoryProjectRepository.ts:122` create 가드 조건을 무조건 가드 또는 가드 없음으로 변경 → RS3-AC-01·02·04 테스트
   - 프로필 흐름 파일 1곳에 `tryLock` import/호출 추가 → tryLock 가드
   - `StudioPage` 또는 `useDocSave`에 `pendingWrites` 동적 import 추가 → import 가드
   - 판정 로직(`restartFlow.ts`) C-E3/C-E4 분기 1곳 뒤바꿈 → RS3-AC-05 실저장소 테스트
   각 변이: 변경 내용 · 실패한 테스트 이름 · 되돌림 확인을 기록. FAIL이 안 나면 "검출 못함"으로 기록.
2. 단언이 SPEC-3 7절/SPEC-4와 일치하는지 표본 검토(특히 SPEC-4가 대체한 규칙을 옛 SPEC-3 기대값으로 고정하지 않았는지).
3. 기존 테스트 삭제·완화 0: `git diff origin/main -- app/`가 새 파일 4개 추가뿐인지.
4. 최종 fresh `npm test -- --run` 1회 + `git status --porcelain`에 app/ 변경 0.

## 제외
- 앱 코드·테스트 수정 커밋 금지(변이는 임시, 반드시 되돌림). push·원격 쓰기·다른 워크트리 접촉 금지. Codex 실행 금지.

## 산출물
- `dev/active/rs23-port/QA-REPORT.md`: 0. 판정(PASS / PASS with notes / FAIL) 1. 변이 표 2. SPEC 일치 검토 3. diff 범위 4. 명령·exit·수치 5. 사실/추정/미확인
- 로컬 커밋 1개(`dev/active/rs23-port/QA-REPORT.md`만, 명시 경로 add).

서브에이전트 분할: 불필요(변이는 같은 파일을 순차로 건드리므로 메인이 순차 실행).
