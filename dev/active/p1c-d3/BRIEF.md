# P1C-D3 Developer 브리프 — `/projects` "이 브라우저 저장소" 영역 (상태 문장 · 사용량 · persist 버튼 · 강등 판정)

- 역할 Developer / Orca managed Claude Code / worktree p1c-d3 / base `d4a0ee5`(P1C-SPEC 병합 + ADR-007 개정 2). `app/node_modules` lock 그대로 `npm ci` 완료. **병렬 레인 P1C-D2(쓰기 잠금)가 동시에 돈다 — 쓰기 파일 겹침 0: 이 레인은 `ProjectsPage`·새 영역 컴포넌트(지연 청크 권장)·사용량 포맷 순수 함수·관련 테스트만. `app/src/data/persistence/**`·`localSync`는 읽기만(수정 필요하면 멈추고 REPORT에 요청).**
- 정본: `docs/design/persistence/P1C-SPEC.md` **2절(영역 1~3줄: 상태 문장 · 사용량 · persist 버튼) · 1.2 W1(ProjectsPage:27 "새로고침하면 프로젝트가 사라집니다(서버 연결 전)") · 1.7 강등 판정 · 1.8 newer 문장 · 3절 번들 · 4절 AC-C07·C10·C15·C12(W1) · 6절 D3 행**, `P1C-MQ.md`(C1 A 사유는 이 영역 · C4 A persist는 버튼 누를 때만 · C5 A 사용량은 이 영역만), ADR-007 개정 2·3절 용량·축출.
- 브랜드: 기존 앱 토큰·컴포넌트 재사용, APFS 로고·`--apfs-*` 금지, 새 아이콘·새 의존성 0.
- 지우기 버튼·대화상자는 **D4 몫**(영역 안 자리만 SPEC대로 비워 두거나 표시 안 함 — SPEC이 정한 쪽).

## 범위 (2건)
1. **영역 + 사용량 + persist**: `/projects`에 SPEC 2절 영역 — 상태 문장(로컬 저장 중 / 메모리 모드 / 강등 사유), `navigator.storage.estimate()` 사용량 "약 N MB"(SPEC 단위·반올림 규칙 그대로, 순수 함수 + 단위 테스트), "자동 삭제 막기 요청" 버튼(`persist()` 누를 때만, 결과 문장 SPEC대로, 이미 persisted면 상태 문장). W1 문구 교체. 영역은 지연 청크 권장 — `/projects` 125 한도 안.
2. **강등 판정 표시(1.7·1.8)**: 저장소 불가(IDB 없음·사설 모드·축출·할당량 초과)와 newer(저장 버전 > 앱) 문장을 영역에 — 판정 입력은 기존 진입 읽기 결과/persistence 상태를 **읽기만**(D2 파일 수정 0). 판정이 persistence 쪽 신규 값이 필요하면 멈추고 REPORT에 인터페이스 요청.

## 검증
- TDD(예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지**). 사용량 포맷 경계값(0·소수·1024 경계) · persist 버튼 결과 3종 · 강등 문장 · W1 옛 문구 고정 테스트 갱신(C12).
- 번들 관문: `/projects` ≤125 · `/studio` 129.62 그대로 · 복원 진입 132.65±0.03. 넘으면 멈추고 보고.
- **Ego Lite**: build + `vite preview --port 4339`(dev 금지), 창 minimized면 normal, 캡처 `captureBeyondViewport:false`+clip ≤3장(`dev/active/p1c-d3/shots/`): 빈 `/projects`(W1 새 문구) · 프로젝트 1개 뒤 영역(사용량) · persist 버튼 결과. 끝나면 `indexedDB.deleteDatabase("design-studio")` → `finish({keep:[]})` · 자기 공간만 닫기(병렬 D2 공간 무접촉) · 서버 종료·4339 리슨 0. 영환님 창·main 5480 무접촉.
- 마감: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. **Codex는 Jarvis 몫.**

## 금지·운영
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, D1·D2·D4·D5 범위 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: 1번 커밋 25턴 전, 2번 35턴 전, Ego Lite 38턴 전 시작, 45턴부터 마감, REPORT 초안 50턴 전 커밋. 한국어.
