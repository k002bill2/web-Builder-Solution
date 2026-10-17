# RS6-L4 QA-REPORT — UX 상태·버튼·폐기·충돌·문구 독립 검증

대상 `k002bill2/rs6-l4-ux` tip `fd49cb24`(L4 R2 `045085ca` + origin/main `863edf49` L5 #22) · QA 2026-10-17 · Orca Claude Code · 브리프 `QA-BRIEF.md`.
상태: **최종**.

## 0. 판정

- **PASS with notes.** 거짓 saved/confirmed/discarded 0 · 확인 없는 폐기 0 · 다른 탭 커밋 덮어쓰기 경로 0 — 코드 대조 · 단위 · 변이 5/5 FAIL · 실저장소 2탭(6절 d: 자동 재시도 2회 뒤 IDB = 다른 탭 커밋 rev 5 · 이 탭 문구 0).
- notes(모두 FAIL 사유 아님):
  - **N1(중간 · 판단 필요)** 편집기 안 "저장 확인"은 제품 도달이 사실상 0이다. readonly reason은 저장 실패에서만 생기고 그 실패는 코어를 dirty로 남긴다 → MQ-5-3 A 규칙(dirty면 숨김)으로 늘 숨는다(`useDocSave.ts:81-90` · `coreIo.ts:41-42` savedMark 불변 · `SaveActions.tsx:59-60`). 실화면 (a)에서 확인. confirm 경로는 단위 + 변이 M1로만 검증 → BRIEF 6(a) "클릭 → 결과"는 BLOCKED(UI로 만들 수 없는 상태).
  - **N2(낮음)** L5 `/projects` 행은 stale 탭에서도 처음엔 일반 "저장하지 못했습니다" + "다시 저장"이다(행 판정이 코어 `inflight`·`dirty`만 읽음, `pendingRows.ts:35-42`). 한 번 누르면 stale 문구 + 버튼 숨김. 저장소 변화 0. 문구는 `coreRowText.ts:18`·`reasonText.ts`에 같은 문자열 2벌.
  - **N3(정보)** 폐기 시간 초과 상태에서 글자가 있는 alert가 2개다(상태 줄 stale alert + 대화상자 timeout alert — 내용 다름, 배경은 `showModal()`로 inert). 같은 문장 중복 0.
  - **N4(정보 · 범위 밖)** 편집기에 `role=status`가 2개다: "편집 알림"(셸) + `PngSave.tsx:76`(base부터 있던 것). 저장 알림은 "편집 알림"에만 간다(slow 1회 실측).

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
- `ConflictCallout`·`resolve` 제품 도달 0: STALE_DOC을 던지는 제품 출처가 없다(`useDocSave.ts:90` INFRA 고정 · 스케줄러 `stale` 단계 진입은 STALE_DOC 오류만). grep(비테스트): `STALE_DOC`을 던지는 곳은 `memoryDocBook.ts`(복원·해결·restart·내보내기)뿐이고 `useDocSave.save` 경로는 `INFRA` 고정 · 스케줄러 `stale` 진입은 `onFailed` code `STALE_DOC`일 때만(`useAutosaveScheduler.ts:218`) · `ConflictCallout` 렌더는 `StudioLayout.tsx:335` `save.conflict`(= phase stale)뿐 → 제품 도달 0 [L1]. 단 `core.save()` 자체 reject(조작 뒤 청크 connect 실패)의 오류 코드는 확인하지 않았다(추정: INFRA 계열).

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

## 5. 접근성

| 항목 | 결과 | 근거 |
|---|---|---|
| 폐기 대화상자 role | `role=alertdialog` · `aria-labelledby` = "확인되지 않은 변경 버리기" | 실화면 (d) |
| 포커스 진입/복귀 | 열면 "취소" · Esc → 닫힘 + "버리고 새로고침" 복귀 · 시간 초과 뒤 "취소" | 실화면 (d) · 변이 M4 |
| aria-busy·aria-disabled | 저장 중 상태 글자 `aria-busy=true` · 폐기 진행 중 "버리는 중…" aria-busy · `disabled` 미사용 | 실화면 (c)(d) · `SaveStatus.buttons.test` |
| alert 중복 | 실패 · readonly · stale 각 1개(같은 문장 1곳) · hang alert 1회 · N3 | 실화면 (b)(c)(d) |
| status 1회(slow) | "편집 알림" 기록 = "저장 중… · 브라우저 응답이 늦습니다" 1회 | 실화면 (c) MutationObserver |

## 6. 실화면 (Ego Lite · build `fd49cb24` dist · preview `--port 4384 --strictPort` · TaskSpace 22 · 모두 앱 안 클릭)

경로: IDB 삭제 → 새 프로젝트 → 카탈로그 비교 추가 2 → 비교 보드 전부 선택 → 프로필 확정 → 3안 → A안 편집 시작(`/studio/project-1`). 2·3번째 탭은 `/projects`에서 행 링크 클릭.

| # | 시나리오 | 관측 | 판정 | 샷 |
|---|---|---|---|---|
| (b) | 실패 "다시 저장" — `IDBObjectStore.put` throw 주입 | 편집 → "저장하지 못했습니다" + alert 1 + "다시 저장" · 주입 중 다시 저장 → 그대로 실패(거짓 저장됨 0) · 주입 해제 뒤 다시 저장 → "이 브라우저에 저장됨 · 방금" · IDB에 그 편집 문구 있음 · status "다시 저장했습니다" | 통과 | `qa-shots/b-1280-failed.png` |
| (c) | 저장 중/느림 — 같은 DB readwrite 트랜잭션 13초 점유 | 1.5s "저장 전 변경 있음" → 3.5s "저장 중…" aria-busy → 6s "저장 중… · 브라우저 응답이 늦습니다" → hang alert 1회 → 해제 뒤 "저장됨" · slow status 1회 | 통과 | `c-1280-slow.png` · `c-1280-hang.png` |
| (a) | readonly 2탭 | 탭2 열기만: locks held = `[design-studio-writer:exclusive]`(탭1) · 상태 글자 0 · 버튼 0. 탭1 커밋(rev 5) 뒤 탭2 편집 → "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다" 글자·alert · "저장 확인" 숨김(dirty) · IDB 변화 0 | 덮어쓰기 0 통과 · "저장 확인" 클릭은 **BLOCKED**(N1) | `a-1280-readonly-dirty.png` |
| (d) | stale → 폐기 → reload | 탭1 닫기 → 탭2 편집 → stale 문구 글자·alert 1 + "버리고 새로고침" 1 · locks held [] · 추가 편집으로 자동 재시도 → IDB rev 5 · 탭1 문구 유지 · 탭2 문구 0 · 키보드: focus → Enter → alertdialog 첫 포커스 "취소" → Esc 복귀 → Enter → Tab "버리기" → Enter → reload → 필드 = "탭1 최신 커밋" · IDB 그대로 | 통과 | `d-1280-stale-row.png` · `d-1280-discard-dialog.png` |
| (d+) | 폐기 시간 초과 — 탭3 커밋(rev 6) 뒤 stale · readwrite 9초 점유 중 "버리기" | 1s "버리는 중…"(aria-busy) · 5.8s alert "버리지 못했습니다 — 변경은 그대로 있습니다"(key `discard-timeout`) · 포커스 "취소" · 필드 = 내 편집 · reload 0 · 점유 해제 뒤(10.8s)도 그대로(늦은 결과 버림) · 다시 "버리기" → reload → "탭3 커밋" | 통과 | `d-1280-discard-timeout.png` |
| (e) | 390(CDP 뷰포트) stale 행 | `scrollWidth` 375 = `clientWidth` 375(가로 넘침 0) · "버리고 새로고침" 107×32 화면 안 | 통과 | `e-390-stale-row.png` |

- 정리: IDB `design-studio` 삭제(남은 DB 0) · `task.finish({keep: []})` · `listTaskSpaces()`에 이 space 0 · preview 종료 · 4384 리슨 0 · 5480 리슨 0(무접촉).

## 7. fresh 게이트 (`app/` · 직렬)

| 명령 | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | exit 0 | `logs/qa-typecheck.txt` |
| `npm run lint` | exit 0 | `logs/qa-lint.txt` |
| `npm run build` | exit 0 · `/studio` 정규화 **129.12** · raw **130.43** · 복원 **132.10** · 복원 raw 133.47 | `logs/qa-build.txt` |
| `npx vitest run` | **340 files / 3022 tests passed** | `logs/qa-test.txt` |

- 개정 17 상한(129.13 · 132.11 · raw 130.5) 안 — Jarvis 병합 후 수치와 같다.

## 8. 사실 / 추정 / 미확인

- **사실 [L1]**: 7절 수치 · 4절 변이 결과 · 6절 관측값(실저장소 IDB 읽기 포함) · 1·2절 코드 줄 · writer 잠금 stale 고정(`writerLock.ts:51`).
- **추정 [L2]**: `core.save()` 자체 reject의 오류 코드(INFRA 계열) · N2 원인이 `describeRow` 동기라서라는 점(서브에이전트).
- **미확인**: 편집기 "저장 확인" 클릭 실화면(N1 — UI로 만들 수 없음) · `cleared` 경로 실화면 · `unsupported`(Web Locks 없음) 실화면 · Safari 등 다른 엔진.

## 9. 최종 QA 게이트 인계

- L4 몫 RS6-AC-U8·U9·G3 · UX5-AC-01·04·06·07·12·14: 이 QA 범위에서 반대 증거 0. UX5-AC-05(충돌 포커스)는 제품 도달 0이라 단위로만 성립.
- Jarvis 판단 요청: **N1** — 편집기 "저장 확인"이 도달 0인 것이 의도(MQ-5-3 A의 결과)인지, readonly·clean 상태를 만드는 경로가 필요한지. N2는 L5 행 개선 후보(별건).
- 서브에이전트: 읽기 전용 1개(3절 병합 대조) — 결과는 3절·N2에 반영.
- 앱·테스트 커밋 0 · push 0 · Codex 0.
