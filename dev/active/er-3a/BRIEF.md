# ER-3a Developer 브리프 — 스냅샷·충돌 저장소 메모리 구현 (ER-AC-S1·S2·S5 저장소 부분)

- 역할 Developer / Orca managed Claude Code / worktree er-3a / base `9d817bd`(EDITOR-REST-0 병합, MQ-R1 ★A 메모리 스냅샷 지금). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/editor-rest/SPEC.md` r1 3.2·5.2(ER-AC-S1·S2·S5, S9·S10은 ER-3b 화면 몫이지만 저장소 계약이 이를 막지 않게)·6절, `docs/04-plan/EDITOR_REST_PLAN.md` 2·3절 ER-3a 행, BACKLOG B-ER-02(`resolveConflict` missing).
- 병렬 레인: ER-2(engine/ops/theme.ts·components/studio/**·features/studio/** 등) — **이 레인은 `app/src/data/**` 저장소 파일과 그 test만** 쓴다. 화면·StudioLayout·엔진 수정 금지.

## 범위
- `data/memoryDocBook.ts` · `data/memoryProjectRepository.ts`: `createSnapshot`(기본 이름·30자·종류·목록 최근 10 + 더 보기 계약), `restoreSnapshot`("복원 전" 자동 + 새 revision 한 트랜잭션 · 기존 스냅샷 동결 · commit 실패 → 변화 0 · STALE_DOC 판정), `resolveConflict`(mine/theirs 보존 스냅샷 1 + 저장 한 트랜잭션 · commit 실패 → 0). 기존 `projectRepository.ts` 인터페이스 그대로(계약 변경 필요하면 멈춤).
- 스냅샷 id 번호가 내보내기(E-AC-43·44 "내보내기 전" 스냅샷)·restart와 같은 순서. 기존 `memoryExport.test.ts`·`useDocSave.test.ts` 회귀 0.
- 수명 = 프로젝트(탭 메모리) — MQ-R1 A.

## 규칙
- TDD: 단계별 RED 전 새 테스트 수 예측 커밋 → RED 로그 `dev/active/er-3a/logs/` → GREEN. 단언 약화·skip 0. SPEC 6절 목록 밖 테스트 깨지면 멈춤. BRIEF P0 명시 커밋.
- 매 커밋 게이트: 표적 test + `npx vitest run src/test` + typecheck + lint + build. 번들: 저장소는 조작 뒤 청크일 것 — `/studio` 진입 >127.39 즉시 멈춤, 다른 화면 ±0.03, 렌더 변화 0.
- 화면 변경이 없으므로 Ego Lite는 필요할 때만(사용 시 build+preview 4337, 앱 안 클릭만, 끝나면 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인·자기 서버 종료). 쓰지 않으면 REPORT에 "미사용·열린 창 0" 기록.
- 새 의존성 0, package*.json/lock·CLAUDE.md·docs/**·scripts 수정 0. 서브에이전트 0, push/merge/삭제 0, main 5480 무접촉, 승인 실패 우회 금지.
- **턴 관리:** 40턴 도달 시 새 구현 중단 → 전체 vitest → REPORT. 마감: 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회), Codex review --scope branch --base 9d817bd 실제 완료(≤2), REPORT(AC 판정·트랜잭션 실패 경로·번들·meta).
