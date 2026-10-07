# PERSIST-P1a-1 REPORT — 영속 어댑터 · IDB 구현 · 직렬 쓰기 큐 (배선 0)

- 브랜치 `k002bill2/persist-p1a1` · base `2700242` · 커밋: `d458fb6`(BRIEF P0) → `627d0aa`(1번) → `ac2adf9`(2번) → 이 REPORT
- 변경 = `app/src/data/persistence/**`(새 모듈 8 + 테스트 5) · `app/src/test/persistenceContract.ts` · `dev/active/persist-p1a1/**`. 앱 배선·엔진·계약·m2cBaseline·검사기·docs·lock·CLAUDE.md 수정 0, 새 의존성 0, 서브에이전트 0.

## 1. StudioPersistence 어댑터 (`627d0aa`)
| 모듈 | 역할 | 진입/조작 뒤 |
|---|---|---|
| `envelope.ts` | 봉투 `{schemaVersion, kind, id, data}` · `SCHEMA_VERSION=1` · `DB_NAME` · 저장소 7개(3절 (a)) · 수제 확인 `checkEnvelope` → ok / missing / mismatch(found, newer) / invalid | 진입 몫(의존성 0) |
| `entryRead.ts` | `openForEntry`(버전 없이 열기, 저장소 없으면 close → undefined, versionchange=close) · `readEntryRecord`(단건 get + 수제 확인) | 진입 몫 — P1a-2가 진입에 둠 |
| `infra.ts` | `toInfra` — quota·blocked·abort·그 밖 → `ProjectRepositoryError("INFRA")`, 사유는 메시지 | 공용 |
| `studioPersistence.ts` | 인터페이스(get·getAll·write(트랜잭션 단위)·close) + 메모리 가짜(put/get structured clone, 전부 아니면 전무, 커밋 지연·실패 주입) | 테스트용 |
| `idbPersistence.ts` | IDB 구현(브라우저 API 직접) · `DB_VERSION=2` · `upgradeDatabase` 버전별 단계(contains 가드) · write resolve = `oncomplete` · blocked/error/abort → INFRA | 조작 뒤 |
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
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build`(check-bundle 포함) | exit 0 · `/studio/:projectId` 첫 화면 91.84 · 진입 직후 **128.51KB**/129(ADR-007 사실 9 기준값 128.51과 동일 = 변화 0) · 다른 라우트 표도 판정 통과 · `dist`에 새 모듈 문자열(`BlockedError`·`stillLatest`·"브라우저 저장소에 접근") 0건 |
| `npx vitest run` 전체 1회 | exit 0 · 258 파일 · 2246 테스트 통과 |
- 단언 약화·skip 0. 테스트 수정 1건 = 타입 캐스트(`as unknown as`) — 단언 불변.

## Ego Lite — 생략
- 사유: 새 모듈은 앱 어디에서도 import하지 않는다(배선 0이 범위). 브라우저에서 IDB 구현을 호출하려면 개발용 진입점을 앱에 넣어야 하고 그것이 금지된 배선이다. → P1a-2에서 "새로고침 생존"으로 실측. 서버 기동 0.

## P1a-2로 넘기는 것 · 열린 점
1. 배선: 진입(`openForEntry`·`readEntryRecord`)·조작 뒤(`openIdbPersistence`·큐)·SaveStatus("저장됨"은 큐 resolve 뒤)·StudioState 전체 직렬화(`StudioState`가 비공개라 이 레인 밖).
2. IDB 실측 항목: 계약 3건(get/put/getAll·덮기/삭제·structured clone) · 첫 실행 v1 빈 DB → v2 업그레이드 · 다른 탭 열림 시 blocked → INFRA · 진입 연결 versionchange 닫기.
3. 봉투 버전 불일치 시 미완료 잡 "다시 시도" 강등(개정 1)은 배선·문구(Designer) 몫 — 이 레인은 `checkEnvelope` mismatch/newer 판별까지.
4. 키는 단일 문자열 id(out-of-line). snapshots·images의 `[projectId, id]` 복합 키는 P1b/P1d에서 id 규칙 또는 저장소 이행 단계로 결정.
5. 같은 요청 키가 진행 중일 때 재제출하면 앞 요청의 실패 기록은 별도 항목으로 남는다(같은 키로 `unconfirmed()`에 1회 표시, 다음 submit/retry에 합쳐짐).
- Codex 검증: Jarvis 몫(이 레인 실행 안 함).
