# QA-REVIEW — RS6 설계 독립 검토 (INTEGRATE-6 r0 · MQ-6 · RS6_INTEGRATE_PLAN r0)

- 검토 QA(Orca Claude Code) · 발주 Jarvis 2026-10-17 · 대상 tip `7189816e`(base `c7a7a2a8`) + origin/main `6d321936`의 `dev/active/backlog-rs-status/REPORT.md`.
- 읽기 전용: 설계 문서·코드 수정 0 · 빌드·측정·브라우저 실행 0 · Codex 0 · push 0. 근거 표기 **[L1]** 코드·문서 행 직접 확인 · **[L1-추적]** 여러 행을 이어 읽은 경로 추론(실행 0) · **[L3]** 추정.
- 약칭: **I6** = `docs/design/restart/INTEGRATE-6.md` · **PLAN** = `docs/04-plan/RS6_INTEGRATE_PLAN.md` · **MC** = 코어 MINIMAL-CONTRACT.

## 0. 판정

**보완 후 가능** — 구현 판단(MQ-6-1·6-3 결정)과 L0 측정 레인 발주 전에 아래 P1 3건을 I6에 명세로 보강해야 한다. 셋 다 기존 MQ-6-1 ★A(코어 상태기 + `LocalSync` 포트) 틀 안에서 닫을 수 있어 재설계는 아니다.

| # | 심각도 | 요지 | 보완 형태 |
|---|---|---|---|
| R1 | **P1** | 링크 이탈 "저장 대기 제거"(LV-1 공통 행 · D6-9) 뒤 **save를 내는 주체·탭 수준 떠나기 경고 주체가 없다** → B-RS-01(이탈 저장 보장)이 "탭 메모리 보존"으로 약해진다. D6-9의 "readonly는 지금처럼 보류"는 **사실 오류**(지금 readonly는 이동한다), D6-9 자체가 SPEC-4 RS4-AC-06과 충돌하는데 13절에 D행이 없다 | I6 3절·D6-9 명세 + MQ 1개 + AC 추가 |
| R7 | **P1** | G1 "문서 필드 작성자 = 코어 단독"이 DocBook 경로 레코드 재쓰기(`deleteSnapshot`·`createSnapshot`·내보내기·`confirmDoc` → `write`가 `book.docOf`로 레코드 통째 put)를 덮지 않는다 → IDB 문서가 옛 revision으로 되돌아가고 GC delete가 새 이미지를 지울 수 있다 | I6 5절 G1 규칙 1줄 + RED AC 1건 |
| R2 | **P1** | **코어가 존재하는 시점**이 정해지지 않았다. `edit()`·`view()`·`acquire()`는 편집기 마운트 때 동기인데 `openSaveCore`는 async(`readStored` await)이고, 레지스트리는 조작 뒤 청크인 `LocalSync`에 매달리며, memory 모드에는 `LocalSync`가 없다 | I6 2.2-2·9.2 명세(코어 생성 시점·레지스트리 위치·memory 모드) — L0 S6b 측정 전에 필요 |

P2(계획 쓰기 경로 누락 · D6-9 숨은 결정 · L0 S6b/c 실행 가능성·상쇄 조건 · 11절 깨질 테스트에 `StudioLeave.test.tsx` 누락 · 12건 중 누락 7 — 특히 RS4-B1)는 같은 보완 회차에 함께 닫으면 된다. 세부 = 3·6절.

## 1. 사실 대조 (L1 표본)

메인 직접 확인 M1~M7 + 서브에이전트 ① 38건(1.1). 합계 L1 표본 45건(중복 제외 약 40).

| # | I6 위치 | 주장 | 실제 [L1] | 판정 |
|---|---|---|---|---|
| M1 | I6 3절 LV-1 공통 행 · D6-9 | 지금 `readonly`면 링크 이동 보류("지금처럼") | `StudioLeave.test.tsx:158,173,199` — 읽기 전용 거절(·Web Locks 없는 로컬 폴백)이면 **다시 저장해 보고 거절이면 이동한다**. `useDocSave.ts:142-146` `leave()` = `flushed().then(ok => ok \|\| readOnly.current)` | **오류**(메인) |
| M2 | I6 6.3 `StudioLayout.tsx` 행 | 앱 안 링크 `flushBeforeLeave`(:130-148) | `StudioLayout.tsx:127-148` 주석+`flushBeforeLeave` 본문(:133-148). 연타 무시·실패 보류·수정 키·`a[download]` 통과 일치 | 일치(메인) |
| M3 | I6 6.3 `useDocSave.ts` 행 | 훅 층 유일 저장 호출 `repository.saveDoc`(:69) | `useDocSave.ts:69` `await repository.saveDoc(...)` | 일치(메인 — 전수는 ① 표) |
| M4 | BRIEF "기존 `StudioLeave.test.tsx` 14건" | 14건 | `StudioLeave.test.tsx:99~266` `it(` 14개 | 일치(메인) |
| M5 | I6 0절-2 · 2.1 | `main.tsx:30` 공유 로더 1회 | `main.tsx:29` `const loadStudio = createSharedLoader(...)` → `deferredStudio.loadDeferredStudio` · `sharedLoader.ts:5-13` 성공 Promise 재사용·실패 시 비움 | 부분(지연 1회 · F1) |
| M6 | I6 2.2-2 · 1.1 `openSaveCore` 행 | 코어 열기 = 레지스트리에서 받음 | `saveCore.ts:106-108` `export async function openSaveCore` → `await readStored(persistence, projectId)` — **열기가 async** | 일치(사실) — R2의 근거 |
| M7 | I6 7절 "떠날 때 할 일 = `release(token)`뿐" | release로 충분 | `saveCore.ts:261-263` `release`는 `live = undefined`만 — save 발사 0 · `useAutosaveScheduler.ts:134-137` `dispose` = 타이머 삭제만 | 일치(사실) — R1의 근거 |

### 1.1 서브에이전트 ① 사실 대조 표 (38건 · 일치 25 / 부분 9 / 오류 3 / 확인불가 1)

`git diff c7a7a2a8 HEAD -- app/src` 빈 출력 — 행 불일치는 코드 변경이 아니라 문서 오류다. 메인 재확인 행 = ★.

| # | I6 위치 | 주장 | 실제 [L1] | 판정 |
|---|---|---|---|---|
| F1 | 0절-2 · 2.1 | `main.tsx:30` 앱 시작 때 1회 | `main.tsx:29-30` 공유 로더 — 첫 `loadStudio()` 때 지연 1회. 진입 읽기 `readEntry`(`deferredStudio.ts:39` → `entryRead.ts:29`)가 IDB를 따로 연다 | 부분(결론 유지) |
| F2 | 2.1 첫 행 | "IDB를 여는 함수는 `openIdbPersistence` 하나" | `factory.open` 6곳(`idbPersistence.ts:62` · `entryRead.ts:29` · `storageCheck.ts:54` · `readProject.ts:94` · `deleteProject.ts:89` · `writeImport.ts:48`) + `deleteDatabase` 1(`clearBrowserData.ts:52`). `openIdbPersistence` 호출 = `localSync.ts:92` 1곳은 맞음 | **오류**(문장 · 어댑터 1개 결론 유지) |
| F3★ | 6.3 | `useDocSave.ts:69` 훅 층 유일 저장 호출 | `.saveDoc(` 전수: :69 외 어댑터·테스트 헬퍼·구현뿐 | 일치 |
| F4 | 6.4 · REPORT 4절 | revision 올리는 쓰기 5곳 | 실제 올리는 곳 = `memoryDocBook.ts` `save`:368 · `restoreSnapshot`:316 · `resolveConflict("mine")`:335 · `start("restart")`:396 (+ DocBook 밖 `writeImport.ts:110`). 표의 `SnapshotDialog` flushed·내보내기는 "저장 먼저" 대기(revision 변화 0) · `restartFlow.ts:135`는 `confirmDoc`(★ — startDoc은 :166) · **`deleteSnapshot`(`SnapshotDialog.tsx:260`) 레코드 재쓰기 누락** | 부분 → R7 |
| F5 | 2.1 · 6.2 | 같은 탭 직접 IDB 쓰기 3곳 | `deleteProject.ts:93,109-112` · `writeImport.ts:85,108-113` · `clearBrowserData.ts:52` — 3곳 일치(인용 행은 open 행). delete·import `hold.stop()`은 `if (writer)`일 때만 | 일치(행 1~2 어긋남) |
| F6 | 6.3 | `pagehide`·`visibilitychange` 0 | 0건(테스트 포함) · `beforeunload` 2곳(`useAutosaveScheduler.ts:290` · `pendingWrites.ts:69`) · `popstate` 0 | 일치 |
| F7★ | 6.3 | `StudioLayout.tsx:130-148` `flushBeforeLeave` | :130 `const { leave } = save` · :133-148 본문 · 연결 :430·:464·:509 | 일치 |
| F8★ | 6.5 | `:135-142` 미완 저장 시 링크 고착 | :137·:141 | 일치 |
| F9 | 1.3 · MQ-6-1 | `LocalSync` `localSync.ts:43-56` +5 | 실제 :45-60 · 지금 `docs` + 메서드 6 → +5면 11 | 부분(행) |
| F10 | 1.3 · MQ-6-1 | `ProjectRepository` 접근자 +1 전제 | `projectRepository.ts:143-174` `persistence` + 메서드 14 · 코어 접근자 0 | 일치 |
| F11 | 1.3 | `recordRefs(record)` (:201) | 사용 `localSync.ts:205` · 정의 `imageRecord.ts:23` | 오류(행) |
| F12 | 12절 | `imageRecordId` (`localSync.ts:202`) | 사용 :206 · 정의 `imageRecord.ts:20` | 오류(행 · 사실 유지) |
| F13 | 6.5 | "다시 저장" `retry` no-op `SaveStatus.tsx`:102 | `SaveStatus.tsx`는 67줄 — no-op은 `useAutosaveScheduler.ts:101-102` | 부분(파일 귀속) |
| F14 | 6.4 | `useExportFlow.ts:39-44` 저장 먼저 | 분기는 :57-62 `proceed` | 부분(행) |
| F15 | 2.3 | `StudioLayout.tsx:86-92` 하위 재마운트 | :86-92는 `useState` · 재마운트는 모드별 렌더 분기 | 부분(행) |
| F16 | MQ-6-4 ★A | "CP4 파일 8개 중 4개(I6 7절)" | I6 7절에 해당 수치 없음(REPORT 5절 "겹침 4개"만) | 확인불가(출처 오류) |
| F17 | 6.5 | 저장 경로 `AbortController`·`Promise.race` 0 | 0 · 단 `memoryCompareBoardRepository.ts:122` 보드 첫 저장 안내 2초 타임아웃 선례 | 일치 |
| — | 그 밖 21건 | `localSync.ts` :47·:74-81·:99-103·:117-120·:122·:137·:140-153·:154·:155-157·:197-207 · `idbPersistence.ts:56,59,64-66` · `writeQueue.ts:37,69` · 스케줄러 :25·:57-58·:181-190·:283-292 · `useDocSave` :61·:74·:100·:129-140 · `saveCore.ts` 인용 전부 · `check-bundle-size.mjs:51,136-152` · 11절 테스트 파일 17개 존재 | 일치(일부 1~3행 어긋남) |

- **설계 결론을 바꾸는 불일치 = F4의 `deleteSnapshot` 누락 → R7(P1로 상향).** 그 밖은 행 번호·문장 정정.
- 추가 사실: D6-9는 SPEC-4 **RS4-AC-06**("`StudioLeave`(B-RS-01) 테스트 전부 변경 없이 통과 · dirty 편집 뒤 앱 안 링크 이탈 = 저장 대기 그대로", `SPEC-4.md:349`)과 정면으로 충돌하는데 I6 13절에 D행이 없다(★ 메인 확인).

## 2. 남은 저장 결함 12건 커버리지

출처: `git show origin/main:dev/active/backlog-rs-status/REPORT.md`(origin/main `6d321936`). 판정 기준 = ★A 채택 가정. 서브에이전트 ② 표를 메인이 원인 코드 3곳 재확인(`imageOps.ts:19,25` · `memoryProjectRepository.ts:65-66,149` · `localSync.ts:155-157`)한 뒤 통합.

| # | 결함 | 판정 | I6/PLAN 근거 | 원인 코드 [L1] | 메커니즘 충분성 |
|---|---|---|---|---|---|
| 1 | RS4-R1 history 재진입 거짓 idle | **해결**(MQ-6-4 A·L0 조건부) | I6 7절 · PLAN L3 · AC-U6·U7·B1 | 편집기 쪽 `pendingOf` 0건 | lease+seed로 닫힘. 단 원 시나리오("미확인 기억 있는 프로젝트를 history 재진입 → unconfirmed") 직접 AC 없음(B1은 편집 뒤 POP만) |
| 2 | **RS4-R8** POP·주소 입력 편집 소실·경고 없음 | **해결 주장 → 부분** | I6 5절 G2 · 7절 · 12절 · D6-9 · AC-B1 | `useAutosaveScheduler.ts:134-137`(dispose) · `:283-292`(경고 = 편집기 수명) · `pendingWrites.ts:61-71` · `StudioLayout.tsx:133-148`(링크만 가로챔) | 메모리 소실은 `edit()` 동기 등록으로 닫힘. **IDB 쓰기 주체 0 · 경고 0은 남음**(= R1과 같은 구멍). CP4 `hold(PendingDraft)`가 하던 언마운트 뒤 경고를 버리고 대체 없음. 8.1에 "코어 dirty + 편집기 밖" `/projects` 행 표시 미정의 |
| 3 | RS4-R2 편집기 저장 성공해도 기억 남음 | **누락** | ID 언급 0 · `PendingRecord` 대체 = "구현 레인 판단"(I6 6.3) | 편집기 저장 경로에 기억 해제 없음 | CP4 흡수 시 승계 문장 없음 |
| 4 | **RS4-B1** 편집기 밖 `startDoc` 재생 = 이미지 없는 커밋 | **누락** | RS4-B1/R10 언급 0 · 간접: I6 1.2 I6 행(엄격 imageOps) · 6.4 `restartFlow` 행("열린 코어 없으면 다음 열기가 새 시드" = 기존 경로 유지) | `memoryProjectRepository.ts:121` startDoc → `:65-66` `kept`(`maps.get ?? held`, 편집기 cleanup `:149`가 맵 삭제) → `imageOps.ts:19` 조기 반환·`:25` 메타 없는 참조 put 건너뜀 | 재생은 코어 밖 DocBook→flush 경로 그대로. "엄격 imageOps"가 공유 `imageOps.ts`(flush 포함)를 바꾸는지 포트 전용인지 미정 — 공유면 재생 flush가 throw → `PendingStart` 고착 가능 [L3] |
| 5 | RS5 코어 미통합(G1·G2·G7·G8) | **해결**(MQ-6-1·L0 조건부) | I6 전체 · PLAN L0~L5 | `app/src`에 saveCore 0 | 설계 본체. 단 G1 "필드별 작성자"의 물리 보장 공백 → R7 |
| 6 | CE-3a / BD-1 | **해결** | I6 2절 · AC-G2 | `localSync.ts:92` · `idbPersistence.ts:59` | 충분(R3 가드 범위 보강만). D6-3 MC 변경 수반 |
| 7 | LV-1·LV-2 | **해결**(MQ-6-3 A 조건부) | I6 3절 · AC-U4·U5·U11 | race·Abort 0 · `StudioLayout.tsx:135-142` 고착 | LV-2 포기 토큰으로 닫힘. LV-1은 표시 전환만(무기한 대기는 의도적으로 남음). 시간 값 미정(6-3b) |
| 8 | 묶음(가장 약한 하위 판정) | **누락** | — | — | — |
| 8a | OBS-1 stale 뒤 회복 = 재열기뿐 | 범위 밖(명시) | I6 2.3 · 4절 "유지" | — | — |
| 8b | **CE-4** 동시 confirm = write 2회 | **해결 주장 → 부분** | I6 3절 공통 행 · 4절 · AC-U8 | `saveCore.ts:182-196`(dirty면 매번 save) · `:132-137`(쓸 것 없음 가드 없음) | 화면 dedupe는 같은 버튼 연타만 막음. 남는 경로: autosave 진행 중 dirty confirm · D6-9로 편집기 버튼과 `/projects` 행이 다른 훅 · 스냅샷·내보내기 전 `core.save()`. 손실 0·중복 쓰기 수준(낮음) |
| 8c | **OBS-2/BD-2** 이미지 확인 프로젝트 미구분 | 범위 밖(명시 "비도달") — AC 없음 | I6 12절 마지막 행 | 하네스 bare id(`saveCore.ts:87,161,178`) · 제품 `${projectId}/${localId}`(`imageRecord.ts:20`) | 지금 제품 기준 비도달 판정은 맞음. 그러나 포트 시그니처 `image(id)`·`verify(receipt)`(I6 1.3)에 projectId가 없고 코어 imageIds = `recordRefs` = localId — **포트가 prefix를 안 붙이면 원인 부활** → 가드 AC 필요 |
| 8d | 이미지 바이트 비교 0 | 범위 밖(명시) | I6 12절 | — | — |
| 9 | RS4-R3·R4·R5 탭 닫기·새로고침 = 경고만 | 범위 밖(명시) | I6 12절 | 브라우저 한계 | I6 12절 "beforeunload 경고"는 편집기 마운트 중일 때만 사실 — 편집기 밖 코어 dirty면 경고 0(#2·R1과 같은 구멍) |
| 10 | STALE/CLEARED·오프라인·섹션 연산 이동 보류 | **누락** | stale만 D6-9 "지금처럼 보류" · cleared 모호 · offline·섹션 연산 언급 0 | `save-on-leave/REPORT.md:92-95` | D6-9 적용 시 offline은 "이동 + 저장 트리거 없음"으로 조용히 바뀜[L3] (R1 표 211행) |
| 11 | RS-AC-08d IDB 쪽 미단언 | **누락** | 언급 0 | — | RS6 범위와 거리 있음 — 명시 제외 1줄이면 충분 |
| 12 | B-RS-01 개정 15 실측 +0.02·+0.03 초과 결정 대기 | **누락** | 언급 0(MQ-6-6은 RS6 예산만) | — | 같은 예산선을 쓰므로 L0 판정선과의 관계 1줄 필요 |

- 집계(주 행 12): **해결 4**(#1·5·6·7) · **MQ 0** · **범위 밖 1**(#9) · **누락 7**(#2·3·4·8·10·11·12 — #2·#8b는 해결 주장이 부분으로 강등).
- 브리프 중점 4건: RS4-R8 = 부분(R1과 같은 원인) · RS4-B1 = 누락 · CE-4 = 부분(낮음) · OBS-2/BD-2 = 범위 밖(비도달)이나 포트 시그니처상 재발 경로 있음.

## 3. 설계 위험 판정

### R1 (P1) 링크 이탈 저장 대기 제거 — B-RS-01 약화

**사실 [L1]**
- 지금 `leave()`(`useDocSave.ts:142-146`)는 dirty면 **즉시 저장을 내고**(`retry()`), 끝날 때까지 이동을 막는다(`StudioLayout.tsx:139-146`). 테스트 14건이 이 계약을 고정한다(`StudioLeave.test.tsx`).
- save를 내는 주체는 편집기 안 스케줄러다. 언마운트 `dispose`는 타이머만 지운다(`useAutosaveScheduler.ts:134-137`).
- 떠나기 경고는 편집기 훅 수명이다(`useAutosaveScheduler.ts:283-292`, `needsUnloadGuard` :67-70). 탭 수준 경고(`pendingWrites.ts:61-71` `onUnload`·`sync()`)는 `active`(PendingStart·PendingRecord) + `inflight`만 본다.
- 코어 `release`는 save를 내지 않는다(`saveCore.ts:261-263`).

**설계 [I6 3절 공통 행 · 7절 · D6-9]**: "`edit()` 등록만 끝났으면 저장 완료를 기다리지 않고 이동. 떠날 때 할 일 = `release`뿐."

**결과 [L1-추적]**: 디바운스 대기 중(dirty · inflight 0)에 링크로 떠나면 스케줄러가 dispose되고 **아무도 `core.save()`를 내지 않는다.** 편집은 코어(탭 메모리)에만 남고, `/projects`로 간 뒤 탭을 닫으면 **경고도 없다**(편집기 훅 경고 해제 · 탭 수준 경고는 코어 dirty를 모름). I6가 기대하는 `/projects` 행 "저장 중…"은 inflight가 있을 때만 맞고, 디바운스 대기 케이스는 "저장 전 변경"이 IDB에 영영 안 갈 수 있다. RS6-AC-U11은 inflight 정지 케이스만 덮는다.

**StudioLeave 14건 대응 (새 설계에서)**

| 테스트(행) | 지금 | I6 적용 시 | 판정 |
|---|---|---|---|
| 99 저장 중 추가 편집 → 이동 = 마지막 편집 저장 뒤 1회 | 저장 뒤 이동 | 바로 이동 — 마지막 편집 저장은 누가 내나 미정 | 의미 변경 + **R1 공백** |
| 114 저장 전 변경 → 저장 끝날 때까지 대기 | 대기 | 바로 이동 · save 주체 미정 | 의미 변경 + **R1 공백** |
| 127 저장 실패 → 보류 · 다음 클릭 재저장 | 보류 | 클릭 시점 상태가 `failed`면 보류(일치). 클릭 시점 dirty였다가 이탈 뒤 실패하면 이미 이동 | 일부 의미 변경 |
| 144 대기 중 연타 = 저장 1·이동 1 | — | 대기 자체가 없음 | 폐기(사유 필요) |
| 158·173 읽기 전용 거절 → 이동 | **이동** | D6-9 "readonly면 보류" | **사실 오류 → 회귀**(지금 동작 뒤집힘) |
| 184 거절 뒤 쓰기 가능 → 저장 뒤 이동 | 저장 뒤 이동 | 바로 이동 | 의미 변경 |
| 199 Web Locks 없는 로컬 → 거절 뒤 이동 | 이동 | 포트 `mode()=unsupported` — 예외 목록(`failed`·`readonly`·`stale`)에 `unsupported` 없음 | 미정(명세 공백) |
| 211 거절 뒤 오프라인 → 보류 | 보류 | 예외 목록에 `offline` 없음 · 8.1 상태표에도 offline 축 없음 | **미정 → 회귀 위험** |
| 225 메모리 저장 실패 → 보류 | 보류 | 실패가 이탈이 낸 save 결과면 이미 이동 | 의미 변경 |
| 235 일반 저장 실패 → 보류 | 보류 | 같음 | 의미 변경 |
| 244·252·266 수정 키·`a[download]`·변경 없음 | 통과 | 통과 | 유지 |

**보완 요청(최소)**
1. 이탈 시 코어 dirty면 **save 1회 발사**(대기 없이) — 발사 주체를 명시(링크 핸들러 또는 레지스트리).
2. 코어 dirty·inflight 동안 **탭 수준 `beforeunload`** 소유자를 명시(편집기 밖 — `pendingWrites` 확장 또는 레지스트리).
3. 예외 목록을 지금 동작 기준으로 다시 쓴다: readonly·`unsupported`(Web Locks 없음)는 **지금 이동**, `offline`·`failed`는 보류 — 바꾸려면 MQ.
4. AC 추가: "디바운스 대기 중 이탈 → 이동 · IDB = 마지막 편집(save 1회) · `/projects`에서 탭 닫기 경고 on".
5. I6 11절에 `components/studio/StudioLeave.test.tsx`(14건) 추가 — 지금은 `StudioLayout.test.tsx의 링크 이탈 보류 단언`으로 잘못 가리킨다.

### R2 (P1) 코어 생성 시점 · 레지스트리 위치 · memory 모드

**사실 [L1]**
- `openSaveCore`는 async — 열 때 `readStored`를 기다린다(`saveCore.ts:106-108`).
- 직접 `/studio` 진입에서 `getDoc`은 진입 레코드(`entry.doc`)를 돌려주고 **DocBook·`LocalSync`를 받지 않는다**(`memoryProjectRepository.ts:91-95,114-117` — `!first`일 때만 `bookOf()`). `LocalSync`는 `bookOf`/`local.sync()`로 조작 뒤에 열린다(`memoryProjectRepository.ts:59-61` · `memoryDocBook.ts:144-145`).
- memory 모드(`local` 없음)는 `LocalSync`가 아예 없다(`deferredStudio.ts` `createDeferredStudio(..., local?)` · `memoryProjectRepository.ts:107`).

**설계**: 레지스트리는 `LocalSync` 객체에 매단다(I6 2.2-2), `initial` = `LocalSync.docs`(1.1), 코어 상태 부분은 진입 closure · io는 `localSync` 청크(9.2), `edit`·`view`·`release`는 동기(9.2·5절 G7).

**모순 [L1-추적]**: 편집기 마운트 때 코어가 있으려면 (a) `LocalSync`를 진입에서 미리 받아야 하거나(예산 — `localSync`·`memoryDocBook`이 진입 closure로 올라옴, ADR-007 사실 9 "자동으로 받으면 예산에 든다") (b) 레지스트리를 `LocalSync` 밖에 두거나(I6 2.2-2가 금지한 모듈 전역 Map과 구별 필요) (c) 코어가 열리기 전 편집을 받는 버퍼가 필요하다. memory 모드(RS6-AC-U9 대상)에서 레지스트리 위치는 어디에도 없다. L0 S6a("호출 배선 없음")는 이 문제를 드러내지 못하고 S6b에서 처음 부딪힌다.

**보완 요청**: I6 2.2·9.2에 ① 코어 생성 시점(동기 생성 + 포트 늦게 붙이기 등) ② 레지스트리 소유 객체(local·memory 공통) ③ 열기 전/포트 없는 동안 `save()` 결과 — 3줄을 정하고, L0 S6b가 그 배치로 잰다고 명시.

### R3 (P2) BD-1 "구조 관례 + import 가드" 충분성

- 제품 경로 판정(탭당 어댑터 1개)은 사실과 맞다 [L1 — 1절 M5·①]. 가드 범위가 좁다: RS6-AC-G2는 `openIdbPersistence` import·`openLocalSync` 호출만 센다. **`StudioPersistence` 밖 IDB 쓰기는 이미 3곳**(I6 6.2 — `deleteProject`·`writeImport`·`clearBrowserData`)이고, 새 `indexedDB.open`/`deleteDatabase` 직접 호출은 가드에 걸리지 않는다. → 가드에 "raw `indexedDB.` 호출 지점 = 지금 목록 고정" 1줄 추가 권고(P3에 가까운 P2).
- 테스트: 코어·포트는 `createMemoryPersistence`마다 새 `LocalSync` → 레지스트리가 인스턴스에 매달리면 테스트 간 공유 0(I6 2.2-2 의도와 일치). 단 R2가 레지스트리 위치를 바꾸면 이 성질도 다시 확인해야 한다.
- HMR: `import.meta.hot` 0건 [L1 grep]. dev에서 모듈 교체 시 두 번째 `LocalSync`가 열릴 수 있으나 Web Locks 비재진입으로 두 번째 gate가 `readonly`(I6 6.1 잠금 행) → 쓰기 경쟁 0 [L1-추적]. dev 전용이라 preview QA 무관 — P3.
- StrictMode: 로더가 모듈 전역 공유 Promise(`sharedLoader.ts:5-13`)라 이중 마운트가 어댑터를 늘리지 않는다. 코어 lease는 같은 mountId 멱등(`saveCore.ts:255-259`) — 위험 없음.

### R4 (P2) `LocalSync` 포트 +5 · `ProjectRepository` 접근자 +1 vs 계약·ADR-007

- `LocalSync`(`localSync.ts:45-60`, 지금 메서드 6 + `docs`)는 data 내부 인터페이스라 +5는 계약 충돌 없음. 다만 I6 8.3이 "quota·abort를 포트가 코드로 분류"·2.2-2가 "레지스트리를 `LocalSync`에 매단다"고 해 실제 표면은 +5보다 클 수 있다 → MQ-6-1 문구에 "+5 이상(레지스트리·분류 포함)" 정정 권고.
- `ProjectRepository`(`projectRepository.ts:143-`)는 REST 모양 비동기 인터페이스이고, ADR-007 4절 이유 2는 "저장소 인터페이스를 바꾸지 않는다 — 서버 구현을 같은 인터페이스에 꽂는다"를 근거로 삼는다 [L1 `ADR-007-local-persistence.md:124`]. 탭 메모리 동기 상태기 접근자 `saveCore(projectId)`는 서버 구현이 가질 수 없는 모양이다. MQ-6-1은 "공개 +1"만 적고 ADR-007과의 관계를 적지 않는다 → **ADR-007 개정 필요 여부를 MQ-6-1에 1줄 명시** 권고(금지 조항이 아니라 근거 문장이라 P2).
- D6-3(커밋마다 세대 재읽기 → 잠금 획득 때 `fresh()` 1회)은 ADR-007 개정 2(먼저 편집한 탭 잠금 + 잡은 직후 세대 확인)와 맞다 — 충돌 없음 [L1 `ADR-007:173,176`].

### R5 (P2) 예산 — L0 선행 강제 · CP4 상쇄 조건

- **L0 선행은 계획에 강제돼 있다**: PLAN 4행 "L1 이후 = L0 PASS + MQ-6-1·6-3 결정", 레인 표 L1 선행 = "L0 PASS", 8절 중단 규칙 [L1]. 문서 규칙으로서는 충분.
- **S6b·S6c 실행 가능성**: S6b(편집기 배선 = CP4 흡수판)·S6c(대체 코드 제거)는 사실상 L1+L3 프로토타입이다. L0는 60턴·앱 커밋 0·테스트 없음이라, R2(코어 생성 시점)가 정해지지 않은 채로는 S6b의 배치 자체를 측정 레인이 설계해야 한다 [L3].
- **상쇄 인정 조건**: "같은 스파이크에서 대체 코드를 제거해 잴 때만"(I6 7절·9.3)은 측정 가능하지만, 제거 목록이 "중 코어가 대신하는 것"으로 열려 있다. 빠진 조건 1줄: **"S6c 제거 목록을 L0 REPORT에 파일:행으로 고정하고, L3가 같은 목록을 실제로 머지할 때만 상쇄 유효 — 다르면 재측정"**.

### R6 (P2) 계획 쓰기 경로 누락

PLAN 레인 표 쓰기 경로에 없는 파일 [L1 grep — PLAN에 이름 0]: `data/projectRepository.ts`(공개 접근자 +1) · `data/memoryProjectRepository.ts`(접근자 구현·레지스트리 위치) · `data/memoryDocBook.ts`(G1 "saved 뒤 DocBook 문서 맞춤"·`openLocalSync` 경로) · `features/studio/useStudioDoc.ts`(6.3 재진입 seed = `core.view()`). PLAN 8절 "쓰기 경로가 표 밖이면 멈춤"에 L1·L3가 바로 걸린다. L4∥L5 겹침은 없다(`saveStatusText` 사용처 = `SaveStatus`·`ConflictCallout`·`StudioLayout` — L5 경로와 무관 [L1 grep]).

### R7 (P1) G1 "필드별 작성자"의 물리 보장 공백 — DocBook 경로 레코드 재쓰기 [L1-추적]

- 사실 [L1]: 기존 `write`는 레코드를 `book.docOf(projectId)`로 만든다(`localSync.ts:155-157`). `docs/{id}`는 레코드 통째 put이고 큐는 제출 순서대로 쓴다(`writeQueue.ts`).
- 설계: 문서 필드 작성자 = 코어, 스냅샷 필드 = DocBook, DocBook 문서는 코어 `saved` 뒤에 맞춤(I6 5절 G1).
- 경로 [L1 — 서브에이전트 ①② 독립 지적 + 메인 확인]: `createSnapshot`·`deleteSnapshot`·`requestExport`·`confirmDoc` → `memoryProjectRepository.ts:86-89,134` `write`/`kept`(:66) → `LocalSync.flush` → `write`. `deleteSnapshot`(`SnapshotDialog.tsx:260`)은 저장 먼저 대기도 없고 I6 6.4 표에도 없다.
- 위험: 코어 commit(doc N+1)이 진행 중이거나 막 끝나 DocBook이 아직 N일 때 DocBook 경로 쓰기가 제출되면 그 레코드의 doc은 아직 N이다 → 뒤 쓰기가 IDB 문서를 N으로 되돌리고, 같은 트랜잭션의 imageOps GC delete가 N+1의 새 이미지를 지울 수 있다. 코어는 saved로 알고 있어 다음 `verify` 전까지 모른다. 이를 다루는 AC가 없다.
- 판정 근거: 결과가 **조용한 저장본 후퇴(이미 '저장됨'인 편집이 IDB에서 사라짐)** 라 P1. 다만 고치는 방법은 LocalSync 내부 규칙 1줄이라 MQ-6-1 ★A 틀 안이다.
- 보완: G1에 "DocBook 경로 `write`도 문서 필드는 코어 최신 커밋 doc으로 만든다(또는 코어 inflight 중 DocBook 쓰기 차단)" 1줄 + RED AC 1건.

## 4. MQ 검토

| MQ | 트레이드오프 | 사실/추정 구분 | 숨은 의존·문제 |
|---|---|---|---|
| 6-1 | 있음 | 있음(사실 = I6 6.1 표) | ★A에 **MC 계약 변경(D6-3)이 포함**돼 있다(문구로 밝힘 — 양호). ADR-007 4절 이유 2 관계 미기재(R4). "+5" 과소 가능(R4) |
| 6-2 | 있음 | 없음(짧음) | 6-1 A일 때만 의미 — 의존 미기재. B는 6-3 A(코어 계약 변경)와 묶으면 하네스 재검증 1회로 합칠 수 있다는 정보 없음 |
| 6-3 | 있음 | 있음 | 6-3b "값은 QA 실측 뒤"는 QA 레인이 L4 뒤라 **L2 테스트는 값 없이 머지** → 머지된 기본값 출처를 정해야 함(P3). LV-1 공통 행의 **링크 이탈 규칙 변경(D6-9)이 어떤 MQ에도 없다**(P2 — B-RS-01 사용자 보장 변경을 결정 없이 넣음) |
| 6-4 | 있음 | 있음 | ★A는 6-1 A 전제 · L0 결과 의존. C는 6-6 C와 자동 연동(6-6 C 문구에 명시돼 있음 — 양호). B의 "+0.80 초과" 사실 일치 |
| 6-5 | 있음 | 있음 | ★A는 UX-5 MQ-5-1·MQ-5-5 ★A 채택을 전제("선택 전 편집 잠금") — 그 결정 상태를 이 문서가 밝히지 않음(미확인) |
| 6-6 | 있음 | 있음 | 지금 결정 불가임을 명시 — 양호 |

- **누락 MQ 1건(P2)**: D6-9 링크 이탈 규칙(R1 보완 3과 함께) — "저장 대기 제거 여부·예외 목록"을 MQ-6-3 또는 새 MQ로 올려야 한다.
- **설계를 구현 레인에 넘긴 곳(P3)**: `PendingRecord` 대체 여부(I6 6.3 "구현 레인 판단") — L5 범위·`/projects` 문구에 영향.

## 5. 계획 검토

| 항목 | 결과 |
|---|---|
| 레인별 쓰기 경로 겹침 | L1→L2→L3 직렬 명시 · L4∥L5 겹침 0 [L1]. **누락 경로 4개**(R6) |
| 턴 예산 | 60·90·60·90·70·70·60 — 브리프 범위(50~90) 안 |
| RED/GREEN 체크포인트 | 레인마다 3~4개(≤4 충족) |
| QA 게이트 환경 | `npm run build` + `vite preview`(dev 금지) · ego-browser만 · 멀티탭 실제 `navigator.locks` 취득 확인 · 앱 안 클릭 이동 — 명시됨. 단 "탭 2개 = 같은 프로필 페이지 2개"는 RS6-AC-B3(편집기 writer/readonly)와 화면이 다르다 → "같은 `/studio/{id}` 2개"로 정정 권고(P3) |
| L0 강제 | 강제됨(R5) · S6b/c 실행 가능성·상쇄 조건 보완(R5) |
| Codex | 각 구현 레인 끝 `/codex:review` 최대 3라운드 — 명시 |

## 6. Jarvis에게 권고 (보완 요청 — 최소·구체)

1. **[P1·R1]** I6 3절·D6-9: 이탈 시 dirty면 save 1회 발사 주체 + 탭 수준 `beforeunload` 소유자 명시 · 예외 목록을 지금 동작 기준(readonly·unsupported = 이동, offline·failed = 보류)으로 고침 · AC "디바운스 대기 중 이탈" 추가.
2. **[P1·R7]** I6 5절 G1: "DocBook 경로 `write`(스냅샷 생성·삭제·내보내기·`confirmDoc`)도 문서 필드는 코어의 마지막 커밋 doc으로 만든다(또는 코어 inflight 중 DocBook 레코드 쓰기를 코어 chain 뒤로)" 1줄 + RED AC "코어 commit 중 `deleteSnapshot` → IDB doc = 코어 최신 · 새 이미지 삭제 0" + 6.4 표에 `deleteSnapshot` 추가.
3. **[P1·R2]** I6 2.2·9.2: 코어 생성 시점 · 레지스트리 소유 객체(local·memory 공통) · 포트 없는 동안 `save()` 결과 — 3줄 결정. L0 S6b가 그 배치로 잰다고 명시.
4. **[P2]** MQ-6: 링크 이탈 규칙(D6-9)을 MQ로 올림(SPEC-4 RS4-AC-06 대체 D행 포함) · MQ-6-1에 ADR-007 4절 이유 2 관계와 포트 실제 표면(+5 이상) 1줄.
5. **[P2·R5]** I6 9.3/PLAN 1절: "S6c 제거 목록 = L0 REPORT에 파일:행 고정, L3가 같은 목록 머지할 때만 상쇄 유효" 1줄.
6. **[P2·2절]** 12건 중 누락 항목에 판정 1줄씩(해결/MQ/범위 밖): 특히 **RS4-B1**(편집기 밖 재생 이미지 — "엄격 imageOps"가 flush 공유인지 포트 전용인지) · RS4-R2(기억 해제 승계) · OBS-2/BD-2 포트 시그니처에 projectId(또는 prefix) 고정 AC · R7 G1 동시 쓰기 AC.
7. **[P2·R6]** PLAN 레인 표: `projectRepository.ts`·`memoryProjectRepository.ts`·`memoryDocBook.ts`·`useStudioDoc.ts`를 L1/L3 쓰기 경로에 배정 · I6 11절에 `StudioLeave.test.tsx`(14건) 추가.

이 7건이 반영되면 MQ-6-1·6-3 결정과 L0 발주를 진행해도 된다. 그 밖 P3(가드 범위·HMR·QA 탭 화면·6-3b 기본값 출처·`PendingRecord` 위임·1.1 행 번호 정정 F1·F2·F9~F16)는 구현 레인 BRIEF에서 처리 가능.

## 7. 사실 / 추정 / 미확인

- **사실(L1)**: 1절 표 · R1 사실 4개 · R2 사실 3개 · ADR-007 :124·:173·:176 · PLAN 경로 grep 결과 · `StudioLeave.test.tsx` 14건 · `import.meta.hot` 0.
- **추적(L1-추적, 실행 0)**: R1 "디바운스 대기 중 이탈 → save 0·경고 0" · R2 모순 · R7 레코드 재쓰기 후퇴 · HMR 시 두 번째 gate `readonly`.
- **추정(L3)**: S6b/c를 L0 60턴 안에 하기 어렵다는 판단 · RS4-B1 엄격 imageOps 공유 시 `PendingStart` 고착 · CE-4 남는 경로 · offline 이탈 동작 변화.
- **서브에이전트**: ① 사실 대조(읽기 전용, 38건) · ② 12건 커버리지(읽기 전용) — 둘 다 완료, 핵심 행은 메인이 원문 재확인(★ 표시·2절 머리).
- **실행 근거**: `cd app && npx vitest --run src/components/studio/StudioLeave.test.tsx` → `Tests 14 passed (14)` (2026-10-17, tip `7189816e` 코드) — 지금 readonly·Web Locks 없음 = 거절 뒤 **이동** 계약이 GREEN으로 고정돼 있음(R1 · M1 오류 판정의 실행 근거).
- **미확인**: UX-5 MQ-5-1·5-5·5-3 결정 상태 · 코어 바이트(미측정) · 실화면 전부 · 그 밖 테스트 실행 0.
