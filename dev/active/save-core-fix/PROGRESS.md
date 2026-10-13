# save-core-fix PROGRESS — QA 반례 좁힌 수정 (base 78e3c52)

쓰기 범위: `dev/active/save-core-harness/core/` · `dev/active/save-core-harness/test/`(하네스 회귀 추가) · `dev/active/save-core-fix/`. QA 원본(`dev/active/save-core-qa/`)·제품 `app/` 변경 0.

- [x] 1. `npm ci` exit 0 · `git status --porcelain app` 0줄 (`rawlogs/npm-ci.txt`·`lock-diff.txt`)
- [x] 1. baseline 하네스 23 pass exit 0 (`rawlogs/baseline-harness.txt`) · QA 10 = 4 failed(CE-1·CE-2·CE-3a·CX-3) | 6 passed exit 1 (`rawlogs/baseline-qa.txt`)
- [x] 1. 예정 test delta 기록(RED 전): 신규 `save-core-harness/test/h6.test.ts` 13건 → RED 실측 8 failed | 5 passed exit 1 (`rawlogs/h6-red.txt`)
  - RED 8(결함 고정): H6-1 discard 중 save · discard 중 dirty confirm/2번째 discard · H6-2 D1 Blob 동결 · doc 외부 변경 · 순차 discard 바인딩 X 복귀 · 재열기 코어 discard 폐기 Blob 제거 · 비코어 레코드 image-missing · H6-3 공유 gate 동시 save
  - 회귀 가드 5(지금도 GREEN, 수정이 깨면 안 됨): discard 읽기 throw 뒤 가드 해제 · discard 중 edit/replace 수용 · 한 코어 연속 save/같은 gate 재열기/쓰기 실패 뒤 진입 · M9 거짓 성공 drop · M8 이미지 op 누락
  - 예상 최종: 하네스 23+13 = 36 pass · QA 10 = 10 pass
- [ ] 2. CE-1 discarding 가드 RED→GREEN
- [ ] 3. CE-2 doc/Blob 동결 · CX-3 discard 바인딩 복귀 RED→GREEN
- [ ] 4. CE-3a owner/atomic 최소안 RED→GREEN (+ 한 코어 재진입·gate 재사용 회귀)
- [ ] 5. M6·M8·M9 단언 공백(false-success 주입 test)
- [ ] 마감: 하네스+추가 2회 · QA 10 2회 · tsc · lint · EXIT-MANIFEST
- [ ] MINIMAL-CONTRACT(discard/image/owner 규칙만) · REPORT · scoped commit
