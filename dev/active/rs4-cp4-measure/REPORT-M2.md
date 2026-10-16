상향 필요: 정규화 +0.80 KB · raw 한도 +0.70 KB (조합+배치안 a 기준, UNMEASURED 하한)

CP4와 무관한 main 적용 가치: **있음** — 조합(후보 1+2)만으로 `/studio` raw 여유 0.14 → 0.60KB · 정규화 여유 0.06 → 0.44KB, 모든 라우트 첫 화면 −0.25~0.28KB(증가 라우트 0). 단 별 작업으로 리뷰·테스트 추가 필요(아래 "주의").

# RS4-CP4-MEASURE REPORT-M2 — `/studio` 동작 변화 0 감량 후보 실측

작성 2026-10-17 · 브랜치 `k002bill2/rs4-cp4-measure` · base `f477c161` · 같은 머신·직렬 빌드 · KB = 1000B gzip · 값은 `check-bundle-size.mjs` 출력(L1)

## 표 (사실 · L1 — `raw/m2-*-size.txt`, 원문 `raw/m2-*-build.txt`)

| 시나리오 | 판정선/한도 | base | 후보 1 preload 중복 제거 | 후보 2 polyfill off | 후보 4 writeBodyLoader 분리 | 후보 3 시도(entry 서명) | **조합 1+2** | **조합 + 배치안 a** | (참고) a 단독 M1 |
|---|---|---|---|---|---|---|---|---|---|
| 기본 `/studio` 정규화 | ≤ 128.53 | 128.47 | 128.32 (−0.15) | 128.24 (−0.23) | 128.41 (−0.06) | 128.47 (0) | **128.09 (−0.38)** | **129.33 (+0.80 초과)** | 129.73 |
| 기본 `/studio` raw | ≤ 130 | 129.86 | 129.63 (−0.23) | 129.63 (−0.23) | 129.70 (−0.16) | 129.86 | **129.40 (−0.46)** | **130.70 (+0.70 초과)** | 131.15 |
| 복원 진입 정규화 | ≤ 131.51 | 131.45 | 131.30 | 131.23 | 131.39 | 131.45 | 131.07 | 132.31 (+0.80 초과) | 132.71 |
| 복원 진입 raw | ≤ 134 | 132.90 | 132.67 | 132.66 | 132.73 | 132.90 | 132.43 | 133.74 (통과) | 134.18 |
| `/studio` 첫 화면 | ≤ 100 | 91.79 | 91.77 | 91.55 | 91.84 | 91.79 | 91.53 | 91.58 | 91.82 |
| 공통 JS(참고) | — | 89.34 | 89.34 | 89.11 | **89.40 (+0.06)** | 89.34 | 89.10 | 89.11 | — |
| `/catalog` 첫 화면 · 진입 | 101 · 125 | 100.30 · 102.64 | 100.29 · 102.63 | 100.06 · 102.40 | **100.34** · 102.68 | 같음 | 100.05 · 102.39 | 100.06 · 102.40 | — |
| `/references/:id` 첫 화면 · 진입 | 100 · 125 | 97.72 · 100.06 | 97.70 · 100.04 | 97.48 · 99.81 | 97.77 · 100.10 | 같음 | 97.46 · 99.80 | 97.47 · 99.81 | — |
| `/compare`(·조정 있음) 첫 화면 · 진입 | 100 · 125 | 99.23 · 123.07 | 99.20 · 122.95 | 98.99 · 122.82 | 99.24 · 122.82 | 같음 | 98.95 · 122.70 | 98.96 · 122.70 | — |
| `/profile` 첫 화면 · 진입 | 100 · 125 | 99.83 · 120.62 | 99.79 · 120.34 | 99.59 · 120.38 | **99.88** · 120.66 | 같음 | 99.56 · 120.10 | 99.56 · 120.13 | 99.82 · 120.63 |
| `/profile (3안 있음)` 진입 | 125 | 123.10 | 122.82 | 122.85 | 123.14 | 같음 | 122.58 | 122.60 | — |
| `/projects` 첫 화면 · 진입 | 100 · 125 | 99.43 · 108.72 | 99.39 · 108.61 | 99.20 · 108.48 | 99.48 · 108.56 | 같음 | 99.15 · 108.38 | 99.18 · 108.75 | 99.45 · 109.10 |
| 렌더 문서 JS | 90 | 84.22 | 84.22 | 84.22 | 84.22 | 84.22 | 84.22 | 84.22 | — |

- 조합 + a의 rolldown 런타임 청크: 없음(`ls dist/assets | grep runtime` 빈 출력). 청크별: `raw/m2-combo-m1a-studio-chunks.txt`.
- 결론 수치: 정규화 129.33 − 128.53 = **+0.80**, raw 130.70 − 130 = **+0.70**. 복원 진입은 정규화 +0.80 · raw 통과(133.74 ≤ 134). UNMEASURED 1~5(REPORT.md M1 절)가 빠져 있어 **하한**이다.
- 단순 합 검증: 후보 1(−0.15) + 2(−0.23) = −0.38 = 조합 실측 −0.38 — 겹침 없음(사실). 조합 + a 증분 +1.24(a 단독 +1.26과 거의 같음).

## 후보별 판정
1. **후보 1 — 채택(조합).** `build.modulePreload.resolveDependencies`로 호스트 청크·엔트리의 정적 import 닫힘(이미 실행되어 받은 청크)을 preload 목록에서 뺀다. 번들은 `generateBundle`(order pre) 플러그인으로 잡는다. 패치 `patches/m2-1-preload-dedup.patch`. 모든 라우트 감소 또는 같음.
   - **HTML 가드(검토 반영)**: Vite는 `resolveDependencies`를 HTML 엔트리 preload 태그에도 부른다(`node.js:31752`). 첫 빌드는 가드가 없어 `dist/index.html`의 `<link rel=modulepreload href=react-*.js>`까지 지웠다(0.47 → 0.39 kB — 첫 로드 워터폴 = 동작 변화). `hostType !== "js"`면 그대로 돌려주는 가드를 넣어 후보 1·조합·조합+a를 다시 빌드했다 → index.html 0.47 kB · react modulepreload 링크 유지(사실, `raw/m2-1-build.txt`·`m2-combo-build.txt`·`m2-combo-m1a-build.txt`). JS 합계 수치는 가드 전과 같다(index.html은 합계 밖).
2. **후보 2 — 채택(조합).** `modulePreload.polyfill: false`. 패치 `patches/m2-2-polyfill-off.patch`. 모든 라우트 −0.20~0.25.
   - 미지원 브라우저 영향(1줄): Vite 8 기본 target `baseline-widely-available` = chrome111 · edge111 · firefox114 · safari16.4 · ios16.4(`node_modules/vite/dist/node/chunks/node.js:699`, L1) 중 `<link rel=modulepreload>` 미지원은 Firefox 114·Safari/iOS 16.4~16.x뿐(지원 시작 Firefox 115 · Safari 17 — MDN/caniuse 기준, L2·이번에 원문 재확인 안 함) → 그 브라우저에서 index.html의 정적 청크 미리 받기만 빠지고(모듈 그래프 순서대로 받음 = 워터폴) 동작은 같다. 동적 import 프리로드는 헬퍼가 `relList.supports` 분기로 처리해 polyfill과 무관.
3. **후보 4 — 기각.** `/studio` −0.06(정규화)이지만 청크 재배치로 공통 react 청크 +0.053KB(3,227 → 3,280B) → 모든 라우트 첫 화면 +0.04~0.05(`/profile` 99.88, `/catalog` 100.34). 작은 공유 청크·런타임 청크는 새로 생기지 않았고 오히려 `fonts`·`generationRepository`·`compareBoardRepository` 청크가 사라짐. 또한 테스트 이음새 5곳(`vi.mock("../data/writeBodyLoader")` — WriteBodyLoad·BoardInputLoad·ProfileGenerateLoad·ProfileCandidates·chunkRetryWiring)이 깨져 `tsc`가 실패 → 측정은 tsc를 뺀 빌드 단계(build-thumbs → vite build ×2 → check-bundle-size)로 했다. 패치 `patches/m2-4-writebody-split.patch`(새 파일 2개 포함 — `git diff --no-index`로 붙임).
4. **후보 3 — 실측 효과 0(1회 시도).** react 청크(CJS interop + react, 28청크가 import)를 엔트리로 합치려 `preserveEntrySignatures: "allow-extension"`을 줬으나 Vite가 앱 빌드에 이미 `false`(`node.js:25982`)를 줘서 변화 0 — 엔트리 서명은 원인이 아니다. rolldown `optimization.chunkOptimization.mergeCommonChunks`(기본 true)가 react를 합치지 않는 실제 이유는 미확인(L3: 순환 청크 의존 회피 추정). 패치 `patches/m2-3-entry-signature.patch`.

## 주의 (main 적용 시)
- 후보 1은 Vite 내부 순서(우리 `generateBundle` pre 훅이 vite import-analysis 훅보다 먼저)에 기댄다. 순서가 바뀌면 번들 참조가 비어 필터가 0건 → base와 같은 출력(안전한 방향 실패). main 적용 시 "preload 목록에 정적 닫힘 청크가 없다" 빌드 산출물 테스트를 함께 둬야 조용한 무효화를 잡는다.
- 동작 변화 0의 근거는 설계 논리(호스트·엔트리 정적 닫힘은 그 import 시점에 이미 평가 완료)다 — 브라우저 확인은 이번 범위 금지라 안 함(미확인).
- 측정 패치의 vite.config 코드는 측정용이라 주석·타입이 최소다. 그대로 커밋하지 않는다.

## 사실 / 추정 / 미확인
- 사실(L1): 표 전부, 패치 6개 `git apply --check` 통과(m2-1·m2-2·m2-3·m2-4·m2-combo-1-2·m2-combo-m1a — 조합+a 패치는 `studioHandoff.tsx` 새 파일 포함), 단순 합 일치(−0.38), 후보 4의 react 청크 +53B·tsc 실패 5곳, 후보 3 변화 0, 조합+a 런타임 청크 없음, 마지막 base 재현.
- 추정(L2~L3): modulepreload 지원 시작 버전(L2), 후보 3 실패 원인(L3), UNMEASURED를 더한 실제 상향 폭(+0.05~0.1 더 클 가능성, L3).
- 미확인: 후보 5·6·B분류(범위 밖, 실측 안 함), 브라우저 동작.

## 마지막 fresh 게이트 (복원 뒤, `app/`)
| 명령 | 결과 |
|---|---|
| `git diff --stat -- app/` | 빈 출력 |
| `npm run build` | exit 0 — 정규화 128.47 · 복원 131.45 = base 재현 (`raw/m2-final-build.txt`) |
| `npm test -- --run` | exit 0 — Test Files 315 passed (315) · Tests 2842 passed (2842) (`raw/m2-final-test.txt`) |

## 서브에이전트
- 사용 안 함(BRIEF-M2 "서브에이전트 불필요 — 빌드 직렬").
