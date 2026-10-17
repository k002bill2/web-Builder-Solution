# RS6-L3a PROGRESS — 편집기 배선 전반부

브랜치 `k002bill2/rs6-l3-editor` · base `0323c4a0` · 착수 2026-10-17

## 체크리스트
- [x] 착수: BRIEF·PROGRESS 커밋 (e0040576)
- [x] 조사: I6 11절 깨질 테스트 목록·예상 delta (읽기 전용 서브에이전트 — 완료, 아래 기록)
- [x] CP0: restoreSnapshot·resolveConflict·startDoc(restart) revision 규칙 (RED→GREEN)
- [x] CP1: change마다 core.edit · F9 · U6 · acquire/release · watchSaving 결선 (RED→GREEN)
- [x] CP2: core.save 경유 · saved 뒤 DocBook · 실패 시 revision 0 · seed=view() · latest 정리 (RED→GREEN)
- [x] reject 매핑 (L2 QA 4절 catch 1~3) — 이 레인 호출처 2곳(useDocSave save · CP0 core.link) 가드 테스트
- [x] CP마다 예산 측정 (정규화·raw) — CP0 128.67 · CP1+CP2 129.04 (목표 +0.25 초과 · 상한 안)
- [ ] Ego Lite 1회
- [ ] 마감 게이트 typecheck·lint·test·build
- [ ] REPORT.md

## 기록

### CP0 설계 (2026-10-17)
- 경로 = BRIEF "revision 기준을 코어와 맞춤"(MQ-6-5 A의 replace 단독은 `confirmed`·`savedMark`를 안 바꿔 다음 save가 같은 revision을 쓴다 — 단독으로는 CP0 미해결).
- 규칙: 코어가 있는 프로젝트의 DocBook revision 쓰기(restoreSnapshot·resolveConflict·startDoc) = ① 코어 chain 뒤(idle) ② 쓰기 전 판정(동기, commit 콜백 안): 코어 save 진행 중 → STALE_DOC 쓰기 0 · 미저장 편집(dirty) → STALE_DOC 쓰기 0(충돌 해결은 예외 — 내 초안이 그 입력) ③ 같은 동기 구간에서 코어 기준 맞춤(`rebase`): doc·confirmed(hash·revision)·savedMark·epoch+1·committed 바인딩. mine 뒤 새 편집이면 초안 유지(dirty).
- 맞춤을 flush 뒤가 아니라 쓰기 시점에 하는 이유: flush 창에서 코어 save가 시작되면 옛 기준(R+1)으로 같은 revision을 쓴다. 쓰기 시점 맞춤이면 그 save는 R+2이고 writeQueue(탭 직렬)가 flush 뒤에 싣는다. 대가: flush 창의 confirm·discard는 IDB 재읽기 불일치로 실패(거짓 성공 아님 — 안전 방향) → REPORT note.
- 본문 = 조작 뒤 청크(`coreIo.ts` 함수 export · DocBook이 호출). 진입(`memoryProjectRepository.ts`)은 코어 state 전달만.
- RED 예측: 새 파일 `save/saveCore.rebase.test.ts` 7건(복원·mine·theirs·restart 재진입·dirty 거절·진행 중 save 뒤 STALE·memory 모드 view) 전부 FAIL. 깨질 기존 테스트 0(UI가 아직 core()를 부르지 않음 · DocBook 인자 추가는 선택).
- CP0 RED: 8건 FAIL(예측 7 — mine 뒤 새 편집 1건 추가) `logs/cp0-red.log` · GREEN 8/8 · 전체 327 파일 / 2932 통과 · 깨진 기존 0(예측 0).
- CP0 예산: 정규화 /studio 128.67(+0.04) · 복원 131.65 · raw 129.98 / 133.02 — 기준선 갱신(개정 17 배분 RS6-L3a CP0).

### 서브에이전트(읽기 전용 · I6 11절 조사) 결과 요지
- mock 저장소(`core` 없음) 테스트가 다수: StudioLeave 14 · StudioLayout · SaveStatus:115 · useDocSave(mock 부분) · useDocSaveWrite · **11절 밖** ImageUndo 8 · StudioLayoutImages 7 · SnapshotImages 3 · StudioPage 9. → `useDocSave`는 **`repository.core`가 없으면 기존 saveDoc 경로 유지(폴백)**. 11절 밖 깨짐 0을 지키는 유일한 길.
- memory 모드 코어 save = `failed{not-persistent}` → 스케줄러 성공으로 매핑해야 함 · `savedRevision`은 memory에서 confirmed가 안 바뀜 → DocBook revision(`view().confirmed`가 아닌 실제 저장 revision) 필요.
- `latest` 제거는 기존 단언 2건(useDocSave.test:212 · StudioLayout.test:157 "(r7)")을 지움 → 약화 금지 규칙과 충돌. L3a는 STALE 동봉 문서를 유지하는 방향으로 정리(아래 CP2).
- `saveCoreGuard.test.ts:85`: `coreIo` 값 import는 `memoryDocBook.ts`만 — useDocSave는 `core.link`만.

### CP1 RED (예측 → 실측)
- 새 테스트: `useDocSaveCore.test.tsx` 3건(core.edit 1회 · F9 · StrictMode 토큰) + `useAutosaveScheduler.watch.test.tsx` 2건(slow/hang 표지 · 언마운트 뒤 타이머 0). 예측 FAIL 4 + 가드 1(언마운트 타이머 0은 결선 전에도 통과 — 결선 뒤 stop 누락을 잡는 회귀 가드).
- 실측: 4 FAIL · 1 PASS(가드) — `logs/cp1-red.txt`. 깨질 기존 예측: 0(mock 저장소는 core 없음 → 기존 경로 유지 · hook.test:169는 표지만 붙어 글자 불변 예상).

### CP1·CP2 GREEN (한 커밋 — 사유)
- CP1만 넣으면 편집마다 코어가 dirty인데 저장은 아직 saveDoc → 코어가 영원히 dirty → CP0 가드가 복원을 STALE로 막아 `snapshotRevision.test.tsx` 1건이 깨진다(실측). CP2(저장 = core.save)와 묶어야 GREEN — RED 로그는 CP별(`logs/cp1-red.txt`·`logs/cp2-red.txt`).
- CP1 실측: 감시 결선이 `liveness.ts`를 진입·DocBook 청크 공유 모듈로 만들어 별도 청크 생성 → 정규화 129.03(+0.36). 감량 1회: `DISCARD_GIVE_UP_MS`를 `coreIo.ts`로 옮김(liveness.discard.test import 경로만 변경) → 128.90.
- CP2 RED 5 FAIL(예측 5) · GREEN 후 + reject 가드 2건. StrictMode: 이 환경은 렌더 2회·effect 1회(실측) → effect 재마운트는 `Activity` 숨김→보임으로 같은 동기 구간 재현. deferred release를 즉시 release로 바꾸면 FAIL(Red-Green 확인).
- 전체: 330 파일 / 2944 통과(base 2924 + CP0 9 + CP1 5 + CP2 6). 깨진 기존 테스트 0 · 바뀐 기존 단언 0(import 경로 1줄만).
- 예산: 정규화 /studio 129.04 · 복원 132.02 · raw 130.39 · 133.43 → raw 첫 130 초과 → `eagerBudgetKb` 130.5(개정 17 결정 2). L3a 목표(+0.25) 초과 +0.41 · 상한(129.13) 안 → 멈춤 아님, REPORT에 수치.
- `latest`: 코어 경로는 설정 안 함(STALE 동봉 문서 없음 → undefined). 상태 제거는 기존 단언 2건(useDocSave.test:212 · StudioLayout.test:157) 삭제가 필요해 약화 금지와 충돌 → 코어 없는 폴백 경로에만 남김 · 제거는 L3b(충돌 UI).
