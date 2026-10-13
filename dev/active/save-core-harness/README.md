# save-core-harness — 격리 저장 코어 하네스

제품 `app/`과 연결하지 않은 저장 코어 1개(`core/saveCore.ts`)와 H1~H5 테스트(`test/`). 제품 코드는 **읽기 전용 import**만 한다:
`studioPersistence.createMemoryPersistence`(영속 경계) · `writerLock.createWriterGate` · `fakeLocks.createLockRegistry`.

## 실행 (저장소 루트에서)

```bash
# 0. 의존성 — 제품 lock 그대로(lock diff 0)
(cd app && npm ci)
# 1. 하네스 테스트(단일 seed, shuffle 끔 — 결정적)
app/node_modules/.bin/vitest run --config dev/active/save-core-harness/vitest.config.mjs
# 2. 타입 검사(app tsconfig strict를 extends)
app/node_modules/.bin/tsc --noEmit -p dev/active/save-core-harness/tsconfig.json
# 3. lint(제품 eslint 설정 읽기 전용 사용)
app/node_modules/.bin/eslint --config app/eslint.config.js dev/active/save-core-harness/core dev/active/save-core-harness/test
```

- unhandled error가 있으면 vitest가 non-zero로 끝난다(`dangerouslyIgnoreUnhandledErrors: false`). rawlogs 각 파일 끝 `exit N`이 종료 코드다.
- 제품 baseline(별도): `(cd app && npx vitest run)`.

## 영속 경계 — 무엇이 진짜이고 무엇이 아닌가

- **fake-indexeddb 미설치 · Node 24·jsdom에 `indexedDB` 없음 · 새 의존성 금지** → 실제 IndexedDB 엔진은 실행하지 않았다(NOT VERIFIED).
- 대신 제품의 `createMemoryPersistence`를 쓴다: put/get 때 structuredClone, `write(ops)` 1회 = 전부-아니면-전무 트랜잭션, `commit` 지연 주입(= 커밋 전/후 deferred gate), `fail` 주입(QuotaExceededError·AbortError → 쓰기 0으로 reject). 무조건 성공 mock이 아니라, 실패 주입이 실제로 쓰기 0을 만드는 제품 구현이다.
- 쓰기 잠금 = 제품 `createWriterGate` + 제품 `fakeLocks`(브라우저 Web Locks 아님). gate의 `fresh` 콜백은 `async () => true` mock.
- "리로드" = 같은 영속 인스턴스 위에 새 코어를 여는 것(페이지 리로드·프로세스 재시작 아님).

## 파일

| 경로 | 내용 |
|---|---|
| `core/saveCore.ts` | 저장 코어(232행) |
| `test/h1~h5.test.ts` · `test/helpers.ts` | 체크포인트별 테스트 · commit/fail 게이트 |
| `vitest.config.mjs` · `tsconfig.json` | 하네스 전용 설정(제품 설정 변경 0) |
| `rawlogs/` | RED/GREEN·최종 2회·tsc·eslint·제품 baseline 원문 |
| `MINIMAL-CONTRACT.md` · `REPORT.md` · `PROGRESS.md` | 검증된 최소 계약 · 결과 · 체크포인트 |
