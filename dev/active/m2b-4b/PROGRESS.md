# M2B-4b PROGRESS — 모션 프리셋 L0~L2 · reduced-motion

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-4b` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-4b/BRIEF.md` · 정본 `docs/design/m2b/SPEC-MOTION-FONT.md` 0·1·3.1·4(모션 MF-AC)·5절 R-4 · `MQ-M2B3.md` 1·5 ★A. 폰트 동작 불변(4a 완료)
- 시작 SHA `8236a2c` (브랜치 `k002bill2/m2b-4b`) · baseline 전체 suite 208 files · 1827 passed · exit 0(logs/baseline-full-vitest.txt)

## 체크리스트
- [x] P0 npm ci exit 0 · lock 불변(logs/p0-npm-ci.txt: `lock diff exit=0`) · baseline 전체 suite 208·1827·exit 0 · 바이트(logs/p0-baseline-bytes-B.txt): 렌더 JS 82,871 · CSS 8,034 · /studio 첫 91,784 · 진입 127,330 · /compare 진입 121,695 B · 골격 커밋
- [x] E0-1 R-4 실측(logs/e0-r4.txt, Ego Lite Chrome 152): 지원 = 열림 직후 opacity 0·translateY(-8px) → 400ms 뒤 1·none · 미지원 대용(알 수 없는 at-rule로 블록 무시) = 처음부터 최종 · reduce·print = 처음부터 최종. Safari·Firefox 실측 환경 없음(한계)
- [x] E0-2 시제품(hero/fullbleed-left + 토큰·keyframes·시트) CSS 8,034 → 8,391(+357 B) · JS +0 · 빌드 산출 원형 유지 → 외삽 +0.9~1.2KB, SPEC 1.7 이내·멈춤 아님(logs/e0-budget.txt)
- [x] P1 `kit/motion.css`(토큰 9·keyframes 4·시트·L1 묶음·L2 rise/순차/확대/강조선) · render.css import(kit.css 뒤) · RED 5 failed(logs/p1-red.txt, motion.css·import 없이) = 예측 +5 → GREEN 10 · gate OK(logs/p1-gate.txt) · 바이트 logs/p1-bytes.txt
- [x] P2 `render/sectionMotion.ts`(firstScreenIds·motionOf) → PageDocument root `data-motion` · KitRootProps 선택 속성(킷 30개 수정 0) · RED 5 failed(logs/p2-red.txt) = 예측 → GREEN 5 · gate OK 표적 render·kit·studio 395(logs/p2-gate.txt) · 바이트(logs/p2-bytes.txt, 축약 뒤 재빌드): 렌더 JS 83,029(+158 — SPEC 1.7 추정 0~150 대비 +8 B 초과, 멈춤선 89,700 여유 6.6KB) · CSS 8,753 · /studio 첫 ±0 · 진입 127,340(+10) · /compare 진입 121,722(+27, 앱 코드 변경 0 — 청크 해시 변화) · 테스트 파일은 .tsx(예측 표기 .ts → JSX 도우미 사용)
  - 첫 화면 경계 규칙: main 문서 순서 첫 hero + 뒤 2자리 · hero 없음 = main 첫 2자리 · hero 앞 본문 = 0 · faq·contact·폴백 = 자리 차지·속성 0 · header = 위치 무관 min(motion,L1)
- [x] P3 정적 HTML KEPT_DATA +data-motion·data-motion-play · clean 뒤 안쪽 play 제거·사이트 루트에만 부착 · STATIC_MENU_SCRIPT 변경 0(diff 0줄) · PNG buildCaptureSvg play 제거 + style 끝 방어 규칙 · RED 3 failed(logs/p3-red.txt) = 예측 → GREEN · gate OK 표적 398(logs/p3-gate.txt) · 바이트 logs/p3-bytes.txt(렌더 JS 83,029 · CSS 8,753 · /studio 첫 91,775(−9) · 진입 127,336(+6) · /compare 진입 121,724(+29))
  - 이관(전→후): ① `staticMarkup.test.ts` data-* 허용 목록 5개 → +data-motion·data-motion-play 7개(SPEC C-2) ② `pngCapture.test.ts` style 텍스트 `toBe(CSS)` → `toBe(CSS + "\\n" + 방어 규칙)` 정확 일치 유지(SPEC 1.3·U5) — 약화 0
- [x] P4 브라우저(ego-browser TaskSpace 66 · 4337 dev·4339 preview · `qb-motion.mjs` → logs/qb-motion.txt·json)
  - B1 캔버스(render.html 1280, hero split L2): 첫 그리기·슬롯 편집 직후 모두 애니메이션 0 · 최종 아닌 요소 0 · data-motion header L1·hero/about/services L2 · data-motion-play 0
  - B2 PNG L2 vs L0 픽셀 차이 0 · 높이 같음 — hero fullbleed-left·split·grid × 1280·768·390(9조합) · style 끝 방어 규칙. (`play:true` 표기는 CSS 선택자 문자열까지 센 측정 오류 — 루트 속성 제거는 단위 테스트 U5가 근거)
  - B3 정적 HTML(1280): 모션 = 로드 시 첫 화면 3섹션만 애니메이션 7개(maxEnd 720ms) → 1.0초 시점 애니메이션 0·최종 아닌 요소 0 · reduce·print = 로드 시점부터 애니메이션 0·최종 · L1 = 페이드 3개(420ms) · L0 = 0
  - B4 hero 6변형 × 3폭(18조합): 재생 중 30ms 표본·재생 후 가로 넘침 −15(=스크롤바, 넘침 0) · 확대 대상의 칸 = overflow clip/hidden(fullbleed·image 섹션, split figure, grid 타일 묶음) · 아래 변 고정(bottom 0 또는 음수)
  - B5 200%(390): rise 출발 이동 12px → 24px(rem 비례) · 재생 중 넘침 0 · 시트(logs/qb-sheet.txt): 0.2초 열림(opacity 0→1·−8px/200% −16px→none) · reduce 즉시 · 메뉴 4/4 보임 · Esc 닫힘
  - 환경 한계: Ego Lite 창에서 로드 애니메이션이 한 번 돈 문서는 이후 전환이 pending에 정지(2줄 최소 문서로 재현, logs/qb-stall-repro.txt) → 시트 측정은 header만 data-motion 남긴 사본으로 대체
  - 계산 스타일 동등성(렌더 문서 vs 정적 HTML 1.2초 뒤, 106/106 요소): opacity·transform·fontFamily·fontSize·color·display 불일치 0 · 예상된 차이만 = hero overflow visible→clip 1 · 확대 대상 transform-origin 1 · animation-name 6(재생 조건 안 규칙 — 최종 값 동일)
  - 서버: 자기 PID cwd 확인 뒤 종료 · LISTEN 0 · 5480 무접촉(logs/qb-servers-stop.txt)
- [x] P5 전체 vitest 1회 210 files·1840 passed·exit 0(logs/final-full-vitest.txt, 예측 일치) · Codex R1 P2 1건 → 수정 레인 → R2 결함 0 · REPORT 마감

## 새 테스트 delta 사전 예측 (각 단계 RED 전 기록 · 기준 208 files · 1827)
- P1 motion.css·가드: 새 파일 `kit/motion.test.ts` it 4(U2 ① 모든 내용이 media 블록 1개 안 · animation/transition 규칙마다 `[data-site-root][data-motion-play] … [data-kit][data-motion` ② 반복 1·infinite 0·animation-timeline 0·전환 속성 = opacity·transform·overlay/display(allow-discrete)·keyframes = opacity·transform만·translateX 0 · ③ U3 토큰 9개 = SPEC 1.2 값·3×stagger+zoom ≤ 1초·각 dur ≤ 720ms ④ render.css 가 kit.css 뒤에 motion.css import) + `test/kitGuard.test.ts` +1(G1 탐지기: 모션 예외는 kit/motion.css 경로 하나만 — 다른 킷 파일 animation 은 계속 위반) = **+5 → 209 files · 1832**. 기존 kitGuard "모션 0" it 는 motion.css 에 대해서만 모션 규칙 제외(이관)
- P2 렌더 data-motion: 새 파일 `render/sectionMotion.test.ts` it 5(U1 ① L2 문서: header L1·hero L2·hero 뒤 본문 2개 = min(motion,maxMotion)·3번째 이후 0·footer 0·사이트 루트 data-motion-play 0 ② faq·contact 가 첫 화면 자리 = 속성 0·자리는 차지 ③ L0 프리셋 = 속성 0 · L1 = header·hero·본문 2개 L1 ④ 경계: hero 없음 = main 첫 본문 2개 · hero 앞 본문 = 0 · 폴백(킷 없음) 섹션 = 속성 0·자리 차지 ⑤ maxMotion 상한(about/text L2 → L1)) = **+5 → 210 files · 1837**
- P3 정적 HTML·PNG: `staticMarkup.test.ts` +2(U4 사이트 루트 data-motion-play 1·data-motion 남음·스크립트 = STATIC_MENU_SCRIPT 1개 바이트 동일 · data-motion-play 는 사이트 루트에만) + `pngCapture.test.ts` +1(U5 캡처 SVG style 끝 = 방어 규칙 · data-motion-play 0) = **+3 → 210 files · 1840**. 이관: `staticMarkup.test.ts:36·46` data-* 허용 목록에 data-motion·data-motion-play 추가(SPEC C-2)

## 수정 레인 — Codex R1 P2(hero/grid 타일 A 확대가 타일 간격으로 돌출)
- 판단: 70턴 이후 범위 확장 금지 → 킷 마크업(클리핑 래퍼) 추가 대신 타일 A 확대 제외 + `.kit-hx-tiles` clip 제거(필요 없어짐). SPEC 1.4 grid L2 "타일 A 안쪽 확대" 미구현 = 편차 기록
- **새 테스트 사전 예측**: `kit/motion.test.ts` 기존 U2 it 에 단언 1줄(kit-zoom 대상 = 자기 칸이 있는 요소만 — `.kit-hx-tile--a` 0) → it 수 변화 0 · **210 files · 1840** · RED 1 failed 예상
- [x] F1 예측 커밋 · F2 RED 1 failed(logs/fix-r1-red.txt) = 예측 · F3 수정 62de09f · gate OK(logs/fix-r1-gate.txt) · 전체 210·1840·exit 0(logs/fix-r1-full-vitest.txt) · F4 Codex R2 결함 0(logs/codex-review-r2.txt)
