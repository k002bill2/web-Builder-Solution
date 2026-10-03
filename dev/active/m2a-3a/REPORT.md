# M2A-3a 내보내기 기반 — REPORT

- 브리프 `docs/06-handoff/M2A-3A_EXPORT-BASE_BRIEF.md` · 시작 커밋 `bec1b38` · 브랜치 `k002bill2/m2a-3a`

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | c357938 | 수신 기록 · REPORT 골격 (경로 실수: `app/dev/active/`에 들어감) |
| 수신 | 5d1af48 | 경로 정정 `app/dev → dev` · `gate.sh` |
| E0 | bb53e01 | E0 실측 · **정지 보고** — 코드 변경 0(시제품은 `logs/e0-proto.patch`로 보존 후 원복) |
| 재개 E-pre | b8506d7 | `openStudio.tsx` ready 경쟁 수정(STUDIO-SLIM S5 이관) — 단언 변경 0 · 사용 파일 6개 묶음 x10 10/10 |
| 재개 E0 | a04865a | **ADR-004 개정 3** — `/studio` 진입 한도만 127(시나리오별 `eagerBudgetKb`) · 시제품 실측 124.71 |
| E1·E2 | 80aee13 | 게이트 8줄 표시 · 진입 직후 자동 계산 · 오래됨 · 줄 → 이동 · 툴바 "검사 · 내보내기" · gate_checked |
| E3 | cfa76a2 | `requestExport` 8.3.2 8단계 · 생성기 주입(기본 없음) · UNRENDERED_SECTIONS · 한 트랜잭션 |
| E4·E5 | 542bc47 | 버튼 사전 차단 · 이유 목록 · 내보내기 시작(재검사 → 확인 → 저장 먼저 → 요청 1회) · 결과 문구 · 계측 |
| E6·E7 | (이 커밋) | 브라우저 캡처 4장(`shots/e6-*`) · 흐름 로그 · Codex 1회(P1 이상 0 → 코드 변경 0) · REPORT·PROGRESS 마감 |

## 2. E0 공간 확보 (전후 실측 · 옮긴 코드)
**(원 E0 기록 — 재개 결과는 2.1·2.2) 결론: 정지 조건 충족 — 진입 ≤ 124.70 경로가 실측으로 보이지 않아 E1 이전에 멈춘다.** 예산 상수·멈춤선 변경 0, 코드 변경 0.

| 측정 | `/studio` 첫 화면 | 진입 직후 | 근거 |
|---|---|---|---|
| 기준선(bec1b38) | 91.72 | **124.70** | `logs/e0-build.txt` |
| 시제품 전체(S-B4대로 `runGate` 진입 직후 자동 + 게이트 8줄 표시 + 버튼·이유) | 91.71 | **130.97 (+6.27)** | `logs/e0-proto-bundle.txt` · `logs/e0-proto.patch` |
| 옵션 A 시제품(게이트 목록·`runGate`를 "검사 결과 보기" 누른 뒤로, 버튼·폴백 이유는 진입) | 91.72 | **125.57 (+0.87)** | `logs/e0-optionA.txt` |
| 원복 후 | 91.72 | 124.70 | `logs/e0-after-revert.txt` |

- 증가분 분해(+6.27, **하한** — 시제품은 줄 이름표 외 머리 Tag 톤·경고 대화상자 연결·포커스 이동을 단순화했다): `runGate` 계열 **4.75**(gateCheck 1.92 · requiredSections 0.80 · contrast 0.89 · profileContrast 0.76 · effectiveProfile 0.38 — 앞의 셋 빼고는 지금 `/studio` 진입에 없는 domain 대비 코드) + 표시·배선 **1.44**(GateList 1.11).
- 우선순위 1(S-B5 조작 뒤): 경고 대화상자·잡 조회·결과 처리·`requestExport` 경로는 **모두 새 코드**라 처음부터 조작 뒤에 두면 진입 +0이지만, 기존 진입 코드를 빼 주지는 않는다 → 확보량 0.
- 우선순위 2(`runGate`는 이미 진입 직후 엔진 청크): **브리프 전제와 다름** — 지금 진입에 있는 것은 `gateText`·`issue`(canvasIssues 경유)뿐이고 `runGate`(대비 판정 포함)는 진입에 없다(8절).
- 우선순위 3(정리): 진입 큰 항목(모듈별 gzip 추정, `logs/e0-attr-optionA.txt`) = StudioLayout 2.84 · StructureCanvas 1.60 · useAutosaveScheduler 1.48 · 섹션 정의(bodySections 1.53 · boundSections 0.83) — 모두 S-B4 첫 화면·자동 조건 코드. 중복·미사용 코드로 6KB는커녕 1KB도 확인되지 않았다.
- ADR-004 실한도 125도 멈춤선 대비 +0.30뿐이라 **멈춤선을 올려도 해결되지 않는다**(옵션 A조차 125.57).

**선택지(영환님 결정 — 추천 순)**
1. **A + B 병행(추천)**: A(1280에서도 게이트 목록을 접힌 상태로 시작 — 브리프 예시, SPEC 개정) +0.87을 B로 상쇄. A만으로는 125 초과.
   - A 비용: E-S22·E-S23 "진입 즉시 게이트 차단 → 버튼 사전 차단"이 첫 검사(펼침·"검사 · 내보내기") 뒤로 밀린다 → 5.12·5.13·E-AC-25·29 문장 개정 필요. 폴백 이유(K-AC-18·E-AC-50)는 `RENDERED_VARIANTS`만 써서 진입에서 그대로 가능.
2. **B 단독(L3 추정 — 빌드 안 함)**: `/studio`가 진입 직후 받지만 부르지 않는 보드·생성 저장소 코드를 공유 store 로더 밖으로(memoryCompareBoardRepository 1.20 · memoryGenerationRepository 0.88 · profileDraft 청크 3.89 중 보드 몫 ≈ 3.4) → 추정 **−4.5~5.5**. +6.27을 다 덮지 못할 가능성이 높고, 2a-04 store 배선 변경(PARALLEL_LANES 규칙 1) · `/compare`·`/profile` ±0.03 규칙과 충돌 위험 → 별도 레인.
3. **C 예산 개정(ADR-004)**: `/studio` 진입 직후 한도 상향 — 이 레인 권한 밖.

### 2.1 재개(★A) — E-pre · E0 재측정
- **E-pre**: 공용 도우미 `features/studio/testing/openStudio.tsx`가 h1 뒤 `document.title === "<이름> 편집"`까지 기다린 뒤 `connectRenderFrame()`(StudioShell.test `open()`과 같은 기다림). 제목 비움은 각 파일 `afterEach` 대신 **도우미 안에서 이동 직전**에 한다 — 사용 파일 6개 모두에 같은 줄을 넣는 것과 같은 효과(이전 테스트 제목을 "effect 끝남"으로 잘못 읽지 않음)이고 사용 파일 변경 0. 판정: CanvasPalette·EmptySlot·SectionAdd·SectionMove·SectionRemove·SectionVariant 묶음 단독 **x10 = 10/10**(27 tests, load 18~25) `logs/epre-x10.txt`.
- **E0 재측정(118.44 기준)**: E0 시제품(`logs/e0-proto.patch` — S-B4대로 `runGate` 진입 직후 자동 · 게이트 8줄 펼침 · 버튼·이유)을 merge 뒤 트리에 다시 얹어 빌드 → `/studio` 진입 **118.44 → 124.71(+6.27)** · 첫 화면 91.72 (`logs/e0r-proto.txt`). 시제품은 하한이라(2절 분해) 실구현은 더 크다 → **124.70 초과 → ADR-004 개정 3 결정 2 적용**.
- 바꾼 것: `scripts/bundleBudget.mjs` 시나리오별 `eagerBudgetKb`(기본 `ROUTE_EAGER_BUDGET_KB` 125 그대로) + `check-bundle-size.mjs` `/studio/:projectId`만 `eagerBudgetKb: 127`(멈춤선 126.70). 첫 화면·다른 라우트·렌더 예산 변경 0. RED `logs/e0r-red.txt`(1 failed) → GREEN 8/8.
- 전후 실측: 바꾸기 전 = `/studio` 진입 118.44 / 예산 125(`logs/epre-gate.txt`) · 바꾼 뒤(시제품 얹은 트리) = **124.71 / 예산 127** · 그 밖 /compare 98.84/121.72 · /projects 94.01/100.19 · /profile 99.61/118.67 · 렌더 79.89 (`logs/e0r-gate.txt`). 남은 여유 = 126.70 − 실측 — E1~E5 진입분은 이 안에서, 조작 뒤 코드는 `STUDIO_AFTER_ACTION`.

### 2.2 개정 3 적용 전후 · 최종 여유
| 시점 | `/studio` 진입 / 한도 | 멈춤선 | 여유(멈춤선 − 실측) | 근거 |
|---|---|---|---|---|
| 개정 3 전(merge 뒤 b8506d7) | 118.44 / 125 | 124.70 | 6.26 | `logs/epre-gate.txt` |
| 개정 3 뒤 · E0 시제품 트리 | 124.71 / 127 | 126.70 | 1.99 | `logs/e0r-gate.txt` |
| E1·E2(80aee13) | 124.98 / 127 | 126.70 | 1.72 | `logs/e1-gate.txt` |
| E3(cfa76a2) | 124.91 / 127 | 126.70 | 1.79 | `logs/e3-gate.txt` |
| **E4·E5(542bc47) = 최종** | **126.59 / 127** | **126.70** | **0.11** | `logs/e4e5-gate.txt` |
- 첫 화면 91.76(한도 그대로) · 렌더 JS 79.89 / 멈춤선 89.70 · 다른 라우트 ±0.03 안(예외 `/projects` +0.13, 8절). 예산 상수는 개정 3이 정한 `/studio` 진입 127 하나만.
- E6·E7은 코드 변경 0이라 번들 그대로(126.59).

## 3. 게이트 표시 (E1 · E2)
- **계산**: `features/studio/useGateReport.ts` — 진입 직후 1회 **바로**(지연 없음), 편집 뒤엔 500ms 디바운스로 `runGate(doc, { profile: 문서 버전, purpose: docPurpose })`. 엔진은 진입 직후 엔진 청크 `features/studio/gateCheck.ts`(SCENARIOS `/studio` auto 등록). 테마(프로필 버전)가 없으면 계산하지 않고 "검사하는 중입니다".
- **오래됨(E-S25)**: 결과를 계산한 **문서 객체**와 지금 문서를 비교(편집은 저장 전까지 revision을 올리지 않아 revision 비교로는 편집 직후를 못 잡는다 — 시제품의 결함). 오래됨 = 목록 `aria-busy` + "편집 전 기준 결과입니다 · 다시 검사하는 중". `recheck()` = 지금 문서로 바로 재계산(E5 내보내기 시작이 쓴다).
- **표시**: `components/studio/GateList.tsx` — 머리 Tag("차단 n · 경고 m" / "경고 n" / "통과") · 8줄 GATE_ROWS 순서 · 점(`aria-hidden`) · 이름(5.12 표) · 상태 단어(Q14) · 한 줄 원인 · 문제 줄만 `button` · `details` "원인 · 대체안 n건"(규칙 ID · 원인 · 대체안). 성능 예산 = "측정 전" + "생성기 연결 후 측정합니다", 버튼 아님. 문장 함수는 `features/studio/gateView.ts`.
- **이동(E2 · 5.12 표 "이동 대상")**: 대비 AA → h2 "테마"(`tabIndex=-1` 추가, <1024 "섹션" 탭) · SEO 메타 → "페이지 정보" 선택 + 해당 입력칸 · 이슈에 섹션+슬롯 → 그 섹션 선택 + `field-<id>-<slot>`(입력칸 없는 이미지 슬롯 = 편집 패널 머리) · 섹션만 → 편집 패널 머리 · 없는 필수 섹션 → "섹션 추가"(`id=studio-add-section`) · <1024는 탭을 먼저 바꾼다. 
- **툴바 "검사 · 내보내기"(E-S26 · 4.2)**: ≥1024 primary "검사 · 내보내기", <1024 "검사"(접근 이름 "검사 · 내보내기") → h2 "품질 게이트" 포커스(<1024 "검사" 탭 선택 뒤) + 편집 알림 1회("품질 게이트 차단 2 — 첫 차단: 대체텍스트" / "품질 게이트 통과 — 내보내기 버튼으로 이동합니다") + `gate_checked(block_count, warn_count)`(9절 — `features/studio/editorEvents.ts` `studio:editor`, 누를 때만).
- 테스트: `components/studio/GatePanel.test.tsx` 11건 — RED(HEAD StudioLayout) 11 failed `logs/e1-red.txt` → GREEN 11/11.
- 번들: 머리 Tag에 ds `Tag`를 쓰면 공통 JS +0.03 · 다른 화면 첫 화면 +0.09(청크 재분할, 실측) → 같은 모양 글자 span으로. 결과 `/studio` 진입 **124.98 / 127**, 그 밖 화면 기준 ±0.02 안(`logs/e1-gate.txt`).

## 4. requestExport 판정 순서 · 생성기 주입 모양 (E3)
- **배치(가드 변경 0)**: 진입 청크 `memoryProjectRepository`에는 한 줄 위임만(`(await bookOf()).requestExport(args, generators[format], work => call("requestExport", work))` · `getExportJob`). 판정·쓰기·잡 실행 본문은 조작 뒤 청크 `memoryDocBook`(판정은 동기 — `commit()` 뒤에만 상태 변경). 처음엔 잡 실행기를 저장소에 둬 `/projects` 진입 +0.30 → 본문으로 옮겨 **+0.13**(8절 — PROJECT_AUTO 공유 청크라 저장소 API 한 줄도 `/projects`에 센다). 서버 게이트(5단계)·렌더러 판정(7단계)은 engine 허용 data 파일 `startDocWrite.ts`의 `judgeExport(doc, profile)`(같은 조작 뒤 청크 — engineImportGuard 허용 목록 변경 0). 렌더러 목록 = 부모 데이터 상수 `RENDERED_VARIANTS`.
- **판정 순서**: 1 모양(`format`·정수 revision → `SCHEMA_INVALID`) → 2 멱등(키 = 프로젝트·형식별 마지막 기록의 (format, docRevision) — 같으면 이전 결과 `wrote:false`, 그 잡이 재시도 가능 실패면 **같은 잡 재실행**) → 3 `NOT_FOUND`(프로젝트·문서·문서가 가리키는 프로필 버전) → 4 `STALE_DOC`(최신 문서 동봉) → 5 `GATE_FAILED`(저장된 문서로 `runGate`, 테마 = 그 버전 + `adjustments.purpose ?? "none"`) → 6 `GENERATOR_UNAVAILABLE`(요청 형식 생성기 없음) → 7 `UNRENDERED_SECTIONS`(오류 `sections` = `instanceId` 문서 순서, 개수 = 길이) → 8 쓰기(`auto·export` 스냅샷 "내보내기 전 · HH:MM" + 잡 `queued` + 멱등 기록, 한 번에). 3~7은 쓰기·기록 0.
- **생성기 주입 모양**: `MemoryProjectOptions.generators?: ExportGenerators` = `Partial<Record<ExportFormat, ExportGenerator>>`, `ExportGenerator = ({ projectId, format, doc }) => Promise<{ downloadRef, resultHash }>`. **기본값 = `{}`(둘 다 없음)** → 이 레인은 두 형식 모두 6단계에서 끝난다. 잡 실행: `running` → `succeeded`(참조·해시) / 실패 = `JOB_TIMEOUT`은 그대로, 그 밖 예외는 `INFRA`(둘 다 `retryable: true`). `getExportJob(jobId)` = 진행 조회.
- **data 계약 추가(엔진 계약 변경 0)**: `ProjectErrorCode`에 `UNRENDERED_SECTIONS` · `ProjectRepositoryError.sections` · `ExportGenerator(s)` 타입 · `ProjectMethod`에 `requestExport`(`delay`·`fail` 주입 — E-AC-43 commit/response 시험용).
- 테스트: `src/data/memoryExport.test.ts` 10건 — RED(HEAD data) 9 failed `logs/e3-red.txt` → GREEN 10/10. E-AC-43(첫 요청 스냅샷 1 + 잡 1 · 연속 2회 같은 잡 +0 · commit 실패 변화 0 · response 실패 뒤 재시도 같은 잡 · JOB_TIMEOUT 재실행 스냅샷 +0 · 화면 코드 `createSnapshot(` 0) · E-AC-44(기본 구현 3회 → 스냅샷 0 · 잡 0 · STALE_DOC·GATE_FAILED 스냅샷 0) · E-AC-48(폴백 2개 → 개수 2·문서 순서 · 기록 0 → 폴백 없앤 새 revision 쓰기 · 게이트 차단+폴백 → GATE_FAILED · react-zip+폴백 → GENERATOR_UNAVAILABLE).
- 범위 밖 그대로: `createSnapshot`(수동)·`restoreSnapshot`·`resolveConflict` = `missing`.
- **3b가 `static-html`을 등록하는 방법**: 생성기 함수 `ExportGenerator`(위 모양)를 만들고, 저장소를 만드는 두 곳 — `src/data/deferredStudio.ts:38`(앱 실제 경로) · `src/data/memoryStudio.ts:38` — 의 `createMemoryProjectRepository({ store, … })`에 `generators: { "static-html": staticHtmlGenerator }`를 넘긴다. 판정·스냅샷·잡·멱등은 이미 있으므로 3b는 생성기 본문과 결과(`downloadRef`·`resultHash`) 표시만 더한다. 주의: 생성기 모듈을 정적 import하면 PROJECT_AUTO 청크(`/projects`·`/studio` 진입)에 들어간다 — 생성기 안에서 동적 import하거나 `requestExport` 조작 뒤 청크로 두어야 진입 여유 0.11을 지킨다.

## 5. 버튼 · 이유 · 결과 문구 (E4 · E5, 바꾼 문구)
- **버튼(E4)**: `components/studio/ExportButtons.tsx` — "React 프로젝트(zip) 내보내기" · "정적 HTML 내보내기"(outline 모양 글자 버튼, 아이콘 0). 이유 ≥ 1 → 두 버튼 `aria-disabled` + `aria-describedby` = 이유 id(`export-reason-gate` → `export-reason-fallback`, 8.3.2 5 → 7 순서), 눌러도 요청 0. 이유 `ul` "내보낼 수 없는 이유".
  - 게이트 이유 = "차단 {n}건({첫 차단 줄 이름}: {그 줄 첫 차단 원인}) — 고치면 열립니다" + "첫 차단으로 이동"(= 첫 차단 줄 이동과 같은 곳). n = 차단 이슈 전체 개수.
  - 구조 미리보기 이유 = m2a 3.2 A 문장 그대로 — 이름 = 편집기 섹션 목록의 유형 이름표(예: "Portfolio · Testimonials"; m2a 예시의 한국어 이름은 편집기 이름표가 영문이라 그대로 영문) · 3개 + "외 k개" + "첫 구조 미리보기 섹션으로 이동"(그 섹션 선택 + 편집 패널 머리 포커스).
- **시작(E5 · `features/studio/useExportFlow.ts`, 진입)**: 결과 오래됨·없음 → `recheck()`(지금 문서로 재계산) → 차단이면 멈춤 → 경고만이면 확인 대화상자 → 저장 전 변경(phase ≠ idle·saved)이면 자동 저장 즉시(`retry`) 뒤 `saved`에서만 진행(failed·stale·offline = 요청 0, 표시는 기존 저장 흐름 E-S07·E-S09) → `requestExport(projectId, format, savedRevision())` **1회**. 버튼 `aria-busy` + "내보내는 중…". `useDocSave`에 `savedRevision()` 추가(저장소에 저장된 revision).
- **조작 뒤 청크(S-B5)**: `features/studio/exportFlow.ts`(requestExport 호출 · 잡 조회 250ms × 40 · 결과 분류 · 계측) + `components/studio/ExportAfter.tsx`(경고 확인 `dialog` · 결과 Callout) — 둘 다 `STUDIO_AFTER_ACTION` 등록(+0.60 · +1.57, 판정 밖).
- **결과 문구(바꾼 문구 — E-S27 informative 문장을 형식별로)**:
  - `GENERATOR_UNAVAILABLE` zip: "React 프로젝트(zip)는 코드 생성기 연결 후(M4) 내보낼 수 있습니다. 지금 문서는 이 탭에 저장돼 있습니다 — 따로 남기려면 '스냅샷'에서 저장하세요"
  - `GENERATOR_UNAVAILABLE` 정적 HTML: "정적 HTML은 생성기 연결 후(다음 단계) 내보낼 수 있습니다. 지금 문서는 이 탭에 저장돼 있습니다 — …" (SPEC 원문 "코드 생성기 연결 후(M2)"의 M2를 형식별 단계로 — 브리프 지시)
  - 둘 다 `Callout tone=info`, `role=alert` 아님, 다시 시도 없음, 스냅샷 이름 없음.
  - `UNRENDERED_SECTIONS`: m2a 3.2 B 그대로(`Callout tone=warning` + `role=status` + "첫 구조 미리보기 섹션으로 이동" = 결과 `sections[0]`) · 다시 시도 없음.
  - 재시도 가능 실패(잡 `failed` + retryable · 요청 `JOB_TIMEOUT`·`INFRA`·`NETWORK`): `role=alert` "내보내지 못했습니다" + "다시 시도"(같은 요청 다시 → 저장소 2단계가 같은 잡 재실행).
  - 완료(3b 생성기 뒤): "{zip|정적 HTML}을 만들었습니다 · 내보내기 전 상태는 스냅샷 '{이름}'에 있습니다" — 내려받기 링크·결과 해시는 3b.
  - `GATE_FAILED`·`STALE_DOC`(경쟁 경로, SPEC 문구 없음 — 유추): `role=alert` "품질 게이트 차단이 있어 내보내지 않았습니다 — 차단을 고친 뒤 다시 내보내세요" / "다른 곳에서 문서가 바뀌어 내보내지 않았습니다".
- **경고 확인 대화상자(E-S24)**: 제목 "경고 {n}건이 있습니다" · 목록 "{줄 이름} · {원인}" · "취소"(요청 0) / "경고를 확인했습니다 · 내보내기"(열 때 포커스). Esc = 취소. 목록 줄 이동 링크는 넣지 않았다(9절 남은 위험).
- **계측(9절)**: `export_requested(format)` · `export_failed(reason)` · `export_succeeded(format)` · `snapshot_created(auto, export)`(결과 `wrote`일 때만). 사용자 글자 0.
- 테스트: `components/studio/ExportFlow.test.tsx` 8건(RED = E3 StudioLayout 8 failed `logs/e4e5-red.txt` → GREEN 8/8) · `features/studio/gateView.test.ts` 2건.
- 번들: `/studio` 진입 124.91 → **126.59 / 127**(멈춤선 126.70 안, 여유 0.11) · 그 밖 화면 E3와 같음(`logs/e4e5-gate.txt`).

### 5.1 E6 브라우저 (vite dev 127.0.0.1:4337 · ego-browser · 앱 안 클릭만 · `logs/e6-flow.txt`)
| 캡처 | 확인한 것 |
|---|---|
| `shots/e6-1280-entry.png` | 편집 시작 흐름(/catalog → … → A안 → /studio/project-1) · 콘솔 오류 0 · 보드·생성 구현 요청 0 · exportFlow/ExportAfter 요청 0 |
| `shots/e6-1280-blocked.png` | 1280 게이트 "차단 7" + 8줄 · 두 버튼 차단 · 이유 2개(게이트 → 구조 미리보기 2개 Portfolio · Testimonials) |
| `shots/e6-1280-result.png` | "첫 구조 미리보기 섹션으로 이동" → Portfolio 선택·H2 포커스 → 폴백 2개 삭제(본문 5개) → 구조 미리보기 이유 사라짐 → "정적 HTML 내보내기" 포인터 클릭 = 게이트 차단(차단 4)으로 요청 0 · 결과 Callout 0 |
| `shots/e6-390-gate.png` | 390 "검사" 탭 선택 · 게이트 목록 · 두 버튼 차단 · 가로 넘침 0(scrollWidth 375) |
- **브리프와 다름**: GENERATOR_UNAVAILABLE 결과 문구 캡처 대신 차단 상태 결과를 찍었다. A안 문서의 남은 차단(Hero·About 이미지 대체텍스트)은 편집기에 입력칸이 없고, 이미지 없는 Hero 변형은 모두 구조 미리보기라 앱 안 조작으로 게이트 통과 + 폴백 0을 만들 수 없다. 문구는 ExportFlow.test(형식별 · info · alert 아님)가 근거.
- 390 재캡처 1회(탭 막대부터) 실패 → 첫 캡처 유지 + DOM 수치(탭 aria-selected "검사" · li 13 · aria-disabled 2 · scrollWidth 375).

## 6. E-AC · K-AC 판정 (번호별)
| AC | 판정 | 근거 |
|---|---|---|
| E-AC-25 게이트 8줄 · 차단/경고 조건 | PASS | GatePanel.test "진입 직후 자동 계산" · "E-AC-25 조건 재현" · 브라우저 1280 8줄(`shots/e6-1280-blocked.png`) |
| E-AC-26 줄 → 이동 · 툴바 | PASS | GatePanel.test 이동 4건 · 툴바 2건(≥1024 · <1024) · 브라우저 "첫 구조 미리보기 섹션으로 이동" → Portfolio 선택 + H2 "편집 · Portfolio" 포커스 |
| E-AC-27 Q14 점 aria-hidden · 이름표 | PASS | GatePanel.test "E-AC-27 Q14" |
| E-AC-28 편집 직후 오래됨 · 재검사 | PASS | GatePanel.test "E-AC-28 재검사" · ExportFlow.test "편집 직후 … 다시 검사 → 저장 먼저" |
| E-AC-29 버튼 사전 차단 · 이유 순서 | PASS | ExportFlow.test 사전 차단 3건 · 브라우저 1280(두 버튼 aria-disabled · 이유 2개 · 포인터 클릭 요청 0) · 390 "검사" 탭(`shots/e6-390-gate.png`) |
| E-AC-30 시작 · 결과 문구 · 화면 스냅샷 0 | PASS(단위) · 브라우저 부분 | ExportFlow.test 시작·결과 5건 · memoryExport.test "createSnapshot 호출 0". GENERATOR_UNAVAILABLE 문구는 브라우저로 도달 불가(A안 Hero 이미지 대체텍스트 편집 불가 — `logs/e6-flow.txt` 5) |
| E-AC-43 내보내기 전 스냅샷 1곳 · 멱등 | PASS | memoryExport.test 멱등 3건(Codex P2 2건은 9절 — 응답 실패 뒤 잡 미실행 · 재실행 문서) |
| E-AC-44 기본 구현 생성기 없음 → 0 쓰기 | PASS | memoryExport.test "기본 구현 … 스냅샷 0 · 잡 0" · "3 → 4 스냅샷 0" |
| E-AC-48 UNRENDERED_SECTIONS 순서 · 개수 | PASS | memoryExport.test 5·6·7 순서 3건 · ExportFlow.test UNRENDERED_SECTIONS 결과 |
| E-AC-50 구조 미리보기 이유 · 이동 | PASS | ExportFlow.test "폴백만 → …" · gateView.test 이름 3개 + 외 k개 · 브라우저 폴백 2개 삭제 → 이유 사라짐(본문 5개) |
| K-AC-18 폴백 있으면 내보내기 막힘 | PASS | ExportFlow.test 사전 차단 · 브라우저 1280 |
- 전체 vitest 3회는 Jarvis 몫(이 실행에서 돌리지 않음 — 브리프 지시).

## 7. 번들 표 (체크포인트별)
| 체크포인트 | 공통 | `/studio` 첫 / 진입 | `/compare` 첫 / 진입 | `/profile` 첫 / 진입 | 렌더 JS / CSS |
|---|---|---|---|---|---|
| E0 기준선 = 원복 후 | 89.34 | 91.72 / 124.70 | 98.75 / 121.40 | 99.60 / 123.64 | 79.89 / 6.32 |
| E0 시제품(참고, 커밋 안 함) | — | 91.71 / 130.97 | — | — | — |
| E0 옵션 A 시제품(참고, 커밋 안 함) | 89.34 | 91.72 / 125.57 | — | — | — |
| 재개 기준(b8506d7, merge 뒤) | 89.35 | 91.73 / 118.44 (예산 125) | 98.84 / 121.71 | 99.62 / 118.68 | 79.89 / 6.32 |
| 재개 E0 시제품(a04865a 트리) | 89.34 | 91.72 / 124.71 (예산 127) | 98.84 / 121.72 | 99.61 / 118.67 | 79.89 / 6.32 |
| E1·E2 | 89.34 | 91.72 / 124.98 | 98.83 / 121.71 | 99.61 / 118.66 | 79.89 / 6.32 |
| E3 (`/projects` 94.02 / **100.29**) | 89.35 | 91.74 / 124.91 | 98.83 / 121.70 | 99.62 / 118.67 | 79.89 / 6.32 |
| E4·E5 (`/projects` 94.02 / 100.29) | 89.35 | 91.76 / **126.59** | 98.84 / 121.70 | 99.61 / 118.66 | 79.89 / 6.32 |
| E6·E7(코드 변경 0 — E4·E5와 같음) | 89.35 | 91.76 / 126.59 (한도 127 · 멈춤선 126.70 · 여유 0.11) | 98.84 / 121.70 | 99.61 / 118.66 | 79.89 / 6.32 |

## 8. SPEC 차이
- (E0 기록) **브리프 전제 차이**: 브리프 E0-2 "계산(`runGate`)은 이미 진입 직후 엔진 청크(S-B4) 쪽에 둔다" — 실측으로 `runGate`·대비 판정은 그때 어느 `/studio` 청크에도 없었다. 재개 E1에서 S-B4대로 진입 직후 엔진 청크(`gateCheck`)를 새로 만들었다.
- **`/projects` 진입 +0.13(±0.03 초과, 의도)**: 100.16 → 100.29. `memoryProjectRepository`가 `/projects`·`/studio` 공용 PROJECT_AUTO 청크라 `requestExport` 위임 한 줄·`getExportJob`·생성기 옵션이 `/projects`에도 센다(E0 4절이 예고한 비용). 판정 본문은 조작 뒤 청크. 예산 125 대비 여유 24.7.
- 머리 Tag는 ds `Tag` 대신 같은 모양 글자 span(공통 청크 재분할 회피, 3절).
- 툴바 "검사 · 내보내기" 요약 알림 문장(E-S26 "첫 차단 줄 안내 문장")은 SPEC에 문구가 없어 "품질 게이트 {머리 Tag} — 첫 차단: {줄 이름}" / "… — 내보내기 버튼으로 이동합니다"로 정했다.
- E-pre 제목 비움은 각 파일 `afterEach` 대신 공용 도우미 안(이동 직전).
- E6 결과 캡처는 GENERATOR_UNAVAILABLE 문구 대신 차단 상태(5.1절 — 앱 안 조작으로 게이트 통과 불가).
- E7 Codex P2 4건 미반영(브리프: P1 이상만 고침) — 9절 3.

## 9. 남은 위험 (3b에 넘길 것)
1. **`/studio` 진입 여유 0.11**(126.59 / 멈춤선 126.70, 한도 127). 3b의 생성기·다운로드 표시는 전부 조작 뒤 청크(`STUDIO_AFTER_ACTION`)나 생성기 안 동적 import로 — 진입에 0.12 이상 더하면 멈춤선 초과. 진입을 늘려야 하면 옵션 B(보드·생성 저장소 코드를 공유 로더 밖으로, 추정 −4.5~5.5, 2절)를 먼저.
2. **static-html 등록**: 4절 끝 — `generators: { "static-html": … }`를 `deferredStudio.ts`·`memoryStudio.ts` 두 생성 지점에.
3. **Codex(E7, `logs/e7-codex.txt`) P2 4건 — 이 레인 P1 이상만 고침 규칙으로 미반영**:
   - `ExportAfter.tsx:26` 경고 확인 `dialog`에 `open` 속성이 있어 `showModal()`이 실행되지 않음 → 비모달(배경 편집·Esc 취소 안 됨). jsdom은 차이를 못 잡는다.
   - `memoryDocBook.ts:163-165` `fail phase:"response"`면 잡을 커밋한 뒤 `runJob()`이 실행되지 않아 재시도해도 queued에 머문다(생성기 없는 3a에선 6단계에서 끝나 드러나지 않음 — 3b 생성기 등록 시 실제 결함).
   - `memoryDocBook.ts:94-99` 실패 잡 재실행이 그 잡의 revision 문서가 아니라 지금 문서를 생성기에 넘긴다(멱등 분기가 게이트 앞이라 새 revision의 차단도 건너뜀) — 잡에 문서(또는 스냅샷 id) 보존 필요.
   - `useExportFlow.ts:76` 결과의 "다시 시도"가 재검사·경고 확인·저장 먼저를 건너뛴다 — 실패 요청의 revision을 보존하거나, 문서가 달라졌으면 일반 시작 흐름으로.
4. 브라우저에서 GENERATOR_UNAVAILABLE 결과 문구를 볼 수 없다 — A안 Hero·About 이미지 대체텍스트를 편집할 입력칸이 없고(이미지 슬롯 "다음 단계"), 이미지 없는 Hero 변형은 모두 구조 미리보기. 3b 브라우저 확인은 이미지 슬롯 편집(또는 게이트 통과 픽스처) 뒤에.
5. 경고 확인 대화상자 목록에 줄 이동 링크 없음(5절).
6. `/projects` 진입 +0.13(8절) — 다른 라우트 ±0.03 규칙의 의도된 예외로 Jarvis 판정 필요.
7. 4337 서버: E6에서 vite dev(PID 39465)를 띄워 캡처 뒤 종료(`lsof -ti :4337 -sTCP:LISTEN` 결과 없음). preview는 띄우지 않음.

## 10. fix (M2A-3a-fix — 브리프 `docs/06-handoff/M2A-3A-FIX_BRIEF.md` · 시작 커밋 `c2d6a7a`)
- 서브에이전트 0(브리프 금지) · 포트 4337(127.0.0.1) · 로컬 커밋만(`git commit -- <경로>`)

### 10.1 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 골격 | e839b15 | 10절 골격 · PROGRESS fix 체크리스트 |
| F1 | (이 커밋) | 대비 줄 color_tokens 없음 = unreadable 경로 · useGateReport 실패 상태 · GateList "검사하지 못했습니다" |

### 10.2 F1 처리되지 않은 오류 3건
- **원인**: `SectionRemove.test.tsx`의 프로필 픽스처 `base: { motion_preset: "L1" }`(color_tokens 없음) → `contrastRow.ts` `applied.color_tokens[role]`에서 TypeError → `useGateReport.ts` `compute` 안 `void compute(doc).then(...)`이 거부를 받지 않아 Unhandled Rejection(그 파일의 진입 직후 계산 3회). 앱의 정상 경로에서는 프로필 버전이 늘 참조의 `base`(color_tokens 포함)를 이어받아(`memoryProfileAdjust` `base: latest.base`) 재현 경로를 찾지 못했다 — 다만 저장 데이터가 잘못되면 같은 거부가 나므로 둘 다 막는다.
- **엔진(계약 변경 0 — 구현 방어)**: `contrastRow.ts` — `base.color_tokens`가 없으면 `effectiveProfile`(보정 reduce가 undefined를 읽어 던짐)을 건너뛰고 **기존 unreadable 경로**로 → 대비 줄 차단, 역할 5개 각각 "`{role}: 색 값을 읽을 수 없습니다`"(기존 `GATE_TEXT.contrastUnreadable`). 새 문구 "테마 색을 읽을 수 없습니다"는 시도했으나 엔진 문구가 공통 청크에 들어가 `/studio` 진입 126.72(멈춤선 126.70 초과)·다른 화면 +0.03이 되어 기존 문구 재사용으로 바꿨다(`logs/f1.txt` 최종).
- **화면**: `useGateReport` `compute`가 try/catch로 실패를 `failed` 상태로 받는다(거부 0, `recheck` → undefined → 내보내기 시작은 요청 0). `GateList`는 결과 없음 + failed면 "검사하지 못했습니다"(새 문구 — 기존 "검사하는 중입니다" 자리).
- 테스트(RED `logs/f1-red.txt`): runGate.test "color_tokens 없는 프로필 → throw 0 · block 5건"(조정 없음·보정 있음) · useGateReport.test(runGate 목이 던짐 → failed · recheck undefined · 거부 0) · GateList.test(failed 문구).
- **판정: 전체 vitest exit 0 · Errors 0** — 168 files · 1590 tests (`logs/f1-full.txt`). 번들 `/studio` 진입 126.62(≤126.70).

### 10.3 F2 확인 대화상자 모달
- (진행 중)

### 10.4 F3 저장소 잡 (Codex P2 2·3)
- (진행 중)

### 10.5 F4 다시 시도 (Codex P2 4)
- (진행 중)

### 10.6 F5 r4.11 대체텍스트 판정 · 이관 표
- (진행 중)

### 10.7 F6 브라우저 결과 캡처
- (진행 중)

### 10.8 F7 전체 vitest x3 · Codex · 번들 · 서버 종료
- (진행 중)
