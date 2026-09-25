# Developer 핸드오프 (이어하기) — M1-UI-01-FIX-R: 그룹 C 마무리 + 그룹 D + B-DET-02 + 보고

- 작성: Jarvis · 2026-09-25 KST
- 책임 역할: Developer / 실행 환경: Orca + Claude Code (`--role developer`) · 작업 공간 `m1-ui-01-fix`(이전 실행과 동일)
- 원 브리프: `docs/06-handoff/M1-UI-01-FIX_DEVELOPER_BRIEF.md` · **판단 기준은 ADR-003**(`docs/decisions/ADR-003-function-first-design.md`)
- 턴 예산 **70** · 체크포인트 `dev/active/m1-ui-01-fix/PROGRESS.md`
- **55턴을 넘기면 새 작업을 멈추고, 그때까지를 커밋한 뒤 반드시 `REPORT.md`를 쓰고 커밋한다.** (이전 실행이 턴 한도로 보고서 없이 끝났다)

## 0. 현재 상태 (다시 하지 않는다)
- 그룹 A `317b192`, 그룹 B `7a46d4b` 커밋 완료. 테스트 102개 통과 기록이 PROGRESS.md에 있다.
- **그룹 C가 커밋되지 않은 채 작업 트리에 남아 있다**: `app/eslint.config.js`, `app/package.json`, `app/src/app/routes.tsx`, `app/src/components/layout/AppLayout.tsx`, `app/src/main.tsx`, `app/src/test/renderApp.tsx`, `app/src/test/setup.ts`, `app/vite.config.ts`, 신규 `app/scripts/check-bundle-size.mjs`.
- 이 브랜치에 `main`의 문서 커밋(ADR-003, 백로그, 이 브리프, CLAUDE.md 규칙 3 개정)이 합쳐져 있다. 코드 변경은 없다.
- 이전 실행이 띄운 확인용 서버(4317·4318)는 Jarvis가 종료했다.

## 1. 할 일 (이 순서로)
1. **그룹 C 마무리** — 먼저 `git diff`로 남은 변경을 읽고 의도를 파악한 뒤 이어서 완성한다.
   - 수용: 초기 로드 JS gzip ≤ 90KB, `check-bundle-size` 스크립트가 예산 초과 시 실패(RED 기록 — 분할 전 상태에서 실패했음을 보여줄 것. 이미 지나갔다면 예산 값을 일시적으로 낮춰 실패를 재현하고 원복).
   - 라우트 lazy 로딩 중 로딩 상태가 보이도록(빈 화면 금지).
   - 검증 4종 통과 후 커밋.
2. **그룹 D** — 원 브리프 그대로: 스크롤 명시 제어(상세 진입·유사 이동 맨 위 / 필터 변경 위치 유지 / 뒤로 가기 복원), 경쟁 상태 테스트(id 일치 검사 제거 시 실패하는 RED 확인). 커밋.
3. **B-DET-02 유사 레퍼런스 이름 말줄임** (`docs/06-handoff/BACKLOG.md`) — 사용성 기준: 이름을 식별할 수 있게(2줄 허용 또는 전체 이름 노출). 긴 이름 픽스처(예: 30자 이상)로 테스트. 커밋.
4. Codex 리뷰 `--scope branch --base main`, 최대 3라운드(시간이 부족하면 1라운드).
5. **`dev/active/m1-ui-01-fix/REPORT.md`** 작성·커밋 — 원 브리프 6절 형식 + A·B 요약 포함.

## 2. 규칙
- ADR-003: 목업 px 맞춤은 하지 않는다. 기능·사용성·일관성 기준으로 판단하고 목업과 다르면 사유 한 줄.
- 브라우저 확인 서버는 127.0.0.1에만, **끝나면 반드시 종료**하고 `lsof -iTCP:4317 -iTCP:4318 -sTCP:LISTEN` 결과를 REPORT에 적는다.
- `design/` 수정·APFS 자산·범위 밖 기능·push·원격·`main` 직접 커밋 금지.

## 3. 마지막 응답
REPORT.md 요약(항목별 완료 여부, 검증 4종, 번들 gzip KB, Codex 결과, 서버 종료, 커밋 해시)
