# M2C-SPECFIX Designer 브리프 — M2b·M2c 사양 결정 백로그 정리 (문서만)

- 역할 Designer / Orca managed Claude Code / worktree m2c-specfix / base `7125138`. 코드 0.
- 영환님 ★A(2026-10-06): M2c 백로그 정리. 병렬 레인 M2C-P3(Developer, `app/**`) — 앱 코드 수정 금지. **`docs/06-handoff/BACKLOG.md` 수정 금지**(Jarvis가 병합 때 갱신).
- 근거: `docs/06-handoff/BACKLOG.md` B-M2B-06·07·08, B-M2C-03·08, `dev/active/m2b-6-qa/REPORT.md`, `dev/active/m2c-5-qa/REPORT.md`, `dev/active/m2c-5b-qa/REPORT.md`, 관련 SPEC(`docs/design/m2b/SPEC-COMPARE3.md`·`SPEC-BODY.md`·m2a 루브릭 문서·`docs/design/m2c/SPEC.md`), `docs/03-trd/TRD.md` TR-POL-04.

## 항목 (쓰기: `docs/design/**`, 필요 시 `docs/03-trd/TRD.md` 해당 절, `dev/active/m2c-specfix/`)
1. **B-M2B-06** 3안 비교 대화상자 키보드 순서 — QA 권고(스크롤 영역 tabIndex 0이 "이 안 선택"보다 먼저 = WCAG 2.1.1 키보드 스크롤) 검토 → SPEC-COMPARE3 2.1·4절을 실제 순서로 정정(구현 변경 불필요하면 그렇게 명시).
2. **B-M2B-07** 비활성 예약 폼이 활성처럼 보임 — 시각 단서 추가 여부 결정(추가 시 구현용 명세 + 수용 기준, 아니면 근거).
3. **B-M2B-08** m2a K1 7변형 TR-POL-04 루브릭 원기록 보강(기존 30변형 루브릭 형식 그대로, 근거는 M2C-5b 기준선 `dev/active/m2c-5b-qa/baseline/` 캡처 경로 인용 — 새 렌더·크롤링 0).
4. **B-M2C-03** QB-10 잃은 이미지 경로가 제품 흐름으로 도달 불가(새로고침 시 프로젝트 소멸) → SPEC m2c 9절 QB-10 전제 정정안 vs 보관 방식(MQ-C2 B IndexedDB) 재론 — 결정이 영환님 몫이면 MQ로.
5. **B-M2C-08** 지운 뒤 대체텍스트 유지/초기화 — 결정(구현 필요하면 다음 Developer 레인용 수용 기준).

## 산출
- 각 SPEC 정정(개정 표기 r+1·변경 이력), `docs/design/m2c-specfix/MQ.md`(영환님 결정 필요 항목만 번호 선택지 ★추천·트레이드오프·사실/추정), 구현 필요 항목 목록(`dev/active/m2c-specfix/IMPL-TODO.md` — 다음 Developer 레인 입력), `dev/active/m2c-specfix/{PROGRESS,REPORT}.md`.
- 화면 확인이 필요하면 **Ego Lite**에서 앱 안 클릭만(4337 loopback 자기 서버), 끝나면 이 레인이 연 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 금지·운영
- 코드·package*.json/lock·CLAUDE.md·`docs/decisions/` 수정 0, 새 의존성은 MQ로만. 외부 크롤링·GDWEB/dbcut 0, APFS 브랜드 0.
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. Codex review/adversarial 1~2라운드 실제 완료만 기록. 40턴부터 REPORT 마감 우선. 한국어 보고.
