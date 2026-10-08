# ENTRY-SLIM Developer 브리프 — `/studio` 진입 감량(상쇄) · 동작 변경 0

- 역할 Developer / Orca managed Claude Code / worktree entry-slim / base `6009271`(P1d 병합·push). `npm ci` 완료.
- **병렬 레인:** P2-SPEC(Designer, docs만)이 동시에 진행 — 이 레인은 앱 코드만, 겹침 0.
- 배경: ADR-007 "P1d 완료 기록" — main 실측 `/studio` 진입 **129.65** / 멈춤 >129.65 · 복원 진입 **132.68** / 멈춤 >132.68 · `/profile` 첫 화면 99.87 / 100. 진입 closure를 바꾸지 않은 레인도 지연 청크 해시·공유 청크 export 변동으로 ±0.02가 생겨, 다음 레인이 잡음만으로 멈출 수 있음. 판정: `app/scripts/bundleBudget.mjs`(기준선 `app/scripts/m2cBaseline.json` + 0.03), `app/scripts/check-bundle-size.mjs`. 예산 규칙 정본 `docs/decisions/ADR-004-performance-budgets.md`(개정 9~12).

## 목표
- `/studio` 진입 직후 자동 로드 포함 **≤ 129.45**(−0.20 이상) · 복원 진입 **≤ 132.48**(−0.20 이상) · `/profile` 첫 화면 ≤ 99.87(증가 0) · 다른 라우트 증가 0. **동작·문구·접근성 변경 0.** 0.20 미달이면 달성분만 커밋하고 실측과 남은 후보를 REPORT에.
- **기준선(`m2cBaseline.json`)·예산 숫자·스크립트 판정 로직 수정 0** — 기준선 갱신은 Jarvis가 ADR 개정과 함께 한다(REPORT에 새 실측만 기록).

## 방법
1. 실측 먼저: `npm run build` 산출물에서 `/studio` 진입 closure 청크 목록·gzip 크기 표(상위 10) — 스크립트 사본(저장소 밖 `$TMPDIR`)으로 소수 넷째 자리 출력은 허용(저장소 스크립트 수정 0).
2. 후보 조사(식 단위·근거 파일:줄): 진입 closure에 끌려온 **조작 뒤에만 쓰는 코드**(대화상자 문구·검증 분기·에러 문장 상수·쓰기 경로 헬퍼) → 지연 import로 이동 · 진입 청크와 지연 청크가 공유해 진입으로 끌려온 모듈 분리 · 죽은 export · 중복 문자열. P1a~P1d 레인 REPORT의 "진입 몫" 메모(`dev/active/persist-p1a2`·`persist-p1b`·`p1c-d2`·`p1d-l1`·`p1d-l2`·`p1d-l3` REPORT)를 참고.
3. 후보마다 **build로 실측해 효과가 있는 것만** 남긴다(KB 추정 금지). 엔진·PageDoc 계약·`SCHEMA_VERSION`·영속 형식 변경 0.
4. 구조 변경이 있는 이동은 기존 테스트가 동작을 고정하는지 확인 — 고정이 없으면 회귀 테스트 먼저 추가(TDD — 행동 동일성). 단언 약화·skip 0.

## Ego Lite (필수 — 동작 동일성 실화면)
- build + `vite preview --port 4337` · 창 minimized면 normal · `captureBeyondViewport:false`+clip ≤3장(`dev/active/entry-slim/shots/`): 새 프로젝트 확정 → `/studio` 편집기 진입·편집·"이 브라우저에 저장됨" → 새로고침(복원 진입) 뒤 편집 유지 → 스냅샷 대화상자 열기. status `textContent` 기록. 끝나면 `deleteDatabase("design-studio")` → 자기 공간만 `finish({keep:[]})` · `listTaskSpaces()` 기록 · 서버 종료·4337 리슨 0. 영환님 창·main 5480 무접촉.

## 검증·금지
- typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT(전후 표·채택/기각 후보·근거). **Codex는 Jarvis 몫.** amend·rebase 금지(깨진 커밋은 후속 커밋).
- docs/**·lock·CLAUDE.md·엔진·계약·기준선·예산 스크립트 수정 0, 새 의존성 0, 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: 실측표 8턴 전, 첫 감량 커밋 22턴 전, Ego Lite 30턴 전 시작·결과 40턴 전 커밋, 42턴부터 게이트·REPORT만, REPORT 초안 46턴 전 커밋. 한국어.
