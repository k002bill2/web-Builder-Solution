# M3-1 QA REPORT — 추천 모드 독립 검증 1차(정적·회귀)

대상 tip `62d3aec2`(main `36e825a6` 병합 포함) · 브리프 `QA-BRIEF.md` · 정본 `docs/design/m3/RECO-SPEC.md` r1 + 7a · Developer `REPORT.md`
QA 실행: Orca + Claude Code, 2026-10-18. 브라우저 미사용(2차 run 계획 `QA-LIVE-PLAN.md`). Codex 미사용. 앱·테스트 코드 커밋 0.

## 0. 판정 — **PASS with notes** (1차 정적·회귀 확정)

- FAIL 조건(거짓 성공 · 승인 전 변경 · 결정성 깨짐 · 회귀) **0건**. 게이트 4종 fresh 통과(361 files / 3212 tests), 예산 표 Developer 수치와 소수 둘째 자리까지 일치, main 대비 다른 라우트 증분 0~+0.02.
- 변이(브리프 지정 6종) 결과: M2-1 동점 뒤집기 FAIL 5 · M2-2 품질 순위 포함 FAIL 6 · M2-3 파생 표 1행 FAIL 2 · m3-1a 저장 전 성공 표시 FAIL 3 · m3-2 되돌리기 기록 덮어쓰기 FAIL 1 · 로드 조건(정적 import) — **단위 테스트는 로더 호출 조건만 막고(m4-a FAIL 2), 첫 화면 정적 포함은 검사기(build exit 1)가 막는다(m4-b·m4-c 단위 통과 · 검사기 실패). 두 겹 게이트를 함께 돌려야 막힌다.** 매번 `git checkout`으로 되돌림, 앱·테스트 코드 커밋 0. 원문 `logs/qa-mut-*.txt`.
- 추가 경계 변이 2종은 살아남음 → notes:
  - **note 3 (권고 1건, Developer 후속)**: AC-16 "저장 resolve **전** '적용됨'·status 0"을 직접 재는 단언이 없다. m3-1c(저장 전 낙관 표시 → 실패 시 앞 기록 복원)가 16/16 통과. 현재 코드는 저장 확인 뒤에만 표시(`RecoView.tsx:137-141`)라 결함은 아님. 지연 `savePicks` 목으로 클릭 직후 "적용됨" 0 · status 빈 값을 단언하는 테스트 1개를 권고.
  - note 5: 로드 조건 단위 테스트는 "로더 호출 수"만 잰다 — m4-b(로더 유지 + 정적 side-effect import)·m4-c(`recoLoader.ts` 안쪽을 정적 import로, 호출 모양 유지)는 단위 테스트를 통과하고 검사기 build만 실패(`/catalog` 104.23·104.31 > 101). 검사기 첫 화면 예산 여유는 101 − 100.46 = **0.54KB** — 이보다 작은 정적 포함은 검사기도 통과하며, 멈춤선 100.90은 검사기가 판정하지 않는다(REPORT 수치로 사람이 판정).
- 그 밖 notes: 1 AC-17 "모든 라우트 ±0.03" 문장과 `/catalog` +0.42(AC-14b 멈춤선 안)의 해석 · 2 가중치 단언 자기 참조(간접 고정으로 잡힘) · 4 AC-11 꽉 참 테스트의 카드 고르기 조건 공회전 · 6 AC-10 초안 패널 화면 표시는 단위 미단언 · 7 "하드코딩 문장 0" 자동 가드 없음(정적 확인 통과, 예외 2문장은 Developer REPORT 4절에 기록).
- 보류: RECO-AC-13(390·1280 넘침 · 키보드만)과 AC-08·10의 [V] 부분은 2차 실화면 run(`QA-LIVE-PLAN.md`)에서 판정. 1차 판정은 이 보류를 포함하지 않는다.
- 결정권자 질문(Developer가 이미 올린 것, QA 재현만): `/catalog` 첫 화면 100.46 — 목표 100.15 미달 +0.31, 멈춤선 100.90 안. QA는 판정선(멈춤선) 기준 통과로 본다.

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

- 로그: `logs/qa-gate-*.txt`(tip) · `logs/qa-main-36e825a6-bundle.txt`(main).
- 주의: AC-17 문장 "모든 라우트 첫 화면·진입 ±0.03"을 글자대로 읽으면 `/catalog` +0.42가 걸린다. AC-14(b)가 `/catalog`만 멈춤선 100.90으로 따로 두고, AC-17 제목이 "공용 청크(index-*) 증분"이라 QA는 `/catalog`를 AC-14(b)로 판정했다 — 해석 note 1. 근거 문구: SPEC 7절 "구현 E0 실측이 `/catalog` 첫 화면 100.90 또는 다른 라우트 ±0.03을 넘으면 재상신"(`/catalog`와 다른 라우트를 따로 둔다).
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

- 로그: `logs/qa-mut-m2-{1,2,3}.txt`.
- note 2(테스트 관찰, 결함 아님): `RECO_WEIGHTS` 7개 값을 한 줄로 고정하는 단언은 없고 `b.max === RECO_WEIGHTS[b.item]`(`recommend.test.ts:197`)은 자기 참조다. 다만 T-REC-01 총점·max 70·mood 단언이 값을 간접 고정해 가중치 변이는 잡힌다(M2-2로 확인).

## 3. 승인 전 변경 0 · 적용·되돌리기 · 변이 2종 — PASS with notes

정적 대조:

| 규칙 | 코드 | 테스트 | 판정 |
|---|---|---|---|
| 승인 전 변경 0 (T-REC-06 · AC-09) | RecoView 진입·펼치기·필터는 읽기만(`useReferenceList`·`recommend`) · 미리보기 `previewApply`는 `whenIdle` 뒤 `getBoard`만(`recoApplyFlow.ts:54-68`) | `CatalogPageReco.test.tsx:65` 쓰기 5종(addReference·removeReference·savePicks·confirmProfile·createProfileVersion) 0 + picks 불변 · `:86` 미리보기 → 취소 쓰기 0 | ✅ |
| 적용 = 저장 확인 뒤 성공 (AC-16) | `runApply`는 큐 요청 안에서 `savePicks` resolve 뒤에만 `applied`(`recoApplyFlow.ts:95-96`) · 화면은 `outcome.kind === "applied"`일 때만 `setApplied`·status(`RecoView.tsx:137-141`) | `:123` savePicks 1회 실패 → "적용됨" 0 · alert 1 · 재시도는 savePicks만(addReference 1회) · `:221` revision 충돌 → 쓰기 0 | ✅ (코드) · note 3 |
| 되돌리기 세션 유지 | 모듈 `WeakMap<repository, UndoTicket>`(`RecoView.tsx:44`) — 새로고침이면 사라짐(SPEC 4.3) | `:171` 적용 → `/compare` → 뒤로 → 되돌리기 = 적용 전 picks·columns 깊은 동일 | ✅ |
| 뒤 적용 실패 시 앞 기록 보존 (Codex r1 P2) | 진행(Busy)과 마지막 성공 기록 분리 — 실패 분기는 `setApplied`를 부르지 않음 | `:149` A 적용 → B addReference 실패 → A 되돌리기 = 적용 전 깊은 동일 | ✅ |
| 되돌리기 stale (AC-11) | `board.revision !== ticket.revision` → aria-disabled + 이유 | `:210` | ✅ |

변이(각각 `RecoView.tsx`에 적용 → `npx vitest run CatalogPageReco.test.tsx CatalogPageRecoLoad.test.tsx` → `git checkout`, 되돌린 뒤 dirty 0):

| 변이 | 내용 | 결과 | 잡은 테스트 |
|---|---|---|---|
| m3-1a 적용 성공을 저장 전에 표시 | `runApply` 전에 `setApplied` + status "적용했습니다" | **FAIL 3/16** | AC-16 저장 실패 · Codex P2 · AC-16 충돌 |
| m3-2 되돌리기 기록 덮어쓰기 | 적용 시작 시 `setApplied(null)` | **FAIL 1/16** | Codex r1 P2 회귀 |
| (경계) m3-1b 저장 전 표시 + 실패 시 지움 | 1a + 실패면 `setApplied(null)` | FAIL 1/16 | Codex P2만(부수적으로 — 앞 기록을 지워서 걸림) |
| (경계) **m3-1c 저장 전 표시 + 실패 시 앞 기록 복원** | 1a + 실패면 이전 기록 복원 | **통과 16/16 — 살아남음** | 없음 |

- 로그: `logs/qa-mut-m3-{1a,1b,1c,2}.txt`.
- **note 3 (테스트 공백, 코드 결함 아님)**: AC-16 "`addReference`/`savePicks`가 resolve하기 **전에는** '적용됨'·status 0"을 직접 재는 단언이 없다. 기존 테스트는 실패·충돌 **뒤** 상태만 본다 → m3-1c처럼 "저장 전 낙관 표시 → 실패면 원복"하는 거짓 성공(스크린리더에는 '적용했습니다'가 이미 읽힘, status 문장은 실패 뒤에도 남음)을 막지 못한다. 현재 코드는 정적으로 저장 뒤에만 표시하므로 FAIL 아님. 권고(Developer 후속, 1건): 지연 `savePicks`(deferred promise) 목으로 "적용" 클릭 직후 `queryByText("적용됨")` null · status 비어 있음 · `aria-busy` 버튼을 단언하고 resolve 뒤 표시를 단언하는 테스트 1개. 더 싼 대안: 기존 `CatalogPageReco.test.tsx:123` 테스트에서 alert 뒤 `status`에 "적용했습니다"가 없음을 단언하는 한 줄 — m3-1c(실패 뒤에도 status 문장이 남음)를 잡는다.

## 4. 로드 조건 · 변이 1종 — PASS

- 코드: `CatalogPage.tsx` effect가 `isRec`일 때만 `loadRecoView()`(`recoLoader.ts` = `import("./RecoView")`) · 적용 청크는 RecoView onClick의 `loadRecoApply()`만. 값 정적 import 0 — `git grep`(테스트 제외) 결과 RecoView·RecoApply·recoApplyFlow를 부르는 곳은 로더 2개(`recoLoader.ts:5`·`recoApplyLoader.ts:6`, 동적 `import()`)와 타입 위치뿐(`CatalogPage.tsx:53` `typeof import(...)` · `RecoView.tsx:17`·`RecoApply.tsx:4` `import type` — 빌드에서 지워짐).
- 테스트: `CatalogPageRecoLoad.test.tsx:23` — 로더 모듈을 감싸 호출 수를 센다(tab=all 0 → "추천 받기" 뒤 1 · 근거 펼치기까지 적용 로더 0 → "이 추천 적용" 뒤 1).

| 변이 | 내용 | 단위 테스트 | 검사기 build | 판정 |
|---|---|---|---|---|
| **m4-a 정적 import로 바꾸기**(브리프 지정) | `import RecoViewStatic from ".../RecoView"` + 로더를 `Promise.resolve` 대체 | **FAIL 2/53**(로드 조건 · 청크 실패 재시도) | (미실행) | ✅ 잡힘 |
| (사각 확인) m4-b 로더 호출 유지 + 정적 side-effect import 추가 | `import "../components/reco/RecoView";` 1줄 | 통과 16/16 — 살아남음 | **exit 1** · `/catalog` 첫 화면 104.23 > 101 · `/catalog (추천)` 104.23 > 101 | 검사기만 잡음 |
| (사각 확인) **m4-c 로더 안쪽을 정적 import로**(글자 그대로의 "정적 import로 바꾸기") | `recoLoader.ts`: `import * as RecoView from "./RecoView"; export const loadRecoView = () => Promise.resolve(RecoView);` | 통과 53/53 — 살아남음(테스트 목이 `actual.loadRecoView`를 감싸 호출 수 그대로) | **exit 1** · `/catalog` 104.31 > 101 · `/catalog (추천)` manifest에 RecoView 없음 · `/studio` 128.85 > 128.82 · 복원 131.84 > 131.80 | 검사기만 잡음 |

- 해석(브리프 질문 "tab=all에서 rec 청크 안 받음 테스트가 실제로 막는가"에 대한 답): **단독으로는 아니다.** 단위 테스트는 로더 호출 조건(tab=all 0 · tab=rec 1 · 적용 누름 전 0)만 막고, 청크가 첫 화면에 정적으로 섞이는 회귀(m4-b·m4-c)는 검사기 크기 판정이 막는다(SPEC 5절이 처음부터 둘을 나눈 설계 — 검사기는 로드 조건을, 단위는 크기를 증명하지 못한다). 현재 완료 게이트(test + build 검사기)를 함께 돌리면 4종 모두 막힌다. 남는 사각: 0.54KB 미만 정적 포함(note 5). 결함 아님.
- 로그: `logs/qa-mut-m4-a.txt` · `logs/qa-mut-m4-b-build.txt` · `logs/qa-mut-m4-c.txt`.
- 되돌림: 각 변이 뒤 `git checkout -- src/pages/CatalogPage.tsx`, dirty 0. m4-b build가 남긴 `dist/`는 원본 tip으로 다시 `npm run build` → exit 0 · `/catalog` 100.46 · `/catalog (추천)` 진입 109.07 · `/studio` 128.80 · 복원 131.78(1절과 동일).

## 5. 바뀐 기존 단언 이전/이후 · RECO-AC-01~17 판정표 — PASS with notes

main `36e825a6` 대비 수정된 기존 파일(`git diff --name-status --diff-filter=MDR 36e825a6 HEAD -- app`): 테스트 2 · 소스 5. 삭제·이름 바꿈 0. `bundleBudget.test.mjs`·`m2cBaseline.json`은 main과 같음(병합 때 main 값 유지 — 단언 손실 0).

### 5.1 바뀐 기존 단언

| 파일:줄 | 이전(main) | 이후(tip) | 강도 | 근거 |
|---|---|---|---|---|
| `pages/CatalogPage.test.tsx:198-210` V2-AC-21 | h1 "추천" · 자리 문구 "브리프 기반 추천은 다음 단계에서 제공됩니다." **있음** · "전체 보기" → h1 카탈로그 + tab만 지움 | h1 "추천" 그대로 · `region "추천 결과"` 안 article ≥ 1 · 자리 문구 **없음** · "전체 보기" 단언 그대로 | **같음 이상**(자리 문구 단언 → 결과 존재 + 자리 문구 부재 2개로 교체, 링크 단언 유지) | RECO-SPEC 7절 "기존 테스트 영향" · RECO-AC-08 — 명세가 지정한 의도된 변경 |
| `components/catalog/CompareTrayBar.test.tsx:116` 한도 알림 | `notice="…"`(문자열 prop) | `notice={{ text: "…", key: 1 }}`(Announcement) | **같음**(status 텍스트 단언 동일, prop 형태만) | RQ-09 A(같은 문장 재알림 key) |

- 약화 0. 기존 소스 변경 5개(`check-bundle-size.mjs` 시나리오 1행 추가 · `CompareTrayBar` notice 타입 · `ReferenceCard` children 슬롯 · `CompareTrayContext` `runQueued: enqueue` 노출 · `CatalogPage` rec 분기)는 전부 기존 테스트 361 files 통과 상태에서 들어갔다(1절).

### 5.2 RECO-AC 단위 판정표 (1차 = 정적·단위 기준, [V]는 2차 run에서 실화면 확인)

| AC | 내용(요약) | 증거 | 1차 판정 |
|---|---|---|---|
| 01 | 노출 후보만 · 총점 내림차순 · 최대 5 | `recommend.test.ts:94-127` · M2-1 | ✅ |
| 02 | 동점 id 코드 단위 · 셔플 10회 동일 | `:130`·`:145` · M2-1 FAIL | ✅ |
| 03 | 2회 깊은 동일 · 동결 · 입력 불변 | `:162` | ✅ |
| 04 | 근거 정확히 3 · 정렬 · 0점 채움 · breakdown 7 | `:184-223` · `CatalogPageReco.test:39`(7항목) | ✅ |
| 05 | 파생 표 21행 × R-04/R-03 엔진 대조 + 반례 3 | `recommendSectionFit.test.ts` · M2-3 FAIL | ✅ |
| 06 | 미측정 = unmeasured · 지어낸 숫자 0 | `:261`·`:270` · M2-2 FAIL | ✅ |
| 07 | external_observed 0 | `:280` 대조 | ✅ |
| 08 | 업종·목적 없음 → 근거 부족 + 고르기 포커스 [U]+[V] | `CatalogPageReco.test:52` · V2-AC-21 정정 | ✅ [U] · [V] 2차 |
| 09 | 진입·펼치기·필터 변경 쓰기 0 (T-REC-06) | `:65` 쓰기 5종 0 · picks 불변 | ✅ |
| 10 | 미리보기 취소 0 · 적용(열 ≤1 + savePicks 1) → 초안 · 되돌리기 깊은 동일 [U]+[V] | `:86`(10행 picks · 되돌리기 picks·columns 깊은 동일) · `:171`(/compare 다녀옴) | ✅ [U] · note 6 · [V] 2차 |
| 11 | 열 6 꽉 참 비활성 · 열에 있으면 추가 0 · stale 되돌리기 비활성 | `:191`·`:210`·`:249` | ✅ · note 4 |
| 12 | status 0 신설(트레이 공유) · alert 1 · aria-live 0 · 같은 결과 알림 0 | `:76`·`:236` | ✅ |
| 13 | 390·1280 넘침 0 · 키보드만 [V] | Developer Ego Lite(`logs/e4-ego-lite.txt`) — QA 미재현 | ⏸ 2차 run(`QA-LIVE-PLAN.md`) |
| 14 | (a) 로드 조건 (b) 검사기 `/catalog (추천)` ≤ 125 · `/catalog` ≤ 100.90 · 다른 라우트 ±0.03 | `CatalogPageRecoLoad.test` · m4-a FAIL · m4-b 검사기 FAIL · 1.1 표 | ✅ |
| 15 | 근거 문구 키 표에서만 · hex/px 0 | `recoText.ts` · `noHardcodedStyle.test` 통과(361 files) | ✅ · note 7 |
| 16 | 저장 resolve 전 "적용됨"·status 0 · reject → alert + 재시도(savePicks만) · 충돌 · 되돌리기 실패 같은 규칙 | 코드 `recoApplyFlow.ts:78-122`·`RecoView.tsx:132-166` · `:123`·`:149`·`:221` · m3-1a FAIL | ✅ (코드) · **note 3**(resolve 전 단언 없음 — m3-1c 생존) |
| 17 | 공용 청크 증분 표 · ±0.03 · `/studio` 정규화 | 1·1.1절 재현(공통 +0.01 · `/studio` +0.01) | ✅ · note 1 |

- note 4: `CatalogPageReco.test.tsx:254` 카드 고르기 조건 `queryByRole("link", { name: "" })`는 카드 링크가 제목 링크 1개(이름 = 제목, `ReferenceCard.tsx:118`)뿐이라 늘 null → 조건이 공회전해 항상 첫 카드를 고른다. 지금은 첫 카드(gen-medical-1)가 꽉 찬 6열 밖이라 단언이 유효하지만, 순위가 바뀌면 의도와 다른 카드를 볼 수 있다(테스트 견고성, 결함 아님).
- note 6: AC-10 "초안 패널이 그 레퍼런스 선택을 보임"은 단위에서 저장소 picks 10행으로만 확인 — `/compare` 초안 패널 화면 표시는 단위 단언 없음 → 2차 run 주 흐름 9단계.
- note 7: `noHardcodedStyle.test`는 hex·px만 검사 — "하드코딩 문장 0"은 자동 가드가 없다. 정적 확인: RecoView·RecoApply 문장은 전부 `recoText` 키 · 예외는 CatalogPage 청크 실패 문장 2개(Developer REPORT 4절에 사유 기록, 키 `reco.error`·`reco.retry`와 같은 문장).

## 6. 2차 실화면 계획 — 작성 완료(`QA-LIVE-PLAN.md`, 실행 안 함)

- 도구 ego-browser(Ego Lite)만 · preview 4399 · 이동은 앱 안 클릭만(새로고침 = 메모리 store 초기화) · 폭은 CDP `setDeviceMetricsOverride` 390·1280.
- 주 흐름 11단계(1280 → 390 반복): 필터(의료·예약·가족) → 추천 받기(RecoView 청크 요청 1, 적용 청크 0) → 1~3위·근거 → 근거 펼치기 7항목 → 2개 더 보기 → 적용 미리보기(적용 청크 요청 1) → 취소 → 키보드로 적용 → `/compare` 초안 10행 → 뒤로 → 키보드로 되돌리기 → `/compare` 적용 전 확인.
- 빈·실패·경계 8종: 근거 부족 포커스 · 리테일 0개 · 피트니스 1개 · 화면 청크 차단(CDP `Network.setBlockedURLs`) · 적용 청크 차단 · 열 6 꽉 참 · 적용 뒤 보드 변경 stale · 필터 알림 1회/0회. 저장 reject·revision 충돌은 메모리 저장소라 실화면 재현 불가 → 단위 증거로 갈음.
- 예상 약 20턴(추정, 실패 재현 시 +5).

## 8. 2차 실화면 run (QA-BRIEF-LIVE · tip `d59455d8`) — 진행 중

도구 ego-browser(Ego Lite) v2.1.0만 · `npm run build` exit 0(가드 통과) → `npm run preview -- --port 4399 --strictPort` · 리슨 확인 `127.0.0.1:4399 (LISTEN)` · 청크 `RecoView-CpMYkhU4.js` · `RecoApply-DfQrAdlV.js` · `recoApplyFlow-8Aue5ZeE.js`. 요청 수는 `performance.getEntriesByType('resource')`로 셈. 스크린샷 `shots/`, 원문 `logs/qa-live-*.txt`.

### 8.0′ 실패 상태 먼저 (E4·E5)

| # | 확인 | 결과 | 판정 |
|---|---|---|---|
| E4 | 화면 청크 차단 → alert · 다시 시도 → 카드 | 차단(`RecoView` 응답 0) → h1 "추천" · alert 1 "추천을 불러오지 못했습니다." + "다시 시도" · status 0 · 넘침 0 ✅. **차단 해제 뒤 "다시 시도" → 새 요청 0 · alert 그대로 · 카드 0(2회 반복 동일)**. 원인: 브라우저 모듈 맵이 실패한 `import()`를 캐시 — 같은 페이지에서 `import('/assets/RecoView-CpMYkhU4.js')` reject · `?bust=1` 붙이면 200 ok. 단위 테스트(`CatalogPageRecoLoad.test:41`)는 로더 목이라 못 잡음. 부수: 다시 시도 직후 포커스 BODY | **FAIL(행) — 결함 D1** |
| E5 | 적용 청크 차단 → alert · "적용됨" 0 · 트레이 불변 | 카드 3 뒤 `RecoApply`·`recoApplyFlow` 차단 → "이 추천 적용" → 두 청크 요청 1씩(응답 0) · alert 1 "추천을 적용하지 못했습니다." + "다시 시도" · 대화상자 0 · "적용됨" 0 · 트레이 0/6 → 0/6 · status 0 · 포커스 "이 추천 적용" 유지 ✅. 해제 뒤 "다시 시도" → 새 요청 0 · alert 그대로(D1과 같은 원인 — 적용 쪽도 해당) · 포커스 BODY | **PASS**(AC-16 화면 부분) · 재시도는 D1 |

### 8.1 주 흐름

| # | 확인 | 1280 | 390 |
|---|---|---|---|
| 1~11 | (QA-LIVE-PLAN 1절) | 미확인 | 미확인 |

### 8.2 빈·경계 상태

| # | 결과 | 판정 |
|---|---|---|
| E1·E2·E3·E6·E7·E8 | 미확인 | — |
