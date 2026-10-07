# PERSIST-P1a-2 마감 브리프 (BRIEF-F) — 실측 우선 · 예산 적용 · Codex P2×2

- 같은 worktree `persist-p1a2`, HEAD `a768adb`(구현 `c931073` + main 병합: ADR-004 **개정 10** — 영속 진입 몫 기준선 상한 129.60 · 한도 130 · 멈춤선 129.70). 앞 레인 REPORT·PROGRESS를 먼저 읽을 것.
- 영환님 ★A(2026-10-07). Codex r1 원문 `dev/active/persist-p1a2/codex-r1-jarvis.txt`.

## 순서 (실측을 먼저 — 앞 레인은 Ego Lite를 시간 부족으로 못 끝냄)
1. **Ego Lite 새로고침 생존 실측(먼저, 25턴 전 결과 커밋)**: 현재 코드로 build(예산 실패여도 dist는 생성되는지 확인 — 안 되면 `npx vite build`+`vite build --mode render`+썸네일 단계만으로 dist 생성, 방법 기록) → `vite preview --port 4337`. 창 minimized면 `Browser.setWindowBounds normal`, 캡처 `captureBeyondViewport:false`+clip ≤4장(`dev/active/persist-p1a2/shots/`).
   - 시나리오: `/catalog` 카드 → **상세 페이지의 "비교 추가"**(카드 호버 버튼 대신) → 보드 → 프로필 확정 → 3안 → 편집 시작 → 섹션 1개 편집 → "이 브라우저에 저장됨" 확인 → 스냅샷 1개 저장 → **새로고침(허용, 횟수 기록)** → `/studio/:projectId` 직접 진입 시 편집 유지 · 스냅샷 대화상자 목록(현재 결함이면 그대로 기록 — 3에서 고침) · 앱 안 이동으로 `/projects` 목록 유지 · DB v1→v2 업그레이드 관찰.
   - 끝나면 `indexedDB.deleteDatabase("design-studio")` 결과 기록 → `finish({keep:[]})` · `listTaskSpaces()`=[] · 서버 종료·리슨 0.
2. **감량 1회 + 예산 적용**: 측정 안 한 후보(진입 봉투 확인 인라인 · memoryDocBook 미리받기 목록 축소 등) 1회 실측 → `check-bundle-size.mjs` `/studio/:projectId` `eagerBudgetKb` 130 + `m2cBaseline.json` 기준선 = 실측(상한 **129.60**, 넘으면 멈춤) + `bundleBudget.test.mjs` 고정값 — **한 커밋**("ADR-004 개정 9·10 배분 P1a", 판정 로직 변경 0). 이후 `npm run build` exit 0.
3. **Codex r1 P2 2건(TDD, Codex 재현 순서를 회귀 테스트로)**: ① 저장 실패 연속(A 실패 → B 실패 → B 재시도)에서 보정 요청의 원래 revision과 멱등 키를 연결해 재시도가 STALE_DOC로 거부되지 않게 ② `/studio` 직접 진입 뒤 쓰기 전 `listSnapshots()`가 진입 레코드의 스냅샷을 반환(또는 DocBook 시드 대기). 진입 번들 증가 시 기준선에 포함(상한 129.60).
4. 1에서 스냅샷 결함을 봤다면 3 뒤 **스냅샷 목록만 Ego Lite 재확인 1회**(같은 절차·DB 삭제·창 닫기).

## 마감·금지
- typecheck·lint·build exit 0 · 전체 vitest 1회 exit0 · REPORT에 "마감(BRIEF-F)" 절(실측 결과·감량 결과·기준선 커밋·Codex 수정). **Codex 실행 금지(Jarvis 몫)**.
- TDD 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0. 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, P1b~P1d 범위 0. 서브에이전트 0, push/merge/삭제 0(테스트 IDB 삭제는 허용), 승인 실패 우회 금지. main 5480·영환님 창 무접촉.
- **턴 관리:** 1번 결과 커밋 25턴 전, 2번 커밋 40턴 전, 50턴부터 새 수정 중단 → 게이트 → REPORT. REPORT 초안 55턴 전 커밋. 한국어.
