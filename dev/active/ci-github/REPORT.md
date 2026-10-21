# CI-GITHUB REPORT — 제품 CI 신설 (M5-a)

## 결론
- `.github/workflows/ci.yml` 신설: job 4개 `typecheck`·`lint`·`test`·`build`, ubuntu-latest·Node 22, `pull_request`→main·`push` main, `permissions: contents: read`, concurrency(같은 ref 취소), job별 `timeout-minutes`.
- 액션 2종만, 전체 SHA 고정 + 태그 주석: `actions/checkout@3d3c42e5… # v7.0.1`(`persist-credentials: false`) · `actions/setup-node@949feb24… # v7.1.0`(cache npm, `app/package-lock.json`). `pull_request_target`·secrets·쓰기 권한 0.
- actionlint 0 (`logs/actionlint.txt`).
- 로컬 재현(docker `node:22`, Linux): 4개 명령 전부 exit 0 — 단 `test`는 `TZ=Asia/Seoul` 필요(아래 결함 D1). 워크플로 `test` job에 job 단위 `env: TZ: Asia/Seoul`을 걸었다(앱 코드 변경 0).

## CI가 드러낸 결함 (고치지 않음 — 보고)
- **D1 (테스트 TZ 의존)**: `app/src/data/memoryProjectRepository.test.ts` 3건(createSnapshot·restoreSnapshot·resolveConflict)이 `2026-09-27T09:00:0xZ`의 이름을 `"… · 18:00"`(KST)로 고정 기대한다. 구현 `app/src/data/memoryDocBook.ts:124-127`은 의도적으로 로컬 시계(`getHours`)를 쓰므로 UTC 러너(ubuntu-latest 기본)에서 `"… · 09:00"`이 나와 실패한다. 증거: `logs/repro-3-test-utc.txt`(UTC: 3 failed / 3418 passed) vs `logs/repro-3-test.txt`(TZ=Asia/Seoul).
  - 조치: CI `test` job만 `TZ: Asia/Seoul`(typecheck·lint·build는 UTC 그대로 통과 → TZ 무관 확인). 근본 수정(테스트가 TZ를 스스로 주입하거나 기대값을 로컬 시계로 계산)은 별도 작업 — 수정 후 워크플로의 `env.TZ` 제거.

## ubuntu에서만 깨질 요소 점검
| 항목 | 결과 | 근거 |
|---|---|---|
| 플랫폼 바이너리 | lock에 linux-x64 gnu·musl 모두 있음: `@rolldown/binding-linux-x64-gnu` · `@tailwindcss/oxide-linux-x64-gnu` · `lightningcss-linux-x64-gnu`(최상위·vite 하위). amd64 에뮬레이션으로 `npm ci && npm run build` 재현 | `logs/repro-amd64-*.txt` |
| `build-thumbs` 의존 | 새 의존 없음(vite·jsdom 기존) · `node_modules/.thumbs` 스테이징 → Linux에서 썸네일 21장·가드 통과 | `logs/repro-4-build.txt` |
| 대소문자 경로 | Linux(대소문자 구분 FS)에서 typecheck·build 통과 = import 대소문자 불일치 0 | `logs/repro-1-typecheck.txt`·`repro-4-build.txt` |
| 디렉터리 이름 의존 | `src/build/studioEngineChunk.ts`·`sharedDataChunks.ts`가 절대 경로 끝 `app/src/…`로 판정 — 앱을 `/work`에 복사하면 청크 테스트 2건 실패 + 번들 예산 초과(빌드 실패). CI 체크아웃(`…/<repo>/app`)은 조건 충족 | 1차 재현(app만 복사) 결과, 아래 이력 |
| `app/` 밖 파일 읽기 | 테스트가 `../docs/design/2a-05/SPEC.md`·`../dev/active/m4b-impl/COPY.md`를 읽음 → 전체 체크아웃 필요(checkout 기본값 충족) | 같음 |
| `git ls-files` | `siteFontAssets.test.ts`가 `.git` 필요 → checkout은 `persist-credentials: false`여도 `.git` 유지 | 같음 |
| TZ | D1 | 위 |

재현 이력: 1차 = `git archive HEAD app`만 `/work`에 복사(실패 9건 — 위 표의 경로·git 원인 + D1). 2차 = 전체 트리 + `git init` + 러너와 같은 경로 `/home/runner/work/<repo>/<repo>/app`, UTC → D1만 남음. 최종 = 같은 조건 + test에 `TZ=Asia/Seoul`.

## M5-a 종료 기준 대응
| 종료 기준 / 측정 (M5-SCOPE M5-a) | 상태 |
|---|---|
| Linux 러너 1종, check 4개(typecheck·lint·test·build) | 완료 — `ci.yml` |
| 기본 브랜치 보호에 4개 check 필수 | BLOCKED: push·원격 설정 금지 — Jarvis 담당(check 이름 = job 이름 4개) |
| 의도적 실패 PR 1건 병합 차단 확인 | BLOCKED: push 금지 — Jarvis 담당 |
| PR 1건 check 실행 로그·차단 화면 | BLOCKED: 원격 실행 필요 — Jarvis 담당 |
| 월 사용 분(첫 2주 실측) | BLOCKED: 원격 실행 필요. 참고치(로컬 arm64 docker, 러너는 다를 수 있음) 아래 |
| B-M4B-02(windows·macOS `npm ci`) | 범위 밖 — M5-a만으로 닫히지 않음(MQ-M5-02, 승인 "2A" = Linux 1종) |

로컬 단계별 소요(참고): 아래 "최종 재현" 표.

## 최종 재현 (docker `node:22` v22.23.3 · npm 10.9.9 · 경로 `/home/runner/work/<repo>/<repo>/app` · 전체 트리 + git)
| 단계 (워크플로 순서) | 명령 | arm64 | amd64(에뮬레이션) |
|---|---|---|---|
| 의존성 | `npm ci` | exit 0 · 7s | exit 0 · 10s |
| typecheck | `npm run typecheck` | exit 0 · 14s | — |
| lint | `npm run lint` | exit 0 · 20s | — |
| test | `TZ=Asia/Seoul npx vitest run --maxWorkers=2` | exit 0 · 228s · 380 files / 3421 tests passed | — (에뮬레이션 느림, 생략) |
| build | `npm run build`(번들 예산 포함) | exit 0 · 17s | exit 0 · 55s |

TZ 적용 확인: `TZ=Asia/Seoul node -e 'new Date("2026-09-27T09:00:00Z").getHours()'` = 18 (`logs/repro-env.txt`). UTC 기준 환경 기록: `logs/repro-env-utc.txt`.

## 이 레인 산출 · 범위
- 파일: `.github/workflows/ci.yml` · `README.md`(CI 절) · `dev/active/ci-github/{PROGRESS,REPORT}.md` · `logs/`.
- 앱 코드 변경 0 · 새 의존성 0 · push·pull·fetch 0. Codex 불필요(BRIEF).
- 첫 원격 실행에서 확인할 것(Jarvis): 4개 check 이름 표시 · npm cache 적중 · test 소요(로컬 228s, timeout 15분).
