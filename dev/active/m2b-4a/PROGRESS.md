# M2B-4a PROGRESS — 폰트 자체 호스팅(E0 · 서브셋 자산 · 로드 · 내보내기 실패 정책)

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-4a` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-4a/BRIEF.md` · 정본 `docs/design/m2b/SPEC-MOTION-FONT.md` 0·2·3·4(폰트 MF-AC)·5절 · `MQ-M2B3.md`(1~5 ★A). 모션(1절) 구현 0 = M2B-4b
- 시작 SHA `254e322` (브랜치 `k002bill2/m2b-4a`) · baseline 전체 suite 205 files · 1802 passed · exit 0(logs/baseline-full-vitest.txt)

## 체크리스트
- [x] P0 npm ci exit 0 · lock 불변(`git diff --exit-code -- app/package-lock.json app/package.json` exit 0) · baseline gate OK(logs/baseline-gate.txt) · 바이트 logs/p0-baseline-bytes.txt(렌더 JS 82,280 · CSS 7,818 · /studio 첫 91,776 · 진입 127,339 · /compare 진입 121,715 B) · 골격 커밋
- [ ] E0-1 R-1 불투명 출처 iframe `@font-face` 로드 (dev 4337 · preview 4339) → 1안/2안 분기
- [ ] E0-2 R-3 SVG foreignObject `data:` 폰트 PNG 반영 + 음성 검증
- [x] E0-3 R-5 Pretendard sha256 = 공식 릴리스 ZIP 동일 (logs/e0-sha256.txt)
- [x] E0-4 Noto 2종 원본 커밋 고정 URL·sha256 (logs/e0-sha256.txt)
- [ ] P1 자산: KitSansKR/KitSerifKR 400·700 · OFL.txt · SOURCE.md · Pretendard SOURCE.md
- [ ] P2 렌더 문서 로드(fonts.css/2안 · fontStack 별칭 · font-synthesis · 굵기 대응 · 로드 뒤 rects · 3초 폴백 · 늦은 로드 재전송)
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
