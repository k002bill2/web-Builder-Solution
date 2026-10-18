# M4-a-6 REPORT — B-M4A-08 렌더 청크 로드 실패 뒤 같은 탭 재시도 복구

> 상태: **마감(R2)**. 사실/추정/미확인을 구분한다.

## 결론
- [사실·Ego L4] **같은 탭 재시도로 복구된다.** 쓰기 탭에서 `exportFlow-*`·`staticHtml-*` 차단 → 1회 실패(alert + 다시 시도) → 2회째 `?retry=1` 요청 + "새로고침한 뒤 다시 시도하세요" → 차단 해제 뒤 다시 시도 = `?retry=2`·`staticHtml-*` 200 → **"정적 사이트(zip)를 만들었습니다"**(snapshot_created·export_succeeded, 0.93초). 거짓 "다시 시도" 아님. 근거 `logs/ego-L4.txt`·`logs/m4a6-l4-recovered.png`.
- [사실·Ego L3·L4] 이전 L2의 attempt3 실패(60초 뒤 alert)는 **청크 재시도와 무관 — 두 번째 탭 조건**이다. L2는 쓰기 탭(p1)을 연 채 새 Page(p2)에서 복원 진입했다. p2에서는 청크를 다 받은 뒤에도 `export_failed: INFRA`(0.9초, 재시도 2회 모두), **차단을 한 번도 하지 않은 두 번째 탭(대조군)도 같은 INFRA**, 같은 문서를 p1에서 내보내면 성공. 60초는 L2 스크립트가 성공 문구만 기다린 시간 초과(실패 alert는 즉시 떴다).
- [추정] 두 번째 탭 INFRA의 원인 = 탭 잠금(`features/projects/tabLockHold.ts` Web Locks — p1이 쓰기 탭)으로 p2의 "내보내기 전" 스냅샷 쓰기/잡이 실패하고 저장소가 INFRA로 기록(`data/memoryDocBook.ts:288`). p2에는 읽기 전용 안내가 없고(`p2 banners []`) "다시 시도"가 떠서 **그 탭에서는 거짓 "다시 시도"**다 → 별건 결함 후보(B-M4A-08 범위 밖, 쓰기 경로 밖). QA L2(새 Page 복원 진입)도 같은 조건이었을 수 있다 [추정].

## CP0 — 내보내기 동적 import 체인 (base a0068764 · `npm run build` 출력 기준)
| # | import 위치 | 대상 청크 | 방식 | retryableImport | 대상 청크의 정적 의존(빌드) | QA L2 차단 |
|---|---|---|---|---|---|---|
| 1 | `features/studio/exportFlowLoader.ts:7` (빌드상 StudioLayout 청크) | `exportFlow-*` | 동적 | **예** | chunkRetry · exportFileName · exportImages · index · projectRepository · StudioLayout | **예** |
| 2 | `features/studio/exportFlow.ts:37` loadGenerator → 슬롯(`memoryDocBook.ts:178-188`, 실패 기억 안 함) | `staticHtml-*` | 동적 | **예** | exportImages · index · projectRepository · StudioLayout (동적 import 0) | **예** |
| 3 | `components/studio/StudioLayout.tsx:52-53` ExportConfirmDialog·ExportResultView | `ExportAfter-*` | React.lazy | 아니오 | Callout · index · react · StudioLayout | 아니오 |
| 4 | `features/studio/useGateReport.ts:9` (시작 흐름 재검사) | `gateCheck-*` | 동적 | 아니오 | — | 아니오 |
| 5 | `ExportRetryAlert` | 진입(StudioLayout) 청크 정적 | 정적 | — | — | — |
- render 문서(`render.html`·`render-*.js`)는 미리보기 iframe이 이미 받아 둔 것을 재사용(QA r07·r08) — 내보내기 import 체인 밖.
- QA r11의 `import("/assets/exportFlow-DOcCQkYC.js")` 실패는 **원래 URL** 재요청이라 플랫폼 실패 캐시를 보여 줄 뿐, 앱의 `?retry=N` 경로를 시험한 것이 아니다 [사실 — 스크립트 원문].

## 수정 (TDD) — 커밋 9f0d3693
- `features/studio/exportFlowFails.ts`(새 파일, 편집기 청크): 연속 실패 시도 수 `exportChunk.fails` · 문구 `EXPORT_RELOAD` = "새로고침한 뒤 다시 시도하세요". 로더를 import하지 않으려고 따로 둔다(chunkRetryWiring 테스트: exportFlow가 싸는 로더는 생성기 1개).
- `features/studio/exportFlowLoader.ts`: `trackExportChunk` — exportFlow 로드 실패마다 +1(재시도 경로는 그대로 retryableImport → `?retry=N`).
- `features/studio/exportFlow.ts`: 생성기 청크 로드 실패면 +1, 청크 실패 없이 끝난 시도면 0(`requestExportOnce` = 계수 래퍼 + 기존 본문 `requestOnce`).
- `components/studio/ExportRetryAlert.tsx`: `fails > 1`이면 사유 자리에 새로고침 안내. **"다시 시도" 버튼은 남긴다** — 재시도는 실제로 새 URL을 요청하므로(일시 끊김이면 복구) 거짓 "다시 시도"가 아니다. 성공 표시는 바꾸지 않음(거짓 성공 0).
- RED 근거 `logs/red-1.txt`: `exportChunk` 미정의로 신규 7건 실패 → GREEN.
  - 1회 실패 뒤 재시도 성공 + 다른 URL(`?retry=1`): `exportFlowLoader.test.ts` 1번(기존 `chunkRetry.test.ts:27·39`도 같은 성질)
  - 2회 연속 실패 → 계수 2 · `?retry=1`,`?retry=2`: `exportFlowLoader.test.ts` 2번 → 안내 표시: `ExportRetryAlert.test.tsx` 신규 2건
  - 생성기 청크 2회 실패 → 1→2, 다음 성공 → 0: `exportFlowChunk.test.ts`

## 저장 상태 조건 (BRIEF 2 "저장 상태가 안전할 때만")
- [사실] `request`(useExportFlow)는 저장 phase가 idle·saved일 때만 돈다 → 청크 실패 시점에는 저장이 끝나 있다.
- [사실] 탭 수준 이탈 경고(`memoryProjectRepository.ts:148` beforeunload — memory 저장소면 늘, local이면 dirty·inflight일 때)가 새로고침 전에 막는다.
- **BLOCKED(부분)**: 안내 뒤 편집으로 저장 중이 되거나 memory 저장소일 때 "저장 먼저" 문구로 바꾸려면 `StudioLayout.tsx`(ExportRetryAlert에 save.state·persistence 전달)를 고쳐야 한다 — 쓰기 경로 밖. 후속 후보로 이월.

## 이월 (쓰기 경로 밖)
- `ExportAfter`(StudioLayout의 React.lazy — 실패를 영구 기억)·`gateCheck`(useGateReport) 로드는 retryableImport 밖. QA L2 범위에서는 막히지 않았다.

## 예산 (R2 재실측 — f1646812 빌드)
| 경로 | 기준(a0068764) | 지금(정규화) | 증분 | raw / 한도 |
|---|---|---|---|---|
| `/studio` | 128.71 | **128.79** | **+0.08** | 130.09 / 130.5 |
| `/studio` 복원 진입 | 131.69 | **131.77** | **+0.08** | 133.12 / 134 |
- 개정 18 남은 M4-a 몫 0.09 안 → 남은 몫 **0.01**. 감량 목표(+0.03 이하) **미달**.
- 감량 판정(진입 청크 `StudioLayout-*` 조각 제거 시 gzip 감소, `logs/budget-r2.txt`): 문구 25B · 로더 계수 래퍼 23B · 표시 분기 8B · 계수 객체 8B. 문구는 exportFlow를 **못 받았을 때** 떠야 하므로 조작 뒤 청크로 못 옮긴다 → 문구만으로 하한 ≈ +0.03. 래퍼를 useExportFlow 기존 거부 처리에 접으면 ≈ 0.01 감소 가능하나 `trackExportChunk` 테스트 진입점을 바꿔야 해(단언 이동) 이번 회차에서 하지 않음 — 후속 후보.
- Codex 반영(f1646812)은 계수를 조작 뒤 청크(exportFlow)에서 옮겼을 뿐 진입 청크 증분 0(raw 130.10 → 130.09).

## 게이트 (fresh, f1646812 내용)
- typecheck exit 0 · lint exit 0 · test exit 0(355 files · **3143** tests) · build exit 0 — `logs/{typecheck,lint,test,build}.txt`
- Codex P2 회귀 테스트 RED `logs/red-2.txt`(expected 1, got 0) → GREEN `logs/green-2.txt`

## Codex (adversarial 1회 — `--scope branch --base a0068764`, 원문 `logs/codex-r1.txt`, 재실행 0)
| # | 지적 | 처리 | 근거 |
|---|---|---|---|
| 1 | [P2] 요청 종료(응답 유실·조회 10초 종료) 뒤 도착한 생성기 청크 실패를 계수에서 누락 · 다른 요청이 플래그를 지움 | **반영** f1646812 — 계수를 요청이 아니라 생성기 **로드 결과**에 붙임(받으면 0, 실패면 +1). 요청별 플래그 제거 → 다른 프로젝트 요청이 지울 상태가 없다. 계수는 청크 단위 전역(설계상 프로젝트별 아님) | 신규 테스트 `exportFlowChunk.test.ts` 1번 RED→GREEN |
| 2 | [P2] 저장되지 않은 편집에도 새로고침 안내 | **미반영(BLOCKED)** — 저장 상태를 안내에 넘기려면 `StudioLayout.tsx` 수정 필요(쓰기 경로 밖). 완화: request는 idle·saved에서만 돌고 beforeunload 경고가 있음(아래 "저장 상태 조건") | 후속 후보 |

## 커밋
- 469ca001 BRIEF·PROGRESS
- 4be8ec22 REPORT 초안(CP0)
- 9f0d3693 수정·테스트·기준선
- 367b0f37 REPORT 수정·예산·게이트
- f1646812 Codex r1 P2 반영(계수 = 로드 결과) + RED/GREEN·게이트 로그 · BRIEF-R2
- 47282696 Ego L2·L3·L4 로그·스크린샷
- 8d2f4578 예산 판정 실측 · Codex r1 원문

## 후속 후보 (이번 범위 밖)
1. 두 번째 탭(읽기 전용) 내보내기 = INFRA + 거짓 "다시 시도" — 읽기 전용 사유 표시(재현: `logs/ego-L4.mjs` 대조군).
2. Codex #2 — 저장 상태별 새로고침 안내(StudioLayout 전달).
3. 진입 청크 ≈0.01 감량 — 로더 계수 래퍼를 useExportFlow 거부 처리로 접기.

## 이탈
- REPORT 초안이 10턴 기한을 넘김(약 17턴째) — CP0 정적 추적·빌드 확인을 먼저 끝내느라.
- 이전 run이 61턴 상한으로 중단(R1) → R2로 마감.
- 예산 감량 목표(+0.03 이하) 미달 — 실측 +0.08 그대로 기록(남은 몫 안).
- Ego는 R2에서 2회(L3 계측, L4 단일 탭) — L3가 원인을 두 번째 탭으로 좁혀, 복구 실화면은 L4에서 확인.
