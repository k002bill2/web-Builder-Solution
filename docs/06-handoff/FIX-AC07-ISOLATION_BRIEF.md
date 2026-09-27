# FIX-AC07-ISOLATION — CompareBoardPage AC-07 테스트 격리 결함 수정

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 기준 main `09d9255`. 작업 공간 `fix-ac07-isolation`. 서버 불필요(필요 시 4337).
- 증상(L1): `cd app && npx vitest --run src/pages/CompareBoardPage.test.tsx` **단독 실행**에서 AC-07("A 열 '전부 선택'이면 … 확정 결과 section_plan이 A의 sectionPlan과 같다", 116~127행)이 `TypeError: Cannot read properties of undefined (reading 'base')`(126행 `v1!.base`)로 항상 실패. 기준 커밋(5562dc2·c9ab667)에서도 동일. 전체 실행에서는 대부분 통과하지만 순서에 따라 한 번 실패한 기록(profile-visual-align 전체 1,202/1,203) → 게이트 불안정.
- **목표**: 근본 원인 식별·수정. 단독 실행 10회 연속 통과 + 전체 vitest 1회 통과. **단언 약화·삭제·skip·retry 금지**, 타임아웃 늘리기로 덮기 금지.

## 조사 방향 (가설, 검증할 것)
1. 확정 클릭 뒤 저장이 비동기로 끝나기 전에 `repo.getProfileVersions`를 읽는다(다른 확정 테스트는 무엇을 기다리는지 비교 — 예: 이동·알림·`findBy`).
2. 25행 `boardRepo()`의 profile 저장소가 확정 경로가 쓰는 저장소와 다른 인스턴스(앞 테스트의 모듈 상태·엔진 청크 캐시·`renderApp` 주입 순서)라 단독 실행에서만 비어 있다.
3. `compare-headroom-c8` 변경(초안 패널·요약 바를 엔진 청크로 — `CompareBoardPage.tsx` `import()`)과의 상호작용은 기준 커밋에서도 실패했으므로 주원인은 아님. 그래도 확인.
- 원인이 **제품 코드 버그**(확정이 실제로 저장되지 않음 등)로 드러나면 수정 전에 REPORT에 근거를 남기고, 수정 범위가 `data/`·`domain/`·엔진을 넘으면 중지·보고.

## 쓰기 범위
- `app/src/pages/CompareBoardPage.test.tsx`(대기·셋업 수정만), 필요 시 `app/src/test/**` 헬퍼, 원인이 제품이면 `app/src/pages/CompareBoardPage.tsx`·`app/src/features/compare/**`. `dev/active/fix-ac07-isolation/`.
- 금지: profile 파일(병렬 레인 `profile-a11y-fix`), 번들 스크립트·예산, `design/`·`docs/design/`, 새 의존성.

## 검증
- 원인 증명: 수정 전 단독 실행 실패 로그 → 수정 후 10회 연속 통과 로그(`logs/solo-10x.txt`), 전체 vitest 1회(`logs/vitest.txt`), typecheck·lint·build(번들 변화 0 확인).
- 같은 패턴을 쓰는 다른 테스트(확정 뒤 저장소를 곧바로 읽는 곳)를 grep해 목록화, 같은 결함이면 같이 고친다.
- 서브에이전트 분할: 불필요.
- `--max-turns` 30, 22턴부터 REPORT 우선. 단계마다 PROGRESS 커밋. push·병합·삭제 금지. fable 무접촉.
- REPORT: 원인(L1 근거), 변경 파일, 로그, 영향 받은 다른 테스트, 미검증.
