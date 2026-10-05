# M2B-4b REPORT — 모션 프리셋 L0~L2 · reduced-motion

## 0. 메타
- 역할 Developer · Orca managed worktree `m2b-4b` · Claude Code(Opus 5.5) · 서브에이전트 0
- 브랜치 `k002bill2/m2b-4b` · base `8236a2c` · 1회 실행
- 정본 `docs/design/m2b/SPEC-MOTION-FONT.md` 0·1·3.1·4(모션 MF-AC)·5절 R-4 · `MQ-M2B3.md` 1·5 ★A
- 보호 경로 무수정: `git diff --exit-code 8236a2c -- app/package.json app/package-lock.json CLAUDE.md docs/design docs/decisions app/scripts` exit 0 · 4a 폰트 파일(`siteFontEmbed.ts`·`siteFontLoad.ts`·`kit/fonts.css`·`kit/siteFonts.ts`) diff 0 = 폰트 동작 불변
- 구현 방식: CSS만(`kit/motion.css`) · 모션 JS 0 · 스크롤 연동 0 · 반복 1 · transform·opacity만(+시트 overlay·display allow-discrete) · 가로 이동 0

## 1. E0 결과·분기
| 항목 | 결과 | 근거 |
|---|---|---|
| R-4 `@starting-style`·allow-discrete | Chrome 152(Ego Lite): 지원 — 열림 직후 opacity 0·−8px → 0.4초 뒤 1·none. 미지원 대용(알 수 없는 at-rule로 블록이 버려짐) = 처음부터 최종. reduce·print = 처음부터 최종 | logs/e0-r4.txt |
| 시제품 예산 | hero/fullbleed-left + 토큰·keyframes·시트 = CSS +357 B · JS +0 · 빌드 산출에 media·@starting-style·allow-discrete 원형 유지 → 외삽 +0.9~1.2KB(SPEC 1.7 추정 +1.2~2.0 이내) → 진행 | logs/e0-budget.txt |

## 2. 커밋표
| SHA | 내용 |
|---|---|
| d774ebb | P0 브리프·PROGRESS 골격·gate·baseline |
| b01c2ff | E0 R-4·시제품 예산 · 새 테스트 수 사전 예측(P1~P3) |
| 62ed95b | `kit/motion.css` L1·L2 계약 · 가드 U2·U3·G1 |
| 6746f37 | 렌더 `data-motion`(U1) |
| d8096de | 정적 HTML `data-motion-play`·KEPT_DATA(U4) · PNG 방어 규칙(U5) |
| 41e2c02 | 브라우저 B1~B5 원시 증거 |

## 3. MF-AC별 근거
| AC | 판정 | 근거 |
|---|---|---|
| U1 렌더 data-motion | 통과 | `render/sectionMotion.test.tsx` 5 it(RED logs/p2-red.txt) · [B] 캔버스 header L1·첫 화면 3섹션 L2·play 0 |
| U2 motion.css 계약 | 통과 | `kit/motion.test.ts` it 1·2 — media 블록 1개 · 모든 규칙 재생 조건 · 반복 1·infinite 0·timeline 0 · 전환/keyframes 속성 · translateX 0 |
| U3 토큰 합 | 통과 | `kit/motion.test.ts` it 3 — 3×80+720 = 960ms ≤ 1초 · dur ≤ 720 · 지연 = stagger 배수만 |
| U4 정적 HTML | 통과 | `staticMarkup.test.ts` +2(RED logs/p3-red.txt) · STATIC_MENU_SCRIPT diff 0줄 · [B] 정적 HTML 루트 play 1·script 1 |
| U5 PNG 방어 규칙 | 통과 | `pngCapture.test.ts` +1 · [B] PNG SVG style 끝 규칙 |
| G1 kitGuard 예외 | 통과 | `test/kitGuard.test.ts` G1 it — 예외는 `kit/motion.css` 경로 하나(이름 흉내 `sub/motion.css`·`motion.css.ts` 위반 유지) |
| B1 캔버스 최종 | 통과 | logs/qb-motion.txt "B1 캔버스" — 첫 그리기·편집 직후 애니메이션 0·최종 아닌 요소 0 |
| B2 PNG L2 = L0 | 통과 | hero 3변형 × 3폭 픽셀 차이 0·높이 같음 |
| B3 정적 HTML | 통과 | 1.0초 시점 최종(애니메이션 7개 maxEnd 720ms → 0) · reduce·print 로드부터 최종 |
| B4 넘침·확대 칸 | 통과 | hero 6변형 × 3폭 재생 중·후 넘침 0(−15 = 스크롤바) · 확대 칸 overflow clip/hidden · 아래 변 고정 |
| B5 200%·시트 | 통과(측정 대체 1건) | rise 12→24px · 넘침 0 · 시트 0.2초·reduce 즉시·메뉴 4/4·Esc(logs/qb-sheet.txt — §6 환경 한계) |
| B8 예산 | 통과 | §4 |

### 3.1 SPEC과 다르게 한 부분(사유 한 줄씩)
- 확대 칸이 없는 hero(fullbleed-left·image·grid 타일 A): 칸 = 섹션(fullbleed·image) 또는 타일 묶음(grid)에 `overflow: clip` + `transform-origin: 50% 100%`(아래 변 고정) — 마크업 변경 없이 카피 쪽 겹침 0. 이 두 속성도 재생 조건 안에만 둬서 계산 스타일 차이 2건(§3.2)이 남는다.
- 순차 지연 상한 = 2단(×0·×1·×2, 3번째 이후 ×2 공유) — SPEC 1.4 표의 "카드 1·2·3 = stagger×0·1·2"를 따름. U3는 SPEC 문구대로 3×stagger로 보수 검사.
- hero/center L2 = 제목·부제·CTA 각각 rise 순차(묶음 자체는 정지) · hero/text L2 = 카피 묶음 rise + 강조선 scaleX(1단 지연).
- 첫 화면 경계(SPEC 미정): hero 없음 = main 첫 2자리 · hero 앞 본문 = 0 · 폴백 섹션 = 자리 차지·속성 0.

### 3.2 계산 스타일 동등성(렌더 문서 vs 정적 HTML 1.2초 뒤, 106/106 요소)
opacity·transform·fontFamily·fontSize·color·display 불일치 0. 예상된 차이만: hero overflow visible→clip 1 · 확대 대상 transform-origin 1 · animation-name 6(재생 조건 안 — 최종 값 동일).

## 4. 번들 baseline / 최종 (bytes.sh, gzip B)
| 항목 | baseline(P0) | 최종(P3 빌드) | 증감 |
|---|---|---|---|
| 렌더 JS | 82,871 | 83,029 | +158(SPEC 추정 0~150 대비 +8 B · 멈춤선 89,700) |
| 렌더 CSS | 8,034 | 8,753 | +719(≤30KB, 추정 +1.2~2.0KB 아래) |
| /studio 첫 화면 | 91,784 | 91,775 | −9 |
| /studio 진입 | 127,330 | 127,336 | +6(≤30B) |
| /compare 진입 | 121,695 | 121,724 | +29(±30B, 앱 코드 변경 0 — 청크 해시) |
| 내보낸 사이트 JS | STATIC_MENU_SCRIPT | 같음 | 0 |

## 5. 테스트 delta (사전 예측 → 실제)
| 단계 | 예측 | RED | 실제 |
|---|---|---|---|
| P1 | +5 → 209·1832 | 5 failed(logs/p1-red.txt) | 같음 |
| P2 | +5 → 210·1837 | 5 failed(logs/p2-red.txt) | 같음(파일 확장자 .tsx) |
| P3 | +3 → 210·1840 | 3 failed(logs/p3-red.txt) | 같음 |
| 이관 | kitGuard 모션 규칙 = motion.css만 제외 · staticMarkup data-* 허용 목록 +2 · pngCapture style 정확 일치(CSS+방어 규칙) | — | 단언 약화·skip 0 |

최종 전체 suite 1회: **210 files · 1840 passed · exit 0**(logs/final-full-vitest.txt) = 예측 1840 일치 · 재시도 불필요

## 6. 한계·환경
- Ego Lite 창에서 로드 시 CSS 애니메이션이 한 번 돈 문서는 이후 새 전환이 pending에 머문다 — 2줄 최소 문서로 재현(logs/qb-stall-repro.txt), 제품 CSS 결함 아님. 시트 모션은 header만 data-motion을 남긴 사본(같은 내보낸 CSS)으로 측정. 실제 Chrome·Safari·Firefox 확인은 M2B-6 QA.
- Safari·Firefox `@starting-style` 실측 없음(환경 없음) — 미지원이면 즉시 열림(R-4, 기능 영향 0).
- 인쇄는 `media print` 에뮬레이션으로 확인(실제 인쇄 미리보기 창 아님).

## 7. Codex
(P5 기록)

## 8. 책임·환경
- 브라우저 검증 = ego-browser(Ego Lite Chromium) TaskSpace 66 · 4337 dev·4339 preview loopback · 자기 PID cwd 확인 뒤 종료·LISTEN 0 · main 5480 무접촉(logs/qb-servers-stop.txt).
- push·merge·삭제 0.
