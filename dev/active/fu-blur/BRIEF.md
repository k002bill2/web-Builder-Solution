# FU-BLUR Developer 브리프 — FIELD-UNDO Codex r2 P2-1 청크 로딩 전 blur 경계

- 역할 Developer / Orca managed Claude Code / worktree `fu-blur` / base main `2ad7221`. 첫 3턴 PROGRESS 커밋 · 최대 50턴 · 35턴부터 게이트·REPORT만.
- 근거: `dev/active/field-undo-1/REPORT.md` 8.2-1 · `logs/codex-r2.txt` — 첫 입력으로 `docEngine` 청크를 받는 동안 칸을 떠났다 같은 칸에 재입력하면 두 입력이 한 묶음(데이터 손실 아님). 제안 수정: 진입 `field()`에서 청크 미로드 시 1회 focusout 표시 + 청크 판정 1줄.
- 예산 몫: `/studio` 진입·복원 각각 **≤ +0.05**.
- 테스트: RED(청크 지연 주입 → 첫 입력 → blur → 같은 칸 재입력 → 기록 1건) → GREEN(2건). 기존 FU-AC·FU-AC-13 테스트 회귀 0. focusout 리스너 누적 0(P2-4 회귀 확인).
- Ego 생략 가능(타이밍 경합이라 단위 근거) — REPORT에 사유.
- BACKLOG B-ER-08 행 끝 "Codex r2 P2-1" 부분 결과 표기.

## 공통 제약
- 시작 `cd app && npm ci`(lock 변경 0). TDD(RED 예측·결과 PROGRESS) · RED만 있는 tip 커밋 금지 · 기존 단언 약화 0 · amend·rebase 금지 · `set -o pipefail`.
- 예산(ADR-004 개정 15): 자기 몫 안에서만. 실측이 기준선 판정선(129.65·132.68)을 넘으면 `scripts/m2cBaseline.json` `eagerKb` 두 값과 `scripts/bundleBudget.test.mjs` 150-152행 기대값을 **실측값으로 같은 커밋에서** 갱신하고 note에 "개정 15 배분 <레인>" 한 줄. 몫 초과 → 감량 1회 → 그래도 넘으면 멈추고 보고. 병렬 레인과 json 충돌은 Jarvis가 병합 때 합산 실측으로 정리.
- 마감: typecheck·lint·build exit 0 · 전체 vitest 1회 · Codex `codex-companion review --scope branch --base 2ad7221` 최대 2라운드(P1·P2 반영) · REPORT(한국어).
- 엔진 계약·저장 스키마·lock·CLAUDE.md·design/·ADR 수정 0. 새 의존성 0. push/merge/삭제 0. 승인 실패 우회 금지. 서브에이전트 분할: 불필요.
- 병렬: SAVE-ON-LEAVE ∥ FU-BLUR ∥ RESTART-SPEC-R2(Designer 문서). SAVE-ON-LEAVE는 `useSectionOps.ts`·`opAfter.ts` 수정 금지, FU-BLUR는 `StudioLayout.tsx`·`useAutosaveScheduler.ts` 수정 금지.
- 시간 상한 90분.
