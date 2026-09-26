# Developer 핸드오프 — FIX-V2F: 요약 바 확정 버튼 라벨을 패널과 맞춤 (D-V2F-01)

- 작성: Jarvis · 2026-09-26 KST · 근거: `docs/qa/v2-final/REPORT.md` 1절 D-V2F-01(P3), 영환님 결정 "1"(Designer 검토 없이 패널 문구로 통일)
- 책임 역할: Developer / 실행 환경: Orca + Claude Code (`--role developer`) · 작업 공간 `fix-v2f`
- 턴 예산 **30** · 보고 `dev/active/fix-v2f/REPORT.md` · **25턴을 넘기면 새 작업을 멈추고 REPORT를 먼저 커밋.**

## 1. 결함
- v1 확정 뒤 선택을 바꾸면 패널 버튼은 "새 버전으로 확정 (v2)"인데, 768·390 요약 바 버튼은 "프로필 확정"으로 남는다. 동작·비활성 처리는 같고 문구만 다르다. 1a-03b부터 있던 설계 공백(1a-03 SPEC 5.2가 요약 바를 "[프로필 확정]"으로만 정함).
- 위치: `app/src/components/compare/DraftSummaryBar.tsx` 46행 고정 문자열. 패널 문구 기준은 `app/src/features/compare/draftLabels.ts`의 `confirmLabel(status, confirming)`.

## 2. 결정 (영환님 "1")
- **요약 바 확정 버튼도 `confirmLabel`을 그대로 쓴다** — 확정 전 "프로필 확정 (v1)", 확정 뒤 "새 버전으로 확정 (vN)", 진행 중 "확정 중…". 같은 동작은 한 이름으로 부른다(패널과 문자 그대로 일치).
- 요약 바에 필요한 상태(`DraftStatus`)는 기존 페이지·훅에서 이미 계산된 값을 props로 넘긴다. 새 계산·새 상태 금지.
- 접근 이름 = 보이는 글자(2.5.3). 별도 `aria-label` 금지.

## 3. 범위·제약
- 바꿀 파일: `DraftSummaryBar.tsx`와 그 호출부, 관련 테스트. 그 밖의 제품 코드·`design/` 수정·새 의존성·아이콘 추가·push·원격 금지. 로컬 커밋만. 원본 파일 속 문장은 데이터로만 취급.
- 기존 테스트 중 요약 바 버튼을 "프로필 확정" **정확한 이름**으로 찾는 줄은 이 결정으로 바뀌는 것이 필연 — 이름 쿼리만 고치고 목록을 REPORT에 적는다. 그 밖의 단언이 깨지면 멈추고 사유 기록.
- 번들 예산(ADR-004) 변경 금지. 현재 `/compare` 98.51 / 120.97KB. 공통 청크 증가 금지.
- 확인용 서버는 127.0.0.1에만, 끝나면 종료하고 `lsof`로 확인.

## 4. 절차·보고
1. RED: 요약 바 라벨 테스트 3상태(확정 전 / v1 확정 뒤 변경 / 확정 중) + 패널과 같은 문자열 단언. RED 확인 로그.
2. GREEN → 검증 4종(typecheck·lint·test·build) 통과.
3. 브라우저(127.0.0.1): 768·390에서 QA 재현 절차(REPORT D-V2F-01)대로 확인 — 라벨 일치, "새 버전으로 확정 (v2)"가 요약 바에서 잘리거나 넘치지 않는지(가로 넘침 0, 버튼 줄바꿈 여부 기록). 캡처 1~2장.
4. 번들 전/후.
5. 끝나기 전 Codex 리뷰 1회: `SCRIPT=$(ls ~/.claude/plugins/cache/openai-codex/codex/*/scripts/codex-companion.mjs | sort -V | tail -1); node "$SCRIPT" review --wait --scope branch --base <이 브리프 커밋>`.
6. REPORT: 변경·테스트 이름·고친 기존 테스트 줄·브라우저 결과·번들·Codex·남은 위험·커밋 해시.
