# QA-PROFILE-VISUAL — 병합본 프로필 화면 시안 대조 (읽기 전용 검증)

## 책임/목표
- 책임 QA / 실행 Orca + Claude Code. 보고 대상 Jarvis. 기준 main `5562dc2`(profile-v2-compact + editor-a1-alpha 병합본). 작업 공간 `qa-profile-visual`.
- 배경: 프로필 시안 정리 Developer 레인이 턴 한도로 2회 중단 — 코드 게이트(1,111 통과·build·번들)는 통과했으나 **실제 화면 대조가 한 번도 안 됐다.** 이 QA가 그 빈칸을 채운다.
- **코드 수정 금지.** 결함은 재현 절차·캡처·기대/실제로만 보고. 쓰기는 `docs/qa/profile-visual/`만.

## 입력
- 사용자 시안: `docs/06-handoff/profile-v2-input/user-profile-mockup.png` (직접 열어 보기)
- 수용 기준: `docs/06-handoff/PROFILE-V2-COMPACT_BRIEF.md` "현재 vs 시안" 1~6
- 의도된 차이(결함 아님): 슬라이더 없음(기존 선택 컨트롤) · "다시 생성" 없음 · 상단 "생성 로그" 버튼 없음 — 사용자 승인된 SPEC 제외.
- 참고: `dev/active/profile-v2-compact/PROGRESS.md`(체크리스트 미갱신 상태 — 작업자 미완), `docs/design/2a-04/SPEC.md`.

## 수행
1. `cd app && npm run build && npx vite preview --host 127.0.0.1 --port 4341 --strictPort`(백그라운드, PID 기록). 4341만 사용.
2. 실제 클릭 흐름: /catalog → 레퍼런스 선택 → /compare 확정 → /profile/:id → "3안 만들기" → 생성 완료 → B안 선택 → 편집 시작 영역 확인.
3. 캡처 `docs/qa/profile-visual/shots/`: 1280·768·390·320 각 (a) 3안 만들기 전, (b) B안 선택 후. 1280(b)는 시안과 같은 구도.
4. 수용 기준 1~6 항목별 판정 PASS/FAIL/PARTIAL + 근거(캡처 파일명, DOM 측정값: 왼쪽 패널 폭, 디스클로저 `aria-expanded` 기본값, 편집 시작 버튼 DOM 순서, 가로 넘침 `scrollWidth>clientWidth` 여부).
5. 키보드: Tab 순서를 1280에서 기록(헤더 → h1 → 왼쪽 패널 → 3안 → 편집 시작), 디스클로저 Enter/Space 동작.
6. 시안 대비 남은 시각 차이를 "기능 영향 / 사용성 / 일관성 / 순수 시각"으로 분류(우선순위 ADR-003), 각 1줄.
7. 종료: 자기 PID만 kill + `lsof -nP -iTCP:4341 -sTCP:LISTEN` 결과를 로그로.

## 산출
- `docs/qa/profile-visual/REPORT.md`: 판정 요약(PASS/PARTIAL/FAIL) · 항목표 · 결함 목록(심각도 P0~P3, 재현, 기대/실제, 캡처) · 미검증 · 서버 종료 근거.
- 로컬 커밋 `git commit -- docs/qa/profile-visual`(캡처·로그 포함, `*.log`는 `git add -f`). push·병합·삭제 금지. 외부 사이트 접근 금지. fable 파일 무접촉.
- 서브에이전트 분할: 불필요(순차 흐름·단일 서버).
- 턴 예산 20: 12턴 이내에 REPORT 골격 먼저 커밋, 이후 보강.
