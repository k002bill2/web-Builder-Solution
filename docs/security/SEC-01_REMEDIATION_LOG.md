# SEC-01 조치 기록

- 승인: 영환님 2026-09-25 Slack 선택 1 (R1·R2 적용)

| 권고 | 상태 | 내용 | 검증 |
|---|---|---|---|
| R2 | ✅ 적용 (Jarvis, 2026-09-25) | `~/.claude/settings.json`: `permissions.disableBypassPermissionsMode = "disable"` 추가, `skipDangerousModePermissionPrompt` true→false. 백업 `~/.claude/settings.json.bak-20260925-sec01`. 다른 키 변경 없음(스크립트로 대조) | `claude -p ... --dangerously-skip-permissions` 실행 시 세션 기록 `permissionMode` = `auto`(bypass 아님). Claude Code 2.1.282 |
| R1 | ⏳ 영환님 Orca UI에서 적용 대기 | Orca 설정 `agentDefaultArgs.claude`(및 `claude-agent-teams`·`openclaude`)의 `--dangerously-skip-permissions`, `codex`의 `--dangerously-bypass-approvals…` 제거. Orca CLI에 설정 명령이 없고 앱 실행 중 JSON 직접 수정은 덮어쓰기 위험 | 적용 후 `orca-data.json`의 `agentDefaultArgs` 재확인 |
| R3 | 대기 | 래퍼 보완(stale 핸들 재탐색·종료 탭 정리) — 공용 도구 변경 승인 필요 | |
| R4·R5 | 대기 | Remote Control·모바일 페어링 정리, 탐지 규칙 | 영환님 확인 필요 3 |
