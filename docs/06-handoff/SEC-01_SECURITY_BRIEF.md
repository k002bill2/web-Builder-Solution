# Security 핸드오프 — SEC-01: Orca 작업 공간의 미확인 대화형 Claude 세션 조사 (읽기 전용)

- 작성: Jarvis · 2026-09-25 KST
- 책임 역할: Security / 실행 환경: Hermes (저장소 코드 변경 없음 — 로컬 설정·로그 읽기 전용 조사)
- 범위: **읽기 전용.** 설정 변경·프로세스 종료·파일 삭제·외부 발송 금지. 비밀값(토큰·키)은 출력하지 않고 존재 여부만 기록.

## 1. 현상 (사실)
- Orca 작업 공간에 Jarvis가 실행하지 않은 **대화형 Claude Code 세션**이 두 번 나타났다.
  1. `qa-1a-01` 작업 공간 — `term_f0bf7e63-e68f-4e68-831c-07aa509a0e11`, 2026-09-25 19:2x 확인, 입력 대기 상태
  2. `m1-ui-01-fix` 작업 공간 — `term_109a0f5e-792a-4597-aa73-d190deaa7aca`, 21:5x 확인. `orca terminal show`: `agentIdentity: "claude"`, 제목 `✳ Claude Code`, 화면 하단 **"⏵⏵ bypass permissions on"**, 직전 화면에 `app/src/test/renderApp.tsx` diff(Developer 작업 내용과 같은 파일) 표시
- Jarvis의 래퍼 `/Users/younghwankang/.local/bin/hermes-claude-orca`는 `claude -p ... --output-format json`(비대화형)만 실행하고 `--dangerously-skip-permissions`를 쓰지 않는다.
- 같은 시기에 래퍼는 `orca terminal wait`에서 반복적으로 `terminal_handle_stale` 오류를 받았다(5회). 래퍼가 연 터미널 핸들이 무효가 된 뒤, 같은 작업 공간에 대화형 세션이 보였다.
- 두 세션 모두 Jarvis가 닫았다(`orca terminal close`). 작업 트리에 커밋되지 않은 변경은 없었다.
- 전역 `~/.claude/settings.json`의 `permissions.defaultMode`는 `auto`.
- 화면 캡처 텍스트: `/Users/younghwankang/.hermes/profiles/jarvis/cache/unknown_session_term_109a0f5e.txt`

## 2. 가설 (검증 대상)
- H1: Orca가 `claude -p` 비대화형 프로세스를 에이전트로 인식해 탭을 **대화형 Claude 뷰로 재부착**(재incarnation)하면서 핸들이 바뀌었다 — 동일 세션의 표시 변화일 뿐 새 세션이 아니다.
- H2: Orca의 에이전트 기능(작업 공간 생성 시 `--agent` 기본값, 또는 UI 자동 시작)이 별도 대화형 Claude를 띄웠다.
- H3: 사용자가 Orca UI에서 직접 열었다.
- 각 가설에서 "bypass permissions on"이 어디서 왔는지(Orca 기본 실행 인자, 프로젝트 `.claude/settings.json`, 전역 설정 `defaultMode`, 세션 중 shift+tab 전환).

## 3. 조사 항목
1. Orca 설정·로그(`~/Library/Application Support/orca` 등)에서 작업 공간 `m1-ui-01-fix`·`qa-1a-01`의 터미널 생성 이력, 에이전트 자동 시작 설정, 기본 Claude 실행 인자
2. `orca agent-context`, `orca terminal --help`·`orca worktree create --help`의 에이전트 관련 기본값
3. Claude Code 권한 모드 설정 출처: 전역 `~/.claude/settings.json`, 프로젝트 `.claude/settings.json`, `defaultMode` 값의 의미(`auto`가 bypass를 뜻하는지), Orca가 넘기는 인자
4. `~/.claude/projects/` 세션 기록에서 해당 작업 공간 경로의 세션 수·시작 시각·진입점(`-p` 여부) — 내용 전문은 출력하지 말고 메타데이터만
5. 위험 평가: 권한 확인 없는 대화형 세션이 입력 대기로 남을 때의 위협(Orca UI 입력 경로, 로컬 사용자 외 접근 가능성), 영향 범위(작업 공간 파일, 셸 명령)

## 4. 산출물
`/Users/younghwankang/Work/web-builder-solution/docs/security/SEC-01_orca_unattended_claude_session.md` — 파일 1개만 작성(커밋은 Jarvis가 한다)
- 결론(가설 판정: 확인/기각/미확인), 근거(파일 경로·명령·로그 줄), 위험도(Low/Medium/High), 권고(설정 변경안은 **제안만**, 적용 금지), 확인 필요
