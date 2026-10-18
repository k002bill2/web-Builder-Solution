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

## 예산
- (측정 전)

## Codex
- (미실행)

## 커밋
- 469ca001 BRIEF·PROGRESS

## 이탈
- REPORT 초안이 10턴 기한을 넘김(약 17턴째) — CP0 정적 추적·빌드 확인을 먼저 끝내느라.
