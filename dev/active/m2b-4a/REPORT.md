# M2B-4a REPORT — 폰트 자체 호스팅

## 0. 메타
- 역할 Developer · Orca managed worktree `m2b-4a` · Claude Code(Opus 5.5) · 서브에이전트 0
- 브랜치 `k002bill2/m2b-4a` · base `254e322` · 2회 실행(1회차 턴 한도 → `0f40de1` wip 회수 → 턴한도 1회차 재개, 축소 범위)
- 정본 `docs/design/m2b/SPEC-MOTION-FONT.md` 0·2·3·4(폰트 MF-AC)·5절 · `MQ-M2B3.md` 1~5 ★A. 모션(1절) 구현 0 = M2B-4b
- 보호 경로 무수정: `git diff --exit-code 254e322 -- app/package.json app/package-lock.json CLAUDE.md docs/design docs/decisions` exit 0

## 1. E0 결과·분기
| 항목 | 결과 | 근거 |
|---|---|---|
| R-1 불투명 출처 iframe `@font-face` | 4337 dev·4339 preview 모두 loaded → **1안(같은 서버 url())** | logs/e0-r1.txt |
| R-3 SVG foreignObject `data:` 폰트 | 첫 그리기 = 0.8초 뒤 그리기(0px 차이) · 음성 9,247px 차이 | logs/e0-r3.txt |
| R-5 Pretendard sha256 | 공식 v1.3.9 ZIP과 바이트 동일 → 교체 0 | logs/e0-sha256.txt |
| Noto 원본 | google/fonts 커밋 `9710da1e…` 고정 URL·sha256 | logs/e0-sha256.txt |

## 2. 커밋표
| SHA | 내용 |
|---|---|
| a7fba84 | P0 골격·gate·baseline·E0 R-5·Noto 원본 |
| addd498 | E0 R-1·R-3 · Kit Sans/Serif KR 400·700 서브셋·OFL·SOURCE |
| 21d8d78 | 새 테스트 수 사전 예측(P2~P5) |
| dc5004a | 렌더 문서 사이트 글꼴(kit/fonts.css·별칭 스택·굵기 대응·글꼴 대기 rects) |
| 95f8a4c | 정적 HTML·PNG `data:` 인라인·고지 주석·실패 정책(5초) |
| 9d1c4b4 | 가드 G3·G5·G6 |
| 0f40de1 | wip: woff2 서명 검사 수정(B9 실측 발견)·브라우저 원시 증거 |
| d639868 | 서명 수정 뒤 B9-HTML 재측정·Kit Sans KR 계산 스타일·전체 vitest |

## 3. MF-AC별 근거
| AC | 판정 | 근거 |
|---|---|---|
| U6 굵기 대응 · U8 별칭 스택·synthesis none | 통과 | `kit/siteFonts.test.ts`·`kit/tokens.test.ts` (RED logs/p2-red.txt) |
| U7 정적 HTML·PNG 면 ≤2·swap·local 0 | 통과 | `siteFontEmbed.test.ts` · [B] 정적 HTML 소스 3계열 dataFaces 2·otherFaceRules 0·local false(logs/qb-export.txt) |
| G2 renderFonts 개정 | 통과 | `render/renderFonts.test.ts` 2 it 개정(RED p2-red → GREEN p2-gate) |
| G3·G5·G6 | 통과 | `test/siteFontAssets.test.ts` 임시 변형 RED 3(logs/p5-guard-red.txt) → GREEN |
| G4 고지 주석 | 통과 | `staticMarkup.test.ts`·`siteFontEmbed.test.ts`(RED logs/p34-red.txt) · [B] notice true 3계열 |
| B6 실제 적용 | 통과 | render 3계열 loaded(logs/qb-render.txt) · PNG 반복 차이 0·음성 ≠0 · 정적 HTML 3폭 loaded·글꼴 네트워크 요청 0(logs/qb-export.txt) |
| B7 rects | 통과 | 느린 망 rects 3초 폴백 + 늦은 로드 뒤 재전송 · 차단 = error여도 rects(logs/qb-render.txt) |
| B9 실패 정책 PNG | 통과 | 404·5.1초 = RENDER_TIMEOUT·문구·downloads 0 · 4.9초 성공(logs/qb-export-run2-html-timeout.txt 위쪽 run: ok49 ok·heightEqualsBase true). 주의: qb-export.txt run에서는 ok49가 5,007ms에 실패 — 4.9초 지연 + 받기 시간이 5초 상한을 넘은 경계 측정(4339 no-store 받기 수십~수백 ms). 판정 기준은 "4.9초 지연이면 성공"이라 경계 흔들림을 한계로 남김 |
| B9 실패 정책 HTML | **재측정 통과** | logs/qb-b9html.txt — 4339 없는 woff2 = 200 text/html(SPA 폴백) → JOB_TIMEOUT "글꼴을 불러오지 못했습니다 — 다시 시도하세요" 37ms · 진짜 404 5ms · 5.1초 5,054ms · 4.9초 성공 5,451ms · 실패 시 파일 0·iframe 잔류 0. 수정 전(run2) "정적 HTML 렌더 문서 시간 초과" 해소 |
| 3폭·200% | 통과 | 정적 HTML 390·768·1280 가로 넘침 −15(=스크롤바, 넘침 0) 100%·200% · PNG 3폭 ok |
| 계산 스타일 동등성 | 통과 | Serif·Pretendard(logs/qb-export.txt) + **Kit Sans KR 보충**(logs/qb-b9html.txt) 각 48/48 불일치 0 |
| B8 예산 | 통과 | §5 |

## 4. 폰트 실측 크기 (SPEC 3.2 — woff2 합계 ≤ 900KB)
| 계열 | 400 | 700 | 합계 | 판정 |
|---|---|---|---|---|
| Kit Sans KR | 172,048 | 175,888 | 347,936 | ≤900KB |
| Kit Serif KR | 352,812 | 362,684 | 715,496 | ≤900KB |
| Pretendard(기존) | 267,096 | 270,784 | 537,880 | ≤900KB |
정적 HTML 참고 출력: Serif 1,004,544 · Sans 514,475 · Pretendard 767,677 B.

## 5. 번들 baseline / 최종 (check-bundle-size)
| 항목 | baseline | 최종(서명 수정 뒤 build, logs/fix-magic-gate.txt·p34-bytes.txt) |
|---|---|---|
| 렌더 JS | 82,280 B | 82,820 B (+540, 멈춤선 89.70KB) |
| 렌더 CSS | 7,818 B | 8,034 B (+216, ≤30KB) |
| /studio 첫 화면 | 91,776 B | 91,778 B (+2) |
| /studio 진입 | 127,339 B | 127,337 B (−2, 증가 0) |
| /compare 진입 | 121,715 B | 121,709 B (−6) |
서명 수정은 `siteFontEmbed.ts`(조작 뒤 청크, 판정 밖)만 바꿈 — KB 표시값이 p34와 동일(82.82·8.03·91.78·127.33·121.70).

## 6. 테스트 delta (예측 대비)
| 단계 | 예측 | 실제 |
|---|---|---|
| P2 | +9 → 206 files·1811 | 일치 |
| P3·P4 | +10 → 207·1821 | 일치 |
| P5 | +3 → 208·1824 | 일치 |
| 최종 전체 1회 | 208·1824 | **208 files·1824 passed·exit 0·Errors 0**(logs/final-full-vitest.txt) |
사후 기록: woff2 서명 검사(0f40de1)는 B9 실측에서 발견한 수정으로, 테스트 사전 예측 없이 들어갔다. it 수 변화 0(기존 it에 단언 1줄 + 픽스처 바이트 `wOF2` 접두 3파일), RED는 구현 뒤 되돌려 확인(logs/fix-magic-red.txt → fix-magic-gate.txt). 단언 약화·skip 0.

## 7. Codex
- `codex-companion.mjs review --scope branch --base 254e322` 1라운드 **실제 완료**(Reviewer finished · exit=0, logs/codex-review.txt). base~HEAD 99576d5 대상.
- EPERM 한계 구분: Codex 샌드박스가 읽기 전용이라 Codex 쪽 표적 vitest 실행은 Vite 임시 설정 파일 작성 차단으로 실패 — **리뷰 자체는 완료**, 테스트 실행 증거는 메인 루프의 전체 vitest 1회(§6)로 대체.
- 지적 1건 **[P2] 미반영(열림)**: `app/src/render/siteFontLoad.ts:39` 편집 캔버스 경로 — 한 굵기 로드가 실패하고 다른 굵기가 나중에 성공하면 `Promise.all`이 먼저 거부돼 폴백 측정만 하고, 뒤늦은 성공에는 `late` 재측정이 없다(루트 크기가 같으면 ResizeObserver도 못 잡아 선택 오버레이가 옛 사각형 유지). 코드 확인 결과 지적이 맞다(L2). 미반영 사유: 이번 재개는 사전승인 축소 범위(재측정·보충·마감)이고 코드 수정은 범위 밖 + 수정 시 TDD RED·Codex 재리뷰 라운드가 필요. 권고: 후속에서 `Promise.allSettled`로 바꾸고 성공 면이 하나라도 있으면 `waited`일 때 `late` 호출 + RenderApp 테스트(한 굵기 reject·다른 굵기 늦은 resolve → rects 재전송) RED부터.

### 7.1 수정 레인 — Codex P2 반영 (영환님 ★A, 2026-10-05)
- 수정 5b8f176: `render/siteFontLoad.ts` 편집 캔버스 경로 `Promise.all` → 면별 `.catch(fallback)`(한 면 실패 = 바로 폴백 유지) + `Promise.allSettled`(받은 면 ≥1 이고 이미 폴백으로 그렸으면 `late`, 전부 실패 = 기존 폴백만). 내보내기 경로(20~29행) diff 0
- TDD: 예측 커밋 bf3310f(+2 it → 208 files · 1826) → RED 1 failed `expected 1 to be greater than 1`(logs/fix-p2-red.txt, 전부 실패 가드 it는 RED 시점 GREEN = 예측대로) → GREEN 15 passed
- Codex `review --scope branch --base 254e322` 2라운드 **실제 완료**(exit=0, logs/codex-review-fix-p2.txt, base~5b8f176). 새 지적 2건 — 브리프 지시대로 **기록만, 미수정**:
  - [P2-a] `siteFontLoad.ts:42-44` 폴백 뒤 한 굵기만 먼저 성공하고 다른 굵기가 계속 대기하면 `allSettled`가 끝날 때까지 `late`가 늦어진다(Codex 콜백 재현). 이번 수정의 잔여 갭 — 원 P2(실패+늦은 성공)는 해소, "성공+계속 대기"는 이전 `Promise.all`에도 있던 갭. 권고: 폴백 뒤 각 면 성공마다 `late`(면별 `.then`)
  - [P2-b] `kit/siteFonts.ts:27` 제목·본문이 모두 400으로 대응되는 프로필에서 `FallbackCanvas` 표식·슬롯(`font-bold`·`ds-heading1`·`ds-body1-strong`)이 700·600을 요구 → 대기 목록 밖 700 파일 요청 · PNG엔 400만 인라인 → 측정 문서와 결과물 글꼴 불일치 가능. 이번 diff(P2 수정) 밖의 기존 M2B-4a 코드 지적 — 후속 판단 필요

## 8. 한계·책임/환경
- 운영 정적 호스팅도 woff2에 `Origin: null` 대응 ACAO 헤더가 필요(R-1, 1안 전제).
- B9-PNG 4.9초 경계: 지연 4.9초 + 실제 받기 시간이 5초 상한에 포함돼 로컬에서 흔들림(1회 성공·1회 5,007ms 실패). 상한 정의(받기 포함) 그대로 두고 기록만 함.
- 브라우저 검증 = ego-browser(Ego Lite Chromium), 4337 dev·4339 preview loopback, 자기 PID cwd 확인 뒤 종료·lsof 0(logs/qb-b9html.txt 끝), main 5480 무접촉.
- 해소: Codex 1라운드 P2(부분 글꼴 실패 뒤 늦은 성공 재측정 누락) — 5b8f176(§7.1).
- 열린 결함: Codex 2라운드 P2-a(한 면 성공 + 다른 면 무기한 대기 시 `late` 지연, 편집 캔버스 한정) · P2-b(폴백 섹션 굵기 vs 사이트 대응 굵기 불일치) — §7.1, 미수정·후속 판단.
- 전체 vitest(수정 레인): 1회차 exit 1 = 무관 6파일 5초 타임아웃(기계 load avg 121) → 6파일 단독 31 passed → 2회차 208 files · 1826 passed · exit 0 · Errors 0.
- push·merge·삭제 0 · lock·명세·결정 문서·예산 무수정 · 서브에이전트 0.
