# ER-4b Developer 브리프 — 키보드 실행 취소·다시 실행 상쇄 재시도 (U1·U2·U5) + 조건부 더보기(U4)

- 역할 Developer / Orca managed Claude Code / worktree er-4b / base main `6658430`(ER-4 ①~③ 병합) + Jarvis가 `k002bill2/er-4-step4-wip`(fd3385a, ④ WIP)를 병합해 둠 → **지금 브랜치에 ④ 코드가 있다**(빌드 시 /studio ≈128.96 예상).
- 정본: `dev/active/er-4/REPORT.md` 2절(④ 설계·상쇄 후보 a·b)·3절, `docs/design/editor-rest/SPEC.md` r1 3.5·5.3, ADR-004 개정 6(판정선 **128.70**, main 128.28).
- Jarvis 판정: ⑥ U3 필드 묶음 = 범위 밖(B-ER-08). U1 "넣음 연산마다"는 **섹션 연산·테마(현재 기록 경로)** 범위로 판정 — 필드·이미지·meta·복원·충돌은 B-ER-08과 함께. REPORT에 이 범위로 PASS/부분 표기.

## 순서
1. **상쇄**: 진입 청크에는 keydown 리스너의 **최소 동기 판정**(수식키 + KeyZ/KeyY·code, 입력칸·dialog·IME·미리보기 무시, `preventDefault`)만 남긴다. `historyKeys` 세부·`undoStack` redo·reachable·`stepHistory`·라벨/알림 문장 조립은 docEngine(조작 뒤) 청크로. 조작 뒤 청크가 진입 모듈을 새로 import하지 않게 인자로 넘긴다(ER-OFF2 교훈). `useSectionOps` 진입 증가 최소화.
   - 감량 시도 ≤3회, 시도마다 `/studio` 진입·StudioLayout 청크 gz·raw를 PROGRESS 표에. **≤128.70 달성 시 커밋**. 3회 뒤에도 초과면 커밋 없이 멈춤·수치 보고(코드는 브랜치에 남기되 tip 앱 빌드가 실패하는 커밋 금지 — 필요 시 WIP를 별도 브랜치로 옮기고 tip을 main+문서로).
   - 동작 변화 0: ④ 기존 테스트(undoStack +2·historyKeys +2·UndoKeys +4)와 SPEC U1·U2·U5 단언 그대로 GREEN.
2. **조건부 ⑤ U4 "더보기"**: ①이 ≤128.55로 끝났을 때만 시도(`MoreMenu.tsx` 조작 뒤 청크, 실행 취소·다시 실행 두 항목 + <1280 "스냅샷" 이동). 128.70 넘으면 ⑤만 되돌리고 B-ER-09로 REPORT.
3. **Ego Lite(영환님 지시):** `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`, 경로 A로 1280·390에서 Ctrl/⌘+Z·Shift+Ctrl/⌘+Z·Ctrl+Y(섹션 삭제→취소→다시), 입력칸 안 Ctrl+Z가 가로채지지 않음, B-ER-04 테마 되돌리기 포커스를 실제 확인. 캡처는 `Emulation.setDeviceMetricsOverride` 없이(실패 시 1회 재시도 후 DOM·포커스 대체 명시). 첫 goto 1회 뒤 앱 안 클릭·키 입력만, 새로고침 금지. 시작 전 `listTaskSpaces()` 확인, 끝나면 이 레인 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
4. 마감: typecheck·lint·build(번들 표 전 행) · 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회) · Codex review --scope branch --base 6658430 실제 완료(≤2) · REPORT.

## 금지
- 엔진·PageDoc 계약·`app/src/data/**`·docs/**·scripts·package*.json/lock·CLAUDE.md 수정 0, 새 의존성·아이콘 0, 단언 약화·skip 0, RED 테스트 tip 커밋 금지. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리(엄격):** 40턴 도달 시 새 수정 중단 → Ego Lite → vitest → Codex → REPORT. REPORT는 마지막 5턴 전 커밋, PROGRESS 체크와 일치.
