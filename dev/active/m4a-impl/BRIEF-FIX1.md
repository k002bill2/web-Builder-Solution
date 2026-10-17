# M4-a-2 BRIEF FIX1 — AppSec Medium 2 · Low 묶음 · QA 테스트 공백 · 문구 1 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "추천안 자동 적용" — AppSec Medium은 머지 전 수정이 ★)
대상: 이 워크트리 tip `a834eb88`. 근거(다른 워크트리 — 읽기만, `git show <ref>:<path>`로 열람):
- AppSec REPORT: `git show k002bill2/m4a-appsec:dev/active/m4a-appsec/REPORT.md` (+ `logs/` 퍼즈 표·패치 검증 로그)
- QA 변이 로그: `git show k002bill2/m4a-qa:dev/active/m4a-qa/logs/mutations.txt` (M2a·M2c 생존)

## 범위 (전부 TDD — 퍼즈 입력을 회귀 테스트로 먼저 RED)
1. **M-1·M-2 (Medium)**: `staticMarkup.ts` `clean()` 제거 대상에 `template`·SVG `animate`·`set`·`animateMotion`·`animateTransform` 추가(대소문자는 `localName` 비교로 확실히). RED 입력: AppSec 퍼즈 M06·M07·M12·M13·M41·M42·M43. 결과에 `onerror`·`<script>`·외부 href 0.
2. **L-2 (09c4309d 경계)**: F-14 제외를 **CSS 입력의 `url(data:font/…;base64,<base64 글자>)`로만** 한정(AppSec 패치 제안, `logs/regex-09c-patch-check.txt`). notice·고정 스크립트에는 적용 0. RED: Codex 주석 경계 입력 `/* url(data: */ .apfs-banner{…} /* ) */` · notice 안 `url(data:…)` · QA 변이 M2a(모든 `url()` 제외)·M2c(탐욕 매치)가 **FAIL로 잡히는 테스트**.
3. **L-1 (CSS url 정규식)**: 따옴표 섞인 `url("…'…")`·`url('…)…')` 외부 URL이 검사에서 빠지지 않게 — "`url(`·`image-set(`·`@import` 출현 수 = 엄격 매치 수, 다르면 실패" 방식(킷 CSS의 Tailwind 이스케이프 선택자·`content:"\201C"`는 깨지지 않게, 실제 build로 확인). 킷 CSS 이스케이프(`@\69mport`·`u\72l(`)도 같은 출현 수 방식으로 잡히면 포함, 정상 빌드가 깨지면 범위 밖으로 REPORT 기록.
4. **문구**: 성공 문장 "정적 사이트(zip)을" → "를"(조사 — 문자열 위치는 ExportAfter/exportFlow 조작 뒤 청크).
- 범위 밖(REPORT에 이월 표): L-3~L-6 · Info · EXP-AC-14(저장소 코드) · `readProject` 신뢰 경계.

## 규칙
- 예산: 고친 모듈은 조작 뒤 청크 — `/studio` 128.71 · 복원 131.69 **증분 0** 기대. 넘으면 실측으로 기준선 갱신(개정 18 누적 +0.10 이하), 넘으면 멈춤. 렌더 JS 84.29/90.
- 기존 단언 약화·skip 0. fresh typecheck·lint·test·build. 마지막에 Codex 1회(`adversarial-review --scope branch --base a834eb88`, 옵션 확인에 `--help`를 쓰지 마라 — focus 텍스트로 처리된다), 지적 반영 1회.
- 브라우저 실화면 불필요(QA 2차가 함). 쓰기 경로: `features/studio/{staticHtml,zip}/**`·`components/studio/Export*`·`features/studio/exportFlow*`·`dev/active/m4a-impl/`. 기준선 2파일은 예산 규칙일 때만.
- 명시 경로 커밋, amend·rebase·push 0. 첫 2턴 BRIEF-FIX1·PROGRESS 커밋, **항목마다 PROGRESS·REPORT(9절 FIX1) 커밋**. 마감 전 `git status --short` node_modules 외 빈 값. 서브에이전트 불필요. 최대 55턴, 45턴부터 마감.
