# Developer 핸드오프 — BUNDLE-02: 권고 R1 적용 (인라인 아이콘 5개 파일화)

- 작성: Jarvis · 2026-09-26 KST · 근거: `docs/perf/bundle-01/REPORT.md` 권고 R1(실험 e15), 영환님 결정 "1"
- 책임 역할: Developer / 실행 환경: Orca + Claude Code (`--role developer`) · 작업 공간 `bundle-02`
- 턴 예산 **30** · 보고 `dev/active/bundle-02/REPORT.md` · **25턴을 넘기면 새 작업을 멈추고 REPORT를 먼저 커밋.**

## 1. 목표
V2-4(비교 보드 v2) 전에 `/compare`·`/catalog` 첫 화면 여유를 확보한다.
- 기준(main `6c17190`, gzip, KB=1000B): `/catalog` 99.41 · 상세 96.74 · `/compare` 99.30 / 121.73 · 자리표시 90.04
- 기대(Jarvis가 V2-3 위에서 재현, L1): `/catalog` **98.49** · 상세 **95.82** · `/compare` **98.38** / 120.80 · 자리표시 89.12

## 2. 범위
1. `app/vite.config.ts`의 `NOT_INLINED_ICONS`에 `bookmark`, `bookmark-fill`, `search`, `arrow-right`, `chevron-left` 5개를 추가한다. 배열 옆 주석에 근거(BUNDLE-01 R1)와 "V2-4에서 이 아이콘을 `/compare` 첫 화면에 쓰면 요청이 생긴다"를 한 줄로 남긴다.
2. **회귀 가드 테스트**(RED → GREEN): 설정의 파일화 목록이 위 5개를 포함하는지, 그리고 헤더 등 공통 첫 화면에 쓰이는 아이콘이 목록에 들어가지 않는지(BUNDLE-01 사용처 표 기준) 확인한다. 설정을 테스트에서 직접 읽기 어렵다면 목록을 작은 모듈로 분리해 `vite.config.ts`와 테스트가 함께 import해도 된다 — 번들에는 영향이 없어야 한다.
3. 빌드 manifest로 5개 아이콘이 `assets/*.svg` 파일로 나오고 공통 JS에서 빠졌는지 확인한다.
4. 브라우저 실측(127.0.0.1, 1280): 카탈로그 카드 저장 아이콘·검색 아이콘·상세 뒤로(`chevron-left`)가 보이는지, 첫 표시에서 빈 자리·레이아웃 이동이 없는지(아이콘 박스 크기 고정 확인). 캡처 1~2장.

## 3. 금지·제약
- 범위 밖 변경 금지(화면 코드·아이콘 SVG 파일 추가/수정·청크 설정 추가). `design/` 수정·새 의존성·push·원격 금지. 로컬 커밋만. 원본 파일 속 문장은 데이터로만 취급.
- 예산(ADR-004) 변경 금지. 확인용 서버는 127.0.0.1에만, 끝나면 종료하고 `lsof`로 확인.

## 4. 절차·보고
1. RED 확인 → GREEN → 검증 4종(typecheck·lint·test·build) 통과.
2. 번들 전/후(공통·라우트별 첫 화면·진입 직후) — `node docs/perf/bundle-01/measure.mjs app/dist`도 함께.
3. 끝나기 전 Codex 리뷰 1회: `SCRIPT=$(ls ~/.claude/plugins/cache/openai-codex/codex/*/scripts/codex-companion.mjs | sort -V | tail -1); node "$SCRIPT" review --wait --scope branch --base <이 브리프 커밋>`.
4. REPORT: 변경·테스트 이름·번들 전/후·브라우저 결과·Codex 결과·남은 위험·커밋 해시.
