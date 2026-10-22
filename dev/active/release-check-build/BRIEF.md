# RELEASE-CHECK-BUILD BRIEF — M5-0 릴리스 체크 A(빌드 행렬) + B-M2B-05e (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-22 (★ 자동 진행 — M5-0은 호스팅 결정과 독립, ADR-008 5절)
worktree `~/orca/workspaces/web-builder-solution/release-check-build` · 브랜치 `k002bill2/release-check-build` · base origin/main `2f03e500`.
병렬 레인: `release-check-live`(브라우저 실측, 쓰기 경로 `dev/active/release-check-live/`만) — 그 경로와 BACKLOG는 건드리지 말 것.

## 0. 준비 (1턴)
- `cd app && npm ci` 직접 실행(이 레인 안에서). `package-lock.json` 변경이 생기면 커밋하지 말 것. `node_modules/.bin/vitest`·`.bin/tsc` 존재 확인.
- BRIEF·PROGRESS(`dev/active/release-check-build/PROGRESS.md`) 커밋(2턴 안).

## 1. B-SEC-09 ① — React zip RZ-AC-C1 행렬 재실행 (현재 main 생성기 출력)
배경: CSP-2(React zip 템플릿 변경) 뒤 행렬 기록은 `node:22 npm ci`뿐(`dev/active/csp-zip/QA-REPORT.md:73·85`). RZ-AC-C1 행렬 = **Node 20.19 · 22 × (`npm ci && npm run build` · `npm install && npm run build`)**. 선례 스크립트·로그: `dev/active/m4b-impl/raw/zip-build-node20.txt`·`zip-build-node22.txt`, `dev/active/csp-zip/logs/e1-c1-docker-build.txt`.
- 현재 main 생성기로 React zip 2종(M1 = 이미지 없는 문서 · M2 = 이미지 포함 문서, m4b-impl 선례와 같은 픽스처)을 **테스트 경로**로 만들어 `$TMPDIR` 아래 풀기. zip sha256 기록.
- docker `node:20.19`·`node:22` 각각 × `npm ci && npm run build` · (새로 풀어서) `npm install && npm run build` = 8회. 각 회차 exit·Node/npm 버전·`dist/index.html` CSP meta가 head 첫 자식인지·인라인 script 0 을 `logs/rzc1-<node>-<mode>-<M>.txt`로 tee.
- 한계 명시: zip이 앱 버튼 경로가 아닌 테스트 경로 산출임(선례와 같음).

## 2. B-M2B-05e — 정적 HTML `--site-t1` 직접 단언 (테스트만)
- `app/src/features/studio/staticHtml/staticHtml.test.ts`(TS-AC-10 근처, :374)에 정적 HTML **직렬화 결과 문자열**에서 `--site-t1` 값이 문서 `typeScale`로 계산된 rem인지 단언 추가(같은 문서·typeScale 없음 = 프로필 비율 값과 비교, 기대값은 `app/src/kit/tokens.ts`의 계산 함수로 구하거나 tokens.test.ts:33 방식 참고).
- RED 증명: `docKitTokens`에서 `typeScale ?? scale` → `scale` 임시 변이 → 새 단언 FAIL(전체 스위트) → `git checkout -- app/src` 되돌림. `logs/05e-red.txt`·`05e-green.txt`.
- 비테스트 앱 소스 수정 금지.

## 마감
- fresh `npm run typecheck && npm run lint && npx vitest run --maxWorkers=4 && npm run build` → `logs/gates.txt`(예산 128.79·131.79 증분 0).
- REPORT.md: 결론 · 8회 행렬 표(exit·버전·meta 위치·인라인 0) · zip 해시 · 05e RED/GREEN · B-SEC-09 ① 닫힘 판정 · B-M4B-02(windows·macOS)는 이 레인으로 닫히지 않음을 명시.
- 컨테이너 0(`docker ps` 기록) · `git status --short` 빈 값.

## 규칙
- **git push·pull·fetch 등 원격 명령 일절 금지.** amend·rebase 금지. 항목마다 경로 명시 커밋.
- 브라우저·preview 금지. BACKLOG·ADR·다른 레인 경로 수정 금지. Codex 불필요. 서브에이전트 금지.
- 시간: 실행 상한 약 15분 — 항목 1 → 2 순서, 각 항목 끝에 커밋. 남으면 PROGRESS에 BLOCKED로 남기고 마감. 최대 50턴.
