# M4-a-6 QA REPORT — B-M4A-08 재시도 복구 독립 검증

> 대상 tip `0a426172` (base `a0068764` = main app/src 동일) · QA 2026-10-18 · 정적·회귀 중심(브라우저 0 · Codex 0)
> **잠정 판정: PASS with notes** (초안 — 항목 1·2·3 실측 전)

## 1. 게이트·예산 — 진행 중

## 2. 계수 규칙·변이 — 진행 중

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
