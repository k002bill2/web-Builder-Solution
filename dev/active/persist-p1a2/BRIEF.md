# PERSIST-P1a-2 Developer 브리프 — 진입 하이드레이션 · 저장 배선 · ADR-004 개정 9 적용 (새로고침 생존)

- 역할 Developer / Orca managed Claude Code / worktree persist-p1a2 / base `4c09dfa`(P1a-1 병합: `app/src/data/persistence/**` 어댑터·IDB·쓰기 큐, 배선 0). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/decisions/ADR-007-local-persistence.md`(3절 (a) · 5절 P1a 행 · 부록 Codex 제약 1~3 · 개정 1), `docs/decisions/ADR-004-performance-budgets.md` **개정 9**(한도 130 · 영속 진입 몫 기준선 상한 129.15 · 진입은 수제 schemaVersion만), `dev/active/persist-e0/E0.md`(배치 실측 — 안1-min이 최소), `dev/active/persist-p1a1/REPORT.md`("P1a-2로 넘기는 것" 6항 + Codex r1·r2 절의 한계).
- **범위는 문서·프로젝트 상태만.** 이미지(P1b)·다중 탭/Web Locks·"이 브라우저 데이터 지우기"·사용량(P1c)·스냅샷 보존·삭제(P1d)는 하지 않음. 이미지 자동 복원 진입 몫은 **P1b 몫으로 남겨 둠**(이번 레인 증가 측정에서 제외).

## 범위 (2건)
1. **배선 + 새로고침 생존**: 진입(`openForEntry`·`readEntryRecord` — E0 안1-min 배치)에서 StudioState(프로젝트·프로필·잡·보드 등)·진입 문서 하이드레이션 → 메모리 store 초기값. 조작 뒤 청크에서 `openIdbPersistence` + 쓰기 큐로 저장 경로(문서 저장·프로젝트/프로필/잡 변경) 기록. **SaveStatus "저장됨"은 큐 resolve(IDB 커밋 확인) 뒤에만**, 실패 → 기존 INFRA 저장 실패 흐름·재시도는 `retry(key)`. `persistence: "local"` + 문구 "이 브라우저에 저장됨". 생성 잡은 StoredJob 통째로(개정 1). 복원 데이터 검증은 **실제 저장소 상태 규칙과 1:1**(P1a-1 Codex 교훈) — 진입은 수제 schemaVersion만, zod는 조작 뒤.
   - P1a-1 한계 처리: 복제 실패 INFRA는 재시도 불가 실패로 다루고 문구 원인 일치(`infra.ts` 정리 허용), `stateOf` 규칙 이중화는 한쪽에서 export해 공유(가능하면).
2. **ADR-004 개정 9 적용**: `check-bundle-size.mjs` `/studio/:projectId` `eagerBudgetKb` 129 → **130** + `m2cBaseline.json` 기준선 128.55 → 실측(상한 **129.15**) + `bundleBudget.test.mjs` 고정값 — **한 커밋**("ADR-004 개정 9 배분 P1a"). 검사기 판정 로직 변경 0. 129.15 넘으면 구현 멈추고 보고. 다른 라우트 125 한도(`/compare`·`/profile` 진입이 같이 오름 — E0 +0.42~0.46) 초과 0.

## 검증
- TDD(예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0). 기존 메모리 경로 테스트는 jsdom(IDB 없음)에서 지금처럼 통과해야 함.
- **Ego Lite(영환님 지시, 이 레인의 핵심 증거)**: build + `vite preview --port 4337`(dev 금지), 창 minimized면 `Browser.setWindowBounds normal`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지). 시나리오 — 카탈로그 → 프로필 확정 → 3안 → 편집 시작 → 섹션 1개 편집·저장("이 브라우저에 저장됨" 확인) → **페이지 새로고침(이 레인에서는 새로고침 허용 — 생존 검증 목적, 횟수 기록)** → `/studio/:projectId` 직접 진입 시 편집 내용 유지 · `/projects` 목록 유지 · 생성 중 새로고침(가능하면) 뒤 완료. IDB 실측 항목(P1a-1 REPORT 2항): 첫 실행 v1 빈 DB → v2 업그레이드, 진입 연결 versionchange 닫기. 캡처 ≤4장(`dev/active/persist-p1a2/shots/`). **끝나면 이 레인이 만든 IndexedDB 데이터베이스 삭제**(테스트 데이터 잔존 0 — `indexedDB.deleteDatabase`, 결과 기록) → `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 마감: typecheck·lint·build(번들 표 전 행) · 전체 vitest 1회 exit0 · REPORT(번들 증가량 표 · Ego Lite 시나리오 결과 · 남은 P1b~P1d 입력). **Codex는 Jarvis 몫 — 하지 말 것.**

## 금지·운영
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, P1b~P1d 범위 0. 서브에이전트 0, push/merge/삭제 0(IDB 테스트 DB 삭제는 위 허용), 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 1번 구현 커밋 35턴 전, 45턴부터 새 구현 중단 → Ego Lite → 게이트 → REPORT. REPORT 초안 50턴 전 커밋. 한국어.
