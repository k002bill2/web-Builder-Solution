# ER-2 PROGRESS — 테마 바꾸기

- base 9d817bd · 브랜치 k002bill2/er-2 · 서브에이전트 0

## 체크리스트
- [x] P0 BRIEF 명시 커밋
- [x] 1단계 T1 — 엔진 구현이 이미 있어 theme.ts 신규 0 · `engine/ops/theme.test.ts` 2건 PASS
- [ ] 2단계 ThemeDialog — BLOCKED: 번들 멈춤(/studio 127.64>127.39) · WIP 브랜치 k002bill2/er-2-wip-bundle에서 GREEN
- [ ] 3단계 편집기 연결 T3·T4·T5 — BLOCKED: 번들 멈춤(같은 사유) · WIP에서 GREEN
- [ ] 4단계 T6·G1 — BLOCKED: 번들 멈춤(같은 사유) · WIP에서 GREEN
- [x] T7 번들 실측 표 — REPORT 1절(초과 → 멈춤)
- [ ] Ego Lite — BLOCKED: 연결 코드가 tip에 없음. task space·서버 생성 0(4337 LISTEN = ER-1 QA 레인 pid 45236, 무접촉)
- [x] 전체 vitest exit0 (228 files / 2050 tests)
- [ ] Codex review --scope branch --base 9d817bd (≤2)
- [x] REPORT.md

## 설계 메모
- `diffSlotValues`는 이미 `engine/ops/diff.ts`에 있음(SPEC 1.1 grep 0과 다름) → theme.ts는 swapTheme + meta 포함 비교(diffDocValues = diffSlotValues + meta)만.
- 대비 개수 = gateCheck 청크의 `runGate`(진입 직후 자동 청크 재사용 — 새 공유 청크 0).
- Ctrl+Z 키보드는 ER-4. 테마 연산은 기록 스택(useSectionOps.run)에 쌓아 ER-4가 그대로 받는다.

## TDD 예측 (RED 전 커밋)
- 1단계 `engine/ops/theme.test.ts` +2: 구현이 이미 있어 RED 불가 → 처음부터 GREEN 예측(엔진 소스 변경 0).
- 2~4단계 새 테스트 12개 예측: ThemeDialog.test 3 · ThemeSwap.test 8 · src/test/gateRowActions.test 1.
  - RED 예측: ThemeDialog 3 실패(모듈 없음 → 파일 실패) · ThemeSwap 8 실패 · gateRowActions 1 실패(대비 줄 행동 없음). 기존 테스트 깨짐 0 예측.
