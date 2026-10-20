# CSP-1 QA-REPORT — static-html 고정 CSP 독립 검증

- 대상 tip `8775e440` · base `ec32f407` · QA 2026-10-20 · 정적·회귀(브라우저 미사용, Ego는 산출물 재판독)
- 판정: **(작성 중)**

## 1. fresh 게이트·예산 — 통과 (QA fresh 실행, 로그 /tmp/qa-*.log)
- `npx tsc --noEmit -p tsconfig.json` exit 0 · `npm run lint` exit 0 · `npx vitest run --maxWorkers=4` 376 files · **3387 passed** · exit 0 · `npm run build` exit 0
- `/studio/:projectId` 해시 정규화 **128.76KB** (기준선 128.76 · 멈춤 > 128.79) — BRIEF 값 일치
- 복원 진입 **131.75KB** (기준선 131.75) — BRIEF 131.76 대비 −0.01, 개발자 REPORT 131.75와 동일. 증가 아님 → 통과
- 렌더 문서 JS **84.30**/90 · CSS **8.89**/30 — REPORT 값 그대로 재현(불변) · 'React zip 진입 정적 포함 0 가드 통과'

## 2. 변이 5종 — 전부 FAIL로 잡힘 (스크립트 /tmp/qa-mut.py · `npx vitest run src/features/studio/staticHtml --maxWorkers=4` · 매 변이 후 원문 복원, `git status --short` 빈 값 확인)
| # | 변이 (`staticMarkup.ts`) | 결과 | 잡은 테스트(대표) |
|---|---|---|---|
| M1 | 해시 상수 1글자(`xjxo`→`Xjxo`) | **FAIL** 15/96 | AC-03 Node crypto 대조 · AC-04 4종 · AC-05 · AC-08 SPEC 문자 동일 · AC-01/07 |
| M2 | 정책 script-src에 `'unsafe-inline'` 추가 | **FAIL** 10/96 | AC-08 "script-src에 'unsafe-inline' 0" · SPEC 1.1 문자 동일 · AC-01/07 |
| M3 | CSP meta를 head 끝(script 뒤)으로 | **FAIL** 49/96 | 생성기 내부 `assertStaticHead`가 throw → AC-01·04·06·07 + 기존 정적 HTML 테스트 전반 |
| M4 | `assertStaticHead`의 `equiv.length === 1` 제거 | **FAIL** 1/96 | AC-06 "두 번째 meta[http-equiv](refresh·CSP 중복·대소문자) 주입 = throw" |
| M5 | zip 대상에도 meta 삽입(조건 제거) | **FAIL** 11/96 | AC-01 "zip 출력 CSP meta 0 · base 바이트 동일" + zip 생성 테스트 10건(내부 가드 throw) |

가드 완화 2차(테스트가 가드 없이도 잡는지 — QA 추가):
- M3b = M3 + 가드의 위치 조건(`head.children[1] === csp`) 제거 → **FAIL** 5/96 (AC-01 4 픽스처 "charset 다음 2번째" · AC-06 위치) — 테스트가 출력 위치를 직접 단언함
- M5b = M5 + 가드 zip 분기 `=== 0`→`<= 1` → **FAIL** 2/96 (AC-01 zip 바이트 동일 · AC-06 zip 0만 통과) — 테스트가 zip 출력을 직접 단언함
- 관찰: M4는 1건으로만 잡힘(단일 방어선). 결함 아님, 기록만.

## 3. CSP-AC 판정표 재판독
(진행 중)

## 4. Ego 로그 재판독 (재실행 없음)
- 위치: `/tmp/csp-r2/`(저장소 밖, 커밋 안 됨). 남은 것 = PNG 4개·after.html·r01~r03.mjs·preview.log·codex.log. **실행 stdout 로그(R1/R5 콘솔 출력)는 저장되지 않음.**
- R1 스크린샷 sha256 (QA `shasum -a 256` 재계산):
  - before-1280 = after-1280 = `3e4a42d6370818735e3bbadc1799b77f8e3be351c196c32b6b65a2ce42f3f083` — 주장 `3e4a42d637081873` 일치
  - before-390 = after-390 = `1f7c37224414b8795c36089b4a7c43eab574cf5d58d2ccd9bb24d735a6942ddc` — 주장 `1f7c37224414b879` 일치
- after.html: `http-equiv` 1개, 정책 문자열 확인. before.html·tampered.html은 남아 있지 않음(REPORT "측정 후 삭제"와 일치).
- 위반 0 · R5 시트 닫힘: 스크립트(r02 리스너·r03 클릭 흐름)는 주장과 맞는 측정을 하지만 **출력 로그가 없어 QA가 재판독 불가** → 미확인(증거 부재).

## 5. zip·React zip 코드 diff — 통과
- `git diff --stat ec32f407 -- app/src/features/studio/zip app/src/features/studio/reactZip` → 출력 없음 · exit 0. 두 경로 실존(추적 파일 24개) — 빈 diff가 경로 오타 때문이 아님.
- 브랜치 앱 변경은 `staticHtml/` 7파일뿐(`git diff --stat ec32f407 8775e440 -- app`: 202+/2-).
