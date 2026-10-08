# P1C-D4 Developer 브리프 — "이 브라우저 데이터 지우기" + 탭 간 알림(BroadcastChannel)

- 역할 Developer / Orca managed Claude Code / worktree p1c-d4 / base `a0bbede`(D2 쓰기 잠금·세대 번호 + D3 `/projects` 저장소 영역 병합). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/persistence/P1C-SPEC.md` **1.6(진입 위치·대화상자·흐름 1~5단계) · 1.5 BroadcastChannel `saved`/`cleared` · 3절 번들 · 4절 AC-C03·C04·C05·C06·C08 · 6절 D4 행**, `P1C-MQ.md`(C3 A steal 없음), ADR-007 개정 2·보충, `dev/active/p1c-d2/REPORT.md`·`JARVIS_FINAL.md`(잠금 구조 `writerLock.ts`·큐 도장), `dev/active/p1c-d3/REPORT.md`(영역 `BrowserStorageSection`·`storageCheck`).
- **D2가 남긴 함정(필수 처리)**: 같은 탭에서 편집(잠금 보유) → 앱 안 이동 `/projects` → 지우기 = Web Locks 재진입 불가로 자기 요청이 null → 거짓 alert "다른 탭에서 편집 중". → LocalSync/writerLock이 "이 탭이 writer인가"를 노출하고, writer면 **보유 잠금 안에서** 지우기 실행(또는 잠금 해제 → 즉시 재획득 경로 — 경합 창 없는 쪽). 회귀 테스트 필수.

## 범위 (2건)
1. **지우기**: D3 영역 안 "이 브라우저 데이터 지우기" 버튼(indexedDB 없음이면 숨김) + 네이티브 `dialog` 대화상자(SPEC 1.6 문구 그대로 · 열 때 포커스 "취소" · Esc 취소 · 바깥 클릭 닫기 0 · 닫히면 포커스 복귀 · 진행 중 `aria-disabled`+"지우는 중…"·Esc 무시 · P2 백업 문장 숨김). 흐름 1~5: 잠금(위 함정 처리) → `cleared` 전송 → 이 탭 연결 닫기 → `deleteDatabase`(onblocked·onerror 문장) → `sessionStorage` 1회 키 → `/projects` 새로고침 이동 → `role=status` "이 브라우저 데이터를 지웠습니다" 1회. 대화상자·지우기 본문은 **조작 뒤 청크**.
2. **탭 간 알림**: D2 싱크(쓰기 탭)가 커밋 뒤 `saved` 전송, 지우기 탭이 `cleared` 전송. 수신 측 동작은 SPEC 1.5 그대로(예: `cleared` 수신 탭은 쓰기 0·연결 닫기·SPEC 문장 — 편집기 안 문구는 MQ-C1 A로 기존 신호만). 수신 구독은 조작 뒤/싱크 청크에서 — 진입 몫 0.

## 검증
- TDD(예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지**). 같은 탭 지우기 회귀 · 다른 탭 writer 보유 시 alert · onblocked/onerror · 1회 status · `cleared` 수신 탭 쓰기 0 · 대화상자 포커스(C08).
- 번들 관문: `/studio` 진입 129.65(기준선 129.62 + 허용 0.03 **경계** — 이 레인은 `/studio` closure 진입 파일 변경 0이어야 함, 해시 잡음으로 넘으면 수치·원인 보고하고 멈춤) · 복원 진입 132.68 이내 · `/projects` ≤125.
- **Ego Lite(핵심 증거)**: build + `vite preview --port 4337`(dev 금지), 창 minimized면 normal, `captureBeyondViewport:false`+clip ≤4장(`dev/active/p1c-d4/shots/`). 시나리오: 프로젝트 1개(이미지 1장 — 스크립트 생성 단색 PNG) 만든 뒤 ① **같은 탭** 편집 → `/projects` → 지우기 → 성공·status 문장·`databases()` 결과 기록(AC-C05) ② 탭 2개: B가 편집 중일 때 A에서 지우기 → alert ③ B 닫은 뒤 A 지우기 성공 → (가능하면) 다른 열린 탭의 `cleared` 수신 동작. 끝나면 `indexedDB.deleteDatabase("design-studio")` → `finish({keep:[]})` · `listTaskSpaces()`=[] · 서버 종료·4337 리슨 0. 영환님 창·main 5480 무접촉.
- 마감: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. **Codex는 Jarvis 몫 — 하지 말 것.**

## 금지·운영
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, D1·D5·P1d·P2 범위 0. 서브에이전트 0, push/merge/삭제 0(테스트 IDB 삭제·앱의 지우기 기능 실측은 허용), 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: 1번 커밋 28턴 전, 2번 38턴 전, Ego Lite 42턴 전 시작, 50턴부터 새 구현 중단 → 게이트 → REPORT. REPORT 초안 54턴 전 커밋. 한국어.
