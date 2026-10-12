# RS4 측정 관문 — PROGRESS

- 브리프: `dev/active/rs4-measure/BRIEF.md` · base `1a48ce8` (앱 `93f8111`) · 브랜치 `k002bill2/rs4-measure`
- 성격: **미승인 초안(SPEC-4 r0.1b, Codex 미재검토)의 측정**. 제품 구현 아님. 판정선·기준선·ADR 수정 0.
- 서브에이전트: 사용 안 함(브리프 "서브에이전트불필요" — 빌드 직렬)

## 체크리스트
- [x] 0. npm ci(lock diff 0) · base build rawlog · base 전체 suite 파일/테스트 수
- [x] 1. P-3 이미지 안전 경로(AC17) 하네스 측정 · 판정
- [x] 2a. S1 스파이크 빌드·raw bytes (+ 감량 1회 S1r) — /studio·복원 초과(FAIL)
- [x] 2b. S2 스파이크 빌드·raw bytes — /studio·복원 초과(FAIL)
- [x] 2c. S3 스파이크 빌드·raw bytes (+ pending studio 조건 참 시나리오 UNAPPROVED 실측, S1/S1r/S2는 UNMEASURED) — 초과(FAIL)
- [x] 3. 판정선 대비 판정 (감량 1회 규칙) — REPORT 1절
- [x] 4. prototype 복원 · base 재빌드 바이트 동일(dist 143/143·rawbytes diff 0) · 앱 diff 0 · lock diff 0
- [x] 5. REPORT · rawlogs · patch 커밋(명시 pathspec) — RESUME-CLOSE 마감 실행

## 체크포인트
- base: lock sha 동일(fdd7c98e…) · build exit 0 · rawbytes /studio 129896 · 복원 132929 · profile 첫 99877/진입 120085(3안 122562) · projects 첫 98412/진입 105681 · suite 304 files / 2769 tests 통과
- P3: 하네스 6건(harness/rs4P3.harness.test.ts, 앱에서 제거) — a 잠금 거절→이탈→밖 확인 = doc 커밋·이미지 레코드 없음·리로드 복원 0(RS4-R10 확정) · 대조(맵 등록 유지) = 이미지 있음 · b quota(제출됨) = 재시도에 이미지 포함 · c offline = 옛 레코드로 resolve · d 변화 0 · d2 빈 id 수동 스냅샷 = 삭제됨
- 마감(RESUME-CLOSE, 2026-10-13): S1 /studio 129919·복원 132952 · S1r 129911·132944 · S2 130818·133850 · S3 130368·133401 · UNAPPROVED(S3) 131163·134196 — 전부 판정선(129900/132940) 초과. profile·projects 전부 안. 복원: build exit 0 · dist sha 143/143 동일 · rawbytes diff 0. `tools/.rawbytes.gen.mjs`(생성 사본) 삭제. 상세 REPORT.md
