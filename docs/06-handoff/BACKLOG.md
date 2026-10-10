# 백로그 — 다음 수정 작업에 넣을 항목

M1-UI-01-FIX 이후 handoff에 포함한다. 판단 기준은 ADR-003(기능·사용성 우선, 목업 px는 기준 아님).

| ID | 출처 | 내용 | 결정 |
|---|---|---|---|
| D-QA01 | QA-1A-02 | 1280 상세 캡처 하단 GNB 반복 — 캡처 도구 아티팩트 추정(DOM 헤더 1개) | 다음 QA에서 뷰포트 단위 캡처로 재확인 후 종결 · ✅ QA-REOPEN 닫힘(1280 뷰포트 5지점 재현 0·DOM header 1) |
| B-DET-01 | QA-1A-02 판단 필요 3 | 상세 탭: 목업은 기본 탭에서 섹션·토큰·모바일 동시 노출, 구현은 패널 전환 | **패널 전환 유지** (영환님 2026-09-25, 선택 1) |
| B-DET-02 | QA-1A-02 판단 필요 | 유사 레퍼런스 이름 말줄임("필라테스 스튜…") | **사용성 문제로 수정**: 이름을 식별할 수 있게 2줄 허용 또는 전체 이름 노출. 긴 이름 픽스처로 테스트 · ✅ `5dcd61a` 닫힘(DetailSidebar 2줄·전체 이름 툴팁 · ReferenceDetailPage.test 단언) |
| ~~B-DET-03~~ | Jarvis 시각 대조 | 상세 안내 문구↔탭 간격 약 20px | **취소** (ADR-003: px 차이는 기준 아님) |
| ~~B-QA-01~~ | QA-1A-02 주의 1 | px 단위 측정 필수화 | **취소** → 다음 QA는 뷰포트 캡처만 필수, 판정은 위계·정렬·일관성·가독성 |
| B-DOC-01 | ADR-003 | `CLAUDE.md` 규칙 3 문구("레이아웃·간격·타이포·색을 충실히 옮긴다")를 ADR-003 기준으로 교체 | 보호 파일이라 영환님 승인 후 수정 (2026-09-25 승인 창 만료로 미반영) · ✅ `9894207` 닫힘(CLAUDE.md 규칙 3 ADR-003 문구 반영 — 현행 58행) |
| B-M2B-01 | SPEC-BOUND MQ-B4 | `footer/biz-extended-map` 이미지 슬롯 도움말 — 지도 캡처를 올릴 때 권리 안내 한 줄 | 편집기 레인(M2b 뒤) · ✅ M2C-3 `da802bb` 닫힘(ImageSlotField 지도 권리 안내 · ImageSlotPanel.test 단언) |
| B-M2B-02 | SPEC-BODY MQ-B1 | `services/list` `items` 필드 도움말 "가운뎃점(·)으로 나눕니다" | 편집기 레인(M2b 뒤) · ✅ COPY-HELP `bb58eaa` 닫힘(FieldEditor `hint` → aria-describedby · EditFields.test 단언) |
| B-M2B-03 | SPEC-BODY MQ-B4 | 예약 섹션 사이트 주인용 안내 `Callout` — K2 문구의 "문의"를 "예약"으로 | 편집기 레인(M2b 뒤) · ✅ COPY-HELP `98a8d2e` 닫힘(ContactOwnerNote booking 문구 분기 · ContactOwnerNote.test form/booking 단언) |
| B-M2B-04 | M2B-4a Codex P2-b | 폴백 섹션 표식(`FallbackCanvas`)이 사이트 굵기 대응 밖 700·600 글꼴 파일을 요청(`kit/siteFonts.ts:27`) — 편집 캔버스 한정, 내보내기는 미렌더 차단으로 영향 없음 | M2B-6 또는 폴백 정리 별건 — **닫힘 2026-10-10 FALLBACK-FONT**(폴백 굵기 = `--site-weight-*`, `render.css` · `FallbackCanvas.tsx`) |
| B-M2B-05 | MQ-M2B5-2 C | 3안 제목 비율 축(`axes.typeScale`)을 편집 문서·킷 토큰까지 전달 — 엔진 계약·저장 검증·내보내기 변경이라 별도 승인 필요 | M2b 뒤 별건 |
| B-M2B-06 | ✅ M2C-SPECFIX 정정(SPEC-COMPARE3 r3, 구현 0) | M2B-6 QA 사양 결정 | 3안 비교 대화상자 키보드 순서 — 스크롤 영역(tabIndex 0)이 "이 안 선택"보다 먼저(WCAG 2.1.1 키보드 스크롤). QA 권고: SPEC-COMPARE3 2.1·4절을 실제 순서로 정정 | Designer 문서 정정 |
| B-M2B-07 | ✅ 결정·구현(M2C-TODO T-1) → QA 기준선 재생성 | M2B-6 QA 사양 결정(P3) | 비활성 예약 폼이 사양(QB-11 흐리지 않음)대로 활성처럼 보임 — 안내 문구 외 시각 단서 추가 여부 | Designer 판단 |
| B-M2B-08 | ✅ 원기록 작성(m2a r3 5절) | M2B-6 QA 루브릭 | m2a K1 7변형(about/story·contact/form·faq/accordion·footer/biz-extended·header/sticky-right-cta·hero/fullbleed-left·services/cards-3) TR-POL-04 루브릭 원기록 보강 | Designer 문서 |
| B-M2B-09 | M2B-6 QA 미검증 | QB-13·14(BOUND), BODY QB-14·15, MF-AC-B1·B2·B5·B7·B9, CMP QB3~6·B5·B6, 실제 로컬 이미지 갤러리, Safari·Firefox — Ego Lite 렌더 정지 환경 한계. 포그라운드 Chrome 등 실측 환경에서 재검 | QA 재검 |
| B-M2C-01 | M2C-4 Codex r1·r2 | 렌더 직렬화 메시지 상한 `HTML_MAX` 8,000,000자(`render/htmlMessage.ts`) < 이미지 보관 한도 30MB — 큰 이미지 문서의 정적 HTML이 html 메시지 폐기 → 시간 초과로 실패 가능. 상한·전송 방식·사전 크기 안내 결정 | 렌더 쪽 레인 또는 M4 zip |
| B-M2C-02 | ✅ M2C-P3 수정(merge) | M2C-5 QA D-1(P3) | IMG-AC-29 — `check-bundle-size` /studio 조작 뒤 목록에 ImageSlotPanel·ingest·imageStore·exportImages 미표시(판정 영향 없음). afterAction 키 추가만 | Developer(scripts 추가만) |
| B-M2C-03 | ✅ QB-10 전제 정정(m2c r3)·MQ-S1 ★A → QA T-5 | M2C-5 QA D-2(P3·사양) | QB-10 잃은 이미지 경로가 제품 흐름으로 도달 불가 — 새로고침 시 프로젝트 자체가 사라짐(서버 0). SPEC 9절 QB-10 전제 정정 또는 보관 방식(MQ-C2 B) 재론 | Designer 문서 · ⏳ ADR-007 채택(로컬 IndexedDB 영속) — P1 레인으로 해소 예정 |
| B-M2C-04 | ✅ M2C-P3 수정(merge) | M2C-5 QA D-3(P3) | 1280→1024 폭 변경 시 열어 둔 "이미지 편집" 펼침이 닫힘(작업 위치 유실) | Developer |
| B-M2C-05 | ✅ M2C-P3 수정(merge) | M2C-5 QA D-4(P3) | 스위치 도움말 "끄면 … 색 면으로" ≠ SPEC r2 4절 "꺼짐 = 미디어 없음·섹션 배경" — 문구 정정 | Developer 문구 |
| B-M2C-06 | ✅ M2C-P3 수정(merge) | M2C-5b QA E-1(P3·접근성) | "이미지 지우기" 실행 시 버튼이 사라지며 포커스가 BODY로 유실(키보드 Enter 포함) — 지운 뒤 "이미지 고르기" 등으로 포커스 이동 | Developer |
| B-M2C-07 | ✅ M2C-P3 수정(merge) | M2C-5b QA E-2(P3) | 지운 뒤에도 role=status가 "이미지를 넣었습니다…"로 남음 — 지움 결과 알림 | Developer |
| B-M2C-08 | ✅ 결정·구현(M2C-TODO T-2) | M2C-5b QA O-2(사양) | 지운 뒤 대체텍스트 입력값 유지(다음 이미지에 재사용) — 유지/초기화 결정 | Designer 판단 |
| B-TEST-01 | M2C-TODO Jarvis 검증 | `pages/ProjectsPage.test.tsx` J-S07 "저장 뒤 맨 위 줄 '이름 바꾸기' 포커스"가 부하(load 32) 중 1/3회 toHaveFocus 실패(161ms, 단독·재실행 통과) — 포커스 이동 시점 비결정. 대기 방식 안정화 | Developer(테스트) · ER-3a 검증: `pages/ProfileCompare.test.tsx` CMP-AC-U1 부하(82) 2회 연속 실패 → 단독·전체 재실행 통과 · **ER-4b 검증에서 3번째 재발 → 우선순위 상향** · ✅ **QFIX 닫힘**(`241aafb` 대기 지점 안정화, 부하 5/5 실패→5/5 통과, Jarvis ×3 PASS) |
| B-M2C-09 | 🔶 ER-1 부분 닫힘 | 남은 것: ① QB-10 잃은 이미지 정적 HTML·PNG 개수 문구 ② ⑩ 나머지 변형·태블릿/모바일 폭 ③ 캔버스 픽셀 대조(교차 출처 iframe 환경 한계). 해소: 경로 A(ref-e·밝은 카드 + 페이지 정보) 게이트 통과 실측, 정적 HTML 성공·PNG↔정적 HTML 47px/4.2M(1280) | QA ER-5(경로 A로 재개, build+preview) · ER-5: ①잃은 이미지 처리·내보내기 성공 확인, 결과 줄 개수 문구만 미확인 · **QFIX-QA: ① 개수 문구 PASS(QB-R2·R5) → ① 닫힘**, ②·③ 남음 · QA-REOPEN: ② 768·390 PNG↔정적 HTML 높이 차 0/1px PASS → ② 닫힘, ③만 남음 |
| B-ER-01 | EDITOR-REST-0 | 프로필 화면 "새로 시작"(EQ-2 A) UI 미구현 — 기존 문서를 대비 통과 버전으로 옮기는 다른 길 | Designer·Developer · ✅ SPEC r1 `docs/design/restart/` (MQ-S1·S3·S4·S5 A · **MQ-S2 예산 결정 대기**) |
| B-ER-02 | EDITOR-REST-0 | `resolveConflict` 메모리 저장소 missing(memoryProjectRepository.ts:101-103) — 충돌 화면 도달·동작 불가. ER-3a에서 스냅샷과 함께 처리 여부 확인 | Developer(ER-3a) · ✅ ER-3a `7887bf1` 닫힘(memoryProjectRepository resolveConflict · 테스트 동봉) |
| B-ER-03 | ER-1 QA 관찰 | 프로필 화면 문구 "편집기는 다음 단계(2a-05)에서 연결됩니다 … 자리표시 화면으로 이동"이 실제 동작(편집기 열림)과 불일치 — 문구 정정 | Developer 문구 · ✅ QFIX `0415e74` 닫힘 |
| B-ER-04 | ER-2F Codex F r2 P2 | 테마 변경 알림 줄 "되돌리기"를 키보드로 실행하면 `undoLast()` 뒤 버튼이 사라져 포커스가 body로 떨어짐(StudioLayout.tsx 187행 근처) — 유지되는 컨트롤(테마 영역 "테마 바꾸기")로 복구 | Developer ER-4(실행 취소) · ✅ ER-4 `e2301c4`·`70bae59` 닫힘(ThemeSwap.test 1280·390) |
| B-ER-05 | ER-3b Codex r4 P2 | 미리보기 중 편집 경계가 거절해도 `useSectionOps.run`이 docRef·실행 취소 스택·last를 이미 바꿈(StudioLayout.tsx:95) → `edit` false를 run 실패로 처리 | Developer ER-4 · ✅ ER-4 `05bded2` 닫힘(opAfter 거절 = 실패 · useSectionOps.pin.test) |
| B-ER-06 | ER-3b Codex r4 P2 | 내보내기 진행 중 이미지 교체·삭제 시 "내보내기 전" 스냅샷 Blob이 보관 맵에서 prune될 수 있음(StudioLayout.tsx:371-373) → 스냅샷 생성 응답 시점에 참조 집합 갱신 | Developer ER-4 · ✅ ER-4 `f7bea33` 닫힘(exportFlow 응답 시점 참조 갱신 · exportFlow.test) |
| B-ER-07 | ER-3b Ego Lite | 변환 중 미리보기 차단 실브라우저 재현 실패(변환이 먼저 끝남)·CDP 캡처 타임아웃 → CPU 스로틀로 재확인·캡처 | QA ER-5 · ER-5 미재현(수단 미기록) → ER-5b · QFIX-QA 시도 무효(12MP 10.5MB가 TOO_LARGE 거절) → 10MB 미만 고화소 + 스로틀 ≥6으로 재시도 · ✅ QA-REOPEN 닫힘(35MP 4.88MB + 스로틀, 미리보기 진입 시 차단 문장 확인 — 1회, 스로틀 수치 기록 불명확) |
| B-ER-08 | ER-4 Jarvis 판정 | U3 필드 편집 묶음(MQ-R5 ★A) 미이행 — 필드 기록이 삭제 전 문서까지 닿으면 `StudioLayoutImages.test.tsx` "삭제 → 필드 입력 → 되돌리기 무효화 → 이미지 빠짐" 단언과 충돌 → SPEC 결정 먼저(Designer) + 예산 | Designer → Developer · ✅ SPEC 결정 `docs/design/field-undo/` (MQ-F0~F4 ★A) → Developer FIELD-UNDO-1·2 · 🔶 FIELD-UNDO-1 `179d519` 병합(필드 묶음 · FU-AC-1~12·14~16 · QB-1·2 PASS) — 남은 것: FIELD-UNDO-2(FU-AC-13 이미지 패널) · FU-QB-3 실제 한글 IME 수동 1회 · Codex r2 P2-1(청크 로딩 전 blur, 진입 +0.03~0.05 필요 — 예산 결정) · 🔶 FIELD-UNDO-2 `k002bill2/field-undo-2`(미병합): FU-AC-13 통과(클릭 1건 · 대체텍스트 묶음 · 거절 0) · Codex r1 P2 1 반영 · r2 0 · Ego 1280 PASS — 진입 +11B gzip(정규화 · 실측 129.57 = 멈춤선) 영환님 승인 필요(`dev/active/field-undo-2/REPORT.md`) · 🔶 Codex r2 P2-1 FU-BLUR `k002bill2/fu-blur`(미병합): 청크 로딩 중 blur → 같은 칸 재입력 = 기록 2건(RED→GREEN) · 리스너 누적 0 · Codex r1 P2 1 반영 · r2 0 — `/studio` +0.06(129.63) · 복원 +0.07(132.67): 몫 +0.05 초과(판정선 안) 영환님 결정 필요 (`dev/active/fu-blur/REPORT.md`) |
| B-ER-09 | ER-4b | U4 "더보기" 메뉴(실행 취소·다시 실행 항목 · <1280 "스냅샷" 이동) 미구현 — /studio 128.56 > 시도 조건 128.55. "스냅샷" 버튼은 모든 폭 툴바(SPEC 차이 유지) | Developer(예산 확보 후) · ✅ ER-9 `9b1e001` 더보기 실행 취소·다시 실행 닫힘(개정 8 배분 ② +0.33) — <1280 "스냅샷" 이동만 열림(여유 0.11) |
| B-ER-10 | ER-5b QA P3 후보 | 스냅샷 대화상자를 Esc로 닫으면 포커스가 BODY(1024·1280, 재현 1회) — 테마 대화상자는 "테마 바꾸기"로 복귀. 닫힌 뒤 "스냅샷" 버튼으로 복귀 | Developer · ✅ QFIX `0415e74` 닫힘 |
| B-ER-11 | ER-5b QA 관찰 P3 | 390에서 테마 적용 직후 알림 줄 "되돌리기"가 뷰포트 위(y=-337)라 안 보임(status라 보조기기는 읽음) — 알림 위치/스크롤 | Designer → Developer · ✅ QFIX `0415e74` 수정(단위) — 390 실화면 미확인 · ❌ QA-REOPEN 390 실화면 FAIL 재현 3/3(y=-246) — StructureCanvas 선택 상자 scrollIntoView가 알림 줄 scrollIntoView를 덮어씀(추정) → Developer 수정 · ✅ FIX-BER11 `aea8349`·`0777ceb` 원인 확정(테마 적용 → 재측정으로 selectedRect 정체성만 바뀌어 선택 상자 재스크롤) · 선택이 바뀐 뒤 첫 사각형에만 스크롤(Codex R2 지적 0) · Red-Green 3폭 · Ego preview 390 "되돌리기" top 176/52/52(vh 844) 화면 안 3/3 |
| B-QA-01 | ER-5·5b QA 운영 | QA 문서 생성 경로만 ~10턴 — QA 레인 턴 예산 항목당 15턴+. Ego Lite 캡처: 창 minimized면 `Browser.setWindowBounds normal`, 스크롤된 fixed dialog는 `captureBeyondViewport:false`+뷰포트 clip(`er-5b-qa/lib.mjs shotV`) | Jarvis 브리프 |
| B-M3P-01 | M3P-4 QA QB-01 | 썸네일 21장 hero h1이 모두 "일상에 꼭 맞는 서비스를 만듭니다"(21/21, 고유 1종), h2도 3종 조합뿐 — 모양·색은 구분되나 문구로 업종·레퍼런스 구분 0. 업종·레퍼런스별 hero·섹션 문구 주입(썸네일·생성 문서 공통, 빌드 시라 `/catalog` 예산 영향 0 예상) | Developer · M3′ 목적 직결 · ✅ M3P-5 `e62a48f` 닫힘(h1 고유 21/21) |
| B-M3P-02 | M3P-4 QA QB-02 | 상세 섹션 계획·와이어 ↔ 렌더 불일치: gen-beauty-1 About "team-grid-3"(상세) vs 실렌더 "이야기+이미지" · 상세 섹션 7개(Footer 없음) vs 보드·편집기 8개 | Developer · M3′ 목적 직결 · ✅ M3P-5 `e62a48f` 닫힘(생성 15, 상세 = 렌더 1:1·8섹션) — 큐레이션 6은 B-M3P-05 |
| B-M3P-03 | M3P-4 QA QB-05 경미 | 상세 화면에 "생성 조합" 표식 없음(buildNote 문장만) · 라이선스/생성 조합 Tag가 썸네일 header 내비·CTA를 덮음 | Designer → Developer · ✅ SPEC 결정 `docs/design/gen-mark/` (MQ-GM-1~4 ★A) → ✅ 구현 GEN-MARK-IMPL (`dev/active/gen-mark-impl/REPORT.md`, 병합 대기) |
| B-M3P-04 | M3P-4 QA AC-B5 관찰 | 필터 토글 재마운트 때 썸네일 재요청(74건=21×재마운트, 260KB) — vite preview 캐시 헤더 영향 추정, 운영 서버 캐시 정책(`?v=` 고정 → immutable)에서 확인 | 배포 시 |
| B-M3P-05 | M3P-5 기록 | 큐레이션 6개 상세 변형 이름이 렌더와 다름(ref-a About split→story 등)·ref-a Footer 없음·ref-c~f 섹션 자유 표기 — 맞추려면 큐레이션 픽스처 수정 승인 필요. 상세 와이어(`ReferencePreview`)는 전 레퍼런스 공통(MQ-M3P-6 A) | 영환님 승인 → Developer · ✅ M3P-7 `cb7527c` 닫힘(큐레이션 6 상세 = 렌더 1:1, G5 해시 갱신) |
| B-M3P-06 | M3P-5 기록 | 편집기 새 문서는 여전히 `sampleCopy` 공통 문구 — 업종 문구 주입은 `/studio` 예산(여유 0.03) 재조정 선행 | 예산 결정 → Developer · ✅ M3P-6 `f1a2391` 닫힘(개정 8 배분 ① +0.04) |
| B-M3P-07 | M3P-6 기록 | 3안 미리보기(`comparePreviews`·CompareDialog)는 SAMPLE_COPY 문구 — 편집 시작 뒤 업종 문구와 다름, 안내문 "편집 시작이 이 문서로 시작합니다"와 엄밀히 어긋남. 미리보기에도 `industryCopy` 적용(/profile 조작 뒤 청크, 판정 밖) 또는 안내문 수정 | Developer · ✅ M3P-7 `173eacd` 닫힘(미리보기 hero = 편집기 hero) |
| B-M3P-08 | ER-9 Jarvis 관찰 | 큐레이션 "동네 치과" 편집 문서에 About 섹션 2개(둘 다 "이야기 + 이미지" story) — `ENGINE_VARIANT_MAP`이 서로 다른 구조안 변형을 같은 엔진 변형으로 접는 것으로 추정(M3P-5 원인과 같은 계열). B-M3P-05와 함께 확인 | Developer · ✅ M3P-7 `cb7527c` 닫힘(데이터 중복 3건 삭제·21개 전수 가드) |
| B-GM-01 | GEN-MARK-SPEC MQ-GM-4 A | 비교 보드 `ColumnHeader`(components/compare/ColumnHeader.tsx:63-66)에 "생성 조합" 표식 없음 — 열 머리 폭 제약으로 별도 설계 | Designer → Developer |
| B-GM-02 | GEN-MARK-SPEC REPORT 6절 | 상세 메타 줄 `buildNote`에 내부 버전 문자열 "internal-compose-1" 노출(domain/internalCompose.ts:189) | Designer 문구 → Developer(G5 해시 영향 확인) |
| B-GM-03 | GEN-MARK-SPEC REPORT 6절 | 라이선스 Tag 영문 원값(`internal`/`licensed`) 그대로 노출 — 한국어 표기 검토 | Designer |
| B-RS-01 | RESTART-SPEC MQ-S5 (Codex r1 P1) | **편집기 이탈 저장 미보장** — 이탈 시 `retry()`만 부르고 완료를 기다리지 않음(StudioLayout.tsx:127-134 · useAutosaveScheduler.ts:100-102,274-278) → 저장 중 추가 편집이 이탈 때 버려질 수 있음. 이탈 전 `flushed()` 확인·실패 시 이동 보류 | Developer(`/studio` 진입 예산 영향 — 예산 결정 선행) |
| B-RS-02 | RESTART-SPEC MQ-S2 C | 잠금 없는 탭의 `startDoc`(create)이 메모리 commit 뒤 IDB flush INFRA → 탭 메모리·IDB 갈라짐(memoryProjectRepository.ts:65-66 · localSync.ts:187-190) | Developer(MQ-S2 결정과 함께) |
