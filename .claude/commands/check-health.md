---
name: check-health
description: 프로젝트 헬스 체크 — 완료 게이트 4종(typecheck·lint·test·build+번들 예산) + 의존성 audit + 구조 점검.
disable-model-invocation: true
---

# Project Health Check

Web Builder Solution(`app/`)의 품질 게이트를 모두 실행하고 결과를 보고한다.

> **게이트 SSOT**: 게이트 명령의 정의는 `CLAUDE.md`의 "Commands (app/)" 표와 Rules 1(완료 기준)이다. 명령이 바뀌면 CLAUDE.md만 갱신하고 이 문서는 그것을 따른다.

## Steps

모든 명령은 `app/`에서 실행한다.

### 1. 타입 체크
```bash
cd app && npm run typecheck
```

### 2. 린트
```bash
cd app && npm run lint
```

### 3. 테스트 (단위·컴포넌트·가드)
```bash
cd app && npm test -- --run
```
- `npm test`만 쓰면 watch 모드로 멈춘다. 반드시 `-- --run`.
- 가드 테스트(`src/test/`)도 여기서 함께 돈다: 브랜드 격리(`brandIsolation`), 하드코딩 금지(`noHardcodedStyle`), 토큰 대비·사용(`tokenContrast`·`tokenUsage`), 탭 제거(`tabsRemoved`).
- 보고에 테스트 수(passed/failed)를 적는다. 직전 기록과 비교할 수 있게 한다.

### 4. 빌드 + 번들 예산
```bash
cd app && npm run build
```
- `tsc` → `vite build` → `scripts/check-bundle-size.mjs`(초기 청크 예산, ADR-004) 순서다.
- 예산 초과로 실패하면 **예산 값을 바꾸지 않는다.** 초과한 라우트와 KB를 보고하고 멈춘다.

### 5. 의존성 audit
```bash
cd app && npm audit
```
- `npm audit fix`는 사용자 승인 후에만 실행한다(lockfile 변경).

### 6. 구조 점검
- `CLAUDE.md`, `.claude/settings.json`, `docs/decisions/` 존재
- `design/` 아래 변경 없음: `git status --short design/` 결과가 비어야 한다(읽기 전용 원본)
- 커밋되면 안 되는 파일 없음: `.env*`, `*.log`, `app/dist/`
- `git status --short`로 커밋 안 된 변경 목록 표시

## Output Format

```markdown
# Health Check — <날짜 시각> (`<git short hash>`)

| # | 점검 | 결과 | 상세 |
|---|---|---|---|
| 1 | typecheck | PASS/FAIL | 에러 N |
| 2 | lint | PASS/FAIL | 에러 N · 경고 N |
| 3 | test | PASS/FAIL | N passed / N failed |
| 4 | build+번들 | PASS/FAIL | 라우트별 초기 KB / 예산 |
| 5 | audit | PASS/WARN | high N · moderate N |
| 6 | 구조 | PASS/WARN | 항목 |

**완료 기준(1~4) 통과 여부:** 예/아니오
**조치:** 실패 항목별 위치(파일:줄) · 원인 · 수정안
```

## 규칙
- 1~4 중 하나라도 실패하면 "완료 아님"이다(CLAUDE.md Rules 1).
- 이전 실행 결과는 증거로 쓰지 않는다. 매번 새로 실행한다.

$ARGUMENTS
