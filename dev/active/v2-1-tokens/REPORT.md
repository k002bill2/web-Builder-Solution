# V2-1 REPORT — 디자인 v2 토큰·DS 전환

- 브리프: `docs/06-handoff/V2-1_DEVELOPER_BRIEF.md` · 설계: `docs/design/v2/SPEC.md` · 브랜치 `k002bill2/v2-1-tokens`(분기점 `c7efdf9`), 로컬 커밋만(push·원격 없음)
- 상세 로그: `PROGRESS.md`(단계 0 manifest·실험, Red-Green)

## 1. 결과 요약

| 항목 | 결과 |
|---|---|
| 0단계 `/compare` 첫 화면 여유 | **99.98 → 99.15KB**(여유 0.02 → 0.85KB). 최종 빌드 99.19KB(여유 0.81) |
| 바뀐 토큰 | 라이트 값 변경 52 · 다크 56 · 추가 11 · 삭제 59(원시 램프 49 · accent 4종 8 · `primary-strong/heavy` 2) |
| 테스트 | 305 → **431** 통과(35 → 38 파일). 기존 테스트 수정은 6.3 V2-1 행(`tokens.test.ts`·`brandIsolation.test.ts`)만 |
| 검증 4종 | typecheck · lint · test · build 통과(아래 3절) |

## 2. 수용 기준

| ID | 판정 | 근거 |
|---|---|---|
| V2-AC-01 | 통과 | `tokens.test.ts` 값 표(라이트) |
| V2-AC-02 | 통과 | 같은 표(다크) + `loadDarkBlock`으로 별칭 15개·`--focus-ring`·그림자가 다크 블록에 직접 재선언됨을 단언 |
| V2-AC-03 | 통과 | 브랜드 6토큰 값, `--primary` = `var(--brand-primary)`, `brandIsolation`(정의는 brand.css에만) |
| V2-AC-04 | 통과 | `tokenContrast.test.ts` — 배경 집합을 토큰에서 합성(흰·muted·raised·sunken·elevated × fill 2종 + 상태 면 4 + primary-container), 글자 8종 + 역상 2종 ≥ 4.5, 두 테마 |
| V2-AC-05 | 통과 | 같은 파일, 모든 배경에서 normal > neutral > alternative |
| V2-AC-06 | 통과 | 다크 `--on-primary #10142e`, primary·hover·pressed 위 ≥ 4.5 |
| V2-AC-07 | 통과 | theme.css 연결(빌드 CSS에 `text-status-*-text`·`bg-inverse-fill-normal` 등 생성 확인) |
| V2-AC-08 | 통과 | Tag 6톤(neutral + accent 별칭 5) 카드 위 ≥ 4.5 |
| V2-AC-09 | 통과 | `tokenUsage.test.ts` — `label-assistive` 0 |
| V2-AC-10 | 통과 | 접미사 없는 `text-status-*`는 `<Icon`·`icon:` 줄에만 |
| V2-AC-11 | 통과 | `Button.test.tsx`(secondary 역상 + aria-disabled 쌍, assistive ghost), 가드(`variant="secondary"`는 `bg-surface-inverse` 파일에서만), 상세 "비교 중" outline + `check` |
| V2-AC-12 | 통과 | `tokens.test.ts`(삭제 토큰 0) + 가드(원시 색 유틸리티 0) |
| V2-AC-13 | 통과 | 토큰 6파일 출처 주석 = v2 번들 경로, `brandIsolation` marker `design/claude-design-handoff`(v1·v2 모두) |
| V2-AC-14 | 통과 | 가드: 아이콘 13·폰트 4 파일 그대로, `font-extrabold`/`font-black` 0 |
| V2-AC-38 | 보고 | 3절 번들 표 |
| V2-AC-39 | 통과 | 3절 |
| V2-AC-40 | 통과(계산) | 2중 링 구조 + 링 vs 간격 색 ≥ 3(라이트 5.16 · 다크 7.36). **[Q] 브라우저 확인은 하지 않음** |

## 3. 검증 · 번들 실측 (L1, 최종 커밋 기준 fresh 실행)

- `npm run typecheck` 0 · `npm run lint` 0 · `npm test -- --run` **431 passed (38)** · `npm run build` 0(예산 검사 통과)

| 라우트 | 기준 `c7efdf9` 첫 화면 / 진입 직후 | V2-1 최종 |
|---|---|---|
| 공통 JS | 88.96 | 89.47 (`index` 86.14 + `jsx-runtime` 3.33) |
| `/catalog` | 97.98 / 100.36 | 98.56 / 100.94 |
| `/references/:id` | 95.64 / 98.02 | 96.19 / 98.57 |
| `/compare` | 99.98 / 120.64 | **99.19** / 121.55 |
| 자리표시 | 89.40 / 91.79 | 89.93 / 92.31 |

- CSS(예산 밖, 참고): gzip 8.17 → 8.11KB.
- 토큰 전환 자체의 JS 증가는 +0.02~0.04KB(Button 변형 문자열·클래스). 나머지 차이는 0단계 부작용(아래 4절 R-1).

## 4. 남은 위험 · 다음 단계에 넘기는 것

| # | 내용 | 수준 |
|---|---|---|
| R-1 | 0단계 부작용: rolldown이 React 코어를 별도 공통 청크로 분리해 **모든 라우트 +0.5KB**. `/catalog` 여유 2.02 → 1.44KB — V2-2(카탈로그) 예산이 줄었다. 번들러 청크 설정(`chunkOptimization`·`codeSplitting`)으로 되돌릴 수 있는지는 확인하지 않음(L3) | 중 |
| R-2 | `/compare` 여유 0.81KB. V2-4는 SPEC B-5대로 같은 단계 상쇄가 필요 | 중 |
| R-3 | V2-AC-40·Q4·색 변화는 **브라우저 확인 안 함**(토큰 계산 L2만). QA가 ego-browser로 1280·768·390 확인 필요 | 중 |
| R-4 | 다크 값은 토큰 단위 테스트로만 검증(`data-theme="dark"`를 켜는 코드 없음 — A11Y-01 1절과 같음) | 낮음 |
| R-5 | `text-primary`를 글자로 쓰는 곳 7곳(링크·Tabs 개수·DraftItem 출처·카드 저장 아이콘 등)은 그대로 — 모두 흰 면(4.95 통과). muted 면에 올리면 4.42로 미달이므로 V2-2~4에서 링크·primary 배지는 `text-primary-text`로 | 낮음 |
| R-6 | `ReferenceCard` "비교 중" outline + `check`는 V2-2 카드 아이콘 버튼 전환 때 다시 바뀐다 | 낮음 |

## 5. 목업·설계와 다르게 한 곳 (ADR-003)
- **C-12**: 굵기 800 → 700, 캡션 12px, 목업 opacity 글자 → 역상 토큰(트레이).
- `CatalogHero` "추천 받기" `secondary` → `outline`(역상 변형 재정의 때문, SPEC 4.2와 같은 변형).
- `ReferenceCard` "비교 중" outline + `check`(상세와 같은 규칙).
- Q3·Q4 적용으로 글자·입력 테두리가 v2 원값보다 짙음.
- `brand.css`에 `--brand-primary-text` 추가(ADR-002 개정 1, Q2). `--brand-gradient`는 사용처 0이지만 정의 유지.

## 6. 검증 게이트 (Codex)
- `codex-companion review --scope branch --base c7efdf9` 1라운드: **수정할 결함 없음**, typecheck 통과 확인. Codex 쪽 Vitest는 읽기 전용 샌드박스라 Vite가 임시 설정 파일을 쓰지 못해 실행되지 않음 — 테스트 근거는 3절의 로컬 fresh 실행(431 passed).
- Jarvis 독립 재실행(병합 전, 같은 base): **결함 없음** (`/tmp/wbs_codex_v21_r1.txt`). 병합 후 main에서 검증 4종 재실행 통과(431 passed), 번들 실측 동일.

## 7. 결정 (영환님 2026-09-26 "1 진행하고 push 해")
- **R-1 수용:** 공통 JS +0.49KB를 받아들이고 V2-2a를 진행한다. V2-2a 실측에서 예산 초과가 예상되면 그때 번들러 청크 설정 조사를 별도 작업으로 만든다.
