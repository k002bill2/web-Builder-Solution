# EDITOR-A3-3 — 테마 바꾸기 · 이미지 슬롯 (하이브리드 기능 단위)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337 · `--max-turns` 100 · **80턴부터 REPORT 우선**
- 서브에이전트 분할: 불필요(금지)
- 선행: **EDITOR-A3-2 병합**(캔버스 CSS 변수·레이아웃 위에 테마 색을 올린다 — 같은 파일이라 순차). SPEC r4.7로 A3-2에서 A3-3으로 번호만 옮김(범위 동일).

## 범위 (SPEC 5.8 · 5.9 · E-S17·S18·S20 · E-AC-21·22·45~47)
- **T1 테마 바꾸기(E-AC-21)**: 대화상자(조작 뒤 로드) 프로필 버전 라디오 · 적용 = `swapTheme` · `diffSlotValues` 0 → "슬롯 값 N개 모두 그대로입니다" · 캔버스 색 = 새 버전 토큰(CSS 변수, hex 0) · E-S18 새 버전 캡션 · 되돌리기.
- **T2 이미지 슬롯(E-AC-22, EQ-3 A)**: `role=switch` 부품(studio 전용) · 대체텍스트 필수 · 장식 체크 · 로컬 파일 JPEG·PNG·WebP · 5MB · 오류 문장 + 이전 이미지 유지 · 보관 캡션 상시 · `crypto.randomUUID()` 로컬 id.
- **T3 이미지 보관소·한도·URL 수명(E-AC-45~47)**: 참조 집합 = **문서 ∪ 실행 취소 ∪ 다시 실행**(스냅샷은 a4 — SPEC r4.6 A3-Q5 A) · 문서 12개·30MB · 탭 24개·60MB(회수량 계산 → 필요한 만큼만 비움 → 아니면 기록 0개 비움 + 거부) · 언마운트 때 URL 0 · 잃은 이미지 "다시 골라 주세요". `blob:` 문자열 저장 0.
- **T4** 전체 3회 · Codex 1회 · REPORT. 스냅샷이 필요한 AC 단언(수동 스냅샷·스냅샷 복원)은 **BLOCKED(a4)**로 표시하고 만들지 않는다.

## 공통 규칙 (모든 a3 레인)
- 기준: `docs/design/2a-05/SPEC.md` r4.7 — 인용은 절·행 번호로. 브리프와 SPEC이 다르면 SPEC이 이긴다(다르면 REPORT에 기록하고 멈추지 말 것).
- TDD RED→GREEN(RED 로그 커밋). 테스트 단언 약화·skip 금지. 새 의존성·새 아이콘 0(S-B7). 새 부품은 `components/studio/`(S-B6). `import type`(S-B8). 화면에서 engine 값 import 금지 — 엔진은 기존 조작 청크(동적 import)로만.
- 상태 지우기에 `navigate(replace)` 금지(C6 경쟁 선례) — `history.replaceState` 또는 화면 상태.
- `design/`·`docs/design/` 수정 금지(Developer). fable(`docs/00-research/buzz/claude-fable.md`) 무접촉. 커밋은 `git commit -- <경로>`.
- **체크포인트 게이트(매 커밋):** 표적 test + **`npx vitest run src/test`(가드 전체)** + typecheck + lint + build(번들 스크립트). 번들: `/studio` 첫 ≤ 99.40 · 진입 ≤ 124.70, **그 밖 화면·공통 ±0.03 이내**, 모든 화면 여유 < 0.3이면 즉시 중지·보고(예산 변경 금지). 대화상자·변형 목록·테마 대화상자·이미지 고르기는 **조작 뒤 로드**(S-B5).
- 마지막에 전체 vitest 3회(`logs/final-full-x3.txt`, load 기록). Codex `review --scope branch --base <시작 커밋>` 1회(턴 남을 때만).
- 서브에이전트 금지(429 이력). 로컬 커밋만. push·병합·삭제 금지. 서버는 127.0.0.1·지정 포트·자기 PID만 종료.
- REPORT(`dev/active/<레인>/REPORT.md`): 커밋 표 · AC 판정(E-AC 번호별 PASS/PARTIAL/BLOCKED + 근거 테스트) · 번들 표(체크포인트별) · SPEC 차이(ADR-003) · 남은 위험.

## 확정
- SPEC r4.6(영환님 "★A 전부", 2026-09-27). 시작 커밋 = 이 브리프가 들어 있는 main.
