# P2-L1 PROGRESS

- [x] P0 BRIEF 커밋
- [x] 정본 읽기 (P2-SPEC 머리·2·3.2~3.4·6·7·8절, ADR-007 개정 3·4, THREATS T4)
- [ ] L1a: format.ts + checkFile ①~④ (RED 예측 → RED → GREEN) 커밋
- [ ] build 실측 (첫 구현 커밋 직후)
- [ ] L1b: ⑤ 이미지·재인코딩 · ⑥ 참조 · rekey · encode · rekeyDoc 커밋
- [ ] 게이트: typecheck · lint · build · 전체 vitest
- [ ] REPORT.md

## RED 예측
- R1 format.test.ts: `./format` 모듈 없음 → import 실패로 파일 전체 FAIL 예상.
- R1 startDocWrite.test.ts rekeyDoc: `rekeyDoc` export 없음 → TypeError(rekeyDoc is not a function) 1건 FAIL 예상, 기존 케이스 PASS.
