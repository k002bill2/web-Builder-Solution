# M4-a-4 QA BRIEF — 정적 zip 내보내기 릴리스 게이트 (QA, 정적 + 실화면 분리 1차 = 정적·회귀)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 `k002bill2/m4a-qa` = `k002bill2/m4a-impl` tip `a834eb88`. 정본 `docs/design/m4a/EXPORT-SPEC.md`(EXP-AC-01~19, R1~R5) · Developer 보고 `dev/active/m4a-impl/REPORT.md` 8절.
**이번 run = 1차(정적·회귀·생성물 검증).** 실화면 브라우저 매트릭스는 2차 run에서 따로 한다 — 이번에 브라우저 앱 흐름을 만들지 마라.

## 검증
1. fresh 게이트 typecheck·lint·test(353/3130)·build · 예산 `/studio` 128.71 · 복원 131.69 · 렌더 JS 84.29/90 · 다른 라우트 무변화.
2. EXP-AC 단위 판정표(01~19) — Developer 판정 재현, 부분 2건(02·14) 사유 확인, 바뀐 기존 단언 이전/이후 표가 약화 아닌지.
3. **생성물 검증(Node)**: 단위 테스트 픽스처 경로로 zip을 실제 파일로 써서(임시, 되돌림) `unzip -t`·`zipinfo`·`ditto -xk` 해제·한글 파일명·7파일 구성·`LICENSES.md`/`OFL.txt` 내용 · 단일 HTML 생성물에 외부 요청 문자열 0.
4. **회귀**: 기존 PNG 내보내기·단일 HTML 경로(참조 직렬화로 바뀜 — Q5)·게이트 8줄·편집기 저장 흐름 테스트 무변화 · 변이 3종(참조 Blob 합침 제거 / F-14 제외 범위 확대 / ZIP_MAX 검사 제거) → FAIL 확인.
5. 문구: 성공 문장 조사 오류("정적 사이트(zip)을" → "를") 확인 · EXPORT-SPEC 문구 키와 화면 문자열 대조표.
6. **2차 실화면 run 준비물**: 실화면 매트릭스(Chromium·Safari·Firefox × 1280·390 × zip·HTML · Archive Utility 더블클릭 · `file://` 글꼴 · R3 큰 문서)를 실행 순서·예상 턴과 함께 `dev/active/m4a-qa/LIVE-PLAN.md`로 작성(브라우저 설치 여부 `ls /Applications` 확인 포함).

## 판정
- PASS / PASS with notes / FAIL(거짓 성공·회귀·예산 초과). 산출 `dev/active/m4a-qa/{QA-BRIEF,QA-PROGRESS,QA-REPORT,LIVE-PLAN}.md`. Codex 금지. 최대 45턴, 36턴부터 마감.

## 공통
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. **첫 2턴 BRIEF·PROGRESS 커밋, REPORT 초안(잠정 판정 줄 포함) 10턴 안에 커밋**, 이후 항목마다 갱신 커밋(중단 대비). 사실/추정/미확인 구분.
- 변이·임시 테스트는 매번 되돌림. **앱·테스트 수정 커밋 금지**(수정 제안은 REPORT에 패치 형태로).
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 0 기록. 마감 전 `git status --short` node_modules 외 빈 값.
