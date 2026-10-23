# QA02-EDIT-START BRIEF — B-QA-02 "B안으로 편집 시작" 무반응 판별 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-24 (★ 자동 진행 — 판별만, 수정 없음)
worktree `~/orca/workspaces/web-builder-solution/qa02-edit-start` · 브랜치 `k002bill2/qa02-edit-start` · base origin/main `314686d0`.
쓰기 경로 = `dev/active/qa02-edit-start/`만. **앱 코드·테스트·BACKLOG 수정 금지.**

## 0. 준비 (2턴 안)
- `cd app && npm ci`(lock 변경 커밋 금지) → `npm run build`. PROGRESS(`dev/active/qa02-edit-start/PROGRESS.md`) 커밋.
- preview `--port 4399 --strictPort`(사전 `lsof -nP -iTCP:4399 -sTCP:LISTEN` 기록). 브라우저 = ego-browser, **새 TaskSpace**. stdout은 전부 `logs/`에 tee.

## 배경 (BACKLOG B-QA-02)
- R2b: 보정값 v2 저장 → 3안 v2 → "B안으로 편집 시작" 클릭 뒤 대화상자·`/studio` 이동 없음(3회, `/profile/profile-6`에서 30s 대기 초과). 스크립트 `dev/active/release-check-live/scripts/r2b-export2·4·5·7.mjs`, 로그 `logs/r2b-export2~7-run.txt`(main에 병합됨).
- 대조: 비교 보드 → 편집 시작은 정상(`scripts/r2a-A3.mjs`). 비교 추가 버튼은 `(aria-label || textContent).trim()`으로 찾아야 담긴다.
- 관련 코드: `app/src/features/profile/CandidatesSection.tsx` · `RestartDialog.tsx` · `CompareDialog.tsx`.

## 판정 질문 (하나만): 앱 결함인가, 자동화 스크립트 문제인가
1. **정적 조사(먼저, 6턴 이내)**: "B안으로 편집 시작" 버튼이 있는 컴포넌트와 클릭 핸들러를 찾아, 보정값 v2(프로필 새 버전) 상태에서 클릭 시 경로(대화상자 열림 조건 · 비활성 조건 · 이동 조건)를 file:line으로 표에 정리. 버튼이 `disabled`·`aria-disabled`·다른 요소에 가려질 조건이 있는지.
2. **재현 1회(새 TaskSpace, 한 스크립트로)**: R2b 경로를 그대로 따라가되, 클릭 직전에 대상 버튼의 `outerHTML`·`disabled`·`getBoundingClientRect`·`document.elementFromPoint(중심)` 결과·화면 텍스트 덤프 → 클릭 → 1s·3s 뒤 `[role=dialog]` 수·URL·콘솔 오류 수집. `logs/repro-1.txt`.
3. 판정 3갈래 중 하나로 결론:
   - **앱 결함**: 정상 사용자 클릭에도 반응 없음(근거: 핸들러 경로 + 실측) → 최소 재현 단계·원인 후보 file:line·심각도 제안. 수정하지 말 것.
   - **스크립트 문제**: 잘못된 요소 클릭·가림·대기 조건 오류 등(근거: elementFromPoint·selector 결과) → 올바른 조작으로 정상 이동하는 로그 1회.
   - **판별 불가**: 시도한 것·남은 가설.

## 마감
- QA-REPORT.md: 첫 줄 판정 · 정적 경로 표 · 재현 로그 요약 · (결함이면) 재현 단계·원인 후보·심각도 제안.
- preview 종료 · `lsof` 0줄 기록 · TaskSpace finish · 커밋 · `git status --short` 빈 값.

## 규칙
- git push·pull·fetch 금지. 서브에이전트 금지. 앱 코드 수정 금지(임시 변경도 금지 — 판별은 관찰로).
- 최대 30턴 — QA-REPORT 초안 커밋 20턴 전, 24턴부터 마감, 실행 상한 약 15분.
