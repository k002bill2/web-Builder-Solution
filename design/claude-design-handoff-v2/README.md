# Claude Design 핸드오프 v2 — 원본 사본 (수정 금지)

- 출처: claude.ai/design 프로젝트 `d1ec723c-ab95-481b-a230-b17ac334afb9` ("웹 빌더 솔루션 PRD 분석", 소유 영환, `PROJECT_TYPE_PROJECT`)
- 가져온 방법: Claude Code `DesignSync` 도구(claude_design MCP, `/design-login` 인증)의 **읽기 메서드 `get_file`만** 사용. 원격 쓰기 없음
- 가져온 시각: 2026-09-26 KST · 가져온 사람: Jarvis(영환님 요청 "Design Studio v2.dc.html 다시 적용해")
- 무결성: `SHA256SUMS` (가져온 바이트 그대로)

## 파일
| 경로 | 비고 |
|---|---|
| `project/Design Studio v2.dc.html` | 구현 기준. 화면 2a-01~2a-07 (1b 삭제, 1a 슬림 리비전) |
| `project/_ds/apfs-dashboard-ds-…/_ds_bundle.css` | 새 DS 토큰·유틸리티 (v1은 `apfs-design-system-…`) |
| `project/_ds/apfs-dashboard-ds-…/_ds_bundle.js` | ⚠️ **잘림(truncated)** — `get_file` 256KiB 상한. 262,144바이트만 받음, 문법상 불완전. 목업 렌더용 런타임이라 구현 기준으로 쓰지 않음 |
| `project/_ds/apfs-dashboard-ds-…/fonts/fonts.css` | Pretendard를 jsDelivr CDN에서 로드 — **앱에는 쓰지 않음**(자체 호스팅 결정, ADR-005 D1-갱신) |
| `project/_ds/apfs-dashboard-ds-…/styles.css` | 위 두 CSS import만 |
| `project/support.js` | v1과 바이트 동일 (dc 런타임) |

## 사용 규칙
- `design/`은 읽기 전용 (CLAUDE.md 규칙 3). v1(`design/claude-design-handoff/`)은 이력으로 보존
- 디자인 언어만 채용, `APFS`·`apfs` 명칭·로고·토큰 이름 금지 (ADR-002)
- 기능 → 사용성·접근성 → 일관성 → 목업 순 (ADR-003). px는 기준이 아님
