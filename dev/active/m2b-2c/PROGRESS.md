# M2B-2c PROGRESS — 후기·가격·예약·CTA 4변형 (testimonials/quotes-2 · pricing/tiers-2 · contact/booking · cta-band/banner)

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-2c` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-2c/BRIEF.md` · 정본 `docs/06-handoff/M2B-2_BODY-VARIANTS_BRIEF.md` 공통 3절 · 6절 · 7~8절 · `docs/design/m2b/SPEC-BODY.md` B1-9~12 · KD-AC-01~08(12변형 합본)·17~21 · QB-9~15
- 시작 SHA: `2369a3e` (브랜치 `k002bill2/m2b-2c`) · baseline 렌더 JS 81,671 B · CSS 7,589 B · /studio 첫 91,774 · 진입 127,435 B · 전체 suite 198 files · 1777
- 실렌더 목표 26 → 30 (= 엔진 SECTION_DEFINITIONS 30쌍)

## 체크리스트
- [x] P0 npm ci exit 0(lock 불변) · baseline gate OK(logs/baseline-gate.txt) · 전체 vitest 198 files · 1777 passed · exit 0(logs/baseline-full-vitest.txt) · 바이트 baseline(logs/p1-baseline-bytes.txt)
- [x] P0 BRIEF·PROGRESS·REPORT 골격·gate.sh 명시 경로 커밋(4f8def7)
- [x] P1 예약 공유 시제품(contact/booking + ContactForm 공유) + 부모 최종 목록(30쌍) 예산 실측 → **멈춤**: /studio 진입 +62 B > 레인 한도 30 B(압축 표현 2종 +78·+81 B, logs/p1-budget.txt) · 시제품 diff 보존 후 되돌림(재빌드 바이트 = 기준)
- [x] P2 testimonials/quotes-2 — RED 5(logs/quotes-red.txt) → GREEN · gate OK(logs/quotes-gate.txt, 표적 6파일) · 중간 /studio 진입 127.46KB(기록만 — 판정은 P5 파생 뒤)
- [x] P3 pricing/tiers-2 — RED 5(새 4 + 이관 전제 1, logs/pricing-red.txt) → GREEN · gate OK(logs/pricing-gate.txt) · 중간 /studio 진입 127.47KB(기록만)
- [x] P4 contact/booking — RED 6(새 5 + 기존 SectionVariant it 강화 1, logs/booking-red.txt) → GREEN · gate OK(logs/booking-gate.txt) · contact/form 마크업 추출 전후 동일(logs/contact-form-markup-after.txt) · 중간 /studio 진입 127.48KB(기록만)
- [x] P5 cta-band/banner · 30쌍 엔진 파생(★A) — RED 10(새 6 + 이관 전제 4, logs/cta-red.txt) → GREEN · gate OK(logs/cta-gate.txt) · 바이트 logs/final-bytes.txt: /studio 진입 127,339 B(−96 ≤ +30 · ≤ 127,700) · 첫 91,776(+2) · 렌더 JS 82,280(+609) · CSS 7,818(+229) · 다른 화면 +2~+26 · 중간 전체 vitest 204 files · 1797 · exit 0(logs/p5-interim-vitest.txt — 마감 1회와 별개)
- [ ] P5b 12변형 합본 공통 [U]/[G] (KD-AC-01·06·07·08)
- [ ] P-B REPORT 선기록 → 12변형 합본 3폭 브라우저 KD-AC·QB-9~15 · 정적 HTML 계산 스타일 동등성 · 예약 요청 0 실측 · 서버 종료 증거
  - (재개 2026-10-05) ★A 승인(APPROVAL-A.md)으로 차단 해소 — 진행 중
- [x] P-F 전체 vitest 1회(HEAD 4f9b467) 198 files · 1777 passed · exit 0 · Errors 0(logs/full-vitest.txt) · REPORT 마감 · 서버 기동 0(logs/server-check.txt LISTEN 0)
  - Codex: (1차 실행) 제품 diff 0이라 미실행 — 재개 실행에서 P5 뒤 1회
- [ ] P-F(재개) 전체 vitest 기본 1회 exit 0 · Errors 0 · Codex branch review base 2369a3e 1회 · REPORT 마감

## 재개(★A) 사전 조사 — P0/P1 재측정 아님 · REPORT 4절 '도달성 실측'
- 4쌍을 기존 컴포넌트(AboutStory)로 임시 매핑 + 부모 목록 4문자열 → 전체 vitest: 18 failed / 1777(15 files) → 되돌림(git checkout, clean). 원문 logs/migration-inventory.txt
- 키별: quotes·pricing = memoryExport 7단계 1건(P2·P3) · booking = SectionVariant 접미어 1건(P4) · cta-band = 나머지 15건(sampleDoc s-cta 폴백 전제, P5) · PageDocument 정확 목록 1건(매 단계) · ProfileCompact DOM 순서 1건(무관 의심 — P5 때 단독 재현 확인)
- 저장 경로(saveDoc = validatePageDoc)는 `no-such-variant`를 "모르는 변형입니다"로 거부(engine/validate/validatePageDoc.ts:98) → 저장소 경로는 vi.mock(실제 목록 − 대상 키)으로 이관, 렌더 경로는 variant `no-such-variant`로 이관

## 새 테스트 delta 사전 예측 (각 단계 RED 전 기록 · 기준 198 files · 1777)
- P2 testimonials/quotes-2: 새 파일 `kit/TestimonialsQuotes2.test.tsx` it 4(구조 KD-AC-17·08 · 글자 그대로 03 · 빈 슬롯 17·04 · CSS [G]) + `data/memoryExport.test.ts` 이관 전제 it 1(mock 목록 − 2키, 실제 목록 포함) = **+5 → 199 files · 1782**. 수정만: PageDocument.test 정확 목록(27쌍) · memoryExport vi.mock(기존 단언 글자 그대로)
  - 실제: 표적 RED 5 failed → GREEN 5 passed (예측 일치)
- P3 pricing/tiers-2: 새 파일 `kit/PricingTiers2.test.tsx` it 4(구조·버튼/표식 0 KD-AC-18·08 · 글자 그대로 '문의'/'99,000' 03 · 빈 슬롯 04 · CSS [G] 가격 class 값 무관·ink·t2/t3·tabular) = **+4 → 200 files · 1786**. 수정만: memoryExport 전제(실제 목록 pricing 포함 단언 추가) · PageDocument.test 정확 목록(28쌍)
  - 실제: 표적 RED 5 failed(새 4 + 전제 1 — 전제는 pricing 미실렌더가 원인) → GREEN (예측 +4 일치)
- P4 contact/booking: 새 파일 `kit/ContactBooking.test.tsx` it 4(KD-AC-19 이름표·for/id·legend·안내 describedby·type·date/time 0·placeholder 0·action/method 0·fieldset 안 · required/선택·autocomplete · 빈 슬롯 04 · CSS 날짜·시간 묶음 [G]) + 새 파일 `components/studio/SectionVariantPreview.test.tsx` it 1(이관: 부모 목록 주입으로 '· 구조 미리보기' 접미어 경로 유지) = **+5 → 202 files · 1791**. 수정만: SectionVariant.test 기존 it(예약 폼 실렌더 → 접미어 0으로 강화) · PageDocument.test 정확 목록(29쌍) · contact/form 마크업 회귀는 임시 대조 로그(테스트 아님)
  - 실제: RED 6 failed(새 5 + 강화한 기존 it 1) → GREEN (예측 +5 일치)
- P5 cta-band/banner + 30쌍 파생: 새 파일 `kit/CtaBandBanner.test.tsx` it 4(구조·면 primary 양 톤 KD-AC-21·08 · CTA 대상 contact→booking만→footer→span · 글자/빈 슬롯 03·04 · CSS [G]) + 새 파일 `test/kitRegistryEngine.test.ts` it 2(KIT_REGISTRY = 엔진 SECTION_DEFINITIONS 정확 30·중복 0 · unknown no-such-variant 방어) = **+6 → 204 files · 1797**. 수정만: cta-band 폴백 전제 15건 이관(렌더 경로 = s-cta variant no-such-variant · UI/저장 경로 = 부모 목록 주입) · PageDocument.test 정확 목록(30쌍) · renderedVariants.ts 파생(★A)
  - 실제: RED 10 failed(새 6 + 이관 전제 4 — cta-band 미실렌더가 원인) → GREEN · 전체 204 files · 1797 (예측 일치)
- P5b 12변형 합본: 새 파일 `kit/bodyVariants2c.test.tsx` it 5(12변형 킷·폴백 0 · KD-AC-06 script 1·on* 0 · KD-AC-08 h2 1·h3 = cards-2·masonry·pricing만 · KD-AC-07 2c CSS 재배치 0 · KD-AC-01 12변형 킷 파일 훅·on* prop 0 + 2c CSS 모션·vh·hex·px 0) = **+5 → 205 files · 1802**
