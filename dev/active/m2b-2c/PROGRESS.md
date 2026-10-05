# M2B-2c PROGRESS — 후기·가격·예약·CTA 4변형 (testimonials/quotes-2 · pricing/tiers-2 · contact/booking · cta-band/banner)

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-2c` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-2c/BRIEF.md` · 정본 `docs/06-handoff/M2B-2_BODY-VARIANTS_BRIEF.md` 공통 3절 · 6절 · 7~8절 · `docs/design/m2b/SPEC-BODY.md` B1-9~12 · KD-AC-01~08(12변형 합본)·17~21 · QB-9~15
- 시작 SHA: `2369a3e` (브랜치 `k002bill2/m2b-2c`) · baseline 렌더 JS 81,671 B · CSS 7,589 B · /studio 첫 91,774 · 진입 127,435 B · 전체 suite 198 files · 1777
- 실렌더 목표 26 → 30 (= 엔진 SECTION_DEFINITIONS 30쌍)

## 체크리스트
- [x] P0 npm ci exit 0(lock 불변) · baseline gate OK(logs/baseline-gate.txt) · 전체 vitest 198 files · 1777 passed · exit 0(logs/baseline-full-vitest.txt) · 바이트 baseline(logs/p1-baseline-bytes.txt)
- [x] P0 BRIEF·PROGRESS·REPORT 골격·gate.sh 명시 경로 커밋(4f8def7)
- [x] P1 예약 공유 시제품(contact/booking + ContactForm 공유) + 부모 최종 목록(30쌍) 예산 실측 → **멈춤**: /studio 진입 +62 B > 레인 한도 30 B(압축 표현 2종 +78·+81 B, logs/p1-budget.txt) · 시제품 diff 보존 후 되돌림(재빌드 바이트 = 기준)
- [ ] P2 testimonials/quotes-2 (RED → GREEN → gate → 커밋)
  - (재개 2026-10-05) ★A 승인(APPROVAL-A.md)으로 차단 해소 — 진행 중
- [ ] P3 pricing/tiers-2
  - (재개 2026-10-05) ★A 승인(APPROVAL-A.md)으로 차단 해소 — 진행 중
- [ ] P4 contact/booking (ContactForm 공유 추출, 기존 문의 폼 회귀 보존)
  - (재개 2026-10-05) ★A 승인(APPROVAL-A.md)으로 차단 해소 — 진행 중
- [ ] P5 cta-band/banner · 최종 30쌍(registry = 부모 목록 = 엔진 SECTION_DEFINITIONS) · unknown 방어 별도 검증 · 이전 단언 이관표
  - (재개 2026-10-05) ★A 승인(APPROVAL-A.md)으로 차단 해소 — 진행 중
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
