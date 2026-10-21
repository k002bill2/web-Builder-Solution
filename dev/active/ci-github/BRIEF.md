# CI-GITHUB BRIEF — 제품 CI 신설 (M5-a, Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-21
승인: 영환님 "2A" — GitHub Actions Linux 1종, 필수 check 4개(typecheck·lint·test·build). 정본 `docs/design/m5/M5-SCOPE.md` M5-a · MQ-M5-02.
사실(Jarvis 확인 2026-10-21): 저장소 visibility = **public**, `main` branch protection 없음, `.github/` 없음, 앱 = `app/`(npm, `package-lock.json`), scripts `typecheck`·`lint`·`test`(vitest)·`build`(tsc → build-thumbs → vite build ×2 → check-bundle-size). 로컬 검증 이력 Node 22(docker `node:22`).

## 산출: `.github/workflows/ci.yml`
- 트리거 `pull_request`(→ main) · `push`(main). `concurrency` 같은 ref 취소. `permissions: contents: read`만. `timeout-minutes` 지정.
- `ubuntu-latest` 1종, Node 22, `working-directory: app`, `npm ci`(cache npm, lock 경로 `app/package-lock.json`).
- **job 4개 = 필수 check 이름 고정**: `typecheck` · `lint` · `test`(`npx vitest run --maxWorkers=2`) · `build`(`npm run build` — 번들 예산 검사 포함). 이름은 branch protection에 그대로 쓰이므로 바꾸지 않는다.
- 액션은 **전체 커밋 SHA 고정 + 주석에 태그**: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1` · `actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0`. 그 외 서드파티 액션 0. `pull_request_target`·secrets·쓰기 권한 0(공개 저장소 — 외부 PR이 비밀·쓰기 권한을 얻지 못하게).
- 검증: `actionlint` 0 · 로컬에서 4개 명령을 워크플로와 같은 순서·같은 디렉터리로 재현(Node 22가 없으면 docker `node:22`, 결과 `logs/`에 tee) · ubuntu에서만 깨질 요소(대소문자 경로·플랫폼 바이너리·`build-thumbs` 의존) 점검 기록.
- `docs/06-handoff/` 또는 README에 CI 절 3~5줄(필수 check 이름·로컬 재현 명령). M5-SCOPE M5-a 종료 기준 대응 표를 REPORT에.

## 규칙
- 앱 코드 변경 0(CI가 드러낸 실제 결함은 고치지 말고 REPORT에 기록 후 보고). 새 의존성 0. Codex 불필요.
- **git push·pull·fetch 금지**(원격 실행·branch protection은 Jarvis가 함). 첫 2턴 BRIEF·PROGRESS 커밋, 항목마다 커밋. 마감 전 `git status --short` 빈 값. 최대 30턴, 24턴부터 마감.
