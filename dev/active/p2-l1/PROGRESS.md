# P2-L1 PROGRESS

- [x] P0 BRIEF 커밋
- [x] 정본 읽기 (P2-SPEC 머리·2·3.2~3.4·6·7·8절, ADR-007 개정 3·4, THREATS T4)
- [x] L1a: format.ts + checkFile ①~④ (R2 RED = 모듈 없음 확인 → GREEN 15건) 커밋
- [x] build 실측 (a5692c4 직후): /studio 129.09 · 복원 132.13 · /profile 99.87 · /projects 104.69 · /compare 122.71 — 기준선과 동일(증가 0), exit 0
- [ ] L1b: ⑤ 이미지·재인코딩 · ⑥ 참조 · rekey · encode · rekeyDoc 커밋
- [x] 게이트: typecheck 0 · lint 0 · build 0(번들 불변) · 전체 vitest 0(289 파일·2518건)
- [x] REPORT.md
- [ ] Codex 검증 — BLOCKED: 브리프상 Jarvis 몫(이 레인 실행 안 함)
- [ ] Ego Lite — BLOCKED: UI 0(순수 모듈) — L3에서 실측

## RED 예측
- R1 format.test.ts: `./format` 모듈 없음 → import 실패로 파일 전체 FAIL 예상.
- R1 startDocWrite.test.ts rekeyDoc: `rekeyDoc` export 없음 → TypeError(rekeyDoc is not a function) 1건 FAIL 예상, 기존 케이스 PASS.
- R2 checkFile.test.ts: `./checkFile` 모듈 없음 → 파일 전체 FAIL 예상.
- R3 checkImages.test.ts: `./checkImages` 모듈 없음 → 파일 전체 FAIL 예상.
- R4 rekey.test.ts · encode.test.ts: `./rekey`·`./encode` 모듈 없음 → 두 파일 FAIL 예상(checkFile·checkImages 30건은 리팩터 뒤에도 PASS 유지).
