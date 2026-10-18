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

### 1.1 main `36e825a6` 대조 (임시 detached worktree `/tmp/qa-m3-main`에서 `npm run build` exit 0 → 제거 완료)

| 시나리오 | main 첫 / 진입 | tip 첫 / 진입 | 증분 | 판정 |
|---|---|---|---|---|
| 공통 JS | 89.09 | 89.10 | +0.01 | AC-17 공용 청크 ±0.03 ✅ |
| `/catalog` | 100.04 / 102.38 | 100.46 / 102.79 | **+0.42 / +0.41** | AC-14(b) 멈춤선 100.90 안 ✅ (추천 분기 몫 — CatalogPage 청크, 공용 청크 아님) |
| `/references/:id` | 97.45 / 99.79 | 97.46 / 99.80 | +0.01 / +0.01 | ✅ |
| `/compare` · `(조정 있음)` | 98.95 / 122.65 | 98.96 / 122.67 | +0.01 / +0.02 | ✅ |
| `/profile` | 99.53 / 119.93 | 99.53 / 119.94 | 0 / +0.01 | ✅ |
| `/profile (3안)` | 99.53 / 122.41 | 99.53 / 122.41 | 0 / 0 | ✅ |
| `/projects` | 99.08 / 109.53 | 99.09 / 109.54 | +0.01 / +0.01 | ✅ |
| `/studio` 정규화 | 128.79 | 128.80 | +0.01 | ✅ (멈춤 > 128.82) |
| `/studio (복원)` 정규화 | 131.77 | 131.78 | +0.01 | ✅ (멈춤 > 131.80) |

- 주의: AC-17 문장 "모든 라우트 첫 화면·진입 ±0.03"을 글자대로 읽으면 `/catalog` +0.42가 걸린다. AC-14(b)가 `/catalog`만 멈춤선 100.90으로 따로 두고, AC-17 제목이 "공용 청크(index-*) 증분"이라 QA는 `/catalog`를 AC-14(b)로 판정했다 — 해석 note 1.
- 참고(판정 밖): `/catalog` 첫 화면 목표 100.15 미달(+0.31)은 Developer가 결정권자 질문으로 이미 올림(REPORT 0절 R2) — QA는 수치 재현만 확인, 판정은 멈춤선 기준.

## 2. 결정성·근거 (T-REC-01~05) · 변이 3종 — PASS

정적 대조(`app/src/domain/recommend.ts` · `recommendSectionFit.ts` ↔ RECO-SPEC 2.1~2.4 · 7a):

| 규칙 | 코드 | 테스트 | 판정 |
|---|---|---|---|
| 같은 입력 2회 → 같은 순위·근거 · 동결 · 입력 불변 (AC-03) | 순수 함수, Date·Math.random·localeCompare 0 (`recommend.ts:70` 코드 단위 비교) | `recommend.test.ts:162` 깊은 동일 + 전 단계 isFrozen + JSON 불변 | ✅ |
| 동점 id 코드 단위 오름차순 (AC-02 · T-REC-02) | `recommend.ts:173` | `:130` medical 4개 15점 동점 순서 + `Z-ref` < `a-ref` 반례(로캘이면 반대) · `:145` LCG 셔플 10회 × 3 브리프 깊은 동일 | ✅ |
| 품질 2항목 순위 제외 (RQ-02 B, 만점 70) | `RECO_WEIGHTS` a11y·perf 0 · `qualityReason` points 0, 측정값은 `value`만 | `:106` max 70 · `:261` 미측정 0/0·value 키 없음 · `:270` 측정 0/0·value = 픽스처 | ✅ |
| 업종 15 · 목적 10 · 무드 10 (RQ-05 A) | `recommend.ts:22-30` | T-REC-01 총점 고정(60 = 15+10+20+15 · 45 · 40) · mood 10/5/0 단언 | ✅ |
| 근거 정확히 3 · (점수 내림차순, 항목 순) · breakdown 7 (AC-04 · T-REC-03) | 안정 정렬 + slice(3) | `:184` 순서 단언 · `:204`·`:215` 0점 no-input/miss 채움 반례 | ✅ |
| external_observed 제외 (AC-07 · T-REC-05) | `recommend.ts:170` | `:280` 완전 일치 후보 internal이면 1위(70) ↔ observed면 제외 대조 | ✅ |
| `RECO_SECTION_FIT` 엔진 대조 (AC-05) | 21행 데이터, 런타임 엔진 import 0 | `recommendSectionFit.test.ts` 21행 × R-04/R-03 + 표 전체 + 반례 3 | ✅ |

변이(각각 적용 → `npx vitest run recommend.test.ts recommendSectionFit.test.ts CatalogPageReco.test.tsx` → `git checkout`으로 되돌림, 되돌린 뒤 dirty 0):

| 변이 | 바꾼 줄 | 결과 | 잡은 테스트 |
|---|---|---|---|
| M2-1 동점 규칙 뒤집기 | `byCodeUnit(a.referenceId, b.referenceId)` → `(b…, a…)` | **FAIL 5/64** | T-REC-01 고정 순위 · 총점 0 제외(medical 순서) · 동점 코드 단위 · 셔플 10회 · external_observed 대조 |
| M2-2 품질 항목 순위 포함 | 가중치 a11y·perf 0 → 15 · 측정값 `⌊s×15/100⌋` 점수화 | **FAIL 6/64** | T-REC-01(max 70) · 미측정 0/0 · 측정 0/0 · 동점 · external 대조(총점 70) |
| M2-3 파생 표 1행 변경 | `"ref-a": INQUIRY` → `BOTH` | **FAIL 2/64** | ref-a 엔진 대조 행 · 표 전체 = 엔진 파생 |

- 로그: `/tmp/qa-m3/m2-{1,2,3}.txt`(세션 임시 — 위 표가 요약 원문).
- note 2(테스트 관찰, 결함 아님): `RECO_WEIGHTS` 7개 값을 한 줄로 고정하는 단언은 없고 `b.max === RECO_WEIGHTS[b.item]`(`recommend.test.ts:197`)은 자기 참조다. 다만 T-REC-01 총점·max 70·mood 단언이 값을 간접 고정해 가중치 변이는 잡힌다(M2-2로 확인).

## 3. 승인 전 변경 0 · 적용·되돌리기 · 변이 2종
(진행 중)

## 4. 로드 조건 · 변이 1종
(진행 중)

## 5. 바뀐 기존 단언 이전/이후 · RECO-AC-01~17 판정표
(진행 중)

## 6. 2차 실화면 계획
`QA-LIVE-PLAN.md` (작성 예정)
