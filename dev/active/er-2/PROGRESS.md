# ER-2 PROGRESS — 테마 바꾸기

- base 9d817bd · 브랜치 k002bill2/er-2 · 서브에이전트 0

## 체크리스트
- [x] P0 BRIEF 명시 커밋
- [ ] 1단계 엔진 `engine/ops/theme.ts`(swapTheme·diffDocValues) — T1
- [ ] 2단계 ThemeDialog(조작 뒤 청크) — T2
- [ ] 3단계 편집기 연결(적용·알림·되돌리기·E-S18·?v=) — T3·T4·T5
- [ ] 4단계 게이트 대비 줄 행동 2개 + G1 가드 — T6·G1
- [ ] T7 번들 실측 표(/studio ≤127.39)
- [ ] Ego Lite preview 4337 1280·390 캡처 · finish · listTaskSpaces()=[] · 서버 종료
- [ ] 전체 vitest exit0
- [ ] Codex review --scope branch --base 9d817bd (≤2)
- [ ] REPORT.md

## 설계 메모
- `diffSlotValues`는 이미 `engine/ops/diff.ts`에 있음(SPEC 1.1 grep 0과 다름) → theme.ts는 swapTheme + meta 포함 비교(diffDocValues = diffSlotValues + meta)만.
- 대비 개수 = gateCheck 청크의 `runGate`(진입 직후 자동 청크 재사용 — 새 공유 청크 0).
- Ctrl+Z 키보드는 ER-4. 테마 연산은 기록 스택(useSectionOps.run)에 쌓아 ER-4가 그대로 받는다.

## TDD 예측 (RED 전 커밋)
- 1단계 `engine/ops/theme.test.ts` +2: 구현이 이미 있어 RED 불가 → 처음부터 GREEN 예측(엔진 소스 변경 0).
- 2~4단계 새 테스트 12개 예측: ThemeDialog.test 3 · ThemeSwap.test 8 · src/test/gateRowActions.test 1.
  - RED 예측: ThemeDialog 3 실패(모듈 없음 → 파일 실패) · ThemeSwap 8 실패 · gateRowActions 1 실패(대비 줄 행동 없음). 기존 테스트 깨짐 0 예측.
