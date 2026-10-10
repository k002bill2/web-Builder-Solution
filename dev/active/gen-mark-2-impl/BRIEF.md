# GEN-MARK-2-IMPL Developer 브리프 — 비교 열 머리 표식 · buildNote 숨김 · 라이선스 한국어 표기 (B-GM-01·02·03)

- 역할 Developer / Orca managed Claude Code / worktree `gen-mark-2-impl` / base main `3706c22`.
- 정본: `docs/design/gen-mark/SPEC-2.md` r1 + `MQ-2.md` 결정 기록(MQ-GM2-1~4 전부 A). 수용 기준 SPEC-2 7절 전부(GM2-AC-*·G*·E*). `/profile`(`ProfileValues`)은 범위 밖(MQ-GM2-4 A).
- 예산(엄격 · SPEC-2 8절·G2): **새 공유 청크 0**(기존 `SourceTags` 청크 합류). 같은 머신에서 base `3706c22` 빌드와 head 빌드를 비교해 라우트별 증감을 표로. 판정: `/catalog` 첫 화면 ≤100.90 · `/references` ≤100 · `/compare` 첫 화면 ≤100 · `/profile` 첫 화면 ≤100 · `/studio`·복원 진입은 `m2cBaseline` 판정선 안(현재 129.84+0.03 · 132.87+0.03). **`m2cBaseline.json`·`bundleBudget.test.mjs` 수정 금지** — 판정선을 넘으면 멈추고 수치 보고.
- 병렬: RESTART-IMPL(Developer — `features/profile/*`·`data/*`·`scripts/check-bundle-size.mjs`·`m2cBaseline.json` 수정 중). 이 레인은 그 파일들 수정 금지.

## 순서
1. P0 PROGRESS 커밋(3턴 전).
2. MQ-GM2-3 A 표시 맵(자체 제작/이용 허락/외부 관찰 · 접두 `라이선스: `) — 맵 위치는 SPEC-2(closure 무접촉 — `catalogFilters.ts`·`referenceDisplay.ts` 금지). 표시 5곳 중 범위 4곳(SourceTags · ColumnHeader · FilterRail label · CatalogPage 부제). 데이터·필터 id·URL 영문 유지 단언.
3. MQ-GM2-1 A ColumnHeader → SourceTags 재사용(래퍼 배치 계약 SPEC-2 3.1 · 뷰 모델 `sourceKind`).
4. MQ-GM2-2 A 생성 조합 상세 메타에서 buildNote 제외.
5. 게이트 4종 + base/head 예산 표 → Codex `codex-companion review --scope branch --base 3706c22` 최대 2라운드.
6. Ego Lite(포트 4365): SPEC-2 E 기준(비교 보드 1280·1024·390 · 좁은 열·긴 업종명·withdrawn 열 · 상세 생성 조합 buildNote 없음 · 카탈로그 한국어 Tag) 캡처(뷰포트 clip·PNG 바이트) · 정리(IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·리슨 0). 영환님 창·main 5480 무접촉.
7. BACKLOG B-GM-01~03 행 끝 결과 · REPORT(한국어: AC별 결과·예산 표·Codex·Ego·남은 것).

## 공통 제약
- 시작 `cd app && npm ci`(lock 변경 0). TDD(RED 예측·결과) · RED만 있는 tip 커밋 금지 · SPEC 명시 외 기존 단언 약화 0(GM-AC-U3 낭독 문자열 변경은 SPEC-2 명시분만) · amend·rebase 금지 · `set -o pipefail`.
- 엔진 계약·저장 스키마·lock·CLAUDE.md·design/·ADR 수정 0. 새 의존성 0. push/merge/삭제 0. 승인 실패 우회 금지. 서브에이전트 분할: 불필요.
- 시간 상한 75분 · 최대 80턴 · 체크포인트 ② 20 ③ 35 ④ 40 ⑤ 55 ⑥ 70 마감 · 72부터 REPORT만.
