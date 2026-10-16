# MINIMAL-CONTRACT — 하네스에서 테스트로 확정된 저장 코어 최소 계약

- 근거 = `core/saveCore.ts` + `test/h1~h6.test.ts`(37건 PASS, `../save-core-fix/rawlogs/final-harness-run{1,2}.txt`. 23건 시점 원문 = `rawlogs/final-harness-run{1,2}.txt`). CONTRACT-5 API를 옮긴 것이 아니다.
- save-core-fix(78e3c52 이후) 갱신 = I6·I7·I9·G3만. 제품 CONTRACT-5 변경 0.
- 범위 = 프로젝트 1개·탭 1개 코어. 영속 경계 = 제품 `StudioPersistence`(하네스에서는 메모리 구현). **실제 IndexedDB·Web Locks·제품 통합은 미검증.**

## 1. API (실제 구현)

| API | 동작 | 테스트 |
|---|---|---|
| `openSaveCore({projectId, persistence?, writer, initial, starter?})` | `docs/{projectId}`를 읽어 초안·`confirmed{proof:"hydrated"}` 설정. persistence 없음 = 메모리 폴백 | H2-3, H4 |
| `edit(doc, blobs?) → mark` | **동기** 초안 등록 · mark+1 · doc은 동결 사본·blobs는 코어 바인딩에 복사(호출자 객체·맵 변경 무관) · discard 중에도 받음 | H1, H3-1, H6-2 |
| `attach().detach()` | 편집기 화면 수명(POP/cleanup). 바인딩·초안에 영향 0 | H1-1, H3-1·3 |
| `save() → saved{receipt, newer} \| failed{reason, newer}` | 직렬 실행 · 제출 시점 초안/mark 고정 · 문서+참조 이미지 put을 **write 1회(트랜잭션 1개)**로 | H1, H3 |
| `confirm() → confirmed{wrote, receipt} \| newer{receipt} \| failed{reason}` | starter 호출 0 · 아래 I3~I5 | H2, H4, H5-5 |
| `discard() → discarded{restored} \| rejected \| blocked` | 아래 I7 | H5-1~3 |
| `replace(doc, {intent:"replace", expectedEpoch}, blobs?)` | 아래 I8 | H5-4 |
| `retryStart()` | starter를 부르는 유일한 경로 | H5-5 |
| `acquire(mountId)/release(token)` | 같은 mountId 재요청 = 같은 토큰 · release 뒤 새 토큰 | H5-6 |
| `view()` | `doc·mark·dirty(mark>savedMark)·inflight·epoch·confirmed·blob(id)` | 전부 |

`Receipt = {hash, imageIds, generation, mark, proof: "hydrated"|"committed"|"fresh"}` — 커밋된 정확한 문서 hash·이미지 id·세대·제출 mark.

## 2. 불변식 (테스트로 확인)

- **I1 제출 mark 고정**: save 완료 시 `savedMark = max(savedMark, 제출 mark)`. 진행 중 편집이 있으면 `newer=true`·`dirty` 유지·`confirmed`는 제출본(H1-1, H2-2).
- **I2 직렬·세대**: 저장은 promise chain으로 직렬 → IDB 커밋 순서 = 제출 순서. `confirmed`는 세대가 큰 receipt로만 바뀐다 — 늦은 완료가 새 확인을 덮지 않음(H1-3).
- **I3 confirm wrote:true**: dirty면 save(진행 중 저장 뒤 직렬) → **IDB 재읽기**(hash·세대 일치 + 참조 이미지 key 존재) 실패면 `failed{not-committed}` · 끝난 뒤 mark가 앞서면 `newer`(확정 아님)(H2-1·2).
- **I4 confirm wrote:false**: writer 모드 + IDB 재읽기가 마지막 증명과 같을 때만, `proof:"fresh"` receipt. 진입 뒤(await 사이) 편집이 있으면 `newer`(H2-3). 열기 증명(`hydrated`) 재사용 0 · readonly → `failed{readonly}` · 다른 탭이 세대를 올렸으면 `failed{stale}`(H4-1~3).
- **I5 비영속**: persistence 없음 → save·confirm `failed{not-persistent}` · unsupported(locks 없음) → `failed{unsupported}`·쓰기 0. 영속 confirmed 0(H2-3·4).
- **I6 원자·이미지**: save는 제출 doc과 Blob 바인딩을 **같은 시점에 동결**한다(그 뒤 같은 id 재바인딩은 다음 저장 몫, H6-2·QA CE-2). 참조 이미지는 동결 바인딩에 있으면 문서와 같은 트랜잭션으로 put, 없으면 IDB의 **코어 이미지 레코드(Blob)를 실제로 재읽어** 있어야 하고(key만 있는 비코어 레코드 = 없음), 둘 다 아니면 `failed{image-missing}`·**제출 0**. verify(confirm·discard 증명)도 참조 이미지 레코드를 재읽는다(**존재 확인만 — 바이트 비교 없음**, 다른 프로젝트의 같은 id도 통과 = OBS-2) — 어댑터 거짓 성공(반영 0·이미지 op 누락)은 `failed{not-committed}`(H6-4). quota/abort는 문서·이미지 함께 0, 재시도 성공 시 함께 있음. op는 docs/images put뿐(delete·스냅샷 경로 차용 0)(H3).
- **I6b 예상 세대**: save 직전 IDB 세대 ≠ `confirmed.generation`이면 `failed{stale}` — 다른 탭 문서 덮어쓰기 0(H4-4).
- **I7 discard**: 진입부터 끝까지 **배타** — 그 사이 `save()` = `failed{discarding}`(chain·inflight·쓰기 0), dirty `confirm` = `failed{discarding}`, 두 번째 discard = `rejected{discarding}`. edit·replace는 받고(mark 증가) discard는 `blocked{newer}`. 읽기 throw여도 가드 해제(H6-1·QA CE-1). 성공 시 바인딩 = **복귀 문서가 이 코어에서 커밋될 때 실린 Blob만**(그 문서 imageIds 한정) — 그 밖(폐기 Blob·열기 hydrated라 바인딩 없음)은 제거되어 다음 저장은 IDB 레코드를 쓴다. blocked/rejected면 바인딩 보존. 읽기가 끝나지 않으면 가드도 풀리지 않는다(liveness). delete op 0(H6-2·QA CX-3). inflight면 `rejected{inflight}` · 영속 없음/저장 이력 없음 → `blocked` · IDB 재읽기가 마지막 증명과 같고 진입 뒤 편집이 없을 때만 그 문서로 복귀(`restored{proof:"fresh"}`, epoch+1) · 진입 뒤 편집 → `blocked{newer}`·최신 초안 보존(H5-3) · 아니면 `blocked{stale}`·초안 보존. 폐기 뒤 confirm에 폐기 초안 부활 0(H5-1~3).
- **I9 같은 영속 인스턴스 직렬**: 세대 읽기(prev)~write resolve 구간은 같은 `StudioPersistence` 인스턴스를 쓰는 코어 간 직렬. 공유 gate로 둘 다 writer여도 뒤 저장은 앞 커밋 세대를 보고 `failed{stale}`, 앞 커밋 보존(H6-3·QA CE-3a). 한 코어 연속 저장·같은 gate 재열기·쓰기 실패 뒤 진입은 그대로(H6-3 회귀). **다른 영속 인스턴스·다른 탭은 막지 않는다**(writer 잠금 몫). 구간이 write resolve까지라 한 코어의 write가 멈추면 같은 영속의 다른 코어 save도 대기한다(liveness).
- **I8 replace**: intent 없음 → `rejected{intent-required}` · inflight → `rejected{inflight}` · dirty(미저장 편집) → `rejected{dirty}` · epoch 불일치 → `rejected{epoch}` · 성공 시 epoch+1·dirty(저장 필요)·confirmed 유지(H5-4).

## 3. 거절 동작 요약 (UI가 처리해야 할 것)

`newer`·`readonly`·`stale`·`discarding`·`unsupported`·`not-persistent`·`image-missing`·`not-committed`·`inflight`·`dirty`·`epoch`·`intent-required`·`no-saved-state`. quota/abort는 `reason` = 제품 `toInfra` 메시지 문자열(코드 아님 — gap G6).

## 4. 기존 API 통합 gap (미연결 — 제품 적용 전 결정 필요)

- **G1 메모리 커밋 층**: 제품은 DocBook 메모리 커밋 뒤 IDB flush(F2·QA-4). 코어는 IDB만 진실로 본다 — DocBook과 공존 방식 미정.
- **G2 디바운스**: 코어는 `edit()` 동기 등록을 전제(CX-1 대책). 제품 스케줄러(2초 디바운스 publish)는 매 편집마다 코어에 동기 등록해야 한다 — 미연결.
- **G3 세대 읽기와 쓰기가 다른 트랜잭션**: `StudioPersistence.write`에 조건부 쓰기가 없어 예상 세대 검사(I6b)는 writer 잠금 배타성 + 같은 영속 인스턴스 직렬(I9)에 기댄다. 같은 realm에서 영속 인스턴스를 둘 만들거나 잠금 없이 쓰면 여전히 뚫린다. readwrite 트랜잭션 안 조건부 쓰기는 제품 API 변경 필요 — 미구현(PARTIAL).
- **G4 바인딩 해제 없음**: 코어 바인딩은 코어 수명 동안 유지(QA-5와 같은 누수 축). H 범위 밖.
- **G5 readonly 탭 확인 불가**: I4는 보수적 선택(QA-1 제안) — 내용이 같아도 readonly 탭은 `failed{readonly}`.
- **G6 실패 사유 코드화**: quota/abort 사유가 메시지 문자열.
- **G7 lease ↔ 편집기 재seed**: acquire 멱등만 확인. StrictMode 재마운트 뒤 편집기 state 재seed(QA-6)는 코어 밖 — 미검증.
- **G8 start 상태(I7/QA-7)**: `retryStart`는 starter 호출만 하고 start 결과 상태(`held`)를 모델링하지 않는다.
