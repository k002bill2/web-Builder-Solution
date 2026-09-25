# Designer 핸드오프 브리프 — Design Studio 시안 1a 구현

- 작성: Jarvis · 2026-09-25 KST · 상태: **대기 (선행 조건 미충족)**
- 책임 역할: Designer → Developer / 실행 환경: Orca + Claude Code (`hermes-claude-orca --role designer`)
- 기준 문서: `~/Work/web-builder-solution/docs/` — PRD v0.2 · TRD v0.2 · DEVELOPMENT_PLAN v0.2 · TDD v0.2
- 선택 시안: **1a** (영환님 지정, 2026-09-25)

## 1. 디자인 소스 (영환님 제공 원문 그대로)

```
Use the claude_design MCP (https://api.anthropic.com/v1/design/mcp, auth via /design-login) to import this project:
https://claude.ai/design/p/d1ec723c-ab95-481b-a230-b17ac334afb9?file=Design+Studio+Mockups.dc.html

Focus on these files (the whole project is readable):
- `Design Studio Mockups.dc.html`

Also read these files the selection imports:
- `_ds/apfs-design-system-3aea88df-7072-4855-be04-f000a5f2fbd4/_ds_bundle.js`
- `_ds/apfs-design-system-3aea88df-7072-4855-be04-f000a5f2fbd4/styles.css`
- `_ds/apfs-design-system-3aea88df-7072-4855-be04-f000a5f2fbd4/tokens/base.css`
- `_ds/apfs-design-system-3aea88df-7072-4855-be04-f000a5f2fbd4/tokens/colors.css`
- `_ds/apfs-design-system-3aea88df-7072-4855-be04-f000a5f2fbd4/tokens/fonts.css`
- `_ds/apfs-design-system-3aea88df-7072-4855-be04-f000a5f2fbd4/tokens/shape.css`
- `_ds/apfs-design-system-3aea88df-7072-4855-be04-f000a5f2fbd4/tokens/spacing.css`
- `_ds/apfs-design-system-3aea88df-7072-4855-be04-f000a5f2fbd4/tokens/typography.css`
- `support.js`

Implement: `Design Studio Mockups.dc.html`
```

## 2. 작업 지시

### 단계 A — 소스 가져오기·시안 1a 확정 (Designer, 턴 20)
1. claude_design MCP로 프로젝트를 가져오고, 위 파일 전부를 읽는다.
2. 원본을 `docs/design/source/`에 **수정 없이** 보관한다(목업 HTML, `_ds/` 토큰·번들, `support.js`).
3. `Design Studio Mockups.dc.html` 안의 시안 목록을 정리하고 **1a만** 구현 대상으로 확정한다. 1a의 화면 목록·상태·인터랙션을 `docs/design/1A_SPEC.md`에 기록한다.
4. 1a 화면을 PRD 요구사항 ID(FR-CAT·CMP·SEL·PRF·GEN·EDT·PUB)에 매핑하고, PRD에 있는데 1a에 없는 P0 화면·상태(빈/로딩/오류/게이트 실패)를 목록으로 남긴다.
5. APFS 디자인 시스템 토큰(colors·typography·spacing·shape·fonts)과 AOS 대시보드 Tailwind 4 테마의 대응표를 만든다. 충돌은 임의로 해결하지 말고 목록으로 보고한다.

### 단계 B — 구현 (Developer 트랙 C, 화면 단위 handoff, 각 턴 80~120)
- 1a를 React + TypeScript + Tailwind 4로 옮긴다. 원본 레이아웃·간격·타이포·색을 보존한다(`mockup-source-fidelity` 기준). 목업의 더미 데이터는 픽스처로 분리한다.
- TDD 계획서 순서를 따른다(컴포넌트 테스트 RED→GREEN). AOS 규칙: `memo()`+displayName, `cn()`, 다크모드, `aria-label`, `React.lazy`.
- 첫 화면 순서(M1 슬라이스와 일치): 카탈로그(필터·카드) → 비교 보드 → 프로필 저장 → Hero+Footer 미리보기.

### 단계 C — 시각 충실도 검증 (Designer 또는 QA)
- 원본 목업 1a와 구현 화면을 같은 뷰포트(1440·768·390)에서 스크린샷 비교하고 차이를 보고한다.

## 3. 금지·경계
- 목업·디자인 시스템 원본 파일은 수정하지 않는다(사본에서 작업).
- PRD 원칙 4: 외부 사이트 URL·캡처를 카탈로그·코드에 넣지 않는다. 목업에 실제 사이트 이미지가 있으면 자체 플레이스홀더로 교체하고 목록으로 보고한다.
- 기본 작업트리(main) 변경 금지, 전용 worktree에서만 작업. Git 원격 쓰기·PR 생성은 영환님 승인 후.
- shared-infra DB·볼륨 변경 금지.

## 4. 완료 보고 형식
결론 → 가져온 파일 목록(경로·크기) → 1a 화면 목록 → PRD 매핑·누락 → 토큰 대응표·충돌 → 변경 파일 → 실행한 검증 명령과 결과 → 확인 필요.

## 5. 선행 조건 (2026-09-25 확인 결과)
| 항목 | 상태 |
|---|---|
| Orca runtime | ✅ ready |
| claude_design MCP 등록 | ⛔ 미등록 (`claude mcp list`에 없음) |
| `/design-login` 인증 | ⛔ 미확인 — 대화형 로그인 필요 |
| 구현 대상 저장소·worktree | ⛔ 미결정 (AOS 전용 worktree 생성 승인 필요) |
