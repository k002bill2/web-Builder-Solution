# ER-OFF Developer 브리프 — `/studio` 진입 청크 상쇄(구조 점검 2차 · 동작 변화 0)

- 역할 Developer / Orca managed Claude Code / worktree er-off / base `9befa6a`. `app/node_modules` lock 그대로 `npm ci` 완료.
- 배경: ER-2 테마 바꾸기가 번들 멈춤(`/studio` 진입 127.05 → 127.64, 멈춤선 127.39). MQ-R3 ★A(예산 상향 없음 → "넘치면 그 레인 멈춤 → 상쇄 레인 먼저"). 근거 `/Users/younghwankang/orca/workspaces/web-builder-solution/er-2/dev/active/er-2/REPORT.md` 1·8절(build-4: StudioLayout 청크 16.93→17.43gz, 공유 청크 `issue` +0.09). 선례 `dev/active/m2c-3s/REPORT.md`(runDocOp 이동 −0.22, PageInfoFields·ConflictCallout lazy 탈락 사유).
- **목표:** `/studio/:projectId` 진입 직후 합계 **127.05 → ≤126.45KB(−0.60 이상)**. 이후 ER-2(+0.59)·ER-3b·ER-4가 기준선 파일 127.39 안에 들어갈 여유를 만든다. 예산·검사기·기준선 파일·ADR 변경 0.

## 순서
1. **실측·후보 선정(코드 변경 전):** build + 진입 청크 구성 분석(StudioLayout·EditFields·StudioPanels·GateList·공유 청크 issue 등). 진입 직후 화면에 보이지 않는 코드·조작 뒤에만 쓰는 코드·첫 화면에서 빼도 동작이 같은 코드 후보별 시제품 build 감량 실측 → PROGRESS 표. m2c-3s에서 탈락한 lazy(클릭 직후 한 틱 늦음·포커스 위험)는 같은 방식 반복 금지.
2. **실현 가능성 판정:** 동작 변화 0으로 −0.60 이상이 가능한 조합이 있으면 진행. 없으면 **억지로 바꾸지 말고** 달성 가능한 최대치·후보별 수치와 함께 멈춤 보고(영환님 MQ-R3 재결정 입력).
3. 이동 구현: 기존 lazy 관례(`docEngine` 조작 뒤 청크 재사용·DS 부품 prop 주입). 보이는 동작·문구·접근성·포커스·타이밍 변화 0. 옮기는 요소마다 동작 고정 테스트 먼저(RED 전 새 테스트 수 예측 커밋 — 동작 고정은 GREEN 예상 그대로 기록).
4. **Ego Lite(영환님 지시):** `npm run build` + `npx vite preview --host 127.0.0.1 --port 4337 --strictPort`, 앱 안 클릭만·새로고침 금지로 옮긴 요소를 실제로 열어 1280·390 확인·캡처 `dev/active/er-off/shots/`. 시작 전 `listTaskSpaces()` 확인(space id 직접 기입). 끝나면 이 레인이 연 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
5. 마감: typecheck·lint·build(번들 표 전 행 — 다른 화면 ±0.03, 렌더 변화 0), 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회), Codex review --scope branch --base 9befa6a 실제 완료(≤2), REPORT(전후·후보별 감량·Ego Lite/창 닫힘·meta).

## 금지
- `app/scripts/**`·기준선·한도·ADR·docs/**·package*.json/lock·CLAUDE.md 수정 0. 테마·스냅샷·실행 취소 기능 코드 작성 0(ER-2 WIP 브랜치 `k002bill2/er-2-wip-bundle` 무접촉). 엔진·PageDoc 계약 변경 0. 새 의존성 0. 단언 약화·skip 0.
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 50턴 도달 시 새 이동 중단 → Ego Lite → vitest → REPORT.
