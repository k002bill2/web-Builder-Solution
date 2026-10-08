# P1C-D2 Developer 브리프 — 쓰기 잠금(Web Locks) + 최신성 확인

- 역할 Developer / Orca managed Claude Code / worktree p1c-d2 / base `d4a0ee5`(P1C-SPEC 병합 + ADR-007 개정 2). `app/node_modules` lock 그대로 `npm ci` 완료. **병렬 레인 P1C-D3(`/projects` 저장소 영역)이 동시에 돈다 — 쓰기 파일 겹침 0: 이 레인은 `app/src/data/persistence/**`·`localSync` 계열·관련 테스트만. `ProjectsPage`·`/projects` 컴포넌트·문구 파일 손대지 말 것.**
- 정본: `docs/design/persistence/P1C-SPEC.md` **1.5(잠금 규칙·화면 표) · INFRA 사유 3종 · 세대 번호(`meta`) · 3절 번들 · 4절 AC-C01·C02·C14·C09 · 6절 D2 행**, `P1C-MQ.md`(C2 A: 첫 편집 때 잠금 + 잡은 직후 최신성 확인 · C3 A: steal 없음), `docs/decisions/ADR-007-local-persistence.md` 개정 2, `dev/active/persist-p1a2/REPORT.md`·`persist-p1b/JARVIS_FINAL.md`(싱크 구조).
- BroadcastChannel `saved`/`cleared` 알림과 지우기는 **D4 몫** — 이번엔 하지 않음(인터페이스 자리만 필요하면 최소).

## 범위 (2건)
1. **쓰기 잠금**: `navigator.locks`로 프로젝트(또는 SPEC이 정한 단위) 쓰기 잠금을 **첫 편집(쓰기 경로) 때** 획득 — 진입에서 잡지 않음. 잠금을 못 잡은 탭 = 읽기 전용: 쓰기 0, 저장 상태는 SPEC 1.5 표의 기존 신호("저장하지 못했습니다" 계열 INFRA 사유)로. `navigator.locks` 미지원 처리 = SPEC [확인 필요] 항목 — 코드에서 확인해 가장 안전한 쪽(단일 탭 가정 vs 쓰기 차단)을 고르고 근거 REPORT. 탭 닫힘·언로드 시 잠금 자연 해제.
2. **최신성 확인(세대 번호)**: `meta`에 세대 번호 — 쓰기 커밋마다 증가. 잠금을 잡은 직후 IDB 세대와 이 탭이 읽은 세대를 비교해 낡았으면 덮기 0 + INFRA 사유(낡은 탭) — SPEC 문구 그대로. 회귀 테스트: 탭A 진입 → 탭B 진입·편집·저장·닫기 → 탭A 편집 = 쓰기 0 · 낡은 탭 사유.

## 검증
- TDD(예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지 — 깨진 커밋은 후속 커밋**). 메모리 가짜 + `navigator.locks` 가짜(테스트 전용)로 AC-C01·C02·C14 · aria-live(C09)는 기존 SaveStatus 경로 재사용 확인.
- 번들 관문: `/studio` **129.62 그대로**(진입 몫 0) · 복원 진입 132.65±0.03 · 다른 라우트 한도 안. 넘으면 멈추고 보고.
- **Ego Lite(탭 2개 실측, 핵심 증거)**: build + `vite preview --port 4337`(dev 금지), 창 minimized면 `Browser.setWindowBounds normal`, 캡처 `captureBeyondViewport:false`+clip ≤4장(`dev/active/p1c-d2/shots/`). 같은 taskSpace 안 탭 2개로 같은 프로젝트 → 먼저 편집한 탭이 저장 · 다른 탭 편집 = 읽기 전용 신호 · 낡은 탭 시나리오. 끝나면 `indexedDB.deleteDatabase("design-studio")` 결과 기록 → `finish({keep:[]})` · `listTaskSpaces()` 결과 기록(병렬 레인 D3의 공간은 건드리지 말 것 — 자기 공간만 닫기) · 서버 종료·4337 리슨 0. 영환님 창·main 5480 무접촉.
- 마감: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. **Codex는 Jarvis 몫 — 하지 말 것.**

## 금지·운영
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, D1·D3·D4·D5 범위 0. 서브에이전트 0, push/merge/삭제 0(테스트 IDB 삭제 허용), 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: 1번 커밋 25턴 전, 2번 35턴 전, Ego Lite 40턴 전 시작, 48턴부터 새 구현 중단 → 게이트 → REPORT. REPORT 초안 52턴 전 커밋. 한국어.
