# M4-b-2 QA-REPORT 1차 — React zip 정적·회귀 (브라우저 미사용)

> 대상 tip `89d88dbf` · 2026-10-18 · 표기 [사실]=실행·파일 근거 · [추정] · [미확인]. 앱·테스트 코드 커밋 0, 변이는 매번 `git checkout --` 로 되돌림.

## 판정 (초안 — 항목 진행 중)
| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | fresh 게이트·예산·진입 가드 | **PASS · 위험 1(복원 여유 0)** | 아래 1절 |
| 2 | RZ-AC 재판독 | 진행 중 | |
| 3 | 변이 6종 | 진행 중 | |
| 4 | docker node:22 zip 빌드 | **PASS(앱 테스트 경로 산출)** | 아래 4절 |
| 5 | 메일 첨부 안내 × react-zip 3MB 초과 | **PASS(코드) · 테스트 공백 1건** | 아래 5절 |
| 6 | QA-LIVE-PLAN | 진행 중 | |

## 5. `exportFlow` 메일 첨부 안내 (Hemingway 지적)
- [사실] 브리프의 `exportFlow.ts:76`은 base `631190c7` 기준 줄 번호다. tip에서는 `app/src/features/studio/exportFlow.ts:91`.
- [사실] `exportNotes`(`exportFlow.ts:87-93`)는 `format === "react-zip"`이면 삼항 앞쪽 가지에서 `[reactZipNote, REACT_ZIP_NEXT, (잃은 이미지)]`만 반환하고 끝난다. 91줄 `format !== "static-zip" && bytes > 3MB` 조건은 뒤쪽 가지(static-zip·static-html) 안에만 있다 → **react-zip 결과에 "메일 첨부… 정적 사이트(zip)" 안내가 붙지 않는다.**
- [사실] 테스트 공백: react-zip 결과 줄 단언은 `exportFlowReactZip.test.ts:69`(1.5MB — 3MB 이하) 1건뿐. react-zip **3MB 초과**에서 안내 0을 고정하는 단언이 없다. 삼항 구조가 바뀌면(예: 91줄 조건을 공통으로 끌어올림) 회귀를 못 잡는다. → 권고: `exportNotes({bytes: 3*MB+1, …}, "react-zip")`에 안내 0 단언 1줄 추가(구현 레인 몫 — QA는 앱 테스트 커밋 금지).
- 판정: 브리프 질문("react-zip 3MB 초과에 붙는가") = **붙지 않음(PASS)**. 단 회귀 가드 없음(P3).

## 1. fresh 게이트 · 예산 · 진입 가드
- [사실] `cd app && npm run typecheck` exit 0 · `npm run lint` exit 0 · `npx vitest --run` **369 files / 3342 tests passed** exit 0 · `npm run build` exit 0. (REPORT의 368/3297은 main `dcdabea0` 병합 전 수치 — 병합으로 +1 file / +45 tests.)
- [사실] 예산(tip `89d88dbf` build vs 같은 머신 main `dcdabea0` build — 임시 worktree `$TMPDIR/qa-main-wt`, 측정 뒤 제거):

| 지표 | main | tip | 판정선 | 판정 |
|---|---|---|---|---|
| `/studio` 정규화 진입 | 128.80 | **128.82** | ≤128.83 | PASS(여유 0.01) |
| 복원 진입 정규화 | 131.78 | **131.81** | ≤131.81 | PASS(**여유 0.00** — REPORT 131.80보다 0.01 큼) |
| 렌더 JS · CSS | 84.30 · 8.89 | 84.30 · 8.89 | 증분 0 | PASS |
| /catalog(2) · /references · /compare(2) · /profile(2) | 동일 | 동일 | 증분 0 | PASS |
| /projects 자동 로드 포함(raw) | 109.53 | 109.54 | 증분 0 | PASS [추정: raw 해시 이름 흔들림 — 첫 화면 99.09 동일, 정규화 판정 대상 아님] |

- [사실] 진입 정적 포함 0 가드: 빌드 출력 `React zip 진입 정적 포함 0 가드 통과 · 생성기 청크 assets/reactZip-D8ekioJW.js gzip 53.49KB`. 가드는 음성(진입 집합에 생성기 청크·`M2A-2a K3`·`lockfileVersion` 0) + 양성(생성기 청크에 두 표식 있음 · manifest에 생성기 청크 없으면 실패)을 함께 검사한다(`app/scripts/check-bundle-size.mjs:233-266`). 표식 변이로 양성 쪽 실패를 확인한 결과는 3절 M5.
- 위험(P2): 복원 진입이 판정선과 같은 값(131.81). 다음 진입 변화 +0.01이면 멈춤. 감량 또는 기준선 개정이 다음 레인 전제.

## 4. 산출 zip docker 재현
- 산출 경로: **앱 테스트 경로(vitest)** — 임시 테스트 파일(`qaZipOut.test.ts`, 실행 직후 삭제·커밋 0)에서 `buildReactZip({...m2(referenceRenderInput("ref-a")), date, css: KIT_CSS})` → `$TMPDIR/qa-rz/m2.zip`(741,753 B). `KIT_CSS`는 fixture가 `src/kit/kit.css`·`motion.css`를 fs로 읽은 값이라 **앱 실제 경로(빌드 청크의 `kitCss` fetch)와 다르다** → R1은 2차 실화면 몫.
- 실행: `docker run --rm -v $TMPDIR/qa-rz/m2:/src:ro node:22` 안에서 복사 후 `npm ci && npm run build`.
- [사실] `node=v22.23.3 npm=10.9.9 Linux aarch64` · `npm_ci_exit=0 build_exit=0` · JS 250.12KB(gzip 77.70) · CSS 30.67KB(gzip 5.98) → C3(≤90/30 gzip) PASS. 로그 `raw/qa-zip-build-node22.txt`.
- 차이 기록: REPORT M2 JS 249.62/77.63 → 이번 250.12/77.70 [추정: main 병합 후 킷 원문 변화 또는 date 차이 — 판정 영향 없음].
