# rs4-review REPORT — SPEC-4 r0.1b 독립 설계 회수 (QA)

- 대상: `docs/design/restart/SPEC-4.md`·`MQ-4.md` @ `1a48ce8`(r0.1b) · 소비 코드 = 앱 `93f8111`(`git diff --stat 93f8111 HEAD -- app` = 0줄 확인).
- 성격: **설계 문서 회수**. 코드·예산·runtime 실행 0 → 이 문서의 어떤 항목도 코드/예산/runtime PASS가 아니다.
- 근거 표기: **L1-코드** = 행 직접 확인 · **L1-추적** = 여러 행을 이어 읽은 실행 경로 추론(실행 0) · **L3** = 추정/측정 대기.
- 순서: 2절(QA 독립 판단)을 Codex 결과를 읽기 전에 작성·저장했다. Codex는 3절.

## 1. 결론

- 판정: **BLOCKED(설계 회수 기준) — CP4 착수 전 SPEC 보정 필요. CP1~3은 RS4-R10(P-3) 측정 결과에 묶임.**
- 닫힘 확인(설계 수준): F1(origin 1회 보존·재시도 before 재조회 0), F2(R-E6/C-E6 → `PendingRecord` + 실행 가능한 "저장 확인"), Codex a1 P2(Origin `unknown` · R-4u), 메모리 resolve와 IDB `oncomplete` 구별.
- 남는 결함은 2.2(QA)·3절(Codex)에 출처를 나눠 적었다. **고치지 않았다**(BRIEF: 수정 금지·리뷰 루프 금지).

## 2. QA 독립 판단 (Codex 결과 열람 전)

### 2.1 brief 항목별 trace

| 항목 | 판정 | 근거 |
|---|---|---|
| origin 최초 1회 보존·재시도 | 설계상 성립. 재시도는 기억 `{mode,version,selected,origin}`만 쓰고 before 재조회 0(4.2). restart origin = 대화상자 `doc`(지금 코드도 같은 값으로 `expectedRevision`) | L1-코드 `RestartDialog.tsx:107,112` · `restartFlow.ts:59-66` |
| Origin `unknown` 판정 | 성립. F-6(문서 있음 → `PendingStart unknown`)·F-6b(문서 없음 → 기억 0: create 커밋이면 메모리에 문서가 있고 이 탭이 지우는 경로 없음)·R-4u(관측 안 한 부재로 지우지 않음) | L1-코드 `memoryDocBook.ts:384-386` |
| PendingRecord / PendingDraft 구별 | 타입·전이표에서 구별됨(Draft는 밖에서 확인 버튼 0). 단 CP4 전용이라 **CP4 예산 실패 시 Draft 자체가 없다** | SPEC 3.1·3.4·5.6 R8 |
| offline·커밋 전 실패의 내용·이미지 보존 | 내용: `edit(next: PageDoc)` 전체 교체 API가 있어 첫 edit 복원 가능. 이미지: 맵은 `StudioLayout` state(`:310`)라 재진입 시 draft 이미지를 그 state에 넣는 수단이 SPEC에 없음(명세 공백 · L3) | L1-코드 `useDocSave.ts:46` · `StudioLayout.tsx:310` |
| POP `saving` 중 자기 저장·재진입 revision | 조건부 성립 → **Q2** | 아래 |
| 확인 중 후속 edit 버전 검사 | "확인 시작 뒤 편집"만 본다 → **Q1** | 아래 |
| unload guard 유지·정리 | 모듈 리스너라 화면 언마운트와 무관(설계). 대화상자는 언마운트 뒤에도 `run`이 이어져 기억을 만든다(alive 검사 없음). 해제는 `release` 3사유·폐기뿐 | L1-코드 `RestartDialog.tsx:102-115` |
| `deleteSnapshot(p,"")` 이미지 안전성 | **보장 못 함**(편집기 밖) → **Q3** | 아래 |
| 메모리 resolve vs IDB oncomplete | local 모드: `kept` → `flush` → `queue.submit` → `persistence.write` → `tx.oncomplete` 뒤 resolve. 같은 레코드면 `queue.retry`(진행 중 대기 + 실패분 재제출, 없으면 쓰기 0으로 resolve). **memory 모드(`local` 없음)는 `kept = work` — resolve = 메모리뿐**인데 SPEC 6-1은 모드 구분 없이 "영속 확인"이라 함(P3 · Q7) | L1-코드 `memoryProjectRepository.ts:65-66` · `writeQueue.ts:69-92` · `idbPersistence.ts:52-57,88-95` |
| request pending 없는 일반 dirty 편집 | **CP4가 있을 때만** POP 보호(Draft "없음·기억" 행). CP4 없으면 지금처럼 POP으로 버려지고 경고 0(R8가 정직히 적음). 3.3-3 "화면 언마운트로 보호가 사라지는 순간 0"은 **기억이 있는 경우에만** 참 → **Q5** | SPEC 3.3-3·3.4·5.6 R8 |

### 2.2 QA 지적 (새 결함 — 미수정)

- **Q1 [P1 · CP4] 편집기 "저장 확인"의 `saved` 조건이 확인 시작 전 미저장 편집을 놓친다.** SPEC 3.4(`:156`)·5.3(`:256`)은 "확인 시작 때 version 기록 → resolve 때 그대로면 `saved`"다. 시작 **전** 편집이 디바운스 중(`dirty`)이거나 request 단계 실패·offline으로 메모리에 없으면, 확인 resolve 때 version은 그대로라 `saved` → `needsUnloadGuard` 해제(`useAutosaveScheduler.ts:67-70`) + POP 언마운트 때 phase `saved`라 Draft 0(5.3 "떠남" 행) → 편집 손실. 게다가 새 phase `unconfirmed`(또는 `failed` 재사용)에서 `change()` 전이가 정의되지 않았고 지금 규칙은 `idle`·`saved`만 `dirty`로 바꾼다(`:96-98`) → 편집 뒤에도 "저장 확인" 버튼이 남는 구조. 판정은 "시작 version 동일"이 아니라 스케줄러 `pending()`(version > savedVersion, `:139-141`)·`saving` 여부여야 한다(제안만). L1-추적.
- **Q2 [P2 · CP4] r0.1b "saving 중 POP 거짓 충돌 0"은 순서 조건부다.** 진행 중 저장의 메모리 커밋은 `bookOf()` 뒤(`memoryProjectRepository.ts:119` — 첫 저장이면 `memoryDocBook` 청크 네트워크 로드). 재진입 `getDoc`은 진입 문서면 기다리지 않고 옛 revision r을 준다(`:91-94,114-116`). 그 뒤 옛 저장이 r+1로 커밋되고 draft 내용이 옛 저장 내용과 다르면 키 `r|hash'` 불일치 → `STALE_DOC`(`memoryDocBook.ts:358-363`); `local.base` 보정은 `queue.status === "unconfirmed"`일 때만(`localSync.ts:193-196`). 결과 = 자기 저장과 거짓 충돌(내용 손실은 아님 — E-S09 "내 편집 유지"). RS4-AC-11 r0.1b 시나리오는 "메모리 커밋 → 재진입" 순서만 적어 역순을 검증하지 않는다. 창 크기는 L3.
- **Q3 [P1 · CP3 편집기 밖 확인] `deleteSnapshot(p,"")`는 이미지 맵 안전성을 보장하지 않는다 — RS4-R10은 코드 추적상 성립(L1-추적), runtime은 P-3 측정 대기.** `kept`의 `held = maps.get(projectId)`는 호출 시점 값이고(`:65`), 편집기를 떠나면 등록이 풀린다(`:147-148`). 레코드가 마지막 제출과 다르면 새 제출이고(`localSync.ts:154-161`), `images` 없음 + 이 프로젝트 저장 id 없음이면 `imageOps`가 즉시 `[]`, 있어도 put은 맵 항목이 있어야 낸다(`imageOps.ts:19,23-25`). → 쓰기 문 거절로 제출 0이었던 새 이미지 참조 문서는 이미지 레코드 없이 커밋된다. 안전한 경우는 (가) 레코드 = 마지막 제출(`queue.retry`가 실패 당시 image op를 그대로 재제출) (나) 참조 이미지가 이미 IDB에 있음 뿐. 이 API는 "없는 id 삭제 멱등"이라는 **다른 뜻의 계약을 차용**했고 flush 내용(이미지 포함)을 정하는 계약이 아니다. 또 SPEC R10 완화 "CP4가 있으면 `PendingRecord`를 편집기로 넘긴다"는 이미지 출처가 없다 — 재진입 맵은 IDB 복원뿐(`:139-145`)이라 제출 0 이미지는 거기에도 없다. 실제로 이 경로를 막는 것은 편집기 `failed` 언마운트의 `PendingDraft{images}`다(그것도 CP4 전용).
- **Q4 [P2] MQ-4-2 A "미확인 없으면 IDB 쓰기도 0" 과장.** `queue.retry` 분기는 `submitted.get(p)`와 **객체 동일**일 때만(`localSync.ts:154-155`). 이 탭에서 아직 제출하지 않은 레코드(IDB 시드 그대로 · origin `doc`의 R-4 경로 등)면 새 제출 → 문서 put + 세대 도장 +1 + `link.post({type:"saved"})`(`:125-131,145-149`). MQ-4-2 C를 기각한 사유("다른 탭 saved 신호")가 A에도 일부 해당한다. revision·내용·스냅샷 변화 0은 맞다.
- **Q5 [P3] 보호 범위 문장 과장 2곳.** (a) 3.3-5·R8 "공백은 POP·주소 입력" — 주소 입력은 문서 언로드라 모듈째 사라져 `PendingDraft`가 무의미하다. 그 경로의 보호는 마운트된 편집기의 기존 `beforeunload`뿐(이미 있음). Draft가 덮는 것은 POP뿐. (b) 3.3-3 "화면 언마운트로 보호가 사라지는 순간 0"은 기억이 있을 때만 참. 기억 없는 일반 dirty 편집의 POP은 CP4 없으면 지금처럼 경고 0·손실.
- **Q6 [P3] MQ-4-1 A "훅 인자 변경 1건" 과소.** CP4는 (a) 스케줄러 초기 phase (b) cleanup에서 스케줄러 최신 doc·phase 읽기(`Scheduler.doc` private, getter 0 — `useAutosaveScheduler.ts:73`) (c) `StudioLayout` images state 시드(`:310`) (d) 새 phase 또는 `failed` 재사용 + `change()` 전이 + `SaveStatus` 버튼(`SaveStatus.tsx:57-61`)을 바꾼다. 모두 화면 내부지만 1건이 아니며 `/studio` 바이트 추정(S2·S3)에 들어가야 한다.
- **Q7 [P3] 기타.** (a) memory 모드 resolve = 메모리뿐 — 6-1 "영속 확인"은 local 모드 한정이라고 적어야 한다. (b) restart 판정의 `hold`는 `await committed()`(getDoc) 뒤라(`RestartDialog.tsx:112`) `guarding`이 `startDoc` promise만 감싸면 카운트가 0을 거친다 — 판정 전체를 감싸야 한다(실제 공백은 microtask 수준 · L3). (c) create에 before `getDoc`가 새로 생기면 `call("getDoc")` seq가 1 밀려(`memoryProjectRepository.ts:70-71`) 기존 seq 주입 테스트가 바뀔 수 있다(RS4-AC-06 "변경 없이 통과"와 충돌 가능 · L3).

## 3. Codex adversarial-review r1 (1회 · 미재검토)

- 명령: `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs adversarial-review --scope branch --base 7dbf116 "<SPEC-4 r0.1/r0.1b 집중 문장>"` — 경로는 rs23 REPORT 42행과 같음 · `--help` 실행 0 · 원문 `logs/codex-r1.txt`(시작 시각 `logs/codex-r1.started`).
- 결과: **needs-attention · high 2 · medium 1**. Codex도 실행 테스트 0(읽기 전용 대조).

| ID | Codex 지적 | QA 확인 | 근거 수준 |
|---|---|---|---|
| C1 [high] | 저장 A 진행 중 B 편집 → POP → cleanup이 B를 `PendingDraft`로 보관 → A resolve가 5.3 "편집 저장 resolve하면 기억 삭제"로 B draft·이미지·경고를 지운다. 확인 요청 중 POP도 같음 | **확인.** `useDocSave.save`는 `await repository.saveDoc` 뒤 언마운트 검사 없이 이어진다(`useDocSave.ts:65-71`); `disposed` 검사는 스케줄러 콜백만(`useAutosaveScheduler.ts:193`). SPEC 3.4(`:155,158`)·5.3(`:257`)에 세대·pending 식별자 검사 없음. QA 독립 판단에서 놓친 항목 | L1-추적(설계 규칙 + 현 코드) |
| C2 [high] | 미커밋 `PendingStart`(R-E5인데 request 단계 실패)의 history 재진입에서 편집기 "저장 확인" = 재생이 아니라 **첫 커밋** → 문서 교체·revision +1. 편집기는 옛 내용·`revisionRef` 그대로 `saved` → 다음 편집 `STALE_DOC` | **확인.** `start`의 같은 키 재생이 아니면 새 문서·스냅샷 커밋(`memoryDocBook.ts:374-403`). `useDocSave`는 `initialDoc`을 state·ref로 고정(`:57-61`). SPEC 5.3 "저장 확인" 행은 `PendingStart` 확인 뒤 편집기 문서 인계를 정의하지 않음. QA가 놓친 항목 | L1-추적 |
| C3 [medium] | 재진입 `getDoc`이 이전 저장 커밋보다 먼저면 revision r → 이전 저장 r+1 → draft 저장 `STALE_DOC` · `base` 보정은 성공 완료에 미적용 | **QA Q2와 같은 결론**(독립 도출). 다만 QA는 "내용 손실 아님(충돌 흐름이 내 편집 유지) · 창 크기 L3"로 P2 | L1-추적 · 창 크기 L3 |

- Codex가 다루지 않은 QA 항목: Q1(확인 시작 **전** 미저장 편집 → 거짓 `saved`), Q3(편집기 밖 확인의 이미지 — RS4-R10 코드 추적 성립 · R10 완화문 출처 공백), Q4(MQ-4-2 A 쓰기 0 과장), Q5~Q7(범위 문장·변경 건수·모드·카운트·seq).
- 지적 출처 구별: **QA 단독** = Q1·Q3·Q4·Q5·Q6·Q7 · **Codex 단독** = C1·C2 · **공통** = Q2/C3.

## 4. r0.1 / r0.1b 수정 ↔ 실제 소비 코드 대조

| 수정 | 대조 결과 |
|---|---|
| r0.1 P1-1 `PendingDraft`(offline·dirty·커밋 전 failed 내용 보존) | 내용 복원 API 있음(`useDocSave.ts:46` `edit(next: PageDoc)`). 이미지 맵 복원 수단은 SPEC에 없음(`StudioLayout.tsx:310` state). 해제 규칙에 세대 검사 없음 → **C1** |
| r0.1 P1-2 확인 중 편집 버전 검사 | 시작 뒤 편집만 → **Q1**. `PendingStart` 확인이 문서를 바꾸는 경우 → **C2** |
| r0.1 P2 Origin `unknown` · F-6/F-6b · R-4u | 판정 근거와 맞음(2.1) — 결함 없음 |
| r0.1 advisor RS4-R10 · P-3 | 위험 인식은 맞고 코드 추적상 성립(**Q3**). 완화문 "CP4면 편집기로 넘김"은 이미지 출처가 없다 |
| r0.1b draft 재진입 = 메모리 `getDoc` + 첫 `edit()` | 메모리 커밋이 먼저인 순서에서만 충돌 0 → **Q2/C3**. under 상속 규칙은 타입상 성립 |

## 5. 상태 · 다음 단계

- 설계 BLOCKED 사유(수정 안 함): **P1 4건** — C1·C2(CP4 경쟁) · Q1(CP4 거짓 saved) · Q3(CP3 편집기 밖 확인의 이미지 — P-3 측정으로 확정 대기). P2: Q2/C3 · Q4.
- CP1~3 착수 가능 여부: CP4 결함(C1·C2·Q1·Q2)은 CP1~3을 막지 않는다. 단 CP3의 편집기 밖 "저장 확인"은 Q3/RS4-R10이 P-3 측정(RS4-AC-17)으로 부정되기 전까지 차단 — SPEC 8.0-3b와 같은 관문.
- 측정 대기(이 레인 실행 0): P-3 이미지 확인 경로 · Q2/C3 창 크기(첫 저장 청크 로드 중 POP) · draft 이미지 유효성(Blob 참조 유지).
- 별도 Developer `rs4-measure` 파일·세션 무접촉.
- 필요한 결정(사용자/Jarvis): SPEC-4 r0.2를 낼지(Designer 레인) — C1·C2·Q1을 CP4 규칙에 반영하고 RS4-AC-11에 세 경쟁 시나리오(A 저장→B 편집→POP→A resolve · 미커밋 PendingStart 재진입 확인 · getDoc 뒤 이전 저장 커밋)와 "확인 전 미저장 편집" 시나리오를 추가.
