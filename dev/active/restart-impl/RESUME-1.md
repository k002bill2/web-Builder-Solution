# RESTART-IMPL RESUME-1 — SPEC r2 반영 재개

- 이 브랜치의 미승인 커밋 `5aeb045`(저장소 잠금 확인 — Codex가 결함 없음 확인) · `7e8ace8`(화면 WIP)을 이어서 쓴다. 정본 = main의 `docs/design/restart/SPEC.md` **r2** + `MQ.md` 결정(S1·S2·S3·S4·S5·**S6 A·S7 A**).
- 시간 상한 90분 · 최대 100턴. 공통 제약 BRIEF.md 그대로(포트 4359 · TDD · 단언 약화 0 · amend·rebase 금지 · `set -o pipefail`).
- 병렬: SAVE-ON-LEAVE(Developer — `StudioLayout.tsx`·`useDocSave.ts`·`useAutosaveScheduler.ts`·`m2cBaseline.json` 수정 중) · GEN-MARK-2-SPEC(문서). 이 레인은 그 앱 파일들 수정 금지. `m2cBaseline.json`은 이 레인도 갱신할 수 있으나 병합 때 Jarvis가 합산 실측으로 정리.

## 순서 (체크포인트마다 커밋·PROGRESS)
1. `git merge --no-ff main`(SPEC r2 포함 최신 main) → 충돌 해소 → 게이트 빠른 확인.
2. SPEC r2 3.3.1 실패 판정 순서(모든 restart 실패에 먼저 `getDoc` 커밋 확인 → R-E4 / 음성일 때만 코드·사유 / 확인 실패 R-E5) · RS-AC-07·07b·07c·08b·08d(미확인 기억).
3. P2 반영: STALE 재판정(RS-AC-06b · R-E1b) · create 멱등 재생 뒤 재판정(RS-AC-17 · R-C3) · R-D2 문구 · 성공 state `{editNotice}`만(RS-AC-18) · RS-AC-01 셋업 · 스냅샷 id 집합 단언(RS-AC-04·08b·10·11).
4. **MQ-S7 A 배치 변경**: 클릭 때 `loadProjects`·restart 청크 `Promise.all`, create 결과 판정 전체 = 조작 뒤 청크. `/profile` 진입 직후 두 시나리오 ±0.03(수동 판정 — 빌드 출력). `/studio`·복원 각각 ≤ +0.05(→ 기준선 갱신 필요 시 자기 몫 안). 넘으면 감량 1회 → 멈추고 수치 보고.
5. 게이트 4종 → Codex `review --scope branch --base main`(병합 후 main 해시) 최대 2라운드.
6. Ego RS-AC-14(1280·1024·390 캡처) · RS-AC-15 실흐름 1회 — 경로 `dev/active/field-undo-1/qb-flow.mjs` 참고. 캡처 PNG 바이트 기록 · 정리 규칙 BRIEF 그대로.
7. REPORT에 "RESUME-1" 절(RS-AC별 결과 표 · 예산 · Codex · Ego · SPEC과 다르게 한 것) · BACKLOG B-ER-01 행 갱신.
- 체크포인트 턴: ① 8 ② 35 ③ 55 ④ 65 ⑤ 80 ⑥ 92 마감 · 95부터 REPORT만.
