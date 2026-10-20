# CSP-1 QA-REPORT — static-html 고정 CSP 독립 검증

- 대상 tip `8775e440` · base `ec32f407` · QA 2026-10-20 · 정적·회귀(브라우저 미사용, Ego는 산출물 재판독)
- 판정: **(작성 중)**

## 1. fresh 게이트·예산
(진행 중)

## 2. 변이 5종
| # | 변이 | 결과 |
|---|---|---|

## 3. CSP-AC 판정표 재판독
(진행 중)

## 4. Ego 로그 재판독 (재실행 없음)
- 위치: `/tmp/csp-r2/`(저장소 밖, 커밋 안 됨). 남은 것 = PNG 4개·after.html·r01~r03.mjs·preview.log·codex.log. **실행 stdout 로그(R1/R5 콘솔 출력)는 저장되지 않음.**
- R1 스크린샷 sha256 (QA `shasum -a 256` 재계산):
  - before-1280 = after-1280 = `3e4a42d6370818735e3bbadc1799b77f8e3be351c196c32b6b65a2ce42f3f083` — 주장 `3e4a42d637081873` 일치
  - before-390 = after-390 = `1f7c37224414b8795c36089b4a7c43eab574cf5d58d2ccd9bb24d735a6942ddc` — 주장 `1f7c37224414b879` 일치
- after.html: `http-equiv` 1개, 정책 문자열 확인. before.html·tampered.html은 남아 있지 않음(REPORT "측정 후 삭제"와 일치).
- 위반 0 · R5 시트 닫힘: 스크립트(r02 리스너·r03 클릭 흐름)는 주장과 맞는 측정을 하지만 **출력 로그가 없어 QA가 재판독 불가** → 미확인(증거 부재).

## 5. zip·React zip 코드 diff
(진행 중)
