# QB-R7 DOM 측정 원본 요약 (space 3, lib.mjs measure())
- 뷰포트: Emulation.setDeviceMetricsOverride 1280×800 · 1024×768 · 390×844 (mobile:false → 390에서 세로 스크롤바 15px, 레이아웃 폭 375)
- 문서 가로 넘침(documentElement.scrollWidth > innerWidth): 전 측정 false (1280=1280, 1024=1024, 390=375)

| 폭 | 대상 | 대상 rect(l,t,r,b) | 뷰포트 안 | 내부 가로 넘침 | 포커스 | 포커스 가림 |
|---|---|---|---|---|---|---|
| 1280 | 테마 대화상자 | 384,256,896,544 | Y | N | radio v1 (417,399) | N |
| 1024 | 테마 대화상자 | 256,240,768,528 | Y | N | radio v1 | N |
| 390 | 테마 대화상자 | 0,278,375,566 (50/300/800/1500ms 동일) | Y | N | radio v1 (33,421) | N |
| 1280 | 스냅샷 대화상자 | 384,264,896,536 | Y | N | 이름 input | N |
| 1024 | 스냅샷 대화상자 | 256,248,768,520 | Y | N | 이름 input | N |
| 390 | 스냅샷 대화상자 | 0,294,375,550 / 저장 뒤 0,286,375,558 | Y | N | input → 저장 뒤 "지금 상태 저장" | N |
| 1280 | 미리보기 Callout | 제목 H3 262,148,923,168 | Y | — | H3 "스냅샷 'QA R7'를 보고 있습니다 · 편집은 멈췄습니다…" | N |
| 1024 | 미리보기 Callout | 제목 H3 42,148,667,168 | Y | — | 같은 H3 | N |
| 390 | 미리보기 Callout | 블록 12,483,363,609 · H3 42,509,333,529 | Y | N | 같은 H3 | N |

## 390 테마 되돌리기 포커스
1. 테마 대화상자 v2 선택 → 바꾸기 → status "테마를 프로필 v2로 바꿨습니다 · 슬롯 값 31개 모두 그대로입니다", 포커스 #studio-theme-swap
2. 알림 줄 "되돌리기" 버튼 클릭(좌표 아님, 요소 클릭) → status "테마를 프로필 v1로 되돌렸습니다", **포커스 = #studio-theme-swap**(12,406,96,438 뷰포트 안·가림 N)
- 관찰: 적용 직후 알림 줄의 "되돌리기"는 y=-337(뷰포트 위, 화면 밖). status라 보조기기는 읽지만 화면으로는 스크롤해야 보임.

## Esc 닫기 뒤 포커스
- 테마 대화상자 Esc: 1280·1024·390 모두 #studio-theme-swap 복귀
- 스냅샷 대화상자 Esc: 1024·1280 → **BODY** (스냅샷 버튼으로 돌아가지 않음)

## 캡처 한계
- 브리프 방식(captureBeyondViewport:true + 뷰포트 clip)은 페이지가 스크롤된 상태에서 fixed `<dialog>`를 스크롤 0 기준으로 그려 위치가 어긋남(qbr7-theme-dialog-390.png는 시트가 아래로 잘린 것처럼 보이나 DOM rect는 0,278~566 안). captureBeyondViewport:false + clip(shotV) 캡처는 DOM과 일치(qbr7-theme-dialog-390-nobeyond.png).
- 390에서 스크롤 이동 직후 shotV 캡처는 위쪽이 빈 칸(qbr7-390-theme-undo-focus.png, qbr7-preview-callout-390.png) — 합성 프레임 미반영. 이 두 장면 판정은 위 DOM 측정으로 보완.
