# ER-3b Developer 브리프 — 스냅샷 화면 (ER-AC-S3·S4·S6~S10)

- 역할 Developer / Orca managed Claude Code / worktree er-3b / base `45a5721`(ER-2 테마 바꾸기 · ER-3a 스냅샷 저장소 · ADR-004 개정 5 적용). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/editor-rest/SPEC.md` r1 3.2·5.2(S3·S4·S6~S10)·6~9절, `docs/04-plan/EDITOR_REST_PLAN.md` 2절 ER-3b 행(쓰기 경로)·3·4절, MQ.md R1-A(탭 메모리 스냅샷). 저장소 계약 = `dev/active/er-3a/REPORT.md`(createSnapshot·restoreSnapshot·resolveConflict 한 트랜잭션).
- 핵심: 복원은 `docOpRun` 일반 연산이 아니라 **저장 훅(`useDocSave`) 경로** — revision·스케줄러 동기화로 다음 저장이 `STALE_DOC`가 되지 않게. 미리보기 중 자동 저장 0회. 이미지 `retainedIds` 참조 집합 확장 뒤 E-AC-45~47 회귀 0. 충돌 화면(B-ER-02)이 저장소 `resolveConflict`로 실제 동작하는지 연결 확인.

## 규칙
- 쓰기 = PLAN 2절 ER-3b 행만. 새 UI(대화상자·미리보기)는 **조작 뒤 청크**, StudioLayout에는 연결선만(자기 코드는 새 파일).
- **번들**: ADR-004 개정 5 — `/studio` 진입 현재 127.69, **판정선 128.43(초과 시 즉시 멈춤, 추가 빌드 시도 금지)**. ER-3b 몫 목표 ≤0.35(ER-4 몫 남김), 0.35 초과 시 REPORT 첫 줄. 다른 화면 ±0.03(개정 5 결정 3 근거 기록 시 ±0.05), 렌더 변화 0. 기준선 파일·검사기 수정 0.
- TDD: 단계별 RED 전 새 테스트 수 예측은 **PROGRESS에 기록**(RED 테스트를 tip에 커밋 금지) → RED 로그 `dev/active/er-3b/logs/` → GREEN 커밋. 단언 약화·skip 0. SPEC 6절 목록 밖 테스트 깨지면 멈춤. BRIEF P0 명시 커밋.
- 접근성: 대화상자 포커스 진입·닫힐 때 복귀, **동작 뒤 사라지는 버튼에서 포커스 유실 금지**(ER-2 Codex 지적 유형 — 사라지면 유지되는 컨트롤로), 좁은 폭(<1024) 탭·분할 배치에서 대화상자 1개만 렌더(ER-2 지적 유형) — 각각 테스트로 고정.
- **Ego Lite(영환님 지시):** `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 금지). 경로 A(카탈로그 ref-e·밝은 카드 → 3안 → 편집 시작)로 문서 → 스냅샷 만들기 → 편집 → 스냅샷 미리보기 → 복원 → 다시 편집·저장 표시 → 정적 HTML 내보내기를 1280·390 실제 화면 확인·캡처 `dev/active/er-3b/shots/`. 첫 goto 1회 뒤 앱 안 클릭만·새로고침 금지. 시작 전 `listTaskSpaces()` 확인(space id 직접 기입). 끝나면 이 레인이 연 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 엔진·PageDoc 계약 변경 0, `app/src/data/**` 인터페이스 변경 0(필요하면 멈춤), docs/**·scripts·package*.json/lock·CLAUDE.md 수정 0, 새 의존성·아이콘 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리(엄격):** 45턴 도달 시 새 구현 중단 → Ego Lite → 전체 vitest → Codex → REPORT. REPORT는 마지막 5턴 전에 반드시 커밋(PROGRESS 체크와 REPORT 실제 내용 일치 확인). 마감: 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회), Codex review --scope branch --base 45a5721 실제 완료(≤2), REPORT(AC 판정·번들 표·깨진 테스트 대조·Ego Lite/창 닫힘·meta).
