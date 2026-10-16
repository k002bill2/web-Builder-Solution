# RS5-INTEGRATE-PLAN PROGRESS

범위: 저장 코어 ↔ 제품 연결 **설계·계획만** (코드 0 · ADR/예산/SPEC/CONTRACT-5/UX-5/BACKLOG 수정 0 · push 0 · Codex 0).

## 체크리스트
- [x] P0 BRIEF·PROGRESS 커밋 (`411f9ea2`)
- [x] P1 코드 trace — 서브에이전트 ① 코어 API·불변식 ↔ 제품 저장 경로
- [x] P1 코드 trace — 서브에이전트 ② 편집기 생명주기·스케줄러·pendingWrites·CP4
- [x] P1 코드 trace — 서브에이전트 ③ 예산 실측 기록·진입 closure
- [x] P2 설계 입력 읽기 (CONTRACT-5·UX-5·SPEC-4·rs5-review·rs5-spike·save-core-* REPORT)
- [x] P3 `docs/design/restart/INTEGRATE-6.md` — 경계표·BD-1·LV·H4·CP4·UX 대응·예산·AC
- [x] P4 `docs/04-plan/RS6_INTEGRATE_PLAN.md` — 레인 분할·순서·QA 게이트·시간 추정
- [x] P5 `docs/design/restart/MQ-6.md`
- [x] P6 자체 검토 1회 (금지 경로 diff 0 · `git diff --check`)
- [x] P7 `REPORT.md` + 최종 커밋

## 로그
- 2026-10-17 시작. base `c7a7a2a8`.
- P1 서브에이전트 3개(읽기 전용, Explore) 병렬 기동. P2 메인 직접 읽기 완료: MINIMAL-CONTRACT·save-core-fix/final-qa REPORT·saveCore.ts·CONTRACT-5·UX-5·SPEC-4 5.3~5.6/8.4/9·rs5-review·rs5-spike.
- ③ 완료: main `/studio` 정규화 128.09/128.53(여유 0.44) · raw 129.40/130(여유 0.60). CP4 조합+a 129.33(+0.80)/130.70(+0.70). rs5-spike S5a-r +417B·S5b +753B(raw, preload-slim 이전 base — 재측정 필요). memoryDocBook·localSync·writeQueue = 조작 뒤 청크, useDocSave·useAutosaveScheduler·memoryProjectRepository = 진입.
- ①② 완료 → INTEGRATE-6 6절 통합, 초안 커밋 `48dba959`. 계획·MQ-6 작성. 자체 검토 1회(정정 3건). 금지 경로 diff 빈 출력. REPORT 작성.
- advisor 마감 검토 반영 4건(I6 G1·8.1·AC-U1·D6-3·D6-9 · MQ-6-7 제거 · L0 선행 조건). `32231e14`는 G1만 담긴 부분 커밋 — 나머지는 다음 커밋.
