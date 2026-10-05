# 백로그 — 다음 수정 작업에 넣을 항목

M1-UI-01-FIX 이후 handoff에 포함한다. 판단 기준은 ADR-003(기능·사용성 우선, 목업 px는 기준 아님).

| ID | 출처 | 내용 | 결정 |
|---|---|---|---|
| D-QA01 | QA-1A-02 | 1280 상세 캡처 하단 GNB 반복 — 캡처 도구 아티팩트 추정(DOM 헤더 1개) | 다음 QA에서 뷰포트 단위 캡처로 재확인 후 종결 |
| B-DET-01 | QA-1A-02 판단 필요 3 | 상세 탭: 목업은 기본 탭에서 섹션·토큰·모바일 동시 노출, 구현은 패널 전환 | **패널 전환 유지** (영환님 2026-09-25, 선택 1) |
| B-DET-02 | QA-1A-02 판단 필요 | 유사 레퍼런스 이름 말줄임("필라테스 스튜…") | **사용성 문제로 수정**: 이름을 식별할 수 있게 2줄 허용 또는 전체 이름 노출. 긴 이름 픽스처로 테스트 |
| ~~B-DET-03~~ | Jarvis 시각 대조 | 상세 안내 문구↔탭 간격 약 20px | **취소** (ADR-003: px 차이는 기준 아님) |
| ~~B-QA-01~~ | QA-1A-02 주의 1 | px 단위 측정 필수화 | **취소** → 다음 QA는 뷰포트 캡처만 필수, 판정은 위계·정렬·일관성·가독성 |
| B-DOC-01 | ADR-003 | `CLAUDE.md` 규칙 3 문구("레이아웃·간격·타이포·색을 충실히 옮긴다")를 ADR-003 기준으로 교체 | 보호 파일이라 영환님 승인 후 수정 (2026-09-25 승인 창 만료로 미반영) |
| B-M2B-01 | SPEC-BOUND MQ-B4 | `footer/biz-extended-map` 이미지 슬롯 도움말 — 지도 캡처를 올릴 때 권리 안내 한 줄 | 편집기 레인(M2b 뒤) |
| B-M2B-02 | SPEC-BODY MQ-B1 | `services/list` `items` 필드 도움말 "가운뎃점(·)으로 나눕니다" | 편집기 레인(M2b 뒤) |
| B-M2B-03 | SPEC-BODY MQ-B4 | 예약 섹션 사이트 주인용 안내 `Callout` — K2 문구의 "문의"를 "예약"으로 | 편집기 레인(M2b 뒤) |
| B-M2B-04 | M2B-4a Codex P2-b | 폴백 섹션 표식(`FallbackCanvas`)이 사이트 굵기 대응 밖 700·600 글꼴 파일을 요청(`kit/siteFonts.ts:27`) — 편집 캔버스 한정, 내보내기는 미렌더 차단으로 영향 없음 | M2B-6 또는 폴백 정리 별건 |
| B-M2B-05 | MQ-M2B5-2 C | 3안 제목 비율 축(`axes.typeScale`)을 편집 문서·킷 토큰까지 전달 — 엔진 계약·저장 검증·내보내기 변경이라 별도 승인 필요 | M2b 뒤 별건 |
| B-M2B-06 | M2B-6 QA 사양 결정 | 3안 비교 대화상자 키보드 순서 — 스크롤 영역(tabIndex 0)이 "이 안 선택"보다 먼저(WCAG 2.1.1 키보드 스크롤). QA 권고: SPEC-COMPARE3 2.1·4절을 실제 순서로 정정 | Designer 문서 정정 |
| B-M2B-07 | M2B-6 QA 사양 결정(P3) | 비활성 예약 폼이 사양(QB-11 흐리지 않음)대로 활성처럼 보임 — 안내 문구 외 시각 단서 추가 여부 | Designer 판단 |
| B-M2B-08 | M2B-6 QA 루브릭 | m2a K1 7변형(about/story·contact/form·faq/accordion·footer/biz-extended·header/sticky-right-cta·hero/fullbleed-left·services/cards-3) TR-POL-04 루브릭 원기록 보강 | Designer 문서 |
| B-M2B-09 | M2B-6 QA 미검증 | QB-13·14(BOUND), BODY QB-14·15, MF-AC-B1·B2·B5·B7·B9, CMP QB3~6·B5·B6, 실제 로컬 이미지 갤러리, Safari·Firefox — Ego Lite 렌더 정지 환경 한계. 포그라운드 Chrome 등 실측 환경에서 재검 | QA 재검 |
