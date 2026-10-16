# QA-REVIEW — RS6 설계 독립 검토 (INTEGRATE-6 r0 · MQ-6 · RS6_INTEGRATE_PLAN r0)

- 검토 QA(Orca Claude Code) · 발주 Jarvis 2026-10-17 · 대상 tip `7189816e`(base `c7a7a2a8`) + origin/main `6d321936`의 `dev/active/backlog-rs-status/REPORT.md`.
- 읽기 전용: 설계 문서·코드 수정 0 · 빌드·측정·브라우저 실행 0 · Codex 0 · push 0. 근거 표기 **[L1]** 코드·문서 행 직접 확인 · **[L1-추적]** 여러 행을 이어 읽은 경로 추론(실행 0) · **[L3]** 추정.
- 약칭: **I6** = `docs/design/restart/INTEGRATE-6.md` · **PLAN** = `docs/04-plan/RS6_INTEGRATE_PLAN.md` · **MC** = 코어 MINIMAL-CONTRACT.

## 0. 판정

**보완 후 가능** — 구현 판단(MQ-6-1·6-3 결정)과 L0 측정 레인 발주 전에 아래 P1 2건을 I6에 명세로 보강해야 한다. 둘 다 기존 MQ-6-1 ★A(코어 상태기 + `LocalSync` 포트) 틀 안에서 닫을 수 있어 재설계는 아니다.

| # | 심각도 | 요지 | 보완 형태 |
|---|---|---|---|
| R1 | **P1** | 링크 이탈 "저장 대기 제거"(LV-1 공통 행 · D6-9) 뒤 **save를 내는 주체·탭 수준 떠나기 경고 주체가 없다** → B-RS-01(이탈 저장 보장)이 "탭 메모리 보존"으로 약해진다. D6-9의 "readonly는 지금처럼 보류"는 **사실 오류**(지금 readonly는 이동한다) | I6 3절·D6-9 명세 + MQ 1개 + AC 추가 |
| R2 | **P1** | **코어가 존재하는 시점**이 정해지지 않았다. `edit()`·`view()`·`acquire()`는 편집기 마운트 때 동기인데 `openSaveCore`는 async(`readStored` await)이고, 레지스트리는 조작 뒤 청크인 `LocalSync`에 매달리며, memory 모드에는 `LocalSync`가 없다 | I6 2.2-2·9.2 명세(코어 생성 시점·레지스트리 위치·memory 모드) — L0 S6b 측정 전에 필요 |

P2 4건(계획 쓰기 경로 누락 · D6-9 숨은 결정 · L0 S6b/c 실행 가능성·상쇄 조건 · 11절 깨질 테스트에 `StudioLeave.test.tsx` 누락)은 같은 보완 회차에 함께 닫으면 된다. 세부 = 3·6절.

## 1. 사실 대조 (L1 표본)

(서브에이전트 ① 결과 통합 — 아래 표. 메인이 직접 확인한 행은 "메인" 표시.)

| # | I6 위치 | 주장 | 실제 [L1] | 판정 |
|---|---|---|---|---|
| M1 | I6 3절 LV-1 공통 행 · D6-9 | 지금 `readonly`면 링크 이동 보류("지금처럼") | `StudioLeave.test.tsx:158,173,199` — 읽기 전용 거절(·Web Locks 없는 로컬 폴백)이면 **다시 저장해 보고 거절이면 이동한다**. `useDocSave.ts:142-146` `leave()` = `flushed().then(ok => ok \|\| readOnly.current)` | **오류**(메인) |
| M2 | I6 6.3 `StudioLayout.tsx` 행 | 앱 안 링크 `flushBeforeLeave`(:130-148) | `StudioLayout.tsx:127-148` 주석+`flushBeforeLeave` 본문(:133-148). 연타 무시·실패 보류·수정 키·`a[download]` 통과 일치 | 일치(메인) |
| M3 | I6 6.3 `useDocSave.ts` 행 | 훅 층 유일 저장 호출 `repository.saveDoc`(:69) | `useDocSave.ts:69` `await repository.saveDoc(...)` | 일치(메인 — 전수는 ① 표) |
| M4 | BRIEF "기존 `StudioLeave.test.tsx` 14건" | 14건 | `StudioLeave.test.tsx:99~266` `it(` 14개 | 일치(메인) |
| M5 | I6 0절-2 · 2.1 | `main.tsx:30` 공유 로더 1회 | `main.tsx:29` `const loadStudio = createSharedLoader(...)` → `deferredStudio.loadDeferredStudio` · `sharedLoader.ts:5-13` 성공 Promise 재사용·실패 시 비움 | 일치(메인 — 행 번호는 ① 표) |
| M6 | I6 2.2-2 · 1.1 `openSaveCore` 행 | 코어 열기 = 레지스트리에서 받음 | `saveCore.ts:106-108` `export async function openSaveCore` → `await readStored(persistence, projectId)` — **열기가 async** | 일치(사실) — R2의 근거 |
| M7 | I6 7절 "떠날 때 할 일 = `release(token)`뿐" | release로 충분 | `saveCore.ts:261-263` `release`는 `live = undefined`만 — save 발사 0 · `useAutosaveScheduler.ts:134-137` `dispose` = 타이머 삭제만 | 일치(사실) — R1의 근거 |
| M8 | I6 6.3 리스너 | `pagehide`·`visibilitychange` 0 | ① 표 참조 | ① |

(① 표 본문은 1.1에 붙인다.)

### 1.1 서브에이전트 ① 사실 대조 표

(대기 중 — 도착 시 통합)

## 2. 남은 저장 결함 12건 커버리지

(서브에이전트 ② 결과 통합 — 대기 중)

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
2. **[P1·R2]** I6 2.2·9.2: 코어 생성 시점 · 레지스트리 소유 객체(local·memory 공통) · 포트 없는 동안 `save()` 결과 — 3줄 결정. L0 S6b가 그 배치로 잰다고 명시.
3. **[P2]** MQ-6: 링크 이탈 규칙(D6-9)을 MQ로 올림 · MQ-6-1에 ADR-007 4절 이유 2 관계와 포트 실제 표면(+5 이상) 1줄.
4. **[P2·R5]** I6 9.3/PLAN 1절: "S6c 제거 목록 = L0 REPORT에 파일:행 고정, L3가 같은 목록 머지할 때만 상쇄 유효" 1줄.
5. **[P2·R6]** PLAN 레인 표: `projectRepository.ts`·`memoryProjectRepository.ts`·`memoryDocBook.ts`·`useStudioDoc.ts`를 L1/L3 쓰기 경로에 배정 · I6 11절에 `StudioLeave.test.tsx`(14건) 추가.

이 5건이 반영되면 MQ-6-1·6-3 결정과 L0 발주를 진행해도 된다. 그 밖 P3(가드 범위·HMR·QA 탭 화면·6-3b 기본값 출처·`PendingRecord` 위임)는 구현 레인 BRIEF에서 처리 가능.

## 7. 사실 / 추정 / 미확인

- **사실(L1)**: 1절 표 · R1 사실 4개 · R2 사실 3개 · ADR-007 :124·:173·:176 · PLAN 경로 grep 결과 · `StudioLeave.test.tsx` 14건 · `import.meta.hot` 0.
- **추적(L1-추적, 실행 0)**: R1 "디바운스 대기 중 이탈 → save 0·경고 0" · R2 모순 · HMR 시 두 번째 gate `readonly`.
- **추정(L3)**: S6b/c를 L0 60턴 안에 하기 어렵다는 판단.
- **미확인**: UX-5 MQ-5-1·5-5·5-3 결정 상태 · 코어 바이트(미측정) · 실화면 전부 · 테스트 실행(이번 검토에서 vitest 실행 0).
