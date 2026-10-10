# QA-REOPEN RESUME-1 — 남은 4항목 재개

- 같은 worktree `qa-reopen`. 1차 실행은 래퍼 시간 상한 900초로 끊겨 D-QA01만 측정(PASS·재현 0 — 이미 REPORT에 있음, 다시 하지 않는다).
- 이번 실행 시간 상한 = 60분. BRIEF.md의 캡처·브라우저·제약 규칙을 그대로 따른다(포트 4345, 쓰기는 `dev/active/qa-reopen/`만, 코드 0).
- 병렬 레인 COPY-HELP(Developer, 포트 4341)가 돌고 있을 수 있음 — 무접촉. `listTaskSpaces()`에 남은 "fallback-font 4343" 공간은 끝난 레인의 잔존물 — 건드리지 말고 REPORT에 기록만.

## 순서 (문서 1개를 만들어 재사용 — B-QA-01 교훈)
1. 경로 A로 편집 문서 1개 생성(카탈로그 ref-e → 3안 → 편집 시작 → 페이지 정보 게이트 통과). 생성 경로 턴은 10턴 이내로.
2. **B-ER-11**: 390 폭에서 테마 적용 직후 "되돌리기" 위치(y·뷰포트 안 여부) + 캡처. v2 테마를 만들 수 없으면 도달 불가 사유를 구체적으로 기록.
3. **B-M2C-09 ②**: 같은 문서 768·390 폭 PNG ↔ 정적 HTML 높이·육안 대조.
4. **B-ER-07**: `dev/active/qfix-qa/gen-fixtures.mjs`로 10MB 미만 고화소 fixture 생성(`exports/` 등 gitignore 경로) → 스로틀 6→20 → 고르기 직후 스냅샷 미리보기 → 결과 기록.
5. **B-M2B-09**(Chrome 범위): 시간 남을 때만.
- 40턴 도달 시 새 측정 중단 → 정리 → REPORT 갱신(1차 결과 유지 + 이번 항목 판정 추가). REPORT는 마지막 5턴 전 커밋.
