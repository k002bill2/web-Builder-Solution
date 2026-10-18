# M3-1 QA REPORT — 추천 모드 독립 검증 1차(정적·회귀)

대상 tip `62d3aec2`(main `36e825a6` 병합 포함) · 브리프 `QA-BRIEF.md` · 정본 `docs/design/m3/RECO-SPEC.md` r1 + 7a · Developer `REPORT.md`
QA 실행: Orca + Claude Code, 2026-10-18. 브라우저 미사용(2차 run 계획 `QA-LIVE-PLAN.md`). Codex 미사용. 앱·테스트 코드 커밋 0.

## 0. 판정 (잠정 — 초안)

**잠정: 검증 진행 중** — 항목 1~6 결과가 채워지면 확정. 현재까지 정적 읽기(엔진 `recommend.ts`·`recommendSectionFit.ts`·`recommend.test.ts`)에서 결정성·근거 규칙 위반 발견 0.

## 1. 게이트 · 예산 재현 — PASS

fresh 실행(QA, tip `62d3aec2`, `app/`에서 순서대로):

| 게이트 | 명령 | 결과 |
|---|---|---|
| typecheck | `npm run typecheck` | exit 0 |
| lint | `npm run lint` | exit 0 |
| test | `npm test -- --run` | exit 0 · **Test Files 361 passed (361) · Tests 3212 passed (3212)** |
| build | `npm run build` | exit 0 · 검사기(예산·preload 가드·썸네일 가드) 통과 |

예산(검사기 출력 그대로, KB gzip):

| 시나리오 | Developer REPORT R2 | QA 재현 | 판정선 | 판정 |
|---|---|---|---|---|
| 공통 JS | 89.10 | 89.10 | 참고 | — |
| `/catalog` 첫 / 진입 | 100.46 / 102.79 | **100.46** / 102.79 | 첫 ≤ 100.90(멈춤) · 진입 ≤ 125 | ✅ 일치 |
| `/catalog (추천)` 첫 / 진입 | 100.46 / 109.07 | 100.46 / **109.07** | 진입 ≤ 125 | ✅ 일치 · 조작 뒤 RecoApply +1.02 · recoApplyFlow +1.01(판정 밖) |
| `/references/:id` | 97.46 / 99.80 | 97.46 / 99.80 | — | ✅ |
| `/compare` | 98.96 / — | 98.96 / 122.67 | — | ✅ |
| `/profile` · `(3안)` | 99.53 | 99.53 / 119.94 · 99.53 / 122.41 | — | ✅ |
| `/projects` | 99.09 | 99.09 / 109.54 | — | ✅ |
| `/studio` 정규화 | 128.80 | **128.80** | 기준선 128.79 + 0.03 → 멈춤 > 128.82 | ✅ |
| `/studio (복원)` 정규화 | 131.78 | **131.78** | 131.77 + 0.03 → 멈춤 > 131.80 | ✅ |

- main 대비(다른 라우트 ±0.03): 아래 1.1에 main `36e825a6` 동일 명령 빌드로 대조.
- 참고(판정 밖): `/catalog` 첫 화면 목표 100.15 미달(+0.31)은 Developer가 결정권자 질문으로 이미 올림(REPORT 0절 R2) — QA는 수치 재현만 확인, 판정은 멈춤선 기준.

## 2. 결정성·근거 (T-REC-01~05) · 변이 3종
(진행 중)

## 3. 승인 전 변경 0 · 적용·되돌리기 · 변이 2종
(진행 중)

## 4. 로드 조건 · 변이 1종
(진행 중)

## 5. 바뀐 기존 단언 이전/이후 · RECO-AC-01~17 판정표
(진행 중)

## 6. 2차 실화면 계획
`QA-LIVE-PLAN.md` (작성 예정)
