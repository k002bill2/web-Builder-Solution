# RS4-CP4 BRIEF — 편집기 인계 (Developer, 예산 관문 조건부)
책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-16
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs4-cp4-spike` (브랜치 `k002bill2/rs4-cp4-spike`, base origin/main `3454702f`)
정본: `docs/design/restart/SPEC-4.md` 5.3·5.4·8.0·8.4·9절, RS4-AC-05(CP4)·06·11·18·19·20·21·22·23. CP1~3은 main에 병합됨(PR #6).

## CP0 — 예산 관문 (먼저, 코드 커밋 0)
1. base: 깨끗한 상태에서 `npm run build` 출력 원문 저장(`/studio` 정규화·복원, `/profile`, `/projects`).
2. SPEC 9절 S3안(편집기 동기 조회만 + 인계 본문 lazy `import()`)으로 최소 스파이크 → 빌드 → 수치. 판정선: `/studio` 정규화 ≤ 128.53 · 복원 ≤ 131.51(ADR-004 개정 16, **수정 금지**).
3. 넘으면 감량 1회 → 그래도 넘으면 **스파이크를 버리고 구현 중단**, 전후 수치(정규화·raw)와 바이트 구성을 REPORT에 쓰고 종료. 판정선 상향·배분 요청은 Jarvis가 영환님께 따로 올린다.

## CP1~3 (CP0 통과 시에만)
- CP1: RED `app/src/features/studio/useDocSave.test.ts`·StudioLeave 계열(RS4-AC-11 진입 unconfirmed·저장 확인, AC-05 cleanup 순서, AC-06 회귀 변경 0) → GREEN(5.3 진입·저장 확인 규칙 — 편집기 안에서 `startDoc` 재생 금지, `retry()`/`confirmDoc` 분기).
- CP2: PendingDraft 떠남·재진입(RS4-AC-18·19·20·21·22·23).
- CP3: **이번 레인에서 하지 않는다.** `/projects` 화면 파일(`app/src/pages/ProjectsPage*`, `app/src/components/projects/*`, `app/src/features/projects/*`)은 병렬 레인(flaky-projects-alerts)과 쓰기 경로가 겹쳐 접촉 금지. CP2 뒤 예산 재측정만 하고, 링크 게이트 갱신은 REPORT에 후속 범위로 적는다.
- 각 CP: RED 출력 → GREEN → 로컬 커밋. 턴이 부족하면 마지막 완료 CP까지 커밋하고 남은 범위를 PROGRESS에 남긴다.
- 기존 테스트 단언 삭제·완화 금지. 브라우저 QA는 하지 않는다(별도 QA 레인).

산출물: `dev/active/rs4-cp4/REPORT.md`(CP0 수치표 필수), `PROGRESS.md`
서브에이전트 분할: 권장(CP0 측정 중 읽기 전용 코드 조사 1개 · CP2에서 테스트 작성 ∥ 구현 조사, 쓰기는 isolation: worktree, 최대 3개) / 예산 측정·통합은 메인이 직접.

## 공통 규칙
- 먼저 `cd app && npm ci`(설치 부산물·`package-lock.json` 변경은 커밋 금지, `git add`는 명시 경로만).
- push·merge·원격 쓰기 금지. 다른 워크트리 접촉 금지. 예산 판정선·ADR·SPEC 수정 금지. 새 의존성 금지. Codex 실행 금지.
- 체크포인트마다 `dev/active/rs4-cp4/PROGRESS.md` 갱신 + 로컬 커밋.
- 마지막에 `app/`에서 `npm run typecheck`·`npm run lint`·`npm test -- --run`·`npm run build` fresh 실행, exit·수치를 REPORT에(base main `3454702f` = 313 files / 2830 tests).
- REPORT는 사실/추정/미확인을 구분한다.
