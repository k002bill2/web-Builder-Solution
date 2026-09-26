---
allowed-tools: Bash(npm:*), Bash(npx:*), Read, Edit, Grep, Glob
description: 빌드·타입 에러를 최소 변경으로 점진적으로 수정합니다.
argument-hint: [--types|--build]
---

# Build Fix

`app/`의 빌드 에러를 최소 변경으로 점진적 수정한다.

## 1단계: 빌드 실행

| 옵션 | 명령 (`app/`에서) |
|------|------|
| `--types` | `npm run typecheck` |
| `--build` | `npm run build` (tsc → vite build → 번들 예산 검사) |
| (기본) | `npm run typecheck` 후 통과하면 `npm run build` |

## 2단계: 에러 수집 & 분류

- 타입 오류(TS strict)
- 정의 누락
- import/export 오류
- 설정 오류(vite·tsconfig·eslint)
- **번들 예산 초과**(`scripts/check-bundle-size.mjs`) — 코드 에러가 아니다. 아래 규칙 참조

## 3단계: 점진적 수정

- 타입 어노테이션 추가, null 체크, import 수정
- 의존성 추가가 필요하면 멈추고 사용자에게 확인(lockfile 변경)

## 4단계: 검증

```bash
cd app && npm run build   # exit code 0 확인
cd app && npm test -- --run   # 수정이 테스트를 깨지 않았는지
```

## 규칙

- 최소 diff (리팩토링 금지), 로직 변경 금지
- 각 수정 후 "X/Y 에러 수정됨" 출력
- 컴포넌트·페이지에 hex·px 하드코딩으로 우회 금지 (CLAUDE.md Rules 5)
- 번들 예산 초과는 **예산 값을 바꾸지 않는다.** 초과 라우트·KB를 보고하고 멈춘다 (ADR-004)
- `design/` 수정 금지
