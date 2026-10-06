# ER-4 Developer 브리프 — 실행 취소 (ER-AC-U1~U5 · C1) + B-ER-04~06

- 역할 Developer / Orca managed Claude Code / worktree er-4 / base `dd6b0f7`(ER-3b 스냅샷 · ER-OFF2 상쇄 · ADR-004 개정 6). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/editor-rest/SPEC.md` r1 3.5(실행 취소 경계 · MQ-R5 ★A 필드 편집 기록)·5.3 U1~U5·C1·6~9절, `docs/04-plan/EDITOR_REST_PLAN.md` 2절 ER-4 행(쓰기 경로)·3절, BACKLOG B-ER-04·05·06, ER-3b REPORT 7절(SPEC 차이: "스냅샷" 버튼 <1280 → "더보기" 안으로 이동).
- **C2 숫자는 낡음**(127.39) — ADR-004 개정 6 기준 **`/studio` 진입 판정선 128.70**(현재 128.24, ER-4 여유 0.46).

## 범위 (우선순위 순 — 예산·턴이 부족하면 아래부터 줄인다)
1. **B-ER-05**(먼저): 미리보기 편집 경계가 `edit` false로 거절하면 `useSectionOps.run`이 실패로 처리(docRef·스택·last 불변 · 같은 거부 경로). ER-OFF2 동작 고정 테스트 `useSectionOps.pin.test.tsx`의 "edit 거절 현재 동작" 단언은 **의도된 동작 변경**이므로 새 기대로 바꾸고 이유를 주석·REPORT에 기록(약화 아님 — 더 엄격).
2. **B-ER-06**: 내보내기 진행 중 이미지 교체·삭제 시 "내보내기 전" 스냅샷 Blob prune 방지 — 스냅샷 생성 응답 시점에 참조 집합 갱신.
3. **B-ER-04**: 테마 알림 줄 "되돌리기"를 키보드로 실행 → 사라지는 버튼 대신 유지되는 컨트롤(테마 영역 "테마 바꾸기")로 포커스.
4. **U1·U2·U5**: Ctrl/⌘+Z 실행 취소 · Shift+Ctrl/⌘+Z·Ctrl+Y 다시 실행(`undoStack` redo) · 입력칸 안 가로채기 0 · 미리보기 중 무시 · 상한 50 · 언마운트 비움.
5. **U4 + "더보기"**: `MoreMenu.tsx`(신규, 조작 뒤 청크) — 실행 취소·다시 실행 두 항목(비활성 이유) + <1280 "스냅샷" 진입 이동(SPEC 원안). 알림 "실행 취소: …" 1문장(C1, 새 `role=status` 0).
6. **U3**: 필드 편집 묶음(연속 입력 10자 + 600ms 멈춤 = 1건 · blur = 1건) — EditFields·PageInfoFields·ImageSlotField.
- 5·6이 예산·턴 때문에 안 되면 **멈추지 말고** 1~4를 완성·커밋한 뒤 REPORT에 "미구현 항목·사유·실측"을 남긴다(Jarvis가 범위 축소 판정).

## 규칙
- **번들**: 판정선 128.70 초과 시 즉시 멈춤(추가 빌드 시도 금지). 키보드 처리·redo·메뉴·묶음 로직은 클릭/키 입력 뒤 청크로. 교훈: **조작 뒤 청크가 진입 모듈을 새로 import하면 공유 청크가 쪼개져 진입이 늘 수 있다 — 인자로 넘긴다**(ER-OFF2). `ds/*`·Icon 새 import 주의. 단계마다 진입 실측을 PROGRESS 표에. 다른 화면 ±0.03(개정 5 결정 3 근거 시 ±0.05), 렌더 변화 0. 기준선·검사기 수정 0.
- TDD: 단계별 RED 전 새 테스트 수 예측은 **PROGRESS에**(RED 테스트 tip 커밋 금지) → RED 로그 `dev/active/er-4/logs/` → GREEN 단위 커밋. 단언 약화·skip 0. SPEC 6절 목록 밖 테스트 깨지면 멈춤(위 1번 pin 테스트는 예외로 명시). BRIEF P0 명시 커밋.
- 접근성: 포커스 유실 0(사라지는 버튼 → 유지되는 컨트롤), 좁은 폭 메뉴·대화상자 1개 렌더 — 테스트로 고정.
- **Ego Lite(영환님 지시):** `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`(dev 금지), 경로 A로 1280·390에서 Ctrl+Z/다시 실행·더보기·테마 되돌리기 포커스 실제 확인. **캡처는 `Emulation.setDeviceMetricsOverride` 없이 창 크기로 시도**(지난 2레인 CDP 캡처 타임아웃 원인 추정) — 실패 시 1회 재시도 후 DOM·계산 스타일로 대체 명시. 첫 goto 1회 뒤 앱 안 클릭·키 입력만, 새로고침 금지. 시작 전 `listTaskSpaces()` 확인, 끝나면 이 레인 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 엔진·PageDoc 계약·`app/src/data/**` 인터페이스·docs/**·scripts·package*.json/lock·CLAUDE.md 수정 0, 새 의존성·아이콘 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리(엄격):** 50턴 도달 시 새 구현 중단 → Ego Lite → 전체 vitest → Codex(review --scope branch --base dd6b0f7, ≤2) → REPORT. REPORT는 마지막 5턴 전 커밋, PROGRESS 체크와 REPORT 실제 내용 일치 확인.
