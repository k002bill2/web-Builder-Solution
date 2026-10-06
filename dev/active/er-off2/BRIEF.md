# ER-OFF2 Developer 브리프 — 상쇄 A1+A2 적용 + ADR-004 개정 6 기준선 (동작 변화 0)

- 역할 Developer / Orca managed Claude Code / worktree er-off2 / base `5bce9f9`(ER-3b 병합 · ADR-004 개정 6). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/decisions/ADR-004-performance-budgets.md` 개정 6절 · `dev/active/er-off/REPORT.md` 2절 A1·A2(시제품 `logs/proto.mjs` 패치 정의) · 현재 `/studio` 진입 128.42.
- 주의: ER-OFF 시제품은 base `9befa6a` 기준 — 그 뒤 ER-2(테마 연산 `theme`)·ER-3b(스냅샷 편집 경계 `useSnapshots.edit`, `useSectionOps.run`)가 같은 경로를 바꿨다. **현재 코드에 맞게 다시 적용**하고 감량을 다시 실측한다.

## 순서
1. **첫 커밋(메시지에 "ADR-004 개정 6")**: `app/scripts/m2cBaseline.json` `eagerKb` 128.40 → 128.67 · `base` `5bce9f9` · `note` 갱신. 숫자를 고정한 테스트가 있으면 숫자만 맞춤. 검사기 로직(`bundleBudget.mjs`·`check-bundle-size.mjs` 로직) 변경 0.
2. A1(StudioLayout move·remove·swap·add 등 `await loadDocEngine()` 뒤 꼬리 → docEngine 청크) · A2(`useSectionOps.run` `await applyDocOp` 뒤) 이동. **옮기기 전 동작 고정 테스트**(포커스·알림·실행 취소 스택·미리보기 편집 경계 거절·테마 연산) — 예측은 PROGRESS(동작 고정은 GREEN 예상), 단언 약화·skip 0. 보이는 동작·문구·포커스·타이밍 변화 0.
3. 실측: `/studio` 진입 감량을 REPORT 표에 기록(목표 −0.16 근처 · 0이나 증가면 그 부분 되돌리고 기록). 다른 화면 ±0.03, 렌더 변화 0.
4. **Ego Lite(영환님 지시):** `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`, 경로 A(카탈로그 ref-e·밝은 카드 → 3안 → 편집 시작)로 섹션 이동·삭제·추가·되돌리기·테마 적용을 1280에서 실제 확인·캡처 ≤4장 `dev/active/er-off2/shots/`(CDP 캡처 타임아웃 시 원인 기록 후 계산 스타일·DOM 확인으로 대체 명시). 앱 안 클릭만·새로고침 금지. 시작 전 `listTaskSpaces()` 확인, 끝나면 이 레인 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
5. 마감: typecheck·lint·build · 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회) · Codex review --scope branch --base 5bce9f9 실제 완료(≤2) · REPORT.

## 금지
- 기능 추가 0(ER-4 몫: 키보드·다시 실행·더보기·B-ER-04~06 손대지 않음). 엔진·PageDoc 계약·`app/src/data/**`·docs/**·package*.json/lock·CLAUDE.md 수정 0, 개정 6 커밋 외 scripts 수정 0. 새 의존성 0.
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. RED 테스트 tip 커밋 금지.
- **턴 관리:** 30턴 도달 시 새 이동 중단 → Ego Lite → vitest → Codex → REPORT. REPORT는 마지막 5턴 전 커밋.
