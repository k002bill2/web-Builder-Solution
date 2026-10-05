# M2B-4a PROGRESS — 폰트 자체 호스팅(E0 · 서브셋 자산 · 로드 · 내보내기 실패 정책)

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-4a` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-4a/BRIEF.md` · 정본 `docs/design/m2b/SPEC-MOTION-FONT.md` 0·2·3·4(폰트 MF-AC)·5절 · `MQ-M2B3.md`(1~5 ★A). 모션(1절) 구현 0 = M2B-4b
- 시작 SHA `254e322` (브랜치 `k002bill2/m2b-4a`) · baseline 전체 suite 205 files · 1802 passed · exit 0(logs/baseline-full-vitest.txt)

## 체크리스트
- [x] P0 npm ci exit 0 · lock 불변(`git diff --exit-code -- app/package-lock.json app/package.json` exit 0) · baseline gate OK(logs/baseline-gate.txt) · 바이트 logs/p0-baseline-bytes.txt(렌더 JS 82,280 · CSS 7,818 · /studio 첫 91,776 · 진입 127,339 · /compare 진입 121,715 B) · 골격 커밋
- [x] E0-1 R-1 → **1안**(같은 서버 `url()` @font-face): 4337 dev·4339 preview 모두 불투명 출처(self.origin = "null") iframe에서 `ProbeK:400:loaded` · 없는 파일 = error(음성) · `Origin: null` 응답 ACAO null(logs/e0-r1.txt). 운영 정적 호스팅도 woff2에 같은 헤더 필요(REPORT 한계)
- [x] E0-2 R-3 통과: SVG foreignObject `data:` KitSerifKR-700 → decode 직후 첫 그리기 = 0.8초 뒤 그리기(차이 0px) · `@font-face` 뺀 음성 = 9,247px 차이(logs/e0-r3.txt, Ego Lite Chromium)
- [x] E0-3 R-5 Pretendard sha256 = 공식 릴리스 ZIP 동일 (logs/e0-sha256.txt)
- [x] E0-4 Noto 2종 원본 커밋 고정 URL·sha256 (logs/e0-sha256.txt)
- [x] P1 자산: `app/src/assets/site-fonts/kit-{sans,serif}-kr/` woff2 400·700 · OFL.txt(원문 바이트 동일) · SOURCE.md(RFN 0건 출력·재현 명령) · `app/src/assets/fonts/SOURCE.md`(Pretendard 출처·체크섬)
- [x] P2 렌더 문서 로드: `kit/fonts.css`(1안 6규칙·font-synthesis none) · `kit/siteFonts.ts`(별칭·스택·굵기 대응) · `render/siteFontLoad.ts`(캔버스 3초 폴백·늦은 로드 재측정 · 내보내기 bytes FontFace) · protocol render.fonts
- [ ] P3 정적 HTML `data:` 인라인 · 고지 주석
- [ ] P4 PNG `data:` 폰트 · 실패 정책(5초 · 문구 · 파일 0)
- [ ] P5 가드 G2·G3·G4·G5·G6 · 번들 B8
- [ ] P-B 브라우저 B6·B7·B9·3폭·200% · 정적 HTML 계산 스타일 동등성 · 서버 종료
- [ ] P-F 전체 vitest 1회 exit 0 · Codex branch review base 254e322 · REPORT 마감

## E0 결과
- E0-3 R-5: 저장소 `Pretendard-Regular.subset.woff2` `01dd7315…3878` · `Pretendard-Bold.subset.woff2` `78eb71c3…6397` = 릴리스 `https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip`(zip sha256 `04be351a…428a`, 태그 v1.3.9 → 커밋 `5c41199ea0024a9e0b2cb31735265056e5472d76`) 안 `web/static/woff2-subset/` 같은 이름 파일과 **바이트 동일** → 교체 0 · MQ-M2B3-4 ★A 전제 성립
- E0-4: google/fonts 커밋 `9710da1eacb3be272583c3224dcb70f9da6eadbb`(2026-09-30) · `NotoSansKR[wght].ttf` `194018e6…e252` · `NotoSerifKR[wght].ttf` `11f8d5de…38f3` · OFL.txt 각 sha256 → logs/e0-sha256.txt
  - upstream 버전: METADATA.pb에 version 필드 없음(source.commit `523d033d…`만) → 원본 TTF nameID 5에서 읽음: Sans `Version 2.004-H2` · Serif `Version 2.003-H1`
- 서브셋(저장소 밖 /tmp/m2b4-fonts venv · Python 3.9.6 · fonttools 4.60.1 · brotli 1.1.0): KitSansKR 400 172,048 · 700 175,888 (합 347,936 B) · KitSerifKR 400 352,812 · 700 362,684 (합 715,496 B ≤ 900KB → 멈춤 아님)
  - RFN 사후 검사 1차 10건(nameID 7 상표 문구 · 11 noto URL · 25 변형 PS 접두어) → 검사 제외를 넓히지 않고 해당 레코드 삭제 → 0건(logs/e0-rfn-check.txt)
  - cmap: Kit 2,572(한글 2,350 + 222) vs Pretendard 업스트림 3,728 — 차이 logs/e0-cmap-diff.txt(Pretendard는 라틴 확장 등 1,207 더 · Kit에만 51 = U+00A0·CJK 괄호·U+3164~318E 옛 자모·U+FF5E)

## 새 테스트 delta 사전 예측 (각 단계 RED 전 기록 · 기준 205 files · 1802)
- P2 렌더 문서 로드: 새 파일 `kit/siteFonts.test.ts` it 4(U6 굵기 대응 300·550·551·900 + 같은 대응 = 면 1개 · 허용 밖 계열 = 면 0 · U8 fontStack 별칭 맨 앞·"Noto …" 0·sans/serif 스택 · kitVars 굵기 대응값) + `render/renderFonts.test.ts` +1(G2 개정: 기존 2 it 개정 + url 대상 허용 6파일·외부 0·swap·local 0·font-synthesis none) + `render/RenderApp.test.tsx` +3(B7 로드 전 rects 0 → 로드 뒤 · 3초 폴백 rects + 늦은 로드 재전송 · 내보내기 bytes FontFace 등록 뒤 rects) + `render/protocol.test.ts` +1(render.fonts 모양 검사) = **+9 → 206 files · 1811**. 이관(수정만): `kit/tokens.test.ts` 글꼴 스택 단언 2줄(전 `"Pretendard", system-ui, sans-serif`·`"Noto Serif KR", serif` → 후 별칭 스택 — SPEC 2.1 근거)
- P3·P4 정적 HTML·PNG·실패 정책: 새 파일 `features/studio/siteFontEmbed.test.ts` it 5(@font-face 파싱·제거 · 쓰는 계열·굵기만 data: ≤2·swap·local 0 U7 · 5초 초과 실패/4.9초 성공 · 시간 초과 뒤 도착 무시 B9 · 고지 주석 G4) + `staticHtml.test.ts` +2(data: 인라인·고지 · 폰트 실패 = 실패·object URL 0) + `pngCapture.test.ts` +2(캡처 SVG data: 폰트·url(/assets) 0 · 폰트 실패 = RENDER_TIMEOUT·draw/download 0) + `staticMarkup.test.ts` +1(고지 주석 head·사용자 글자 0) = **+10 → 207 files · 1821**
- P5 가드: 새 파일 `test/siteFontAssets.test.ts` it 3(G3 라이선스·SOURCE 커밋 고정 URL·sha256 ≥2 · G5 "RFN 사후 검사 | 0건" 행·별칭 금지어 0 · G6 폰트 의존성 0·venv/스크립트 파일 0) = **+3 → 208 files · 1824**
  - P2 실제: RED 7 failed(새 6 + 이관 tokens.test 1) + siteFonts.test 파일 import 실패(it 4)(logs/p2-red.txt) → GREEN 표적 5파일 41 passed · gate 표적·가드·typecheck·lint·build(logs/p2-gate.txt — 1차 lint 1건 수정 후 개별 재실행 exit 0) · 바이트 렌더 JS 82,820(+540) · CSS 8,034(+216) · 앱 화면 전부 ±0 B(logs/p2-bytes.txt)
  - 이관(기존 단언 전후): ① `kit/tokens.test.ts:25-26` 전 `"Pretendard", system-ui, sans-serif` · `"Noto Serif KR", serif` → 후 SPEC 2.1 스택(별칭 맨 앞) ② `render/renderFonts.test.ts` 첫 it 전 "@font-face·woff 0·fonts.css 0" → 후 "render.css·kit.css @font-face·woff 0·앱 tokens/fonts.css 0 + @import 는 kit/fonts.css 1개"(G2 SPEC 개정분) ③ `test/tokenUsage.test.ts` V2-AC-14 전 "woff2 전체 4개" → 후 "site-fonts 밖 woff2 4개(앱 UI 그대로) + site-fonts = SPEC 2.1 정확 4파일"(목록 고정 — 약화 아님, P2 gate 가드에서 발견)
