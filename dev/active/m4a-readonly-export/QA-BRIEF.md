# M4-a-7 QA BRIEF — B-M4A-12 읽기 전용 탭 내보내기 독립 검증 (QA, 정적·회귀)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 tip `ef73f7e3`(base `36e825a6`). Developer `dev/active/m4a-readonly-export/REPORT.md`(Ego E2 2탭 확인 · Codex approve).

## 검증 (항목마다 QA-REPORT 커밋)
1. fresh typecheck·lint·test(356/3148)·build · 예산 `/studio` 128.79 · 복원 131.77 = main(증분 0) · `StudioLayout-*`에 `assets/infra-` 참조 0.
2. **판별 정확성**: INFRA 중 `READ_ONLY_TAB`으로 끝나는 메시지만 refused `READ_ONLY` — 다른 INFRA(네트워크·청크·저장소)는 여전히 retryable(다시 시도 유지). 값 복제(`exportFlow.ts` 상수 = `infra.ts` `READ_ONLY_TAB`) 일치 테스트가 실제로 깨지는지 변이(상수 한 글자 변경) · 판별 제거 변이 · 다른 INFRA를 refused로 넓히는 변이 → FAIL.
3. **거짓 성공 0 · 거짓 사유 0**: refused 화면 제목·본문이 기존 문구 재사용인지 · "품질 게이트 차단" 기본 제목이 READ_ONLY에서 안 나오는지 · 쓰기 탭 회귀 0.
4. REPORT의 불일치 기록(`restartFlow.ts:51`은 같은 사유를 `retry: true`로 다룸 — 쓰기 탭을 닫으면 다시 시도 성공 가능) 검토: 이번 "다시 시도 없음"이 사용자를 막는지 코드로 판단하고 권고(문구에 "그 탭을 닫은 뒤…" 필요 여부).
5. 바뀐 기존 단언 이전/이후 표 — 약화 0.

## 판정·규칙
- PASS / PASS with notes / FAIL. 브라우저 금지(Ego 증거는 `logs/ego-E2.txt` 재판독), Codex 금지, 앱·테스트 수정 커밋 금지, push 금지. 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋, QA-REPORT 초안 8턴 안. 변이 매번 되돌림. 마감 전 `git status --short` 빈 값. 최대 30턴, 24턴이면 판정 확정.
