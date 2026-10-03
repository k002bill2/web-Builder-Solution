# STUDIO-SLIM — `/studio`·`/projects` 진입 직후에서 쓰지 않는 저장소 코드 걷어내기 (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(127.0.0.1, 필요할 때만) · `--max-turns` 50 · `--effort` medium · **38턴부터 REPORT 마감 우선**
- 서브에이전트 분할: 불필요 — 429 이력으로 이 프로젝트는 금지 유지
- 시작 커밋 = 이 브리프가 들어 있는 브랜치(`bec1b38` 기반)
- 선행: M2A-3a E0 정지(`k002bill2/m2a-3a`, `dev/active/m2a-3a/REPORT.md` 2절) · 영환님 ★A(2026-10-03): 낭비 제거를 먼저 하고 실측 뒤 다시 결정
- **REPORT 규칙**: 시작할 때 `dev/active/studio-slim/REPORT.md` 골격(1 커밋 표 · 2 원인 · 3 바꾼 구조 · 4 번들 전후 표 · 5 테스트 · 6 남은 차이·M2A-3a에 넘길 것)을 먼저 커밋하고, 단계를 끝낼 때마다 같은 커밋에 채운다.

## 목적
`/studio/:projectId` 진입 직후 합계(지금 **124.70 / 125**)에서, 그 화면이 **부르지 않는** 비교 보드·3안 생성 저장소 코드를 빼 M2A-3a(게이트 + 내보내기, 시제품 +6.27)가 들어갈 공간을 만든다. **기능·화면·SPEC 변경 0** — 순수 로딩 구조 정리.

## 원인 (Jarvis 확인 — 코드 근거)
- `app/src/data/memoryStudio.ts` `createMemoryStudio`가 store 하나로 `board`(`createMemoryCompareBoardRepository` → `profileDraft`) · `profiles` · `generations`(`createMemoryGenerationRepository`)를 **모두 즉시 만든다.** `projects`만 이미 `createSharedLoader` + 동적 import다.
- `app/src/main.tsx:30`이 `memoryStudio`를 deferred로 받고, `app/scripts/check-bundle-size.mjs:48` `PROJECT_AUTO`가 `memoryStudio`를 `/projects`·`/studio` 진입 직후에 넣는다 → 보드·생성 코드가 `/studio` 진입 합계에 실린다.
- M2A-3a 레인 추정(빌드 안 함): memoryCompareBoardRepository 1.20 · memoryGenerationRepository 0.88 · profileDraft 청크 중 보드 몫 ≈ 3.4 → **−4.5~5.5**. 이 레인이 실측으로 확정한다.

## 범위 (단계 = 체크포인트 · RED→GREEN 커밋)
- **S0 기준선**: 번들 표 전체(공통 · 모든 화면 첫/진입 · 조작 뒤 · 렌더 문서) + `/studio` 진입 직후 모듈별 기여(M2A-3a `logs/e0-attr-optionA.txt` 방식 재사용) `dev/active/studio-slim/logs/s0-*.txt`.
- **S1 구조 결정(실측 시제품 2안 이상 비교 후 택1, REPORT 3절에 표)**: 예시 —
  - (a) `MemoryStudio`의 `board`·`generations`(필요하면 `profiles`)를 `projects`처럼 **같은 store를 공유하는 지연 로더**로. 기존 deferred 래퍼(`deferredCompareBoardRepository` 등)·컨텍스트 인터페이스는 그대로 두고 안쪽 로드만 늦춘다.
  - (b) store·팩토리만 `memoryStudio`에 두고 저장소 구현은 화면별 진입 청크가 가져가게 분리.
  - 판정 기준: `/studio` 진입 감소량 · `/compare`·`/profile`·`/generate`(있다면) 첫/진입 **±0.03 이내 또는 감소** · 같은 store 공유(보드 확정 → 프로필 → 3안 → 프로젝트 흐름 하나의 상태) 유지 · 테스트 `renderApp`의 동기 생성 경로 유지.
- **S2 구현 + 테스트**: 먼저 RED — (1) `/studio`(또는 `/projects`) 진입만으로는 보드·생성 구현 모듈이 로드되지 않음을 확인하는 테스트(동적 import 호출 기록 또는 번들 스크립트 단언 — 방법은 Developer 확정) (2) 보드 확정 → 프로필 → 3안 → 편집 시작까지 **같은 store** 흐름 통합 테스트가 그대로 GREEN. `check-bundle-size.mjs` SCENARIOS의 `auto`·`afterAction` 목록을 실제 로딩에 맞게 갱신(**예산 상수·멈춤선 변경 금지**, 분류 규칙은 머리 주석).
- **S3 추가 여지 (S2 뒤 남은 차이가 M2A-3a 시제품 +6.27을 덮지 못할 때만)**: `/studio` 진입 직후 목록 중 S-B4 "첫 화면·자동 조건"이 아닌 것을 근거와 함께 찾는다(예: 진입 직후 `useAutosaveScheduler` 1.48이 정말 진입에 필요한지 — SPEC 근거 행 인용). **SPEC 분류를 바꿔야 하는 이동은 하지 말고 REPORT에 후보로만** 적는다.
- **S4 검증**: 앱 흐름 브라우저 확인 1회(카탈로그 → 비교 → 확정 → 3안 → B안 편집 시작 → 저장 → 새로고침 없이 `/projects` 목록) — 콘솔 오류 0 · 네트워크 청크 목록 전후 `logs/s4-*.txt`. 전체 vitest 3회 · Codex `review --scope branch --base <시작 커밋>` 1회(턴 남을 때) · REPORT 마감.

## 제외
- M2A-3a 기능(게이트 표시·`requestExport`·버튼) — 이 레인에서 만들지 않는다.
- 예산 상수·멈춤선·ADR-004 변경 · SPEC 문장 변경 · 화면 변화.

## 번들 판정
- 성공 = `/studio/:projectId` 진입 직후 **감소량 실측**(목표: M2A-3a 시제품 +6.27을 넣어도 ≤ 124.70 → 감소 ≥ 6.27). 목표에 못 미쳐도 실패가 아니다 — 실측 감소량과 남은 차이를 REPORT 6절에 숫자로.
- 다른 화면: 첫/진입 모두 **±0.03 이내 또는 감소**. 늘면 그 구조안은 버린다.
- 렌더 문서 JS·CSS 변화 0.

## 공통 규칙
- TDD RED→GREEN(RED 로그 커밋). 단언 약화·skip 금지(이관은 같은 단언 — 표). 새 의존성 0. 엔진 계약·저장소 인터페이스(`CompareBoardRepository`·`ProfileRepository`·`GenerationRepository`·`ProjectRepository`) 시그니처 변경 0. `import type`.
- `design/`·`docs/design/`·`docs/decisions/` 수정 금지. fable 무접촉. 커밋은 `git commit -- <경로>`. **gate.sh(표적 test + `npx vitest run src/test` + typecheck + lint + build) exit 0 확인 후에만 커밋.** `dev/active/m2a-2b/gate.sh` 복사 가능.
- 로컬 커밋만. push·병합·삭제 금지. 서버를 띄웠다면 **끝날 때 자기 PID 종료**.

## 수용 기준
1. `/studio` 진입 직후 감소량 실측 + 다른 화면 ±0.03 이내 또는 감소 + 렌더 문서 변화 0.
2. 같은 store 흐름 통합 테스트 GREEN · 지연 로드 테스트 GREEN · 전체 vitest 3회 통과.
3. REPORT 6절: M2A-3a 재개 시 진입 여유(KB)와, 모자라면 남은 차이.

## 확정
- 영환님 ★A(2026-10-03) · ADR-004 개정 2(변경 없음).
