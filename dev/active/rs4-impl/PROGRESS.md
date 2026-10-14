# RS4-IMPL — SPEC-4 r0.3a CP1~3 구현 PROGRESS

브랜치 `k002bill2/rs4-impl` (rs23-fix 59554f2 + main e3e22520 병합 bd95ccf→amend) · 사용자 "CP1~3 구현 착수"(2026-10-15) · CP4 제외(예산 배분 전)
기준선: 305 files / 2777 tests (npm test -- --run, 착수 전)

- [x] CP1 — pendingWrites(기억·토큰/epoch·guarding·beforeunload·폐기) · create 가드 · confirmDoc 계약(IMAGES_MISSING · 진행 중 대기 뒤 IDB keys 판정)
- [ ] CP2 — 프로필 판정표(create F/R · restart origin · PendingRecord · C-E4~6/R-E6 · 저장 확인)
- [ ] CP3 — /projects 행(P-U1~5 · 다시 시도/저장 확인 · 버리고 새로고침 확인)
- [ ] 게이트 4종 + 정규화 예산(멈춤 128.53/131.51) + Codex review
- [ ] REPORT · 커밋(push 0)

## 설계와 다르게 한 곳
- confirmDoc 본문 위치: SPEC 3.5는 "memoryDocBook 본문 + localSync confirm 옵션"이었으나, 구현은 `LocalSync.confirm` 별도 메서드 + DocBook `confirm` 위임(진입 청크엔 `(await bookOf()).confirm(p, maps.get(p))` 1줄). 이미지 판정은 SPEC의 `stored` 대신 **진행 중·실패 기록을 `queue.retry`로 끝낸 뒤 IDB `keys("images")`를 직접 읽어** 판정(S-3 지연 문제 회피).
- memory 모드 confirmDoc: NOT_FOUND 판정 없이 즉시 resolve(진입 바이트 최소 · memory 모드는 미확인이 생기지 않음). local 모드 NOT_FOUND는 localSync.confirm이 던진다.
- 예산(CP1 · 정규화): 첫 구현 /studio 128.53 · 복원 131.52(초과) → 감량 1회(본문을 DocBook으로) → 128.53 · 131.51 = 멈춤선과 같음(여유 0). CP2·3는 /studio 진입 closure 변경 0이어야 한다.
