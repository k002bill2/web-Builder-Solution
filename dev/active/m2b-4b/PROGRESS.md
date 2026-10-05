# M2B-4b PROGRESS — 모션 프리셋 L0~L2 · reduced-motion

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-4b` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-4b/BRIEF.md` · 정본 `docs/design/m2b/SPEC-MOTION-FONT.md` 0·1·3.1·4(모션 MF-AC)·5절 R-4 · `MQ-M2B3.md` 1·5 ★A. 폰트 동작 불변(4a 완료)
- 시작 SHA `8236a2c` (브랜치 `k002bill2/m2b-4b`) · baseline 전체 suite 208 files · 1827 passed · exit 0(logs/baseline-full-vitest.txt)

## 체크리스트
- [x] P0 npm ci exit 0 · lock 불변(logs/p0-npm-ci.txt: `lock diff exit=0`) · baseline 전체 suite 208·1827·exit 0 · 바이트(logs/p0-baseline-bytes-B.txt): 렌더 JS 82,871 · CSS 8,034 · /studio 첫 91,784 · 진입 127,330 · /compare 진입 121,695 B · 골격 커밋
- [ ] E0-1 R-4 `@starting-style`·allow-discrete 현재 Chromium 지원/미지원(미지원 시 최종 상태 열림) 실측
- [ ] E0-2 모션 CSS 시제품(hero 1변형) 렌더 CSS/JS 증가 실측 → 30변형 외삽 · 멈춤선(JS 89.70 · CSS 30)·SPEC 1.7 추정(+1.2~2.0KB) 대비 판정
- [ ] P1 `kit/motion.css` 토큰·선택자 계약 · 가드 U2·U3·G1
- [ ] P2 렌더 `data-motion`(U1)
- [ ] P3 정적 HTML `data-motion-play`·KEPT_DATA·스크립트 바이트 동일(U4) · PNG 방어 규칙(U5)
- [ ] P4 브라우저 B1~B5 3폭·reduced-motion·200%·인쇄 · 계산 스타일 동등성
- [ ] P5 전체 vitest exit 0 · Codex branch review base 8236a2c · REPORT

## 새 테스트 delta 사전 예측 (각 단계 RED 전 기록 · 기준 208 files · 1827)
