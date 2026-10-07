# PERSIST-P1b PROGRESS

## 체크리스트
- [x] P0 BRIEF 커밋 (`8e66c23`)
- [x] 예산 스파이크: 진입 골격(StudioLayout effect · memoryProjectRepository `images` · 복원 청크 로더)만 → `/studio` **129.54** (+0.13, 상한 129.60 안) — 이 배치 채택
- [x] 1번 커밋: 이미지 저장 + 자동 복원 구현(저장·복원 배선이 같은 테스트 왕복이라 한 커밋 — 아래 기록)
- [x] 2번 커밋 = 기준선 "ADR-004 개정 9·10 배분 P1b" `6a2f87b`(129.57, m2cBaseline · bundleBudget.test 고정값) · 가드 수정 `d987302`
- [x] Ego Lite(build + preview 4337) 업로드 → 저장됨 → 새로고침 → 직접 진입 유지 · 이탈 후 재진입 유지 → 정리
- [x] 게이트: typecheck · lint · build · 전체 vitest 1회
- [x] REPORT

## 설계(요약)
- 저장: `localSync.flush(projectId, book, images)` — 문서 레코드·상태 레코드와 **같은 트랜잭션**에 이미지 op(큐 키 = projectId → INFRA·retry·미확인 재제출 그대로).
  - put = 참조 집합(`retainedIds(doc, undefined, 스냅샷 문서들)` — 5.9 함수 재사용) ∩ 편집 틀 맵 − 이미 저장된 id. 레코드 = 변형본 Blob 전부 + width·height·format·bytes(`imageMeta`).
  - delete = 이 프로젝트(`projectId/` 접두사)의 저장된 id 중 참조 집합 밖.
  - 저장된 id = 싱크 열 때 `persistence.keys("images")` 1회 + 제출마다 갱신.
  - 레코드 id = `${projectId}/${localId}`(ADR 3절 `[projectId, localId]`를 봉투 문자열 id로 인코딩).
- 복원: 편집 틀 마운트(맵 없음) → `repository.images` → 별도 청크 `imageRestore` — 저장된 문서·스냅샷의 참조 집합만 읽고 검증(widthLadder·formatFromMagic·MAX_SIDE/MAX_PIXELS·bytes 합·checkLimits) → `addImage`로 메타 WeakMap 재구성 → `publish(prev ⇒ {...복원, ...prev})`. 실패·불량 = 맵에 없음 = 기존 잃은 이미지 경로.
- jsdom `structuredClone`은 Blob을 `{}`로 잃는다(실측) → 테스트 setup에만 Blob 보존 래퍼(Blob 있을 때만). 제품 코드 우회 0.

## TDD 예측 (RED)
- imageRecord.test: `imageOps`·`readImageRecord`·`imageRecordId` import 실패(모듈 없음) → 파일 단위 실패.
- persistenceContract: `keys` 케이스 `p.keys is not a function` 실패 1 · Blob 보존 케이스는 setup 래퍼 전이면 `expected {} to be an instance of Blob` 실패 1.
- imagePersist.test(배선): 저장 뒤 `images` 저장소 레코드 없음(`expected undefined ...`) · 삭제 케이스는 레코드가 원래 없어 일부 통과 가능(예측: 지움 단언은 통과, 앞 단계 put 단언에서 실패).
- imageRestore.test: 스텁 restoreImages가 publish 안 부름 → 복원 케이스 실패, 실패 경로(publish 0) 케이스는 통과 예측.

## 기록
- RED 실측(새 3파일 + 계약): imageRecord·imageRestore = `./imageRecord` 모듈 없음(파일 실패) · 계약 `p.keys is not a function` 1 · Blob `expected {} to be an instance of Blob` 1 — 예측 일치. imagePersist는 첫 전체 실행이 출력 없이 멈춰(src/test 포함 실행) 중단 — 좁힌 실행에서는 확인 못 함(어긋남 1건). RED 커밋 0.
- GREEN: persistence 10파일 75 + deferredStudio·memoryProjectRepository 12파일 103 통과. 단언 약화·skip 0. 테스트 수정 2건 = 내 테스트 오기(createSnapshot 인자 · Uint8Array 타입).
- 구현 수정 1건: 복제 실패 단위 테스트(가짜 book 문서에 sections 없음)에서 imageOps가 참조 집합을 재다 던짐 → "넣을 맵도 지울 저장 id도 없으면 참조 집합을 재지 않는다" 조건(동작 같음, 계산 생략).
- Ego Lite TaskSpace 22: 업로드 → 저장됨 → 새로고침 1회 → 유지 · 이탈→재진입 유지 · IDB 삭제 onsuccess · finish · listTaskSpaces []· 4337 종료.
- 마감 게이트(d987302): typecheck 0 · lint 0 · build 0(129.57) · vitest 263/2297 exit 0. 서브에이전트 0.
