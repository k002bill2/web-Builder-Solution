# P1D-SPEC REPORT (Designer)

## 결과
- 산출물: `docs/design/persistence/P1D-SPEC.md` · `docs/design/persistence/P1D-MQ.md` · `dev/active/p1d-spec/PROGRESS.md`.
- 커밋: `064cdff` BRIEF P0 · `860f713` SPEC·MQ 초안 · (이 커밋) MQ-D2 정리 + REPORT.
- 앱 코드·테스트·lock·CLAUDE.md·`docs/decisions/` 수정 0 · 서브에이전트 0 · Codex 0 · push/merge/삭제 0.

## 핵심 결정(SPEC 안에서 확정 — ADR 범위 안 세부)
1. **id 겹침이 재발급보다 심각** [L1]: `profile-${series.size+1}`·`project-${length+1}`·`job-${jobCount+1}`·`snapshot-${length+1}` — 삭제 뒤 살아 있는 id와 겹쳐 확정 throw·프로젝트/잡 덮어쓰기. 브리프 목록에 **job 추가**(`memoryGenerationRepository.ts:92`), export는 탭 메모리라 제외, image는 프로젝트 접두라 카운터 불필요.
2. **카운터 = "지운 최대 번호" 묘비 상한** — 다음 id = max(현존 최대, seq) + 1. 삭제 때만 올리므로 발급 경로 쓰기 0 · `studioStore` 새 tx 메서드 0. 위치 = 상태 레코드 `seq`(project·profile·job) + 문서 레코드 `snapshotSeq`. **`meta` 새 키 0** — 진입이 meta를 읽지 않고 동기 transact에서 id를 정하므로(ADR 3절 문구는 "바뀌는 문서" 행). 이행 = 없으면 0 → 현존 최대 + 1.
3. **계열 ↔ 프로젝트 1:1, 공유 없음** [L1 `putProject` 호출처 2곳] → 프로젝트 삭제 = 계열·잡·확정 기록 함께.
4. **스냅샷은 `docs/<id>` 레코드 안** [L1] — 자동 정리·수동 삭제 = 문서 레코드 flush 1회, 이미지 정리는 기존 `imageOps` 참조 집합이 같은 트랜잭션에서 처리(새 코드 0).
5. **다른 탭 차단 = "다른 탭이 쓰기 탭"**(전역 잠금 1개) — 새 잠금·새 메시지 0, 기존 `saved`·세대 확인 재사용.
6. 프로젝트 삭제 = IDB 직접 + 새로고침(MQ-D1 ★A) — 진입 0, 대신 보드·보관함 비워짐을 캡션으로 고지.

## MQ (영환님/Jarvis 회신 필요)
- **MQ-D1** 삭제 뒤 갱신 방식 — ★A 새로고침(진입 0) / B 메모리 삭제(예산 재상신 가능성).
- **MQ-D2** 조건부 — L1 실측이 관문(`/studio` ≤129.65 · 복원 ≤132.68 · `/profile` ≤100)을 넘을 때만 B(예산 개정).

## 검증
- 사실 확인은 grep·읽기 [L1]: `studioStore.ts:106` · `memoryBoardConfirm.ts:141-142` · `memoryGenerationRepository.ts:92` · `memoryDocBook.ts:112·205·354` · `localSync.ts`(write·stateOps) · `imageOps.ts:29` · `imageRecord.ts:4` · `entryRead.ts` · `check-bundle-size.mjs:33·50·111` · `SnapshotDialog.tsx` · `ProjectRow.tsx` · `ClearDataDialog.tsx` · `clearBrowserData.ts`.
- 바뀌는 문서 행 번호 grep 확인: 2a-05 SPEC 17·19·22·117·315·341·506·555~556 · ADR-007 52 · P1C-SPEC 118 · THREATS 21.
- **Ego Lite 미실행(선택 항목)** — 스냅샷 대화상자·`/projects` 줄 행동 위치는 코드(`SnapshotDialog.tsx`·`ProjectRow.tsx`)로 확인해 브라우저 실측이 결론을 바꾸지 않음 · 시간 예산 우선. 그래서 서버·TaskSpace·IDB 정리 대상도 없음.
- 번들 KB는 추정하지 않음 — L1 실측 관문으로 넘김.

## 운영 메모
- SPEC 초안 커밋이 브리프의 "22턴 전"을 1턴가량 넘겼을 수 있음(23턴 무렵 커밋 `860f713`).
- [확인 필요] 구현 레인: 이미지 localId 발급 방식 1회 grep(3절 image 행) · 중첩 `dialog` Esc 동작 실측(AC-D06).
