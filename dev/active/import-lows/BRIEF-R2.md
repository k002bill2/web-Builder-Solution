# IMPORT-LOWS BRIEF R2 — 재개 (Developer)

발주: Jarvis 2026-10-19. 1차 run은 Claude 구독 사용 한도로 중단(exit 1). 정본 `BRIEF.md` 그대로, 남은 일만.
1. **미커밋 변경 검증 먼저**: `checkImages.ts` `IMPORT_IMAGE_ID`(UUID v4 소문자) + 테스트 5건. 기존 픽스처가 UUID 아닌 id(`"a"` 등)를 쓰는 테스트가 깨지는지 전체 스위트로 확인 → 픽스처를 UUID로 바꾸되 단언 약화 0(이전/이후 표) → 변이(정규식 완화) FAIL 확인 → B-SEC-02 커밋. `logs/`는 필요한 것만 커밋, 나머지 삭제.
2. B-SEC-03 → B-SEC-01(저장 스키마·엔진 계약 변경 필요하면 멈추고 보고) → 퍼즈 재실행 → 게이트·예산 → Codex 1회·반영 1회 → REPORT.
- **git push·pull·fetch 금지.** 항목마다 커밋. 마감 전 `git status --short` 빈 값. 최대 50턴, 40턴부터 마감.
