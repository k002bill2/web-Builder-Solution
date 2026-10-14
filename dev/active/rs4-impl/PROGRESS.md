# RS4-IMPL — SPEC-4 r0.3a CP1~3 구현 PROGRESS

브랜치 `k002bill2/rs4-impl` (rs23-fix 59554f2 + main e3e22520 병합 bd95ccf→amend) · 사용자 "CP1~3 구현 착수"(2026-10-15) · CP4 제외(예산 배분 전)
기준선: 305 files / 2777 tests (npm test -- --run, 착수 전)

- [x] CP1 — pendingWrites(기억·토큰/epoch·guarding·beforeunload·폐기) · create 가드 · confirmDoc 계약(IMAGES_MISSING · 진행 중 대기 뒤 IDB keys 판정)
- [x] CP2 — 프로필 판정표(create F/R · restart origin · PendingRecord · C-E4~6/R-E6 · 저장 확인)
- [ ] CP3 — /projects 행(P-U1~5 · 다시 시도/저장 확인 · 버리고 새로고침 확인)
- [ ] 게이트 4종 + 정규화 예산(멈춤 128.53/131.51) + Codex review
- [ ] REPORT · 커밋(push 0)

## 설계와 다르게 한 곳
- CP2 TDD 순서: 판정 로직을 먼저 쓰고 단위 테스트를 뒤에 썼다(RED 선행 아님). 대신 변이 검사로 Red를 확인 — F1(재시도 문서 있음 → 해제로 바꿈) 1 실패 · F2(DOC_EXISTS → 판정·이동으로 바꿈) 2 실패.
- memory 영속에서도 기억을 만든다(SPEC 3.5 "UI는 memory 모드에서 기억을 만들지 않는다"와 다름) — 기존 SPEC r2 R-E4 테스트(memory 모드 응답 실패 주입)가 그 동작을 고정한다. 폐기 버튼만 local 영속에서 보인다.
- restart 판정 순서: 커밋 확인(요청 쌍 + revision+1)을 STALE_DOC/UNKNOWN_VARIANT 코드 판정보다 먼저 한다(기존 RS-AC-07c 응답 단계 주입 테스트 — 모양만으로 커밋 전·뒤를 가를 수 없다). SPEC 6절 3-2 "코드 분리를 커밋 확인 앞에서"와 순서가 다르지만, 양성이 아니면 코드 분리가 그대로 적용된다.
- 기존 테스트 변경: ProfileRestart "R-E5 … 다시 시도 음성 → 기억 삭제" → SPEC-4 RS4-D5대로 R-E6 '저장 확인' 경유로 갱신 · TAB_REASON에 cleared 추가 · "재생 뒤 getDoc 실패"는 origin 읽기(getDoc 1회 = fail 훅 2번)만큼 순번 조정.
- PendingRecord에는 mode가 없다 — restart로 생긴 R-E6도 프로필 재진입 시 create Callout 문형(C-E6)으로 다시 보인다(대화상자 record 모드는 그 대화상자 안에서만).
- confirmDoc 본문 위치: SPEC 3.5는 "memoryDocBook 본문 + localSync confirm 옵션"이었으나, 구현은 `LocalSync.confirm` 별도 메서드 + DocBook `confirm` 위임(진입 청크엔 `(await bookOf()).confirm(p, maps.get(p))` 1줄). 이미지 판정은 SPEC의 `stored` 대신 **진행 중·실패 기록을 `queue.retry`로 끝낸 뒤 IDB `keys("images")`를 직접 읽어** 판정(S-3 지연 문제 회피).
- memory 모드 confirmDoc: NOT_FOUND 판정 없이 즉시 resolve(진입 바이트 최소 · memory 모드는 미확인이 생기지 않음). local 모드 NOT_FOUND는 localSync.confirm이 던진다.
- 예산(CP1 · 정규화): 첫 구현 /studio 128.53 · 복원 131.52(초과) → 감량 1회(본문을 DocBook으로) → 128.53 · 131.51 = 멈춤선과 같음(여유 0). CP2·3는 /studio 진입 closure 변경 0이어야 한다.
