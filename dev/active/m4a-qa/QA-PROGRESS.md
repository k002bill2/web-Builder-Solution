# M4-a-4 QA PROGRESS — 1차(정적·회귀·생성물)

대상: `k002bill2/m4a-qa` = m4a-impl tip `a834eb88` · 시작 2026-10-18

- [x] 0. BRIEF·PROGRESS 커밋 / REPORT 초안(잠정 판정) 커밋
- [x] 1. fresh 게이트 typecheck·lint·test(353/3130)·build · 예산(/studio 128.71 · 복원 131.69 · 렌더 JS 84.29/90 · 다른 라우트 무변화)
- [x] 2. EXP-AC 01~19 판정표 재현 · 부분 02·14 사유 · 바뀐 단언 이전/이후 표
- [x] 3. 생성물(Node): zip 실제 파일 → unzip -t·zipinfo·ditto -xk·한글 파일명·7파일·LICENSES.md/OFL.txt · 단일 HTML 외부 요청 0
- [x] 4. 회귀: PNG·단일 HTML(Q5)·게이트 8줄·편집기 저장 무변화 · 변이 3종 FAIL
- [x] 5. 문구: 조사("(zip)을"→"를") · EXPORT-SPEC 문구 키 대조표
- [ ] 6. LIVE-PLAN.md (브라우저 설치 확인 포함)
- [ ] 7. 마감: 변이 원복 · preview 미기동/포트 0 · untracked 0 · 최종 판정
- 4 결과: 무변화 확인 · 변이 7종 중 5 잡힘 · M2a·M2c 생존 = 테스트 공백 G1·G2(패치 제안 REPORT 4c) — 2차 run(재개)
- 5 결과: 조사 오류 재현(ExportAfter.tsx:113 · 테스트가 틀린 문장 고정) · export.fail.pattern 미구현(편차 미기록) · 나머지 키 일치
- 2 결과: 통과 15 · 통과 with notes 1(13) · 부분 2(02·14 사유 확인) · 이월 1(18) · 바뀐 단언 약화 0
