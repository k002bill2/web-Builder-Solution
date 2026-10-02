# M2A-0 PROGRESS — VS-1 섹션 킷 명세 (Designer)

## 수신 기록
- 2026-10-03 수신: `docs/06-handoff/M2A-0_KIT-SPEC_DESIGNER_BRIEF.md` 전체 읽음 (67행). 브랜치 `k002bill2/m2a-0`, 시작 커밋 72fe57f.
- 쓰기 경로: `docs/design/m2a/`(SPEC.md·shots/·logs/) · `dev/active/m2a-0/`. app/·design/·다른 docs 수정 금지. 서브에이전트 금지. 로컬 커밋 `git commit -- <경로>`만.
- 규칙: hex·px 0(역할·단계) · 킷 상호작용 네이티브 HTML만 · 포트 4339 · 65턴부터 REPORT 우선.

## 체크리스트
- [x] 브리프 수신 기록
- [x] 근거 읽기 (REF-LLM D4·D6 · fable A-1·A-4 · opus B-1-9·B-3·D-2 · SPEC r4.8 5.7·5.13·8.3.2 · ADR-004 r2 · TRD 8절·4.4 · 데이터 계약)
- [x] K1-1 header/sticky-right-cta
- [x] K1-2 hero/fullbleed-left
- [x] K1-3 about/story
- [ ] K1-4 services/cards-3
- [ ] K1-5 faq/accordion
- [ ] K1-6 contact/form
- [ ] K1-7 footer/biz-extended
- [ ] K2 contact/form 정적 동작 권장안
- [ ] K3 폴백 표식·차단 문구·PNG 버튼·캔버스 캡션
- [ ] K4 K-AC·시각 QA 기준
- [ ] 대비 계산 근거 (L2)
- [ ] Codex 적대적 검토 1회 (logs/)
- [ ] REPORT.md

## 진행 기록
- SPEC r0: 골격 + 0절 공통 규약(킷 토큰 입력 · 색 허용 조합 = 게이트 C-1~C-5만 · 글자/간격/radius 단계 · 폭 `md`/`lg` · 넘침·빈 슬롯·이미지·링크·상호작용 공통). advisor 검토 반영(on-primary 고정 흰색 · alt 톤 = surface 조합 표 · 표식 고정색 · nav 이중 목록).
- K1-1 header/sticky-right-cta: popover 시트 + 메뉴 두 벌(폭마다 1벌 노출) · CTA = primary/on-primary(C-1) · 시트 링크 닫기용 공용 스크립트 1조작.
- K1-2 hero/fullbleed-left: 글자는 단색 primary 패널 위(C-1) · 미디어 층 분리 · vh 단위 금지(전체 길이 캡처) · 390 두 단 쌓기. 0.11 공용 스크립트 1조작 · 0.12 문서 뼈대(main) 보강.
- K1-3 about/story: 2단(글·이미지) → 390 1단 · 본문 ink(톤 두 가지 C-2/C-4) · 이미지 비율 = 프로필 media_ratio(없으면 4:5).
