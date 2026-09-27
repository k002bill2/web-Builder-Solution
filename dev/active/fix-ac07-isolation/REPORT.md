# REPORT — fix-ac07-isolation

## 결론
AC-07 단독 실패의 근본 원인은 **테스트의 대기 누락**이다(제품 버그 아님). 확정 클릭 뒤 확정 완료(= `/profile/profile-1` 이동)를 기다리지 않고 저장소를 곧바로 읽었다. 확정 본문 `memoryBoardConfirm`은 동적 `import()` 청크(`loadBoardConfirm`, `app/src/data/writeBodyLoader.ts`)라, 워커에서 **처음 확정하는 테스트**는 청크 로드 동안 `confirmProfile`이 끝나지 않은 상태에서 `getProfileVersions`가 `[]`를 돌려준다. 파일 단독 실행에서는 AC-07이 처음 확정하는 테스트라 항상 실패, 전체 실행에서는 앞선 테스트·파일이 청크를 데워 두는지(순서)에 따라 통과/실패 → 게이트 불안정.

## 근거 (L1)
1. 수정 전 단독: `logs/solo-before.txt` — 1 failed / 35 passed, 126행 `TypeError: ... reading 'base'`.
2. 실험(임시, 되돌림): AC-07 시작 전 `loadBoardConfirm()`으로 청크를 미리 받으면 단독 36/36 통과 — `logs/experiment-prewarm.txt`. 코드 외 다른 변수는 없음 → 원인은 청크 콜드 로드 중 선(先)읽기.
3. 같은 결함 2건 추가 확인(수정 전 파일로 `-t` 단독 → 같은 TypeError, 수정 후 통과): AC-12·AC-24(196행), AC-26(279행) — `logs/same-pattern.txt`.
4. 가설 2(다른 저장소 인스턴스): 기각 — 같은 `repo`로 청크만 데우면 통과. 가설 3(compare-headroom-c8): 기준 커밋에서도 실패했고 원인 청크는 `writeBodyLoader`(FIX3-2A04b1) 쪽이라 주원인 아님.

## 변경 파일
- `app/src/pages/CompareBoardPage.test.tsx` — AC-07·AC-12/24·AC-26에서 `openBoard`의 `router`를 받아, 확정 클릭 뒤 `await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"))` 추가(AC-25·S-15·CompareBoardLineage가 이미 쓰는 대기 패턴). 단언 변경·삭제·skip·retry·타임아웃 변경 없음.

## 검증 (fresh 실행)
- 단독 10회 연속: `npx vitest --run src/pages/CompareBoardPage.test.tsx` ×10 → 모두 36 passed (`logs/solo-10x.txt`)
- 전체: `npx vitest --run` → 105 files / 1207 tests passed, exit 0 (`logs/vitest.txt`)
- `npm run typecheck` exit 0, `npm run lint` exit 0 (`logs/typecheck.txt`, `logs/lint.txt`)
- `npm run build` exit 0, 수정 전/후 `dist/` 전체 sha 동일 → 번들 변화 0 (`logs/bundle-diff.txt`)

## 영향 받은 다른 테스트 (grep: 확정 뒤 저장소를 읽는 곳)
- `CompareBoardPage.test.tsx`: 184행(이미 `waitFor` 안에서 읽음, OK), 378·386행(이동 대기 뒤, OK), AC-07·AC-12/24·AC-26(수정).
- `CompareBoardLineage.test.tsx`: 확정 7곳 모두 이동 `waitFor` 또는 `findByRole("alert")` 대기 — OK. 단독 4/4 통과.
- `CompareBoardSummaryAdjust`·`BoardInputLoad`·`WriteBodyLoad` 단독 통과(`logs/other-solo.txt`). profile 파일은 금지 범위라 미점검.
- 저장소 직접 호출 데이터 테스트(`src/data/*`)는 `await`로 부르므로 해당 없음.

## 미검증
- profile 레인 테스트(`Profile*.test.tsx`)의 같은 패턴 여부 — 쓰기 금지 범위라 보지 않음.
