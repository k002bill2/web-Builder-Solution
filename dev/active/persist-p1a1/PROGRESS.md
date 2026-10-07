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
