# IMPORT-LOWS QA BRIEF — B-SEC-01·02·03 독립 검증 (QA, 정적·회귀 — 브라우저 금지)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-20. 대상 tip `0a89ef10`. 근거 `REPORT.md` · Security `dev/active/sec-readproject/REPORT.md` L-2·L-3·L-4.

## 검증 (항목마다 QA-REPORT 커밋)
1. fresh typecheck·lint·test(375/3374)·build · 예산 `/studio` 128.76 · 복원 131.76(멈춤 > 131.78) 재현.
2. 변이 5종(되돌림): UUID 정규식을 대문자 허용·버전 무시로 완화 · Blob.type 검사 제거 · 손상 레코드를 내보내기 전체 실패로 · 허용 키 목록에 키 1개 추가 · 정규화를 저장 뒤로 이동. 각각 FAIL로 잡히는지.
3. **기존 사용자 데이터 회귀**: 이미 저장된(가져오기 이전 버전) 프로젝트에 UUID 아닌 이미지 레코드·모르는 키가 있을 때 열기·편집·내보내기가 깨지지 않는지(코드 경로 전수 + 단위 테스트 근거). 깨지면 FAIL.
4. B-SEC-03 "그 이미지만 잃은 이미지" — 결과 줄 lostImageText 1회 · 다른 이미지·문서 정상.
5. 픽스처 이전/이후 — 단언 약화 0.
## 규칙
- 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋, QA-REPORT 초안 6턴 안, **22턴이면 판정 확정**. 앱·테스트 코드 커밋 금지, Codex 금지, **git push·pull·fetch 금지**. 마감 전 `git status --short` 빈 값. 최대 28턴.
