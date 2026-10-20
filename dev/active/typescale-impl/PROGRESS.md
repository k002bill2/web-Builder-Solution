# TYPESCALE-IMPL PROGRESS

정본: docs/design/m2b/TYPESCALE-SPEC.md r1 ★B · base 8d65fa9e · 브랜치 k002bill2/typescale-impl

- [x] T0 측정·고정 테스트(현행 문서 해시·docKitTokens 기준선)
- [ ] T1 PageDoc.typeScale? · validatePageDoc · CandidatePlan.typeScale? → createDocFromCandidate
- [ ] T2 저장 경로(StartDocInput.typeScale · memoryDocBook · restart · 가져오기 왕복)
- [ ] T3 docKitTokens(typeScale?) · useMemo 의존성 · staticHtml/reactZip · compareKitTokens · 예산 실측
- [ ] T4 문서 정정 · BACKLOG B-M2B-05 닫힘 · B-M2B-05b 등록 · Ego TS-AC-13 1회
- [ ] Codex adversarial 1회 · 반영 1회
- [ ] REPORT 결론 · untracked 0

## 단계 기록 (게이트·예산)
- T0: src/test/typeScaleBaseline.test.ts(해시 fnv1a64:5acdb47336801ddd · docKitTokens JSON 고정). typecheck·lint 0 · test 381 files/3423 passed(--maxWorkers=4) · build exit 0. 예산 /studio 128.76 · 복원 131.76(기준선 131.75, 여유 +0.02) · 렌더 JS 84.30. build는 테스트 추가 전 실행 — 테스트 파일은 번들 밖이라 기준선으로 유효.
