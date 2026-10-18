# SEC-FIX-1 QA BRIEF — 가져오기 M-1·L-1 수정 독립 검증 (QA, 정적·회귀 — 브라우저 금지)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18. 대상 tip(이 커밋 직후). 근거 `REPORT.md` · Security `dev/active/sec-readproject/REPORT.md` M-1·L-1 · 퍼즈 `dev/active/sec-readproject/patches/zz*.txt`.

## 검증 (항목마다 QA-REPORT 커밋)
1. fresh typecheck·lint·test(363/3269)·build · 예산 진입 증분 0 재현.
2. Security 퍼즈 67건(+폭탄)을 임시로 다시 돌려 M-1 폭탄 디코드 0·L-1 대상 IM-4, 그 밖 판정 불변 확인(임시 파일은 되돌림).
3. 변이 4종(되돌림): 헤더 검사 제거 · 사다리 비교를 `<=`로 완화 · grid 범위 1~64 → 1~65 · `Object.hasOwn` → `in`. 각각 테스트 FAIL로 잡히는지.
4. 픽스처 이전/이후 표 — 기존 단언 약화 0 확인.
5. 부작용 판단: 범위 밖 값을 이미 가진 기존 프로젝트의 파일 내보내기가 EX-6이 되는 것 — 사용자가 막히는가, 회복 경로가 있는가, BACKLOG 권고 여부.
## 규칙
- 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋, QA-REPORT 초안 8턴 안, **24턴이면 판정 확정**. 앱·테스트 코드 커밋 금지, Codex 금지, push 금지. 마감 전 `git status --short` 빈 값. 최대 30턴.
