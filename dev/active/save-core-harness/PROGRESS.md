# save-core-harness PROGRESS

- base `5b7d026`(앱 `93f8111`) · 브랜치 `k002bill2/save-core-harness` · 쓰기 범위 = `dev/active/save-core-harness/`만.
- 영속 경계: **fake-indexeddb 미설치**(`app/package.json`·`find app/node_modules -iname '*indexeddb*'` = caniuse 데이터뿐) · Node 24 `typeof indexedDB` = undefined · 새 의존성 금지 → 제품 `createMemoryPersistence`(structuredClone · 전부-아니면-전무 트랜잭션 · `commit` 지연 게이트 · `fail` 주입)를 영속 경계로 쓴다. **실제 IndexedDB 엔진·Web Locks·브라우저 멀티탭 = NOT VERIFIED.**
- 서브에이전트 분할: 불필요(BRIEF — 단일 코어 직렬 TDD).

## 체크리스트

- [x] 0. 입력 읽기(BRIEF · rs5-review REPORT/QA · rs4P3 하네스) · `npm ci`(lock diff 0)
- [x] 0. 실행 경로 smoke — vitest(`vitest.config.mjs`) · tsc(`tsconfig.json`) · eslint(app config 읽기 전용) 오류 검출 실측
- [x] 0. 제품 baseline full suite 1회(`rawlogs/baseline-app-fullsuite.log` exit 0 — 수치는 REPORT)
- [x] H1 RED(`rawlogs/h1-red.log` 2 failed/1 passed) → GREEN(`rawlogs/h1-green.log` 3 passed) → 커밋
- [x] H2 RED(`rawlogs/h2-red.log` 2 failed/5 passed) → GREEN(`rawlogs/h2-green.log` 7 passed) → 커밋
- [x] H3 RED(`rawlogs/h3-red.log` 1 failed/10 passed) → GREEN(`rawlogs/h3-green.log` 11 passed) → 커밋
- [x] H4 RED(`rawlogs/h4-red.log` 4 failed/11 passed) → GREEN(`rawlogs/h4-green.log` 15 passed) → 커밋
- [x] H5 RED(`rawlogs/h5-red.log` 5 failed/16 passed) → GREEN(`rawlogs/h5-green.log` 21 passed) → 커밋
- [ ] 하네스 full suite 2회 · tsc · eslint (rawlogs)
- [ ] README · MINIMAL-CONTRACT · REPORT
- [ ] 최종: app diff 0 · lock diff 0 · git status · pathspec 커밋 증거

## 예상 테스트 수 (최초 예상 — 실제와 REPORT에서 대조)

H1 3 · H2 4 · H3 4 · H4 3 · H5 6 → **합 20 (범위 16~24)** + smoke 1.

## RED 예상 단언 (구현 전 기록)

v0 코어 = 제품 위험을 그대로 흉내 낸 순진한 구현(완료 시 현재 mark로 settle · 편집기 소유 Blob 맵 · 열기 시점 증명 재사용 · 메모리 모드도 confirmed · discard/replace 무조건).

- H1 저장 A 진행 중(commit 게이트 대기) 편집 B → detach(POP/cleanup) → A 커밋
  - 예상 RED: `view().dirty` expected true received false · `result.newer` expected true received false · B Blob 보존 expected Blob received undefined · 이후 save의 IDB doc hash = B 실패.
  - 늦은 callback: discard/replace 뒤 도착한 A 완료가 `confirmed`를 바꾸지 않아야 함 → v0는 바꿈(RED).
- H2 디바운스 전 B 편집 → confirm
  - 예상 RED: confirm 진행 중(게이트) 편집 C → v0는 `status:"confirmed"` 반환(expected "newer") · memory 모드 v0 `confirmed`(expected failed/not-persistent) · receipt가 IDB 재읽기 hash와 일치해야 함.
- H3 새 이미지 → writer 거절/quota/abort → detach → 재시도
  - 예상 RED: v0는 detach에서 Blob을 버려 재시도 시 images 레코드 0(expected 1) · 부족 이미지인데 v0는 doc만 제출(expected 쓰기 0 · `image-missing`).
- H4 탭 A confirm → 탭 B 저장(세대+1) → 탭 A `wrote:false` confirm
  - 예상 RED: v0는 열기/직전 증명을 재사용해 `confirmed`(expected failed stale) · readonly 탭 wrote:false도 confirmed(expected failed).
- H5 replace/discard × inflight
  - 예상 RED: inflight 중 discard v0 성공(expected rejected inflight) · 옛 완료가 replace된 초안 덮어씀 · 미publish/dirty 상태 replace v0 덮어씀(expected conflict) · 저장 실패 뒤 discard가 근거 없이 성공 · epoch 불일치 replace 허용.
  - regression(RED 아님 예상): confirm이 starter 호출 0 · acquire(mountId) 멱등.

## 기록

- H1: RED 첫 실패 단언 = `newer` expected true received false(테스트1·3). 테스트2(커밋 뒤 편집)는 v0에서도 PASS — 경계 확인용. 구현 = 코어 소유 바인딩·저장 직렬 chain·제출 mark 고정·세대 큰 receipt만 confirmed.
- H2: RED = `status` expected newer received confirmed(진행 중 편집) · memory `status` expected failed received saved. 테스트1(진행 중 저장 뒤 B confirm)·4(unsupported 쓰기 0)는 v0+H1에서도 PASS — 경계 확인. 구현 = memory save 실패 · confirm은 save 직렬 경유 → IDB 재읽기 verify → mark 앞서면 newer.
- H3: RED = 부족 이미지 `reason` expected image-missing received not-committed — v0는 이미지 없이 **문서만 커밋**(재읽기 verify가 잡음). 테스트1~3(readonly 거절·quota·abort 재시도)은 H1 구현(코어 소유 바인딩)과 제품 메모리 영속의 원자 트랜잭션 덕에 RED 없이 PASS — v0의 detach Blob 폐기 RED는 H1 테스트에서 `newer` 단언에 가려 별도 관측 못 함(정직 표기). 구현 = 바인딩 또는 IDB keys에 없으면 제출 0. 첫 green 시도는 패치 스크립트 실패로 덮였고 재실행 로그가 h3-green.log.
- H4: 1차 RED(`h4-red-1.log`)는 테스트1 첫 단언이 신규 `proof` 필드라 핵심 단언이 가려짐 → proof 단언을 테스트2로 옮기고(구현 전) 재실행한 `h4-red.log`가 기준: 테스트1 `status` expected failed/stale received confirmed · 테스트3 readonly 탭 confirmed · 테스트4 dirty 저장 saved(B 덮어씀). 예상 3건 → 실제 4건(예상 세대 불일치 저장 추가). 구현 = Receipt.proof · wrote:false는 writer 모드+IDB 재읽기 verify · save는 예상 세대(prev = confirmed.generation) 불일치 시 stale.
- H5: RED 전 v0 lease 스텁(호출마다 새 토큰 = QA-6 흉내)을 넣어 TypeError가 아닌 단언 실패로 RED(`expected 2 to be 1`). RED 5건 = discard inflight·근거 복귀·stale blocked·replace dirty·lease. starter 분리 테스트는 v0에서도 PASS(회귀 가드). 구현 = discard(inflight 거절·IDB 재읽기 근거·없으면 blocked) · replace(intent·inflight·dirty·epoch 거절, 성공 시 epoch+1·dirty) · acquire(mountId) 멱등.
- (진행하며 추가)
