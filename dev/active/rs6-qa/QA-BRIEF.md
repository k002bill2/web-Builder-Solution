# RS6 최종 QA 게이트 BRIEF — 저장 코어 제품 연결 통합 판정 (QA)

책임 역할: QA(구현 레인과 다른 세션) / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-qa` (브랜치 `k002bill2/rs6-qa`, base origin/main `0a809b87` = L4 PR #23 머지 — RS6 L0~L5 전부 반영). `app/node_modules` 설치 완료.
쓰기 경로: `dev/active/rs6-qa/`만.

## 정본
- `docs/04-plan/RS6_INTEGRATE_PLAN.md` **7절 QA 게이트**(환경·브라우저·멀티탭·대상·증거) · 8절 중단 규칙.
- `docs/design/restart/INTEGRATE-6.md` r1 — RS6-AC 전체(U·G·B) · 해소 대상 위험 RS4-R1·RS4-R8·BD-1·LV-1·LV-2·H4.
- `docs/design/restart/UX-5.md` UX5-AC-01·04·05·06·12 · `dev/active/save-core-final-qa/REPORT.md` 5-1 시나리오(제품 화면판).
- 레인 기록(노트 출처): `dev/active/rs6-l3a-editor/QA-REPORT.md` · `rs6-l3b-leave/QA-REPORT.md` · `rs6-l5-projects/QA-REPORT.md` · `rs6-l4-ux/QA-REPORT.md`(N1~N4).

## 할 일
1. **위험 해소 판정표**: RS4-R1(뒤로 재진입 idle 거짓) · RS4-R8(뒤로·주소 이동 무경고 손실) · BD-1 · LV-1 · LV-2 · H4 — 각각 닫힘/부분/열림 + 실화면·테스트 근거. main 이전(RS6 전 `0323c4a0` 이전 동작)과 비교가 필요하면 코드 근거로.
2. **RS6-AC 전체 대조표**: U·G·B 항목마다 판정·근거(테스트 경로 또는 실화면 관측) · 레인 QA notes 상속 여부. 미판정 항목은 이유.
3. **실화면(PLAN 7절 그대로)**: `npm run build && npx vite preview --host 127.0.0.1 --port 4385 --strictPort`(dev 서버 금지) · origin 1개 · **ego-browser만**(Playwright·Puppeteer 설치 금지) · 앱 안 클릭 이동.
   - RS6-AC-B1~B4. **멀티탭 B3: 실제 `navigator.locks` 잠금 held 목록을 먼저 기록**한 뒤 진행. 탭 2개 = 같은 프로필 페이지 2개.
   - UX5-AC-01·04·05·06·12 제품 화면판(UX5-AC-05 충돌 Callout은 제품 도달 0 — L4 결정 — 이면 "도달 0" 판정 근거).
   - final-qa 5-1 시나리오 제품 화면판.
   - 편집 직후 링크 이탈 · 뒤로 → `/projects` 탭 닫기 경고(합성 beforeunload `defaultPrevented`) → 재진입 상태 · 이미지 교체 직후 이탈 · 새로고침 복원 · 1280·390.
   - 각 단계 관측 원문·스크린샷 경로를 REPORT에. **실화면 PASS는 이 QA만 주장한다.**
4. **notes 정리**: 레인 notes(L3b note 1 → L5에서 닫힘 확인 · L5 생존 변이 3 · L4 N1~N4 · 예산 여유 0.01)를 "RS6 종료 전 필수 / 백로그" 2분류로 제안(결정은 Jarvis).
5. fresh 게이트: `typecheck`·`lint`·`npm test -- --run`(기대 340/3022)·`build`(`/studio` 129.12 · 복원 132.10 · raw ≤ 130.5).

## 판정
- PASS / PASS with notes / FAIL. 거짓 saved·confirmed·discarded, 경고 없는 편집 손실, 다른 탭 커밋 덮어쓰기, 예산 초과 중 하나라도 있으면 FAIL.

## 규칙
- 앱·테스트 수정 커밋 금지(임시 테스트·변이는 매번 `git checkout -- app/`). push·원격 쓰기·다른 워크트리·Codex 금지. 영환님 창·main 5480 무접촉.
- 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·**preview 서버 종료·4385 리슨 0 확인**.
- 산출물: `dev/active/rs6-qa/{QA-PROGRESS.md, REPORT.md, shots/}` — REPORT: 0 판정 · 1 위험 해소표 · 2 RS6-AC 대조표 · 3 실화면 · 4 notes 분류 · 5 게이트 · 6 사실/추정/미확인. 명시 경로 커밋.
- 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋. **REPORT 초안 40턴 전 커밋.** 최대 65턴(초과 금지 — 실화면 준비가 길면 일부 BLOCKED로 기록하고 마감). 서브에이전트: 읽기 전용 1개(2번 AC 대조표) 허용.
