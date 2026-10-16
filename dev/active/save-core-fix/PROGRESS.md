# save-core-fix PROGRESS — QA 반례 좁힌 수정 (base 78e3c52)

쓰기 범위: `dev/active/save-core-harness/core/` · `dev/active/save-core-harness/test/`(하네스 회귀 추가) · `dev/active/save-core-fix/`. QA 원본(`dev/active/save-core-qa/`)·제품 `app/` 변경 0.

- [x] 1. `npm ci` exit 0 · `git status --porcelain app` 0줄 (`rawlogs/npm-ci.txt`·`lock-diff.txt`)
- [x] 1. baseline 하네스 23 pass exit 0 (`rawlogs/baseline-harness.txt`) · QA 10 = 4 failed(CE-1·CE-2·CE-3a·CX-3) | 6 passed exit 1 (`rawlogs/baseline-qa.txt`)
- [x] 1. 예정 test delta 기록(RED 전): 신규 `save-core-harness/test/h6.test.ts` 13건 → RED 실측 8 failed | 5 passed exit 1 (`rawlogs/h6-red.txt`)
  - RED 8(결함 고정): H6-1 discard 중 save · discard 중 dirty confirm/2번째 discard · H6-2 D1 Blob 동결 · doc 외부 변경 · 순차 discard 바인딩 X 복귀 · 재열기 코어 discard 폐기 Blob 제거 · 비코어 레코드 image-missing · H6-3 공유 gate 동시 save
  - 회귀 가드 5(지금도 GREEN, 수정이 깨면 안 됨): discard 읽기 throw 뒤 가드 해제 · discard 중 edit/replace 수용 · 한 코어 연속 save/같은 gate 재열기/쓰기 실패 뒤 진입 · M9 거짓 성공 drop · M8 이미지 op 누락
  - 예상 최종: 하네스 23+13 = 36 pass · QA 10 = 10 pass
- [x] 2. CE-1 discarding 가드 RED→GREEN (h6-1 · QA CE-1 PASS · mutation F1~F3)
- [x] 3. CE-2 doc/Blob 동결 · CX-3 discard 바인딩 복귀 RED→GREEN (h6-2 · QA CE-2·CX-3 PASS · F4~F6·F8)
- [x] 4. CE-3a 같은 영속 인스턴스 직렬 RED→GREEN + 재진입·gate 재사용 회귀 (h6-3 · QA CE-3a PASS · F7 정정). 제품 통합 PARTIAL(다른 영속 인스턴스·조건부 쓰기 미구현)
- [x] 5. M6 근거 삭제 · M8'·M9 kill (h6-4 false-success 주입)
- [x] 마감: 하네스 37 ×2(지연 읽기 회귀 1 추가) · QA 10 ×2 pass · tsc 2종·eslint 2종 exit 0 · `rawlogs/EXIT-MANIFEST.txt`
- [x] MINIMAL-CONTRACT(I6·I7·I9·G3) · REPORT · scoped commit
- 서브에이전트: 사용 0(브리프 '불필요'). Codex: review 1회(반복 0) — REPORT 6절
- BLOCKED 아님 · 남은 것: 브라우저 프로브 재실행·제품 통합 = 뒤 별도 QA
