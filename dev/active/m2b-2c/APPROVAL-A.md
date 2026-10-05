# M2B-2c 승인 기록 — ★A (영환님, 2026-10-05)

## 승인 범위 (이것만)
- `app/src/features/studio/renderedVariants.ts`가 엔진 `SECTION_DEFINITIONS`(또는 같은 registry 모듈의 정의 데이터)에서 30쌍 목록을 파생하도록 **엔진 registry import 1건**을 허용한다.
- 근거: P1 시제품 실측 — 명시 나열 +62B(레인 한도 30B 초과), 엔진 파생 127,339B(기준 127,435B 대비 −96B). issue 청크가 이미 엔진 registry 청크를 정적 import하므로 새 데이터 로드가 아님(Developer 측정, 최종 재측정 필요).

## 승인하지 않은 것
- 예산 상향·ADR/가드/check-bundle-size 수정, engineImportGuard 수정, 부모의 킷 import, 엔진 계약·SECTION_DEFINITIONS 수정, 새 슬롯.
- 파생 적용 후 `/studio` 진입이 기준 127,435B 대비 +30B 초과이거나 127,700B 초과면 멈추고 보고한다.

## 적용 조건
- P2~P4는 기존 명시 문자열로 단계별 GREEN(부모 목록 = KIT_REGISTRY 집합 가드 유지).
- 파생은 KIT_REGISTRY가 30쌍이 되는 마지막 단계(P5)에서만 적용.
- 파생 후 "부모 = 엔진"은 구조상 참이므로, 의미 있는 단언은 별도로 둔다:
  1. `KIT_REGISTRY` 키 = 엔진 `SECTION_DEFINITIONS` 정확 집합(30, 중복 0).
  2. unknown(`no-such-variant`)은 부모 목록 불포함·폴백 경로 유지.
  3. 기존 `renderedVariants.test.ts`의 집합 일치·freeze 단언 유지.
- 이전 미구현 예시(memoryExport FALLBACKS, SectionVariant 구조 미리보기, PageDocument 폴백, canvasCaption)는 의도 유지 이관 + 전/후/근거 표. 삭제·skip·단언 약화 금지.

책임: Jarvis(승인 기록) / 실행: Hermes
