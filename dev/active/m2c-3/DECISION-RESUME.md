# M2C-3 재개 결정 — 구조 점검 뒤 배치 변경 1 모양 (영환님 ★A, 2026-10-06)

- 선행: M2C-3S 병합(main `ab5fa4a`) — `/studio` 진입 127.36→**127.14KB**. 이 브랜치에 main 병합 `6a92f31`. 기준선 파일 127.39(127.36+0.03)·검사기·한도 변경 0 → 여유 0.25KB.
- 재개 배치: 이 레인 `logs/try1.patch`(배치 변경 1) 모양을 출발점으로 — 진입에는 `details`+`lazy` 펼침 1개, 보관소 retain·dispose·참조 집합 계산은 패널 청크. 실제 패널 DS 부품은 prop 주입(`ContactOwnerNote` 관례)으로 진입 증가 억제.
- **SPEC 2.1 대비 수용 편차(기록):** ① "[이미지 편집]" 버튼 대신 `details`/`summary` 펼침(펼침 상태가 있는 버튼으로 읽힘) ② 패널 로드 중 문구 없음(`fallback=null`), 청크 실패는 기존 `VariantOptions` lazy 경로와 동일(`retryableImport` 새 URL 재시도 없음). 나머지 SPEC·IMG-AC는 그대로.
- 멈춤선 유지: 레인 끝 `/studio` 진입 >127.39 또는 다른 라우트 ±0.03 초과 전망 시 구현 중단 보고(상향 요청 금지).
- **Ego Lite(영환님 지시):** 화면을 실제로 보고 확인, 작업 끝나면 이 레인이 연 Ego Lite 창·탭 모두 닫고 `listTaskSpaces()` 등으로 닫힘 재확인 기록.

책임: Jarvis(결정 기록) / 실행: Hermes
