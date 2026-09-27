# EDITOR-A3-2 — 캔버스 시각 충실도 · 예시 문구 · portfolio/grid-2 (하이브리드 기능 단위)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337 · `--max-turns` 100 · **80턴부터 REPORT 우선**
- 서브에이전트 분할: 불필요(금지)
- 선행: EDITOR-A3-1 병합(`7c614af`) ✅ · 엔진 변형 3개 병합(`9754392`) ✅
- 근거: SPEC r4.7 A3-Q6·Q7·Q8 (영환님 "A, A, 샘플 포함"). 이전 A3-2(테마·이미지) 범위는 **EDITOR-A3-3**으로 옮긴다.

## 범위
- **V0 기준**: build 번들 표 · 1280 캔버스 스크린샷(127.0.0.1:4337, 목업 대조 기준) 1장 `dev/active/editor-a3-2/shots/v0-1280.png`.
- **V1 portfolio/grid-2 (A3-Q6)**: 엔진 `bodySections`에 `portfolio/grid-2`(이름표 "이미지 2열") 1개 + `engineVariantMap` 쌍(`portfolio/grid-2` → `portfolio/grid-2`) + 레지스트리·매핑 테스트(`composeCandidates.test.ts:134-135` masonryFirst 구조안에서 3안 변형이 서로 다름). **이 레인에 한해 `app/src/engine/sections/` 쓰기 허용**(엔진 레인 병합 완료). VARIANT-MAP.md는 Jarvis가 고친다.
- **V2 캔버스 변형별 모양 (A3-Q7, SPEC 5.7)**: `StructureCanvas`가 섹션 유형·변형마다 다른 와이어프레임 레이아웃을 그린다 — 최소: Header 바(로고 글자 + 메뉴 막대) · Hero 변형 6종(전면 색 면 + 좌/중앙 카피 · split 2칸 · grid · text · image) · services `cards-3`/`cards-2`/`cards-masonry`/`list` · portfolio `grid-3`/`grid-2`/`masonry` · about 2종 · statistics · testimonials · faq · contact · cta-band · Footer(어두운 면 + 사업자 줄). 실제 슬롯 글자, 이미지 슬롯 = 대각 줄무늬 플레이스홀더(`aria-hidden`).
  - **색**: 문서 `profileVersion`의 팔레트(2a-04 프로필 토큰)를 캔버스 루트 CSS 변수로 넘긴다(`--canvas-*`). 컴포넌트 hex 0(`noHardcodedStyle`), 불투명도 글자 0(5.7). 프로필 조회는 A3-1의 목적 파생과 같은 경로 재사용(두 번 부르지 않음). 조회 전·실패 = 중립 토큰으로 그리고 편집은 계속.
  - 선택 테두리·라벨 칩·문제 2중 테두리·배지·문장·`aria-describedby` 연결(E-AC-16 · 5.7)은 **그대로 유지** — 기존 단언 약화 금지.
  - 변형 매핑은 표 1개(`features/studio/canvasLayouts.ts` 등)로, 모르는 변형 = 기본 블록(예외 0).
- **V3 진입 알림 접기 (A3-Q7)**: 8.2.1 편집 알림을 한 줄 요약("편집 문서를 만들며 바뀐 점 N개") + `details` 펼치기로. 알림 문장·`role`·1회 규칙(D2)·소거(`history.replaceState`) 동작 불변.
- **V4 예시 문구 (A3-Q8)**: `data/` 층 예시 문구 표(섹션 유형 × 슬롯 키, 중립 한국어, 각 슬롯 권장 글자 수 이하) → `startDocWrite`가 새 문서를 만들 때 텍스트 슬롯에 채운다(엔진 호출은 기존 조작 청크 경로 · 엔진 `defaultText` 무수정). 섹션 추가·변형 교체로 생기는 새 슬롯은 기존 기본값(E-AC-24 불변). 테스트: 새 문서 텍스트 슬롯 빈 값 0 · 모든 예시 문구 ≤ 권장 · 게이트 글자 수 경고 0 · 재진입 멱등(E-AC-40~42 불변).
- **V5 목업 대조**: 1280·1024·390 스크린샷(`shots/`)과 목업 `design/claude-design-handoff-v2/project/Design Studio v2.dc.html` 편집기 화면을 **구조(섹션 모양·색 면·카드 열 수)** 기준으로 비교해 REPORT에 표로 남긴다. 목업 수치 복제는 목표가 아니다(기능 → 사용성 → 일관성 → 목업).
- **V6** 전체 3회 · Codex 1회 · REPORT.

## 번들 (이 레인)
- 캔버스 레이아웃은 `/studio` 편집 틀 청크(진입 직후)에 들어간다 — `/studio` 진입 ≤ 124.70(현재 122.81, **여유 1.89**). 초과가 보이면 변형별 레이아웃을 조작 뒤가 아니라 **편집 틀 청크 내부 단순화**로 줄이고, 그래도 넘으면 중지·보고.
- 예시 문구 표는 문서 생성 청크(`startDocWrite` 쪽 기존 동적 경로)로 — `/profile`·`/compare` 진입 ±0.03 이내.

## 공통 규칙 (모든 a3 레인)
- 기준: `docs/design/2a-05/SPEC.md` r4.5 — 인용은 절·행 번호로. 브리프와 SPEC이 다르면 SPEC이 이긴다(다르면 REPORT에 기록하고 멈추지 말 것).
- TDD RED→GREEN(RED 로그 커밋). 테스트 단언 약화·skip 금지. 새 의존성·새 아이콘 0(S-B7). 새 부품은 `components/studio/`(S-B6). `import type`(S-B8). 화면에서 engine 값 import 금지 — 엔진은 기존 조작 청크(동적 import)로만.
- 상태 지우기에 `navigate(replace)` 금지(C6 경쟁 선례) — `history.replaceState` 또는 화면 상태.
- `design/`·`docs/design/` 수정 금지(Developer). fable(`docs/00-research/buzz/claude-fable.md`) 무접촉. 커밋은 `git commit -- <경로>`.
- **체크포인트 게이트(매 커밋):** 표적 test + **`npx vitest run src/test`(가드 전체)** + typecheck + lint + build(번들 스크립트). 번들: `/studio` 첫 ≤ 99.40 · 진입 ≤ 124.70, **그 밖 화면·공통 ±0.03 이내**, 모든 화면 여유 < 0.3이면 즉시 중지·보고(예산 변경 금지). 대화상자·변형 목록·테마 대화상자·이미지 고르기는 **조작 뒤 로드**(S-B5).
- 마지막에 전체 vitest 3회(`logs/final-full-x3.txt`, load 기록). Codex `review --scope branch --base <시작 커밋>` 1회(턴 남을 때만).
- 서브에이전트 금지(429 이력). 로컬 커밋만. push·병합·삭제 금지. 서버는 127.0.0.1·지정 포트·자기 PID만 종료.
- REPORT(`dev/active/<레인>/REPORT.md`): 커밋 표 · AC 판정(E-AC 번호별 PASS/PARTIAL/BLOCKED + 근거 테스트) · 번들 표(체크포인트별) · SPEC 차이(ADR-003) · 남은 위험.

## 확정
- SPEC r4.7(영환님 "A, A, 샘플 포함", 2026-09-28). 시작 커밋 = 이 브리프가 들어 있는 main.
