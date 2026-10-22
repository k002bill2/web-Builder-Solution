# RELEASE-CHECK-LIVE BRIEF — M5-0 릴리스 체크 B(Chromium 실측) (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-22 (★ 자동 진행 — M5-0은 호스팅 결정과 독립)
worktree `~/orca/workspaces/web-builder-solution/release-check-live` · 브랜치 `k002bill2/release-check-live` · base origin/main `2f03e500`.
쓰기 경로 = `dev/active/release-check-live/`만. **앱 코드·테스트·BACKLOG 수정 금지.** 병렬 레인 `release-check-build`(docker·테스트)의 경로는 건드리지 말 것.

## 0. 준비 (2턴 안)
- `cd app && npm ci`(이 레인 안에서, lock 변경 커밋 금지) → `npm run build`.
- BRIEF·PROGRESS(`dev/active/release-check-live/PROGRESS.md`) 커밋.
- 포트: preview는 `npx vite preview --port 4399 --strictPort`. 시작 전 `lsof -nP -iTCP:4399 -sTCP:LISTEN` 기록(점유 중이면 4398 사용, 다른 포트 건드리지 말 것).
- 브라우저 도구: `ego-browser`(선례 스크립트 `dev/active/typescale-impl/t4-ego.mjs` · `dev/active/csp-zip/scripts/*.mjs`). 모든 stdout은 `dev/active/release-check-live/logs/`에 tee.

## 1. B-M2B-05d — TS-AC-13 캔버스 제목 font-size 실측 (최우선)
- 선례 `t4-ego.mjs`(앱 안 클릭으로만 /studio 이동 — 새로고침하면 메모리 store 사라짐) 흐름 재사용.
- **프로필 비율 1.25** 프로젝트로 시작(SPEC TYPESCALE 4.1 TS-AC-13 — 지난 실행은 1.2였음). 3안 카드 비율 기록 → 프로필과 다른 비율 안(B 또는 C)으로 편집 시작.
- 캔버스 `render.html`은 sandbox iframe(OOPIF) → `contentDocument` 불가. CDP `Target.getTargets`로 render.html 대상 찾고 `Target.attachToTarget({flatten:true})` 세션에서 `Runtime.evaluate`로 첫 h1(또는 hero 제목)의 `getComputedStyle().fontSize`와 `:root` `--site-t1` 값 수집.
- 대조: 같은 문서를 프로필 비율 안(A)으로 시작했을 때 같은 값. 판정 = (선택 안 비율로 계산한 값) ≠ (A안 값)이고 각각 계산식과 일치.
- 25턴 안에 OOPIF 부착이 안 되면 시도한 방법·오류를 로그로 남기고 BLOCKED.

## 2. B-SEC-09 ②④ — 정적 zip `file://` 실제 생성기 출력 (Chromium)
배경: R3 `file://` 증거는 E0 임시 삽입본뿐, R4 1280 lazy 이미지 1장 `ok:false` 재확인 없음(`dev/active/csp-zip/QA-REPORT.md:45·61·86·89`). 선례 스크립트 `dev/active/csp-zip/scripts/e0-r3-file.mjs`·`e0-c1-lazy.mjs`.
- 앱 UI(preview)에서 이미지 포함 문서를 **정적 zip으로 실제 내보내기**(앱 버튼 경로) → 다운로드 파일 sha256 기록 → `$TMPDIR`에 `ditto -xk`로 풀기.
- `file://.../index.html`을 1280·390에서 열기: CSP meta 1 · 위반 0(`securitypolicyviolation` 수집) · 이미지 n/n complete(**스크롤로 lazy 전부 로드 후** 재확인) · 글꼴 loaded · 390 메뉴 열기→앵커→닫힘. 양성 대조 1회(인라인 script 삽입 → 위반 1).
- 각 단계 viewport는 같은 스크립트 안에서 설정하고 `innerWidth` 기록.

## 마감
- QA-REPORT.md: 첫 줄 판정(05d · B-SEC-09 ②④ 각각 PASS/FAIL/BLOCKED) · 수치표 · 로그 경로. **Safari·Firefox·Windows·Archive Utility는 범위 밖**(수동 — 사람 필요)으로 명시.
- preview 종료 + `lsof -nP -iTCP:<port> -sTCP:LISTEN` 0줄을 REPORT에 기록. ego-browser 탭·세션 정리. `git status --short` 빈 값.
- QA-REPORT 초안 커밋은 30턴 전.

## 규칙
- **git push·pull·fetch 등 원격 명령 일절 금지.** amend·rebase 금지. 경로 명시 커밋.
- 서브에이전트 금지. Codex 불필요. 실행 상한 약 15분 — 항목 1 → 2 순서, 각 항목 끝에 커밋, 남으면 BLOCKED로 마감. 최대 45턴.
