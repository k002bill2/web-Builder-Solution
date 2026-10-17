# RS6-L2 BRIEF — liveness: 저장 감시 · discard 포기 토큰 + L1 QA 코어 notes (Developer, 구현)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-l2-liveness` (브랜치 `k002bill2/rs6-l2-liveness`, base origin/main `3a77c8eb` = L1 PR #18 머지). `app/node_modules` 설치 완료.
승인: MQ-6-3 A(취소 0 · 시간 제한은 표시 전환만 · 자동 재시도 0 · discard 포기 토큰 = MC I7 변경) · ADR-004 개정 17(상한 `/studio` 정규화 129.13 · 복원 132.11 · raw 130.5, 레인별 실측). Designer 생략 사유: 새 화면 없음 — 상태 키·`aria` 속성만, 문구 본문은 L4.

## 정본
- `docs/04-plan/RS6_INTEGRATE_PLAN.md` **3절 L2 표(CP1~CP3)**. 쓰기 경로는 PLAN 레인 표 L2 행.
- `docs/design/restart/INTEGRATE-6.md` r1 3절(LV-1·LV-2·공통 행) · 8.1 상태표 `saving-slow` · RS6-AC-U4·U5·U11.
- L1 결과: `dev/active/rs6-l1-port/REPORT.md`(7절 차이 · 8절 남는 일 — `view()` mark·inflight 복귀가 L2 몫), **`dev/active/rs6-l1-port/QA-REPORT.md` 0절 notes**.

## 범위
1. **CP1 LV-1 저장 감시**: 스케줄러가 save 시작 시각 기록 → `T_slow` 뒤 resolve 없으면 phase `saving-slow`(추가 save 제출 0 · 편집 계속 수용 · 해제 뒤 `newer` 처리). 코어 `view()`에 L1이 뺀 `mark`·`inflight`를 다시 붙여 `saving` 출처로(INTEGRATE-6 8.1 · 242행). RS6-AC-U4.
2. **CP2 LV-2 포기 토큰**: discard 진입 때 토큰, `T_discard` 뒤 resolve 없으면 `blocked{timeout}` · 가드 해제 · 늦은 결과 버림(doc·바인딩·epoch 불변). MC I7 문장 변경을 `saveCore.ts` 머리 주석에 기록. RS6-AC-U5 + 기존 CE-1·CX-3 회귀 GREEN.
   - **L1 QA note 1 같이 닫기**: discard 호출 뒤 connect가 풀리기 전 들어온 편집이 조용히 `discarded`되는 창 → 하네스 의미 `blocked{newer}`로(진입 배타를 connect 전 동기로 잡거나, connect 뒤 epoch/mark 재검사). QA-REPORT 4절 임시 재현 시나리오를 정식 RED 테스트로.
3. **CP3 `T_hang` alert 1회** · 레이아웃 재마운트 재발화 0. 문구는 **키만**(`saveStatusText.ts` 본문은 L4 소유) — 키 상수와 `role=alert`/`aria-busy` 결선만.
4. **L1 QA note 3**: `save()`·`confirm()`이 `port.mode()`·`port.verify()` throw로 reject될 수 있음 → try 안으로 넣어 항상 `failed{infra}` 등 결과로 돌려준다(거짓 saved 0 유지). RED 1건 이상.
5. **L1 QA note 4**: `dev/active/rs6-l1-port/HARNESS-MAP.md` 집계 정정(① 완전 25 + 부분 5, #12·#30 추가, #20 근거 0 명시) — 문서 정정만. 가능하면 부분 5건 중 discard·replace 관련 단언(#28 등)을 이 레인 테스트로 보강.
- **범위 밖**: L1 QA note 2(`restoreSnapshot`·`resolveConflict`·`startDoc(restart)` DocBook 직접 쓰기 revision 충돌)는 **L3 착수 전 조건**이다 — 이 레인에서 고치지 말고 REPORT "L3 전 조건"에 그대로 이월 기록. 편집기 배선·링크 이탈(L3), 문구 본문·충돌 UI(L4), `/projects`(L5) 금지.

## 시간 값 (MQ-6-3b)
- `T_slow`·`T_hang`·`T_discard`는 **상수 1곳**(파일 하나)에 두고 테스트는 가짜 타이머로 동작만 고정. 값은 **잠정값**으로 두고 주석에 "잠정 — QA 실측 뒤 Jarvis 결정(MQ-6-3b)"을 단다. 잠정값 근거(예: 기존 `memoryCompareBoardRepository.ts:122` 2초 선례)를 REPORT에.

## 규칙
- TDD: CP마다 RED 예측 → PROGRESS → RED 로그 `dev/active/rs6-l2-liveness/logs/` → GREEN 커밋. RED만 있는 tip 커밋 금지. 기존 단언 약화·skip 0. INTEGRATE-6 11절 목록 밖 기존 테스트가 깨지면 멈추고 보고.
- **예산(개정 17)**: CP마다 build 정규화·raw 기록. 진입 증분이 생기면 그 커밋에서 `m2cBaseline.json` `normEagerKb`·`eagerKb` + `bundleBudget.test.mjs` 기대값을 실측으로 갱신, note "개정 17 배분 RS6-L2". 감시 타이머·포기 토큰 판정이 진입 closure에 들어가면 증분 최소화(조작 뒤로 보낼 수 있는 것은 보냄). 남은 RS6 몫 0.58(정규화) 중 **L2 목표 ≤ 0.10** — 넘으면 감량 1회, 상한 초과 시 멈춤.
- 레코드 형식·`StudioPersistence`·엔진/PageDoc·스키마·의존성 변경 0.
- 서브에이전트 분할: 불필요(코어·스케줄러 순차 TDD, 같은 파일 공유).

## 마감
- fresh `npm run typecheck`·`lint`·`npm test -- --run`(base 322/2902 + 증분)·`npm run build`(전 라우트 번들 표).
- `dev/active/rs6-l2-liveness/{PROGRESS,REPORT}.md`: AC 판정(U4·U5·U11 L2 몫) · L1 QA note 1·3·4 처리 · "L3 전 조건"(note 2 이월) · 시간 잠정값 · 예산 표 · MC I7 변경 문장 · 사실/추정/미확인.
- 명시 경로 커밋, amend·rebase 금지. push·merge·원격 쓰기·Codex·다른 워크트리·브라우저 0.
- 첫 3턴 BRIEF·PROGRESS 커밋. CP1 25턴 전 · CP2 50턴 전 · 70턴부터 새 구현 중단 → 게이트·REPORT. 최대 85턴.
