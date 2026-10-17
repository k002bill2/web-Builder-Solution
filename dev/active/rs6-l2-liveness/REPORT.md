# RS6-L2 REPORT — liveness: 저장 감시 · discard 포기 토큰 + L1 QA notes 1·3·4

- 브랜치 `k002bill2/rs6-l2-liveness` · base `3a77c8eb` · 2026-10-17 · 브리프 `BRIEF.md`.
- 쓰기 경로: `features/studio/save/**` · `useAutosaveScheduler.ts`(타입 필드 2개만) · `components/studio/SaveStatus.tsx`(BRIEF CP3 "role=alert/aria-busy 결선") · 예산 파일 2개 · `rs6-l1-port/HARNESS-MAP.md`(문서 정정) · 이 폴더.
- 편집기 배선 0 · 문구 본문 0(`saveStatusText.ts` 변경 0) · `/projects` 0 · 레코드 형식·`StudioPersistence`·엔진/PageDoc·스키마·의존성 변경 0.
- push·merge·원격 쓰기 0 · Codex 0 · 다른 워크트리 0 · 브라우저 0 · amend·rebase 0.

## 0. 결론

**CP1~CP3 · note 1·3·4 완료 · note 2는 L3 전 조건으로 이월 · 예산 L2 목표 안.**
- `/studio` 정규화 **128.63**(base 128.55 → **+0.08**, L2 목표 ≤ +0.10 · 상한 129.13). 복원 **131.61**(+0.08, 상한 132.11). raw **129.95** · 복원 132.98.
- 최종 fresh 게이트: typecheck 0 · lint 0 · test **326 파일 / 2924건** 통과(base 322/2902 대비 +4 파일 / +22건) · build 0.
- 감량은 2회 했다. CP마다 1회이며, 모두 상한 초과 전에 했다.
  - CP1: 감시를 스케줄러 본문에서 `onChange` 데코레이터로 옮겼다(+0.11 → +0.00).
  - CP3: 알림 키를 별도 모듈로 분리했다(+0.15 → +0.06).

| 커밋 | 내용 |
|---|---|
| `7ab50191` | BRIEF · PROGRESS |
| `32de59d4` | CP1 LV-1 `watchSaving` slow·hang 표지 · `view()` mark·inflight · 시간 상수 1곳 |
| `7f9bda3c` | CP2 LV-2 포기 토큰 · `core.discard()` 동기 진입(note 1) · MC I7 문장 · 기준선 128.57/131.56 |
| `653764d9` | CP3 `T_hang` alert 키 1회 · 재마운트 재발화 0 · `aria-busy` · 기준선 128.63/131.61 |
| `03ee5405` | note 3 포트 `mode`·`verify` throw = `failed{infra}` |
| `83343602` | note 4 HARNESS-MAP 집계 정정 · #28·#20 보강 테스트 |
| (이 커밋) | REPORT · PROGRESS 마감 |

## 1. AC 판정 (L2 몫)

| AC | 판정 | 근거 |
|---|---|---|
| RS6-AC-U4 (LV-1) | **PASS — 단위(스케줄러 + 코어)** | `save/liveness.test.ts` 6건으로 다음을 고정했다. ① `SAVE_SLOW_MS` 전에는 `saving`, 뒤에는 `saving`+`slow`, 추가 save 제출 0 ② slow 중 편집을 받고, 디바운스·maxWait가 지나도 save는 1개, 해제 뒤 최신 1회 ③ 빨리 끝난 성공·실패 위에 표지가 붙지 않음 ④ dispose+stop 뒤 발화 0 ⑤ 감시가 없으면 지금 동작 그대로 ⑥ 코어: commit 지연 주입 시 `view().inflight` 1, 편집 수용(mark 증가), 해제 뒤 `newer:true`, inflight 0. **편집기에서 실제로 켜는 것은 L3다**(3절) |
| RS6-AC-U5 (LV-2) | **PASS** | `save/liveness.discard.test.ts` 다음 4건이다. ① 읽기 정지 → `DISCARD_GIVE_UP_MS` 뒤 `blocked{timeout}`(직전에는 미결) · 늦은 결과 버림(doc·images·dirty·epoch·mark 불변) · 가드 해제 뒤 save 커밋 ② 포기 뒤 늦은 읽기 reject를 삼킴 ③ 토큰 격리: #1 포기 → #2 진행 중에 #1의 늦은 끝이 #2의 배타를 풀지 않음 ④ 시간 안에 끝나면 지금 결과 그대로. **CE-1·CX-3 회귀**: `saveCore.modes.test.ts` 14건 GREEN(h6-7·h6-8 포함 — 헬퍼가 `core.discard()` 경유) |
| RS6-AC-U11 | **L2 몫 PASS(기반만) · 나머지 L3** | L2 몫은 다음 둘이다: `view().inflight` 노출 · 정지 중 상태 표지가 phase `saving`을 유지(떠나기 대기·`/projects` "저장 중…" 판정 출처). 링크 이동·IDB 마지막 편집은 편집기 배선(L3)이 필요하다 |
| (CP3) `T_hang` alert 1회 · 재마운트 재발화 0 | **PASS(키 결선)** | `save/liveness.status.test.tsx` 3건. 실제 스케줄러+`watchSaving` 상태 열에서 `T_hang` 전에는 키 0, 뒤에는 `data-alert-key="save-hang"` 1개. 재마운트(같은 차례)는 키 0, 새 차례는 다시 1회. `aria-busy`는 saving(slow 포함) 동안만 붙는다. **글자 본문은 L4** |

## 2. L1 QA notes 처리

| note | 처리 | 근거 |
|---|---|---|
| 1 discard connect 창 | **닫음** | `core.discard()`가 호출 시점 mark를 connect 전에 동기로 잡아 `io.discard(s, link, entered)`로 넘긴다. QA 4절 시나리오 B를 정식 테스트로 만들었다("note1 … 편집 C → blocked{newer} · C 보존"). 시나리오 A(`rejected{inflight}`) 회귀도 GREEN이다. 변이(진입 mark를 connect 뒤에 잡기)를 넣으면 RED 1이다(`logs/cp2-mut-note1.log`). `io.discard`의 `entered`는 **필수 인자**라서 옛 호출 모양(`link(io.discard(s, link))`)은 타입 오류가 난다 |
| 2 DocBook 직접 쓰기 revision 충돌 | **이월 — 고치지 않음** | 4절 "L3 전 조건" |
| 3 save·confirm reject | **닫음** | `coreIo` `safely()`가 `mode()`·`verify()` throw를 `failed{infra}`로 바꾼다(포트 오류에 `reason`이 있으면 그 값). `save/saveCore.reject.test.ts` 5건 RED 5("promise rejected … instead of resolving" · `logs/note3-red.log`) → GREEN이다. 거짓 saved 0: mode throw면 dirty·`hydrated`가 그대로이고, 저장 뒤 verify throw면 커밋은 됐으나 confirmed가 아니다 |
| 4 HARNESS-MAP 집계 | **정정 + 보강 2건** | 집계를 ① 30 = 완전 25 + 부분 5(#9·#12·#28·#30·#32)로 바로잡았다. #20 근거가 0건이었다는 점도 명시했다. 보강 테스트: #28(discard 읽기 중 replace → `blocked{newer}` — 완전으로) · #20(IDB 재읽기 ≠ 마지막 증명 → `blocked{stale}` — 변이 RED 1 `logs/note4-mut-stale.log`). 보강 뒤 ① = 완전 26 + 부분 4 |

## 3. 다르게 한 것 (사유 1줄씩)

| 항목 | 브리프·설계 | L2 | 사유 |
|---|---|---|---|
| `saving-slow` | "phase `saving-slow`"(I6 3절·8.1) | `phase:"saving"` + `slow:true` 표지 | 새 phase 리터럴을 넣으면 `useDocSave.ts:120` 떠나기 대기(`now === "saving"`)가 정지 중에 `false`로 풀린다(L3 동작 변경). 또 `saveStatusText` exhaustive switch(L4 본문)를 고쳐야 한다. I6 8.1 표기도 "`saving` (+ `saving-slow`)"다 |
| 감시 위치 | "스케줄러 감시 타이머" | 스케줄러 `onChange` 데코레이터 `watchSaving()`(`save/liveness.ts`). 스케줄러 본문은 변경 0 | 스케줄러 본문에 넣으면 진입이 +0.11 늘어 멈춤선을 넘었다(CP1 1차 실측). 스케줄러는 저장 1회마다 `saving`을 1번만 알리므로, 그 알림을 저장 시작 시각으로 쓴다 |
| 감시 켜기 | — | 이 레인에서는 편집기 훅에 붙이지 않는다 | 편집기 배선 = L3. 붙이는 비용은 약 +0.1로 **추정**한다(CP1 1차 실측 +0.11에서 view 필드 몫을 빼면 비슷하다 — L3가 실측) |
| `T_hang` alert | "alert 1회" | `role=alert`에 `data-alert-key`만 붙인다. 글자 본문 0 | 문구 본문은 L4 소유(BRIEF). 키를 받기 전까지 낭독 글자는 없다 |
| `aria-busy` | 버튼·폐기 대화상자(I6 8.4) | `SaveStatus` 상태 글자 `<p>`(saving 동안) | LV-1은 버튼 0이고 폐기 대화상자는 L4가 만든다. alert 영역의 조상에 두면 busy 동안 alert 낭독이 보류될 수 있어 글자 요소에 둔다 |
| 알림 키 모듈 | 상수 1곳 | 시간 값 = `save/liveness.ts` · 키 = `save/alertKeys.ts` | 같은 모듈이면 조작 뒤 `coreIo`가 진입 청크에서 시간 값을 받는 간선이 생겨 진입이 +0.15(CP3 1차 실측) |

## 4. L3 전 조건 (이월)

1. **[L1 QA note 2 그대로 · Medium · L3 차단]** `restoreSnapshot`·`resolveConflict`·`startDoc(restart)`는 아직 DocBook에 바로 쓴다. 코어 revision(`confirmed.revision + 1`)이 모르는 사이에 revision이 바뀌므로, 배선하면 같은 revision 번호로 덮어쓸 수 있다. 지금은 호출처가 0이라 도달하지 않는다. **L3는 이 셋을 코어 `replace` 경유로 바꾸거나 revision 기준을 코어와 맞춘 뒤에 배선한다.** 이 레인에서는 고치지 않았다.
2. 감시 결선: 훅이 `watchSaving(setState)`를 쓰고, dispose 때 `stop()`을 부른다. 진입 증분은 약 +0.1(추정)이며 L3가 실측한다. 표지만 붙으므로 phase는 `saving` 그대로다 → `useDocSave:120` 수정은 필요 없다.
3. discard는 **`core.discard()`만** 부른다. `core.link`로 `io.discard`를 직접 부르면 진입 mark를 connect 뒤에 잡게 되어 note 1 창이 다시 열린다. 타입상 `entered`가 필수라 실수하면 드러난다.
4. raw 여유: `/studio` raw 129.95 / `eagerBudgetKb` 130이라 남은 여유가 **0.05**다. 개정 17 raw 한도 130.5까지 쓰려면 L3에서 `check-bundle-size.mjs` 판정선 조정이 필요하다(**Jarvis 확인 사항** — 이 레인은 그 파일을 수정하지 않았다).
5. L4: `SAVE_HANG_ALERT`·`DISCARD_TIMEOUT_ALERT` 키를 글자로 매핑한다(I6 3절 문구 후보). 폐기 대화상자 `aria-busy`와 시간 초과 alert, 포커스 "취소" 유지도 L4다.

## 5. 시간 값 (잠정 — QA 실측 뒤 Jarvis 결정, MQ-6-3b) — `save/liveness.ts`

| 상수 | 잠정값 | 근거 |
|---|---|---|
| `SAVE_SLOW_MS` | 2000 | 선례 `data/memoryCompareBoardRepository.ts:118-128` — 첫 저장 안내 판정이 싱크 지연을 "2초"로 끊는다(주석 :118 "싱크 실패·지연(2초)"). 자동 저장 디바운스 `AUTOSAVE_DEBOUNCE_MS` = 2000과 같은 단위다 [L1 코드] |
| `SAVE_HANG_MS` | 10000 | 선례 없음. `SAVE_SLOW_MS`의 5배로 정했다(**추정**). alert는 탭 닫기 경고 성격이라 slow보다 충분히 늦게 둔다 |
| `DISCARD_GIVE_UP_MS` | 5000 | 선례 없음(**추정**). discard 읽기 = IDB get(head) + verify다. 쓰기 큐가 바쁘면 읽기가 늦어질 수 있어 slow보다 길게 잡았다. 시간 초과여도 초안·바인딩을 보존하므로 짧게 잡혀도 손실은 0이다 |

- 테스트는 전부 가짜 타이머와 상수 참조로 동작만 고정한다(리터럴 0). 값을 바꿔도 테스트는 바뀌지 않는다.

## 6. MC I7 변경 문장 (`save/saveCore.ts` 머리 주석에 기록)

- 옛 문장: "읽기가 끝나지 않으면 가드도 풀리지 않는다(liveness)."
- 새 문장: "discard 읽기가 `DISCARD_GIVE_UP_MS` 안에 끝나지 않으면 포기 토큰을 무효화하고 가드를 풀며 `blocked{timeout}`을 돌려준다. 늦게 온 읽기 결과는 버린다(doc·바인딩·savedMark·epoch 변경 0, 초안·바인딩 보존). 진입 = 호출 시점(connect 전 동기 mark)." — 취소 0 · 자동 재시도 0.
- 구현: `CoreState.discards`(차례 토큰) · `coreIo.discard`의 `Promise.race(읽기, 포기)` · finally는 **토큰이 현재일 때만** 배타를 풀고 토큰을 올린다 · 버려진 읽기의 reject는 `.catch`로 삼킨다.

## 7. 예산 표 (개정 17 — `npm run build` 정식 출력)

| 시점 | /studio 정규화 | 복원 정규화 | /studio raw | 복원 raw | 기준선 조치 |
|---|---|---|---|---|---|
| base `3a77c8eb` | 128.55 | 131.53 | 129.88 | 132.92 | — (`logs/base-build.log`) |
| CP1 1차(스케줄러 본문) | 128.66 (+0.11) | 131.64 | 129.98 | 133.01 | 멈춤선 128.58 초과 → 감량 |
| CP1 `32de59d4` | 128.55 (+0.00) | 131.54 | 129.89 | 132.92 | 변경 0 |
| CP2 `7f9bda3c` | 128.57 (+0.02) | 131.56 (+0.03) | 129.90 | 132.93 | normEagerKb 128.57·131.56 · eagerKb 129.90·132.93 · note "개정 17 배분 RS6-L2 CP2" · `bundleBudget.test.mjs` 2줄 |
| CP3 1차(키 = liveness.ts) | 128.72 (+0.15) | 131.70 | 130.10(한도 130 초과) | 133.13 | 감량 |
| CP3 `653764d9` | 128.63 (+0.06) | 131.61 (+0.05) | 129.96 | 132.99 | normEagerKb 128.63·131.61 · eagerKb 129.96·132.99 · note CP3 · 테스트 2줄 |
| note 3 `03ee5405` | 128.63 | 131.61 | 129.95 | 132.98 | 변경 0(조작 뒤 청크) |
| 최종(fresh · `logs/final-build.log`) | **128.63** | **131.61** | **129.95** | **132.98** | — |

- L2 누적: 정규화 +0.08 · 복원 +0.08 · raw +0.07. 남은 RS6 몫(L3~L5): 정규화 **0.50**(129.13까지) · 복원 0.50 · raw 0.55(130.5까지 — 단 판정선 130까지는 0.05).
- 진입 증분의 출처: `saveCore.ts`(`discard()` 메서드 · `discards` 필드 · view mark·inflight)와 `SaveStatus.tsx`(`useState` 마운트 차례 · `aria-busy` · `data-alert-key` · `alertKeys` 모듈)다. 감시(`watchSaving`)와 포기 판정(`coreIo`)은 진입 밖이다.

**전 라우트 번들 표(최종 빌드)**

| 라우트 | 첫 화면 / 예산 | 진입 / 예산 | base 진입 |
|---|---|---|---|
| /catalog | 100.06 / 101 | 102.39 / 125 | 102.39 |
| /references/:id | 97.47 / 100 | 99.81 / 125 | 99.81 |
| /compare | 98.96 / 100 | 122.70 / 125 | 122.71 |
| /compare (조정 있음) | 98.96 / 100 | 122.70 / 125 | 122.71 |
| /profile | 99.56 / 100 | 120.10 / 125 | 120.12 |
| /profile (3안 있음) | 99.56 / 100 | 122.57 / 125 | 122.59 |
| /projects | 99.15 / 100 | 108.86 / 125 | 108.85 |
| /studio/:projectId | 91.54 / 100 | 129.95 / 130 (정규화 128.63) | 129.88 (128.55) |
| /studio/:projectId (복원 진입) | 91.54 / 100 | 132.98 / 134 (정규화 131.61) | 132.92 (131.53) |

- /compare·/profile −0.01~−0.02는 raw 해시 이름 흔들림 범위다(이 레인은 그 라우트 코드를 건드리지 않았다 — 원인 청크는 미분석).

## 8. 테스트 (신규 4파일 · 22건) · 기존 테스트 대조

| 파일 | 건수 | RED 예측 → 실측 |
|---|---|---|
| `save/liveness.test.ts` | 6 | 6 → 6(모듈 없음 · `logs/cp1-red.log`). GREEN 중 테스트 타이밍 결함 1건을 고쳤다(제출 동결 전 편집 → `await ticks()` 뒤 편집) |
| `save/liveness.discard.test.ts` | 8 | 7 → 7(`core.discard` 없음 · `logs/cp2-red.log`) + 보강 1(#20, 구현 뒤 추가 — 변이 RED로 검출력 확인) |
| `save/liveness.status.test.tsx` | 3 | 3 → 3(`logs/cp3-red.log`) |
| `save/saveCore.reject.test.ts` | 5 | 5 → 5(reject · `logs/note3-red.log`) |

| 대상 | 결과 |
|---|---|
| INTEGRATE-6 11절 목록(useDocSave*·스케줄러·StudioLayout·SaveStatus·saveStatusText·StudioLeave 등) | **전부 변경 0 · GREEN** |
| 11절 밖 기존 테스트 | `save/saveCore.modes.test.ts` 헬퍼 `discardOf` 1줄 = `core.discard()`(제품 경로로 바꿈 · 단언 변경 0 · 14건 GREEN) · `scripts/bundleBudget.test.mjs` 기대값 2줄 ×2회(개정 17 절차) |
| 기존 단언 약화·skip | 0 |

## 9. 사실 / 추정 / 미확인

- **사실 [L1 · 실행]**: 7절 수치(`logs/*-build.log`) · 최종 게이트(`logs/final-{typecheck,lint,test,build}.log` — 마지막 코드 변경 뒤 fresh) · RED 로그 4개 · 변이 3종 RED(`cp2-mut-note1` · `cp2-mut-token` · `note4-mut-stale`, 모두 원복 뒤 GREEN).
- **추정 [L3]**: 감시를 훅에 붙일 때 진입 약 +0.1 · `SAVE_HANG_MS`·`DISCARD_GIVE_UP_MS` 값의 적정성(선례 없음).
- **미확인**: 실제 IndexedDB 정지 상황에서의 동작(브라우저 0 — QA 레인) · 실제 스크린리더에서 `data-alert-key`만 있는 alert의 낭독(글자 0이라 낭독 0으로 예상 — L4가 글자를 채운다) · `aria-busy`가 상태 글자 `<p>`에 있을 때 AT가 어떻게 다루는지 · `/compare`·`/profile` −0.01~0.02 흔들림의 청크 원인.
- **로그 위치**: `logs/*.log`는 `.gitignore` 대상이라 커밋되지 않는다(로컬에만 있다 — L1과 같다).
