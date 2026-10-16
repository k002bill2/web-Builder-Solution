# STUDIO-PRELOAD-SLIM QA BRIEF — 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/studio-preload-slim` (구현 커밋 `4f4a7be7`, REPORT 커밋 `2b5048b7`, base `92522714`). Developer 보고 `dev/active/studio-preload-slim/REPORT.md`.
변경: `app/vite.config.ts`, `app/src/build/preloadDedup{,.test}.ts`, `app/scripts/preloadGuard{,.test}.mjs`, `app/scripts/check-bundle-size.mjs`.

## 검증 항목
1. **동작 변화 0 논리 검토**: `dedupPreloads`가 제외하는 청크가 "호스트 청크 실행 시점에 이미 평가된 정적 닫힘"뿐인지 코드로 판정. 엔트리 닫힘 제외가 다른 엔트리(렌더·thumbs 빌드)나 HTML 호스트에 새지 않는지. 플러그인 모듈 상태가 빌드 간 섞이지 않는지.
2. **가드 검출력(변이, 임시)**: ① `vite.config.ts`에서 `resolveDependencies` 제거 → `npm run build` exit 1 ② `polyfill: false` 제거 → exit 1 ③ HTML 호스트 통과 분기 제거(HTML도 거르게) → 가드 ② 실패 확인. 매번 `git checkout -- app/`로 복원.
3. **기준선 판단 검토**: REPORT "기준선" 절의 ADR-004 개정 13·15·16 인용이 원문과 일치하는지(`docs/decisions/ADR-004-performance-budgets.md`).
4. **실화면(Ego Lite, 짧게)**: build + `npx vite preview --host 127.0.0.1 --port 4372 --strictPort`(포트 비었는지 확인). `/` 카탈로그 첫 진입, `/projects`, `/studio` 편집기 진입·저장·새로고침 복원에서 콘솔 오류·네트워크 실패 0, 레이지 청크 로드 정상. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()` 확인·서버 종료·리슨 0. 영환님 창·main 5480 무접촉. 막히면 BLOCKED.
5. **fresh 게이트**: `npm run typecheck`·`lint`·`npm test -- --run`(기대 317/2856)·`npm run build`(번들 표 REPORT와 대조).
6. 기존 테스트 단언 삭제·완화 0: `git diff 92522714 -- app/` 중 기존 테스트 파일 변경 0 확인. 최종 `git status --porcelain`에 `app/` 변경 0.

## 제외
- 앱·테스트 수정 커밋 금지(변이는 임시). push·원격 쓰기·다른 워크트리 접촉·Codex 금지.

## 산출물
- `dev/active/studio-preload-slim/QA-REPORT.md`: 0. 판정 PASS / PASS with notes / FAIL 1. 변이 표 2. 논리 검토 3. 기준선 인용 대조 4. 실화면 5. 게이트 수치 6. 사실/추정/미확인
- `dev/active/studio-preload-slim/QA-PROGRESS.md`. 로컬 커밋은 이 두 파일과 `qa-shots/`만(명시 경로 add).
- 첫 3턴 QA-BRIEF·QA-PROGRESS 커밋. 35턴부터 새 확인 중단 → 정리·REPORT.
서브에이전트 분할: 불필요(변이가 같은 파일을 순차로 건드림).
