# STUDIO-PRELOAD-SLIM REPORT — preload 중복 제거 + polyfill off 정식 적용

작성 2026-10-17 · 브랜치 `k002bill2/studio-preload-slim` · base `92522714` · 같은 머신·직렬 빌드 · KB = 1000B gzip · 값은 `check-bundle-size.mjs` 출력(L1)

## 결론
- **적용 완료, 동작 변화 0.** `/studio` 정규화 128.47 → **128.09**(−0.38) · raw 129.86 → **129.40**(−0.46) · 복원 진입 정규화 131.45 → **131.07** · raw 132.90 → **132.43**. REPORT-M2 조합 기대값(128.09/129.40/131.07/132.43)과 **정확히 일치**. 증가 라우트 0, 렌더 문서 변화 0.
- **기준선(`m2cBaseline.json`·`bundleBudget.test.mjs`) 변경 안 함** — 근거는 아래 "기준선" 절.
- 조용한 무효화 가드: 빌드 산출물 검사 `scripts/preloadGuard.mjs`를 `check-bundle-size.mjs`가 부른다 → `npm run build`가 실패한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `app/src/build/preloadDedup.ts` | 순수 함수 `staticClosure`·`dedupPreloads`(JS 호스트만 거름, HTML 호스트 통과) + `createPreloadDedup()`(번들 잡는 플러그인 `generateBundle` enforce pre·order pre ↔ resolveDependencies 한 쌍, 모듈 전역 상태 없음). Vite 내부 순서 의존을 머리 주석에 명시 |
| `app/src/build/preloadDedup.test.ts` | 단위 7건: 닫힘(순환·없는 키)·필터·엔트리 닫힘·HTML 통과·입력 불변·번들 잡기 전 그대로·인스턴스 분리 |
| `app/vite.config.ts` | 앱 빌드에만 `modulePreload: { resolveDependencies, polyfill: false }` + 플러그인. 근거 주석(미지원 브라우저 영향 1줄 포함). 렌더·thumbs 빌드 무변경 |
| `app/scripts/preloadGuard.mjs` | 산출물 가드(부작용 없음): ① 앱 manifest JS 청크의 `__vite__mapDeps` 목록에 그 청크·엔트리 정적 닫힘 없음(목록 있는 청크 0개도 실패) ② `dist/index.html`에 엔트리 정적 의존 modulepreload 링크 유지 ③ 엔트리에 polyfill(`querySelectorAll(\`link[rel="modulepreload"]\`)`) 없음 |
| `app/scripts/preloadGuard.test.mjs` | 단위 7건: 목록 읽기·통과·①②③ 각각 실패·형식 변화(목록 0개)·엔트리 없음 |
| `app/scripts/check-bundle-size.mjs` | 가드 호출(앱 manifest·dist 파일·index.html 전달) → 실패 시 exit 1. 기존 판정 무변경 |

## TDD
1. 단위 RED(예측: 모듈 없음으로 2 파일 실패) → 결과 `Test Files 2 failed · no tests`(일치) → 구현 뒤 GREEN 14/14.
2. 산출물 가드 RED(예측: base dist에서 ① 다수·③ 실패, ② 통과) → `node scripts/check-bundle-size.mjs` exit 1 — ① 16개 청크 중복(예: StudioLayout 목록에 issue·sectionLibrary·index·react…) · ③ polyfill · ② 통과(일치, `raw/guard-red-base-dist.txt`).
3. vite.config 적용 → `npm run build` exit 0 · `preload 가드: preload 목록 17개 청크 · index.html modulepreload 1개 · polyfill 검사 — 통과`(`raw/slim-build.txt`).
- 실행 방법: `cd app && npm run build`(가드 포함) 또는 빌드 뒤 `npm run check:bundle`. 단위: `npx vitest run src/build/preloadDedup.test.ts scripts/preloadGuard.test.mjs`.
- 기존 단언 약화 0(기존 테스트 파일 무수정).

## 번들 표 (base `raw/base-build.txt` → 적용 `raw/final-build.txt`)
| 시나리오 | 판정선/한도 | base | 적용 | 차 |
|---|---|---|---|---|
| `/studio` 해시 정규화 진입 | ≤ 128.53 | 128.47 | **128.09** | −0.38 |
| `/studio` raw 진입 | ≤ 130 | 129.86 | **129.40** | −0.46 |
| 복원 진입 정규화 | ≤ 131.51 | 131.45 | **131.07** | −0.38 |
| 복원 진입 raw | ≤ 134 | 132.90 | **132.43** | −0.47 |
| `/studio` 첫 화면 | ≤ 100 | 91.79 | 91.53 | −0.26 |
| 공통 JS(참고) | — | 89.34 | 89.10 | −0.24 |
| `/catalog` 첫 화면 · 진입 | 101 · 125 | 100.30 · 102.64 | 100.05 · 102.39 | −0.25 · −0.25 |
| `/references/:id` 첫 화면 · 진입 | 100 · 125 | 97.72 · 100.06 | 97.46 · 99.80 | −0.26 · −0.26 |
| `/compare`(·조정 있음) 첫 화면 · 진입 | 100 · 125 | 99.23 · 123.07 | 98.95 · 122.70 | −0.28 · −0.37 |
| `/profile` 첫 화면 · 진입 | 100 · 125 | 99.83 · 120.62 | 99.56 · 120.10 | −0.27 · −0.52 |
| `/profile (3안 있음)` 진입 | 125 | 123.10 | 122.58 | −0.52 |
| `/projects` 첫 화면 · 진입 | 100 · 125 | 99.43 · 108.72 | 99.15 · 108.38 | −0.28 · −0.34 |
| 렌더 문서 JS · CSS | 90 · 30 | 84.22 · 8.89 | 84.22 · 8.89 | 0 |
- 증가 라우트 0. `dist/index.html`의 `<link rel="modulepreload" href="/assets/react-*.js">` 유지(가드 ② · 브라우저 확인).

## 기준선 — 변경하지 않음 (근거)
- ADR-004 개정 16 결정 5는 "배분 관례(개정 15 결정 3) 그대로 — **배분 레인은** 정규화 실측으로 `normEagerKb`와 테스트 기대값을 같은 커밋에서 **올린다**"이다. 감량 레인이 기준선을 내리라는 규정은 없다.
- 감량 시 선례는 두 갈래다: 개정 8(감량분 **잠금** — 기준선 128.67 → 128.19)은 영환님 결정("★A")으로만 했고, 개정 13(ENTRY-SLIM −0.56)은 "**기준선·한도·멈춤선은 바꾸지 않는다** — 감량분은 잠금하지 않고 해시·공유 청크 잡음 흡수와 다음 레인 여유로 남긴다"였다.
- 이번 브리프에는 잠금 결정이 없으므로 개정 13 관례를 따라 `normEagerKb`(128.50·131.48)·`eagerKb`·`bundleBudget.test.mjs`를 그대로 둔다. 결과 여유: `/studio` 정규화 128.53 − 128.09 = **0.44** · 복원 131.51 − 131.07 = **0.44** · raw 한도 130 − 129.40 = **0.60**. 잠금 여부는 Jarvis/영환님 결정 사항(ADR 개정 필요).

## Ego Lite (동작 변화 0 확인 — 사실)
- `npm run build` 뒤 `npx vite preview --host 127.0.0.1 --port 4371 --strictPort`(사전 리슨 0 확인).
- 카탈로그 → 모던 카페·로컬 베이커리 비교 추가 → 비교 보드 "이 레퍼런스로 전부 선택: A" → 프로필 확정 v1 → 3안 만들기("3안을 만들었습니다") → A안 선택 → 편집 시작(`/studio/project-1`) → Hero 제목 편집 → "이 브라우저에 저장됨" 확인(`shots/01-studio-saved.png`) → 새로고침(복원 진입) → 제목 "아침을 여는 한 잔 프리로드" 유지(`shots/02-studio-restored.png`).
- CDP 이벤트(새로고침 구간): `Runtime.exceptionThrown`·console error·`Log` error·`Network.loadingFailed` **0**, JS 응답 20건 전부 200/304. 문서 modulepreload 링크: HTML의 react + 동적 import 헬퍼가 넣은 StudioPage·StudioLayout·gateCheck 등(엔트리 닫힘 중복 없음).
- 정리: `indexedDB.deleteDatabase("design-studio")` → deleted · 남은 DB `[]` · `finish({keep:[]})` · `listTaskSpaces()` `[]` · preview 종료 · 4371 리슨 0. 영환님 창·main 5480 무접촉.

## 최종 fresh 게이트 (`app/`, 커밋 `4f4a7be7` 코드)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 (`raw/final-typecheck.txt`) |
| `npm run lint` | exit 0 (`raw/final-lint.txt`) |
| `npm test -- --run` | exit 0 — Test Files **317** passed (317) · Tests **2856** passed (2856) = base 315/2842 + 2 files/14 tests (`raw/final-test.txt`) |
| `npm run build` | exit 0 — 위 번들 표 · preload 가드 통과 · 썸네일 가드 통과 (`raw/final-build.txt`) |

## 사실 / 추정 / 미확인
- 사실(L1): 번들 수치·가드 RED/GREEN·게이트·브라우저 확인 위 전부.
- 추정(L2): modulepreload 미지원 브라우저 범위(Firefox 114·Safari 16.4~16.x — REPORT-M2 인용, 원문 재확인 안 함).
- 미확인: Firefox/Safari 실기기 동작(Ego Lite = Chromium만).

## 서브에이전트
- 사용 안 함(브리프 "서브에이전트 분할: 불필요"). Codex 0(브리프 금지).
