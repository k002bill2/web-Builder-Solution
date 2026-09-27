# EDITOR-A3-1 — 섹션 구조 연산 (하이브리드 기능 단위)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337 · `--max-turns` 110 · **85턴부터 REPORT 우선**
- 서브에이전트 분할: 불필요(금지)
- 선행: ENGINE-VARIANTS 병합 뒤 main에서 시작하면 변형 교체 목록에 새 변형이 바로 보인다. 엔진 레인이 늦으면 병렬 시작 가능(쓰기 경로 분리 — 엔진 레인은 `engine/sections`·`data/engineVariantMap`, 이 레인은 `engine/` 쓰기 금지).

## 범위 (SPEC 5.2~5.5 · E-S11~S16 · E-S21 · 5.14 일부)
- **K0** 기준 build · PROGRESS 수신 기록.
- **K1 목적 파생(SPEC r4.6 A3-Q2 A = Q-19 A)**: `features/studio/docPurpose.ts` 하나 — 문서 `profileVersion` 버전의 `adjustments.purpose ?? "none"`. 연산(`canRemove`·`swapVariant`)과 게이트가 같은 함수를 쓴다. 엔진 계약 변경 없음.
- **K2 연산 어댑터 + 실행 취소 스택**: `features/studio/docOps.ts`(엔진 동적 import, instanceId 카운터 주입 — `addSection` 5인자 `{instanceId, motionPreset}`, 연산 뒤 `normalizeDoc`), `undoStack.ts`(최대 50, 편집기 언마운트 때 비움 — 5.14). 알림 줄 "되돌리기" = 바로 앞 연산 1개(Q7). **일반 실행 취소 UI(E-20)는 a4.**
- **K3 위로·아래로(E-AC-17)**: 같은 부품(≥1024 편집 패널 머리 · <1024 탭) · 5.2 경계 표 4행 `aria-disabled` + 이유 문장 · 알림 "…N번째로 옮겼습니다" · 포커스 그대로.
- **K4 삭제·되돌리기(E-AC-19)**: 즉시 삭제 · 알림 줄(`role=status` 글자 + 형제 버튼) · 되돌리기 → 같은 instanceId·값·위치 + 포커스 · 다음 연산 뒤 알림 줄 없음 · 5.4 표(목적 예약·문의 포함) · "프로필에서 목적 바꾸기" 링크.
- **K5 섹션 추가(E-AC-18)**: 네이티브 `dialog`(5.15, 조작 뒤 로드) 유형 → 변형 → 추가 · 삽입 위치 3규칙 · 중복 불가 유형·본문 9개 상한(E-S12) · 새 줄 포커스 · 알림.
- **K6 변형 교체(E-AC-20)**: `details` 라디오 · 캡션 "유지 N · 잃음 M (이름)" = `diffSlots` · 바로 적용 + 알림 + 되돌리기 · 이름표만(키 금지).
- **K7 빈 슬롯(E-AC-24) · 엔진 불변(E-AC-23)**: 캔버스 자리표시 글자 · blur 때만 필수 오류 · 동결 입력으로 8.2 연산 전부 예외 0·입력 불변.
- **K8** 전체 3회 · Codex 1회 · REPORT.
- 게이트 표시(8줄)는 a4 — 이 레인은 게이트 **자리** 유지. 게이트 차단 문장이 필요한 AC(24 "글자 수 줄 차단")는 캔버스·필드 수준까지만, 게이트 줄은 a4로 이관 표시.

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
- SPEC r4.6(영환님 "★A 전부", 2026-09-27). 시작 커밋 = 이 브리프가 들어 있는 main.
