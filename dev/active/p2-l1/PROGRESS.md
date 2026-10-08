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

## Codex r1 수정 (codex-r1-jarvis.txt 3건)
- [x] ①[P1] base64 선형 검사 + checkImages 예외 → IM-6
- [x] ②[P2] series ProfileVersion 필수 필드 모양 → IM-4
- [x] ③[P2] 스냅샷 doc.profileVersion 1..계열 길이 → IM-4
- [x] 게이트(typecheck·lint·build 번들 불변·전체 vitest) · REPORT "Codex r1 수정" 절 커밋

### RED 예측 (Codex r1)
- ①a checkImages.test "A".repeat(8MiB) 변형본: 옛 BASE64 정규식이 RangeError → checkImages·checkFile **reject**(결과 IM-6 아님)로 FAIL. ①b 변형본 getter가 던짐: 옛 코드 checkOne에 try 없음 → reject로 FAIL.
- ①c encode.test 8MiB+ base64 왕복(원본 ≈6MiB): 옛 정규식 RangeError → checkFile reject로 FAIL.
- ② checkFile.test series `{profileId,version}`만 + doc:null 등: 옛 seriesOk는 version·profileId만 봄 → ok:true 반환으로 FAIL(기대 IM-4). 실제 confirmProfile 버전 통과 케이스는 옛 코드에서도 PASS.
- ③ checkFile.test 현재 v2 · 스냅샷 v3(writeStartDoc으로 새로 만든 문서·hash 일치) · 계열 v1·v2: 옛 docOk는 스냅샷 profileVersion을 안 봄 → ok:true로 FAIL(기대 IM-4).

## Codex r2 수정 (codex-r2-jarvis.txt 3건 + 같은 계열 전수 점검 — 마지막 라운드)
- [x] ①[P2] adjustments.contrast·density·purpose 열거(+ corrections check C-1..5 · from/to #RRGGBB) → IM-4
- [x] ②[P2] 선택 필드 dropped(배열·항목 key/role/reason) · basedOn·boardRevision(정수) · component_choices 하위 → IM-4
- [x] ③[P2] 스냅샷 머리 name·createdAt·candidateId·hash(문자열) · profileVersion(정수 1..계열) · reason(열거) → IM-4
- [x] 전수 점검 표(REPORT) — 색 $value #RRGGBB · section_plan type 열거 포함
- [x] 실제 데이터 통과(saveAdjustments 4열거+보정 · 재확정 dropped · revertTo basedOn · createSnapshot·restoreSnapshot)
- [x] 게이트(typecheck·lint·build 번들 불변·전체 vitest) · REPORT "Codex r2 수정" 절 커밋

### RED 예측 (Codex r2)
- "Codex r2" describe의 손상 테스트 3건(Codex 재현 ①②③)과 표 기반 손상 테스트 2건(버전·스냅샷): 옛 profileShape/snapshotOk는 문자열 여부·kind만 봄 → ok:true 반환으로 FAIL(기대 IM-4). 루프 첫 미검사 항목에서 멈춤.
- 실제 데이터 통과 2건(재확정·되돌리기·조정 버전 / 실제 스냅샷): 옛 코드도 통과 → PASS(과잉 엄격 가드 — 구현 뒤에도 PASS여야 함).
