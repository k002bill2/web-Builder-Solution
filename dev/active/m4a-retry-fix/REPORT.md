# M4-a-6 REPORT — B-M4A-08 렌더 청크 로드 실패 뒤 같은 탭 재시도 복구

> 상태: **초안(진행 중)**. 사실/추정/미확인을 구분한다.

## 잠정 결론
- [사실·정적] 내보내기 클릭 경로의 런타임 동적 import는 **전부 `retryableImport`를 탄다**(exportFlow·staticHtml). ExportAfter는 React.lazy지만 QA가 막지 않았고, 정적 의존에 막힌 청크가 없다.
- [사실·빌드] 막힌 두 청크(`exportFlow-*`·`staticHtml-*`)의 정적 의존 청크(재시도 URL로 못 바꾸는 쪽)에 막힌 청크가 없다 → chunkRetry.ts가 적어 둔 "정적 의존 청크" 한계로는 QA L2가 설명되지 않는다.
- [미확인] 그래서 QA L2 실패 원인은 코드 추적만으로 확정 못 함 → Ego Lite 재현(네트워크 요청에 `?retry=N`이 나가는지)으로 CP0을 닫는다.

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

## 예산
- 개정 18 남은 M4-a 몫 0.09 안: `/studio` 정규화 128.71 → **128.79(+0.08)** · 복원 진입 131.69 → **131.77(+0.08)** · raw 130.10 · 133.13(한도 130.5·134). 남은 몫 0.01.
- 기준선 2파일(`app/scripts/m2cBaseline.json`·`bundleBudget.test.mjs`) 같은 커밋에서 갱신. 근거 `logs/build.txt`.

## 게이트 (fresh, 9f0d3693 내용)
- typecheck exit 0 · lint exit 0 · test exit 0(355 files · 3142 tests) · build exit 0 — `logs/{typecheck,lint,test,build}.txt`

## Codex
- (미실행)

## 커밋
- 469ca001 BRIEF·PROGRESS
- 4be8ec22 REPORT 초안(CP0)
- 9f0d3693 수정·테스트·기준선

## 이탈
- REPORT 초안이 10턴 기한을 넘김(약 17턴째) — CP0 정적 추적·빌드 확인을 먼저 끝내느라.
