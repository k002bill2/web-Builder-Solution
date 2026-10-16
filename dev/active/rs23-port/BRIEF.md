# RS23-PORT BRIEF — rs23-impl 회귀 테스트 5건을 main API로 이식 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis (2026-10-16)

## 목적
`dev/active/rs23-reconcile/REPORT.md` 3절의 "이식 필요 5건"을 main(`d09f0cd9`, RS4 병합본) 코드에 맞춰 **테스트로** 다시 작성해 RS3-AC 회귀를 고정한다. RS4-AC-15는 RS3-AC-01·02·04 "유지"를 명시한다.

## 대상
- 워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs23-reconcile` (브랜치 `k002bill2/rs23-reconcile`, `node_modules` 설치됨)
- 원본 테스트 참고: `git show k002bill2/rs23-impl:app/src/data/persistence/createLock.test.ts`, `...:app/src/features/projects/unconfirmedStart.test.ts` (읽기만. 체크아웃·수정 금지)
- 정본: `docs/design/restart/SPEC-3.md` 7절, `docs/design/restart/SPEC-4.md` (SPEC-4가 대체한 규칙은 SPEC-4가 우선)

## 이식 항목 (REPORT 3절 순서)
1. P1 RS3-AC-04 ①같은 탭 writer restart 잠금 재요청 0 ②비쓰기 탭 파괴 흐름 busy·실패 뒤 create 자기 잠금 거절 0 ③쓰기 탭 삭제 실패(싱크 멈춤) 뒤 create = cleared 사유·쓰기 0 + 프로필·`/projects` 흐름 코드 `tryLock` 직접 호출 0 가드
2. P1 RS3-AC-01 create stale(C-E2b)·unsupported(C-E3 기본 사유)·cleared(C-E2c) 각각 메모리·IDB 쓰기 0
3. P2 RS3-AC-02 다른 탭 writer + IDB 저장 문서 → 프로필 편집 시작 F2 이동(가드 호출 0) / 다른 안 F4 · 기억 0 · `/projects` 링크 유지
4. P2 RS3-AC-10[U] R-E4 뒤 편집 저장 1회 성공 → IDB = 메모리 + "새로 시작 전" 스냅샷 1 · RS3-AC-07b 실저장소 IDB 단언 · RS3-AC-05 create 실저장소 단계 주입(request·commit = C-E3, response·flush = C-E4, 거짓 양성 0) — 단, SPEC-4 판정표와 다르면 SPEC-4 기대값으로 쓴다
5. P2 RS3-AC-12 대응 `pendingWrites` 정적·동적 import 간선 가드(`StudioPage`·`StudioLayout`·`useDocSave`·`memoryProjectRepository`·`CandidatesSection`에서 0)

## 규칙
- **테스트 파일만 추가·수정한다.** 기존 단언 삭제·완화 금지.
- 이식한 테스트가 RED이면(= main 동작 누락) **앱 코드를 고치지 말고** 그 테스트를 `it.todo` 또는 별도 커밋 없이 보류하고, REPORT에 RED 원문·원인 추정·필요한 동작 변경을 기록한 뒤 다음 항목으로 진행한다. 동작 이식은 별도 승인 범위.
- 예산 판정선·ADR·SPEC 수정 금지. 새 의존성 금지. push·merge·원격 쓰기 금지. `k002bill2/rs23-impl` 접촉 금지.
- `package-lock.json` 등 설치 부산물 커밋 금지. `git add`는 명시 경로만.

## 체크포인트 (각각 로컬 커밋 + PROGRESS 갱신)
- CP1: 항목 1·2 → 해당 테스트 파일 실행 통과
- CP2: 항목 3·4
- CP3: 항목 5
- CP4: `app/`에서 `npm run typecheck`·`npm run lint`·`npm test -- --run`·`npm run build` fresh 실행. 전체 test에서 `ProjectsPage.test.tsx` "알림 영역은 둘" 1건이 다시 실패하면 단독 실행 결과와 함께 flaky 여부를 기록(수정은 하지 않음)
- 산출물: `dev/active/rs23-port/REPORT.md`(항목별 테스트 파일:행 · GREEN/RED · 게이트 수치 · base 2812 대비 증분 · 사실/추정/미확인), `dev/active/rs23-port/PROGRESS.md`

## 수용 기준
- 5개 항목 모두 GREEN 테스트 또는 RED 기록이 있다(빈 항목 0).
- `git diff origin/main --name-only -- app/`에 `*.test.ts(x)` 외 파일 0.
- 게이트 4종 결과·exit code가 REPORT에 있다.

서브에이전트 분할: 권장(항목 1·2 ∥ 항목 3·4 ∥ 항목 5 — 서로 다른 테스트 파일, 쓰기 서브에이전트는 isolation: worktree, 최대 3개) / 통합·게이트 실행은 메인이 직접.
