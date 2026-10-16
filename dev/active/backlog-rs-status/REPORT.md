# BACKLOG-RS-STATUS REPORT — 저장·재시작 계열 백로그 실상태 판정

작성 2026-10-17 · 브랜치 `k002bill2/backlog-rs-status` · base `c7a7a2a8` · 앱 코드 수정 0 · 실브라우저 재현 안 함(정적·테스트 근거)

## 결론
- 닫힘 1(B-RS-02) · 부분 닫힘 2(B-RS-03 · B-ER-01) · 이미 닫힘 재확인 1(B-RS-01) · 대상 제외 1(B-M2B-05) · 새 행 1(B-RS-04 = RS4-R1).
- 남은 저장 결함의 중심은 **RS4 CP4(편집기 인계) 예산 결정**과 **RS5 코어 제품 미통합**이다.

## 판정 표

| 항목 | 판정 | 코드 근거 | 테스트 근거 | 처리 커밋 | BACKLOG 표기 |
|---|---|---|---|---|---|
| B-RS-01 이탈 저장 미보장 | **닫힘(재확인)** — 앱 안 링크 이탈만. 뒤로가기·탭 닫기 범위 밖 | `features/studio/useDocSave.ts:142-147` `leave()` = `retry()` 뒤 `flushed()` 대기 · `StudioLayout.tsx:128-147` | `StudioLeave.test.tsx` 14건(BACKLOG 13건 + RESUME-1 `33e0c0cb` 1건) — `:99` 저장 중 추가 편집 → 마지막 편집 반영 뒤 이동 · `:127` 저장 실패 → 보류 | `4d878bed`·`5d6ff9e6`·`7db2c0b2`·`33e0c0cb` (모두 HEAD 조상) | 변경 없음(기존 ✅) |
| B-RS-02 잠금 없는 탭 create 갈라짐 | **닫힘** | `data/memoryProjectRepository.ts:122` — `mode==="restart" \|\| !docs.docOf(projectId)`이면 커밋 **전** `guardWrite()` · `persistence/localSync.ts:213-217` · 잠금 탭 커밋 뒤 flush 실패는 `features/pending/pendingWrites.ts` 기억 → 재생·`confirmDoc` | `restartLock.test.ts:162` "다른 탭 잠금 + 문서 없는 프로젝트 create → READ_ONLY_TAB · 메모리 문서 0 · IDB 쓰기 0 …"(RS4-AC-15) · `restartFlow.test.ts:33,62,94` (AC-01·02) · `confirmDoc.test.ts:104,145` | CP1 `46c3a9e1` · CP2 `f4a7c504` · `a7fde53f` (PR #6 `d09f0cd9`) | ✅ 닫힘 |
| B-RS-03 미확인 restart → 편집기 인계 없음 | **부분 닫힘** — `/projects` 경로 닫힘, 편집기 인계(CP4) 열림 | CP3 링크 게이트: 미확인 행 "편집기 열기" 없음, 재생/`confirmDoc` 성공 뒤 복원(`pages/ProjectsPage.tsx:213` `pendingOf` · `:218,247` 행 분기 · `features/pending/*`) · `features/studio`·`components/studio` 비테스트 코드에 `pendingOf`·`confirmDoc`·`PendingDraft` 0건(메인 grep 재확인, L1) = 편집기 인계 없음 | `ProjectsPending.test.tsx:50` "PendingStart(restart) → … '편집기 열기' 0 …" · `:63` 재생 성공 → 링크 복원 · `:94` PendingRecord → confirmDoc · `ProjectsPendingGate.test.tsx:45` · CP4 테스트(RS4-AC-11·18~23) 없음 | CP3 `1e18e730` · `a7fde53f` · `2135c73a`(PR #9) · CP4 구현 없음(`8b1fbd17` CP0 관문 실패) | 🔶 부분 닫힘 · 남은 것 → B-RS-04 |
| B-ER-01 "새로 시작" UI | **부분 닫힘** — BACKLOG 행이 실제보다 낡음("미병합"·"MQ-S7 재상신 대기") | `features/profile/RestartDialog.tsx` · `restartFlow.ts` · `CandidatesSection.tsx` | `ProfileRestart.test.tsx` (RS-AC-01~07·09·11·12·17·18) · `restartLock.test.ts` · `restartRealRepo.test.ts` | 병합 `572fdef7`(`5aeb045`·`7e8ace8` 조상) · RS-AC-13 = `docs/design/restart/MQ.md:92` Jarvis 10-11 +0.09 수용 | 🔶 부분 닫힘 · 남은 것: RS-AC-08d IDB 쪽 미단언 |
| B-M2B-05 typeScale 축 전달 | **대상 제외** — "저장 검증" 낱말 히트일 뿐 생성 표시 계열. 열림 그대로 | `typeScale`은 `domain/generation.ts:24` · 표시 문자열(`composeCandidates.ts:207,236,273`)뿐, 문서 생성 `composeSections`(`:190-194`) 미사용 | 해당 없음 | 없음 | 변경 없음 |
| RS4-R1 history 재진입 거짓 idle | **열림-CP4 예산 의존**(MQ-4-1 재상신/판정선 상향 — 영환님·Jarvis 결정) | 편집기 인계 코드 없음(위 B-RS-03) | 없음 | 없음 · CP4 보류 근거 `rs4-cp4/REPORT.md`(CP0 128.66 > 128.53), `rs4-cp4-measure/REPORT-M2.md:1,28`(조합+a도 정규화 +0.80·raw +0.70, 하한) | **B-RS-04 새 행** |

### 표적 테스트 (fresh 실행)
`cd app && npx vitest run` 19파일(StudioLeave · autoSnapshotRetention · confirmDoc · createLock · restartLock · restartRealRepo · pendingWrites · restartFlow · ProfileCandidates · ProfileRestart · ProfileRestartOtherTab · ProjectsDelete · ProjectsExport · ProjectsImport · ProjectsPage · ProjectsPending · ProjectsPendingGate · pendingImportGuard · tryLockGuard) → **Tests 178 passed (178)**, exit 0. `npm ci` 뒤 lock 변경 0(`git status` 깨끗).
- 주의: 묶음 GREEN이다. 항목별 대응 테스트 이름은 위 표에 따로 적었다.

## RS5 연결 계획 레인에 넘길 "남은 저장 결함 목록"
1. **RS4-R1 history 재진입 거짓 idle** (B-RS-04) — CP4 예산 대기 · `SPEC-4.md:317` · `REPORT-M2.md:1`
2. **RS4-R8 dirty·offline·커밋 전 failed에서 POP·주소 입력 = 편집 소실·경고 없음** — 실제 데이터 손실 경로, 최우선 · `SPEC-4.md:323` · `save-on-leave/REPORT.md:90`(BrowserRouter라 `useBlocker` 불가)
3. **RS4-R2 편집기 저장 성공 뒤에도 기억 남음 → 다음 화면 1클릭 확인** (거짓 아님) · `SPEC-4.md:318,175`
4. **RS4-B1(RS4-R10 계열) 기존 `startDoc` 재생(편집기 밖)이 맵 없이 이미지 없는 문서 커밋 가능** — `confirmDoc`은 IMAGES_MISSING fail-closed로 막힘, `startDoc` 재생 쪽은 미처리(L2 — SPEC 기술, 코드 미확인) · `SPEC-4.md:200,248` · BACKLOG 행 없음(이번엔 추가 안 함 — 브리프 범위는 RS4-R1 1행)
5. **RS5 코어 제품 미통합** (DocBook·localSync·스케줄러·React, G1·G2·G7·G8) · `save-core-final-qa/REPORT.md:99` · `app/src`에 `saveCore`·`PendingDraft` 0건
6. **CE-3a/BD-1 어댑터 2개 → 같은 세대 2회 saved(커밋 소실, 실제 IDB 재현)** — Jarvis 결정 대기 · `save-core-final-qa/REPORT.md:61-62,100`
7. **LV-1·LV-2 타임아웃 없음(무기한 대기·계속 거절)** · `save-core-final-qa/REPORT.md:51-52,101`
8. **OBS-1(stale 뒤 재열기 외 회복 없음) · CE-4(동시 confirm write 2회) · OBS-2/BD-2(이미지 확인 프로젝트 구분 없음) · 바이트 비교 없음** · `save-core-final-qa/REPORT.md:63,102-103`
9. **탭 닫기·새로고침은 저장 대기 없이 경고만**(RS4-R3·R4·R5 브라우저 한계) · `save-on-leave/REPORT.md:89` · `SPEC-4.md:319-321`
10. **STALE_TAB·CLEARED_TAB 이동 보류(새로고침만 출구) · 오프라인 무기한 보류 · 섹션 연산 청크 대기 중 편집 범위 밖** · `save-on-leave/REPORT.md:92,93,95`
11. **RS-AC-08d IDB 쪽 미단언** (B-ER-01 잔여) · `BACKLOG.md` B-ER-01 행
12. **B-RS-01 개정 15 실측 몫 +0.02·+0.03 초과 결정 대기** · BACKLOG B-RS-01 행

## 서브에이전트 (읽기 전용 2개, 결과 통합)
- A(B-RS-01~03): 판정·파일:행·커밋 반환. 메인이 `memoryProjectRepository.ts:122`·`restartLock.test.ts:162`·커밋 7개 조상 여부를 재확인 → 채택.
- B(B-ER-01·B-M2B-05·RS4-R1·RS5·save-on-leave): 메인이 `572fdef7` 조상·`MQ.md:92`·`save-core-final-qa/REPORT.md:99-103`·`save-on-leave/REPORT.md:87-95` 재확인 → 채택.

## 하지 않은 것
- Codex 검증: 브리프 금지(전역 규칙 "검증은 무조건"과 충돌 — 브리프 지시로 생략) · 실브라우저: 브리프 범위 밖 · push: 금지.

## 사실 / 추정 / 미확인
- 사실(L1): 커밋 조상 여부, 위 파일:행 내용, 표적 테스트 178/178.
- 추정(L2): B-RS-02 "닫힘"은 잠금 없는 탭 갈라짐 제거 기준. 잠금 탭 커밋 뒤 flush 실패는 갈라짐 자체는 생기되 기억·재생으로 추적·회복(SPEC-4 설계대로) — 브라우저 한계 RS4-R3~R5는 남음.
- 미확인: 실브라우저 동작(브리프상 제외).
