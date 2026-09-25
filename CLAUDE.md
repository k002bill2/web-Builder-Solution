# CLAUDE.md

## Project Overview

**Web Builder Solution (작업명: Design Studio)** — 디자인 레퍼런스를 탐색·비교하고, 원하는 요소를 골라 디자인 프로필로 확정한 뒤 홈페이지를 생성하는 솔루션. 독립 저장소이며 AOS와 연결하지 않는다(ADR-001).

## Directory Structure

```
web-builder-solution/
├── app/                          # 웹 앱 (Vite · React 19 · TS strict · Tailwind 4 · Vitest)
│   └── src/
│       ├── brand/                # 제품 브랜드 (ADR-002) — 브랜드 교체 지점
│       ├── styles/tokens/        # 디자인 토큰 (목업 디자인 언어 + brand.css)
│       ├── components/ds/        # 디자인 시스템 컴포넌트
│       ├── components/…          # 화면 컴포넌트
│       ├── domain/ data/ features/ fixtures/ pages/
│       └── test/                 # 가드 테스트(브랜드 격리·하드코딩 금지)
├── design/claude-design-handoff/ # Claude Design 핸드오프 원본 — 수정 금지. 구현 기준은 시안 1a
├── docs/                         # PRD·TRD·개발계획서·TDD, decisions/(ADR), 06-handoff/(작업 브리프)
└── dev/active/<task>/PROGRESS.md # 작업 체크포인트
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4, React Router 8 |
| Test | Vitest 5, Testing Library |
| Backend | 미정 (ADR로 결정 예정). 현재 데이터는 `ReferenceRepository` 메모리 구현 + fixtures |
| Infrastructure | 미정 |

## Quick Start

```bash
cd app
npm install
npm run dev        # 개발 서버
npm test -- --run  # 테스트
```

## Commands (app/)

| Command | Description |
|---------|-------------|
| `npm run typecheck` | tsc --noEmit |
| `npm run lint` | eslint |
| `npm test -- --run` | vitest |
| `npm run build` | typecheck + vite build |
| `/check-health` | Type check, lint, test, build verification |
| `/verify-app` | Boris Cherny style verification loop |

## Rules

1. **완료 기준**: typecheck · lint · test · build 4개 모두 통과.
2. **TDD**: 실패하는 테스트를 먼저 쓰고 RED를 확인한 뒤 구현한다 (`docs/05-tdd/TDD.md`).
3. **디자인 원본 (ADR-003)**: `design/`은 읽기 전용. 목업은 화면 구조·정보 위계·톤의 기준이며 px 값은 기준이 아니다. 우선순위는 기능·사용자 흐름 → 사용성(실데이터·상태·접근성·반응형·성능) → 디자인 시스템 일관성 → 목업. 목업과 다르게 한 부분은 사유를 PROGRESS/REPORT에 한 줄로 남긴다.
4. **브랜드 (ADR-002)**: 목업(APFS)의 디자인 언어만 쓴다. APFS 로고·명칭·`--apfs-*` 토큰·`apfs` 접두어 금지. 브랜드 값은 `app/src/brand/`와 `app/src/styles/tokens/brand.css`에만 둔다.
5. **스타일**: 컴포넌트·페이지에 hex·px 하드코딩 금지. 토큰(CSS 변수·Tailwind 테마)만 참조한다 (`noHardcodedStyle.test.ts`가 검사).
6. **권리 경계 (PRD 원칙 4)**: 외부 사이트 URL·캡처·이미지를 카탈로그와 코드에 넣지 않는다. 썸네일은 자체 플레이스홀더.
7. **Git**: 기능은 전용 브랜치/worktree에서 진행. `main` 직접 작업 금지. 원격 저장소는 새로 만든 저장소만 연결하며, 원격 추가·push는 사용자 승인 후.

Project rules are auto-loaded from `.claude/rules/` (현재 없음).

Global rules (`~/.claude/rules/`):
- `golden-principles.md` - DRY, KISS, YAGNI
- `security.md` - Security rules
- `verification.md` - Verification rules
- `interaction.md` - Communication rules

## Environment Variables

현재 없음. 추가 시 `.env.example`에 키 이름만 기록한다 (`.env*`는 커밋 금지).

## Testing

```bash
cd app
npm test -- --run              # 단위·컴포넌트·가드 테스트
npm test -- --run --coverage   # 커버리지 (필요 시 @vitest/coverage-v8 추가)
```

## Key Features

- 레퍼런스 카탈로그: 필터(URL 동기화)·카드·저장·비교 트레이 — 구현됨 (1a-01)
- 레퍼런스 상세·비교 보드·디자인 프로필·3안 생성·편집기·모바일 — 예정 (1a-02~07)
