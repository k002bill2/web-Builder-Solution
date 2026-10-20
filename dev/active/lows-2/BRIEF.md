# LOWS-2 BRIEF — Low 2건 묶음 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-20 (자동 진행 — BACKLOG Low 정리)
base origin/main `02b0a5c1`. BACKLOG 원문을 먼저 읽고 표로 정리.
1. **B-M4B-06**: 내보내기 "다시 시도" 성공 뒤 포커스가 BODY로 빠짐(정적·React zip 공용 경로) → 결과 영역(성공 Callout 또는 내려받기 링크)으로. RED(포커스 BODY 재현) → GREEN. 문구 변경 0.
2. **B-SEC-07**: 결합 테스트 — Blob.type 손상 레코드 1 + 정상 1 → 결과 줄 lostImageText 1회 · 정상 이미지 포함. 변이(손상 레코드를 내보내기 전체 실패로) FAIL 확인.
- **예산**: 복원 진입 131.76(멈춤 > 131.78, 여유 0.02) · `/studio` 128.76. 포커스 코드는 조작 뒤 청크(ExportAfter 계열)에만. 진입 증분이 생기면 감량 1회 → 그래도 있으면 그 항목은 되돌리고 보고.
- fresh typecheck·lint·test(`--maxWorkers=4`)·build. 브라우저·Codex 불필요. 새 의존성 0, 단언 약화·skip 0.
- **git push·pull·fetch 금지.** 첫 2턴 BRIEF·PROGRESS 커밋, REPORT 초안 8턴 안, 항목마다 커밋. 마감 전 `git status --short` 빈 값. 최대 35턴, 28턴부터 마감.
