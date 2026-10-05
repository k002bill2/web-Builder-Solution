# M2B-4b PROGRESS — 모션 프리셋 L0~L2 · reduced-motion

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-4b` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-4b/BRIEF.md` · 정본 `docs/design/m2b/SPEC-MOTION-FONT.md` 0·1·3.1·4(모션 MF-AC)·5절 R-4 · `MQ-M2B3.md` 1·5 ★A. 폰트 동작 불변(4a 완료)
- 시작 SHA `8236a2c` (브랜치 `k002bill2/m2b-4b`) · baseline 전체 suite 208 files · 1827 passed · exit 0(logs/baseline-full-vitest.txt)

## 체크리스트
- [x] P0 npm ci exit 0 · lock 불변(logs/p0-npm-ci.txt: `lock diff exit=0`) · baseline 전체 suite 208·1827·exit 0 · 바이트(logs/p0-baseline-bytes-B.txt): 렌더 JS 82,871 · CSS 8,034 · /studio 첫 91,784 · 진입 127,330 · /compare 진입 121,695 B · 골격 커밋
- [x] E0-1 R-4 실측(logs/e0-r4.txt, Ego Lite Chrome 152): 지원 = 열림 직후 opacity 0·translateY(-8px) → 400ms 뒤 1·none · 미지원 대용(알 수 없는 at-rule로 블록 무시) = 처음부터 최종 · reduce·print = 처음부터 최종. Safari·Firefox 실측 환경 없음(한계)
- [x] E0-2 시제품(hero/fullbleed-left + 토큰·keyframes·시트) CSS 8,034 → 8,391(+357 B) · JS +0 · 빌드 산출 원형 유지 → 외삽 +0.9~1.2KB, SPEC 1.7 이내·멈춤 아님(logs/e0-budget.txt)
- [ ] P1 `kit/motion.css` 토큰·선택자 계약 · 가드 U2·U3·G1
- [ ] P2 렌더 `data-motion`(U1)
- [ ] P3 정적 HTML `data-motion-play`·KEPT_DATA·스크립트 바이트 동일(U4) · PNG 방어 규칙(U5)
- [ ] P4 브라우저 B1~B5 3폭·reduced-motion·200%·인쇄 · 계산 스타일 동등성
- [ ] P5 전체 vitest exit 0 · Codex branch review base 8236a2c · REPORT

## 새 테스트 delta 사전 예측 (각 단계 RED 전 기록 · 기준 208 files · 1827)
- P1 motion.css·가드: 새 파일 `kit/motion.test.ts` it 4(U2 ① 모든 내용이 media 블록 1개 안 · animation/transition 규칙마다 `[data-site-root][data-motion-play] … [data-kit][data-motion` ② 반복 1·infinite 0·animation-timeline 0·전환 속성 = opacity·transform·overlay/display(allow-discrete)·keyframes = opacity·transform만·translateX 0 · ③ U3 토큰 9개 = SPEC 1.2 값·3×stagger+zoom ≤ 1초·각 dur ≤ 720ms ④ render.css 가 kit.css 뒤에 motion.css import) + `test/kitGuard.test.ts` +1(G1 탐지기: 모션 예외는 kit/motion.css 경로 하나만 — 다른 킷 파일 animation 은 계속 위반) = **+5 → 209 files · 1832**. 기존 kitGuard "모션 0" it 는 motion.css 에 대해서만 모션 규칙 제외(이관)
- P2 렌더 data-motion: 새 파일 `render/sectionMotion.test.ts` it 5(U1 ① L2 문서: header L1·hero L2·hero 뒤 본문 2개 = min(motion,maxMotion)·3번째 이후 0·footer 0·사이트 루트 data-motion-play 0 ② faq·contact 가 첫 화면 자리 = 속성 0·자리는 차지 ③ L0 프리셋 = 속성 0 · L1 = header·hero·본문 2개 L1 ④ 경계: hero 없음 = main 첫 본문 2개 · hero 앞 본문 = 0 · 폴백(킷 없음) 섹션 = 속성 0·자리 차지 ⑤ maxMotion 상한(about/text L2 → L1)) = **+5 → 210 files · 1837**
- P3 정적 HTML·PNG: `staticMarkup.test.ts` +2(U4 사이트 루트 data-motion-play 1·data-motion 남음·스크립트 = STATIC_MENU_SCRIPT 1개 바이트 동일 · data-motion-play 는 사이트 루트에만) + `pngCapture.test.ts` +1(U5 캡처 SVG style 끝 = 방어 규칙 · data-motion-play 0) = **+3 → 210 files · 1840**. 이관: `staticMarkup.test.ts:36·46` data-* 허용 목록에 data-motion·data-motion-play 추가(SPEC C-2)
