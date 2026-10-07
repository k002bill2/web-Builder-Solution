# PERSIST-P1a-2 PROGRESS

- [x] P0 BRIEF 커밋
- [x] 정본 읽기(ADR-007·ADR-004 개정 9·E0·P1a-1 REPORT)
- [x] TDD 예측 기록 + RED 확인(예측 일치, needsUnloadGuard local은 런타임 선통과 — REPORT)
- [x] 1-a 진입 하이드레이션(안1-min, 수제 schemaVersion)
- [x] 1-b 저장 배선(쓰기 큐, "저장됨"=IDB 커밋 뒤, 실패 INFRA·retry, persistence local 문구)
- [x] 1-c P1a-1 한계(복제 실패 재시도 불가·문구 원인 일치·stateOf 공유)
- [x] 2 ADR-004 개정 9 적용 — 개정 10(상한 129.60) 뒤 BRIEF-F F2로 적용
- [x] Ego Lite 정리(IDB 삭제 onsuccess·finish·spaces=[]·리슨 0) — 시나리오 본체는 BLOCKED: 시간(새로고침 생존 미실측, REPORT)
- [x] 게이트: typecheck 0 · lint 0 · vitest 0(2269) · build — BLOCKED: check-bundle 129.38 > 129(예산 멈춤)
- [x] REPORT

## TDD 예측 (RED 전 기록)
- localSync.test(새 파일) 전부 RED 예상: `./localSync`·`readEntry` 없음 → import 실패(파일 단위 1실패).
  - D2 왕복: 확정→조정 없음→생성(getJob 반복)→startDoc→이름 변경→saveDoc → 저장소 레코드로 새 studio 복원 → 목록·문서·프로필·잡 toEqual.
  - C4 실패 뒤 편집: IDB 실패(INFRA) → 다른 해시로 같은 expectedRevision 저장 → STALE 아님, 내 미확인 쓰기 위에 얹혀 revision 3.
  - B1 첫 실행: entry {} → persistence "local", 첫 쓰기가 v2 저장소 생성(브라우저 실측).
  - 저장됨 = 커밋 뒤: 커밋 지연 중 saveDoc 미settle.
  - 멱등 재생 실패 → 재시도: 같은 인자 재호출 → 미확인 재제출로 저장.
  - 복제 실패: INFRA, 문구에 "브라우저 저장소에 접근하지 못했습니다" 없음, 재호출도 INFRA(거짓 저장됨 0).
  - 검증 1:1: 잡 state↔후보 불일치·계열 번호 건너뜀·프로젝트 이름 위반 → 저장 INFRA reject, 레코드 덮기 0.
- entryRead.test(추가): readEntry — IDB 없음 → undefined(memory) · 저장소 없음 → {} · 버전 불일치 → undefined · ok → 상태·문서.
- saveStatusText.test(추가): "local" → "이 브라우저에 저장됨"; useAutosaveScheduler needsUnloadGuard local = server 조건.
- 번들 예측: /studio 진입 128.51 → 128.85~129.00(E0 안1-min − 이미지 0.15 + 머리·쓰기 배선). /projects·/compare·/profile +0.4~0.5, 125 이내.

## 로그

- 번들: 129.87 → 129.52(진입 toInfra 제거) → 129.46 → 129.38. 상한 129.15 초과로 멈춤(②미적용).

## BRIEF-F 마감
- [x] F1 Ego Lite 새로고침 생존 실측(편집 유지·/projects 유지·v1→v2 ✓, 스냅샷 목록 0개 ✗=P2② 재현) · 정리 완료
- [x] F2 감량 1회(진입 봉투 확인 인라인 129.38→129.33, `ab73c67`) + 예산 적용 130·기준선 129.33(`b801ab3`) · build exit 0
- [x] F3 Codex r1 P2 ①(연속 실패 재시도 STALE) ②(직접 진입 listSnapshots) TDD — RED 예측 일치 · `cc6a5a9` · 기준선 129.35 `41f65f9`
- [x] F4 스냅샷 목록 Ego Lite 재확인 1회 — 새로고침 뒤 목록 유지 ✓ · 정리 완료
- [x] F5 게이트(typecheck 0·lint 0·build 0·vitest 2272 0) + REPORT 마감(BRIEF-F)

### F3 TDD 예측 (RED 전 기록)
- ① localSync.test "A 실패 → B 실패 → B 재시도": 지금은 B 재시도가 `STALE_DOC`로 reject(멱등 키가 보정 revision `2|B`로 기록, 재시도 키 `1|B`) → 단언 `resolves revision = doc.revision + 2`에서 RED 1건. 수정 = 멱등 키를 요청 원래 revision으로(`${requested}|hash`).
- ② localSync.test "스냅샷 있는 프로젝트 새로고침 → 쓰기 전 listSnapshots": 진입 문서 경로 `[]` ≠ 1개 → RED 1건. 같은 테스트 안 비진입(/projects → 앱 안 이동) 경로도 `[]`. 수정 = 진입 레코드 스냅샷 반환 · 비진입은 getDoc처럼 시드 대기.
- 번들 예측: memoryProjectRepository +0.02~0.05 → /studio 129.35~129.38(상한 129.60 이내, 기준선 갱신 필요 가능).

## Codex r2 수정 (마지막 라운드)
- [x] ①[P1] 새로고침 뒤 새 보드 확정이 이전 확정 멱등 재생 — 로컬 영속 세션마다 새 보드 id(멱등 네임스페이스)
- [x] ②[P2] 스냅샷 복원 IDB 실패 뒤 재시도 STALE_DOC — 복원 멱등 기록(저장 경로와 같은 방식) → flush 재제출
- [x] ③[P2] localSync 동적 import → retryableImport
- [x] 번들 실측(상한 129.60) · 필요 시 기준선 커밋 — 129.41 · `f73af1a`
- [x] 게이트(typecheck·lint·build·vitest 1회 2275) + REPORT "Codex r2 수정" 절 커밋

### r2 TDD 예측 (RED 전 기록)
- ① localSync.test "ref-a 확정 → 새로고침 → ref-b 확정": 새 보드 id `board-current`·revision 2가 이전과 같아 replayOf가 profile-1 재생 → `expected 'profile-1' to be 'profile-2'` RED 1건.
- ② localSync.test "스냅샷 복원 IDB 실패 → 재시도": 메모리 revision이 이미 올라 재시도가 `STALE_DOC`로 reject → RED 1건(await에서 reject).
- ③ chunkRetryWiring.test "localSync도 retryableImport": 싼 로더 중 localSync 모듈 0개 → `expected length 1, got 0` RED 1건.
- 번들 예측: deferredStudio(진입) 세션 보드 id +0.02~0.05 → /studio 129.37~129.40(상한 129.60 이내). memoryDocBook은 조작 뒤 청크라 진입 영향 0 예상.
- RED 3건 예측 일치(①`expected 'profile-1' to be 'profile-2'` ②`STALE_DOC: revision 2 ≠ 3` ③`expected [] to have a length of 1`) · RED 커밋 없음 · Red-Green: 수정 3파일만 되돌리면 3 failed / 복원 15 passed.
- 번들 실측 /studio 129.41(예측 범위 129.37~129.40 대비 +0.01) — 상한 129.60 이내 → 기준선 갱신.
