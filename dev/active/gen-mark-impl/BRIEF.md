# GEN-MARK-IMPL Developer 브리프 — B-M3P-03 생성 조합 표식·카드 출처 줄 구현

- 역할 Developer / Orca managed Claude Code / worktree `gen-mark-impl`. 산출물: 코드·테스트 + `dev/active/gen-mark-impl/{PROGRESS,REPORT}.md` + `shots/`.
- 정본: `docs/design/gen-mark/SPEC.md` r1 + `MQ.md` 결정 기록(MQ-GM-1~4 전부 A). 수용 기준 GM-AC-U1~U8 · G1~G3 · E1~E4 전부.
- 예상 파일(SPEC 8절): `components/catalog/ReferenceCard.tsx`(+test 181행 단언은 GM-AC-U3대로 뒤집기), `components/detail/DetailHeader`/`ReferenceDetailPage.tsx`(+test), 새 출처 부품(SPEC 3.3). `referenceDisplay.ts`·`Tag.tsx` 수정 0(GM-AC-G1).
- 예산: `/catalog` 첫 화면 ≤100.90 · `/references/:id` ≤100 · `/profile`·`/studio` 변화 0.
- Ego Lite(필수): build + `npx vite preview --host 127.0.0.1 --port 4353 --strictPort` → GM-AC-E1~E4(390·1024·1280 카드 캡처 + Tag·header CTA `getBoundingClientRect` 교차 0 수치, 상세는 앱 안 클릭으로 이동) → `dev/active/gen-mark-impl/shots/`.
- 서브에이전트 분할: 불필요. 턴: P0 3턴 · 구현 커밋 30턴 전 · Ego 45턴 전 마감 · 50턴부터 게이트·Codex·REPORT만 · REPORT 65턴 전.

## 공통 제약
- base main `b3f8894`. 시작 `cd app && npm ci`(lock 변경 0 확인).
- TDD: 수용 기준마다 RED 예측·결과를 PROGRESS에 → 실패 테스트 → GREEN. RED만 있는 tip 커밋 금지 · SPEC이 명시한 단언 외 기존 단언 약화 0 · amend·rebase 금지 · 명령 체인 `set -o pipefail`(앞 단계 실패 시 다음 단계 실행 금지).
- 마감 게이트: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · Codex `codex-companion review --scope branch --base b3f8894` 최대 2라운드(P1·P2 반영, 나머지는 REPORT 기록) · REPORT(한국어: 수용 기준별 결과 표·변경 파일·예산 실측·Ego 수치·SPEC과 다르게 한 것·남은 것).
- Ego Lite 캡처는 뷰포트 clip, PNG 바이트 수를 REPORT에 기록(손상 파일 금지). 정리: IDB `deleteDatabase("design-studio")` · 자기 공간 `finish({keep:[]})` · `listTaskSpaces()` 기록 · 서버 종료·포트 리슨 0. 영환님 창·main 5480·다른 레인 무접촉.
- 엔진 계약(`engine/contracts`)·저장 스키마·lock·CLAUDE.md·design/·ADR 수정 0. 새 의존성 0. push/merge/브랜치 삭제 0. 승인 실패 우회 금지.
- 병렬 레인: GEN-MARK-IMPL(포트 4353) ∥ FIELD-UNDO-1(포트 4355) ∥ RESTART-SPEC(Designer, 문서) — 쓰기 경로 분리. BACKLOG는 이 레인 항목 행만 수정.
