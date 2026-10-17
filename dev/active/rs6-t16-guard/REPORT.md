# RS6 T16 REPORT — 편집기 안 디바운스 중 beforeunload 상시 회귀 테스트

판정: **PASS** (테스트 1파일 추가 · 앱 코드 변경 0 · 변이 4종 RED · 전체 스위트 3회 GREEN)

## 변경
- 추가: `app/src/components/studio/StudioUnloadGuard.test.tsx` (5 tests) — 유일한 `app/src` 변경 (`git diff --stat af76d10b -- app/src` = 1 file, +127).
- 장치: 실제 저장소·싱크 `startedRig`(testRig — 제품 `createDeferredStudio` + `openLocalSync`, 영속 경계만 `harnessDb`) + 편집기 `StudioLayout` 마운트(StudioLeave.test 렌더 관례). commit 지연 = `db.hold()`, 실패 = `db.failNext("AbortError")`. 디바운스만 fake timers(`AUTOSAVE_DEBOUNCE_MS` = 2000).
- `coreFixture`(withSaveCore)는 쓰지 않았다 — 가짜 레지스트리라 `beforeunload` 리스너가 없다(`coreFixture.ts` `withSaveCore`). 판정 소유는 실제 저장소 레지스트리뿐이라 실제 저장소가 필요.

## 기대값 근거
판정식 `memoryProjectRepository.ts:148`: `some((c) => !local || c.view().dirty || c.view().inflight > 0) && event.preventDefault()`. dirty = `mark > savedMark`(`saveCore.ts:139`), savedMark는 commit 성공 뒤에만 오른다(`coreIo.ts:50`), memory(포트 없음)는 메모리 커밋 직후(`coreIo.ts:38`).

| # | 케이스 | 기대 | 근거 |
|---|---|---|---|
| 1 | 편집 직후 디바운스 대기(dirty 1 · inflight 0) | true | dirty |
| 2 | 저장 진행 중(commit hold) | true | dirty·inflight 둘 다 — 같은 it 안 |
| 2b | 저장 진행 중 · 초안 변경 없음(dirty 0 · inflight 1, `core().save()` 직접) | true | inflight 단독 — 2는 dirty도 참이라 inflight 변이를 못 잡아 추가 |
| 3 | 커밋 완료 | false | dirty 0 · inflight 0 · local |
| 4 | 저장 실패(failed · dirty) → 다시 저장 성공 | true → false | savedMark 미갱신 |
| 5 | memory(`not-persistent`) — 마운트만 · 편집→저장 뒤 | true · true | `!local` = 코어가 있으면 늘 (기존 useDocSaveLeave.test "memory 모드"와 같은 규칙, 여기는 편집기 마운트·저장 뒤까지) |
| 6 | 편집기 링크 이탈 직후(디바운스 미완) → 해제 save 커밋 | true → false | 해제 save dirty/inflight · 훅 수준 POP은 useDocSaveLeave.test "U12" — 여기는 링크 클릭(StudioLayout) 경로라 중복 아님 |

순서: 레지스트리 리스너가 window에 저장소마다 남으므로 각 local 테스트는 커밋까지 흘려 dirty 코어를 남기지 않고, memory는 마지막.

## 변이 표 (매번 `git checkout -- app/src/data/memoryProjectRepository.ts` · 복원 확인 `git diff --quiet`)
| 변이 | 148줄 변경 | 결과 | 로그 |
|---|---|---|---|
| M1 dirty 조건 제거 | `\|\| c.view().dirty` 삭제 | 4 failed / 1 passed (1·2·3흐름, 2b, 6, 4) | `logs/M1-no-dirty.log` |
| M2 inflight 조건 제거 | `\|\| c.view().inflight > 0` 삭제 | 1 failed (2b) | `logs/M2-no-inflight.log` |
| M3 리스너 등록 제거 | 148줄 주석 처리 | 5 failed | `logs/M3-no-listener.log` |
| M4(추가) memory 규칙 제거 | `!local \|\|` 삭제 | 1 failed (5 memory) | `logs/M4-no-memory-rule.log` |

M1에서 2b도 실패한 것은 앞 테스트(1)가 중간 실패로 hold를 풀지 않아 inflight 코어가 window 리스너에 남은 연쇄 — 각 변이를 적어도 1건이 직접 잡는다는 판정에는 영향 없음.

## 검증 (fresh)
| 명령 | 결과 | 로그 |
|---|---|---|
| `npx vitest run src/components/studio/StudioUnloadGuard.test.tsx` | 5 passed | — |
| `npm run typecheck` | exit 0 | `logs/typecheck.log` |
| `npm run lint` | exit 0 | `logs/lint.log` |
| `npm test -- --run` ×3 | 3회 모두 exit 0 · 341 files / 3027 tests (base 340/3022 + 1/5) | `logs/suite-{1,2,3}.log` |
| `npm run build` (확인용) | exit 0 · `/studio` 정규화 129.12 (기준선 129.11) · 복원 132.10 — 그대로 | `logs/build.log` |
| Codex review `--scope branch --base af76d10b` | 아래 | `logs/codex-review.log` |

## Codex
(결과 기입 예정)

## 목업·범위 메모
- 앱 코드·기준선·예산·`docs/**` 변경 0. 기존 테스트 단언 변경 0. push·원격 쓰기 0. 브라우저 0.
