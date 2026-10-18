# M4-a-7 BRIEF FIX1 — QA N1·N2 반영 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — QA PASS with notes 후속, 머지 전 1회)
대상: 이 워크트리 tip `b501ad19`. 근거 `dev/active/m4a-readonly-export/QA-REPORT.md` 2절 N1 · 4절 N2.

## 할 일 (TDD, 항목마다 커밋)
1. **N2 문구**: 읽기 전용 내보내기 결과 본문을 기존 앱 패턴과 같은 형식으로 — **"다른 탭에서 편집 중이라 내보내지 못했습니다 — 그 탭을 닫은 뒤 다시 내보내세요"**. 근거 패턴(새 문형 아님): `features/projects/dialogText.ts:2·5`, `features/profile/restartText.ts:47`. 문구는 **`ExportAfter`(lazy) 쪽에만** 둔다 — 판별 상수(`exportFlow.ts:81` = `READ_ONLY_TAB`)는 그대로 판별용으로 유지. 제목 "내보내지 못했습니다"와 본문이 중복되면 본문만 위 문장으로(제목 유지) — 화면 글자 정확 일치 단언을 새 문장으로 정정(이전/이후 표).
2. **N1 회귀 가드**: `exportFlowReadonly.test.ts`에 `STALE_TAB`·`CLEARED_TAB` INFRA → `retryable` 단언 2줄. 변이 M3b(`includes("다른 탭에서")`)가 이제 FAIL인지 확인하고 되돌림.
3. fresh typecheck·lint·test·build · 예산 `/studio` 128.79 · 복원 131.77 **증분 0**(넘으면 멈춤). Codex 금지(문자열·테스트만). 브라우저 불필요.

## 규칙
- 쓰기 경로: `components/studio/ExportAfter*`·`features/studio/exportFlow*`(테스트)·`components/studio/ExportFlow.test.tsx`·`dev/active/m4a-readonly-export/`. 단언 약화·skip 0. 명시 경로 커밋, push 0. 첫 턴 BRIEF-FIX1 커밋. 마감 전 `git status --short` 빈 값. REPORT에 FIX1 절 추가. 최대 25턴.
