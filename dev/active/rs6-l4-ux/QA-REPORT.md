# RS6-L4 QA-REPORT — UX 상태·버튼·폐기·충돌·문구 독립 검증

대상 `k002bill2/rs6-l4-ux` tip `fd49cb24`(L4 R2 `045085ca` + origin/main `863edf49` L5 #22) · QA 2026-10-17 · Orca Claude Code · 브리프 `QA-BRIEF.md`.
상태: **초안** — 6절 실화면 진행 중.

## 0. 판정

- (초안) 코드·단위·변이 기준 **거짓 saved/confirmed/discarded 0 · 확인 없는 폐기 0 · 다른 탭 커밋 덮어쓰기 경로 0**. 최종 판정은 6절 뒤 확정.

## 1. 거짓 상태 표 (버튼 ↔ 코어 1:1)

| 버튼 | 코어 호출 | 실패·reject·시간 초과 매핑 | 거짓 상태 | 근거 |
|---|---|---|---|---|
| "저장 확인"(readonly · !dirty · !memory) | `core.link → io.confirm` 1회(진행 중 promise 공유 `running.current ??=`) | `io.confirm` reject → `failed{unavailable}` · `core.link` reject → `{reason: unavailable}` · `newer` → reason newer · 성공(`confirmed`)만 `report(undefined)` → `settle()` | 0 — `confirmed`는 `port.mode()==="writer"` + `port.verify(proof)===true` + 진입 뒤 편집 0일 때만(`coreIo.ts:59-79`) | `SaveActions.tsx:34-47` · 변이 M1 FAIL |
| "다시 저장"(그 밖 failed) | 스케줄러 `retry()` → `useDocSave.save` → `core.save()` | 저장됨 = `saved` 또는 memory `not-persistent`만(`useDocSave.ts:84`) · 그 밖 전부 `INFRA` throw → failed | 0 | `useDocSave.ts:78-92` |
| "버리고 새로고침"(stale·cleared) | 폐기 대화상자("버리기") 경유에만 `core.discard()` 1회(`running` ref) | reject → `"failed"` → "버리지 못했습니다" alert · reload 0 · `blocked{timeout}` → `DISCARD_TIMEOUT_TEXT` alert · 포커스 "취소" · reload 0 · `rejected{inflight/discarding}`·`blocked{newer/no-saved-state/not-persistent}` → 오류 alert · reload 0 · `discarded`·`blocked{stale/cleared}`만 reload | 0 — 확인 없는 폐기 0(버튼은 `setOpen(true)`만) | `SaveActions.tsx:49-79` · `DiscardDialog.tsx:29-39` · 변이 M2·M4 FAIL |

- **DISCARD_GIVE_UP_MS(5000) 뒤**: `giveUp`이 `blocked{timeout}` · `finally`가 배타 해제 + 토큰 +1 → 늦은 읽기 결과는 `live()` 검사 2곳(`coreIo.ts:94,97`)에서 버림 → doc·바인딩·savedMark·epoch 변경 0(편집 보존). [L1 코드]
- **discard는 저장소에 쓰지 않는다**: `port.head`·`port.verify`만(`coreIo.ts:82-121`) → 다른 탭 커밋 덮기 불가. stale이면 `blocked{stale}` → reload(메모리 초안만 버림). L5 `/projects` 폐기(`pendingWrites.ts:118-124`)도 쓰기 0. [L1 코드 · 서브에이전트 대조]

## 2. stale 전환(①)

- 포트 stale → `coreIo.save`: `port.mode() !== "writer"` → `failed{stale}` · commit 호출 0(`coreIo.ts:41-42`) → `useDocSave.save`가 `INFRA` throw(`useDocSave.ts:90`) → 스케줄러 failed + 출처 reason stale.
- **자동 재시도 덮어쓰기 0**: `writerLock.ts:51` — `stale`은 새로고침 전까지 고정(`enter()`가 잠금을 다시 요청하지 않음) → 이후 모든 재시도(스케줄러·"다시 저장"·L5 행 `saveAgain`·`confirmCore`)가 commit 전에 거절. stale 판정 = 하이드레이트 세대 ≠ 현재 IDB 세대(`localSync.ts:101-105`). writer 잠금은 탭 수명 배타라 writer 탭이 추월당하는 경로 없음. [L1 코드] · 실저장소 확인은 6절(d).
- 탭 닫기 경고: `useDocSaveLeave.test` "다른 탭 stale(stale 환경 행) 때 등록" GREEN · 변이 M3에서 FAIL.
- `/projects` 행(L5) 정합: 행 판정은 코어 `inflight`·`dirty`만 읽는다(`pendingRows.ts:35-42`) → stale 탭의 행은 **처음엔 일반 "저장하지 못했습니다" + "다시 저장"**. 한 번 누르면 `failed("stale")` → stale 문구 + `stuck`으로 버튼 숨김(`pendingRetry.ts:39`). 저장소 변화 0. → **Q1(낮음 · UX 불일치, 데이터 손실 아님)**.
- `ConflictCallout`·`resolve` 제품 도달 0: STALE_DOC을 던지는 제품 출처가 없다(`useDocSave.ts:90` INFRA 고정 · 스케줄러 `stale` 단계 진입은 STALE_DOC 오류만). (6절 grep 보강 예정)

## 3. 병합 정합 (읽기 전용 서브에이전트 1 · 코드 대조)

- merge-base `aca09805`. L4: `coreIo.ts` `text: reasonText`(+import) · `saveCore.ts` `CoreIo.text` 선언. L5: `rebase()`의 `proof: "rebased"` · `Receipt.proof` 유니온 `"rebased"` · `CoreKeeper.cores?`. hunk 겹침 0 · 양쪽 변경 보존.
- L4 confirm/discard는 `proof` 라벨을 분기하지 않는다(`{...proof, proof:"fresh"}` 반환 · `verify`는 hash·revision만 비교 `localSync.ts:233`) → `rebased`로 바뀌어도 동작 같음. `committed`를 읽는 곳 = L5 `pendingRows.ts:56`(U16)뿐.
- 결론: 의미 충돌 0.

## 4. 변이 (매번 `git checkout -- .` · `logs/qa-mutations.txt`)

| # | 변이 | 결과 |
|---|---|---|
| M1 | confirm 연타 dedupe 제거(`??=` → `=`) | FAIL 1 — `SaveStatus.buttons.test` "연타 = confirm 1회"(2회 호출) |
| M2 | discard reject → `"failed"` 매핑 제거 | FAIL 1 — `SaveActions.test` "discard reject → 버리지 못했습니다" |
| M3 | stale → INFRA를 STALE_DOC로 되돌림 | FAIL 6 / 4파일 (useDocSave 2 · StudioLayout 2 · useDocSaveLeave 1 · FieldUndo 1) |
| M4 | 폐기 대화상자 첫 포커스 = "버리기" | FAIL 1 — `SaveActions.test` "첫 포커스 '취소'" |
| M5 | 금지 문구 가드 주석 제외 로직 제거 | FAIL 1 — "자동 복구 = 0건"(주석 `DiscardConfirm.tsx:3`) — 제외 로직이 실제로 일하고 있음 |

- 생존 변이 0. 변이 뒤 `git status --short -- app/src` 빈 값 확인.

## 5. 접근성 (초안 — 6절 실측으로 보강)

## 6. 실화면 (진행 중)

## 7. fresh 게이트 (`app/` · 직렬)

| 명령 | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | exit 0 | `logs/qa-typecheck.txt` |
| `npm run lint` | exit 0 | `logs/qa-lint.txt` |
| `npm run build` | exit 0 · `/studio` 정규화 **129.12** · raw **130.43** · 복원 **132.10** · 복원 raw 133.47 | `logs/qa-build.txt` |
| `npx vitest run` | **340 files / 3022 tests passed** | `logs/qa-test.txt` |

- 개정 17 상한(129.13 · 132.11 · raw 130.5) 안 — Jarvis 병합 후 수치와 같다.

## 8. 사실 / 추정 / 미확인 (초안)

## 9. 최종 QA 게이트 인계 (초안)
