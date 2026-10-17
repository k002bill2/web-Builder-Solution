# RS8-UX-FIX QA BRIEF — B-RS-11 편집 알림 · B-RS-12 390 sticky 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 `k002bill2/rs8-ux-fix` (tip `af5d680b`, base `ead47dcd`). Developer 보고 `dev/active/rs8-ux-fix/REPORT.md`. 정본 `docs/design/restart/UX-POLISH-1.md` 3·4절(UXP-AC-03~08).

## 검증 (짧게 — 항목마다 QA-REPORT 갱신 커밋)
1. **UXP-AC-03·04·05**: 편집기 셸 안 `role=status` = 편집 알림 1개(3 배치) · PNG 성공 → 편집 알림 글자 일치 · 같은 PNG 재저장 시 재낭독(빈 문자열 → 문장) · PNG 실패 alert 그대로. 변이: `onAnnounce` 호출 제거 / `role=status` 복원 → FAIL.
2. **UXP-AC-06·07**: 390×844 끝까지 스크롤 후 상태 줄 `getBoundingClientRect().top ≥ 0` · stale일 때 "버리고 새로고침" 화면 안 · 가로 넘침 0 · 1024·1280 무변화. sticky 툴바가 본문·대화상자·포커스 링을 가리지 않는지(z-index — 폐기 대화상자는 `showModal` top layer).
3. 바뀐 기존 단언 이전/이후 표가 약화 아닌지.
4. 예산: `/studio` 128.70 · 복원 131.68(기준선 실측 상향 +0.04 — BRIEF 한도 +0.05 안) fresh 재현.
5. fresh 게이트 typecheck·lint·test·build.

## 규칙
- 실화면 preview `--port 4396 --strictPort`. **실화면을 2번 항목 하나에만 쓰고, 막히면 BLOCKED로 적고 마감.**
- 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋. **QA-REPORT 초안 10턴 안에 커밋**, 이후 항목마다 갱신 커밋. 판정(PASS / PASS with notes / FAIL) 줄은 초안부터 "잠정"으로 채워라.
- 마지막 커밋 직전 preview 종료 → `lsof -nP -iTCP:4396 -sTCP:LISTEN` 0 기록. IDB 삭제·`finish({keep:[]})`. 마감 전 `git status --short` node_modules 외 빈 값.
- 앱·테스트 수정 커밋 금지. push·원격 쓰기·다른 워크트리·Codex 금지. 최대 30턴.
