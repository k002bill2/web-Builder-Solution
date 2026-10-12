# RS4 측정 관문 — PROGRESS

- 브리프: `dev/active/rs4-measure/BRIEF.md` · base `1a48ce8` (앱 `93f8111`) · 브랜치 `k002bill2/rs4-measure`
- 성격: **미승인 초안(SPEC-4 r0.1b, Codex 미재검토)의 측정**. 제품 구현 아님. 판정선·기준선·ADR 수정 0.
- 서브에이전트: 사용 안 함(브리프 "서브에이전트불필요" — 빌드 직렬)

## 체크리스트
- [ ] 0. npm ci(lock diff 0) · base build rawlog · base 전체 suite 파일/테스트 수
- [ ] 1. P-3 이미지 안전 경로(AC17) 하네스 측정 · 판정
- [ ] 2a. S1 스파이크 빌드·raw bytes
- [ ] 2b. S2 스파이크 빌드·raw bytes
- [ ] 2c. S3 스파이크 빌드·raw bytes (+ pending studio 조건 참 시나리오 UNAPPROVED)
- [ ] 3. 판정선 대비 판정 (감량 1회 규칙)
- [ ] 4. prototype 복원 · base 재빌드 바이트 동일 · 앱 diff 0 · lock diff 0
- [ ] 5. REPORT · rawlogs · patch 커밋(명시 pathspec)
