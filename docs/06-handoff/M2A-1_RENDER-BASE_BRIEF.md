# M2A-1 — 렌더 기반: 렌더 문서(iframe) · 메시지 다리 · 부모 오버레이 · 폴백 이전 · 번들 검사 (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(127.0.0.1) · `--max-turns` 120 · `--effort` medium · **95턴부터 REPORT 우선**
- 서브에이전트 분할: 불필요 — 429 이력으로 이 프로젝트는 금지 유지(메인이 직접)
- 대상 저장소: `/Users/younghwankang/Work/web-builder-solution` (레인 worktree에서 작업) · 시작 커밋 = 이 브리프가 들어 있는 main
- 선행: ADR-004 개정 2 ✅ · 2a-05 SPEC r4.8 ✅(영환님 2026-10-03 "★A, 확인 1~3 승인")
- 병렬 레인: **M2A-0 Designer**(킷 명세, 쓰기 = `docs/design/m2a/`만) — 이 레인과 쓰기 경로가 겹치지 않는다. 이 레인은 Designer 명세를 기다리지 않는다.

## 목적
편집기 캔버스를 **별도 렌더 문서(iframe)** 위에서 그리는 구조로 바꾼다. 이 레인에서는 **실제 섹션 킷을 만들지 않는다** — 모든 섹션이 와이어프레임 폴백으로 그려지되, 그리는 곳이 렌더 문서로 옮겨진다. 실렌더 7변형은 M2A-2, 내보내기는 M2A-3이다.

완료되면 화면 모습은 지금(a3-2)과 거의 같고, 구조가 바뀐다: `/studio` 부모 = 툴바·패널·호스트(iframe·다리·오버레이), 렌더 문서 = 문서 그리기.

## 근거 (먼저 읽기 — 절·행 번호로 인용)
- `docs/decisions/ADR-004-performance-budgets.md` **개정 2** (결정 1~5 전부)
- `docs/design/2a-05/SPEC.md` r4.8: **5.7**(부모 오버레이 · `aria-describedby` · 폴백 표식) · 10.2 **S-B12** · 11 **E-AC-49**
- `docs/00-research/buzz/claude-opus-5.5-r2.md` **B-1 "③의 설계 요점" 1~8**(엔트리 · 메시지 프로토콜 6 · 샌드박스 7 · 킷 위치 8)
- `docs/06-handoff/REF-LLM-PIPELINE_BRIEF.md` D6-1·D6-2
- 현재 코드: `app/src/components/studio/StructureCanvas.tsx` · `app/src/features/studio/{canvasLayouts,canvasIssues,previewFrame,selection}.ts` · `app/src/engine/validate/validatePageDoc.ts` · `app/scripts/check-bundle-size.mjs`(113행 엔트리 가정) · `app/vite.config.ts` · `app/src/engine/engineImportGuard.test.ts`

## 범위 (단계 = 체크포인트, 각 단계 RED→GREEN 커밋 + PROGRESS 갱신)

- **R0 기준선**: build 번들 표(모든 화면, 첫 화면 / 진입 직후) · 1280·390 캔버스 스크린샷 `dev/active/m2a-1/shots/r0-*.png` · 현재 캔버스 관련 테스트 목록(파일·테스트 이름) — R4의 "옮긴 단언 표" 기준.
- **R1 샌드박스 PoC (게이트)**: `render.html` 최소 엔트리(빈 React 루트 + `ready` 메시지)를 Vite 다중 페이지 입력으로 추가하고, 부모가 `<iframe sandbox="allow-scripts">`로 띄운다.
  - `vite dev`와 `vite build && vite preview` **둘 다**에서 렌더 문서 모듈 스크립트가 실행되는지(`ready` 수신) 실제 브라우저로 확인해 로그·스크린샷을 남긴다(불투명 출처 → 모듈 스크립트 CORS, Opus B-1-7).
  - 성공 조건을 만족하는 방법이 dev/preview 서버 설정(CORS 헤더 등)뿐이면 그 설정을 쓰고 REPORT에 정적 호스팅 요구사항으로 남긴다.
  - **`allow-same-origin`을 더해야만 동작하면 그 지점에서 멈추고 보고한다**(보안 경계 변경 — Jarvis·Security 결정 사항). 우회 구현 금지.
- **R2 번들 검사 스크립트 (ADR-004 개정 2 결정 5)**: 엔트리를 이름으로 고정(앱 `index.html` · 렌더 `render.html`, 그 밖 엔트리 = 실패) · 렌더 문서 판정(JS ≤ 90 · CSS ≤ 30KB, 진입 직후 자동 로드 포함) · 렌더 엔트리 없음 = 실패 · 공유 청크 목록·크기 참고 출력 · 머리 주석 갱신. **스크립트 자체의 테스트**(픽스처 manifest로 엔트리 2개·공유 청크·누락·제3 엔트리 경우)를 먼저 RED로.
- **R3 렌더 문서 본체**: `src/render/`(이름은 Developer 판단, REPORT에 기록)
  - 메시지 수신기: 부모→렌더 `render{doc, palette}` · `viewport{width}` · `select{instanceId}` / 렌더→부모 `ready` · `rects{[instanceId, slotKey?, x, y, w, h]}` · `click{instanceId}` · `error{code}`. 양쪽 다 `event.source` 확인 + 메시지 모양 검사. 렌더 쪽은 받은 문서를 `validatePageDoc`으로 다시 검증(실패 = `error`, 그리지 않음).
  - **와이어프레임 폴백 이전**(ADR-004 개정 2 결정 3의 유일한 허용 항목): `StructureCanvas`의 섹션 블록 그리기 + `canvasLayouts.ts` 모양표·팔레트를 렌더 문서 쪽으로 옮긴다. 모든 섹션 = 폴백 + 섹션 머리 표식 "구조 미리보기"(SPEC 5.7 r4.8 — 시각 명세는 M2A-0 Designer가 확정, 이 레인은 글자·위치 최소안).
  - 이미지 슬롯: 지금과 같은 자체 플레이스홀더. 사용자 로컬 이미지는 이 레인에서 렌더 문서로 넘기지 않아도 된다(Blob 전달은 M2A-2) — 대신 지금과 같은 "이미지 있음" 플레이스홀더로 그리고 REPORT에 남긴다.
  - 렌더 문서 탑재 제한(ADR-004 개정 2 결정 3): `components/ds` · 엔진 문서 연산(`engine/ops`) · 게이트(`engine/gate`) · zod import 0 → **가드 테스트**(`engineImportGuard.test.ts`와 같은 방식)를 RED로 먼저.
- **R4 부모 호스트 · 오버레이 (SPEC 5.7 r4.8)**:
  - 캔버스 자리에 iframe + 다리. 미리보기 폭(`previewFrame.ts` 1280·1024·390)은 **iframe 폭**으로 바꾼다(미디어 쿼리가 실제 뷰포트로 동작).
  - 선택 테두리·라벨 칩·문제 2중 테두리·배지·문제 문장 = 부모 오버레이 층(`rects` 위치). 테두리 `aria-hidden`·포인터 통과, 배지만 누름 → 필드 포커스. 문제 문장은 부모 DOM에 늘 있고 필드 `aria-describedby`(문장 + 카운터) 연결 유지. 사각형 받기 전에는 오버레이를 그리지 않는다.
  - 캔버스에서 섹션 클릭 → 렌더 `click` → 부모 선택(지금과 같은 동작).
  - **기존 캔버스 테스트 이관 규칙**: 렌더 문서로 옮겨 간 DOM을 보던 테스트는 **같은 단언을 렌더 문서 단위 테스트로 옮긴다**(삭제·약화·skip 금지). REPORT에 "옮긴 단언 표"(원래 파일·테스트 → 새 파일·테스트, 단언 동일 여부)를 남긴다. 부모에 남는 단언(선택·문제·`aria-describedby`)은 부모 테스트에서 그대로 통과해야 한다.
- **R5 번들 실측 · 브라우저 확인**: 폴백 이전 전후 `/studio/:projectId`와 렌더 문서 합계를 둘 다 표로(결정 3). 1280·390 스크린샷 `shots/r5-*.png`(R0와 나란히). E-AC-49 항목을 실제 브라우저에서도 확인(부모 DOM에 문장 · iframe 안 문장 0).
- **R6** 전체 vitest 3회 · Codex `review --scope branch --base <시작 커밋>` 1회 · REPORT.

## 제외 (다른 레인)
- 킷 컴포넌트·토큰 CSS·실렌더 7변형·이미지 Blob 전달 → M2A-2 · PNG·정적 HTML·`UNRENDERED_SECTIONS` → M2A-3 · 캔버스 캡션 등급 표시·차단 문구 최종안 → M2A-0/2 · 테마·이미지(a3-3)·게이트 표시(a4).

## 번들 (이 레인)
- `/studio/:projectId` 첫 화면 ≤ 99.40 · 진입 직후 ≤ 124.70(지금 124.31). 호스트 코드가 폴백 이전으로 생긴 여유 안에 들어가야 한다. **그 밖 화면·공통 ±0.03 이내.**
- 렌더 문서: JS ≤ 90 · CSS ≤ 30KB(이 레인 값은 폴백만이라 작아야 정상 — 실측 보고).
- 초과가 보이면 예산을 바꾸지 않고 멈춰 보고한다(ADR-004).

## 공통 규칙
- 브리프와 SPEC·ADR이 다르면 SPEC·ADR이 이긴다(REPORT에 기록, 멈추지 말 것 — 단 R1 `allow-same-origin`은 멈춤).
- TDD RED→GREEN(RED 로그 커밋). 단언 약화·skip 금지. R4 이관은 같은 단언을 다른 테스트로 옮기는 것이라 허용된다(표로 증명). **새 의존성 0 · 새 아이콘 0.** `import type`(S-B8). hex·px 하드코딩 금지(`noHardcodedStyle`). 상태 지우기에 `navigate(replace)` 금지.
- `design/`·`docs/design/`·`docs/decisions/` 수정 금지. fable(`docs/00-research/buzz/claude-fable.md`) 무접촉. 커밋은 `git commit -- <경로>`.
- **체크포인트 게이트(매 커밋)**: 표적 test + `npx vitest run src/test`(가드 전체) + typecheck + lint + build(번들 스크립트).
- 마지막에 전체 vitest 3회(`logs/final-full-x3.txt`, load 기록).
- 로컬 커밋만. push·병합·삭제 금지. 서버는 127.0.0.1:4337·자기 PID만 종료. 브라우저 확인은 기존 QA 도구 방식(`docs/qa/a2-editor-flow/flow.mjs` 참고)으로, 새 의존성 없이.
- PROGRESS: `dev/active/m2a-1/PROGRESS.md`(시작 시 수신 기록, 단계마다 갱신). REPORT: `dev/active/m2a-1/REPORT.md` — 커밋 표 · R1 PoC 결과(dev/preview) · 메시지 프로토콜 최종 모양 · 옮긴 단언 표 · E-AC-49 판정 · 번들 표(체크포인트별, 앱·렌더 문서·공유 청크) · SPEC 차이(ADR-003) · 남은 위험.

## 수용 기준
1. R1: `allow-scripts`만으로 dev·preview 둘 다 `ready` 수신(증거 로그·스크린샷) — 또는 멈춤 보고.
2. 번들 스크립트 테스트 GREEN, `npm run build`가 앱 + 렌더 문서를 각각 판정해 출력.
3. 캔버스가 iframe 안에서 그려지고, 선택·문제 표시·`aria-describedby`·배지 포커스가 지금과 같이 동작(E-AC-16·E-AC-49).
4. 렌더 문서 import 가드 GREEN. 렌더 문서 DOM에 문제 문장·배지·라벨 칩 0.
5. 옮긴 단언 표에서 삭제·약화 0. 전체 vitest 3회 통과.

## 확정
- ADR-004 개정 2 · SPEC r4.8 · 영환님 2026-10-03 "★A, 확인 1~3 승인".
