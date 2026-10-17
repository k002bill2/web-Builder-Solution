# RS6-L1 REPORT — 저장 코어 포트·코어 이식

- 브랜치 `k002bill2/rs6-l1-port` · base `0c196b81` · 2026-10-17. 쓰기 = PLAN L1 행 경로 안(`features/studio/save/**` 신설 · `localSync.ts` · `memoryDocBook.ts` · `memoryProjectRepository.ts` · 예산 파일 2개 · 이 폴더). 화면·문구·레코드 형식·`StudioPersistence`·PageDoc 계약·스키마 변경 0 · 새 의존성 0 · 편집기 배선 0(L3).
- push·merge·원격 쓰기 0 · Codex 0 · 브라우저 0 · amend·rebase 0(BRIEF 규칙).

## 0. 결론

**CP1~CP4 완료 · 예산 상한 안.**
- `/studio` 정규화 **128.55**(base 128.09 대비 +0.46, 상한 129.13). 복원 **131.53**(+0.46, 상한 132.11). raw **129.88**(한도 130 안이라 `eagerBudgetKb` 변경 0) · 복원 raw 132.92.
- 최종 fresh 게이트 결과: typecheck 0 · lint 0 · build 0 · test 322 파일 / 2902건 통과. base(317/2856) 대비 +5 파일 / +46건이고, 깨진 기존 테스트는 0건이다.

| 커밋 | 내용 |
|---|---|
| `bc631f4d` | BRIEF · PROGRESS |
| `7131f189` | CP1 상태기 이식 + 포트 mode·head·commit·verify + 레지스트리 · 기준선 128.53/131.52 |
| `184c3cfe` | CP2 엄격 이미지 · checkSaveDoc · verify 이미지 · G1(chain 뒤 재쓰기) · 기준선 128.55/131.53 |
| `ca410dcf` | CP3 discard·replace·CX-3 · 두 탭 mode · U10 |
| `0356a224` | CP4 G2 가드 · 포트 늦게 붙이기 · memory 모드 |

## 1. AC 판정 (이 레인 몫)

| AC | 판정 | 근거 |
|---|---|---|
| RS6-AC-U1 | **PASS(대응표) · ① 부분 3** | `HARNESS-MAP.md` 37건 = ① 30 · ② 6 · ③ 1. ① 30건 중 27건은 같은 의미로 완전 이식했다. 나머지 3건은 부분 이식이다: #9 h3-14(두 탭 readonly→회수는 있으나 바인딩 동결 단언 없음) · #28 h6-92(discard 중 edit만, replace 수용 미단언) · #32 h6-150(폐기 Blob 제거만, IDB X 재저장 미단언) |
| RS6-AC-U2 | **PARTIAL(L1 몫만)** | L1에서 닫은 것: T10(시드 확인 쓰기 0) · T13(같은 내용 재확인 쓰기 0) · CX-1(확인 중 편집 = newer: h2-2·h2-3). T1·T2·T3·T5·T5b·T12·T16은 편집기 배선(L3) 몫이다 |
| RS6-AC-U3 | PASS | `saveCore.images.test.ts` "U3" — 실패면 DocBook revision 변화 0, 성공이면 DocBook 문서 = 커밋 문서(같은 revision·hash·updatedAt) |
| RS6-AC-U10 | PASS | `saveCore.modes.test.ts` "U10" — cleared 뒤 코어 쓰기 0 · 다음 save `failed{cleared}` |
| RS6-AC-U14 | PASS | deleteSnapshot·createSnapshot·confirmDoc 3건. 세 경우 모두 코어 commit 보류 중에 끼워 넣었다. 결과: IDB doc = 코어 최신(revision·hash) · 새 이미지 레코드 유지 · images delete op 0 · 스냅샷 반영 |
| RS6-AC-U15 | PASS | 단언: 다른 프로젝트 같은 localId 레코드로는 commit(`image-missing`)·verify(`stale`) 둘 다 통과 0. 가드: localSync에 `${projectId}/` 조립 0 |
| RS6-AC-G2 | PASS | `saveCoreGuard.test.ts` 6건으로 다음을 고정했다: `openIdbPersistence` 호출 = localSync 1곳 · `openLocalSync` 호출 = 로더 1쌍 · 코어 → persistence 값 import 0 · coreIo 값 import = memoryDocBook만 · `indexedDB` 전역 참조 파일 6개 목록 · `indexedDB.` 직접 호출 0. 변이 확인: saveCore에 coreIo 값 import를 넣으면 1건이 FAIL했다 |
| RS6-AC-G1(부분) | PASS(L1 수치) | 4절 표 |
| U4~U9 · U11~U13 · U16 · B1~B4 · G3 | 범위 밖 | L2~L5 · QA |

- 2.2-2 ①③도 확인했다(`saveCore.lazy.test.ts`).
  - 포트 로드 전: edit·view·acquire·release가 동기로 동작한다.
  - 청크 실패: `failed{unavailable}`이 되고, 다음 save가 다시 받는다.
  - 대기 중: dirty가 유지된다.
  - memory 모드: DocBook 커밋 뒤 `not-persistent`이고, 연속 저장에서 STALE이 0이다.

## 2. 하네스 37건 대응표

`HARNESS-MAP.md`에 있다. 작성 경로는 서브에이전트(analyzer, 읽기 전용) 1회이며, 메인이 제품 테스트 대응을 보탰다.

## 3. 제품 테스트 (신규 5파일 · 46건)

| 파일 | 건수 | CP | RED(예측 → 실측) |
|---|---|---|---|
| `save/saveCore.port.test.ts` | 11 | CP1 | 11 → 11 (`logs/cp1-red.log`) |
| `save/saveCore.images.test.ts` | 13 | CP2 | 7±1 → 7 + 환경 1(U15 가드 jsdom URL → CP4로 이동) (`logs/cp2-red.log`) |
| `save/saveCore.modes.test.ts` | 14 | CP3 | 9 → 9 (`logs/cp3-red.log`) |
| `save/saveCoreGuard.test.ts` | 6 | CP4 | 0 → 1(가드 정규식이 주석을 잡은 테스트 결함, 수정) · 변이 RED 1 (`logs/cp4-guard-mutation.log`) |
| `save/saveCore.lazy.test.ts` | 2 | CP4 | 1 → 1 (`logs/cp4-red.log`) |

- 테스트 장치: `save/testRig.ts`(테스트 전용 · 앱 코드 import 0).
  - 구성: 제품 `createMemoryPersistence` + `openLocalSync` + 앱 조립(`createDeferredStudio`).
  - 주입 수단: 다음 write의 hold·fail·drop(거짓 성공), docs·meta 읽기 hold·fail.
  - 다른 탭: 실제 fakeLocks registry 두 탭으로 만든다.
- RED 뒤 테스트를 고친 3건은 구현 변경이 아니다.
  - h2-3: 확인 await 전에 편집하던 타이밍을 `holdRead`로 바로잡았다.
  - U15: 바인딩이 남아 두 번째 save가 정당하게 saved가 되던 순서를 바로잡았다.
  - 가드: 주석 제거 뒤 판정하도록 바꿨다.
  - 세 건 모두 CP 전 코드에서 RED가 유지되는지 확인했다(U15·h2-3은 해당 구현 이전에 실패하는 단언).

## 4. 예산 표 (개정 17 — `npm run build` 정식 출력)

| 시점 | /studio 정규화 | 복원 정규화 | /studio raw | 복원 raw | 다른 라우트 첫/진입 | 기준선 조치 |
|---|---|---|---|---|---|---|
| base `0c196b81`(L0 실측) | 128.09 | 131.07 | 129.40 | 132.43 | catalog 100.05/102.39 · profile 99.56/120.10 · projects 99.15/108.38 | — |
| CP1 `7131f189` | 128.53 (+0.44) | 131.52 (+0.45) | 129.84 | 132.87 | 100.05/102.39 · 99.56/120.09 · 99.15/108.82 | normEagerKb 128.50→128.53 · 131.48→131.52 · eagerKb 129.84·132.87 · note "개정 17 배분 RS6-L1 CP1" |
| CP2 `184c3cfe` | 128.55 (+0.02) | 131.53 (+0.01) | 129.88 | 132.92 | 100.07/102.41 · 99.58/120.12 · 99.17/108.86 | 128.55 · 131.53 · eagerKb 129.88·132.92 · note CP2 |
| CP3 `ca410dcf` | 128.55 | 131.53 | 129.87 | 132.90 | — | 변경 0(진입 증분 0) |
| CP4 `0356a224`(최종) | **128.55** | **131.53** | **129.88** | **132.92** | 100.06/102.39 · 99.56/120.12 · 99.15/108.85 | 변경 0 |

- L1 누적: 정규화 +0.46 · 복원 +0.46 · raw +0.48. 개정 17 상한(129.13·132.11·raw 130.5) 안이다.
  - 남은 RS6 몫(L2~L5): 정규화 0.58 · 복원 0.58 · raw 0.62(130.5까지).
  - **주의(추정)**: L0-slim A안(편집기 배선 포함)은 128.61이었다. L1만으로 128.55이므로, L3 편집기 배선과 L2·L4 표시가 같은 몫을 나눠 써야 한다.
- 진입 증분의 출처: `saveCore.ts` 상태부와 `memoryProjectRepository` 레지스트리·`link`·`idle` 대기다. 둘 다 PROJECT_AUTO 진입 closure에 있다.
  - io(coreIo)·포트(corePort)·DocBook `coreLink`·`adopt`는 조작 뒤 청크에 있다(가드로 고정).
- 판정선 기록: `check-bundle-size.mjs` `eagerBudgetKb`는 130 그대로다. raw가 130을 넘지 않았다(129.88).
- `bundleBudget.test.mjs` 기대값 2줄(eagerKb·normEagerKb)을 CP1·CP2 커밋에서 실측으로 갱신했다(개정 17 결정 2 절차).

## 5. 깨진/바뀐 기존 테스트 대조

| 대상 | 결과 |
|---|---|
| INTEGRATE-6 11절 목록(useDocSave*·스케줄러·StudioLayout·SaveStatus·ConflictCallout·localSync·confirmDoc·imagePersist·saveStatusText·snapshotRevision·exportFlow·StudioLeave·pendingWrites·ProjectsPending·chunkRetryWiring·pendingImportGuard) | **전부 변경 0 · GREEN**. 편집기 배선(L3)을 넣지 않았으므로 예상대로다 |
| 11절 밖 | `engineImportGuard.test.ts`가 CP1 중간에 1회 FAIL했다 → 원인은 memoryDocBook의 engine `PageDoc` 타입 import였고, `ReturnType<CoreLink["book"]>`로 고쳐 GREEN이 됐다(기존 단언 변경 0). `scripts/bundleBudget.test.mjs` 기대값 갱신은 개정 17 절차에 따른 것이다 |
| 기존 단언 약화·skip | 0 |

## 6. s6c-slim A안 배치 · ④b vs INTEGRATE-6 9.2 문구 차이

- 가져온 것(L1 몫):
  - ① `link(run)` 위임 1개
  - ①′ 링크 조립을 DocBook 청크 `coreLink`로
  - ②′ `view()`에서 mark·inflight 제외. L2가 상태 표시용으로 다시 붙인다.
  - ④b `coreIo`를 DocBook 청크만 값 import한다. localSync는 `CorePort` 타입만 import한다.
- 넣지 않은 것:
  - ③ `latest` 제거와 StudioLayout·useDocSave·studioRepository 배선 — L3이다.
  - `LocalSync.base` 삭제와 DocBook save의 `base` 우회 — S6c "대체 코드 제거" 몫이다. 옛 편집기 저장 경로가 살아 있는 L1에서 지우면 동작이 바뀐다. **L3가 S6c 제거 목록과 함께 지워야 한다.**
- **④b 차이**: 9.2 표 문구는 "코어 io 부분 → 조작 뒤 — `localSync` 청크(포트 구현과 같은 청크)"다. 실제 배치는 다르다.
  - io(`save/coreIo.ts`)는 **DocBook(memoryDocBook) 청크**에서만 값 import한다.
  - 포트 구현(`corePort`)은 localSync 청크에 있다.
  - 결과적으로 io와 포트가 서로 다른 조작 뒤 청크에 있다. "조작 뒤" 조건은 충족한다(가드 `saveCoreGuard` 4번째).
  - 이유: L0-slim 2절 실측. localSync → coreIo 정적 간선은 공유 청크 헬퍼 +53B를 만든다.
  - 설계 문구 정정은 Jarvis 몫이다(ADR 개정 17 결정 4).
- s6c 참고 io에서 고친 결함(advisor 점검 반영):
  1. memory 모드 STALE·영구 dirty → DocBook 현재 revision 기준으로 커밋하고 savedMark를 전진시킨다.
  2. saved 뒤 DocBook 맞춤 → `docs.save`(새 객체·STALE 가능) 대신 `adopt`로 같은 객체를 넣는다. 그래서 싱크 멱등 재생이 같은 레코드를 다시 쓰지 않는다. 커밋 문서에 `updatedAt = now()`를 찍는다.
  3. 포트 commit에 `checkSaveDoc`을 넣었다. 모양 밖 문서를 쓰면 다음 열기가 unreadable이 된다.
  4. 엄격 이미지 = 바인딩(메타) 또는 IDB 키 재읽기다. 진행 중 put은 근거로 쓰지 않는다.
  5. 청크 로드 실패 = `failed{unavailable}`(reject 아님).
  6. G1 chain 대기: `kept`와 `confirmDoc`(kept를 거치지 않음) 둘 다 코어 `idle()` 뒤에 flush한다.

## 7. 하네스·설계와 다르게 한 것 (사유 1줄씩)

| 항목 | 하네스/설계 | L1 | 사유 |
|---|---|---|---|
| memory 모드 savedMark | 하네스 H2: 영속 없으면 상태 변화 0 | DocBook 커밋 성공 시 savedMark 전진(confirmed는 hydrated 그대로) | 제품 memory 모드의 "저장" = DocBook 커밋이다. 전진하지 않으면 늘 dirty가 되어 replace가 영구 거절된다 |
| CE-2 초안 사본 | 하네스: 중첩(imageIds)까지 사본 | 얕은 사본(`{...next}`) · 테스트도 최상위 필드 교체만 단언 | I6 G2 "엔진 문서는 불변이면 얕은 동결" · 편집마다 깊은 복사 비용을 피했다 |
| 커밋마다 세대 재읽기(I6b) | 하네스 commit이 `generation` 비교 | 없음(잠금 획득 때 `fresh()` 1회) | D6-3 · 다른 탭 stale은 두 탭 테스트로 확인(h4-4 제품판) |
| 레지스트리 시점 | PLAN: CP4 | CP1 | 테스트 장치가 실제 DocBook+LocalSync에 닿으려면 필요했다(PROGRESS 기록) |
| 포트 `image()` 메서드 | I6 1.3 별도 메서드 | commit(엄격 확인)·verify(재읽기) 안으로 접음 | 호출처가 그 둘뿐이라 표면을 줄였다. 키는 `imageRecordId(projectId, …)`만 쓴다 |
| 포트 실패 reason | I6 8.3 quota 코드 분류 | `schema`·`image-missing`·`cleared`·`infra` | quota·abort 구분은 toInfra가 이름을 메시지로만 남겨서 코드화하지 않았다(L4 문구 레인에서 필요하면 추가) |
| discard 진입 배타 | 하네스: 첫 await 전 동기 | `link()` 경유라 connect await 뒤 진입 | 그 사이 save가 오면 `inflight>0` → `rejected{inflight}`로 안전하다(손실 0) [L1-추적] |

## 8. 사실 / 추정 / 미확인

- **사실 [L1 · 실행]**: 위 4절 수치(`logs/cp*-build.log`) · 게이트 결과(`logs/cp4-{typecheck,lint,build,test}.log` — 마지막 코드 변경 뒤 fresh) · RED 로그 4개 · 가드 변이 RED.
- **추정 [L3]**: L3 배선 후 누적이 상한에 근접할 수 있다(4절 주의). discard connect 창의 안전성은 코드 읽기 근거만 있다(테스트 0).
- **미확인**: 실제 IndexedDB·실제 Web Locks 동작(브라우저 0 — QA 레인) · `/profile` 첫 화면 99.58(CP2)·99.56(최종) 한도 100 근접 · 다른 라우트 +0.02 흔들림의 청크 원인 미분석.
- **남는 일(다음 레인)**: L3에서 `LocalSync.base`·DocBook `base` 우회와 S6c 제거 목록 적용, 편집기 배선 · L2에서 `view()` mark·inflight 복귀와 감시 · 포트 reason quota 분류(L4 필요 시).
