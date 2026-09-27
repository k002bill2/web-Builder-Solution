# QA-A1-BETA-FLOW — a1-β 사용자 흐름 독립 검증 (main `6e6d8d5`)

## 책임/목표
- 책임 QA / 실행 Orca + Claude Code. 보고 대상 Jarvis. 작업 공간 `qa-a1-beta-flow`(브랜치 `k002bill2/qa-a1-beta-flow`, HEAD = main `6e6d8d5`). 포트 **4341**.
- 목적: a1-β(프로젝트 입구 연결)가 실제 브라우저에서 SPEC대로 동작하는지 **코드 수정 없이** 판정(PASS / PARTIAL / FAIL). 구현자 자체 테스트(1,243/1,243)·Codex("확정적 결함 없음")를 대체하지 않는 독립 검증.
- 배경: 구현 레인이 S5 실제 클릭 단계에서 턴 한도로 2회 끊김(스크린샷 도구로 단계마다 턴을 소모). **이번에는 흐름 전체를 스크립트 한 번으로 실행**한다.

## 기준 문서
- `docs/design/2a-05/SPEC.md` 2.1~2.5(보드 확정 대상 S-B9 · J-S09~J-S11 · J-AC-04~06), 12.1~12.4(프로젝트 링크 · 편집 시작 · `/studio/:projectId` · E-S03).
- a1-β 기록: `dev/active/editor-a1-beta/REPORT.md` · `PROGRESS.md`(RESUME-2 체크리스트) · 부분 캡처 `dev/active/editor-a1-beta/captures/resume2/`(3장).
- QA 결함 D3 결정: 390 헤더 3행(87→131px) 수용 — 결함으로 올리지 않는다.

## 방법 (턴 절약이 핵심)
1. `cd app && npm ci`(필요 시) → `npx vite --host 127.0.0.1 --port 4341 --strictPort`를 **백그라운드**로 띄우고 PID 기록.
2. **한 개의 스크립트**(`dev/active/qa-a1-beta-flow/flow.mjs`)로 전 흐름을 실행한다. 도구 우선순위: 로컬 Playwright(캐시 `~/Library/Caches/ms-playwright/chromium-*` 존재 — `npx playwright`가 이미 있으면 사용, **새 의존성 설치 금지**) → 없으면 `agent-browser` CLI 배치 → 없으면 ego-browser+CDP(선례 `docs/qa/profile-visual-align/REPORT.md`). 스크립트는 단계마다 단언 결과를 JSON 줄로 출력하고 스크린샷을 저장한다. 실패해도 다음 단계로 넘어가며 기록.
3. 1280·390 두 폭으로 같은 스크립트를 실행.

## 흐름과 단언 (각 단계 PASS/FAIL + 증거)
- F1 `/catalog` 렌더 → 레퍼런스 3개를 비교에 담기 → `/compare`.
- F2 보드에서 요소 선택 → **첫 확정**: 초안 패널에 새 프로젝트 이름 캡션(J-S09) · "확정할 곳" 라디오 **없음** → 확정 → `/profile/:id` 이동 · 새 프로젝트 알림(J-S11).
- F3 프로필 머리 **"프로젝트: <이름>" 링크** → `/projects` 목록에 그 프로젝트 존재 → 뒤로.
- F4 보드로 돌아가 선택 변경 → **"확정할 곳" 라디오 2개**(`<이름> 새 버전` 기본 선택 · `새 프로젝트`), 키보드(Tab·화살표)로 선택 가능 · 확정 버튼 이름이 대상에 맞게 바뀜 → "새 프로젝트"로 확정 시 프로젝트 2개가 됨.
- F5 프로필 → 3안 만들기 → 안 하나 선택 → **"편집 시작"** → `/studio/:projectId` 이동 · 편집기 셸이 **프로젝트 이름(실데이터)** 과 E-S03(문서 없음) 상태를 보임 · "프로젝트로 돌아가기" 동작.
- F6 GNB: 새 프로젝트/프로젝트 링크 · 390에서 Tab 순서 = 보이는 순서(D3).
- F7 콘솔 error 0 · 페이지 오류 0(스크립트가 수집).
- 결함은 **재현 절차 · 기대 · 실제 · 캡처 · 심각도(P1~P3)** 로 기록. 코드는 고치지 않는다.

## 산출물 (모두 `docs/qa/a1-beta-flow/`, `git add -f` 필요 시 사용)
- `REPORT.md`(판정 · 단계별 표 · 결함 · 도구 · 한계), `flow.jsonl`(스크립트 출력), `shots/{1280,390}/*.png`, 스크립트 사본.

## 금지·운영
- 앱 코드·테스트·`design/`·`docs/design/` 수정 금지. 새 의존성 금지. GDWEB 등 외부 사이트 접속 금지.
- 서브에이전트 분할: 불필요(메인 단독 — 직전 레인이 rate limit에 걸림).
- `--max-turns` 30 · **18턴부터 REPORT 우선**(부분 결과라도 커밋). 로컬 커밋 `git commit -- <경로>`. push·병합·삭제 금지.
- 끝나면 자기 vite PID만 종료하고 `lsof -nP -iTCP:4341 -sTCP:LISTEN` 결과(빈 출력)를 REPORT에 기록.
