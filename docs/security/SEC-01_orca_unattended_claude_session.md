# SEC-01 — Orca 작업 공간의 미확인 대화형 Claude 세션 조사 결과

- 작성: Security · 2026-09-25 KST (조사 시점 22:00~22:30)
- 책임 역할: Security / 실행 환경: Hermes (로컬 설정·로그 읽기 전용 조사)
- 입력 브리프: `docs/06-handoff/SEC-01_SECURITY_BRIEF.md`
- 범위 준수: 설정 변경·프로세스 종료·파일 삭제·외부 발송 없음. 비밀값(토큰·키·OAuth·기기 토큰)은 존재 여부만 기록.

---

## 0. 결론 (한 줄)

두 세션 모두 **Orca의 "잠든 에이전트 세션 자동 재개(sleeping agent resume)" 기능이 새로 띄운 별도의 대화형 `claude --resume` 프로세스**입니다.
래퍼의 `claude -p` 작업이 이미 끝난 뒤, UI에서 해당 작업 공간을 클릭(활성화)하자 새 탭이 생겼고, Orca 전역 설정 `agentDefaultArgs.claude = "--dangerously-skip-permissions"`가 붙어 **bypass 모드**로 떴습니다.

| 가설 | 판정 | 요지 |
|---|---|---|
| H1 같은 `-p` 세션이 대화형 뷰로 재부착된 것일 뿐 | **기각** (일부만 맞음) | 새 탭 ID·새 PTY·새 프로세스이며 `-p` 프로세스는 이미 종료(exit 0)된 상태. 다만 **같은 Claude 대화 ID를 `--resume`로 이어받았다**는 점에서 "같은 대화"이기는 함 |
| H2 Orca 에이전트 기능이 별도 대화형 Claude를 띄움 | **확인** (경로 보정) | `worktree create --agent` 기본값이 아니라, **작업 공간 활성화 시 sleeping agent 재개**가 원인. `launchAgent: "claude"`, launchConfig `--dangerously-skip-permissions` 기록 |
| H3 사용자가 UI에서 직접 열었다 | **부분 확인 / 미확인** | 방아쇠는 UI의 사이드바 작업 공간 클릭(`sidebar_worktree_activate`) — 사람의 조작으로 보이나, 클릭한 주체가 영환님인지 확인 불가. 사용자가 "Claude를 열겠다"는 의도로 연 것은 아님 (자동 재개 부작용) |
| bypass 출처 | **확인** | Orca 설정 `agentDefaultArgs.claude = "--dangerously-skip-permissions"`(Orca 기본값 `agentYoloDefaultsMigrated: true`). 전역 `defaultMode: "auto"`는 bypass가 아님. 프로젝트 `.claude/settings.json`엔 `defaultMode` 없음. shift+tab 전환 근거 없음 |

- **위험도: High** (Likelihood Medium~High / Impact High) — 근거는 §4.
- `terminal_handle_stale`는 **같은 UI 동작이 만든 별개 증상**입니다. UI가 작업 공간을 다시 보여주며 PTY를 재부착(`binding.origin: "reattach"`)할 때 래퍼가 들고 있던 핸들이 무효화되었습니다. 대화형 세션 생성 원인은 아닙니다.

---

## 1. 재구성한 타임라인 (KST, 사실)

### 1-1. `qa-1a-01`

| 시각 | 사건 | 근거 |
|---|---|---|
| 18:54:45 | 래퍼 탭 `477bd63d…`("Qa · Claude Code via Orca") 생성, PTY `…qa-1a-01@@0d5ddefd`, 명령 길이 542 | `logs/daemon.log` `startup-command-delivery` / `orca-data.json.bak.3` |
| 18:54:48 | `claude -p` 세션 `66584b1c…` 시작, `entrypoint: sdk-cli`, `permissionMode: auto` | `~/.claude/projects/-Users-…-qa-1a-01/66584b1c….jsonl` 6번째 줄 |
| 18:57:01 | Orca가 이 `-p` 세션을 sleeping 기록으로 저장 (`state: "working"`, `origin: "live"`) | `orca-data.json.bak.3` `sleepingAgentSessionsByPaneKey` |
| 19:01:21 | UI가 PTY 재부착 (`persistence.pty-binding` `binding.origin: "reattach"`), 19:01:22·27 `sidebar_worktree_activate` | `logs/main.trace.ndjson` |
| 19:01:33 | 래퍼가 `terminal_handle_stale` 수신 (2건) | Jarvis `state.db` 도구 결과 |
| 19:08:42~43 | `-p` 세션 마지막 기록, PTY 종료 `exitCode: 0` | transcript 마지막 줄 / `terminal-history/…@@0d5ddefd/meta.json` |
| 19:16:43 | 래퍼 재실행 (PTY `@@eb807065`, 세션 `30d146c4…`, `-p`, auto) | daemon.log / transcript |
| **19:16:56** | **`sidebar_worktree_activate`** (UI에서 작업 공간 클릭) | main.trace |
| **19:16:58** | **새 탭 `dd866815…` "Terminal 2" 생성, `launchAgent: "claude"`, PTY `@@0786450d`, 시작 명령 길이 89** | `orca-data.json.bak.2` `tabsByWorktree`, daemon.log `startup-command-delivery` |
| 19:17:21 | 새 탭의 에이전트 기록: 대상 세션 `66584b1c…`, `launchConfig.agentCommand: "claude '--dangerously-skip-permissions'"`, `state: "done"`(입력 대기) | `orca-data.json.bak.2` `sleepingAgentSessionsByPaneKey["dd866815…"]` |
| 19:24:57 | Jarvis가 `term_f0bf7e63…` 확인 | Jarvis `state.db` |
| 20:49:07 | Jarvis `terminal close` → `tabId: dd866815…`, `ptyKilled: true` | main.trace `terminal.close` |

### 1-2. `m1-ui-01-fix`

| 시각 | 사건 | 근거 |
|---|---|---|
| 20:49:43 | 래퍼 탭 `7daeb0fd…`(customTitle "Developer · Claude Code via Orca"), PTY `@@41440b44` | daemon.log / `orca-data.json.bak.1` |
| 20:49:48 | `claude -p` 세션 `7c80308f…` 시작 (`sdk-cli`, `auto`) | transcript |
| 20:52:49~52 | UI PTY 재부착 (`reattach`) | main.trace |
| 20:53:02 · 20:53:19 | 래퍼 `terminal_handle_stale` (2건, 두 번째는 "wrapper exited early") | Jarvis `state.db` |
| 20:58:01 | sleeping 기록 `7c80308f…` `state: "working"` | `orca-data.json.bak.1` |
| 21:23:42~43 | `-p` 세션 종료 `exitCode: 0` | transcript / `…@@41440b44/meta.json` |
| 21:29:01 | 래퍼 재실행 (PTY `@@c590060b`, 세션 `5eea3c3e…`, `-p`, auto) | daemon.log / transcript |
| **21:29:51** | **`sidebar_worktree_activate`** | main.trace |
| **21:29:51** | **새 탭 `11a8b9b1…` "Terminal 3", `launchAgent: "claude"`, PTY `@@a11259fc`, 시작 명령 길이 89, `aiVaultTitle.sessionId: 7c80308f…`** | `orca-data.json.bak.0`, daemon.log |
| 21:58:14 | Jarvis `terminal close` → `tabId: 11a8b9b1…`, `ptyKilled: true` | main.trace |

### 1-3. `terminal_handle_stale` 5건 대응

19:01:33 ×2, 19:17:52 ×1, 20:53:02 ×1, 20:53:19 ×1 — 모두 직전 수 초~수십 초 안에 UI 재부착(`reattach`) 또는 `sidebar_worktree_activate`가 있습니다.

---

## 2. 가설별 근거

### H1 — 기각

1. 대화형 탭과 래퍼 탭은 서로 다른 탭입니다. 탭 ID가 `477bd63d`와 `dd866815`, `7daeb0fd`와 `11a8b9b1`로 다릅니다.
2. PTY도 새로 만들어졌습니다(`@@0786450d`, `@@a11259fc`). daemon.log에는 각각 `session-created` 이벤트가 있습니다.
3. 원래 `-p` PTY는 대화형 탭이 생기기 **전에** 이미 exit 0으로 종료되었습니다(19:08:43, 21:23:43).
4. 대화형 탭의 시작 명령 길이는 **89바이트**입니다. 래퍼 명령은 542~867바이트입니다. `claude '--dangerously-skip-permissions' --resume '<36자 UUID>'` 형태의 길이 87~89와 맞습니다(추정, 명령 원문은 로그에 없음).
5. 보정: 새 세션은 **같은 Claude 대화 ID**(`66584b1c`, `7c80308f`)를 이어받았습니다. transcript 파일 mtime이 close 시각(20:49:08, 21:58:16)에 다시 갱신되었습니다. 대화는 같고 프로세스와 권한 모드는 새로 생긴 것입니다.

### H2 — 확인 (sleeping agent resume 경로)

1. Orca는 에이전트 훅(`~/.claude/settings.json` hooks의 `ORCA_AGENT_HOOK_*`)으로 `-p` 실행도 에이전트 세션으로 인식하고 `sleepingAgentSessionsByPaneKey`에 기록합니다.
2. 두 `-p` 세션은 `max-turns`·턴 한도로 끝나서 기록이 `state: "working"`에 머물렀습니다(`bak.3`, `bak.1`).
3. Orca 앱 번들(`/Applications/Orca.app/Contents/Resources/app.asar`, v1.4.211)의 재개 로직 구조는 다음과 같습니다(정적 문자열 확인, 읽기 전용).
   1. 작업 공간이 활성화되면 해당 worktree의 sleeping 기록을 순회합니다.
   2. `done`이 아니고 30분(`18e5` ms)이 지나지 않은 기록은 재개합니다.
   3. `createTab(worktreeId, …, {launchAgent: agent, pendingStartup: {command: launchCommand, resumeProviderSession, …}, automaticResumeClaim: …})`로 새 탭을 만듭니다.
   4. 인자는 `agentArgs: settings.agentDefaultArgs[agent]`에서 가져옵니다.
4. 두 경우 모두 `sidebar_worktree_activate`와 **같은 초**에 새 탭이 생겼습니다(19:16:56→58, 21:29:51→51).
5. `worktree create --agent` 경로는 아닙니다. Jarvis의 `worktree create` 호출에는 `--agent`가 없습니다. 기본 탭 `507a32c4`(20:49:27)도 `hasCommand: false`여서 명령 없이 셸만 떴습니다.
6. 참고: 모바일 클라이언트가 작업 공간을 활성화할 때도 `resumeSleepingAgents`가 호출되는 코드 경로가 있습니다(`clientKind === "mobile"`). 이번 두 건의 trace는 데스크톱 renderer의 `sidebar_worktree_activate`입니다.

### H3 — 부분 확인 / 주체 미확인

- 방아쇠는 사람의 UI 클릭입니다. `sidebar_worktree_activate`는 사이드바 카드 클릭 핸들러에서만 기록됩니다.
- 누가 클릭했는지는 로그로 식별할 수 없습니다. 영환님이 진행 상황을 보려고 클릭했을 가능성이 가장 높습니다(추정).
- 사용자가 새 Claude 세션을 **의도해서** 연 흔적은 없습니다. 새 대화형 탭의 transcript에는 사용자 입력 기록이 없고, 마지막 대화 타임스탬프가 `-p` 종료 시각입니다.

### bypass permissions의 출처 — 확인

| 후보 | 값 | 판정 |
|---|---|---|
| Orca 기본 실행 인자 `settings.agentDefaultArgs.claude` | `--dangerously-skip-permissions` (`agentYoloDefaultsMigrated: true`, 번들 기본값 상수 `NEe.claude`와 동일) | **원인** |
| sleeping 기록 `launchConfig.agentArgs` | `--dangerously-skip-permissions` (qa-1a-01 건 직접 기록) | 원인 전달 경로 |
| transcript 끝 `{"type":"permission-mode","permissionMode":"bypassPermissions"}` | 재개된 두 세션(`66584b1c`, `7c80308f`)에만 있고, 재개되지 않은 `-p` 세션(`30d146c4`, `5eea3c3e`)에는 없음 | 재개 세션이 bypass로 돈 증거 |
| 전역 `~/.claude/settings.json` `permissions.defaultMode` | `auto` = 분류기 기반 자동 승인. bypass 아님. `-p` 실행은 모두 `permissionMode: auto`로 기록 | 원인 아님 |
| 전역 `skipDangerousModePermissionPrompt: true` | bypass 진입 시 뜨는 경고 확인창을 생략 | **악화 요인** (사람 확인 없이 bypass 진입) |
| 프로젝트 `.claude/settings.json` (main, 두 브랜치) | `defaultMode` 없음. 두 worktree 경로는 이미 삭제되어 로컬 파일 없음 | 원인 아님 |
| managed settings `/Library/Application Support/ClaudeCode/managed-settings.json` | 없음 | 해당 없음 |
| 세션 중 shift+tab 전환 | 근거 없음 (사용자 입력 기록 없음) | 원인 아님 |

m1-ui-01-fix 건은 `launchConfig` 스냅샷이 백업 사이에 사라져서 직접 기록이 없습니다. 다만 동일한 설정과 명령 길이 89, 화면의 "bypass permissions on", transcript의 `bypassPermissions` 기록으로 같은 경로라고 판단합니다.

---

## 3. 조사 항목별 결과 요약

1. **Orca 설정·로그**: `~/Library/Application Support/orca/`의 다음 항목을 확인했습니다.
   - `logs/daemon.log`, `logs/main.trace.ndjson`
   - `profiles/local-default/orca-data.json` 및 `.bak.0~4`
   - `terminal-history/*`, `mobile-notification-dismissals.json`, `orca-devices.json`(구조만)
   - 관련 설정값: `defaultTuiAgent: "claude"`, `experimentalAgentHibernation: false`, `agentStatusHooksEnabled: true`
   - 권한 관련 설정: `skipCloseTerminalWithRunningProcessConfirm: false`
2. **CLI 기본값**:
   - `orca worktree create --agent`: 지정해야만 첫 터미널에 에이전트를 띄우며 기본값은 없습니다.
   - `orca terminal create`: `--command`만 실행합니다.
   - `orca agent-context`: 사람용 출력은 안내 1줄뿐이고, `--json` 스키마에는 자동 재개 설정 키가 드러나지 않습니다.
3. **Claude 권한 모드**:
   - `auto`는 분류기 기반 자동 승인이며 bypass가 아닙니다(공식 문서 https://code.claude.com/docs/en/permissions).
   - bypass는 Orca가 넘긴 `--dangerously-skip-permissions`에서 왔습니다.
4. **세션 기록 메타데이터** (`~/.claude/projects/`):

| 작업 공간 | 세션 | 시작~마지막(KST) | 진입점 | 권한 기록 | 비고 |
|---|---|---|---|---|---|
| qa-1a-01 | `66584b1c` | 18:54:48~19:08:42 | `sdk-cli`(=`-p`) | auto → 끝에 bypassPermissions | 19:16:58 대화형으로 재개됨, mtime 20:49:08 |
| qa-1a-01 | `30d146c4` | 19:16:51~19:24:25 | `sdk-cli` | auto | 재개 없음 |
| m1-ui-01-fix | `7c80308f` | 20:49:48~21:23:42 | `sdk-cli` | auto → 끝에 bypassPermissions | 21:29:51 대화형으로 재개됨, mtime 21:58:16 |
| m1-ui-01-fix | `5eea3c3e` | 21:29:04~21:47:30 | `sdk-cli` | auto | 재개 없음 |

   두 작업 공간에서 `entrypoint: cli`(대화형으로 새로 시작된 세션)는 **0건**입니다. 재개된 세션은 기존 파일에 이어서 기록되며, 사용자·도구 실행 기록은 추가되지 않았습니다(대화 내용 전문은 열람·출력하지 않았습니다).

---

## 4. 위험 평가

**Risk Severity: High** — Likelihood Medium~High, Impact High

### 4-1. 위협 시나리오

| # | 시나리오 | 조건 | 영향 | 분류 |
|---|---|---|---|---|
| T1 | 사람이 진행 상황을 보려고 작업 공간을 클릭 → bypass 대화형 세션이 **이전 작업 맥락을 그대로 가진 채** 입력 대기로 남음 → 이후 누군가 잘못된 탭에 입력하면(예: 다른 탭인 줄 알고 "계속") 권한 확인 없이 파일 쓰기·셸·git 실행 | UI 클릭만으로 재현됨 (이미 2회 발생) | worktree 쓰기, 사용자 권한의 모든 셸 명령. 프로젝트 허용 목록에 `git push:*` 존재. bypass 모드는 `.git`·`.claude` 보호 경로 쓰기도 확인 없이 허용(공식 문서) | CWE-1188 안전하지 않은 기본값, CWE-276 부적절한 기본 권한, OWASP A05 Security Misconfiguration |
| T2 | **원격 입력 경로**: Claude Remote Control(`remoteControlAtStartup: true`, transcript에 `bridge-session` 기록 2건)과 Orca 모바일 페어링 기기 2대(`scope: mobile`, `pairingReach: network`, 1대 최근 접속 2026-09-25 20:53, 토큰 존재)로 **로컬 콘솔 밖에서** 이 세션에 입력 가능 | 계정 또는 페어링 기기 탈취·오조작 | T1과 같음. 원격에서 무인 bypass 실행 가능 | MITRE ATT&CK T1219 Remote Access Software(오용 관점), T1078 Valid Accounts |
| T3 | 로컬 동일 사용자 프로세스가 Orca 런타임 소켓(`o-*.sock`, 권한 `0600`)으로 `orca terminal send`를 보냄 → bypass 세션에 명령 주입 | 로컬 사용자 권한의 악성·오작동 프로세스 | 동일 | CWE-284 |
| T4 | 이전 작업 맥락에 포함된 외부 텍스트(문서·웹·테스트 출력)의 프롬프트 인젝션이 사람 입력 한 번으로 bypass 상태에서 실행 | 입력 1회 | 동일 | OWASP LLM01 |
| T5 | 감사 추적 공백: 래퍼는 "비대화형·권한 확인 유지"를 전제로 설계됐는데 Orca가 같은 대화를 권한 우회로 복제함. Jarvis 기준으로는 **통제 밖 세션**이 됨 | 상시 | 책임 추적·재현성 훼손, 래퍼의 `terminal wait` 실패 | 거버넌스 |

### 4-2. 완화 요인 (사실)

- 두 세션 모두 사용자·도구 실행 기록이 없습니다. 입력이 들어간 흔적이 없고, Jarvis가 `ptyKilled: true`로 닫았으며, 작업 트리에 커밋되지 않은 변경이 없었습니다(Jarvis 보고).
- bypass에서도 hook은 실행됩니다(추정, 공식 동작). 전역 `PreToolUse`(Bash 안전 검사, GSD 가드)와 프로젝트 가드 hook(파괴적 명령·보호 경로 차단)이 일부 방어합니다.
- deny 규칙 `docker compose down -v` 등도 유지되는 것으로 추정합니다.
- 재개는 활성화 시점 기준으로 `-p` 종료 후 30분 이내이고 `state ≠ done`인 기록에만 적용됩니다. 무한정 재개되지는 않습니다.

### 4-3. 영향 범위

- 해당 worktree 전체와 사용자 홈 전체(셸 권한)
- git 원격(`git push`는 bypass로 확인 없이 가능)
- `~/.claude` 인증 정보, SSH 키, 네트워크 접근

---

## 5. 권고 (제안만 — 적용하지 않았음)

적용 순서는 효과가 크고 부작용이 적은 순입니다. 모두 **영환님 승인 후** Jarvis가 적용하는 것을 전제로 합니다.

### R1. Orca의 Claude 기본 인자에서 bypass 제거 (최우선, 근본 원인)

- AS-IS: Orca 설정 `agentDefaultArgs.claude = "--dangerously-skip-permissions"`, `claude-agent-teams`·`openclaude`도 같음
- TO-BE: 빈 문자열 `""`(Claude 기본 `defaultMode: auto` 적용) 또는 `"--permission-mode auto"`
- 적용 방법: Orca UI의 Settings에서 에이전트 기본 인자 변경. `orca-data.json`을 직접 편집하는 것은 앱 실행 중 덮어쓰기·손상 위험이 있어 권장하지 않습니다.
- 참고: 같은 설정 블록에 `codex: --dangerously-bypass-approvals-and-sandbox`, `gemini/cursor/copilot/hermes: --yolo` 등 **모든 에이전트가 무확인 모드 기본값**입니다. 사용하는 에이전트(최소 codex)도 함께 검토하는 것이 좋습니다. Jarvis 운영 규칙에도 "Codex `--dangerously-bypass-approvals-and-sandbox` 사용 금지"가 있습니다.
- 검증 방법 (읽기 전용):
  ```
  python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/Library/Application Support/orca/profiles/local-default/orca-data.json')));print(d['settings']['agentDefaultArgs'].get('claude'))"
  ```
  기대값: `--dangerously-skip-permissions`가 없음

### R2. 사용자 수준에서 bypass 모드를 잠금 (Defense in Depth, Fail-Secure)

- 전역 `~/.claude/settings.json`에 추가하는 방안입니다.
  ```json
  "permissions": { "disableBypassPermissionsMode": "disable" }
  ```
- 공식 문서상 어느 설정 범위에서든 동작하며, Orca가 플래그를 넘겨도 bypass 진입이 거부됩니다.
- `skipDangerousModePermissionPrompt: true`를 `false`로 되돌려 bypass 진입 시 확인창이 다시 뜨게 하는 것도 권장합니다.
- 영향: 영환님이 수동으로 bypass를 쓰는 워크플로가 있다면 막힙니다. 먼저 **영환님 확인이 필요**합니다.
- 검증 (지정 프로젝트에서 부작용 없는 명령):
  ```
  claude --dangerously-skip-permissions -p "echo" --max-turns 1
  ```
  기대 결과: bypass 거부 메시지 또는 auto/default로 강등

### R3. 래퍼 실행이 sleeping 재개 대상이 되지 않게 하기 (래퍼 측)

1. 래퍼가 `-p` 실행 뒤 Orca에 "완료"로 인식되게 하는 방법이 필요합니다. 선택지는 두 가지입니다.
   - a) 래퍼 명령에 Orca 에이전트 훅 비활성 환경변수를 넘기기 — 훅 스크립트가 `ORCA_AGENT_HOOK_PORT/TOKEN/PANE_KEY` 없으면 즉시 종료합니다. 해당 변수 해제 방식을 Developer가 검증해야 합니다(**확인 필요**).
   - b) 실행 종료 후 래퍼가 해당 탭을 `orca terminal close --tab`으로 닫아 sleeping 기록을 정리하기 — 번들 코드상 탭 close 시 해당 탭의 sleeping 기록이 삭제됩니다.
2. `terminal_handle_stale` 대응: 핸들이 무효화되면 `orca terminal list --worktree … --json`으로 같은 `ptyId`/`incarnationId`를 다시 찾아 이어서 기다리도록 합니다. 현재는 즉시 실패로 끝납니다.
3. 운영 규칙: 래퍼 실행 중이거나 종료 후 30분 안에는 Orca UI에서 해당 작업 공간 클릭을 피하고, 진행 확인은 `orca terminal read` 또는 `PROGRESS.md`로 합니다. 임시 조치이며 R1이 적용되면 불필요합니다.

### R4. 원격 입력면 축소

- Claude `remoteControlAtStartup: true` 필요 여부를 재검토합니다. 필요 없으면 `false`로 바꿉니다.
- Orca 모바일 페어링 기기 2대 중 사용하지 않는 기기(2026-07-15 페어링, 마지막 접속 09-23)는 해제를 검토합니다.
- 두 항목 모두 원격에서 bypass 세션에 입력할 수 있는 경로입니다. 대상이 영환님 본인 기기인지 **확인이 필요**합니다.

### R5. 탐지·모니터링

- Jarvis 정기 점검(읽기 전용) 방안: `orca terminal list --json`에서 `agentIdentity == "claude"`이면서 제목이 래퍼 규칙(`* · Claude Code via Orca`)이 아닌 터미널을 경고합니다.
- `~/.claude/projects/**.jsonl`에서 `"permissionMode":"bypassPermissions"` 신규 출현을 감지합니다.
- 두 검사 모두 비밀값을 읽지 않습니다.

---

## 6. 실행한 검증 명령 (전부 읽기 전용)

| 명령 / 대상 | 결과 요약 |
|---|---|
| `orca --version`, `orca status --json` | 1.4.211, runtime ready |
| `orca terminal create --help`, `worktree create --help`, `terminal wait/show --help`, `orca agent-context --json` | `--agent`는 명시할 때만 동작, 자동 재개 설정은 CLI에 노출되지 않음 |
| `orca terminal list --json`, `orca worktree list --json` | 조사 시점에 대상 두 worktree는 이미 제거됨(`ds-1a-03`만 존재) |
| `logs/daemon.log` 세션 ID grep | 4개 래퍼 PTY와 2개 재개 PTY의 생성·종료 확인 |
| `logs/main.trace.ndjson` 시간창 필터 | `sidebar_worktree_activate`, `reattach`, `terminal.close` 확인 |
| `profiles/local-default/orca-data.json(.bak.0~4)` JSON 파싱(비밀 키 마스킹) | 탭·sleeping 기록·`agentDefaultArgs` 확인 |
| `terminal-history/*/meta.json`, `checkpoint.json`, `output.log`(ANSI 제거) | 래퍼 PTY 시작·종료·exit code |
| `~/.claude/projects/…/*.jsonl` 메타데이터 집계(`entrypoint`, `permissionMode`, `type`, 타임스탬프만) | 표 3-4 |
| `~/.claude/settings.json`, 프로젝트 `.claude/settings.json`, managed settings 경로 | `defaultMode: auto`, `skipDangerousModePermissionPrompt: true`, `remoteControlAtStartup: true`, 프로젝트 `defaultMode` 없음, managed 없음 |
| `app.asar` 정적 문자열 검색(python mmap, 읽기 전용) | sleeping 재개 → `createTab({launchAgent, pendingStartup})`, `agentArgs = settings.agentDefaultArgs[agent]`, 기본값 상수 `claude: --dangerously-skip-permissions` |
| Jarvis `state.db` 읽기 전용 조회(도구 호출·결과의 핸들/오류 문자열만) | `terminal_handle_stale` 5건 시각, Jarvis의 `worktree create`에 `--agent` 없음 |

비밀값 처리: Orca 기기 토큰, daemon 토큰, `agent-session-authority.key`, `claude-runtime-auth`, `account-session.json.enc`, e2ee 키쌍은 **열람하지 않았습니다**. 존재만 확인했습니다. `orca-devices.json`은 필드 구조와 토큰 존재 여부만 확인했습니다. 계정 이메일·조직 ID는 이 문서에 쓰지 않았습니다.

---

## 7. 사실 / 추정 / 확인 필요

**사실**
- 두 대화형 세션은 새 탭·새 PTY로 생성된 `launchAgent: claude` 재개 세션입니다.
- 생성 시각이 `sidebar_worktree_activate`와 같은 초입니다.
- Orca `agentDefaultArgs.claude = --dangerously-skip-permissions`입니다.
- 재개된 transcript에만 `bypassPermissions` 기록이 있습니다.
- 사용자·도구 실행 기록은 없습니다.

**추정**
- 시작 명령 89바이트는 `claude '--dangerously-skip-permissions' --resume '<id>'`입니다. 원문은 로그에 없습니다.
- 클릭 주체는 영환님일 가능성이 높습니다.
- bypass 상태에서도 hook과 deny 규칙이 적용됩니다.

**확인 필요 (영환님)**
1. 19:16:56·21:29:51 무렵 Orca 사이드바에서 해당 작업 공간을 클릭했는지
2. bypass 모드를 수동으로 쓰는 워크플로가 있는지 — R2 적용 가능 여부 판단용
3. Claude Remote Control과 모바일 페어링 기기 2대가 모두 본인 기기이고 계속 필요한지 — R4
4. Orca 설정에서 에이전트 자동 재개를 끄는 별도 옵션이 있는지. CLI·설정 키에서는 찾지 못했으며, UI 확인 또는 Orca 문서 조회가 필요합니다.

**잔여 위험**
- R1 적용 전까지는 래퍼 실행 뒤 30분 안에 해당 작업 공간을 클릭하면 같은 현상이 재현됩니다.
- 다른 에이전트(codex 등)의 무확인 기본값도 같은 경로로 재개될 수 있습니다(추정).

**충돌·누락**
- 브리프는 `m1-ui-01-fix` 세션 확인 시각을 21:5x로 적었습니다. 실제 생성은 21:29:51이고 21:5x는 발견 시각입니다.
- m1-ui-01-fix 건의 `launchConfig` 직접 스냅샷은 없습니다(백업 주기 사이에 소멸).
- 이번 조사 범위는 로컬 기록입니다. Remote Control 경로로 외부 입력이 있었는지는 Anthropic 측 기록이라 확인할 수 없지만, transcript에 입력 기록은 없습니다.

## 8. Jarvis 추천 다음 조치

1. 영환님께 §7 확인 필요 1~3을 묻고, **R1(Orca 설정 변경)** 승인을 받습니다. UI에서 1분 이내 작업입니다(추정).
2. 승인 후 R2를 검토하고, R3은 Developer에게 래퍼 개선 브리프로 전달합니다.
