# TYPESCALE-IMPL PROGRESS

정본: docs/design/m2b/TYPESCALE-SPEC.md r1 ★B · base 8d65fa9e · 브랜치 k002bill2/typescale-impl

- [x] T0 측정·고정 테스트(현행 문서 해시·docKitTokens 기준선)
- [x] T1 PageDoc.typeScale? · validatePageDoc · CandidatePlan.typeScale? → createDocFromCandidate
- [x] T2 저장 경로(StartDocInput.typeScale · memoryDocBook · restart · 가져오기 왕복)
- [x] T3 (BLOCKED: 예산 멈춤 UQ-4 — 감량 1회 뒤 복원 131.79 > 131.78. 구현은 브랜치 k002bill2/typescale-impl-t3-budget 1a2aa779) docKitTokens(typeScale?) · useMemo 의존성 · staticHtml/reactZip · compareKitTokens · 예산 실측
- [ ] T4 BLOCKED: T3 미병합(UQ-4 대기) — 문서 정정·B-M2B-05 닫힘·Ego TS-AC-13 보류. 문서 정정 · BACKLOG B-M2B-05 닫힘 · B-M2B-05b 등록 · Ego TS-AC-13 1회
- [x] Codex adversarial 1회(approve · 지적 0) · 반영 0(지적 없음)
- [x] REPORT 결론 · untracked 0

## 단계 기록 (게이트·예산)
- T0: src/test/typeScaleBaseline.test.ts(해시 fnv1a64:5acdb47336801ddd · docKitTokens JSON 고정). typecheck·lint 0 · test 381 files/3423 passed(--maxWorkers=4) · build exit 0. 예산 /studio 128.76 · 복원 131.76(기준선 131.75, 여유 +0.02) · 렌더 JS 84.30. build는 테스트 추가 전 실행 — 테스트 파일은 번들 밖이라 기준선으로 유효.
- T1: pageDoc.typeScale? · validatePageDoc 선택 키(유한 1~2)·재구성 보존 · CandidatePlan.typeScale? 기록. 테스트 TS-AC-03·14(typeScaleRollback: checkSaveDoc·IDB 복원·재저장·checkFile·rekeyDoc). Red-Green: 재구성 줄 제거 시 7 실패 → 복원 63 통과. typecheck·lint 0 · test 382/3445 passed · build 0. 예산 /studio 128.76 · 복원 131.76 · 렌더 JS 84.38(+0.08, 멈춤 89.70 안). ExportDoc = 필드 골라 담기(siteJson exportDoc) → 키 변경 불필요.
- T2: StartDocInput.typeScale? · memoryDocBook start(create·restart 공통)에서 plan.axes.typeScale(숫자일 때만) 전달. 테스트 startDocTypeScale(TS-AC-01 A·B·C · TS-AC-02 restart·스냅샷 옛 값 · 어댑터). 가져오기 왕복 = T1 typeScaleRollback(checkFile·rekeyDoc). Red: 전달 제거 시 4 실패. typecheck·lint 0 · test 383/3451 passed · build 0. 예산 128.76 · 131.76 · 렌더 84.38.
- T3(t3 브랜치): docKitTokens(…, typeScale?) · StudioLayout useMemo deps(doc/shown.typeScale) · staticHtml·reactZip · compareKitTokens 열별 · 캡션·(구조안) 삭제 · 감량 1회(docPalette 중복 조회 제거). typecheck·lint 0 · test 384/3459 · build exit 1(예산만): /studio 128.79 · 복원 131.79 · 렌더 84.38. 분해: StudioLayout 빼면 128.78·131.78(미채택).
- 마감: 메인 브랜치 typecheck·lint 0 · test 383/3452 · build 0(128.76 · 131.76 · 84.38). Codex approve. 서브에이전트: 분할 안 함(조사 범위가 grep 몇 번 — 재적재 비용 > 이득).
