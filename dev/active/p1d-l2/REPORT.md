# P1D-L2 REPORT — 스냅샷 수동 삭제 UI + 자동 스냅샷 20개 보존

base `557fe35` · 브랜치 `k002bill2/p1d-l2` · 구현 커밋 `45506b6` · 서브에이전트 0 · Codex 미실행(Jarvis 몫)

## 1. 설계 (구현 = `45506b6`)
- `memoryDocBook.ts` `withAuto`: 자동 스냅샷 4곳(requestExport · restoreSnapshot · resolveConflict · startDoc restart)의 append+정리를 공용 헬퍼 하나로. 최근 20개 보존, 복원 예외(복원 대상은 남김), 이행(기존 21개 이상 데이터는 다음 자동 생성 때 정리 — 열기 시 쓰기 0), 정리 시 `snapshotSeq` 상향.
- `SnapshotDialog.tsx`: 수동 줄 "{이름} 삭제" 버튼 · `DeleteConfirm`(포커스 "취소" · Esc는 자기만 닫음 · close() 먼저 · 실패 alert key) · 보관 캡션(SN-1).
- `SnapshotLayer.tsx`: `onDeleted` = 편집 알림 SN-8 + `refresh()`.
- 쓰기 파일 = BRIEF 7절 L2 행만. features/projects·components/projects·ProjectsPage·repository·studioStore·엔진·계약·docs·lock 수정 0, 새 의존성 0.

## 2. TDD
- `data/autoSnapshotRetention.test.ts`: RED 6 실패/1 통과("length 20 but got 21") → GREEN.
- `data/persistence/autoSnapshotPersist.test.ts`: RED 2 실패(`expected [] to deeply equal [delete]`) → GREEN. 첫 시도 테스트 결함(같은 이미지 슬롯 두 번 set) 수정 기록은 PROGRESS.
- `components/studio/SnapshotDelete.test.tsx`: RED 예측은 PROGRESS에 있으나 **RED 실측 출력 기록이 중단 전 세션에서 누락**됨. 현재 GREEN만 확인.
- RED 테스트 단독 커밋 0 · 단언 약화·skip 0 · amend·rebase 0.

## 3. 번들 관문 (재개 세션 build, exit 0)
| 시나리오 | 기준(멈춤) | main(L1 REPORT) | L2 표기 | L2 원본(소수 넷째) |
|---|---|---|---|---|
| `/studio` 진입 직후 자동 로드 포함 | ≤ 129.65 | 129.64 (129.643) | **129.65** | 129.651 |
| `/studio` 저장 데이터 복원 진입 | ≤ 132.68 | 132.68 (132.676) | **132.68** | 132.684 |
| `/profile` 첫 화면 | ≤ 100 | 99.87 (99.871) | **99.86** | 99.864 |
- 판정은 소수 둘째 자리 반올림 비교(`app/scripts/bundleBudget.mjs:13`) → 둘 다 경계값 그대로 통과, `npm run build` exit 0.
- 원본 값은 스크립트 사본(`/tmp/p1d-l2-raw`, format만 toFixed(4) — 저장소 스크립트 수정 0)으로 측정. 사본 실행의 exit 1은 썸네일 산출물 경로(node_modules/.thumbs) 부재 때문이며 예산 판정과 무관.
- **주의: 진입 몫이 0이 아니라 +0.008KB(gzip)**. 이 레인이 바꾼 소스 중 진입 closure에 있는 것은 없다 — `SnapshotLayer`는 `SnapshotLayerLoader`의 `lazy(() => import("./SnapshotLayer"))`, `SnapshotDialog`·`memoryDocBook`은 조작 뒤 청크. 원인 모듈 미확정(추정: 진입 청크 안 지연 청크 파일명 해시가 바뀌며 생기는 gzip 변동 — 확인 안 함). 관문 여유는 이제 /studio 0.00 · 복원 0.00.

## 4. Ego Lite 실화면 증거 (build + `vite preview --port 4337`, TaskSpace 28)
- shots(`dev/active/p1d-l2/shots/`): `1-confirm-open.png`(확인 대화상자 "스냅샷을 지울까요?" · '둘' 문구) · `2-after-delete.png`(알림 "스냅샷 '둘'를 지웠습니다" · 셋/하나 남음 · 캡션 D-S01) · `3-reload-snapshot-4.png`(새로고침 뒤 둘 없음 · 새 수동 '넷').
- evaluate 기록(재개 세션, 같은 화면에서 '셋' 줄로 재실행):
  - 확인 열림: activeElement = `BUTTON "취소"` · 열린 대화상자 ["스냅샷","스냅샷을 지울까요?"]
  - **Esc 1회**: 대화상자 ["스냅샷"](확인만 닫힘) · activeElement = `BUTTON aria-label="셋 삭제"`(그 줄 삭제)
  - 지우기: status textContent = `스냅샷 '셋'를 지웠습니다`(1건) · alert = `""` · activeElement = `BUTTON aria-label="하나 미리보기"`(다음 줄 미리보기) · 목록 ["넷","하나"]
  - IndexedDB `docs` 스토어 스냅샷 id = `snapshot-1`(하나) · `snapshot-4`(넷) → 새로고침 뒤 새 수동 = `snapshot-4` (AC-D01② E)
- 정리: `indexedDB.deleteDatabase("design-studio")` = `success`, 이후 `indexedDB.databases()` = `[]` · `taskSpace(28).finish({keep:[]})` 완료 · `listTaskSpaces()` = `[{28,"p1d-l2 snapshot delete QA",ownership:"user"},{29,"p1d-l3 프로젝트 삭제 실측",ownership:"agent"}]` (28은 finish 뒤 user 소유로 남음 · 29는 L3 공간, 무접촉) · preview PID 73837 종료 · `lsof -iTCP:4337 -sTCP:LISTEN` 0줄.
- 자동 21개 정리는 실화면 아님 — U 테스트로만(BRIEF 지시).

## 5. 게이트 (재개 세션 fresh 실행)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0 · `npx vitest --run` exit 0 (Test Files 279 passed · Tests 2436 passed)

## 6. 중단 · 재개
- 1차 세션: 턴 한도로 중단(구현 커밋 `45506b6` + shots 3장 미커밋 상태, 번들 관문·게이트·REPORT 미완).
- 재개 세션(축소): 코드 수정 0. Ego Lite 증거 보강(evaluate) → 정리 → build 번들 관문 → 게이트 → PROGRESS·REPORT·shots 커밋.

## 7. 남은 것
- Codex 리뷰(Jarvis 몫).
- 번들 진입 +0.008KB 원인 확인 여부 판단(위 3절).
