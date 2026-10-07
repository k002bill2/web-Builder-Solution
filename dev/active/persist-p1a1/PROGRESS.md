# PERSIST-P1a-1 PROGRESS

- [x] P0: BRIEF 커밋
- [x] 1. StudioPersistence 어댑터 + 메모리 가짜 + IDB 구현 + 진입 읽기 함수 + 계약 테스트
- [x] 2. 직렬 쓰기 큐 + StoredJob 직렬화 테스트
- [x] Ego Lite (선택) — 생략: 호출 진입점 = 금지된 앱 배선, P1a-2 새로고침 생존 실측(REPORT)
- [x] 게이트: typecheck · lint · build(/studio 128.51 변화 0) · 전체 vitest 258/2246 exit0
- [x] REPORT

## TDD 예측
### 커밋 A (어댑터·가짜·IDB·진입 읽기) — 구현 전
- 설계: `app/src/data/persistence/` — envelope.ts(봉투·수제 확인·DB 이름·저장소 이름, 의존성 0) · entryRead.ts(진입 몫: 열기·단건 읽기·수제 확인) · infra.ts(toInfra) · studioPersistence.ts(인터페이스+메모리 가짜) · idbPersistence.ts(IDB 구현·업그레이드 단계) · 계약 테스트 `src/test/persistenceContract.ts`(가짜만 등록).
- IDB 버전: 진입 읽기는 버전 없이 열어 처음이면 저장소 없는 v1이 생길 수 있음 → 쓰기 쪽 DB_VERSION=2, 단계에 contains 가드, 진입은 저장소 없으면 close 후 missing, 양쪽 onversionchange=close.
- 예측 RED: envelope.test(모듈 없음 → import 실패), memoryPersistence.test(모듈 없음), idbPersistence.test(모듈 없음) — 3파일 모두 실패, 기존 테스트 영향 0.
- 예측 GREEN: 새 테스트 전부 통과, typecheck 통과.
- 실측 RED: 3파일 `Failed to resolve import "./envelope"` — 예측 일치(커밋 안 함).
- 실측 GREEN: 3파일 16 테스트 통과 · typecheck · eslint(새 파일) 통과.


### 커밋 B (직렬 쓰기 큐 · StoredJob 레코드) — 구현 전
- 설계: writeQueue.ts — `submit(요청 키, ops)`·`retry(요청 키)`·`status`·`unconfirmed()`. FIFO 체인, persistence.write(=IDB complete) 뒤에만 resolve. 실패 = INFRA reject + 미확인 기록 유지, 다음 요청은 막지 않음. 레코드별 "최신 의도" 규칙: 뒤에 제출된 요청이 같은 (store,id)를 쓰면 앞 요청의 미확인 기록에서 그 레코드를 뺀다(재시도가 옛 값으로 덮지 않음). 같은 요청 키 재제출 = 남은 미확인 기록과 합침.
- jobRecord.ts — StoredJob 통째로(hidden·attempts) 봉투 `studio/job`, 읽기 = zod(조작 뒤 몫) → 실패 SCHEMA_INVALID.
- 예측 RED: writeQueue.test·jobRecord.test 모듈 없음으로 2파일 실패.
- 예측 GREEN: 요청 → getJob 1회 → 봉투·clone 왕복 → 새 store putJob → getJob 반복 = succeeded, 대조 실행과 같은 job.
- 실측 RED: 2파일 `Failed to resolve import "./jobRecord"`·`"./writeQueue"` — 예측 일치(커밋 안 함).
- 실측 GREEN: 5파일 27 테스트 통과 · typecheck(테스트 캐스트 1건 수정 후) · eslint 통과.
- 변이 확인: 실패 시 `stillLatest` 필터 제거 → "진행 중 덮임" 테스트 1건 실패 → 복원 후 27 통과.

### 마감 보완 (조언 반영)
- IDB write 중간 op 동기 예외 시 부분 자동 커밋 → `applyOps` + `tx.abort()`. 예측 RED: applyOps 없음 2건 실패 → 실측 일치 → GREEN 29. blocked 뒤 늦은 연결 close.
- 마감 게이트 fresh: typecheck 0 · lint 0 · build 0(/studio 128.51) · vitest 258/2248 exit 0.

## Codex r1 수정 (codex-r1-jarvis.txt P2 3건)
- [x] ① writeQueue.submit 시점 스냅샷(structuredClone) — 제출 뒤 원본 변경이 저장·재시도에 영향 0
- [x] ② retry(key) = 진행 중 요청 모두 대기 → 남은 실패 기록 재확인·재제출 (a·b 연속 제출 → a 실패·b 성공 회귀)
- [x] ③ jobRecord 읽기 검증 강화 — 필수 잡 필드·후보별 결과 모양·pending 후보마다 hidden 결과, 위반 SCHEMA_INVALID
- [x] 게이트: typecheck · lint · build(/studio 128.51 변화 0) · 전체 vitest exit0
- [x] REPORT "Codex r1 수정" 절 + 커밋

### TDD 예측 (구현 전)
- ① 예측 RED: 새 테스트 2건(제출 뒤 data 변경 → 저장값 원본 / 실패 뒤 변경 → 재시도 저장값 원본) 실패 — 현재는 참조 보관이라 변경된 값이 저장됨.
- ② 예측 RED: 새 테스트 1건 실패 — retry가 b의 Promise만 반환해 resolve 뒤 status=unconfirmed·a 값 undefined.
- ③ 예측 RED: 새 테스트 1건 실패 — Codex 예시(pending 3개 + hidden [undefined×3])와 필수 필드 누락·후보 모양 위반 사례가 통과(throw 안 함). 기존 정상 왕복 테스트는 GREEN 유지.
- 실측 RED: 4건 실패(writeQueue 3: 저장값 '바뀜' ×2 · status 'unconfirmed' / jobRecord 1: "expected function to throw") — 예측 일치(커밋 안 함).
- 실측 GREEN: persistence 6파일 33 테스트 통과. 구현 = submit 입력 structuredClone · retry가 같은 키 pending을 끝날 때까지 기다린 뒤 실패 기록 재확인·재제출 · jobRecord zod에 필수 잡 필드·후보/hidden 결과 모양(discriminatedUnion)·A·B·C 순서·hidden id 일치·pending⇒hidden 존재 refine.
- 게이트 fresh: typecheck 0 · lint 0 · build 0(/studio 진입 직후 128.51KB 변화 0) · vitest 258 파일/2252 테스트 exit 0.

## Codex r2 수정 (codex-r2-jarvis.txt P2 3건 — 마지막 라운드)
- [x] ① jobRecord 잡 state ↔ 후보 진행 상태 일관성 (memoryGenerationRepository `stateOf` 규칙 그대로)
- [x] ② attempts A·B·C 각각 0 이상 정수 필수
- [x] ③ writeQueue.submit structuredClone 실패 → INFRA rejected Promise · 상태 변화 0
- [x] 게이트: typecheck · lint · build(/studio 128.51 변화 0) · 전체 vitest exit0
- [x] REPORT "Codex r2 수정" 절 + 커밋

### 상태 규칙 (코드 확인)
- `stateOf`(memoryGenerationRepository.ts:56): pending 있음 → running · 전부 succeeded → succeeded · 일부 → partial · 0 → failed.
- `newJob`(memoryGenerate.ts:63): queued + 후보 전부 pending. `retryJob`: running + 재시도 후보 pending.
- 검증 규칙: state = stateOf(후보) 이거나 (state = queued 이고 후보 전부 pending). 종료 상태면 pending 0이 자동으로 따라온다.

### TDD 예측 (구현 전)
- ① 예측 RED: 새 테스트 1건 실패 — Codex 재현 레코드(state succeeded + 후보 전부 pending + hidden 있음)·running인데 pending 0·partial인데 전부 성공 등이 통과(throw 안 함).
- ② 예측 RED: 새 테스트 1건 실패 — `attempts: {}`·B 누락·1.5·-1·"1" 중 `{}`·누락·1.5·-1이 통과("1"은 이미 거부).
- ③ 예측 RED: 새 테스트 1건 실패 — 함수 값 제출 시 submit이 동기 DataCloneError를 던져 `not.toThrow` 단언에서 실패.
- 실측 RED: 3건 실패(jobRecord 2: "expected function to throw" ×2 / writeQueue 1: `DataCloneError` 동기 예외로 `not.toThrow` 실패) — 예측 일치(커밋 안 함).
- 실측 GREEN: persistence 6파일 36 테스트 통과. 구현 = jobRecord zod에 `attempts: z.record(A|B|C, int ≥ 0)`(zod 4 enum 키 = 전부 필수) + state 일관 refine(stateOf 규칙 복제) · writeQueue.submit의 structuredClone을 try로 감싸 `toInfra`로 reject(순번·latest·failed 변경 전 반환).
- 게이트 fresh: typecheck 0 · lint 0 · build 0(/studio 진입 직후 128.51KB/129 변화 0) · vitest 258 파일/2255 테스트 exit 0(1회).
- 단언 약화·skip 0 · 기존 테스트 수정 0.
