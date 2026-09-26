---
description: 테스트 먼저 만들고 코드 작성. TDD 워크플로우.
---

# TDD Command

`docs/05-tdd/TDD.md`를 따르는 테스트 주도 개발.

## 절차

1. **인터페이스 정의** — 도메인 타입(`src/domain/`)·저장소 인터페이스(`src/data/`) 먼저
2. **실패 테스트 작성 (RED)** — 실행해서 **실패하는 것을 확인**하고 출력 요약을 `dev/active/<task>/PROGRESS.md`에 남긴다
3. **최소 구현 (GREEN)**
4. **리팩토링 (REFACTOR)** — 테스트 유지
5. **게이트** — `/verify-loop`

```bash
cd app && npx vitest run src/path/to/file.test.tsx   # 단일 파일
cd app && npm test -- --run                          # 전체
```

## 이 프로젝트의 테스트 종류

| 종류 | 위치 | 예 |
|---|---|---|
| 도메인·데이터 | `src/features/**`, `src/data/**` | `compareTray.test.ts`, `referenceRepository.test.ts` |
| 컴포넌트 | 컴포넌트 옆 `*.test.tsx` | `ReferenceCard.test.tsx` |
| 화면 | `src/pages/*.test.tsx` | `CatalogPage.test.tsx`, `keyboardA11y.test.tsx` |
| 가드 | `src/test/*.test.ts` | 브랜드 격리, 하드코딩 금지, 토큰 대비 |

- 화면 테스트는 `src/test/renderApp.tsx`(MemoryRouter + Provider)를 쓴다.
- 접근성 동작(역할·이름·키보드)은 Testing Library의 role 쿼리로 검증한다.

## 버그 수정은 Red-Green 확인

1. 재현 테스트 작성 → FAIL 확인
2. 수정 → PASS
3. 수정 되돌리기 → FAIL 재확인 → 복원

## 규칙

- 브리프가 "고쳐도 되는 테스트"로 지정한 것 외의 기존 테스트가 깨지면 **테스트가 아니라 구현을 고친다**
- 커버리지 목표 80%+ (측정은 `/test-coverage`)

## 다음 단계

| 구현 완료 후 | 커맨드 |
|:------------|:-------|
| 빌드/검증 | `/verify-loop` |
| 완료 게이트 | Codex 리뷰 |
