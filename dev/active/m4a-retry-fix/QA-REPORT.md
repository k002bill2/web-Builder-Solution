# M4-a-6 QA REPORT — B-M4A-08 재시도 복구 독립 검증

> 대상 tip `0a426172` (base `a0068764` = main app/src 동일) · QA 2026-10-18 · 정적·회귀 중심(브라우저 0 · Codex 0)
> **판정(확정): PASS with notes** — 거짓 성공 0 · 기존 단언 약화 0 · 예산 몫 안 · 이 브랜치가 만든 회귀 0. 노트 5건(아래 "노트").

## 1. 게이트·예산 — 통과 [사실 — fresh 실행, tip 0a426172 내용]
| 명령 (`app/`) | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test -- --run` | exit 0 · Test Files 355 passed · Tests **3143** passed (Developer 보고 3143과 일치) |
| `npm run build` (check-bundle-size 포함) | exit 0 |
- 예산(정규화): `/studio` **128.79** (기준선 128.79 + 0.03 멈춤 128.82) · 복원 진입 **131.77** (멈춤 131.80) — 보고값과 일치. main(a0068764 임시 worktree `/tmp/m4a6qa/main-wt` 빌드) 128.71 · 131.69 → 증분 **+0.08 · +0.08**. 개정 18 M4-a 몫 0.10 중 누적 0.09(M4-a-2 +0.01 + 이번 +0.08) → 남은 몫 **0.01**. raw 130.09 / 130.5 · 133.12 / 134.
- 다른 라우트(main 대비 raw, 정규화 판정 대상 아님): /catalog 102.39→102.38 · /references/:id 99.80→99.79 · /compare(2종) 122.66→122.65 · /profile 119.92→119.93 · /profile(3안) 122.40→122.41 · /projects 109.53→109.53. 첫 화면 합계도 ±0.01. 양방향 ±0.01은 청크 해시 이름 흔들림(ADR-004 개정 16의 raw 판정 불가 사유)으로 판단 — 코드 증분 0 [추정 — 이 브랜치 변경 파일은 편집기·조작 뒤 청크에만 import됨].

## 2. 거짓 성공 0 · 거짓 다시 시도 — 계수 규칙 추적 + 변이 4종 [사실]
**코드 추적** (`exportChunk.fails` = 마지막으로 내보내기 청크를 받은 뒤의 로드 실패 수)
| 규칙 | 위치 | 확인 |
|---|---|---|
| exportFlow 로드 실패 +1 | `features/studio/exportFlowLoader.ts:14-20` `trackExportChunk` catch → +1 후 재던짐, `:17` `loadExportFlow`가 래핑 | 예 |
| exportFlow 받음 → 0 | `features/studio/exportFlow.ts:47` 모듈 평가 시 `exportChunk.fails = 0` | 예 |
| 생성기(staticHtml) 실패 +1 · 받음 0 | `exportFlow.ts:49-55` `loadGenerator().then(0 후 generator, +1 후 throw)` — `loadGenerator`는 `retryableImport`(`data/chunkRetry.ts:13-18`, 실패 뒤 `?retry=N` 새 URL) | 예 |
| 2부터 새로고침 안내 · 다시 시도 유지 | `components/studio/ExportRetryAlert.tsx:27` `fails > 1 ? EXPORT_RELOAD : reason` | 예 |
| 거짓 성공 0 | 성공 표시(useExportFlow·ExportAfter) 무변경 — 변경은 실패 alert의 사유 자리 문구뿐. 생성기 래퍼는 성공/실패 값을 그대로 전달 | 예 |
| 거짓 다시 시도 아님 | 다시 시도 = 새 URL 재요청(`chunkRetry.ts:18`) → 일시 끊김이면 복구(Ego L4 attempt3 실측) | 예 |

**변이** (스크립트 `/tmp/m4a6qa/mut.sh`, 대상 5파일: exportFlowChunk·exportFlowLoader·ExportRetryAlert·ExportChunkFailure·ExportFlow 테스트 / 기준 27 passed). 매번 `git checkout -- src` 후 `git status --short src` 빈 값 확인.
| # | 변이 | 결과 | 잡은 테스트 |
|---|---|---|---|
| M1 | 계수 0 리셋 제거(`exportFlow.ts:50` `(fails = 0), generator` → `generator`) | **FAIL** 1 | `exportFlowChunk.test.ts` "2회 연속 실패 → 1 → 2 · 다음 시도 성공 → 0" |
| M2 | 안내 조건 `> 1` → `> 0` | **FAIL** 1 | `ExportRetryAlert.test.tsx` "청크 실패 1회·…(0)는 새로고침 안내 0" |
| M3b | 로더 계수 래퍼 본문에서 `+= 1` 제거 | **FAIL** 2 | `exportFlowLoader.test.ts` 2건 |
| M3a | 앱 배선에서 래퍼 제거(`loadExportFlow = retryableImport(...)`, trackExportChunk 미사용) | **생존** — 대상 5파일 27 passed, **전체 스위트도 355 files · 3143 passed** | 없음 |
- M3a 생존 사유: `exportFlowLoader.test.ts`는 `trackExportChunk`를 직접 부르고, 화면 테스트 `ExportChunkFailure.test.tsx:18-23`은 `loadExportFlow`를 mock으로 바꿔 실패를 래퍼 밖에서 주입한다 → "앱이 실제로 래퍼를 쓰는가"를 지키는 테스트가 없다. 실제 배선은 Ego L4 attempt2(exportFlow 2회 차단 → 안내 표시)로만 근거 → **노트 1(테스트 공백, P3)**. 단언 약화·거짓 성공은 아님.

## 3. 바뀐 기존 단언 — 약화 0 [사실]
명령: `git diff a0068764..0a426172 -- ':/app/**/*.test.*' | grep '^-'` → 삭제/변경 줄 4개뿐.
| 파일 | 이전 | 이후 | 판정 |
|---|---|---|---|
| `app/scripts/bundleBudget.test.mjs:152` | eagerKb 130.00 · 133.03 / toleranceKb 0.03 · renderJsStopKb 89.7 | eagerKb 130.10 · 133.13 / 0.03 · 89.7 | 기준선 값 갱신(raw 참고값) — 허용치·멈춤선 그대로. 약화 아님 |
| `app/scripts/bundleBudget.test.mjs:156` | normEagerKb 128.71 · 131.69 | 128.79 · 131.77 | 개정 18 M4-a 몫(0.10) 안의 기준선 상향 — 판정 규칙 불변. 약화 아님(예산 몫 소비) |
| 같은 파일 주석 | 이력 문자열 | `→ M4-a-6 실측 상향(128.79 · 131.77)` 추가 | 주석 |
| `ExportRetryAlert.test.tsx:2` | `import { describe, expect, it }` | `afterEach` 추가 | 기존 단언 3건 그대로, 신규 2건 + afterEach 계수 리셋 |
- 신규 파일 `exportFlowChunk.test.ts`·`exportFlowLoader.test.ts` — 추가만. 삭제·skip·완화된 기존 단언 0.

## 4. Ego 증거 재판독 (실화면 재실행 0) — REPORT 주장과 일치 [사실 — 로그·스크립트 원문]
| REPORT 주장 | 로그 근거 | 일치 |
|---|---|---|
| L4 쓰기 탭(p1)에서 `exportFlow-*`·`staticHtml-*` 차단 → 1회 실패 alert + 다시 시도 | `ego-L4.mjs:75-81` p1에 `Network.setBlockedURLs`; `ego-L4.txt` attempt1 `exportFlow-WckyxPLZ.js 0 0`, alert "내보내지 못했습니다다시 시도" | 예 |
| 2회째 `?retry=1` + "새로고침한 뒤 다시 시도하세요" | attempt2 res `exportFlow-WckyxPLZ.js?retry=1 0 0`, alert에 안내 문구 + 다시 시도 | 예 |
| 해제 뒤 `?retry=2`·`staticHtml-*` 200 → "정적 사이트(zip)를 만들었습니다", snapshot_created·export_succeeded, 0.93초 | attempt3 `?retry=2 200 300`·`staticHtml-CRYf1IL3.js 200 300`, status 성공 문구, ev 3건, `attempt3 ms 930` | 예 |
| 두 번째 탭 대조군(차단 0)도 INFRA, 읽기 전용 안내 없음 | `ego-L4.mjs:97-108` p2 = 차단 없이 `newPage`; `p2 banners []`, `p2 control` ev `export_failed INFRA`, alert "다시 시도", 1549ms | 예 |
| L3: p2에서 청크를 다 받은 뒤에도 INFRA 2회(0.9초), 같은 문서 p1은 성공 | `ego-L3.txt` attempt3/4 `?retry=2 200 1873`·`staticHtml 200` + INFRA(928·944ms); `p1 baseline` 성공(923ms) | 예 |
| L2 "60초" = 성공 문구만 기다린 시간 초과 | `ego-L2.mjs:87` wait3가 `/만들었습니다/` status만 대기(60000ms) — alert는 조건에 없음 | 예(스크립트로 확인, 실패 alert 즉시성은 L3 수치에서 도출) |
- 노트 A: L4의 transferSize가 대부분 300(헤더만) — L3가 같은 프로필에서 같은 URL을 먼저 받아 둔 캐시 재검증으로 보인다 [추정]. 차단 요청은 `0 0`, 해제 뒤 새 URL(`?retry=2`) 요청이 실제로 나갔다는 사실은 그대로라 결론을 바꾸지 않는다.
- 노트 B: 두 Ego 실행 모두 `exportFlow`를 먼저 막아서 **생성기 청크(staticHtml)의 `?retry=N` 경로는 실화면에서 한 번도 시험되지 않았다**(staticHtml은 원래 URL로 첫 요청에 200). 생성기 쪽 계수는 단위 테스트(`exportFlowChunk.test.ts`)로만 근거.

## 5. 두 번째 탭 INFRA + "다시 시도" — 이 브랜치의 회귀 아님 [사실 — 코드] · 심각도 제안 P2(Medium)
- `git merge-base --is-ancestor a0068764 main` 참 · `git diff a0068764 main -- app/src` 빈 값 → base = main(app/src 동일).
- 이 브랜치가 바꾼 앱 파일은 5개(`exportFlow.ts`·`exportFlowFails.ts`·`exportFlowLoader.ts`·`ExportRetryAlert.tsx` + 테스트). INFRA는 `data/memoryDocBook.ts:283-290` `runJob`이 생성기 예외를 INFRA·retryable로 기록하는 경로 — 이 파일·탭 잠금(`features/projects/tabLockHold.ts`)·`useExportFlow.ts` 모두 무변경.
- `exportFlow.ts:49-55` 변경은 `loadGenerator()` 결과에 `.then(성공 → 계수 0 후 같은 generator 반환, 실패 → +1 후 같은 error 재던짐)`만 붙인다 → 성공/실패 값이 base와 같다. 대조군 p2는 차단 0인 새 페이지라 계수 0 → `ExportRetryAlert`도 base와 같은 `reason` 분기(`fails > 1` 거짓). 즉 p2의 "INFRA + 다시 시도"는 main에서도 같은 코드 경로 [사실 — 코드]. 원인(탭 잠금으로 스냅샷/잡 쓰기 실패)은 미확인 [추정].
- 심각도 제안 **P2(Medium)**: 데이터 손실·거짓 성공 없음, 쓰기 탭에서는 정상. 다만 두 번째 탭에서 사유 없이 "다시 시도"만 반복 제공 = 그 탭에서는 거짓 다시 시도(E-S27 위반 후보). 후속 별건(읽기 전용 사유 표시)으로 이월 권고. B-M4A-08 판정에는 영향 없음.

## 노트 (PASS with notes 사유)
1. [P3 · 테스트 공백] 변이 M3a(앱 배선에서 계수 래퍼 제거)가 전체 스위트에서 생존 — `loadExportFlow`가 `trackExportChunk`로 싸여 있음을 지키는 회귀 테스트 없음. 권고: 소스 가드(예: chunkRetryWiring류) 또는 mock 없이 실패를 주입하는 화면 테스트 1건.
2. [정보] 예산 남은 M4-a 몫 0.01 — 다음 M4-a 증분은 사실상 감량 동반 필요.
3. [정보] 생성기 청크(staticHtml)의 `?retry=N` 경로는 Ego에서 미시험(두 실행 모두 exportFlow를 먼저 차단) — 단위 테스트로만 근거.
4. [P2 · 별건 후보] 두 번째 탭 내보내기 = INFRA + 사유 없는 "다시 시도" — main에도 같은 경로(회귀 아님, 5절). 후속 별건 권고.
5. [정보] 다른 라우트 raw ±0.01 양방향 — 해시 이름 흔들림 [추정].
- (기존 Developer 미반영) Codex r1 #2 저장 상태별 안내 — REPORT에 BLOCKED로 기록됨, QA 판정 범위 밖.

## QA 수행 기록
- 브라우저 0 · Codex 0 · 앱/테스트 수정 커밋 0(변이는 작업 트리에서만, 매번 복원). 서브에이전트 분할 없음(항목이 짧아 직접 수행).
- 임시 main worktree `/tmp/m4a6qa/main-wt`(a0068764, node_modules 심링크) — 빌드 비교 후 `git worktree remove`로 정리.
- 증거 원문: `/tmp/m4a6qa/{typecheck,lint,test,build,main-build,mut-*}.txt`(커밋하지 않음 — 수치는 위 표에 옮김).
