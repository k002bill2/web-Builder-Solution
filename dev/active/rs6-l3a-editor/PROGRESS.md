# RS6-L3a PROGRESS — 편집기 배선 전반부

브랜치 `k002bill2/rs6-l3-editor` · base `0323c4a0` · 착수 2026-10-17

## 체크리스트
- [x] 착수: BRIEF·PROGRESS 커밋 (e0040576)
- [x] 조사: I6 11절 깨질 테스트 목록·예상 delta (읽기 전용 서브에이전트 — 완료, 아래 기록)
- [x] CP0: restoreSnapshot·resolveConflict·startDoc(restart) revision 규칙 (RED→GREEN)
- [ ] CP1: change마다 core.edit · F9 · U6 · acquire/release · watchSaving 결선 (RED→GREEN)
- [ ] CP2: core.save 경유 · saved 뒤 DocBook · 실패 시 revision 0 · seed=view() · latest 정리 (RED→GREEN)
- [ ] reject 매핑 (L2 QA 4절 catch 1~3)
- [ ] CP마다 예산 측정 (정규화·raw)
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
