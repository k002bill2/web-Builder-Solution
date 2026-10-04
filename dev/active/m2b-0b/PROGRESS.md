# M2B-0B PROGRESS — 본문 12변형 킷 명세 (Designer)

- 수신: 2026-10-04 · 시작 커밋 `a3bd614` · 브랜치 `k002bill2/m2b-0b`
- 브리프: `docs/06-handoff/M2B-0B_KIT-SPEC-BODY_DESIGNER_BRIEF.md` · 계획 `docs/04-plan/M2B_PLAN.md`
- 영환님 결정 ★A: React zip M4 · internal 조합 생성기 M2b 뒤 (이 레인 범위 영향 없음 — 명세만)
- 쓰기 허용: `docs/design/m2b/SPEC-BODY.md` · `docs/design/m2b/body/` · `dev/active/m2b-0b/` · 포트 127.0.0.1:4341
- 손대지 않음: 0A 경로(`SPEC-BOUND.md`·`bound/`·`dev/active/m2b-0a/`·4339) · app/ · design/ · 다른 docs/
- 서브에이전트 금지(브리프) · push·병합·삭제 금지

## 체크리스트
- [ ] 0. 근거 읽기(m2a SPEC 0절·K1·K2 · 2a-05 SPEC r4.6/r4.8~13 · bodySections/registry/profile · kit/*)
- [ ] 1. SPEC-BODY 골격 + 공통(상속 선언·차이 원칙)
- [ ] 2. 변형 1~4 (about/text · services/list · services/cards-2 · services/cards-masonry) — 커밋
- [ ] 3. 변형 5~8 (portfolio/grid-3 · masonry · grid-2 · statistics/stats-3) — 커밋
- [ ] 4. 변형 9~12 (testimonials/quotes-2 · pricing/tiers-2 · contact/booking · cta-band/banner) — 커밋
- [ ] 5. C3 KD-AC 목록 · 3폭 시각 QA · 예산 추정 표 · MQ
- [ ] 6. 시안 HTML(외부 자원 0) + 4341 3폭 캡처(벽돌형 읽기 순서 확인)
- [ ] 7. 검사: hex·px 0 · APFS 0 · 외부 URL 0 · 대비 L2
- [ ] 8. Codex 적대적 검토 1회(턴 남으면) → logs/
- [ ] 9. REPORT 마감 · 서버 PID 종료 · lsof 4341 = 0
