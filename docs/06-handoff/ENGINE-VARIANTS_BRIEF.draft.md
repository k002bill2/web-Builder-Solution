# ENGINE-VARIANTS — 엔진 services·portfolio 변형 추가 (a3 선행, Q-21 후속) · 초안

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4339 · `--max-turns` 45 · 32턴부터 REPORT 우선
- 서브에이전트 분할: 불필요

## 목적
SPEC r4.1 Q-21 후속: 3안(2a-04c)이 그리드 축(`GRID_LADDER = grid-3 · grid-2 · masonry`, `domain/composeCandidates.ts:30`)만 다를 때 문서에서 셋 다 `services/cards-3`이 되어 차이가 사라진다(VARIANT-MAP 94행). 엔진에 변형을 더해 **편집기에서도 3안 차이를 보존**한다.

## 범위 (결정 A3-Q3 결과에 따름 — 추천안 기준)
1. `engine/sections/bodySections.ts`에 변형 3개: `services/cards-2`("카드 2열") · `services/cards-masonry`("카드 벽돌형") · `portfolio/masonry`("이미지 벽돌형"). 슬롯은 기존 `cards-3`·`grid-3` 스키마 재사용 규칙(카드 2개면 card(1..2)), `maxMotion` 기존 값 준용. 레지스트리 테스트(키 고유·기본 글자 ≤ 상한) 통과.
2. `data/engineVariantMap.ts` 매핑 갱신: VARIANT-MAP 31·32행(`services/grid-2`→`cards-2`, `services/masonry`→`cards-masonry`), 19행(`portfolio/masonry`→`portfolio/masonry` 같음), 33행 `portfolio/grid-2`는 현행 유지(도달 0). 바뀐 쌍 알림(8.2.1 (a))은 표에서 자동 파생 — 알림 문구 테스트 기대값 갱신.
3. 캔버스(`components/studio/StructureCanvas.tsx`)가 새 변형을 슬롯 목록대로 그리는지 테스트 1건(그리기 로직 변경이 필요하면 최소).
- 제외: 변형 교체 UI(a3-1) · VARIANT-MAP.md 문서 갱신(Jarvis가 SPEC r4.6과 함께).

## 수용 기준
- 같은 픽스처 3안(그리드 축만 다름) → `startDoc` 문서 3개의 services 변형이 서로 다름(테스트).
- `engineImportGuard`·가드 전체 통과 · 번들 `/studio` 진입 증가 ≤ +0.3KB, 그 밖 ±0.03.
- 기존 `startDoc` 멱등·`UNKNOWN_VARIANT` 테스트 불변.

## 공통 규칙 (모든 a3 레인)
- 기준: `docs/design/2a-05/SPEC.md` r4.5 — 인용은 절·행 번호로. 브리프와 SPEC이 다르면 SPEC이 이긴다(다르면 REPORT에 기록하고 멈추지 말 것).
- TDD RED→GREEN(RED 로그 커밋). 테스트 단언 약화·skip 금지. 새 의존성·새 아이콘 0(S-B7). 새 부품은 `components/studio/`(S-B6). `import type`(S-B8). 화면에서 engine 값 import 금지 — 엔진은 기존 조작 청크(동적 import)로만.
- 상태 지우기에 `navigate(replace)` 금지(C6 경쟁 선례) — `history.replaceState` 또는 화면 상태.
- `design/`·`docs/design/` 수정 금지(Developer). fable(`docs/00-research/buzz/claude-fable.md`) 무접촉. 커밋은 `git commit -- <경로>`.
- **체크포인트 게이트(매 커밋):** 표적 test + **`npx vitest run src/test`(가드 전체)** + typecheck + lint + build(번들 스크립트). 번들: `/studio` 첫 ≤ 99.40 · 진입 ≤ 124.70, **그 밖 화면·공통 ±0.03 이내**, 모든 화면 여유 < 0.3이면 즉시 중지·보고(예산 변경 금지). 대화상자·변형 목록·테마 대화상자·이미지 고르기는 **조작 뒤 로드**(S-B5).
- 마지막에 전체 vitest 3회(`logs/final-full-x3.txt`, load 기록). Codex `review --scope branch --base <시작 커밋>` 1회(턴 남을 때만).
- 서브에이전트 금지(429 이력). 로컬 커밋만. push·병합·삭제 금지. 서버는 127.0.0.1·지정 포트·자기 PID만 종료.
- REPORT(`dev/active/<레인>/REPORT.md`): 커밋 표 · AC 판정(E-AC 번호별 PASS/PARTIAL/BLOCKED + 근거 테스트) · 번들 표(체크포인트별) · SPEC 차이(ADR-003) · 남은 위험.
