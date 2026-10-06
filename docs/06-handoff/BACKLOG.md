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
| B-M2B-06 | ✅ M2C-SPECFIX 정정(SPEC-COMPARE3 r3, 구현 0) | M2B-6 QA 사양 결정 | 3안 비교 대화상자 키보드 순서 — 스크롤 영역(tabIndex 0)이 "이 안 선택"보다 먼저(WCAG 2.1.1 키보드 스크롤). QA 권고: SPEC-COMPARE3 2.1·4절을 실제 순서로 정정 | Designer 문서 정정 |
| B-M2B-07 | ✅ 결정·구현(M2C-TODO T-1) → QA 기준선 재생성 | M2B-6 QA 사양 결정(P3) | 비활성 예약 폼이 사양(QB-11 흐리지 않음)대로 활성처럼 보임 — 안내 문구 외 시각 단서 추가 여부 | Designer 판단 |
| B-M2B-08 | ✅ 원기록 작성(m2a r3 5절) | M2B-6 QA 루브릭 | m2a K1 7변형(about/story·contact/form·faq/accordion·footer/biz-extended·header/sticky-right-cta·hero/fullbleed-left·services/cards-3) TR-POL-04 루브릭 원기록 보강 | Designer 문서 |
| B-M2B-09 | M2B-6 QA 미검증 | QB-13·14(BOUND), BODY QB-14·15, MF-AC-B1·B2·B5·B7·B9, CMP QB3~6·B5·B6, 실제 로컬 이미지 갤러리, Safari·Firefox — Ego Lite 렌더 정지 환경 한계. 포그라운드 Chrome 등 실측 환경에서 재검 | QA 재검 |
| B-M2C-01 | M2C-4 Codex r1·r2 | 렌더 직렬화 메시지 상한 `HTML_MAX` 8,000,000자(`render/htmlMessage.ts`) < 이미지 보관 한도 30MB — 큰 이미지 문서의 정적 HTML이 html 메시지 폐기 → 시간 초과로 실패 가능. 상한·전송 방식·사전 크기 안내 결정 | 렌더 쪽 레인 또는 M4 zip |
| B-M2C-02 | ✅ M2C-P3 수정(merge) | M2C-5 QA D-1(P3) | IMG-AC-29 — `check-bundle-size` /studio 조작 뒤 목록에 ImageSlotPanel·ingest·imageStore·exportImages 미표시(판정 영향 없음). afterAction 키 추가만 | Developer(scripts 추가만) |
| B-M2C-03 | ✅ QB-10 전제 정정(m2c r3)·MQ-S1 ★A → QA T-5 | M2C-5 QA D-2(P3·사양) | QB-10 잃은 이미지 경로가 제품 흐름으로 도달 불가 — 새로고침 시 프로젝트 자체가 사라짐(서버 0). SPEC 9절 QB-10 전제 정정 또는 보관 방식(MQ-C2 B) 재론 | Designer 문서 |
| B-M2C-04 | ✅ M2C-P3 수정(merge) | M2C-5 QA D-3(P3) | 1280→1024 폭 변경 시 열어 둔 "이미지 편집" 펼침이 닫힘(작업 위치 유실) | Developer |
| B-M2C-05 | ✅ M2C-P3 수정(merge) | M2C-5 QA D-4(P3) | 스위치 도움말 "끄면 … 색 면으로" ≠ SPEC r2 4절 "꺼짐 = 미디어 없음·섹션 배경" — 문구 정정 | Developer 문구 |
| B-M2C-06 | ✅ M2C-P3 수정(merge) | M2C-5b QA E-1(P3·접근성) | "이미지 지우기" 실행 시 버튼이 사라지며 포커스가 BODY로 유실(키보드 Enter 포함) — 지운 뒤 "이미지 고르기" 등으로 포커스 이동 | Developer |
| B-M2C-07 | ✅ M2C-P3 수정(merge) | M2C-5b QA E-2(P3) | 지운 뒤에도 role=status가 "이미지를 넣었습니다…"로 남음 — 지움 결과 알림 | Developer |
| B-M2C-08 | ✅ 결정·구현(M2C-TODO T-2) | M2C-5b QA O-2(사양) | 지운 뒤 대체텍스트 입력값 유지(다음 이미지에 재사용) — 유지/초기화 결정 | Designer 판단 |
| B-TEST-01 | M2C-TODO Jarvis 검증 | `pages/ProjectsPage.test.tsx` J-S07 "저장 뒤 맨 위 줄 '이름 바꾸기' 포커스"가 부하(load 32) 중 1/3회 toHaveFocus 실패(161ms, 단독·재실행 통과) — 포커스 이동 시점 비결정. 대기 방식 안정화 | Developer(테스트) · ER-3a 검증: `pages/ProfileCompare.test.tsx` CMP-AC-U1 부하(82) 2회 연속 실패 → 단독·전체 재실행 통과 |
| B-M2C-09 | M2C-REQA·E1 미검증 | QB-10 정적 HTML 개수 문구 · m2a 7변형 ⑩ 내보내기 동일성(캔버스·정적 HTML·PNG) — 잃은 이미지 상태에서 시드 문서 게이트(대비 AA·SEO) 차단으로 미실측. E-1(PNG INFRA)은 dev 서버 설계상 실패로 닫음(preview에서 3경로 성공) — **QA의 PNG·정적 HTML 실측은 build+`vite preview`에서** | QA 재검(게이트 통과 시드 또는 B-M2B-09와 묶음) |
| B-ER-01 | EDITOR-REST-0 | 프로필 화면 "새로 시작"(EQ-2 A) UI 미구현 — 기존 문서를 대비 통과 버전으로 옮기는 다른 길 | Designer·Developer |
| B-ER-02 | EDITOR-REST-0 | `resolveConflict` 메모리 저장소 missing(memoryProjectRepository.ts:101-103) — 충돌 화면 도달·동작 불가. ER-3a에서 스냅샷과 함께 처리 여부 확인 | Developer(ER-3a) |
