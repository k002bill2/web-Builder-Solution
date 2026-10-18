# M3-1 REPORT — 추천 모드 구현

브랜치 `k002bill2/m3-reco-impl` · base `268226f2` · 정본 `docs/design/m3/RECO-SPEC.md` r1 + 7a

## 0. 결론

### FIX2 (BRIEF-FIX2, 2026-10-18) — 0번 전제 확인에서 멈춤 (BLOCKED)
- **결론: 트레이·보드가 새로고침에 사라진다 → 브리프 0번 멈춤 조건. 1~6번(D1b revert · "새로고침" 버튼 · 예산 · Ego) 미착수, 코드 변경 0.** 커밋: c17ecb20 BRIEF-FIX2 · (이 REPORT 커밋).
- 전제 표 (새로고침 = `location.reload()` 뒤 남는 것, 코드 근거):

| 상태 | 새로고침 뒤 | 근거 |
|------|------|------|
| 카탈로그 필터·탭(`?tab=rec` 등) | **유지** — URL 쿼리에서 다시 파싱 | `app/src/pages/CatalogPage.tsx:31-32` `useSearchParams` → `parseCatalogParams` |
| 비교 트레이 | **사라짐** — 트레이는 보드 저장소를 읽음 | `app/src/pages/CatalogPage.tsx:36` `useCompareTray` → `app/src/features/compare/CompareTrayContext.tsx:14,67` `CompareBoardRepository.getBoard` |
| 비교 보드(열·선택 행, 추천 적용 결과 포함) | **사라짐** — 메모리 구현, 영속 범위 밖 | `app/src/main.tsx:28` "메모리 구현은 새로고침하면 비어 있다" · `app/src/data/deferredStudio.ts:51` "보드는 영속 범위 밖 — 새로고침마다 빈 보드" (IndexedDB 영속은 `/studio/:id` 프로젝트 진입 entry만 — `deferredStudio.ts` `readEntry`) |
| 추천 적용 되돌리기 기록 | **사라짐** — 모듈 수준 WeakMap(세션 메모리) | `app/src/components/reco/RecoView.tsx:44,85` `lastApplied` |

- 함의: 화면 청크 실패 alert를 "새로고침"으로 바꾸면 필터는 남지만 **트레이에 담은 레퍼런스·보드 편집·되돌리기 기록은 잃는다**. "입력이 사라지지 않음" 전제가 깨지므로 영환님 결정이 다시 필요하다.
- 결정 선택지(권고 순): (a) D1b 수용(현 tip 그대로 — "다시 시도"가 `?retry=1`로 실제 재요청, 입력 유지 · `/catalog` 100.76, +0.30) · (b) "새로고침" 안내로 가되 문구에 "비교 트레이는 비워집니다"를 명시(사실 고지 — 문구 길이만큼 예산 +α, 100.50 초과 가능) · (c) 트레이 담김 0일 때만 "새로고침", 1개 이상이면 D1b "다시 시도"(분기 = 예산 둘 다 부담). **권고 (a)**: 입력 보존·실제 복구가 되는 유일한 안이고 초과분 0.30은 멈춤선 100.90·검사기 101 안.

### FIX1 (BRIEF-FIX1, 2026-10-18) — QA D1 · N1·N2·N4 · 1차 note 3
- **결론: 기능 5항목 완료·검증, 단 D1b(화면 청크 감싸기)는 예산 결정 대기(BLOCKED).** 커밋: e825fcdb BRIEF · 8e93d64a D1a · b379e0ee D1b · dcebcc52 N1 · d1de5406 N4 · 059909dc N2 · 15334ed5 note 3.
- **D1a** 적용 청크 2개(RecoApply·recoApplyFlow)를 각각 `retryableImport`(소스에서 청크 파일을 하나만 읽으므로 `Promise.all` 안에서 따로) · 화면 청크 "다시 시도" 포커스 = 결과 영역 · 적용 재시도 재실패 = 새 alert "다시 시도"(say 시점 포커스가 옛 alert 안이면). 배선 가드 `chunkRetryWiring.test` RED(감싼 로더 기대 3 · 실제 0 → 1 failed / 3 passed, `logs/fix1-d1-red.txt`) → GREEN. 브리프 RED 문장 "1회 실패 뒤 재시도 = 다른 URL → 성공"의 증거는 셋의 합: ① 메커니즘 = 기존 `chunkRetry.test`(실패 → `?retry=1` → 성공) ② 배선 = `chunkRetryWiring.test` 로더 3개 ③ 실화면 = Ego `RecoView-*.js?retry=1` 뒤 카드 3. Vitest 소스는 `import("./RecoView")`(`.js` 없음)라 재시도 URL 경로가 폴백으로 가 단위에서 직접 잴 수 없다.
- **D1b** `loadRecoView = retryableImport(() => import("./RecoView"))` — Ego: 차단 → alert → 해제 → "다시 시도" → `/assets/RecoView-*.js?retry=1` 요청 → 카드 3 · alert 0 · 포커스 `#catalog-results`(BODY 0).
- **예산(BLOCKED — 결정 필요)**: 브리프 전제 "chunkRetry는 이미 진입 직후 청크에 있음"은 `/catalog`엔 해당하지 않는다(진입도 102.79 → 103.11). chunkRetry 청크 gz 306B가 `/catalog` 첫 화면에 새로 들어와 **100.46 → 100.76(+0.30) > +0.05**. 감량 1회 = D1a 단독 실측(`logs/fix1-d1a-build.txt`) **100.48(+0.02)** — 초과분 전부가 화면 로더 감싸기. lazy import(실패 시점에 chunkRetry를 받기) 감량은 기각: 오프라인이면 chunkRetry 청크 자신의 실패가 캐시돼 D1 재발 + 검사기 SCENARIOS 밖(쓰기 경로 밖). 최종(`logs/fix1-final-build.txt`): `/catalog` 100.76/103.10 · `/catalog (추천)` 진입 109.53(≤125) · `/references` 97.46/99.80 · `/compare` 98.96/122.65 · `/profile` 99.53/119.92 · `(3안)` 122.40 · `/projects` 99.08/109.52 · `/studio` 정규화 **128.80**(≤128.80 ✅) · 복원 131.78. 멈춤선 100.90·검사기 101 안. 선택지: (a) **수용**(E4 해결) · (b) `git revert b379e0ee`(→ 100.48, E4 미해결 — 새로고침 말고 복구 경로 0으로 돌아감). **권고 (a)**: 여유 0.14 남고, 대안은 결함 존속.
- **N1** "2개 더 보기" 뒤 포커스 = 4위 카드 제목 링크(Ego 390: 4/5번째 카드 "뷰티 · 밝은 그리드형"). **N2** `flex-col-reverse` → `flex-col` — Ego 390: 취소 top 581 · 적용 top 629 · 열 때 "취소" → Tab "적용" · 375폭 넘침 0 / 1280: 같은 줄 취소(740)·적용(806) 무변화. **N4** 비활성 버튼 `aria-describedby` → 이유 문구(`toHaveAccessibleDescription`). **note 3** 지연 savePicks 목: 클릭 직후 "적용됨" 0 · status 빈 값 · aria-busy → resolve 뒤 표시 — m3-1c 변이 FAIL → 원복 PASS(`logs/fix1-note3-mutant.txt`).
- **N3**(근거 부족 상태 알림 SPEC 내부 상충)은 바꾸지 않음 — SPEC 3.6-5(결과가 바뀌면 1회)를 따름. BACKLOG는 Jarvis.
- 남김(범위 밖 한 줄): RecoView 내부 계산 실패 분기("failed" in computed)의 "다시 시도"도 key 재마운트라 재실패 시 포커스 BODY 가능 — recommend() 예외 경로라 실화면 재현 경로 없음, 이번 미수정.
- **게이트(fresh, tip 15334ed5)**: typecheck 0 · lint 0 · vitest 361 files / 3219 tests 통과(`logs/fix1-test.txt`) · build exit 0 + 검사기 통과. Ego Lite 1회(`logs/fix1-ego.txt`, TaskSpace 44, override·차단 같은 스크립트) · preview 종료 · 4399 리슨 0.
- **Codex adversarial 1회**(`--scope branch --base b59c66e7`, `logs/fix1-codex.txt`): needs-attention — P2 1건 = 위 예산 초과(이미 BLOCKED로 기록, 같은 결론). 재시도·포커스·저장 경로 추가 결함 0. 반영 = 수용/revert 결정을 위해 D1b를 단독 커밋으로 분리(코드 변경 없음).

### R2 (BRIEF-R2, 2026-10-18) — main 병합 · `/catalog` 감량 1회
- **병합** `bf8329e4`(origin/main `36e825a6` PR #45 B-M4A-08): 충돌 2파일(`m2cBaseline.json`·`bundleBudget.test.mjs`)은 main 값 128.79·131.77 그대로 — 이 브랜치 상향(128.72·131.70)은 버림(두 파일에서 이 브랜치가 바꾼 것은 기준선 값·note뿐임을 `git diff 268226f2 606af16d`로 확인, 단언 손실 0). 병합 fresh build(`logs/r2-merge-build.txt`): `/studio` 정규화 **128.80**(≤ 128.82 ✅) · 복원 **131.78**(≤ 131.80 ✅). **`/studio` 증분 = 128.80 − 128.79 = +0.01** · 복원 증분 = 131.78 − 131.77 = +0.01.
- **감량 1회** `13f17354`: 추천 청크 상태 `{View?, failed?}` → 값 하나(`undefined` 받는 중 · `null` 실패 · 컴포넌트). DOM·ARIA·로드 조건 변화 0(`CatalogPageRecoLoad`·`CatalogPageReco` 16/16). CatalogPage 청크 gzip 7376 → 7347B · **`/catalog` 첫 화면 100.48 → 100.46**(base 100.05 대비 +0.41). 수치는 raw gzip(해시 정규화 아님) — 해시 이름 흔들림 최대 약 0.02라 감량 효과는 경계값. **목표 ≤ 100.15 미달(차이 0.31)** — 동작 변화 0 수단으로는 닿지 않는다(아래 원인별 B 표).
- **R1 0절 감량 후보 정정**: "스켈레톤·실패 alert를 RecoView 쪽으로 옮기기"는 성립하지 않는다 — 스켈레톤은 RecoView 청크를 받는 동안, 실패 alert는 그 청크를 받지 못했을 때 보이므로 그 청크 안에 둘 수 없다.
- **게이트(fresh, 최종 코드 `13f17354`)**: typecheck 0 · lint 0 · vitest 361 files / 3212 tests 통과(`logs/r2-gate-test.txt`) · build exit 0 + 검사기 통과(`logs/r2-trim-build.txt`). Ego Lite 생략 — 감량이 DOM 구조·상태 부품 위치를 바꾸지 않음(상태 표현만 변경, 단위 16/16). preview 미기동(4399 리슨 0).
- **결정권자 질문(수치)**: `/catalog` 첫 화면 100.46(멈춤선 100.90 안, 남은 여유 0.44). 선택지 — (a) **수용**(AC-14b 통과 그대로) · (b) 동작 변화 허용: 스켈레톤 제거 −0.04 · 실패를 라우트 오류 경계로 넘김 −0.10(+effect 일부) → 바닥 약 100.32, 그래도 목표 밖 · (c) 동적 import 프리로드 래퍼(`__vite__mapDeps` 0.07 + 로더 0.03) 설정 변경 — 전 라우트 영향이라 별도 레인. 권고 (a).

### R1
- **완료**: RECO-SPEC r1 + 7a(RQ-01~11 ★안)대로 추천 모드(점수 reco-v1 · 근거 3 · tab=rec 화면 · 승인 후 적용 → 되돌리기)를 구현했다. 엔진 계약 변경 0 · 저장 스키마 변경 0 · 새 의존성 0 · `features/studio` 접촉 0.
- **예산(RQ-11 A 조건부 → 충족)**: `/studio` 정규화 128.72 ≤ 128.74(원 기준선 128.71 대비 절대 판정) · 복원 진입 131.70 · 다른 라우트 첫 화면·진입 ±0.03 이내 · `/catalog (추천)` 진입 109.08 ≤ 125.
- **결정권자 확인 필요 수치**: `/catalog` 첫 화면 100.05 → **100.47(+0.42)** — 멈춤선 100.90 안이라 AC-14b 통과지만 SPEC 5절 추정(+0.00~0.05)의 약 8배이고 남은 여유 0.85의 절반을 쓴다(rec 분기·청크 로더·실패 alert·스켈레톤 · status Announcement · 카드 children 슬롯). 개정 7 결정 2("늘어난 몫은 썸네일 연결에만")의 취지와 겹치므로 Jarvis 판단 대상. 추가 감량 후보: 스켈레톤·실패 alert를 RecoView 쪽으로 옮기기. 감량 1회(원인 2개 제거) 뒤 통과 — ADR-004 새 개정 상신 불필요. 기준선 `m2cBaseline.json` 실측 갱신(128.72·131.70)은 최종 커밋에서 1회.
- **게이트(fresh, 최종 코드)**: typecheck 0 · lint 0 · vitest 359 files / 3206 tests 통과 · build exit 0(검사기 포함). Ego Lite 390·1280 통과 + BRIEF 순서(적용 → `/compare` 초안 → 뒤로 → 되돌리기) 통과(`logs/e4-ego-lite.txt` 2차). Codex adversarial 1회 → P2 1건 반영(7절).
- **발견 1(범위 밖)**: 큐레이션 6개는 예약 섹션이 없어 예약 브리프에서 섹션 20점을 잃는다(ref-a~d는 `purpose: booking` 태그) — 큐레이션 레인 판단 필요(3절 E1).
- E0 예산 관문 **통과** — Provider 통로 `runQueued`(= 기존 `enqueue` 노출, 본문 0) 증분: 공통 +0.01 · `/studio` 정규화 128.72 ≤ 128.74 · 다른 라우트 ±0.01~0.03 이내 → RQ-11 A 조건 충족, 계속.
- 21개 레퍼런스 비교 행 커버리지: 전부 선택 가능 10/10행 (SPEC 3.3 [미확인] 해소).

## 1. E0 예산 실측 (RECO-AC-17, `npm run build` · 로그 `logs/e0-build-base.txt`·`logs/e0-build-runQueued.txt`)

| 시나리오 | base 첫 화면 | base 진입 | +runQueued 첫 화면 | +runQueued 진입 | 증분(첫/진입) |
|---|---|---|---|---|---|
| 공통 JS | 89.09 | — | 89.10 | — | +0.01 |
| `/catalog` | 100.05 | 102.39 | 100.04 | 102.38 | −0.01 / −0.01 |
| `/references/:id` | 97.46 | 99.80 | 97.45 | 99.79 | −0.01 / −0.01 |
| `/compare` | 98.95 | 122.66 | 98.94 | 122.63 | −0.01 / −0.03 |
| `/profile` | 99.52 | 119.92 | 99.53 | 119.92 | +0.01 / 0 |
| `/profile (3안 있음)` | 99.52 | 122.40 | 99.53 | 122.39 | +0.01 / −0.01 |
| `/projects` | 99.09 | 109.53 | 99.08 | 109.52 | −0.01 / −0.01 |
| `/studio/:projectId` | 91.33 | raw 130.01 · 정규화 128.71 | 91.33 | raw 129.99 · **정규화 128.72** | 0 / +0.01(정규화) |
| `/studio (복원 진입)` | 91.33 | 정규화 131.69 | 91.33 | 정규화 131.70 | 0 / +0.01 |

- 음수 증분은 청크 해시 이름 흔들림(raw) — 판정은 정규화 기준.
- 감량: 불필요(판정선 안). 기준선 `m2cBaseline.json` 실측 갱신(7a)은 **E4 최종 실측 커밋에서 1회** — 지금 128.72로 올리면 검사기 멈춤선이 128.75가 되어 RQ-11 절대선 128.74보다 느슨해진다. RQ-11 판정은 원 기준선(128.71) 대비 절대값으로 REPORT에서 따로 한다.

### 최종 실측 (`logs/gate-build.txt`, 최종 코드 build exit 0)

| 시나리오 | base 첫 화면 / 진입 | 최종 첫 화면 / 진입 | 증분 | 판정 |
|---|---|---|---|---|
| 공통 JS | 89.09 | 89.09 | 0 | — |
| `/catalog` | 100.05 / 102.39 | 100.47 / 102.81 | +0.42 / +0.42 | 첫 화면 ≤ 100.90 멈춤선 ✅ (rec 분기·로더·status Announcement·카드 children) |
| `/catalog (추천)` 신설 | — | 100.47 / 109.08 | — | ≤ 125 ✅ · 조작 뒤 RecoApply·recoApplyFlow 각 +1.0(공유 recoRows 포함) |
| `/references/:id` | 97.46 / 99.80 | 97.45 / 99.79 | −0.01 | ✅ |
| `/compare` | 98.95 / 122.66 | 98.95 / 122.65 | 0 / −0.01 | ✅ |
| `/profile` | 99.52 / 119.92 | 99.53 / 119.92 | +0.01 / 0 | ✅ |
| `/profile (3안)` | 99.52 / 122.40 | 99.53 / 122.40 | +0.01 / 0 | ✅ |
| `/projects` | 99.09 / 109.53 | 99.08 / 109.52 | −0.01 | ✅ |
| `/studio` 정규화 | 128.71 | 128.72 | +0.01 | ≤ 128.74 ✅ (RQ-11) |
| `/studio (복원)` 정규화 | 131.69 | 131.70 | +0.01 | ≤ 131.72 ✅ |

### R2 병합 후 실측 (`logs/r2-merge-build.txt` 병합 직후 · `logs/r2-trim-build.txt` 감량 뒤 최종)

| 시나리오 | R1 최종 | 병합 직후 | 감량 뒤(최종) | 판정 |
|---|---|---|---|---|
| 공통 JS | 89.09 | 89.10 | 89.10 | — |
| `/catalog` 첫 / 진입 | 100.47 / 102.81 | 100.48 / 102.82 | **100.46** / 102.79 | ≤ 100.90 ✅ · 목표 100.15 ✗(+0.31) |
| `/catalog (추천)` 진입 | 109.08 | 109.09 | 109.07 | ≤ 125 ✅ |
| `/references/:id` | 97.45 | 97.47 | 97.46 | ✅ |
| `/compare` | 98.95 | 98.96 | 98.96 | ✅ |
| `/profile` · `(3안)` | 99.53 | 99.54 | 99.53 | ✅ |
| `/projects` | 99.08 | 99.10 | 99.09 | ✅ |
| `/studio` 정규화 | 128.72 | 128.80 | 128.80 | 기준선 128.79 + 0.03 → ≤ 128.82 ✅ (증분 +0.01) |
| `/studio (복원)` 정규화 | 131.70 | 131.78 | 131.78 | ≤ 131.80 ✅ (증분 +0.01) |

#### `/catalog` 첫 화면 증분 원인별 B (병합 직후 CatalogPage 청크 7376B 기준 · 구간을 지운 사본의 gzip 차, `logs/r2-measure.mjs <청크 경로>`로 재현)

| 원인 | B | 옮김/감량 | 사유 |
|---|---|---|---|
| `__vite__mapDeps`(RecoView 청크 + index.css 목록) | 71 | 불가 | 동적 import 자체의 프리로드 래퍼 — 빌드 설정 변경 필요(전 라우트) |
| 로더 `()=>import("./RecoView")` + 프리로드 호출 | 27 | 불가 | 같은 이유 |
| 로드 effect + 상태 | 72 | **감량 −29** | 상태 값 하나로 합침(이번 감량) |
| 실패 alert(문장 + 다시 시도) | 99 | 불가 | 청크를 못 받았을 때 보이므로 그 청크 안에 둘 수 없다 |
| 스켈레톤 3칸(aria-busy) | 42 | 불가 | 청크를 받는 동안 보이므로 그 청크 안에 둘 수 없다 |
| status Announcement(key·useRef·useCallback) | 41 | 불가 | 같은 문장 재알림(RQ-09 A) 동작 |
| 그 밖(aria-label 분기 · 히어로 포커스 · 전체 보기 링크 · 카드 children · RecoView용 export 2개) | ≈ 50 (추정: 증분 430 − 측정 377) | 불가 | 동작·청크 공유에 필요 · 구간별 미측정 |
| 합계(측정 구간) | 377 | −29 | 100.48 → 100.46 |

## 2. 생성 레퍼런스 비교 행 커버리지 (`logs/e0-coverage-21.txt`)
- 21개(큐레이션 6 + 생성 15) 전부 `available`, 선택 가능 행 10/10 (binding null 0). → 적용 시 picks 대상 = 10행 전부.

## 3. 단계별 진행
- E0 ✅ · E1 ✅ (서브에이전트 worktree → cherry-pick 89490499) · E2 ✅ · E3 ✅ · E4 진행

### E1 (T-REC-01~05 · RECO-AC-01~07 · AC-05 가드) — `logs/e1-red.txt`(45 실패) → `logs/e1-green.txt`(50/50)
- `RECO_SECTION_FIT` 21행(엔진 `requiredSectionIssues` R-04·R-03만 걸러 대조): `[booking, inquiry]` 7 = gen-beauty-1·3, gen-cafe-fnb-2, gen-education-2·4, gen-medical-1·3 · `[inquiry]` 14 = ref-a~f, gen-beauty-2, gen-cafe-fnb-1, gen-education-1·3, gen-medical-2, gen-professional-1~3.
- T-REC-01(`medical · family · booking`) 상위 5: gen-medical-1 60 · gen-medical-3 60 · gen-beauty-3 45 · gen-education-4 45 · ref-c 40 — AC-01(5개·내림차순) 충족. SPEC 6절 대응표 "medical 4개 + 다른 업종 1"과 다름(아래 발견 1).
- **발견 1 (데이터, 범위 밖 — 후속 큐레이션 판단)**: 큐레이션 6개는 상세 섹션에 예약 변형(`contact/booking`)이 없어 R-04 불충족인데 ref-a·b·c·d는 `purpose: booking` 태그. 예약 목적 브리프에서 큐레이션 후보는 섹션 20점을 늘 잃는다(gen-medical-2도 문의만 충족 → 5위 밖). 배점·표·픽스처는 바꾸지 않았다(엔진 판정 그대로가 RQ-06 A의 의도). 태그 정정 또는 상세 섹션 보강은 큐레이션 레인 결정 사항.

### E2·E3 (RECO-AC-08~12·14a·16) — `logs/e2-red.txt`(9 실패) → `logs/e2-green.txt`(47/47)
- 화면 청크 `RecoView`(tab=rec effect 로드) · 적용 청크 `RecoApply`+`recoApplyFlow`(onClick 로드, `recoApplyLoader`) · 로드 조건 테스트 `CatalogPageRecoLoad.test`(tab=all 0 → 추천 받기 1 → 적용 누름 전 0 → 1).
- 적용 = `runQueued` 안에서 getBoard(revision 대조) → (열 없으면) addReference → getComparison binding 있는 행 → savePicks. 결과는 요청 안 기록으로만 판정(AC-16). 되돌리기 = savePicks(적용 전) → 새로 넣은 열이면 removeReference. 트레이 보드 revision ≠ 적용 revision이면 되돌리기 비활성.

### E2 예산 감량 1회 기록 (AC-17)
- 1차 실측: 공통 89.40(+0.30) · `/studio` 정규화 128.98 → **실패**. 원인 ① 추천 청크가 `domain/compareBoard` 값(PICKABLE_ROW_IDS·rowDef)을 import → 번들러가 compareBoard를 index에서 떼어 공유 청크(0.74)로.
- 2차: `components/reco/recoRows.ts`(행 표 사본 + `recoRows.test` 단일 정의 대조 가드) → 공통 89.15 · `/studio` 128.77 → 여전히 초과. 원인 ② `RecoApply`가 RecoView 청크의 `recoText`를 import → 동적 import 대상 청크가 다른 청크에 export → namespace 객체 도우미(`__export`)가 공용 react 청크에 +0.05.
- 3차(감량 1회 완료): 대화상자에 문구 함수를 props로 전달 → 공통 89.09(= base) · `/studio` 128.72 · 복원 131.70 → **통과**. (1·2·3차는 같은 감량 단계 안의 원인 제거 — 기능 변경 0)

## 4. 목업·명세와 다르게 한 부분
- `runQueued`는 기존 `enqueue`를 그대로 노출(새 함수 본문 0) — 성공·실패 판정은 요청 안에서 호출자(rec 청크)가 한다. 공용 청크 증분 최소화 목적.
- 파생 표 파일명 `domain/recommendSectionFit.ts`(SPEC 4.1 제안 `recoSectionFit.ts`) — BRIEF 쓰기 경로 `domain/recommend*`에 맞춤. 상수명 `RECO_SECTION_FIT`은 SPEC 그대로.
- 품질 2항목 측정값 근거는 상태 `match` + `value`(SPEC 2.4 상태 5종 안에서 표현, 순위 점수 0/0).
- 부제 `reco.brief.summary`는 h1 부제가 아니라 미표시 — 키 표가 rec 청크 안이라 첫 화면(`/catalog` 멈춤선)에 문구 표를 싣지 않으려고. 입력 요약은 필터 칩·레일이 이미 보인다.
- 청크 로드 실패 alert 문장은 첫 화면(CatalogPage)에 키 `reco.error`·`reco.retry`와 같은 문장으로 직접 둔다(키 표는 그 청크 안).
- 미리보기 차이 목록의 값 = 행별로 고른 **레퍼런스 제목**(지금 → 새). 비교 셀 라벨은 미리보기에서 받지 않는다(생성 레퍼런스는 담기 전 비교 카탈로그 밖 — 적용 시점에 `getComparison`으로 binding 있는 행만 저장).
- 적용 실패·충돌 alert는 카드 안이 아니라 추천 결과 영역 위 1자리(SPEC 3.4 "화면 alert 1 — 같은 자리 재사용").
- 390 폭 순위·총점 줄은 제목 줄 오른쪽이 아니라 카드 아래 추천 줄 첫 줄(카드 본문은 기존 `ReferenceCard` 그대로 재사용 — children 슬롯만 추가).
- `RecoApply`(대화상자)와 `recoApplyFlow`(본문)를 한 로더가 함께 받는다 — 컴포넌트 파일 비컴포넌트 export 경고(react-refresh) 회피.

## 5. 기존 테스트 정정 (의도된 변경)

| 파일 | 이전 | 이후 | 근거 |
|---|---|---|---|
| `pages/CatalogPage.test.tsx` V2-AC-21 | `?tab=rec&industry=beauty` → 자리 문구 "브리프 기반 추천은 다음 단계에서 제공됩니다." 단언 | 같은 URL → `region "추천 결과"` 안 카드 ≥ 1 + 자리 문구 없음. "전체 보기" → tab만 지움 단언은 그대로 | RECO-SPEC 7절 "기존 테스트 영향" · RECO-AC-08 |
| `components/catalog/CompareTrayBar.test.tsx` 한도 알림 | `notice="…"`(문자열) | `notice={{ text: "…", key: 1 }}`(Announcement) — 단언 동일 | RQ-09 A(같은 문장 재알림 key) |

## 6. 수용 기준 대응 (RECO-AC)
| AC | 증거 |
|---|---|
| 01·02·03·04·06·07 · T-REC-01~05 | `domain/recommend.test.ts`(21개 실픽스처, LCG 셔플 10회, 동결·불변, 근거 3·breakdown 7, 미측정 value 0, external_observed 제외) |
| 05 | `domain/recommendSectionFit.test.ts` — 21행 × R-04·R-03만 엔진 대조 + 정의 존재 + 반례 3 |
| 08 | `CatalogPageReco.test` 근거 부족 + 업종 칩·"콘텐츠 목적" 레일 포커스 · V2-AC-21 정정 |
| 09 · T-REC-06 | `CatalogPageReco.test` 진입·펼치기·필터 변경 쓰기 호출 0 · picks 불변 |
| 10 · 16 | `CatalogPageReco.test` 취소 쓰기 0 · 적용(저장 resolve 뒤 "적용됨"·status) · 되돌리기 깊은 동일 · `/compare` 다녀온 뒤 되돌리기 깊은 동일 · savePicks 실패 → alert + 재시도는 savePicks만 · 미리보기 뒤 보드 변경 → 충돌 alert + 쓰기 0 · Codex 회귀(뒤 적용 실패 후 앞 되돌리기) · 화면 청크 실패 → alert + 다시 시도(`CatalogPageRecoLoad.test`) |
| 11 | 열 6 꽉 참 → aria-disabled + 이유 · 이미 열에 있는 생성 레퍼런스 → addReference 0 · savePicks 1 · 적용 뒤 다른 카드 비교 추가 → 되돌리기 aria-disabled + `reco.undo.stale` |
| 12 | status 1(트레이 공유) · alert 0(정상) · aria-live 0 · 결과 바뀌는 필터 → status 1회, 같은 결과(레이아웃) → 0 |
| 13 | Ego Lite 390·1280 넘침 0 · 키보드만 적용·되돌리기 |
| 14 | (a) `CatalogPageRecoLoad.test` tab=all 0 → 1 · 적용 청크 누름 전 0 (b) 검사기 `/catalog (추천)` 109.04 ≤ 125 · `/catalog` 100.47 ≤ 100.90 |
| 15 | 문구 키 표 `components/reco/recoText.ts` · `noHardcodedStyle.test` 통과 (예외: 청크 실패 문장 1줄 — 4절) |
| 17 | 1절 표 |

## 7. Codex adversarial-review (1회, `--scope branch --base 268226f2`, 원문 `/tmp` 출력 요약)
| # | 지적 | 판정 | 반영 |
|---|---|---|---|
| 1 | [P2] 뒤 추천 적용이 실패하면 앞 적용의 되돌리기 기록(UndoTicket)이 pending 상태에 덮여 사라짐 (`RecoView.tsx:128-130`) | 타당 — RED 재현(`logs/codex-r1-red.txt`) | 진행 상태(Busy)와 마지막 성공 UndoTicket 분리, 회귀 테스트 추가 → GREEN(`logs/codex-r1-green.txt`) |
- 라운드: 1회 + 반영 1회(BRIEF). 재리뷰 없음.

## 8. 미결 · 후속
- 근거 문구 최종 문안(Hemingway) — 키 표 `recoText.ts` 임시 문안.
- 발견 1(큐레이션 예약 섹션·태그 불일치) 큐레이션 레인 결정.
- 되돌리기 기록 = 세션 한정(모듈 WeakMap, 키 = 보드 저장소 인스턴스) — `/compare`에 다녀와도 남고 새로고침이면 사라진다(SPEC 4.3). 처음 구현은 화면 한정이라 BRIEF E4 순서를 못 채웠고, 마감 전 advisor 점검에서 고쳤다.
- 저장소 규칙(범위 밖): 생성 레퍼런스가 `addReference` 없이 보드 열에 들어 있으면(초기 보드 주입·복원) 비교 카탈로그가 넓혀지지 않아 `getComparison` = missing → 적용 실패(alert). 실제 앱 경로(트레이 담기)는 넓혀진다. 복원 경로는 영속 레인 확인 필요.
- 테스트 파일명은 BRIEF 쓰기 경로에 맞춰 `pages/CatalogPage*`·`CompareTrayContext.*`로 정리(`CatalogPageReco.test`·`CatalogPageRecoLoad.test`·`CompareTrayContext.runQueued.test`). logs의 옛 이름은 이력.
