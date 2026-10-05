# M2C-3S Developer 브리프 — `/studio` 진입 청크 구조 점검(동작 변화 0 · ≥0.10KB 감량)

- 역할 Developer / Orca managed Claude Code / worktree m2c-3s / base `d25fe49`. `app/node_modules` lock 그대로 `npm ci` 완료.
- 영환님 ★A(2026-10-06): M2C-3 예산 멈춤(`dev/active/m2c-3/REPORT.md` — main 쪽에는 없음, 원문: `/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-3/dev/active/m2c-3/REPORT.md`) → ADR-004 개정4 결정 3 "상향 전 구조 점검" 레인. 예산·ADR·검사기·기준선 파일 변경 0.
- 목표: `/studio/:projectId` **진입 직후 자동 로드 합계를 127.36 → ≤127.26KB**(−0.10 이상, 여유 있으면 더). M2C-3 재개(배치 변경 1 모양 +0.11, 실제 패널이면 더 늘 수 있음)가 기준선 파일 127.39 안에 들어가게 하는 것.

## 순서
1. 실측·후보 선정(코드 변경 전): `npm run build` 시작값 + `StudioLayout`/진입 청크 구성 분석. 후보 [추정]: `PageInfoFields`("페이지 정보" 고를 때만), `ConflictCallout`(충돌 때만), 그 밖에 진입 직후 화면에 안 보이는 코드. 후보별 예상 감량을 실측(시제품 build)하고 PROGRESS에 기록.
2. 선택한 후보를 조작 뒤 로드로 이동(기존 lazy 관례: `VariantSwitch`/`ContactOwnerNote`처럼 DS 부품 prop 주입 등). **보이는 동작·문구·접근성 변화 0**, 첫 화면에 보이는 요소는 옮기지 않음(lazy로 옮긴 요소가 열릴 때 깜빡임·포커스 이동이 바뀌면 안 됨).
3. TDD: 옮기는 요소마다 기존 동작 가드가 있는지 확인, 없으면 동작 고정 테스트를 먼저(RED 전 테스트 수 예측 커밋 — 동작 고정은 GREEN 예상일 수 있음, 그대로 기록). 단언 약화·skip 0.
4. **Ego Lite 화면 확인(영환님 지시):** 서버 4337 loopback → Ego Lite에서 앱 안 클릭으로 `/studio` 진입 → 옮긴 요소를 실제로 열어 화면을 보고(페이지 정보·충돌 안내 등) 1280·390 캡처를 `dev/active/m2c-3s/shots/`에. **작업이 끝나면 이 레인이 연 Ego Lite 창·탭을 모두 닫고 닫힘을 목록으로 재확인**해 REPORT에 기록. 영환님이 연 창·main 5480은 무접촉.
5. 마감: typecheck·lint·build(번들 표 전 행 — 다른 라우트 ±0.03, 렌더 문서 변화 0), 전체 vitest 기본 1회 exit0·Errors0, Codex review --scope branch --base d25fe49 실제 완료(≤2라운드), REPORT(전후 수치·후보별 감량·Ego Lite 확인/창 닫힘·meta).

## 금지
- `app/scripts/**`·기준선 파일·한도·ADR·docs/design·docs/decisions·package*.json/lock·CLAUDE.md 수정 0. 이미지 기능(M2C-3) 코드 작성 0. 엔진·PageDoc 계약 변경 0. 새 의존성 0.
- 감량이 0.10KB에 못 미치면 억지로 동작을 바꾸지 말고 실측과 함께 멈춤 보고.
- 서브에이전트 0, 4337/4339 loopback·자기 PID cwd 확인 종료·lsof 0, push/merge/삭제 0, 승인 실패 우회 금지. 50턴부터 마감 우선. 한국어 보고.
