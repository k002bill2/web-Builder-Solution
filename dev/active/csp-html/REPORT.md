# CSP-1 REPORT — static-html 고정 CSP

- 브랜치 `k002bill2/csp-html` · base `ec32f407` · 정본 CSP-SPEC r1 + 5a(1단계 = static-html)
- 상태: **확정** (R1 run 10:36 rate_limit 중단 → R2 재개 마감 2026-10-20)

## 결론
- `static-html` 결과 head에 고정 CSP meta 1개(charset 다음 2번째, `STATIC_CSP_HTML` = CSP-SPEC 1.1 문자 동일)를 넣었다. 메뉴 스크립트 해시는 손 고정 상수 + Node crypto 대조 테스트. F-15는 `assertStaticHead(head, target)`로 개정.
- 1단계 AC 전부 통과: CSP-AC-01·03·04·05·06(html)·07(html)·08·10 단위 + R1·R5(html) 실화면.
- 예산 증분 0 · 렌더 JS·CSS 판정 불변. zip·React zip 코드 미변경(zip 출력 바이트 불변을 테스트로 고정).

## 변경 파일
- `app/src/features/studio/staticHtml/staticMarkup.ts` — `STATIC_MENU_SCRIPT_HASH`·`STATIC_CSP_HTML` 상수 · html 대상 CSP meta · `assertStaticHead` · F-14 고정 목록에 정책 상수
- `app/src/features/studio/staticHtml/staticCsp.test.ts` — CSP-AC-01·03·04·05·06·07·08 (23 tests)
- `app/src/features/studio/staticHtml/__fixtures__/csp-base-*.html` — AC-07 기준 픽스처 5개(base 생성기 출력, 구현 전 기록)
- `docs/design/m4a/EXPORT-SPEC.md` — F-07·F-15·7.1 개정(CSP-SPEC 4.4)

## 수용 기준
| AC | 결과 | 증거 |
|---|---|---|
| CSP-AC-01 | 통과 | staticCsp.test.ts 4 픽스처 · RED(구현 전) 4 실패 |
| CSP-AC-03 | 통과 | 해시 상수 = Node crypto sha256 · SPEC 값 · 정책 안 해시 |
| CSP-AC-04 | 통과 | 재파싱 유일 script sha256 = 정책 해시(4 픽스처) |
| CSP-AC-05 | 통과 | 1글자 변경 사본으로 판정 실패 · 원문 통과(같은 테스트) |
| CSP-AC-06(html) | 통과 | refresh·CSP 중복·소문자 변형·content 1글자·위치 2종·누락·http-equiv 변경·base·link → throw, 정상 통과 |
| CSP-AC-07(html) | 통과 | 새 출력에서 meta 1개 제거 = base 픽스처 바이트 동일(html 4) · zip 출력 = base 동일 |
| CSP-AC-08 | 통과 | SPEC 1.1 문자 동일 · 지시어 집합 · 금지 토큰 0 · 브랜드 0 |
| CSP-AC-10 | 통과 | `npm run build` check-bundle-size: `/studio` 128.76KB(증분 0) · 복원 131.75KB(증분 0) · 렌더 JS 84.30/90 · CSS 8.89/30 · build 로그 'React zip 진입 정적 포함 0 가드 통과' |
| CSP-AC-R1 | 통과 | 경로 A 문서 앱 내보내기 → CSP 전·후 1280 `3e4a42d6…` 동일 · 390 `1f7c3722…` 동일 · 위반 0 |
| CSP-AC-R5(html) | 통과 | 390 메뉴 시트 열기 → 앵커 탭 → 닫힘(after·before 모두) — 해시 일치 스크립트 실행 확인 |

RED 증거: 구현 전 `staticMarkup.ts`(`c1c8ba0a`)로 현 테스트 실행 → 22 failed · 1 passed(통과 1 = zip 불변 = 의도).

## 게이트 (fresh, R2)
- `npx tsc --noEmit -p tsconfig.json` exit 0 · `npm run lint` 오류 0 · `npx vitest run --maxWorkers=4` 376 files · 3387 tests passed · `npm run build` exit 0

## 스펙과 다르게 한 부분 (사유 한 줄씩)
- `STATIC_CSP_ZIP` 미정의 — 5a 1단계는 html만. zip 출력은 바이트 불변(meta 0)을 테스트로 고정.
- F-15를 `assertStaticHead(head, target)`로 export — head를 처음부터 만들어 주입 경로가 없으므로 AC-06을 순수 함수로 검사.
- AC-07 = base 출력 파일 스냅샷(4.2.3 "새 스냅샷 대신"과 다름) — 변경 전 출력이 있어야 바이트 비교가 성립.
- R1 before = 앱 내보내기 after에서 CSP meta 1개를 지운 파일 — base 빌드를 따로 띄우지 않았다. AC-07이 "meta 제거 = base 출력 바이트 동일"을 보장하므로 동등.
- R5 대조군(`"click"`→`"clicK"`)은 열린 채였지만 동작 자체가 바뀌는 변경이라 CSP 차단 증거로 쓰지 않는다 — 해시 강제는 AC-03·04·05. R5 실행(r03)엔 위반 리스너가 없었고, R1의 위반 0은 리스너 양성 대조 없이 측정.
- R1·R5 열람 = `vite preview` 4399가 dist/csp-r1/의 두 파일을 서빙(BRIEF 지정 포트). 측정 후 삭제.

## 예산
- base(BRIEF) `/studio` 128.76KB · 복원 131.76KB → 변경 후 128.76KB · 131.75KB = 증분 0. 감량 불필요.

## Codex
(adversarial 1회 · 반영 1회 — 아래 채움)

## 커밋
- `0c379708` BRIEF·PROGRESS 보존 · `71e96df9` REPORT 초안 · `c1c8ba0a` AC-07 픽스처 · `6bedabe4` meta·해시·F-15 · `af6e875c` EXPORT-SPEC 개정
- R2: `3822670e` BRIEF-R2·PROGRESS · `afa1324e` RED 증거 · `bf4d0554` 게이트·예산 · `2a371b9e` R1·R5
