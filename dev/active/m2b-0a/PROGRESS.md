# M2B-0A PROGRESS — 킷 명세: 바깥 11변형 + 루브릭 (Designer)

## 수신 기록
- 2026-10-04 수신. 브리프 `docs/06-handoff/M2B-0A_KIT-SPEC-BOUND_DESIGNER_BRIEF.md` 전체 · `docs/04-plan/M2B_PLAN.md` 읽음.
- 시작 커밋 `a3bd614` · 브랜치 `k002bill2/m2b-0a` · worktree `orca/workspaces/web-builder-solution/m2b-0a`.
- 결정 ★A(React zip M4 · internal 조합 생성기 M2b 뒤) — 이 레인 범위에 영향 없음(명세만).
- 근거 읽음: m2a SPEC 0절 · K1-1 · K1-2 · K1-7 · K4 · 부록 A / 2a-05 SPEC r4.12 행 / `boundSections.ts` · `sectionLibrary.ts` · `kit/{HeaderStickyRightCta,HeroFullbleedLeft,FooterBizExtended,Media,text,tokens,registry,types}` · `kit.css` 바깥 3변형 부분 / ADR-004 개정 2 / TRD TR-POL-04 / `reference.ts` 카탈로그 필드.
- 쓰기 허용: `docs/design/m2b/SPEC-BOUND.md` · `docs/design/m2b/bound/` · `dev/active/m2b-0a/`. `app/`·`design/`·그 밖 `docs/` 수정 0. 0B 경로(SPEC-BODY·body/·m2b-0b/·4341) 손대지 않음.
- 서브에이전트 금지 · 서버 127.0.0.1:4339만 · 로컬 커밋만 · push·병합·삭제 없음 · 70턴부터 REPORT 마감 우선.

## 단계
- [x] 수신 · PROGRESS · REPORT 골격 커밋
- [x] SPEC-BOUND 골격(상속 선언 · 공통 차이)
- [x] header `sticky-hamburger`
- [x] header `sticky-two-tier`
- [x] header `transparent`
- [x] hero `split` → (변형 4개) 커밋
- [x] hero `center`
- [x] hero `grid`
- [x] hero `text`
- [x] hero `image` → (변형 8개) 커밋
- [x] footer `biz-extended-map`
- [x] footer `minimal`
- [x] footer `minimal-biz` → (11개) 커밋
- [x] KB-AC 목록 · 3폭 시각 QA · 예산 추정 표 · MQ · 대비 근거
- [x] 시안 HTML + 4339 3폭 DOM 실측 (스크린샷은 captureScreenshot 시간 초과 — REPORT 6)
- [x] Codex 적대적 검토 1회 · 2건 반영(r3)
- [x] REPORT 마감 · 서버 0(lsof 4339)

## 서브에이전트
- 사용 0 (브리프 금지)
