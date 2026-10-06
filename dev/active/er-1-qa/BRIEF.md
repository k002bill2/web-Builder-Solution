# ER-1 QA 브리프 — B-M2C-09 재검(시드 게이트 통과 문서로 ⑩ 동일성 · QB-10 정적 HTML 개수 문구)

- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree er-1-qa / base `9d817bd`. 코드 0. `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/editor-rest/SPEC.md` r1 2절(2.2 경로 A·B)·5.5 QB-R1·QB-R2, `docs/04-plan/EDITOR_REST_PLAN.md` 3절 ER-1 행·4절 QA 환경, MQ.md R2-A. 참고 `dev/active/m2c-reqa/REPORT.md`·`dev/active/m2c-e1/REPORT.md`(dev 서버 PNG·정적 HTML 설계상 실패), BACKLOG B-M2C-09·B-M2B-09.
- 병렬 레인 ER-2(Developer)와 독립 — 앱 코드 수정 0.

## 범위
1. **첫 확인**: 경로 A(ref-e 부티크 법률사무소 · 밝은 카드 → 3안 → 편집 시작 → 페이지 정보 입력)가 실제로 게이트 통과 문서를 만드는지. 안 되면 원인 기록 후 경로 B, 둘 다 실패면 BLOCKED + 사유.
2. **QB-R1 ⑩ 내보내기 동일성**: 게이트 통과 문서에서 캔버스 vs 정적 HTML vs PNG가 같은 모양인지(가능한 m2a 7변형 포함 범위 기록).
3. **QB-R2 QB-10 정적 HTML 개수 문구**: 이미지 2장 → 편집기 이탈·복귀(잃은 이미지) → 정적 HTML·PNG 결과 줄 개수 문구.
4. 같은 preview 환경에서 닿는 B-M2B-09 항목이 있으면 함께 표시(범위 확장 금지, 닿는 것만).
5. 회귀: 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회).

## 제약
- 환경: `npm run build` → `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(**dev 서버 금지**). fixture는 자체 제작만(`dev/active/m2c-5-qa/fixtures/gen-fixtures.mjs` 사본 가능, 원본 수정 0).
- **Ego Lite(영환님 지시):** 화면을 실제로 보고 판정·캡처 `dev/active/er-1-qa/shots/`. 시작 전 `listTaskSpaces()` 확인, space id 스크립트에 직접 기입. 첫 goto 1회 뒤 앱 안 클릭만·새로고침 금지. 끝나면 이 레인이 연 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 쓰기는 `dev/active/er-1-qa/`만(대용량 바이너리 .gitignore). 앱/테스트/docs/lock/scripts 수정 0, 새 의존성 0, BRIEF P0 명시 커밋. 결함은 고치지 말고 재현·심각도·증거. Safari·Firefox 미검증 표기, N/A를 PASS로 쓰지 않음.
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 35턴 도달 시 새 측정 중단 → 창 닫기 → vitest → REPORT. REPORT(한국어): meta·QB-R1/R2 판정(PASS/결함/환경 한계/미검증 + 증거)·경로 A/B 결과·결함·B-M2C-09 닫힘 여부 의견·책임/환경.
