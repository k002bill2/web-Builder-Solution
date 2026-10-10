# SAVE-ON-LEAVE Developer 브리프 — B-RS-01 편집기 이탈 저장 미보장 (데이터 손실 경로)

- 역할 Developer / Orca managed Claude Code / worktree `save-on-leave` / base main `2ad7221`. 첫 3턴 PROGRESS 커밋 · 최대 90턴 · 75턴부터 게이트·REPORT만.
- 근거: BACKLOG B-RS-01 · `docs/design/restart/MQ.md` MQ-S5 · `StudioLayout.tsx:127-134`(이탈 시 `retry()`만, 완료 대기 없음) · `useAutosaveScheduler.ts:100-102,274-278`(저장 중 추가 편집이 unmount 때 버려질 수 있음). 원 지적: RESTART-SPEC Codex r1 P1.
- 목표: 앱 안 이동(편집기 → 다른 화면)으로 편집기를 떠날 때 **마지막 화면 편집까지 저장소에 반영된 뒤** 이동하거나, 반영 실패면 이동을 보류하고 기존 저장 실패 안내·"다시 시도" 흐름을 쓴다. 저장 중 추가 편집이 unmount에서 버려지지 않게(대기 중 편집 flush).
- 범위 밖: 브라우저 탭 닫기·새로고침(`beforeunload`) — 지금 동작 유지, REPORT에 현황만. 새 화면·새 문구는 최소(기존 저장 상태 문구 재사용 우선 — 새 문장이 필요하면 REPORT에 원문과 사유).
- Designer 생략 사유: 기존 화면 결함 수정·새 화면 없음.
- 예산 몫: `/studio` 진입·복원 각각 **≤ +0.15**.
- 테스트: RED — 저장 진행 중 추가 편집 → 앱 안 이동 → 저장소 문서에 마지막 편집 없음(현재 결함 재현) → GREEN. 실패 주입 시 이동 보류·안내 · 성공 시 이동 1회 · 연타 이동 요청 1회 · 읽기 전용 탭에서 이동 막지 않음(저장 0이 정상).
- Ego Lite(포트 4361, 짧게): 편집 → 즉시 "프로젝트" 등 이동 → 다시 열어 마지막 편집 유지 확인(3회) · 캡처 1장(PNG 바이트) · 정리(IDB 삭제·finish·listTaskSpaces·서버 종료·리슨 0). 경로는 `dev/active/field-undo-1/qb-flow.mjs` 참고.
- BACKLOG B-RS-01 행 끝 결과 표기.

## 공통 제약
- 시작 `cd app && npm ci`(lock 변경 0). TDD(RED 예측·결과 PROGRESS) · RED만 있는 tip 커밋 금지 · 기존 단언 약화 0 · amend·rebase 금지 · `set -o pipefail`.
- 예산(ADR-004 개정 15): 자기 몫 안에서만. 실측이 기준선 판정선(129.65·132.68)을 넘으면 `scripts/m2cBaseline.json` `eagerKb` 두 값과 `scripts/bundleBudget.test.mjs` 150-152행 기대값을 **실측값으로 같은 커밋에서** 갱신하고 note에 "개정 15 배분 <레인>" 한 줄. 몫 초과 → 감량 1회 → 그래도 넘으면 멈추고 보고. 병렬 레인과 json 충돌은 Jarvis가 병합 때 합산 실측으로 정리.
- 마감: typecheck·lint·build exit 0 · 전체 vitest 1회 · Codex `codex-companion review --scope branch --base 2ad7221` 최대 2라운드(P1·P2 반영) · REPORT(한국어).
- 엔진 계약·저장 스키마·lock·CLAUDE.md·design/·ADR 수정 0. 새 의존성 0. push/merge/삭제 0. 승인 실패 우회 금지. 서브에이전트 분할: 불필요.
- 병렬: SAVE-ON-LEAVE ∥ FU-BLUR ∥ RESTART-SPEC-R2(Designer 문서). SAVE-ON-LEAVE는 `useSectionOps.ts`·`opAfter.ts` 수정 금지, FU-BLUR는 `StudioLayout.tsx`·`useAutosaveScheduler.ts` 수정 금지.
- 시간 상한 90분.
