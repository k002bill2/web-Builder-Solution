# SEC-01 조치 기록

- 승인: 영환님 2026-09-25 Slack 선택 1 (R1·R2 적용)

| 권고 | 상태 | 내용 | 검증 |
|---|---|---|---|
| R2 | ✅ 적용 (Jarvis, 2026-09-25) | `~/.claude/settings.json`: `permissions.disableBypassPermissionsMode = "disable"` 추가, `skipDangerousModePermissionPrompt` true→false. 백업 `~/.claude/settings.json.bak-20260925-sec01`. 다른 키 변경 없음(스크립트로 대조) | `claude -p ... --dangerously-skip-permissions` 실행 시 세션 기록 `permissionMode` = `auto`(bypass 아님). Claude Code 2.1.282 |
| R1 | ⛔ 미적용 — **위험 수용** (영환님 2026-09-26: "R1은 자동을 위해 켜놓은거야 계속 사용할게") | Orca `agentDefaultArgs`의 bypass 인자 유지. 잔여 위험: Codex 자동 재개 세션은 승인·샌드박스 없이 실행 가능(R2가 Codex에는 적용 안 됨). Claude는 R2로 bypass가 `auto`로 강등되어 완화됨 | 재검토 조건: Orca 원격 접근 경로(R4) 변경 시, 또는 미확인 세션 재발 시 |
| R3 | ✅ 적용 (Jarvis, 2026-09-26, 영환님 "레퍼수정") | `~/.local/bin/hermes-claude-orca`: 종료 코드 파일 기반 완료 판정, stale 핸들 재탐색, 종료 탭 정리. 백업 `…/hermes-claude-orca.bak-20260926-r3` | 가짜 orca/claude 7개 시나리오 + 실제 Orca 1회(ok, exit 0) |
| R4·R5 | 대기 | Remote Control·모바일 페어링 정리, 탐지 규칙 | 영환님 확인 필요 3 |
