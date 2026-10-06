# ER-2 Developer 브리프 — 테마 바꾸기 (ER-AC-T1~T7 · G1 대비 줄)

- 역할 Developer / Orca managed Claude Code / worktree er-2 / base `9d817bd`(EDITOR-REST-0 병합, MQ-R1~R5 ★A). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/editor-rest/SPEC.md` r1 3.1·3.3·5.1(ER-AC-T1~T7)·5.4 G1·6~9절, `docs/04-plan/EDITOR_REST_PLAN.md` 2·3절 ER-2 행, `docs/design/editor-rest/MQ.md`(R3-A 예산 상향 없음 · R4-A 대화상자 실렌더 없음). ER-AC-T8은 QA(ER-5) 몫.
- 병렬 레인: ER-3a(`data/memoryDocBook.ts`·`data/memoryProjectRepository.ts`·그 test) — 그 경로 수정 금지.

## 범위 (쓰기 = PLAN 2절 ER-2 행만)
- 엔진 범위 예외: `engine/ops/theme.ts`(신규 `swapTheme`·`diffSlotValues`) + test. **PageDoc·SectionDefinition 계약 변경 0**(필드 추가 0) — 바뀌어야 하면 멈추고 보고.
- 화면: `components/studio/ThemeDialog.tsx`(신규, 조작 뒤 청크) · `StudioPanels.tsx`(ThemePanel) · `GateList.tsx`/`features/studio/gateView.ts`(대비 줄 행동) · `features/studio/docOps.ts`·`docOpRun.ts`(연산 `theme`) · `StudioLayout.tsx`(자기 코드는 새 파일로 빼서 증가 최소).
- 되돌리기(알림 줄·Ctrl+Z 기존 경로)·E-S18 캡션·`?v=` 링크·라이브 영역·포커스(SPEC 7절).

## 규칙
- TDD: 단계별 RED 전 새 테스트 수 예측 커밋 → RED 로그 `dev/active/er-2/logs/` → GREEN. 단언 약화·skip 0. SPEC 6절 목록 밖 테스트 깨지면 멈춤. BRIEF P0 명시 커밋.
- **매 커밋 게이트**: 표적 test + `npx vitest run src/test` + typecheck + lint + build. **번들 멈춤**: `/studio` 진입 >127.39 즉시 멈춤(기준선 파일·검사기 수정 금지), 다른 화면 ±0.03, 렌더 JS 변화 0 원칙(변하면 기록·사유). 레인 끝 여유 <0.10이면 REPORT 첫 줄에.
- **Ego Lite(영환님 지시):** `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 서버 금지), 앱 안 클릭만·새로고침 금지. 테마 대화상자 열기 → 버전 선택 → 적용(캔버스 색 변화·알림) → 되돌리기 → E-S18 캡션을 1280·390에서 실제 화면 확인·캡처 `dev/active/er-2/shots/`. 시작 전 `listTaskSpaces()` 확인(space id는 스크립트에 직접 기입). 끝나면 이 레인이 연 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 새 의존성·아이콘 0, package*.json/lock·CLAUDE.md·docs/**·scripts 수정 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 50턴 도달 시 새 구현 중단 → Ego Lite → 전체 vitest → REPORT. 마감: 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회), Codex review --scope branch --base 9d817bd 실제 완료(≤2), REPORT(AC 판정·번들 표·깨진 테스트 대조·Ego Lite/창 닫힘·meta).
