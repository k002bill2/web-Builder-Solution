# M2A-2a — 킷 기반 + 실렌더 3변형(header · hero · footer) (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(127.0.0.1) · `--max-turns` 110 · `--effort` medium · **85턴부터 REPORT 우선**
- 서브에이전트 분할: 불필요 — 429 이력으로 이 프로젝트는 금지 유지
- 대상 저장소 `/Users/younghwankang/Work/web-builder-solution`(레인 worktree) · 시작 커밋 = 이 브리프가 들어 있는 main
- 선행: M2A-0 명세 병합 ✅(`f64ad9d`) · M2A-1 렌더 기반 병합 ✅(`4ce3b63`) · 2a-05 SPEC r4.9(MQ-1~5 기록)
- **M2A-2는 둘로 나눈다.** 이 레인(2a) = 킷 기반 + 바깥 3변형. 다음 레인 M2A-2b = 본문 4변형(about · services · faq · contact) + 캔버스 캡션 3상태·"페이지 미리보기" 이름 + 변형 목록 표시(MQ-3) + 브라우저 K-AC 일괄. 그다음 M2A-3 = PNG · 정적 HTML · `UNRENDERED_SECTIONS`. 이 레인은 2b·3 범위를 미리 만들지 않는다.

## 목적
렌더 문서가 처음으로 **실제 섹션 모양**을 그린다. 문서에서 렌더러가 있는 변형은 킷이, 없는 변형은 지금의 와이어프레임 폴백이 그린다(한 문서 안에 섞임). 이 레인이 끝나면 B안·A안 편집 화면의 Header·Hero·Footer가 프로필 색·글자로 그려진 실제 모양이 된다(Hero는 문서의 hero 변형이 `fullbleed-left`일 때만 — A안).

## 근거 (먼저 읽기 — 절·행 번호로 인용)
- **`docs/design/m2a/SPEC.md`** 0절 전부(0.1~0.12) · **K1-1 header/sticky-right-cta · K1-2 hero/fullbleed-left · K1-7 footer/biz-extended** · 3.1 폴백 표식 · 4.1 K-AC · 부록 A
- `docs/design/2a-05/SPEC.md` r4.8(5.7 오버레이) · **r4.9**(MQ-1~5) · `docs/decisions/ADR-004-performance-budgets.md` 개정 2
- M2A-1 결과: `dev/active/m2a-1/REPORT.md`(3절 프로토콜 · 7절 별도 빌드 · 8절 남은 위험 1·3·4) · `dev/active/m2a-1/logs/f1-diagnosis.txt`(**브라우저 캡처는 fullPage 금지 — iframe `scrollIntoView` + 뷰포트 캡처**)
- `docs/00-research/buzz/claude-opus-5.5-r2.md` B-1-8(킷 위치·import 규칙) · B-1-9(네이티브 HTML 상호작용)
- 코드: `app/src/render/`(RenderApp · protocol · fallback) · `app/src/engine/sections/{boundSections,bodySections}.ts` · `app/src/domain/{profile,effectiveProfile,elementLibrary,fonts,contrast,profileContrast}.ts` · `app/src/components/studio/StructureCanvas.tsx`(호스트)

## 범위 (단계 = 체크포인트, 각 단계 RED→GREEN 커밋 + PROGRESS 갱신)
- **K0 기준선**: 번들 표(앱 모든 화면 + 렌더 문서 JS·CSS) · 1280·390 뷰포트 캡처(f1 방식) `dev/active/m2a-2a/shots/k0-*.png`.
- **K1 킷 토큰 (m2a 0.2·0.4·0.5)**: 프로필 적용값 → 킷 토큰 입력(팔레트 5역할 · 카드 톤·모양 · 글꼴 계열·굵기 · scale · sectionGap·밀도 · media_ratio)을 만드는 **순수 함수**와, 그 입력 → 사이트 CSS 변수(`--site-*`, 이름은 Developer 확정 후 REPORT)를 만드는 **결정적 생성기**. 같은 입력 = 같은 문자열. 단위 테스트 먼저.
- **K2 메시지 확장 (MQ-1)**: `render{doc, palette}` → `render{doc, kitTokens}`(팔레트 포함). 부모가 문서의 프로필 버전 적용값에서 만든다(이미 조회하는 경로 재사용, 두 번 조회 0). **값이 없으면 킷은 그리지 않고 `error`** — 폴백 섹션은 지금처럼 중립 토큰으로 계속 그린다. 모양 검사(`readParentMessage`) 갱신 + 테스트.
- **K3 킷 골격 (m2a 0.1·0.6~0.12)**: `app/src/kit/`(Opus B-1-8). 레지스트리(`type/variant` → 킷 컴포넌트) · 렌더 문서의 섹션 분기(킷 있음 = 킷, 없음 = 폴백 + 표식) · 문서 뼈대(`body > header · main · footer`, 0.12) · 공통 규칙(넘침 0.7 · 빈 슬롯 0.8 · 링크 0.10 · 상호작용 0.11).
  - **가드 테스트 먼저(RED)**: 킷 파일 import = react · 킷 내부 · 킷 CSS만(앱 DS·엔진 연산·게이트·zod 0) · `useState`·`useReducer`·`useEffect`·`on[A-Z]` prop 0 · `transition`·`animation`·`scroll-behavior` 0 · `vh` 계열 0 · hex·px 0 · 앱 DS 토큰 참조 0(K-AC-01·07).
  - 킷 CSS는 렌더 빌드의 Tailwind 스캔 범위(`src/render` + `src/kit`)로만 생성.
- **K4 이미지 전달 (m2a 0.9)**: 사용자 로컬 이미지 → 부모가 **Blob 자체**를 postMessage로 넘기고 렌더 문서가 자기 object URL을 만든다(불투명 출처라 부모 `blob:` URL은 열리지 않음 — Opus B-1-7). 렌더 문서는 문서에서 빠진 이미지의 URL을 해제한다. 없으면 토큰 그라디언트(`aria-hidden`, MQ-5). 테스트: Blob 수신 → `img` · 교체·삭제 → 해제.
- **K5 header/sticky-right-cta (K1-1)** — `popover` 모바일 시트 · 1280/390 메뉴 전환 · CTA 대상 · 열린 시트 폭 전환(K-AC-10·12·13·14·35).
- **K6 hero/fullbleed-left (K1-2)** — 단색 `primary` 카피 패널 · 미디어 층 위 글자 0 · 390 미디어 띠 위치(K-AC-20·21·22).
- **K7 footer/biz-extended (K1-7)** — `ink` 면 · `bg` 글자 · `address` · 하단 링크 = 글자(K-AC-31).
- **K8 공통 K-AC (이 레인이 그리는 범위)**: K-AC-02·03·04(해당 슬롯)·05·09·11·16·36 — 3변형 + 폴백이 섞인 문서로. 대비 K-AC-11·36은 픽스처 프로필 2개 이상.
- **K9 브라우저 확인**: vite dev 127.0.0.1:4337, A안(hero `fullbleed-left`) 문서를 앱 흐름으로 만들고 1280·390 **뷰포트 캡처**(iframe `scrollIntoView`, fullPage 금지) `shots/k9-*.png` — K0와 나란히. [B] 표기 K-AC는 여기서 판정. K-AC-15(표식 ↔ 라벨 칩 겹침 0)도.
- **K10** 전체 vitest 3회 · Codex `review --scope branch --base <시작 커밋>` 1회 · REPORT.

## 제외
- 본문 4변형 · 캔버스 캡션 3상태 · "페이지 미리보기" 이름 · 변형 목록 표시(MQ-3) → **M2A-2b**
- PNG · 정적 HTML · `UNRENDERED_SECTIONS` · 내보내기 버튼 · K-AC-06·08·17·18·19·30·32·34 → **M2A-3**
- 오버레이 문제 문장이 렌더 글자 위에 겹치는 문제(M2A-1 REPORT 8절 3) → Designer 시각 QA 결정 대기, 이 레인은 **바꾸지 않는다**(K9 캡처에서 보이면 REPORT에 기록만)
- Codex P2(manifest 병합 키 충돌, `check-bundle-size.mjs:103`): 렌더 빌드가 **청크를 나누게 되면** 이 레인에서 고친다(두 manifest 분리 계산 + 테스트). 나누지 않으면 손대지 않는다.

## 번들
- 렌더 문서: **JS ≤ 90 · CSS ≤ 30KB**, 멈춤선 JS 89.70. 지금 76.24 / 4.60. 3변형 + 토큰 + 이미지 예상 +2~4KB [추정]. 넘을 것으로 보이면 예산을 바꾸지 않고 멈춰 보고(ADR-004).
- 앱: `/studio/:projectId` 첫 ≤ 99.40 · 진입 ≤ 124.70(지금 123.88) — 부모 쪽 추가는 킷 토큰 입력 함수·Blob 전달뿐이어야 한다. 그 밖 화면·공통 ±0.03.
- 킷 토큰 생성기는 **렌더 문서 쪽**에 둔다(부모는 입력 값만 모아 보낸다)가 기본. 반대가 더 작으면 실측 근거와 함께 REPORT.

## 공통 규칙
- 판단 순서 ADR-003(기능 → 사용성 → DS 일관성 → 목업). 명세(m2a SPEC)와 다르게 한 곳은 REPORT에 한 줄 사유.
- TDD RED→GREEN(RED 로그 커밋). 단언 약화·skip 금지. **새 의존성 0 · 새 아이콘 0.** 엔진 계약(슬롯·섹션 정의) 변경 0. `import type`. 상태 지우기 `navigate(replace)` 금지.
- `design/`·`docs/design/`·`docs/decisions/` 수정 금지. fable(`docs/00-research/buzz/claude-fable.md`) 무접촉. 커밋은 `git commit -- <경로>`.
- **체크포인트 게이트(매 코드 커밋)**: 표적 test + `npx vitest run src/test` + typecheck + lint + build(번들 스크립트). M2A-1의 `dev/active/m2a-1/gate.sh`를 복사해 `dev/active/m2a-2a/gate.sh`로 써도 된다.
- 로컬 커밋만. push·병합·삭제 금지. 서버는 127.0.0.1:4337, **끝날 때 자기가 띄운 서버 PID 종료**.
- PROGRESS `dev/active/m2a-2a/PROGRESS.md`(시작 시 수신 기록, 단계마다 갱신) · REPORT `dev/active/m2a-2a/REPORT.md`: 커밋 표 · 킷 토큰 변수 이름·생성 규칙 · 메시지 최종 모양 · K-AC 판정(번호별 PASS/PARTIAL/BLOCKED + 근거 테스트·캡처) · 번들 표(체크포인트별, 앱·렌더 문서) · 명세 차이 · 남은 위험(M2A-2b에 넘길 것 포함).

## 수용 기준
1. A안 문서의 header·hero·footer가 렌더 문서에서 킷으로 그려지고, 나머지 섹션은 폴백 + "구조 미리보기" 표식(K9 캡처로 확인).
2. 킷 토큰 생성기 결정성 테스트 · 값 없음 → `error` · 폴백은 계속 그림.
3. 가드(K-AC-01·07) GREEN. 3변형 K-AC(10·12·13·14·20·21·22·31·35)와 공통 K-AC(02·03·04·05·09·11·16·36·15) 판정 완료.
4. 렌더 문서 JS ≤ 90(멈춤선 89.70) · 앱 예산 안. 전체 vitest 3회 통과. 4337 서버 종료.

## 확정
- M2A-0 명세(`f64ad9d`) · 2a-05 SPEC r4.9 · 영환님 "M2A-2 브리프"(2026-10-03).
