# RESTART-SPEC-R2 Designer 브리프 — SPEC r1 → r2 (Codex 재검증 P1 1 · P2 8 반영)

- 역할 Designer / Orca managed Claude Code / worktree `restart-spec-r2` / base main `9d5076e`. **코드 0** — 수정 대상은 `docs/design/restart/SPEC.md`·`MQ.md`와 `dev/active/restart-spec-r2/{PROGRESS,REPORT}.md`뿐.
- 입력(읽기 전용, 다른 worktree): `/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/dev/active/restart-impl/REPORT.md`(2·3·4·7절) · `.../restart-impl/dev/active/restart-impl/logs/codex-spec-result.md`(Codex 원문) · 미승인 구현 코드 `.../restart-impl/app/src/features/profile/{RestartDialog,CandidatesSection,restartText}.tsx/ts`·`app/src/data/persistence/localSync.ts`(참고만 — 구현 맞추기용 SPEC 수정 금지, 맞는 설계를 정하고 구현이 따라오게).
- 해야 할 것:
  1. **P1**: 쓰기 전 실패(R-E3)와 커밋 뒤 미확인(R-E4)을 구분하는 계약을 정한다 — 선택지(실패 뒤 `getDoc`으로 문서 확인 절차 / 저장소 오류에 단계 정보 추가(계약 변경) 등)를 MQ로, ★는 저장소 인터페이스·스키마 불변 안 우선. RS-AC-07·08b 문장 정정.
  2. P2-2(R-E4 뒤 편집기 열기·미확인 쓰기 인계, 3.3 문장 충돌) · P2-3(STALE_DOC 갱신 뒤 F2~F4 재판정) · P2-4(create 멱등 재생이 F3 우회) · P2-5(R-D2 "마지막 저장" 의미) · P2-6(R-N1 접힘 낭독) · P2-7(RS-AC-01과 F4 모순 — 기존 테스트 셋업 변경 허용 문장) · P2-8(스냅샷 "+1" 단언과 멱등·20개 보존) · P2-9(RS-AC-13을 ADR-004 개정 15 배분 문장으로).
  3. **예산**: 실측 `/profile` 진입 직후 120.00 → 120.36(+0.36, 한도 125) · `/profile` 첫 화면 변화 0 · `/studio` +0.03(배분 0.05 안). RS-AC-13의 "±0.03"을 유지할지(배치 변경 필요 — 어디를 조작 뒤로 옮길지 구체 제시) 또는 한도 125 안 상한(예: ≤ +0.40)으로 바꿀지 MQ로 — ★ 근거 포함. 한도 상향은 선택지에 넣지 않는다.
  4. 구현 레인 RS-D4~D8(REPORT 7절)을 SPEC에 수용할지 각각 판정해 반영.
  5. SPEC 변경 이력 r2 · MQ에 새 질문(MQ-S6~) · Codex `codex-companion adversarial-review`로 r2 문서 1회 재검증(P1이면 다시 고치고 1회 더, 최대 2회).
- 공통: ADR-003·기존 SPEC 문체·수용 기준 ID 유지(새 ID는 덧붙임). 근거는 파일:행. push/merge 0 · amend·rebase 금지 · 첫 3턴 PROGRESS 커밋 · 시간 상한 60분 · 30턴부터 REPORT만. 서브에이전트 분할: 불필요.
