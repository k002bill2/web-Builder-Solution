# RS6-L2 QA REPORT — liveness 독립 검증

대상 `k002bill2/rs6-l2-liveness` tip `3d18624c`(base `3a77c8eb`) · QA 2026-10-17 · Orca + Claude Code · Codex 미사용(BRIEF 제외)

## 0. 판정 — **PASS with notes**

- 변이 8종 중 7종이 기대한 테스트를 FAIL시켰다(검출됨). 1종(LV-2c)은 살아남았고, 등가 변이로 판단한다(추론 — 3절).
- 현재 사용자 경로의 동작 변화는 0이다. `aria-busy`는 live region 밖이라 `role=alert`·`role=status` 낭독을 막지 않는다(코드 + 실브라우저 DOM 실측).
- I7 변경은 안전하다. 포기 뒤 늦게 온 결과는 doc·mark·dirty·epoch·images를 바꾸지 않았다. 포기 뒤 save가 폐기된 초안을 되살리지 않았다(임시 테스트 4건 PASS, LV-2a 변이에서 3건 RED, 파일 삭제).
- fresh 게이트 4개 통과: 326 파일 / 2924 테스트, 번들 수치가 REPORT 0절과 같다.
- notes: ① LV-2c — finally 블록의 `if (live())`가 도달 불가 방어 코드다. ② note 3 잔여 — `core.discard()`는 connect 실패뿐 아니라 포기 전 `head()`·`verify()` throw에서도 reject한다. ③ `aria-busy`를 실제 스크린리더로 낭독해 보지 않았다(미확인).

## 1. 변이 표 (매번 `git checkout -- app/` → app dirty 0 확인)

| ID | 변이 | 대상 테스트 | 결과 |
|---|---|---|---|
| LV-1a | `watchSaving` slow 타이머 제거 | liveness.test · liveness.status.test | **FAIL 3** (U4 slow 2건 · T_hang alert 1건) |
| LV-1b | 스케줄러 단일 비행 해제(`onTimer` saving 분기 무력화 + `flush` saving 가드 제거) = 저장 중 추가 save 제출 허용 | liveness.test | **FAIL 1** (U4 "save 1개") |
| LV-2a | 포기 토큰 비교 제거(`live = () => true`, 늦은 결과 반영) | liveness.discard.test | **FAIL 2** (U5 늦은 결과 버림 · #1 늦은 끝 vs #2 배타) |
| LV-2b | 토큰 격리 깨기(finally에서 `s.discards += 1` 제거) | liveness.discard.test | **FAIL 1** (U5 늦은 결과 버림) |
| LV-2c | finally `if (live())` 가드 제거(항상 해제·증가) | liveness.discard · saveCore.modes | **생존** (22/22 PASS) — 등가 변이(3절) |
| note 1 | discard 진입 mark를 connect 뒤(`s.mark`를 then 안에서 읽기)로 | liveness.discard · saveCore.modes | **FAIL 1** (note1 blocked{newer}) |
| note 3 | `safely()` 제거(`run()` 그대로) | saveCore.reject.test | **FAIL 5/5** |
| CP3 | 재마운트 재발화 가드 제거(`hang = state.hang !== undefined`) | liveness.status · SaveStatus.test | **FAIL 1** (재마운트 재발화 0) |

로그: `/tmp/qa-mut/<ID>.log`(로컬, 커밋 안 함). 러너는 변이가 실제로 적용됐는지 해시로 확인했다.

## 2. 동작 변화 · 접근성

- **감시 미결선** [사실 L1 · grep]: `watchSaving` 호출처 0, `repo.core()` 호출처 0(`memoryProjectRepository.ts:141`에서 정의만 함). 따라서 `state.slow`·`state.hang`은 실경로에서 항상 `undefined`다.
- **SaveStatus 변경 3개** (`SaveStatus.tsx:45-46, 61, 69`):
  - `useState(state.hang)`: 초깃값을 한 번 담을 뿐 렌더 결과를 바꾸지 않는다. 미결선 상태에서는 `hang`이 늘 false라 `data-alert-key`가 붙지 않는다. 실측에서도 `key: null`이었다.
  - `data-alert-key`: 데이터 속성이라 접근성 트리에 영향이 없다.
  - `aria-busy` on 상태 글자 `<p>`: 상태 글자는 live region 밖이다. `SaveStatus.test.tsx` `liveAncestor`가 null이고, 실브라우저에서 `closest('[aria-live],[role=status],[role=alert],[role=log]')`도 null이었다. `role=alert` `<p>`는 형제 노드이고, "편집 알림" `role=status`(`StudioPanels.tsx:35`)는 다른 서브트리에 있다. 그래서 aria-busy는 어느 live region의 조상도 아니고 낭독 보류를 일으키지 않는다 [사실 L1 — DOM 구조]. 상태 글자는 원래 낭독 대상이 아니다(컴포넌트 주석·E-AC 계약).
- **실측 전이** (preview · 편집 1회): `"" → "저장 전 변경 있음" → "저장 중…"(aria-busy=true) → "이 브라우저에 저장됨 · 방금"(aria-busy 없음)`. alert 노드 1개, 비어 있음. 기존 글자와 같다.
- **포커스**: 포커스 가능 요소의 추가·삭제가 없다.
- **기존 테스트**: `SaveStatus.test.tsx`·스튜디오 테스트 수정 0, 전부 PASS(6절).
- 판정: **동작 변화 0** [사실 L1 — 코드·테스트·브라우저]. 다만 aria-busy=true 동안 일부 스크린리더가 가상 커서에서 해당 `<p>` 내용 노출을 미루거나 "busy"를 읽을 가능성은 남는다. 실제 스크린리더 미실행이라 [미확인 · 영향 Low].

## 3. MC I7 변경 안전성

코드 추적 (`coreIo.ts:75-114`):
- 포기 토큰은 `token = ++s.discards`로 잡는다. 읽기 본문은 `head` 뒤와 `verify` 뒤에서 `live()`를 확인하고, 마지막 확인과 상태 변경(doc·committed·savedMark·epoch) 사이에는 await가 없다. 그래서 포기 뒤 늦게 온 결과는 상태 변경 전에 반드시 `undefined`로 빠진다.
- 포기(타임아웃)하면 race가 끝나고 바로 finally가 돌아 `discarding=false`·`discards+1`이 된다. 늦은 reject는 `read.catch`가 삼킨다.
- **LV-2c 등가 근거** (추론, Medium-High): finally는 호출당 1번만 돈다. 그 시점에 `s.discards`를 바꿀 수 있는 건 다른 discard의 `+= 1`뿐이다. 그런데 다른 discard는 `s.discarding === true`이면 토큰을 올리기 전에 `rejected{discarding}`로 끝나고, `discarding`은 이 finally에서만 false가 된다. 따라서 finally 안 `live()`는 항상 true이고, 이 가드는 도달 불가 방어 코드다. 실제 격리는 토큰 비교(LV-2a·2b가 고정)가 맡는다.
- 이론상 창 (추정 Low): 타이머 콜백과 포트 결과가 같은 마이크로태스크 체크포인트에서 처리되면 race가 timeout을 반환한 뒤에도 읽기가 상태를 바꿀 수 있다. IDB 결과는 별도 태스크로 오므로 실경로에서는 성립하지 않는다고 본다.

임시 테스트 `qa.i7.tmp.test.ts` (제어 가능한 포트 · 실행 뒤 삭제):

| # | 시나리오 | 결과 | LV-2a 변이 |
|---|---|---|---|
| 1 | `verify` 단계 정지 → 포기 → 늦은 verify(true) | `view()` 전체 동일(doc B · mark · dirty · epoch 0 · images) | RED |
| 2 | 포기 #1 → 재시도 #2 성공(A 복귀, epoch 1) → 늦은 #1 도착 → save | 상태 = #2 결과 그대로 · 새 커밋에 B 0 · IDB = A (**폐기 초안 되살림 0**) | RED |
| 3 | 포기 → 편집 C → 늦은 결과(head A) | C 보존 · dirty · save = C | PASS(mark 가드가 이중 방어) |
| 4 | 포기 → save B 진행 중 늦은 head 도착 | 결과 버림 · IDB = B · dirty 0 · epoch 0 | RED |

판정: **안전** [사실 L1 — 실행]. CE-1(근거 없으면 초안 보존)·CX-3(바인딩 = 복귀 문서 커밋 이미지) 의미가 유지된다. 포기 결과는 "폐기 안 됨"이므로, 포기 뒤 save가 초안 B를 쓰는 것은 되살림이 아니라 보존이다.

## 4. note 3 잔여 위험 (L3·L4가 catch할 위치)

현재 호출처 0 [사실 L1 · grep]: `core.discard()`·`core.link(...)`·`repo.core()`를 프로덕션에서 부르는 곳이 없다. 테스트(`testRig.confirmOf`·`saveCore.modes`·`liveness.discard`)에서만 쓴다.

임시 테스트 `qa.n3.tmp.test.ts` 결과 (실행 뒤 삭제):

| 경로 | connect 실패 | 포트 throw |
|---|---|---|
| `core.save()` | resolve `failed{unavailable}` (`saveCore.ts:84-92`) | resolve `failed{infra}` (note 3) |
| `core.link((io…) => io.confirm(…))` | **reject** | resolve `failed{infra}` (mode·verify) |
| `core.discard()` | **reject** | **reject** — 포기 전 `head()`·`verify()` throw (가드는 해제, 초안 보존) |
| `core.link((io, s) => io.replace(…))` | **reject** | 동기(포트 없음) |

L3·L4가 catch해야 할 위치:
1. 이탈 저장 대기·confirmDoc 경로에서 `core.link` confirm을 부를 때 — reject는 `failed`(이탈 차단)로 매핑한다.
2. 폐기 대화상자(L4)의 `core.discard()` — reject는 `blocked`(초안 보존 + 오류 안내)로 매핑한다. timeout과 별도의 "읽기 실패" 문구가 필요한지 L4가 결정한다.
3. 문서 교체 진입점의 `core.link` replace — chunk 실패 시 reject가 난다.
4. (선택) 코어 쪽에서 막으려면 `discard`·`link` 둘 다 `save`처럼 connect 실패와 `read` reject를 결과로 바꾼다. 이 레인 범위 밖이다.

관찰 (별건, 이 diff가 바꾼 것 아님): `io.discard`는 `port.mode()`를 확인하지 않는다(읽기 + 로컬 상태만). 읽기 전용 탭에서 폐기를 허용할지는 L4 결정 사항으로 남긴다.

## 5. 실화면 (Ego Lite space 11 · `vite preview` 127.0.0.1:4374 · fresh build 산출물)

| 단계 | 결과 |
|---|---|
| origin IDB·localStorage 비움 → 카탈로그 → 비교 추가 2개(모던 카페·동네 치과) → 전부 선택 A → 프로필 확정 v1 → 3안 → A안 → 편집 시작 | `/studio/project-1` (`qa-shots/01-studio-enter.png`) |
| 제목 → "QA L2 회귀 제목" | "저장 중…"(aria-busy) → "이 브라우저에 저장됨 · 방금" (`02-edited-saved.png`) |
| 새로고침 | 제목 복원 |
| 편집 "QA L2 두 번째 편집" → 저장됨 → 앱 안 링크 `/projects` | "모던 카페 브랜드 프로젝트 · 편집 중 · A안 · 프로필 v1" (`03-projects.png`) |
| 편집기 열기(앱 안) | 두 번째 편집 복원 |
| 콘솔·네트워크 (새로고침~/projects 2라운드, Runtime·Log·Network 수집) | 응답 45 + 38 이벤트 중 exception·console error/warn·Log error·loadingFailed·≥400 **0** |
| 정리 | `Storage.clearDataForOrigin`(4374, indexeddb·local_storage) → `indexedDB.databases()` = `[]` · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료 · 4374 리슨 0 · 5480·영환님 창 무접촉 |

- 한계: 카탈로그~편집 시작 구간은 콘솔 수집 전이다. 오류 0은 편집·새로고침·`/projects`·재진입 구간에서 확인했다. 첫 preview가 백그라운드 시간 한도(600s)로 중간에 끊겨 같은 포트로 다시 띄웠고, 그 뒤 구간은 정상이었다.

## 6. 게이트 (fresh · 변이 전 깨끗한 트리)

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test -- --run` | exit 0 · **326 파일 / 2924 테스트 PASS** (기대 326/2924 일치) |
| `npm run build` | exit 0 · `/studio` 정규화 **128.63**(기준선 128.63 + 0.03, 상한 129.13 안) · raw 129.95 · 복원 정규화 **131.61**(상한 132.11 안) · raw 132.98 — REPORT 0절 128.63/129.95와 같음 |

기존 테스트 수정 [사실 L1 · `git diff --diff-filter=DM`]: 2개 파일뿐이다.
- `saveCore.modes.test.ts:12` `discardOf`: `core.link(io.discard)` → `core.discard()`. **완화 아님**이다. 진입 mark를 connect 전(호출 시점)에 잡으므로 더 엄격하고, `io.discard` 시그니처에 `entered`가 필요해져 옛 줄은 타입 오류가 된다. 단언은 바뀌지 않았다.
- `bundleBudget.test.mjs`: 기준선 기대값 4개(128.55→128.63 · 131.53→131.61 · raw 129.88→129.96 · 132.92→132.99)만 바뀌었다.
- 삭제된 테스트는 0이다.

## 7. 사실 / 추정 / 미확인 · L3에 넘길 것

- **사실 [L1 · 실행]**: 1절 변이 8종 결과, 3·4절 임시 테스트(삭제됨), 5절 브라우저 흐름과 오류 0, 6절 게이트, 호출처 0 grep.
- **추정**: LV-2c 등가(3절 논증, Medium-High). 마이크로태스크 동시 처리 창의 실경로 불성립(Low risk).
- **미확인**: 실제 스크린리더(VoiceOver/NVDA)에서 aria-busy 동안 상태 글자 노출. 감시 결선 뒤 실경로 slow·hang 표시(L3 몫).
- **L3에 넘길 것**:
  1. 4절 catch 위치 1~3. `core.link`·`core.discard()` reject를 결과로 매핑하거나 코어에서 흡수한다.
  2. `watchSaving` 결선 시 `stop()`을 스케줄러 dispose와 함께 부른다(테스트는 둘 다 호출하는 경우만 고정).
  3. L4가 hang 문구를 넣을 때는 `role=alert` `<p>`에 넣는다. aria-busy가 붙는 상태 글자 `<p>`에 넣지 않는다.
  4. LV-2c 가드는 남겨도 무해하다. 지우려면 별건으로 다룬다.
  5. raw 판정선(129.95 / 130, 여유 0.05)은 개정 17 결정 2에 따라 L3가 처리한다(REPORT 4번과 같음).
