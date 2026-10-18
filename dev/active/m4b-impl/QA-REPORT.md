# M4-b-2 QA-REPORT 1차 — React zip 정적·회귀 (브라우저 미사용)

> **판정 확정: 조건부 PASS — P1 1건(M6 변이 생존 · RZ-AC-18 통합 공백), P2 2건(복원 예산 여유 0 · react-zip UI 흐름·진입 가드 단위 테스트 부재). R1·R2·R4는 2차 실화면(`QA-LIVE-PLAN.md`).**
> 대상 tip `89d88dbf` · 2026-10-18 · 표기 [사실]=실행·파일 근거 · [추정] · [미확인]. 앱·테스트 코드 커밋 0, 변이는 매번 `git checkout --` 로 되돌림.

## 판정 (확정)
| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | fresh 게이트·예산·진입 가드 | **PASS · 위험 1(복원 여유 0)** | 아래 1절 |
| 2 | RZ-AC 재판독 | **조건부 PASS — 충족 14 · 부분 8 · 미충족 0 (이름만 맞는 테스트 0, 약한 단언 8)** | 아래 2절 |
| 3 | 변이 6종 | **5/6 잡힘 · M6 생존(P1)** | 아래 3절 |
| 4 | docker node:22 zip 빌드 | **PASS(앱 테스트 경로 산출)** | 아래 4절 |
| 5 | 메일 첨부 안내 × react-zip 3MB 초과 | **PASS(코드) · 테스트 공백 1건** | 아래 5절 |
| 6 | QA-LIVE-PLAN | **작성(계획만)** | `QA-LIVE-PLAN.md` |

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

## 2. RZ-AC 판정표 재판독 (테스트가 AC 하위 조건을 실제로 단언하는가)
- 방법: 읽기 전용 서브에이전트(code-explorer, 테스트 미실행)가 SPEC 5.1 문장을 하위 조건으로 쪼개 각 테스트의 expect를 판독 → QA가 핵심 항목(18·20·11·15)을 3절 변이로 실측 교차 확인.
- 결론: "제목만 AC를 말하고 단언이 없는" 테스트 **0**. 단 하위 조건 일부가 비어 있는 **부분 8건**. 03·05·06·07·10·12·14·15·16·19·C1·C3 + 08·11(핵심 조건 충족) 은 충족.

| ID | 판정 | 근거 | 빈 하위 조건 |
|---|---|---|---|
| 02 | 부분 | `data/memoryExport.test.ts:103` | react-zip **UI 흐름**(검사→차단→확인→저장→requestExport 1회) 단언 0 — ExportFlow.test.tsx에 react-zip 0건. REPORT "기존 경로 공유" 근거뿐 |
| 18 | 부분 | `checkReactZipEntries.test.ts:62-72` · `exportFlowReactZip.test.ts:82-89` | 흐름 테스트가 **가짜 오류**(`Object.assign(new Error, {shown, retry:false})`) — 실제 `ReactZipError`→refused 통합 미검증. **변이 M6 생존으로 실증**(3절). tooLarge는 문구 정규식만 |
| 20 | 부분 | `scripts/bundleBudget.test.mjs:150-157` · `check-bundle-size.mjs:233-278` | 진입 정적 포함 0 가드 **단위 테스트 0** — 빌드 스크립트 안에서만 동작(3절 M5가 빌드로 확인) |
| 13 | 부분 | `fidelity.test.tsx:42-69` | M2의 masonry `aspect` 마크업 존재 단언 0(data-media 개수만) |
| 08 | 부분 | `reactZip.test.ts:52-72` | kitTokens·motion·mainStyle 값 단언 0 · doc 최상위 키 집합이 `toMatchObject`(여분 키 못 잡음) |
| 17 | 부분 | `template.test.ts:116-132` | SPEC 6절 일부(이미지·글꼴 경로 목록, 잃은 이미지 N장, 하위 의존성 개수 출력) 미단언 · 결정성 = 같은 함수 2회 |
| 04 | 부분 | `exportFlowReactZip.test.ts:49-59` 외 2 | react-zip 청크 `?retry=1` 성공 단일 테스트 0(세 테스트 합성) |
| 09 | 부분 | `reactZip.test.ts:75-86` | 같은 문서 **정적 zip** 글꼴 entry와 직접 비교 0(입력 바이트 대조) |
| 01 | 부분(경미) | `ExportFlow.test.tsx:67-74` | 형식 값 `static-zip·static-html·react-zip` 미단언(글자·순서만) |
| 11 | 충족(약) | `template.test.ts:14-67` | 3.2-5 (a)~(g) 전부 단언 · 개별 음성은 integrity·라이선스뿐. 변이 M3a·M3b 잡힘 |

- 우선 보강 권고(구현 레인): ① M6을 잡는 통합 단언 — 실제 `ReactZipError`를 흐름에 통과시켜 refused 확인 ② react-zip UI 흐름 1건 ③ 진입 가드 단위 테스트(표식 주입 음성·양성).

## 3. 변이 6종 (매번 `git checkout --` 되돌림 · 앱 코드 커밋 0)
- 실행: `$TMPDIR/qa-rz/mutate.sh`(bash) — 치환 1곳 → `npx vitest --run src/features/studio/reactZip src/features/studio/exportFlowReactZip.test.ts src/features/studio/exportFlow.test.ts`(기준선 7 files / 81 tests passed) → 되돌림 → `git status` 빈 값 확인. 가드 변이는 `npm run build`.
- 주의 기록: 첫 실행은 zsh가 `$T`를 단어 분리하지 않아 "No test files found"(exit 1)로 **가짜 FAIL** — 무효 처리하고 bash 배열로 재실행했다. 아래가 재실행 결과.

| # | 변이 | 위치 | 결과 | 잡은 테스트 |
|---|---|---|---|---|
| M1 | 허용표 밖 파일 1개 허용(`other.length > 0` → `> 1`) | `checkReactZipEntries.ts:61` | **FAIL 1** | `checkReactZipEntries.test.ts` "허용표 밖 파일 → 실패" |
| M2 | site.json UUID→키 치환 제거(키 대신 원래 UUID) | `siteJson.ts:36` | **FAIL 19** | reactZip.test 결정성·스키마·이미지 source UUID 0·브랜드 · checkReactZipEntries "정상 M2 = 위반 0" 등 |
| M3a | lock integrity 대조 줄 삭제 | `template.test.ts:21` | **FAIL 1** | "하위 항목 integrity 누락 → 실패" |
| M3b | lock 템플릿에서 integrity 1줄 삭제 | `template/package-lock.json.tpl:30` | **FAIL 3** | "정상 lock = 위반 0" 외 2 |
| M4 | 메뉴 리스너 `hidePopover()` 호출 제거 | `templates.ts:52` | **FAIL 1** | "popover 안 # 앵커 클릭 → hidePopover 1회" |
| M5a | 진입 가드 킷 표식 → 없는 문자열 | `check-bundle-size.mjs:237` | **build exit 1** | 표식 자기 검사("kit.css 첫 줄에 없습니다") |
| M5b | 킷 표식 → `react` | 같은 곳 | **build exit 1** | 같은 자기 검사(음성 검사까지 못 감) |
| M5c | lock 표식 → `createRoot`(진입 index에도 있음) | `check-bundle-size.mjs:239` | **build exit 1** | 음성 검사 "진입 assets/index-*.js에 lock 표식" — 두 시나리오 모두 |
| M6 | 단언·용량 실패를 재시도 가능으로(`ReactZipError.retry = false` → `true`) | `reactZip.ts:27` | **생존 — 대상 81 · 전체 369 files / 3342 tests 전부 통과** | 없음 |

- M6 원인 [사실]: `exportFlowReactZip.test.ts:82-89`이 `Object.assign(new Error("문구"), {shown:true, retry:false})` 가짜 오류를 생성기 mock에 넣는다. 실제 `ReactZipError`의 `retry` 값은 어느 테스트도 보지 않는다 → Codex r1 #2 수정(단언·용량 = 재시도 없는 거절)이 **회귀 가드 없이** 남아 있다. 권고(P1, 구현 레인): `expect(new ReactZipError("x").retry).toBe(false)` 1줄 + 실제 `buildReactZip` 단언 실패를 흐름에 통과시켜 `refused` 확인 1건.
- 가드 양성/음성: 양성(생성기 청크에 표식 있음)은 M5a의 표식 자기 검사 + 정상 빌드 "가드 통과"로, 음성(진입 집합에 표식 0)은 M5c로 확인. 가드 자체의 단위 테스트는 없다(2절 AC-20).

## 남은 것 · 다음 레인
- P1: M6 회귀 가드(위). P2: 복원 예산 여유 0(1절) · react-zip UI 흐름 테스트 · 진입 가드 단위 테스트. P3: react-zip 3MB 초과 메일 안내 0 단언(5절) · 2절 부분 항목.
- [미확인] R1·R2·R3·R4·C2 — 2차(`QA-LIVE-PLAN.md`) / CI 결정 후.
- 서브에이전트: 1개(code-explorer, 읽기 전용 · 2절 AC 판독) — 결과 통합, 핵심 지적(AC-18 가짜 오류)은 M6으로 실측 확인.

## 10. 2차 실화면 (QA-BRIEF-LIVE · tip `06ca2b39`)
- 환경 [사실]: `cd app && npm run build`(exit 0, 가드 통과 · 생성기 청크 `reactZip-CeIQjct9.js` gzip 54.31KB) → `npx vite preview --host 127.0.0.1 --port 4399 --strictPort`. 브라우저 = ego-browser(TaskSpace 50, p1). 뷰포트 override는 측정 스크립트마다 그 안에서 `Emulation.setDeviceMetricsOverride` 후 `innerWidth` 기록(override 없는 스크립트는 1877 — 스크립트 간 유지 안 됨 확인).
- 문서 [사실]: IDB·localStorage 비움 → 모던 카페 A v1 → 보정값 쓰기 v2 → 3안 v2 → B안 새로 시작 → SEO 제목·설명 → `/studio/project-1` 게이트 8항 중 7 통과·성능 예산 "측정 전", 내보내기 3버튼 활성. 이미지 문서 = 같은 문서 Portfolio "이미지 벽돌형" 슬롯 3개에 webp·jpg·png(1200×800/1000/1200) + 대체텍스트 → 앱이 3장 모두 WebP로 변환(`1200 × 800 · WebP 2KB` 등), 게이트 통과 유지.

### 10.1 R1 앱 실제 경로 zip — **PASS**
| 행 | 결과 | 근거 |
|---|---|---|
| 버튼 → 내려받기 | PASS | "React 프로젝트(zip) 내보내기" 클릭 → status "zip을 만들었습니다…" + 링크 "내려받기" `download=모던-카페-브랜드-프로젝트_r3_react.zip`(RZ-AC-19 `<이름>_r<rev>_react.zip` 형식) → download 이벤트로 저장 742,778 B. 경고 대화상자 없음(게이트 차단 0 문서) |
| docker node:22 | PASS | `$TMPDIR/qa-live/cafe/src0`(저장소 밖) `:ro` → 복사 후 `npm ci` exit 0 · `npm run build` exit 0 · JS 249.21KB(gzip 77.33) · CSS 30.67KB(gzip 5.98) → C3 PASS. `raw/qa-live-r1-cafe-node22.txt` |
| kit/lock 바이트 비교 | **PASS — 동일** | 1차 vitest 경로 `$TMPDIR/qa-rz/m2`와 `cmp`: `src/kit/kit.css` 38,217 B · `src/kit/motion.css` 5,627 B · `package-lock.json` 50,419 B 모두 SAME → 앱 실제 경로 `kitCss` fetch 값 = fs 원문. 나머지 차이(index.html·README·LICENSES·fonts.css·site.json·images 폴더)는 문서가 달라서(1차 = fixture `ref-a` M2) [사실: 파일 목록 `diff -rq`] |
| 이미지 문서 | PASS | `_r6_react.zip` 749,908 B · `src/assets/images/img-01~03.webp` = 3장(고른 수와 같음) · 결과 줄 "이미지 3장 · 글꼴 2개" · `site.json` UUID 정규식 0건 · kit/lock 역시 SAME · docker `npm ci` 0 · build 0 · JS 258.16KB(gzip 81.09 ≤90). 이미지가 각 2~3KB라 vite 기본 inline(4KB 미만) → dist에 별도 파일 없이 JS에 포함 [사실: JS +8.9KB] — 결함 아님. `raw/qa-live-r1-img-node22.txt` |
- 관찰: 성공 뒤 `document.activeElement` = 누른 "React 프로젝트(zip) 내보내기" 버튼(R4 포커스 행 선행 증거).

### 10.2 R4 status/alert · 포커스 — **PASS (관찰 P3 1건)**
- 방법 [사실]: 편집 잠금(다른 탭 편집 중 → "다른 탭에서 편집 중이라 내보내지 못했습니다" alert)을 피하려 p1을 닫고 p2 단독. 스크립트마다 그 안에서 뷰포트 override + `Network.setBlockedURLs ["*reactZip-*"]` → `/projects` goto(IDB 복원) → "편집기 열기" 클릭 → (390은 "검사" 탭) → React zip 클릭 → 차단 해제 → "다시 시도". 로그 `raw/qa-live-r4-1280.txt` · `raw/qa-live-r4-390.txt` · `raw/qa-live-r4-390-direct.txt`, 스크린샷 `raw/qa-live-shots/r4-*`.

| 행 | 1280 | 390 |
|---|---|---|
| innerWidth 기록 | 1280 (모든 단계) | 390 (모든 단계, scrollWidth 375 = 스크롤바) |
| 성공 status 1 | 직접 성공(R1 문서) status 1 · 재시도 성공 status 1 | 재시도 성공 status 1 · 직접 성공(Enter) status 1 — 앞 결과 노드 교체 확인 |
| 결과 줄 = COPY.md 원문 | `zip 1개 · 0.7MB (이미지 3장 · 글꼴 2개)` + `압축을 푼 폴더에서 npm ci → npm run dev 순서로 실행하세요. Node.js 버전 조건은 ^20.19.0 \|\| >=22.12.0입니다.` — 자리표시자 외 글자 일치 | 같음 |
| 메일 안내 0 | `/메일/` 본문 0 | 0 |
| 청크 차단 → alert · 다시 시도 | alert 1개 "내보내지 못했습니다 / 다시 시도" · status 비어 있음 | 같음 |
| 해제 → 성공 | 요청 `reactZip-CeIQjct9.js` → `…js?retry=1` 2건 · status 1 · alert 비움 | 같음(2건) |
| 포커스 | 차단 직후·직접 성공 뒤 = 누른 "React 프로젝트(zip) 내보내기" 버튼 · **재시도 성공 뒤 = BODY** | 같음 |
| 버튼 줄바꿈·잘림 | 3버튼 1줄(Range rect 1) · 252×40 · scrollWidth=clientWidth | 3버튼 1줄 · 351×40 · 간격 8 · 잘림 0 |

- 중복 판정 [사실]: 채워진 status는 내보내기 결과 1개뿐. 다른 status("편집 알림" — 새로 시작·이미지 알림)는 별도 영역이라 중복 아님. 빈 alert·status 각 1개는 미리 깔린 live region.
- 관찰(P3, 이번 diff 밖): 재시도 성공 뒤 포커스가 BODY로 빠진다 — "다시 시도" 버튼이 사라지면서 생긴다. 공용 `components/studio/ExportRetryAlert.tsx`(정적 zip·HTML 공용, 1차·M2A 경로)라 React zip 고유 결함이 아니고 FAIL 기준(거짓 성공·거짓 다시 시도·중복)에도 해당하지 않는다. 권고: 재시도 성공 시 누른 형식 버튼으로 포커스 복귀(다음 레인).
- [미확인] 3MB 초과 react-zip 실화면: 문서가 0.7MB라 유도 불가(이미지는 앱이 WebP로 변환·축소). 근거는 FIX1 단위 테스트 `b4813fe9`(P3 react-zip 3MB 초과 메일 안내 0).
- 자동화 주의: 390 직접 클릭은 ego `page.click`이 "header intercepts"로 거절(DOM `elementFromPoint` = 버튼 자체 → 앱 결함 아님), 좌표 클릭은 스크롤로 빗나감 → 키보드 focus+Enter로 측정.
