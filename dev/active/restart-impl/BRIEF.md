# RESTART-IMPL Developer 브리프 — 프로필 "새로 시작" UI (B-ER-01 · EQ-2 A)

- 역할 Developer / Orca managed Claude Code / worktree `restart-impl` / base main `9d5076e`.
- 정본: `docs/design/restart/SPEC.md` r1 + `MQ.md` 결정 기록(S1 A · S2 A · S3 A · S4 A · S5 A). 수용 기준 RS-AC-01~16 전부.
- 예산(ADR-004 개정 15): `/studio` 진입·복원 진입 증가 각각 **≤ +0.05**(MQ-S2 A 잠금 확인 몫). 사용 시 `scripts/m2cBaseline.json` `eagerKb` 두 값과 `scripts/bundleBudget.test.mjs` 기대값(150-152행)을 **실측값으로 같은 커밋에서** 갱신(note에 "개정 15 배분 MQ-S2" 한 줄 추가). `/profile` 첫 화면 ≤100(현재 99.90 — 대화상자·문구·대비 요약은 조작 뒤 청크 `PROFILE_AFTER_ACTION`, RS-AC-13). 넘으면 감량 1회 → 그래도 넘으면 멈추고 보고.
- 병렬 레인: FIELD-UNDO-2(Developer, `features/studio`·`ImageSlotField` — 이 레인은 그 파일들 수정 금지). 겹치는 파일이 꼭 필요하면 멈추고 보고.

## 순서
0. P0 PROGRESS 커밋(3턴 전).
1. **SPEC r1 Codex 재검증**: `codex-companion adversarial-review --scope branch --base 18e5e12`가 아니라 SPEC 파일 대상 리뷰(`docs/design/restart/SPEC.md`·`MQ.md`를 읽게 하는 review 명령)를 1회 — P1이 나오면 구현 전에 멈추고 보고, P2 이하는 REPORT 기록 후 진행. SPEC 문서는 수정하지 않는다(Designer 몫).
2. 저장소: MQ-S2 A — restart 경로만 `docs.start` 전 `gate.enter()` 잠금 확인, writer 아니면 INFRA(쓰기 0). 인터페이스·스키마 불변. RS-AC-08·08b·08c.
3. 화면: F3/F4 분기·대화상자·결과 문장·대비 한 줄(RS-AC-02~07·09~12). 기존 `<dialog>` 패턴(CompareDialog·SnapshotDialog) 재사용.
4. 게이트 4종 + 예산 → Codex `review --scope branch --base 9d5076e` 최대 2라운드.
5. Ego Lite(포트 4359): RS-AC-14(1280·1024·390 캡처) · RS-AC-15 실흐름 1회(경로는 `dev/active/field-undo-1/qb-flow.mjs` 참고). 캡처 뷰포트 clip·PNG 바이트 기록 · 정리(IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·4359 리슨 0). 영환님 창·main 5480 무접촉.
6. BACKLOG B-ER-01 행 끝 결과 표기 · REPORT(한국어: RS-AC별 결과·변경 파일·예산·Codex(SPEC 재검증 포함)·Ego 수치·남은 것).

## 공통 제약
- 시작 `cd app && npm ci`(lock 변경 0). TDD(RED 예측·결과 PROGRESS) · RED만 있는 tip 커밋 금지 · SPEC 명시 외 기존 단언 약화 0 · amend·rebase 금지 · `set -o pipefail`.
- 엔진 계약·저장 스키마·lock·CLAUDE.md·design/·ADR 수정 0. 새 의존성 0. push/merge/삭제 0. 승인 실패 우회 금지.
- 서브에이전트 분할: 권장(읽기 전용 — 저장소 restart·잠금 경로 조사 1 · 프로필 화면·대화상자 패턴 조사 1). 쓰기는 메인만.
- 시간 상한 90분 · 체크포인트: ① SPEC 재검증 10턴 전 ② 저장소 35턴 전 ③ 화면 65턴 전 ④ 게이트·Codex 80턴 전 ⑤ Ego 95턴 전 마감 · 100턴부터 REPORT만.
