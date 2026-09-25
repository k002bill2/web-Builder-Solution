# M1-UI-01 PROGRESS

브리프: `docs/06-handoff/M1-UI-01_DEVELOPER_BRIEF.md` · 브랜치 `m1-ui-01` (로컬 커밋만)

## 단계 현황
| # | 단계 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(브리프 1절 순서) + `app/` 스캐폴드 | 완료 | afa7794 |
| 1 | 토큰 + 브랜드 분리 (`tokens.test.ts`, `brandIsolation.test.ts`) | 완료 | 27fc0d0 |
| 2 | 데이터 계층 (`referenceRepository.test.ts`) | 완료 | (이 커밋) |
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

### 1단계 — 토큰·브랜드 격리
RED ① 테스트만 작성 (토큰·brand.config 없음):
```
 FAIL  src/styles/tokens.test.ts > 디자인 토큰 > 라이트 테마의 --primary는 #3366ff로 해석된다
Error: ENOENT: no such file or directory, scandir '.../app/src/styles/tokens/'
 FAIL  src/test/brandIsolation.test.ts > 브랜드 격리 (ADR-002) > brand.config.ts가 제품명과 로고 컴포넌트를 제공한다
Error: Cannot find module '/src/brand/brand.config'
      Tests  8 failed | 2 passed (10)
```
RED ② 원본 토큰을 그대로 복사(출처 주석만 추가)한 직후 — 브랜드 격리 테스트가 실제 위반을 잡음:
```
 × src에 apfs/APFS/농업정책 문자열이 없다 (출처 경로 주석 제외)
AssertionError: expected [ …(30) ] to deeply equal []
+   "styles/tokens/base.css:26  .apfs-icon {",
+   "styles/tokens/colors.css:71  --apfs-blue: #1a75ff;",
+   "styles/tokens/colors.css:74  --apfs-gradient: linear-gradient(105deg, var(--apfs-blue) 0%, var(--apfs-cyan) 100%);",
+   "styles/tokens/typography.css:59  .apfs-title1   { font: ... }",
    … (30줄)
 × --brand-* 정의는 brand.css에만 존재한다   (colors.css의 --brand-inverse)
      Tests  3 failed | 1 passed (4)
```
GREEN (토큰 정리 + brand.css + brand.config.ts + theme.css):
```
 ✓ 디자인 토큰 > 라이트 테마의 --primary는 #3366ff로 해석된다
 ✓ 디자인 토큰 > 다크 테마의 --primary는 #5b84ff로 해석된다
 ✓ 디자인 토큰 > --radius-lg는 16px이다
 ✓ 디자인 토큰 > --font-size-body1은 16px이다
 ✓ 디자인 토큰 > --primary는 브랜드 토큰(--brand-primary)을 참조한다 (ADR-002)
 ✓ 디자인 토큰 > 토큰 복사본마다 원본 번들 경로를 출처 주석으로 남긴다
 ✓ 브랜드 격리 (ADR-002) > src에 apfs/APFS/농업정책 문자열이 없다 (출처 경로 주석 제외)
 ✓ 브랜드 격리 (ADR-002) > --brand-* 정의는 brand.css에만 존재한다
 ✓ 브랜드 격리 (ADR-002) > --brand-* 참조는 토큰 계층(styles/tokens) 밖에 없다
 ✓ 브랜드 격리 (ADR-002) > brand.config.ts가 제품명과 로고 컴포넌트를 제공한다
      Tests  10 passed (10)
```
Tailwind 연결 확인(빌드 산출 CSS): `.rounded-lg{border-radius:var(--radius-lg)}` → base 레이어 `--radius-lg:16px`이 theme 레이어 기본값 `.5rem`을 이김. `.shadow-4{--tw-shadow:var(--shadow-4)}`, `.p-7{padding:calc(var(--space-100) * 7)}`, `.bg-primary{background-color:var(--primary)}`.

### 2단계 — 데이터 계층
RED ① 테스트만 작성: `Failed to resolve import "../fixtures/references"` (Test Files 1 failed)
RED ② 타입·픽스처 + 필터 없는 스텁 저장소(`list = 전체 반환`):
```
 × 업종=카페·F&B 필터는 A·F 2개를 돌려준다
AssertionError: expected [ 'A', 'B', 'C', 'D', 'E', 'F' ] to deeply equal [ 'A', 'F' ]
 × external_observed 레코드는 목록·단건 조회 어디에도 나오지 않는다 (FR-CAT-04)
 × 같은 그룹 안의 선택은 OR로 결합한다
 × 서로 다른 그룹의 선택은 AND로 결합한다
 × 타깃·레이아웃·목적·라이선스·모션 필터를 각각 적용한다
 × 점수순은 접근성+성능 합계 내림차순, 최신순은 등록일 내림차순이다
      Tests  6 failed | 3 passed (9)
```
GREEN:
```
 ✓ 필터 없이 목업 레퍼런스 6개를 돌려준다
 ✓ 업종=카페·F&B 필터는 A·F 2개를 돌려준다
 ✓ external_observed 레코드는 목록·단건 조회 어디에도 나오지 않는다 (FR-CAT-04)
 ✓ 같은 그룹 안의 선택은 OR로 결합한다
 ✓ 서로 다른 그룹의 선택은 AND로 결합한다
 ✓ 타깃·레이아웃·목적·라이선스·모션 필터를 각각 적용한다
 ✓ 점수순은 접근성+성능 합계 내림차순, 최신순은 등록일 내림차순이다
 ✓ id로 단건을 조회한다
 ✓ 입력 레코드 배열을 변경하지 않는다
      Tests  9 passed (9)
```

## 목업과 다른 부분
(단계별로 추가)

## 질문
1. **타깃·콘텐츠 목적·등록일 데이터가 목업에 없음.** 목업 refs에는 audience·purpose·createdAt이 없어 필터·최신순이 동작하려면 값이 필요하다. `fixtures/references.ts`에 **임시값**을 넣었다(A 20~30대/예약, B 20~30대/예약, C 가족/예약·문의, D 20~30대/예약, E B2B/문의, F 가족·20~30대/판매, createdAt 2026-08-30~09-19). 실제 값 확정 필요.
2. **모션 단계.** TRD 4.1은 L0~L3(4단계), 목업은 낮음·중간·높음(3단계). 이번엔 목업 3단계(`low|mid|high`)로 구현했다. 백엔드 연결 시 매핑 규칙 확정 필요.
