# EDITOR-A2-SPEC — Q-17·Q-21 반영 SPEC 개정 + a2 구현 브리프 초안 (Designer)

## 책임/목표
- 책임 Designer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 작업 공간 `editor-a2-spec`, 브랜치 `k002bill2/editor-a2-spec`, base main `17f5cc9`. 코드 수정 없음(문서만).
- **영환님 결정 ★A(2026-09-27)로 승인된 것 — 이 레인은 이것을 SPEC에 반영만 한다**:
  - **Q-17 = 코드 모양 채택**: `createDocFromCandidate(plan, profileVersion, start: DocStart{projectId, updatedAt})` 3인자. SPEC 8.2 개정. `startDoc` 어댑터가 생성 잡 결과 → 엔진 `CandidatePlan` 변환, `updatedAt`은 저장소 `now` 주입 재사용.
  - **Q-21 = 매핑 표 한 곳**: 픽스처 변형(`grid-3` 등) → 엔진 변형 매핑 표를 composer 또는 `startDoc` 어댑터 **한 곳에만** 둔다. 매핑 불가 변형의 처리(가장 가까운 변형 + 캡션? / `UNKNOWN_VARIANT` 오류 상태?)는 Designer가 SPEC 상태·문구로 정한다.
  - 근거 원문: `docs/06-handoff/visual-v2-input/REPORT.md` 3.2절(116~126행), `docs/qa/post-merge/REPORT.md` 63행 부근, 코드 `app/src/engine/doc/createDocFromCandidate.ts`, `app/src/engine/sections/bodySections.ts`, `app/src/fixtures/referenceComparisons.ts`.
- **승인되지 않은 것**: Q-18·Q-19·Q-20·Q-22·Q-23·Q-24. 결정하지 말고 a2에 영향이 있으면 "a2 착수 전 결정 필요"로 표시만.

## 산출물
1. `docs/design/2a-05/SPEC.md` r4 — 8.2(startDoc/DocStart), 매핑 표 위치·불가 변형 상태(E-S 번호 또는 기존 상태 재사용), 13.1 a2 행 갱신. 변경 이력 줄 추가. 다른 절 재설계 금지.
2. `docs/design/2a-05/VARIANT-MAP.md` — 픽스처에 실제로 쓰이는 변형 전체(grep L1) × 엔진 변형 대응표 + 불가 목록.
3. `docs/06-handoff/EDITOR-A2_BRIEF.draft.md` — a2(편집기 틀·저장) Developer 브리프 초안: 범위(SPEC 13.1 a2 행 · E-AC-03~16), 선행(a1-β 병합·profile-headroom), 파일 지도, 번들 예산 예상(`/studio/:projectId` 진입 직후 104.28 기준, 편집기는 lazy 라우트라 다른 화면 순증가 0 원칙), 턴 분할(a2를 2~3개 레인으로 쪼갤 제안), 검증.

## 금지
- 앱 코드·테스트·`design/`(원본) 수정. Q-17·Q-21 외 결정. push·병합·삭제. fable 무접촉.

## 검증
- 매핑 표의 모든 변형 이름을 코드 grep 결과(L1 줄번호)와 대조. SPEC r4 diff는 8.2·매핑·13.1·이력만.
- 서브에이전트 분할: 권장(읽기 전용 2개 — 픽스처 변형 수집 ∥ 엔진 변형·startDoc 계약 조사).
- `--max-turns` 40, 30턴부터 REPORT 우선. REPORT `dev/active/editor-a2-spec/REPORT.md`, 로컬 커밋.
