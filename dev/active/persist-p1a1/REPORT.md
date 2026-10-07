# PERSIST-P1a-1 REPORT — 영속 어댑터 · IDB 구현 · 직렬 쓰기 큐 (배선 0)

- 브랜치 `k002bill2/persist-p1a1` · base `2700242` · 커밋: `d458fb6`(BRIEF P0) → `627d0aa`(1번) → `ac2adf9`(2번) → `f90377f`(REPORT 초안) → 마감 커밋(applyOps abort 수정 + REPORT 정정)
- 변경 = `app/src/data/persistence/**`(새 모듈 7 + 테스트 5) · `app/src/test/persistenceContract.ts` · `dev/active/persist-p1a1/**`. 앱 배선·엔진·계약·m2cBaseline·검사기·docs·lock·CLAUDE.md 수정 0, 새 의존성 0, 서브에이전트 0.

## 1. StudioPersistence 어댑터 (`627d0aa`)
| 모듈 | 역할 | 진입/조작 뒤 |
|---|---|---|
| `envelope.ts` | 봉투 `{schemaVersion, kind, id, data}` · `SCHEMA_VERSION=1` · `DB_NAME` · 저장소 7개(3절 (a)) · 수제 확인 `checkEnvelope` → ok / missing / mismatch(found, newer) / invalid | 진입 몫(의존성 0) |
| `entryRead.ts` | `openForEntry`(버전 없이 열기, 저장소 없으면 close → undefined, versionchange=close) · `readEntryRecord`(단건 get + 수제 확인) | 진입 몫 — P1a-2가 진입에 둠 |
| `infra.ts` | `toInfra` — quota·blocked·abort·그 밖 → `ProjectRepositoryError("INFRA")`, 사유는 메시지 | 공용 |
| `studioPersistence.ts` | 인터페이스(get·getAll·write(트랜잭션 단위)·close) + 메모리 가짜(put/get structured clone, 전부 아니면 전무, 커밋 지연·실패 주입) | 테스트용 |
| `idbPersistence.ts` | IDB 구현(브라우저 API 직접) · `DB_VERSION=2` · `upgradeDatabase` 버전별 단계(contains 가드) · write resolve = `oncomplete` · `applyOps` 중간 op 동기 예외 시 `tx.abort()`(부분 자동 커밋 방지, 전부 아니면 전무) · blocked/error/abort → INFRA · blocked 뒤 늦게 열린 연결은 close | 조작 뒤 |
- 버전 2인 이유: 진입 읽기는 버전 없이 열어 첫 실행이면 저장소 없는 빈 v1 DB가 생길 수 있음 → 쓰기 쪽이 v2 업그레이드로 저장소를 만든다(0→2·1→2 모두 테스트).
- 계약 테스트 1벌 `src/test/persistenceContract.ts` — 메모리 가짜만 등록(jsdom에 IndexedDB 없음, `typeof indexedDB === "undefined"` 실측). IDB 구현은 같은 계약을 P1a-2 브라우저 실측으로.

## 2. 직렬 쓰기 큐 · StoredJob (`ac2adf9`)
- `writeQueue.ts`: `submit(요청 키, ops)` → FIFO, `persistence.write`(IDB complete) 뒤에만 resolve. 실패 = INFRA reject + 미확인 기록 유지, 큐는 막지 않음(다음 요청 처리). `retry(키)` = 미확인 재제출(호출자는 새 쓰기 없이 — memoryDocBook 멱등 기록 대응), 미확인 없으면 쓰기 0 resolve. 같은 키 재제출 = 새 쓰기 + 남은 미확인 합침. **레코드별 최신 의도**: 뒤에 제출된 요청이 같은 (저장소, id)를 쓰면 앞 요청 미확인에서 그 레코드를 뺀다(진행 중 실패 포함) — 재시도가 옛 값으로 덮지 않음. `status`·`unconfirmed()`는 P1a-2 SaveStatus 입력.
- `jobRecord.ts`: StoredJob 통째로(hidden·attempts) `studio` 저장소 `kind:"job"` 봉투 · 읽기 zod(조작 뒤 몫) 실패 → `SCHEMA_INVALID`.
- 개정 1 테스트: 요청 → getJob 1회(running) → 큐로 저장 → 읽기 → 새 store `putJob` → getJob 반복 = **succeeded**, 영속 없는 대조 실행과 `toEqual`.

## 검증 (모두 이 세션 fresh 실행)
| 명령 | 결과 |
|---|---|
| RED `npx vitest run src/data/persistence` (커밋 A 전) | 3파일 import 실패 — 예측 일치, 커밋 안 함 |
| RED 같은 명령 (커밋 B 전) | 2파일 import 실패 — 예측 일치, 커밋 안 함 |
| 변이: writeQueue 실패 시 최신 의도 필터 제거 | 1건 실패 → 복원 27 통과 |
| RED `applyOps` 테스트 2건(마감 전 추가) | `applyOps is not a function` 2건 실패 → 구현 후 29 통과 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build`(check-bundle 포함) | exit 0 · `/studio/:projectId` 첫 화면 91.84 · 진입 직후 **128.51KB**/129(ADR-007 사실 9 기준값 128.51과 동일 = 변화 0) · 다른 라우트 표도 판정 통과 · 앱 코드에서 persistence import 0줄(`grep -rn "persistence/" src --include='*.ts' --include='*.tsx' | grep -v ^src/data/persistence/ | grep -v persistenceContract | wc -l` = 0) |
| `npx vitest run` 전체 1회 | exit 0 · 258 파일 · 2248 테스트 통과(마감 재실행, typecheck·lint·build도 같은 회차 exit 0) |
- 단언 약화·skip 0. 테스트 수정 1건 = 타입 캐스트(`as unknown as`) — 단언 불변.

## Ego Lite — 생략
- 사유: 새 모듈은 앱 어디에서도 import하지 않는다(배선 0이 범위). 브라우저에서 IDB 구현을 호출하려면 개발용 진입점을 앱에 넣어야 하고 그것이 금지된 배선이다. → P1a-2에서 "새로고침 생존"으로 실측. 서버 기동 0.

## P1a-2로 넘기는 것 · 열린 점
1. 배선: 진입(`openForEntry`·`readEntryRecord`)·조작 뒤(`openIdbPersistence`·큐)·SaveStatus("저장됨"은 큐 resolve 뒤)·StudioState 전체 직렬화(`StudioState`가 비공개라 이 레인 밖).
2. IDB 실측 항목: 계약 3건(get/put/getAll·덮기/삭제·structured clone) · 첫 실행 v1 빈 DB → v2 업그레이드 · 다른 탭 열림 시 blocked → INFRA · 진입 연결 versionchange 닫기.
3. 봉투 버전 불일치 시 미완료 잡 "다시 시도" 강등(개정 1)은 배선·문구(Designer) 몫 — 이 레인은 `checkEnvelope` mismatch/newer 판별까지.
4. 키는 단일 문자열 id(out-of-line). snapshots·images의 `[projectId, id]` 복합 키는 P1b/P1d에서 id 규칙 또는 저장소 이행 단계로 결정.
5. 같은 요청 키가 진행 중일 때 재제출하면 앞 요청의 실패 기록은 별도 항목으로 남는다(같은 키로 `unconfirmed()`에 1회 표시, 다음 submit/retry에 합쳐짐).
6. 진입 closure 크기: `entryRead` → `infra` → `ProjectRepositoryError` + 한국어 사유 문구 3개를 진입으로 끌어온다. 진입 몫 +0.60 배분 안에서 P1a-2가 실측 — 넘치면 진입에서는 원 오류를 그대로 던지고 분류는 조작 뒤로 옮기는 안.
- Codex 검증: Jarvis 몫(이 레인 실행 안 함).

## Codex r1 수정 (codex-r1-jarvis.txt P2 3건)
| 건 | 수정 | 회귀 테스트 |
|---|---|---|
| ① 제출 시점 스냅샷 | `writeQueue.submit`이 입력 ops를 `structuredClone` — 제출 뒤 원본 변경이 저장·재시도에 영향 0 | `writeQueue.test` "제출 시점 스냅샷" 2건(즉시 저장 · 실패 뒤 재시도) |
| ② 진행 중 재시도 | `retry(key)`가 같은 키 진행 중 요청을 끝날 때까지 기다린 뒤 남은 실패 기록을 다시 확인·재제출. 성공 = 그 키 미확인 0 | Codex 재현 순서: a·b 연속 제출 → retry → a 실패·b 성공 → status 없음 · a 저장됨 |
| ③ 잡 읽기 검증 | zod에 필수 잡 필드(profileId·version·libraryVersion·generatorVersion·seed·state·selected) · 후보/hidden 결과 모양(succeeded=plan · failed=errorCode·retryable·message) · A·B·C 순서 · hidden id = 후보 id · pending 후보마다 hidden 결과 존재 → 위반 SCHEMA_INVALID | Codex 예시(pending ×3 + hidden [undefined ×3]) 포함 위반 12건 |

- TDD: RED 4건 실측(예측 일치, 커밋 안 함) → GREEN. 단언 약화·skip 0. 기존 테스트 수정 0.
- 게이트(fresh): `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(/studio 진입 직후 128.51KB/129 변화 0) · `npm test -- --run` exit 0, 258 파일 · 2252 테스트(전체 실행은 확인 목적상 2회 돌았음 — 둘 다 exit 0).
- 범위: 수정 파일 = `writeQueue.ts`·`writeQueue.test.ts`·`jobRecord.ts`·`jobRecord.test.ts`·PROGRESS·REPORT. 앱 배선·엔진·계약·m2cBaseline·검사기·docs·lock 수정 0, 새 의존성 0. Codex 재실행 안 함(Jarvis 몫).
- 남은 판단(반영 안 함): 공개되지 않은 후보(succeeded/failed)의 hidden이 undefined가 아니어도 거부하지 않는다 — Codex 지적 범위 밖이고 getJob 진행에 영향 없음.

## Codex r2 수정 (codex-r2-jarvis.txt P2 3건 — 마지막 라운드)
| 건 | 수정 | 회귀 테스트 |
|---|---|---|
| ① 잡 state ↔ 후보 진행 상태 | jobRecord zod refine: state = `stateOf(후보)`(memoryGenerationRepository.ts:56 규칙 그대로: pending 있음 → running · 전부 성공 → succeeded · 일부 → partial · 0 → failed) 또는 queued + 후보 전부 pending(`newJob` 직후). 종료 상태 pending 0이 여기서 따라온다 | Codex 재현(succeeded + 후보 전부 pending + hidden) 포함 불일치 8건 · 정상 queued/running/succeeded 왕복 3건 |
| ② attempts 필수 | `z.record(A|B|C, z.number().int().nonnegative())` — zod 4 enum 키 record는 모든 키 필수 | `{}` · B 누락 · 1.5 · -1 · "1" · NaN → SCHEMA_INVALID, `{A:0,B:2,C:1}` 통과 |
| ③ 복제 실패 | `writeQueue.submit`의 structuredClone을 try로 감싸 `toInfra(…, "저장할 내용을 복제하지 못했습니다")`로 reject — 순번·최신 의도·미확인 기록 변경 전에 반환(상태 변화 0) | 함수 값 제출 → 동기 예외 0 · INFRA reject · 쓰기 0 · 같은 키 기존 미확인 유지 · 새 키 상태 없음 · 이후 retry 정상 |

- 주의: jobRecord의 `stateOf`는 memoryGenerationRepository의 비공개 함수를 복제한 것이다(그 파일 수정 = 범위 밖). 규칙이 바뀌면 두 곳을 함께 바꿔야 한다 — 정상 왕복 테스트(queued/running/succeeded)가 어긋남을 일부 잡는다.
- TDD: RED 3건 실측(예측 일치, 커밋 안 함) → GREEN. 단언 약화·skip 0. 기존 테스트 수정 0.
- 게이트(fresh): `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(/studio 진입 직후 128.51KB/129 변화 0) · `npm test -- --run` exit 0, 258 파일 · 2255 테스트(1회).
- 범위: 수정 파일 = `jobRecord.ts`·`jobRecord.test.ts`·`writeQueue.ts`·`writeQueue.test.ts`·PROGRESS·REPORT. 앱 배선·엔진·계약·m2cBaseline·검사기·docs·lock 수정 0, 새 의존성 0. Codex 실행 안 함(r3 없음).
