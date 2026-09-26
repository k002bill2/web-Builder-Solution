---
name: test-coverage
description: 커버리지 측정 후 테스트가 더 필요한 곳을 찾습니다.
disable-model-invocation: true
---

# Test Coverage Analysis

## 0. 전제 확인

커버리지 도구가 아직 설치돼 있지 않다(`app/node_modules/@vitest/coverage-v8` 없음, CLAUDE.md Testing 절 "필요 시 추가").
```bash
ls app/node_modules/@vitest/coverage-v8 2>/dev/null || echo "NEED_COVERAGE_PKG"
```
- `NEED_COVERAGE_PKG`면 설치 전 사용자 승인을 받는다 (package.json·lockfile 변경). 버전은 설치된 vitest와 같은 메이저로:
```bash
cd app && npm install -D @vitest/coverage-v8@<vitest 버전>
```

## Steps

1. **측정**
   ```bash
   cd app && npx vitest run --coverage
   ```
   임계치 설정은 아직 없다(`vite.config.ts`의 `test.coverage` 미설정). 목표는 전역 규칙 80%+.

2. **분석**
   - 80% 미만 파일, 테스트가 전혀 없는 파일 목록
   - 제외: `src/fixtures/**`, `*.test.*`, `src/test/**`

3. **우선순위**
   - **High**: 도메인·데이터·상태 로직 — `src/domain/`, `src/data/`, `src/features/**`(compareTray, catalogSearchParams 등)
   - **Medium**: 화면 흐름 — `src/pages/`, 레이아웃(`SkipLinks`, `AppLayout`)
   - **Low**: 표현용 DS 컴포넌트 — 단 키보드·ARIA 동작이 있는 것(`SegmentedControl`, `rovingFocus`)은 Medium

4. **제안**
   - 파일별로 빠진 분기·함수와 테스트 시나리오(정상·경계·오류), 필요한 테스트 수
   - 원하면 테스트 스켈레톤을 만든다 (`/tdd` 흐름)

## Output Format

```markdown
# Test Coverage Report (`<git short hash>`)

## Summary
| 항목 | % |
|---|---|
| Statements | |
| Branches | |
| Functions | |
| Lines | |

## 80% 미만 (우선순위순)
1. **src/...** (N%) — 빠진 부분 · 제안 테스트 N개

## 테스트 없는 파일
- ...
```

## 주의
- `coverage/`는 `.gitignore` 대상이다. 리포트를 커밋하지 않는다.
