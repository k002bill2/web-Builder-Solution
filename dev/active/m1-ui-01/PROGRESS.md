# M1-UI-01 PROGRESS

브리프: `docs/06-handoff/M1-UI-01_DEVELOPER_BRIEF.md` · 브랜치 `m1-ui-01` (로컬 커밋만)

## 단계 현황
| # | 단계 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(브리프 1절 순서) + `app/` 스캐폴드 | 완료 | (이 커밋) |
| 1 | 토큰 + 브랜드 분리 (`tokens.test.ts`, `brandIsolation.test.ts`) | 대기 | |
| 2 | 데이터 계층 (`referenceRepository.test.ts`) | 대기 | |
| 3 | 비교 트레이 (`compareTray.test.ts`) | 대기 | |
| 4 | DS 컴포넌트 + 카드 (`ReferenceCard.test.tsx`, `noHardcodedStyle.test.ts`) | 대기 | |
| 5 | 카탈로그 화면 + 라우팅 (`CatalogPage.test.tsx`) | 대기 | |
| 6 | 검증 4종 + 390 폭 확인 + Codex 리뷰 | 대기 | |

## 0단계 — 스캐폴드
- package.json 직접 작성(대화형 create 미사용), 버전 exact 고정.
  - react/react-dom 19.3.0, react-router 8.4.0, vite 8.3.1, tailwindcss·@tailwindcss/vite 4.3.3, vitest 5.0.1, jsdom 30.1.1
  - typescript **6.0.3** — 최신 7.0.2는 typescript-eslint 8.70.1 peer 범위(`<6.1.0`) 밖이라 제외.
- tsconfig 단일 파일(`include: src, vite.config.ts, eslint.config.js`). `typecheck = tsc --noEmit -p tsconfig.json`.
  - 무동작 함정 확인: 일부러 넣은 `const x: number = "s"` → `TS2322` 검출, 제거 후 통과.
- 빈 스캐폴드에서 typecheck·lint·build 통과.

## 설계 결정 (ADR-002 × 브리프 테스트 충돌 해소)
1. 테스트 1의 `--primary: #3366ff`와 ADR-002의 "`--primary`는 `--brand-*` 참조"가 충돌한다.
   → 토큰 파일 전체에서 `var()` 체인을 따라가는 resolver로 **해석값**을 검증한다(light `#3366ff`, dark `#5b84ff`).
2. 원본 `--brand-inverse*`가 colors.css에 있어 테스트 7("`--brand-*` 정의는 brand.css에만")에 걸린다. 트레이·secondary 버튼이 쓰는 중립 표면이므로 의미 토큰 `--surface-inverse`·`--surface-inverse-hover`·`--on-surface-inverse`로 이름을 바꾼다.
3. `--focus-ring`, `--primary-hover/pressed/container`의 값은 brand.css의 `--brand-*`로 옮긴다. `--apfs-*`는 삭제한다. `.apfs-*` 클래스는 `ds-*`로 바꾼다.

## RED / GREEN 기록
(단계별로 추가)

## 목업과 다른 부분
(단계별로 추가)

## 질문
(단계별로 추가)
