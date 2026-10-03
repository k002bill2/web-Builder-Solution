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
| E3 | (이 커밋) | `requestExport` 8.3.2 8단계 · 생성기 주입(기본 없음) · UNRENDERED_SECTIONS · 한 트랜잭션 |

## 2. E0 공간 확보 (전후 실측 · 옮긴 코드)
**결론: 정지 조건 충족 — 진입 ≤ 124.70 경로가 실측으로 보이지 않아 E1 이전에 멈춘다.** 예산 상수·멈춤선 변경 0, 코드 변경 0.

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

## 5. 버튼 · 이유 · 결과 문구 (E4 · E5, 바꾼 문구)
E0 정지로 미진행 — 영환님 결정(2절 선택지) 대기.

## 6. E-AC · K-AC 판정 (번호별)
| AC | 판정 |
|---|---|
| E-AC-25~30 · 43 · 44 · 48 · 50 · K-AC-18 | 미판정 — E0 정지 |

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

## 8. SPEC 차이
- (E0 기록) **브리프 전제 차이**: 브리프 E0-2 "계산(`runGate`)은 이미 진입 직후 엔진 청크(S-B4) 쪽에 둔다" — 실측으로 `runGate`·대비 판정은 그때 어느 `/studio` 청크에도 없었다. 재개 E1에서 S-B4대로 진입 직후 엔진 청크(`gateCheck`)를 새로 만들었다.
- **`/projects` 진입 +0.13(±0.03 초과, 의도)**: 100.16 → 100.29. `memoryProjectRepository`가 `/projects`·`/studio` 공용 PROJECT_AUTO 청크라 `requestExport` 위임 한 줄·`getExportJob`·생성기 옵션이 `/projects`에도 센다(E0 4절이 예고한 비용). 판정 본문은 조작 뒤 청크. 예산 125 대비 여유 24.7.
- 머리 Tag는 ds `Tag` 대신 같은 모양 글자 span(공통 청크 재분할 회피, 3절).
- 툴바 "검사 · 내보내기" 요약 알림 문장(E-S26 "첫 차단 줄 안내 문장")은 SPEC에 문구가 없어 "품질 게이트 {머리 Tag} — 첫 차단: {줄 이름}" / "… — 내보내기 버튼으로 이동합니다"로 정했다.
- E-pre 제목 비움은 각 파일 `afterEach` 대신 공용 도우미 안(이동 직전).

## 9. 남은 위험 (3b에 넘길 것)
1. `/studio` 진입 여유 0이 M2A-3 전체(3a·3b·3c)의 선결 조건 — 2절 선택지 결정 없이는 게이트 표시·버튼 사전 차단·`requestExport` 배선 모두 진입을 늘린다.
2. 옵션 A를 고르면 SPEC 5.12·5.13·E-S22·E-S23·E-AC-25·29 개정(Designer) 필요.
3. 옵션 B는 2a-04 저장소 배선 변경 — 다른 화면 ±0.03 규칙과 함께 판정해야 한다.
4. 4337 서버: 이 실행에서 띄우지 않음(`lsof -i :4337` 결과 없음).
