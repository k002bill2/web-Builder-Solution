# RS7-C REPORT — 생존 변이 테스트 공백 (B-RS-08)

base `73289c90` · 브랜치 `k002bill2/rs7-mutation-gaps` · 2026-10-17 · 앱 코드 변경 0 · 기존 테스트 수정 0 · 기준선·문서 수정 0

## 0. 판정
- 대상 7종 중 **5종 검출**(새 테스트 RED → 복원 GREEN) · **1종 미검출**(U14-b — 3회 시도 생존, 인계) · **1종 이월**(L5 M1 → RS7-B 뒤).
- 새 파일 2개: `app/src/features/studio/save/saveCore.mutationGaps.test.ts`(4건) · `app/src/pages/ProjectsRetryGuard.test.tsx`(2건).
- RS7-A(충돌 경로 삭제)와 겹치는 변이 대상 **0** — M2b는 충돌 경로가 아닌 복원·restart 경로로만 단언했다(아래 2절).

## 1. 변이 표 (매번 `git checkout -- <앱 파일>` · 적용 직후 `git diff -U0`로 헝크 확인 — 로그에 diff 포함)
| 레인 | 변이 | 적용 위치 | 새 테스트 결과 | 로그 |
|---|---|---|---|---|
| L5 | M3 페이지 `state.busy` guard 단독 제거 | `ProjectsPage.tsx` onRetry `?.label \|\| state.busy` → `?.label` | **RED 1** — "p1 재시도 진행 중 p2 재시도 클릭 → retryRow 1회(p1)만" | `logs/mut-M3.txt` |
| L5 | M4b 페이지 `.catch` 제거 | `ProjectsPage.tsx` onRetry `import(...).then(retryRow).catch(...)` → `.catch` 삭제 | **RED 1** — "retryRow reject → alert 실패 문구 · busy 해제 · 포커스 유지"(+ 미처리 reject 1) | `logs/mut-M4b.txt` |
| L1 | U10-a 포트 `mode()`의 cleared 판정만 제거 | `localSync.ts` corePort.mode `cleared ? "cleared" :` 삭제 | **RED 1** — cleared 뒤 clean 코어 확인 = `failed{cleared}`(변이: `failed{infra}` — 닫힌 영속 재읽기) | `logs/mut-U10a.txt` |
| L1 | IMG-meta 바인딩 판정 `imageMeta` 확인 제거 | `localSync.ts` corePort.commit `!(bound[id] && imageMeta(bound[id]))` → `!bound[id]` | **RED 1** — 메타 없는 Blob 바인딩 + IDB 레코드 0 → `failed{image-missing}` · 제출 0(변이: 문서만 커밋 = saved, 이미지 빠짐) | `logs/mut-IMGmeta.txt` |
| L3a | M2b rebase `s.epoch += 1` 제거 | `coreIo.ts` `rebase()` (discard·replace의 같은 줄은 미접촉 — 다음 줄 앵커) | **RED 2** — 복원 뒤 · restart 뒤 epoch +1 · 옛 epoch replace = `rejected{epoch}` | `logs/mut-M2b.txt` |
| L1 | U14-b `confirmDoc`의 코어 `idle()` 대기만 제거 | `memoryProjectRepository.ts` confirmDoc | **생존(검출 테스트 미확보)** — 3절 | 3절 |
| L5 | M1 행 우선순위(시작 대기 ↔ 코어 상태) | — | **이월** — RS7-B가 `pendingRows`·`retryRow` 판정을 바꾼다(BRIEF). RS7-B 머지 뒤 새 판정 기준으로 "시작 대기 + 코어 dirty 조합 행: 라벨 = 시작 다시 시도 · 클릭 = starter" 테스트 1개 | — |

- 변이 후 매번 `git status --short` 앱 변경 0 확인(사실 — 명령 출력).
- M3 테스트는 lint 수정(타입 표기만) 뒤 RED 재확인했다(사실).

## 2. RS7-A 겹침
- RS7-A가 지우는 것: `ConflictCallout`·`useDocSave.resolve`·충돌 경로. 이 레인 변이 7종 중 그 경로가 대상인 것은 **0**.
- M2b: 지금은 기존 `saveCore.epoch.test.ts`(충돌 mine·theirs 경유 epoch +1)가 이미 잡는다(RS6-L4가 추가). RS7-A가 충돌 경로와 함께 그 테스트를 지우면 M2b는 다시 생존한다 → 이 레인 테스트는 **복원·restart 경로**로 같은 단언을 둬 RS7-A 뒤에도 남는다(추정 — RS7-A 결과 미확인).

## 3. U14-b 미검출 (인계)
- 정의(L1 QA 주 ①): `confirmDoc`의 `await cores.get(projectId)?.idle()` 제거. 방어 대상 = "코어 commit 제출이 LocalSync `confirm`의 `queue.retry` 뒤에 일어나는 타이밍".
- 시도 3회(모두 변이에서도 통과 → 테스트 삭제, 커밋 0):
  1. 코어 save 2건(A 보류 · B 대기) 중 confirmDoc → 끝 IDB = B: 변이에서도 B. `queue.retry`가 진행 중 기록을 다 기다린다(`writeQueue.ts:88-92`).
  2. 1 + 확인의 IDB 이미지 키 읽기 보류(그 사이 B 제출) → 변이에서도 B — 추적 결과 B는 확인의 retry 전에 제출됐다.
  3. 다른 탭 코어(바인딩 0 · IDB 이미지 참조)로 B 커밋을 이미지 키 읽기에서 보류한 채 confirmDoc → 변이에서도 확인이 B 커밋 뒤에 끝났다(쓰기 추가 0). 확인 쪽이 어디서 기다리는지는 시간 상한으로 끝까지 추적하지 못했다(**미확인**).
- 판정: "도달 불가"로 단정하지 않는다 — 근거가 추적 미완. **Low · 테스트 공백 유지**. 다음 후보: 확인 경로 대기 지점(DocBook `confirm` → LocalSync `confirm` 사이)을 계측한 뒤 그 앞에서 코어 commit 제출을 보류하는 장치(testRig에 keys 보류 helper)가 필요하다 — testRig 수정은 이 레인 범위(새 파일만) 밖.

## 4. 게이트 (fresh)
| 게이트 | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | 대기 | `logs/gate-typecheck.txt` |
| `npm run lint` | 대기 | `logs/gate-lint.txt` |
| `npm test -- --run` ×2 | 대기 | `logs/gate-test-{1,2}.txt` |
| `npm run build` | 대기 | `logs/gate-build.txt` |

## 5. Codex review
- `review --scope branch --base 73289c90` 1회 — 대기.

## 6. 사실 / 추정 / 미확인
- 사실: 1절 RED·GREEN 수치(로그) · 변이 헝크(로그 diff).
- 추정: 2절 RS7-A 뒤 M2b 재생존(RS7-A 결과를 보지 않음).
- 미확인: U14-b 변이에서 확인이 B 커밋 뒤에 끝나는 이유(3절 3).

## 7. 서브에이전트
- 0개 — 변이는 같은 앱 파일을 순차로 바꾸고 되돌려야 해 병렬 이득이 없었다.
