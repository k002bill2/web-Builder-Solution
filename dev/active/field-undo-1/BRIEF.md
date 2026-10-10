# FIELD-UNDO-1 Developer 브리프 — B-ER-08 필드 편집 묶음 실행 취소 (1/2 — 필드)

- 역할 Developer / Orca managed Claude Code / worktree `field-undo-1`. 산출물: 코드·테스트 + `dev/active/field-undo-1/{PROGRESS,REPORT}.md` + `shots/`.
- 정본: `docs/design/field-undo/SPEC.md` r0 + `MQ.md` 결정 기록(F0 A·F1 A·F2 A·F4 A). **이 레인 범위 = FU-AC-1~12 · 14~16 · FU-QB-1·2**. FU-AC-13(MQ-F3 이미지 패널 기록)은 다음 레인 FIELD-UNDO-2 — 이번엔 손대지 않되, 4.5를 나중에 같은 경로로 붙일 수 있게 기록 함수 시그니처만 열어 둔다.
- SPEC 6절의 단언 2건(`StudioLayoutImages.test.tsx:111,125-128` · `UndoKeys.test.tsx:99,104-107`)만 6절 문장대로 바꾸고 무효화 단언은 끊김 경우로 옮겨 보존. 그 밖 단언 변경 0.
- 예산(ADR-004 개정 14): `/studio` 진입 증가 ≤ **+0.27**(→ ≤129.55) · 복원 진입 ≤132.58 · 기준선 파일 무변경. 진입엔 묶음 ref·호출·라벨 전달만, 타이머·IME·push는 조작 뒤 청크(`docEngine`)(SPEC 8.2). 넘으면 MQ-F4 A로 1회 더 이동 → 그래도 넘으면 **멈추고** 수치 보고.
- 체크포인트(턴 끊김 대비): ① 묶음·사슬(FU-AC-1~7) 커밋 ② 참조·거절·IME·탭(8~12) 커밋 ③ 단언 변경·예산(14~16) 커밋 ④ Ego FU-QB-1(1280·1024·390)·FU-QB-2 ⑤ 게이트·Codex·REPORT. 각 단계 뒤 PROGRESS 갱신.
- Ego Lite: build + `npx vite preview --host 127.0.0.1 --port 4355 --strictPort`. FU-QB-3(실제 한글 IME)은 이 레인 범위 밖 — REPORT에 "영환님 수동 1회 필요"로 남김.
- 서브에이전트 분할: 권장(읽기 전용 — 실행 취소 경로 코드 조사 1개 · 기존 테스트 영향 조사 1개, 동시 2개 이하). 파일 쓰기는 메인만.
- 턴: P0 3턴 · ① 30턴 전 · ② 55턴 전 · ③ 70턴 전 · ④ 85턴 전 마감 · 90턴부터 게이트·Codex·REPORT만 · REPORT 110턴 전.

## 공통 제약
- base main `b3f8894`. 시작 `cd app && npm ci`(lock 변경 0 확인).
- TDD: 수용 기준마다 RED 예측·결과를 PROGRESS에 → 실패 테스트 → GREEN. RED만 있는 tip 커밋 금지 · SPEC이 명시한 단언 외 기존 단언 약화 0 · amend·rebase 금지 · 명령 체인 `set -o pipefail`(앞 단계 실패 시 다음 단계 실행 금지).
- 마감 게이트: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · Codex `codex-companion review --scope branch --base b3f8894` 최대 2라운드(P1·P2 반영, 나머지는 REPORT 기록) · REPORT(한국어: 수용 기준별 결과 표·변경 파일·예산 실측·Ego 수치·SPEC과 다르게 한 것·남은 것).
- Ego Lite 캡처는 뷰포트 clip, PNG 바이트 수를 REPORT에 기록(손상 파일 금지). 정리: IDB `deleteDatabase("design-studio")` · 자기 공간 `finish({keep:[]})` · `listTaskSpaces()` 기록 · 서버 종료·포트 리슨 0. 영환님 창·main 5480·다른 레인 무접촉.
- 엔진 계약(`engine/contracts`)·저장 스키마·lock·CLAUDE.md·design/·ADR 수정 0. 새 의존성 0. push/merge/브랜치 삭제 0. 승인 실패 우회 금지.
- 병렬 레인: GEN-MARK-IMPL(포트 4353) ∥ FIELD-UNDO-1(포트 4355) ∥ RESTART-SPEC(Designer, 문서) — 쓰기 경로 분리. BACKLOG는 이 레인 항목 행만 수정.
