---
allowed-tools: Bash(npm:*), Bash(npx:*), Bash(git:*), Read, Edit, Grep, Glob
description: 자동 재검증 루프 (최대 3회 재시도, 실패 시 자동 수정)
argument-hint: [의도 설명] [--max-retries N] [--only typecheck|lint|test|build]
---

## Task

### 1단계: 환경 수집
- `git status --short`
- `git diff --name-only`
- `CLAUDE.md` Rules, 진행 중 작업의 브리프·`dev/active/<task>/PROGRESS.md`

### 2단계: 검증 루프 (최대 N회, 기본 3)

각 시도마다:

1. **diff 검토**:
   - 의도(인자·브리프 AC)대로 구현됐는지
   - 로직 오류, 엣지 케이스
   - 금지 사항: `design/` 변경, 브랜드 값이 `src/brand/`·`brand.css` 밖에 있음, hex·px 하드코딩, 외부 URL·이미지(권리 경계)

2. **자동화 검증** (`app/`에서, CLAUDE.md 완료 기준과 동일):
   - TypeCheck: `npm run typecheck`
   - Lint: `npm run lint`
   - Test: `npm test -- --run`
   - Build + 번들 예산: `npm run build`

3. **결과 출력**:
   ```
   ├── TypeCheck: PASS/FAIL
   ├── Lint: PASS/FAIL (N errors, N warnings)
   ├── Test: PASS/FAIL (N passed / N failed)
   └── Build+Bundle: PASS/FAIL (초과 라우트·KB)
   ```

### 3단계: 실패 시 자동 수정
- import 누락 → 추가
- 린트 → `npx eslint . --fix`
- 미사용 변수 → 삭제
- 단순 타입 오류 → 수정
- **자동 수정하지 않는 것**: 번들 예산 초과(예산 값 변경 금지 — 보고 후 중단), 가드 테스트 실패(원인 코드를 고친다), 브리프가 허용하지 않은 기존 테스트 실패

### 4단계: 통과 시
```
Verification Loop 완료 (N회 시도, 성공)
다음 단계: Codex 리뷰 (완료 게이트) → 커밋
```

### 5단계: max_retries 도달 시
```
Verification Loop 실패 (N회 시도 모두 실패)
반복 실패 에러 상세 및 권장 조치 안내
```
같은 수정이 2회 실패하면 재시도를 멈추고 근본 원인을 분석한다.
