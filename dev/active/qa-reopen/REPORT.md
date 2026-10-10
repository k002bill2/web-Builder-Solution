# QA-REOPEN REPORT — 실화면 재검 (코드 0)

## meta
- 레인 qa-reopen · base `6fc4668` · 역할 QA · 2026-10-10 · Ego Lite(Chromium) — Safari·Firefox 환경 없음
- 환경: `npm ci`(lock 변경 0) → `npm run build` EXIT 0 → `vite preview 127.0.0.1:4345 --strictPort`(dev 0). vitest 생략(코드 0).
- Ego: 시작 `listTaskSpaces()=[]` → space 1, 창 `normal`(setWindowBounds 불필요).
- 실행 시간 상한 900초(외부 정지) 때문에 우선순위 1·3·4·5는 이번 실행에서 측정하지 못함 → N/A(시간 상한). PASS로 쓰지 않음.

## 항목별 판정

| 항목 | 판정 | 증거 |
|---|---|---|
| 1. B-ER-11 390 /studio "되돌리기" 뷰포트 안 | **N/A**(시간 상한 — v2 테마를 만들려면 비교→프로필→확정→3안→편집→프로필 조정 저장 왕복이 필요) | — |
| 2. D-QA01 1280 상세 GNB 반복 | **PASS(재현 0)** | `/references/ref-c` 1280×900, 스크롤 0·106·212·317·423(문서 높이 1323) 5지점 뷰포트 캡처 `shots/dqa01-1280-y{0,25,50,75,100}.png`, 수치 `logs/dqa01.json`. 모든 지점 DOM `header` 1개(static, 스크롤에 따라 위로 빠짐), 화면 텍스트 "Design Studio" 1회. 하단 GNB 반복 0. 관찰: 스크롤된 지점 캡처 상단에 흰 빈 칸 — 캡처 합성 한계(er-5b-qa 보고와 같은 계열)로 DOM에 대응 요소 없음 |
| 3. B-ER-07 고화소+스로틀 | **N/A**(시간 상한, fixture 미생성 — qfix-qa fixtures는 gitignore라 MANIFEST만 존재) | — |
| 4. B-M2C-09 ② PNG↔HTML 768·390 | **N/A**(시간 상한) | — |
| 5. B-M2B-09 Chrome 범위 | **N/A**(시간 상한). Safari·Firefox는 환경 없음 → N/A | — |

## 결함
- 새 결함 0.

## BACKLOG 닫힘 의견
- D-QA01: **닫힘 권고** — 뷰포트 단위 캡처 5지점에서 GNB 반복 재현 0, DOM 헤더 1개. 이전 보고는 캡처 도구 아티팩트로 판단.
- B-ER-11 · B-ER-07 · B-M2C-09 ② · B-M2B-09: **열림 유지** — 이번 실행 미측정.

## 정리
- (아래 정리 결과로 갱신)
