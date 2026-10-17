# RS6-L2 QA BRIEF — liveness 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs6-l2-liveness` (tip `3d18624c`, base `3a77c8eb`). Developer 보고 `dev/active/rs6-l2-liveness/REPORT.md`.
변경(앱): `app/src/features/studio/save/{liveness,alertKeys,coreIo,saveCore}.ts` + 테스트 4파일, `useAutosaveScheduler.ts`(타입 필드 2개), `components/studio/SaveStatus.tsx`, 예산 파일 2개. 정본: `docs/design/restart/INTEGRATE-6.md` r1 3절·8.1·RS6-AC-U4·U5·U11, MQ-6-3 A, ADR-004 개정 17.

## Jarvis 판정(참고 — 검증 대상 아님)
- `SaveStatus.tsx` 수정은 L2 BRIEF CP3가 명시 승인한 범위다. 감시 결선은 L3로 이월. raw 판정선 130→130.5는 개정 17 결정 2대로 raw가 130을 넘는 첫 레인(L3 예상)이 바꾼다. CP별 감량 2회는 상한 초과 전 최적화라 허용.

## 검증 항목
1. **동작 변화 0(현재 사용자 경로)**: 감시 미결선 상태에서 기존 편집기 저장·상태 표시가 그대로인지 — `SaveStatus.tsx` 변경(`data-alert-key`·`aria-busy`·`useState` 1개)이 기존 상태 글자·낭독·포커스를 바꾸지 않는지 코드·기존 테스트로 판정. 특히 `aria-busy`를 상태 글자 `<p>`에 둔 것이 스크린리더 상태 알림(`role=status`)을 억제하지 않는지(aria-busy 동안 live region 낭독 보류 가능성) 판정.
2. **변이(임시)** — 매번 `git checkout -- app/`:
   - LV-1: `watchSaving` slow 타이머 제거 → U4 FAIL / 추가 save 제출 허용 → FAIL
   - LV-2: 포기 토큰 비교 제거(늦은 결과 반영) → U5 FAIL / 토큰 격리 깨기 → FAIL
   - note 1: discard 진입 mark를 connect 뒤에 잡기 → FAIL
   - note 3: `safely()` 제거 → reject 테스트 FAIL
   - CP3: 재마운트 재발화 가드 제거 → FAIL
3. **MC I7 변경 안전성**: 포기 뒤 늦은 discard 결과가 doc·바인딩·epoch·mark를 바꾸지 않음 + 포기 뒤 save가 폐기 대상 초안을 되살리지 않음(CE-1·CX-3 의미) — 코드 추적 + 필요 시 임시 테스트(삭제).
4. **note 3 잔여 위험**: `core.link` 경유 confirm·`core.discard()`가 connect 실패 시 reject — 현재 호출처 0인지, L3·L4가 catch해야 할 위치 목록을 정리.
5. **실브라우저(짧게, 회귀)**: `npm run build` + `npx vite preview --host 127.0.0.1 --port 4374 --strictPort`(포트 확인). 편집→"이 브라우저에 저장됨"→새로고침 복원→`/projects`. 콘솔·네트워크 오류 0, 상태 글자 정상. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·리슨 0. 영환님 창·main 5480 무접촉. 막히면 BLOCKED.
6. **fresh 게이트**: `typecheck`·`lint`·`npm test -- --run`(기대 326/2924)·`build`(REPORT 0절 128.63/129.95 대조, 상한 안). 기존 테스트 수정·삭제는 `saveCore.modes.test.ts` 1줄·`bundleBudget.test.mjs` 기대값 외 0인지, 그 1줄이 완화가 아닌지.

## 제외
- 앱·테스트 수정 커밋 금지. push·원격 쓰기·다른 워크트리·Codex 금지.

## 산출물
- `dev/active/rs6-l2-liveness/QA-REPORT.md`: 0. 판정(PASS / PASS with notes / FAIL) 1. 변이 표 2. 동작 변화·접근성 판정 3. I7 안전성 4. note 3 잔여 목록 5. 실화면 6. 게이트 7. 사실/추정/미확인 · L3에 넘길 것
- `QA-PROGRESS.md`. 로컬 커밋은 이 두 파일·`qa-shots/`만(명시 경로).
- 첫 3턴 QA-BRIEF·QA-PROGRESS 커밋. 40턴부터 마감. 최대 50턴.
서브에이전트 분할: 불필요(변이 순차).
