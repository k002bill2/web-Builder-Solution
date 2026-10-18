# M3-0 RECO-SPEC — 추천 모드 (규칙 기반 점수 · 근거 · 승인 후 적용)

- 리비전: **r1** (r0 + Codex 적대적 리뷰 1회 반영 — 8절) · 작성 2026-10-18 · Designer (Orca + Claude Code) · base `a0068764`
- 범위: DEVELOPMENT_PLAN M3 **3.2**(추천 점수 — API 대신 브라우저 `domain/` 순수 함수) · **3.4**(추천 모드 UI, 승인 후 적용). 앱 코드 변경 0(명세만).
- 정본: PRD FR-SEL-03·04 (`docs/02-prd/PRD.md:98-99`) · TRD 6.1 (`docs/03-trd/TRD.md:212-219`) · TDD T-REC-01~06 (`docs/05-tdd/TDD.md:159-166`) · E2E-S4 (`docs/05-tdd/TDD.md:242`) · v2 SPEC `?tab=rec` (`docs/design/v2/SPEC.md:421,423,539`) · CURATION "미측정"(`docs/06-handoff/ops/CURATION.md` 품질·점수 행) · MQ-M3P-4 A(생성 레퍼런스 점수 미측정, `docs/design/m3p/SPEC.md` 2.2).
- 전제: **LLM·백엔드 없음**(FR-SEL-04 "LLM OFF에서도 동작"을 기본 경로로). 외부 리서치 0. 문안은 키·자리표시만 — 문장은 Hemingway.
- 표기: [사실] 파일 확인(L1) · [추정] 근거 있는 판단 · [미확인] 확인 전. ★ = 권장안. 질문은 7절 `RQ-NN`.

---

## 0. 한눈에

1. **진입은 이미 있다** [사실]: 카탈로그 제목 행 "추천 받기"(`components/catalog/CatalogHero.tsx:30`) → URL `tab=rec` → h1 "추천" + 자리 문구 "브리프 기반 추천은 다음 단계에서 제공됩니다."(`pages/CatalogPage.tsx:104-106`). 이 자리를 추천 화면으로 바꾼다. 새 라우트·새 버튼·새 아이콘 0.
2. **새 입력 칸 0**: 추천 입력 = 지금 카탈로그 필터 URL 상태(업종·목적·타깃·콘셉트). 자유 서술 "사업 설명"(FR-SEL-03)은 LLM 없이는 점수에 못 쓰므로 RQ-03.
3. **점수 = 정수 배점**(합 100) · 동점은 `id` 코드 단위 사전순 · 같은 입력 → 같은 순위·같은 근거(T-REC-02).
4. **승인 전 변경 0**: 추천을 보는 것만으로 트레이·보드·프로필·저장 레코드 어느 것도 바뀌지 않는다(T-REC-06). "이 추천 적용"은 미리보기 → 적용(저장 확인 뒤 성공) → 되돌리기 3단계. ★RQ-01 B: 적용 = 보드에 담고 **전 선택 행을 그 레퍼런스로** 저장 → 프로필 초안에 즉시 반영(FR-CMP-03 초안 패널).
5. **예산**: 엔진·카드·근거는 전부 `tab=rec`일 때 받는 청크, 적용 쓰기 본문은 조작 뒤. `/catalog` 첫 화면 증분 ≈ 0, `/studio`·`/profile`·`/compare` 증분 0. ADR-004 개정 불필요(추정, 5절).

---

## 1. 추천 입력 · 후보 집합

### 1.1 입력 `RecoBrief` — 이미 받는 값만

| 축 | 출처 [사실] | 값 | 비고 |
|---|---|---|---|
| 업종 | 카탈로그 툴바 업종 칩 `state.filters.industry` (`CatalogPage.tsx:72-77`) | `IndustryId` 1개 또는 없음 (`domain/reference.ts:12`) | TRD "태그일치(업종)" |
| 목적 | 필터 레일 "목적" 체크박스 | `PurposeId[]` booking·inquiry·sales (`reference.ts:14`) | TRD "태그일치(목적)" + "필수섹션충족(목적)" |
| 타깃 | 필터 레일 "타깃" | `AudienceId[]` age-20-30·family·b2b (`reference.ts:13`) | TRD "타깃적합" |
| 무드(콘셉트) | 필터 레일 "콘셉트" | `VisualTagId[]` 12종 (`reference.ts:20-32`) | TRD "태그일치(무드)" |

- 정규화: 배열은 중복 제거 + 코드 단위 사전순 정렬 후 점수 계산(입력 순서가 결과를 바꾸지 않음).
- 쓰지 않는 필터: 레이아웃·라이선스·모션 강도 — 추천 **점수**에는 넣지 않는다. 다만 라이선스 필터는 후보 집합 제한으로만 적용한다 [추정 — RQ-04에서 확인].
- **근거 부족 판정**: 업종도 목적도 없으면 계산하지 않고 "근거 부족" 상태(3.4)로 보낸다. 타깃·무드만으로는 추천하지 않는다(가중치 상 업종·목적이 주 신호).
- T-REC-01 입력 "학부모" [사실]: `AudienceId`에 학부모 값은 없다. 대응값은 `family`. 6절 대응표에 차이로 기록.

### 1.2 후보 집합

| 후보 | 포함 | 근거 |
|---|---|---|
| 레퍼런스 — 큐레이션(`sourceKind` 없음) | ○ | FR-SEL-03 "레퍼런스 5개" |
| 레퍼런스 — 조합 생성(`library_composition`) | ○ | 카탈로그와 같은 노출 규칙(`data/generatedCatalog.ts:13`) |
| `licenseStatus = external_observed` | ✕ (사전 제외) | FR-CAT-04 · T-REC-05 |
| 킷 변형 · 3안 후보 · 디자인 프로필 | ✕ | FR-SEL-03은 레퍼런스 추천. 프로필 자체 추천은 범위 밖 — 필요하면 별건 |

- 후보 수 [사실]: **21개** = 큐레이션 6(`fixtures/references.ts:9-118`, ref-a~f, 점수 측정됨) + 생성 15(`fixtures/generatedReferences.ts`, 생성기 산출물 — 손 수정 금지, 전부 internal·미측정). 빌드 썸네일 21장과 일치.
- 업종 분포 [사실]: cafe-fnb 3(ref-a·f + gen 2) · beauty 4 · medical 4(ref-c + gen 3) · education 4 · professional 4 · fitness 1(ref-d) · **retail 0**. → 어떤 업종도 단독으로 5개를 못 채우는 경우가 있다(medical 4 · fitness 1 · retail 0).
- `external_observed` 레퍼런스는 픽스처에 0개 [사실] → T-REC-05는 테스트에서 후보를 주입해 검증.
- 업종 일치 강제 여부: 업종이 입력돼도 다른 업종 후보를 **제외하지 않는다**(점수로만 밀림). 업종 일치 후보가 3개 미만이어도 카드 3개를 채울 수 있게 하기 위함. 대신 카드에 "업종 다름" 근거가 보인다(2.4).

---

## 2. 점수 규칙 (scoring_version `reco-v1`)

### 2.1 배점 표 — 정수 점수, 합 100

TRD 6.1 가중치(0.35/0.20/0.15/0.15/0.15)를 **정수 점수**로 옮긴다. 소수 가중합은 부동소수 오차로 진짜 동점을 놓쳐 T-REC-02를 깰 수 있다.

| 항목 키 | 만점 | 계산 (전부 정수) | 입력 없음일 때 |
|---|---|---|---|
| `industry` | 15 | `ref.industry === brief.industry` → 15, 아니면 0 | 0 (모든 후보 동일 → 순위 영향 0) |
| `purpose` | 10 | `brief.purpose ∩ ref.purpose` ≠ ∅ → 10, 아니면 0 | 0 |
| `mood` | 10 | 교집합 개수 × 5, 최대 10 | 0 |
| `sections` | 20 | 판정 가능한 입력 목적(2.2 표에 규칙이 있는 것) k개 중 충족 m개 → m = k면 20, 아니면 `m × ⌊20 / k⌋`. 판정 규칙 없는 목적(sales — RQ-06)은 k에서 뺀다 | 0 · k = 0이면 모든 후보 0(상태 `no-input`) |
| `audience` | 15 | `brief.audience ∩ ref.audience` ≠ ∅ → 15, 아니면 0 | 0 |
| `accessibility` | 15 | 측정값 s(0~100) → `⌊s × 15 / 100⌋` | — |
| `performance` | 15 | 측정값 s → `⌊s × 15 / 100⌋` | — |

- 태그일치 35 = industry 15 + purpose 10 + mood 10 (TRD 괄호 "업종·목적·무드" 세 하위 항목을 같은 비중에 가깝게 — 업종을 조금 더 무겁게) [추정 — 하위 배분은 TRD에 없음, RQ-05].
- **미측정 점수**(`scores.status === "unmeasured"`, `reference.ts:48-51` UnmeasuredScores) — 이 초안의 결정 규칙: **0점 + 근거 "미측정"**(지어내지 않는다, CURATION). 이 규칙은 생성 레퍼런스 15개를 큐레이션 6개보다 최대 30점 불리하게 만든다(큐레이션 측정값 89~98 → 품질 2항목 합 25~28점, `references.ts`) → **RQ-02(★B: 품질 2항목은 순위 점수에서 빼고 표시만)**. 참고: 카탈로그 점수순도 미측정을 −1로 맨 뒤에 둔다(`data/referenceRepository.ts:45-51`) [사실].
- 점수 표시는 "NN점"(합). 만점은 `reco-v1` 배점 합(100 — RQ-02 B면 70).

### 2.2 목적별 필수 섹션 (`sections` 항목)

| 목적 | 충족 조건 | 출처 |
|---|---|---|
| booking | **R-04**: 엔진 섹션 정의(`getSectionDefinition(type, variant)`)가 `reservation === true`인 섹션 1개 이상 — 타입이 아니라 **변형** 판정(예약 아닌 `contact` 변형은 불충족) | `engine/gate/requiredSections.ts:55-58` [사실] |
| inquiry | **R-03**: 본문(header·footer 제외)의 **마지막** `contact`/`cta-band`가 후반 1/3(`index ≥ lateThirdStart(n)`)에 있음 — 앞쪽에만 있으면 불충족 | 같은 파일 `:59-64`, `:28` [사실] |
| sales | 판정 규칙 없음 — 엔진도 sales면 R-03/R-04 이슈 0(`requiredSections.ts:55-59`) → `sections` 판정에서 제외(k에서 뺌) | [사실] · RQ-06 |

- 재료: 레퍼런스 **상세**의 섹션 구성(`ReferenceDetail.sections`, `domain/referenceDetail.ts:28`) — 큐레이션 `fixtures/referenceDetails.ts`, 생성 `fixtures/generatedReferenceDetails.ts`. 둘 다 "상세 = 렌더 1:1" 규칙(M3P-7, `referenceDetails.ts:8`) [사실]. 목록 레코드(`DesignReference`)에는 섹션이 없다 [사실] → 추천 청크가 상세 섹션을 받아야 한다(5절 예산).
- `SectionEntry = { name, variant }`(`referenceDetail.ts:12-15`, 예 `{ name: "Hero", variant: "fullbleed-left" }`) [사실]. `name` → 엔진 `SectionType` 대응(소문자화로 되는지, "CTA Band" 같은 다단어) [미확인] — 구현 E0에서 21개 전수 대응표를 테스트로 고정(RECO-AC-05).
- **판정 방식(★RQ-06 A)**: 런타임에 엔진을 import하지 않는다(레지스트리를 카탈로그 청크로 끌고 옴 [추정]). 대신 **파생 표 `RECO_SECTION_FIT`**(레퍼런스 id → 충족 목적 집합, 21행)를 데이터로 둔다. 가드 테스트가 각 레퍼런스의 상세 섹션을 `Placement`로 바꿔 엔진 `requiredSectionIssues(sections, purpose)`(`requiredSections.ts:82`, export [사실])를 booking·inquiry마다 돌리고, R-03/R-04 이슈 0 ⇔ 표에 목적 있음을 단언한다(RECO-AC-05). → 엔진과 의미가 갈라질 수 없고, 추천 청크가 상세 픽스처를 받지 않는다(5절).
- 표 갱신: 생성기·큐레이션 상세가 바뀌면 가드가 실패 → 표를 같은 커밋에서 갱신(생성기 산출물 손 수정 금지 규칙과 충돌 없음 — 표는 별도 파일).

### 2.3 정렬 · 동점 · 결정성

1. 정렬 키: (총점 내림차순, `ref.id` **코드 단위** 오름차순 — `a < b` 비교, `localeCompare` 금지(로캘 의존)). 기존 코드 관례와의 차이 [사실]: 카탈로그 점수순은 tie-break 없이 입력 순서(안정 정렬)에 맡기고(`referenceRepository.ts:45-51`), `internalCompose.ts:306`은 `localeCompare`를 쓴다. id가 ASCII(`ref-*`·`gen-*`)라 현재 데이터에서는 결과가 같지만 추천은 명시 비교로 고정한다.
2. 반환 개수 `RECO_LIMIT` = 5(정본 FR-SEL-03·T-REC-01). 화면 첫 노출은 3장 + 나머지 펼치기 — **RQ-07**.
3. 총점 0인 후보는 반환하지 않는다. 반환 후보가 0이면 "근거 부족"(3.4).
4. 비결정 요소 0: `Date`·`Math.random`·로캘 정렬·`Set` 순회 순서에 기대는 출력 금지. 입력 배열은 1.1 정규화.
5. 결과는 `Object.freeze`된 새 배열(입력 불변).

### 2.4 근거 구조 (T-REC-03)

- 결과마다 근거 = **정확히 3항목**(T-REC-03). 정렬: (점수 내림차순, 2.1 표의 항목 순서). 양수 항목이 3개 미만이면 0점·`no-input`·`unmeasured` 항목이 같은 정렬로 채워지고, 각자 상태와 값(`0/15`, "미측정")을 그대로 보여 준다 — 근거가 "없는 이유"도 근거다. RQ-02 B면 품질 2항목은 순위 점수 밖이지만 근거 후보에는 남는다(`unmeasured` 또는 측정값 표시, `points` 0·`max` 0으로 순위 무관 표기).
- "펼치기"는 전 항목(7개, 0점·미측정 포함)을 보여 준다.

| 필드 | 형식 | 예 (문장 아님 — 키) |
|---|---|---|
| `item` | 2.1 항목 키 | `industry` |
| `points` · `max` | 정수 | 15 · 15 |
| `matched` | 일치 값 id 배열(코드 순) | `["medical"]` |
| `state` | `match` · `partial` · `miss` · `no-input` · `unmeasured` | `match` |
| 문구 키 | `reco.reason.<item>.<state>` | `reco.reason.industry.match` |
| 자리표시 | `{label}`(값 라벨, 기존 라벨 표) · `{points}` · `{max}` | |

- 문안(Hemingway 담당): 키 7항목 × 상태 = 표 1장. 화면 요약 줄은 상위 3개 문구를 " · "로 잇는다.
- LLM 요약(FR-SEL-04 선택형)은 이번 범위 밖 — 플래그 자리만 계약에 둔다(T-REC-04 대응 6절).

---

## 3. 화면

### 3.1 진입·배치

| 위치 | 내용 |
|---|---|
| 진입 | `/catalog` "추천 받기"(outline, `sparkle`) → `tab=rec` [사실]. URL 직접 진입(`/catalog?tab=rec&…`)도 같은 화면 |
| 제목 | h1 "추천"(기존) + 부제 = 입력 요약 문구 키 `reco.brief.summary`({업종}·{목적}·{타깃}·{무드}) |
| 필터 | 레일·업종 칩은 그대로 동작. 바꾸면 추천을 다시 계산(URL이 원천) |
| 결과 영역 | 기존 `section#CATALOG_RESULTS_ID`(`aria-label="레퍼런스 목록"`) 자리 — rec 탭에서는 접근 이름을 "추천 결과"로 [추정, 문안 키 `reco.region.label`] |
| "전체 보기" | 유지(기존 링크, `tab=all`) |

### 3.2 후보 카드 (기본 3장)

- 카드 = 기존 `ReferenceCard` 정보(썸네일·제목·캡션·색 점) **+ 추천 줄 3개**: 순위("1"·"2"·"3" — 문안 키), 총점 `{points}점`, 근거 요약 1줄(2.4).
- 저장·비교 담기 아이콘 버튼은 기존 카드 그대로(이건 사용자가 직접 하는 일반 조작 — 승인 흐름과 별개).
- **근거 펼치기**: `<details><summary>` 대신 `button[aria-expanded][aria-controls]` + 목록(7항목, `{label} {points}/{max}`). 근거 목록은 `<dl>` 또는 `<ul>` [추정 — DS 관례 따름].
- "이 추천 적용"(primary, 카드당 1개). 3.3 흐름.
- 나머지 2개(5개 중 4·5위): "추천 2개 더 보기" 텍스트 버튼(RQ-07 ★A).

### 3.3 승인 후 적용 — 미리보기 → 적용 → 되돌리기

적용의 **대상**은 RQ-01. 이 명세의 기본(★B) = **보드에 담고 모든 선택 행을 그 레퍼런스로 저장**(기존 보드 저장소 연산 조합 — `addReference` · `savePicks(picks, custom, expectedRevision)`, `data/compareBoardRepository.ts:42,46` [사실]).

현황 [사실]:
- 트레이 담기(`addColumn`)는 열만 추가하고 **picks는 바꾸지 않는다**(`domain/boardColumns.ts:56`). 프로필 초안은 picks에서 만들어지고 Hero 선택이 없으면 `needs-hero`(`domain/profileDraft.ts`) → **트레이 담기만으로는 E2E-S4 "승인 → 프로필 반영"을 못 채운다**(Codex P1).
- 트레이 `add(id)`는 저장 완료 전에 `ok: true`를 돌려준다(낙관적, `features/compare/CompareTrayContext.tsx:79-85`). 저장 실패는 큐가 재조회로 삼키고, 재조회도 실패하면 화면 상태 유지(`:54-64`) → **트레이 `add` 반환값으로 "적용됨"을 알리면 안 된다**(Codex P2).
- 상세 "템플릿으로 가져오기"는 자리 문구뿐(`components/detail/DetailSidebar.tsx:19,77-78`). `selection_mode`는 보드에서 레퍼런스 1개만 고르고 커스텀 스타일이 없으면 `"template"`(`domain/profileDraft.ts:190`). `ProfileOrigin`에 추천 값 없음(`domain/profile.ts:13`).

| 단계 | 화면 | 바뀌는 것 |
|---|---|---|
| 0 보기 | 카드·근거 | **없음**(T-REC-06) |
| 1 미리보기 | "이 추천 적용" → 확인 대화상자(기존 `dialog` 패턴). 내용 키 `reco.apply.preview.*`: "{title}을(를) 비교 보드에 담고 Hero·카드·Footer 등 {n}개 항목을 이 레퍼런스로 고릅니다" + **바뀌는 선택 목록**(행 · 지금 값 → 새 값). 지금 선택이 비어 있으면 "새로 고름" | **없음** |
| 2 적용 | "적용" → 버튼 `aria-busy` + `reco.apply.pending`. 순서: (열이 없으면) `addReference` → `savePicks(새 picks, 지금 custom, 받은 revision)`. **두 호출이 모두 resolve한 뒤에만** "적용됨" + status `reco.status.applied` | 보드 열 ≤ 1개 추가 + picks 교체 → 초안 패널 즉시 반영. 커스텀 스타일(색·글꼴)은 유지 |
| 2′ 실패 | 어느 호출이든 reject → 카드 안 `role=alert` 줄 `reco.apply.error` + "다시 시도". 열은 들어갔고 picks 저장만 실패했으면 재시도는 `savePicks`만. `expectedRevision` 충돌이면 `reco.apply.conflict`("보드가 바뀌었습니다") + 미리보기 다시 열기(최신 보드로 차이 재계산) | 실패한 쓰기 0 · 성공한 열 추가는 남음(미리보기 문구에 명시) |
| 3 되돌리기 | 카드 안 "되돌리기"(이번 화면·이번 세션만). `savePicks(적용 전 picks, custom, revision)` → 이번에 새로 넣은 열이면 `removeReference`. 둘 다 resolve 뒤 status `reco.status.undone` · 실패는 2′과 같은 규칙 | 적용 전 picks·열 구성으로 복귀. 적용 뒤 사용자가 보드에서 더 바꿨으면(revision 다름) 되돌리기 비활성 + 이유 `reco.undo.stale` |

- 비활성 조건: 보드 열 6개 꽉 참이고 그 레퍼런스가 열에 없음 → 적용 비활성 + 이유(기존 `COMPARE_LIMIT_NOTICE`). 이미 열에 있으면 열 추가 없이 picks만.
- 트레이 UI 동기화: 적용·되돌리기는 **트레이 컨텍스트에 새 메서드**(예: `applyReference(id, picks)` → `Promise<결과>`, 큐 직렬화 공유)로 넣어 트레이 필·보드 상태가 같은 큐를 탄다. 컨텍스트 밖에서 저장소를 직접 부르지 않는다(낙관 상태와 갈라짐). 이 메서드는 앱 데이터 계층 내부 API(4.2 C2).
- picks 대상 행: 그 레퍼런스가 값을 가진 모든 `PickableRowId`(비교 데이터 기준). 생성 레퍼런스의 비교 행 커버리지 [미확인 — 구현 E0에서 21개 전수 확인].
- 프로필 **버전** 확정은 기존 `/compare` "확정"(`domain/confirmGate.ts`) 그대로 — 적용은 초안까지. E2E-S4 "프로필 반영" = 초안 패널 반영으로 해석(6절 대응표).

### 3.4 상태

| 상태 | 조건 | 표시 (문안 키) | 알림 |
|---|---|---|---|
| 근거 부족 | 업종·목적 둘 다 없음, 또는 반환 0 | `reco.empty.noBrief` + "업종 고르기"(업종 칩으로 포커스) · "목적 고르기"(레일 목적 그룹으로 — <1024면 레일 펼침) | 없음(정적 안내) |
| 결과 적음 | 반환 1~2개 | 있는 만큼 카드 + `reco.few` 한 줄 | 없음 |
| 로딩 | 추천 청크 받는 중 | 결과 영역 `aria-busy="true"` + 카드 자리 스켈레톤 3장(기존 로딩 패턴) | 없음(`LoadingState`의 status를 쓰지 않는다 — 페이지 status 1 유지) |
| 오류 | 청크 로드 실패·계산 예외 | 결과 영역 위 `role=alert` 줄 `reco.error` + "다시 시도" | 그 alert 1개 — 적용 실패도 이 한 자리에 문장만 바꿔 쓴다(화면 alert 1) |
| 정상 | 반환 ≥ 3 | 카드 3장 + 더 보기 | 필터 변경으로 재계산될 때만 페이지 status(3.6): `reco.status.updated`({n}개) |
| 적용 중 | 3.3 단계 2 대기 | 버튼 `aria-busy` + `reco.apply.pending`, 대화상자 닫힘 | 없음 |
| 적용 실패 | 3.3 단계 2′ | 카드 안 `role=alert` 줄 + "다시 시도" | 그 alert(화면 alert는 한 번에 1개 — 추천 영역 오류와 같은 자리 재사용) |
| 적용됨 | 3.3 단계 2 두 호출 resolve 뒤 | 카드 "적용됨" + 되돌리기 | 페이지 status `reco.status.applied` |
| 되돌림 | 3.3 단계 3 | 카드 원상태 | 페이지 status `reco.status.undone` |

### 3.5 반응형 (390 / 1280)

| 폭 | 배치 |
|---|---|
| 1280 | 레일(220) + 결과 3열 = 카드 3장이 한 줄(기존 `xl:grid-cols-3`). 근거 펼침은 카드 안 아래로(카드 높이만 늘어남) |
| 390 | 레일 접힘(기존 토글) · 카드 1열 · 순위·총점 줄이 썸네일 위가 아니라 제목 줄 오른쪽 · "이 추천 적용"은 카드 폭 전체 · 대화상자는 기존 모바일 대화상자 규칙 |

- 실화면 관찰: **하지 않음** — 진입·자리 문구·카드 그리드는 소스 L1로 확인(`CatalogPage.tsx:104-130`). preview 미기동.

### 3.6 포커스 · live region (화면당 status 1 · alert 1 원칙)

1. "추천 받기"로 rec 탭에 들어가면 포커스 → 결과 영역(`CATALOG_RESULTS_ID`, `tabIndex=-1` 기존) [사실 — 요소 존재].
2. 근거 펼치기: 포커스는 버튼에 머문다. 펼친 목록은 버튼 바로 뒤 DOM 순서.
3. 대화상자: 열 때 첫 버튼("적용" 아님 — "취소")에 포커스, 닫으면 "이 추천 적용" 버튼으로 복귀. 적용 후에는 같은 카드의 "되돌리기"로, 되돌린 뒤에는 "이 추천 적용"으로.
4. **알림 영역 — status 1 · alert 1** [사실 확인 결과]: 앱 셸(`AppLayout`)에는 공용 live region이 **없다**(`LoadingState`의 status·`RouteErrorBoundary`의 alert만). 화면마다 항상 그려 둔 sr-only `<p role="status">` + `<span key>`(`Announcement{text,key}`, `components/compare/DraftPanel.tsx:33-37`) 패턴을 쓰고, 공용 announce 훅은 없다(각 화면이 콜백을 props로 내림). `/catalog`에는 이미 `role=status` 1개가 있다 — 비교 트레이 필의 `notice`(`components/catalog/CompareTrayBar.tsx:97`, `CatalogPage.tsx` `setNotice`).
   - ★ 추천 알림(재계산·적용·되돌림)은 **그 기존 status를 같이 쓴다**: `CatalogPage`의 `notice`를 `Announcement{text,key}`로 바꿔 같은 문장도 다시 읽히게 한다. 새 `role=status` 0 → 페이지 status 1 유지. 트레이 필이 접히거나 비어 있을 때도 status 요소가 DOM에 남는지 [미확인 — 구현 E0에서 확인, 없으면 RQ-09].
   - alert는 추천 결과 영역의 오류 줄 1개만(3.4). 새 `aria-live` 속성 0.
5. 필터 변경 재계산 알림은 디바운스 없이 "결과가 바뀐 경우에만" 1회(같은 순위면 알림 0).

---

## 4. 데이터 · 엔진 계약

### 4.1 새 타입·모듈 (계약 변경 아님 — 새 순수 모듈)

| 이름 | 위치(제안) | 내용 |
|---|---|---|
| `RecoBrief` | `domain/recommend.ts` | 1.1 표 4축 |
| `RecoItemKey` | 같은 곳 | `industry`·`purpose`·`mood`·`sections`·`audience`·`accessibility`·`performance` |
| `RecoReason` | 같은 곳 | 2.4 표 |
| `RecoResult` | 같은 곳 | `{ referenceId, total, max, reasons(top3), breakdown(7) }` |
| `RECO_SCORING_VERSION` | 같은 곳 | `"reco-v1"` |
| `RECO_WEIGHTS` | 같은 곳 | 2.1 표(동결 객체) |
| `RECO_SECTION_FIT` | `domain/recoSectionFit.ts` | 레퍼런스 id → 충족 목적(booking·inquiry) — 엔진 판정 파생 표, 가드 테스트로 고정(2.2) |
| `recommend(brief, refs, fit)` | `domain/recommend.ts` | 순수 함수 → `readonly RecoResult[]` |
| `parseRecoBrief(filters)` | 같은 곳 | 카탈로그 필터 → `RecoBrief`(정규화) |

### 4.2 엔진·저장 계약 변경 (사용자 질의 대상)

| # | 변경 | 필요 조건 | 영향 | 질문 |
|---|---|---|---|---|
| C1 | 없음 | RQ-01 A(트레이 담기만 — 기능명 "비교 보드에 담기"로, E2E-S4 미충족 명시) | 저장 레코드 영향 0 | RQ-01 |
| C2 | 트레이 컨텍스트 `applyReference`(+되돌리기) — 기존 `addReference`·`savePicks`·`removeReference` 조합, 저장 결과를 Promise로 돌려줌 | ★RQ-01 B | 엔진 계약 0 · 보드 저장소 공개 면 0 · 보드 레코드 스키마 0(기존 picks 쓰기). 앱 데이터 계층 내부 API 1개 추가 | RQ-01 |
| C2′ | 레퍼런스 → 프로필 버전 직행(보드 우회) | RQ-01 C | 프로필 쓰기 진입점·`ProfileOrigin` 새 값 — **엔진/저장 계약** | RQ-01 |
| C3 | 프로필에 추천 출처 기록(`source_reference_ids`·`scoring_version`) | 프로필 버전에서 "추천으로 왔음"을 남기려면 | 프로필 레코드 필드 + 영속 스키마(ADR-007) | RQ-08 |
| C4 | 추천 런타임이 엔진 `requiredSectionIssues`를 직접 호출 | RQ-06 B | 엔진 레지스트리가 카탈로그 rec 청크로 — 공개 면 변경은 0(이미 export)이나 번들 경계 변경 | RQ-06 |

### 4.3 저장 레코드 영향

- ★B 기준: 새 저장 키 0, 스키마 버전 변경 0. 쓰는 것은 기존 보드 레코드(열·picks)뿐. 추천 결과는 URL(필터)에서 매번 다시 계산 — 저장하지 않는다.
- 되돌리기 재료(적용 전 picks·새로 넣은 열 여부·적용 뒤 revision)는 화면 상태(`useState`)만 — 새로고침하면 사라진다. 보드는 메모리라 새로고침에 비는 기존 규칙(`main.tsx:28` [사실 — 조사 보고])과 같다.

---

## 5. 예산 추정 (ADR-004)

현 실측 [사실 — 이 워크트리 `npm run build` 2026-10-18, exit 0]:

| 라우트 | 첫 화면 / 한도 | 진입 직후 / 한도 |
|---|---|---|
| `/catalog` | 100.05 / 101 (멈춤선 100.90 · 개정 7) | 102.39 / 125 |
| `/compare` | 98.95 / 100 | 122.66 / 125 |
| `/profile` | 99.52 / 100 | 119.92 / 125 |
| `/studio/:projectId` | 91.33 / 100 | 정규화 128.71 (상한 129.13 · 개정 17·18) · raw 130.01 / 130.5 |

| 들어가는 것 | 어디에 | 추정 증분 (gzip) |
|---|---|---|
| rec 분기 lazy 래퍼(자리 문구 교체) | `/catalog` 첫 화면 | +0.00 ~ +0.05 [추정 — 자리 문구 삭제분과 상쇄] |
| `domain/recommend.ts` + 카드 추천 줄·근거 목록·대화상자 본문 | rec 청크(**`tab=rec`일 때 자동** → `/catalog` 진입 직후에만) | +3 ~ +5 [추정] |
| `RECO_SECTION_FIT` 파생 표(21행) | rec 청크 | +0.2~0.4 [추정]. 상세 픽스처(소스 gzip 2.07 + 3.33 ≈ 5.4)는 **받지 않는다**(2.2 ★A) |
| 적용 대화상자 차이 목록 · `applyReference` 본문 | 조작 뒤 청크("이 추천 적용" onClick) | 판정 밖. `savePicks`는 첫 호출 때 `boardInput`(zod, 조작 뒤 17.29) 로드 — 기존 규칙(`data/memoryCompareBoardRepository.ts:8`) |
| 미리보기 "지금 값 → 새 값" 라벨 재료(비교 행 데이터) | 조작 뒤 | 판정 밖 [추정 — 트레이가 이미 받는 데이터면 0] |

- 합: `/catalog?tab=rec` 진입 직후 ≈ 102.39 + 3.5~5.5 = **106~108 / 125** [추정] — 개정 불필요.
- `/catalog` 첫 화면: 멈춤선 100.90까지 0.85 → 래퍼 증분 안에 듦 [추정]. **rec 청크를 `tab=all` 기본 진입에서 받으면 안 된다**(가드: 아래 검사기 시나리오).
- `/compare`·`/profile`·`/studio`: 0(★B 쓰기 본문은 `/catalog` 조작 뒤). 개정 17·18 몫 사용 0.
- 검사기: `app/scripts/check-bundle-size.mjs` SCENARIOS에 **"/catalog (추천)"** 행 추가(auto = EAGER_DYNAMIC + rec 청크 진입점) — **크기**만 잰다. 검사기는 정적 import + 손으로 적은 auto 목록 합산이라(`app/scripts/bundleBudget.mjs:78-81`) "기본 진입에서 rec 청크를 안 받음"은 증명하지 못한다(Codex P2 — 합성 manifest로 재현됨). **로드 조건은 별도 테스트**로: `tab=all` 렌더에서 rec 로더 호출 0 · `tab=rec`에서 1(기존 "번들 분류 근거" 테스트 관례 — `WriteBodyLoad.test`·`BoardInputLoad.test`, `check-bundle-size.mjs` 주석) — RECO-AC-14.
- 파생 표 방식이라 `/references/:id` 상세 픽스처 청크와 공유가 생기지 않는다 [추정] → 구현 E0에서 다른 라우트 ±0.03 실측.

---

## 6. 수용 기준 · 대응표

`[U]` 단위(vitest 순수 함수·컴포넌트) · `[V]` 실화면(브라우저, ego-browser).

| ID | 기준 | 구분 |
|---|---|---|
| RECO-AC-01 | `recommend`는 노출 후보만 대상, 총점 내림차순, 최대 5개 | [U] |
| RECO-AC-02 | 총점 동점 2개 이상이면 `id` 코드 단위 오름차순. 입력 배열 순서를 섞어도 결과 동일(10회 무작위 셔플 → 깊은 동일) | [U] |
| RECO-AC-03 | 같은 입력 2회 호출 → 깊은 동일 · 결과 동결 · 입력 불변 | [U] |
| RECO-AC-04 | 결과마다 근거 **정확히 3개**, (기여 점수 내림차순, 항목 순). 양수 항목이 모자라면 0점·`no-input`·`unmeasured`가 상태·값과 함께 채움(업종만 입력 + 미측정 후보 반례 포함). 펼침 breakdown은 7항목 | [U] |
| RECO-AC-05 | `RECO_SECTION_FIT` 21행 × booking·inquiry가 엔진 `requiredSectionIssues`의 R-04·R-03 결과(이슈 0 ⇔ 충족)와 전부 일치(가드). 변환 함수 반례: 문의 섹션이 앞쪽에만 있음 → inquiry 불충족 · 예약 아닌 `contact` 변형만 있음 → booking 불충족 · 모르는 `name` → 변환 실패(조용히 건너뛰지 않음) | [U] |
| RECO-AC-06 | 미측정 레퍼런스: 품질 항목 `unmeasured` 상태, 지어낸 숫자 0 (RQ-02 결정에 따라 점수 0 또는 제외) | [U] |
| RECO-AC-07 | `external_observed` 후보 0 | [U] |
| RECO-AC-08 | 업종·목적 둘 다 없으면 계산 안 함 → "근거 부족" + 업종·목적 고르기 버튼 포커스 이동 | [U]+[V] |
| RECO-AC-09 | 추천 화면 진입·근거 펼치기·필터 변경만으로 트레이·보드·프로필·저장소 쓰기 호출 0 | [U] |
| RECO-AC-10 | "이 추천 적용" → 대화상자(바뀌는 선택 목록) → "취소"면 쓰기 호출 0 · "적용"이면 (열 추가 ≤ 1 + `savePicks` 1) 뒤 초안 패널이 그 레퍼런스 선택을 보임 · "되돌리기"면 picks·열 구성이 적용 전과 깊은 동일 | [U]+[V] |
| RECO-AC-11 | 열 6개 꽉 참 + 미포함이면 적용 비활성 + 이유 · 이미 열에 있으면 열 추가 0 · 적용 뒤 보드 revision이 바뀌면 되돌리기 비활성 | [U] |
| RECO-AC-16 | 저장 결과 확인: `addReference`/`savePicks`가 resolve하기 전에는 "적용됨"·status 0. reject(목)면 alert 1 + "다시 시도"(picks만 실패 → 재시도는 `savePicks`만) · revision 충돌이면 `reco.apply.conflict` · 되돌리기 실패도 같은 규칙 | [U] |
| RECO-AC-12 | live region 새 요소 0, 재계산 결과가 같으면 알림 0, 적용·되돌리기 각 status 1회, 오류 alert 1회 | [U] |
| RECO-AC-13 | 390·1280에서 카드·근거·대화상자 가로 넘침 0, 키보드만으로 적용·되돌리기 완료 | [V] |
| RECO-AC-14 | (a) 로드 조건 테스트: `tab=all` 렌더에서 rec 로더 호출 0 · `tab=rec`에서 1 · "적용" 전 쓰기 본문 로더 0 (b) 검사기: `/catalog (추천)` 진입 ≤ 125 · `/catalog` 첫 화면 ≤ 100.90 · 다른 라우트 ±0.03 | [U] |
| RECO-AC-15 | 근거 문구는 키 표에서만(하드코딩 문장 0) · hex/px 0 | [U] |

| 정본 | 대응 | 차이 |
|---|---|---|
| T-REC-01 (병·의원·학부모·예약 → 5개, 내림차순) | AC-01 · 입력 `{industry: medical, audience: [family], purpose: [booking]}` | "학부모" 값 없음 → `family`로 대응. medical 레퍼런스는 4개(ref-c + gen-medical-1~3) [사실] → 5위는 다른 업종 후보(1.2 "업종 불일치 제외 안 함" 덕분에 5개 충족) |
| T-REC-02 (동점 id 사전순) | AC-02 | 사전순 = 코드 단위(로캘 정렬 아님)로 명확화 |
| T-REC-03 (근거 3개) | AC-04 | 차이 없음 — 항상 3개(양수 모자라면 0점·미측정 항목이 상태와 함께 채움) |
| T-REC-04 (LLM OFF 동작·실패 시 규칙 근거) | AC-03(LLM 없음 기본) | LLM 경로 미구현 — ON 케이스는 범위 밖(P2, rs8 C안 "제외") |
| T-REC-05 (external_observed 없음) | AC-07 | — |
| T-REC-06 (조회만으로 프로필 불변) | AC-09 | 프로필뿐 아니라 트레이·보드까지 불변으로 확장 |
| E2E-S4 (5개 → 근거 → 승인 → 프로필 반영, 승인 전 불변) | AC-08~13·16 [V] | 화면 첫 노출 3개(RQ-07) · ★B: "프로필 반영" = 초안 패널 반영(picks), 버전 확정은 기존 `/compare` "확정". A를 고르면 E2E-S4 **미충족**(트레이는 picks를 안 바꿈) |
| FR-SEL-03 "사업 설명·타깃" 입력 | 1.1 | 자유 서술 없음 — RQ-03 |

---

## 7. 설계 질문

| ID | 질문 | 선택지 | ★권장·근거 | 분류 |
|---|---|---|---|---|
| RQ-01 | "이 추천 적용"의 대상 | A 비교 트레이 담기만(기능명 "비교 보드에 담기" — picks 안 바뀜, E2E-S4 미충족) · B 보드에 담고 전 선택 행을 그 레퍼런스로 저장(기존 저장소 연산 조합 + 트레이 컨텍스트 내부 메서드 1개, C2) · C 프로필 버전 직행(C2′) | ★B — E2E-S4(승인 → 초안 반영)를 채우면서 엔진·저장 계약 0. 비용: 기존 선택을 덮어쓰므로 미리보기 차이 목록·되돌리기가 필수. C는 보드·확정 흐름을 우회하는 새 계약 | **데이터 계약(내부)** · C면 엔진 계약 |
| RQ-02 | 미측정 품질 점수 | A 0점(TRD 공식 그대로, 생성 15개가 늘 불리) · B 품질 2항목을 순위 점수에서 빼고(만점 70) 표시만 · C 미측정 = 측정 평균값 대입 | ★B — 지어낸 숫자 0 + 큐레이션 편향 0. A는 "점수 높은 순 = 큐레이션 순"이 됨. C는 측정하지 않은 값을 만드는 것(CURATION 위반 소지) | 점수 규칙(TRD 6.1 개정) |
| RQ-03 | FR-SEL-03 "사업 설명" 자유 입력 | A 이번 범위 제외(필터 4축만) · B 키워드 → 태그 사전 매칭(규칙) | ★A — 새 입력 칸·사전 유지비 0. B는 새 데이터(사전) 큐레이션 필요 | 범위 |
| RQ-04 | 라이선스·레이아웃·모션 필터를 추천에서 | A 라이선스만 후보 제한, 나머지 무시 · B 모든 필터를 후보 제한으로 · C 전부 무시 | ★A — 추천은 "필터 결과 정렬"이 아니라 "브리프 기반 제안". 라이선스는 권리 의사라 존중 | UX |
| RQ-05 | 태그일치 35의 하위 배분 | A 업종 15·목적 10·무드 10 · B 균등 12·12·11 | ★A — 업종이 첫 신호(PRD 시나리오 1) | 점수 규칙 |
| RQ-06 | 필수 섹션 판정 방식 | A 엔진 판정 파생 표 `RECO_SECTION_FIT` + 엔진 대조 가드(런타임 엔진 import 0, sales는 판정 규칙 없음 → k에서 제외) · B 런타임에 엔진 `requiredSectionIssues` 직접 호출(C4) | ★A — 엔진과 의미 일치는 가드로 보장, 상세 픽스처·엔진 레지스트리를 rec 청크에 안 넣음. B는 번들 경계 변경(레지스트리 크기 [미확인]) | 번들·엔진 경계 |
| RQ-07 | 반환 5 vs 화면 3 | A 엔진 5 반환 · 화면 3장 + "2개 더 보기" · B 엔진·화면 모두 3(정본 T-REC-01·FR-SEL-03 개정) · C 5장 모두 노출 | ★A — 정본(5)과 BRIEF(카드 3) 둘 다 만족 | 정본 충돌 |
| RQ-08 | 프로필에 추천 출처 기록 | A 기록 안 함 · B `source_reference_ids` + `scoring_version` 저장(C3) | ★A — 저장 스키마 변경 0. 출처 기록이 필요해지면 프로필 v 다음 레인 | **엔진·저장 계약** |
| RQ-09 | 추천 알림을 둘 status | A 카탈로그 기존 트레이 status(`notice`) 공유 · B 추천 영역 전용 sr-only status 추가(트레이 status는 그대로 → 화면 status 2) | ★A — 화면당 status 1 원칙. 트레이 status가 조건부 렌더면 상시 렌더로 옮기는 것까지 A 범위 | UX·접근성 |
| RQ-10 | 적용 전 선택이 비어 있지 않을 때 기본 동작 | A 대화상자에서 차이 보이고 전부 교체 · B 빈 행만 채움(기존 선택 보존) | ★A — "이 추천 적용"의 의미가 일관(결과가 추천과 같음), 되돌리기로 복구 가능. B는 결과가 섞여 근거와 화면이 어긋남 | UX |

- 기존 테스트 영향 [사실]: `pages/CatalogPage.test.tsx:198-215`(V2-AC-21)가 rec 탭 자리 문구를 고정한다 — 구현 레인이 RECO-AC-08 기준으로 바꾼다(명세 범위 안의 의도된 변경).
- 예산 상향 질문: **없음**(5절 추정 범위 안). 구현 E0 실측이 `/catalog` 첫 화면 100.90 또는 다른 라우트 ±0.03을 넘으면 그때 재상신.
- 새 의존성: **없음**.


---

## 8. 리뷰 반영 기록 (Codex adversarial-review 1회, branch `a0068764..75bbca7c`)

| # | 지적 | 판정 | 반영 |
|---|---|---|---|
| 1 | [P1] 트레이 담기만으로는 프로필에 반영 안 됨(`addColumn`은 picks 불변) | 타당 — 코드 확인 | RQ-01 ★A → ★B(보드 담기 + 전 행 picks 저장), A는 E2E-S4 미충족으로 명시 · 3.3 재작성 · C2 |
| 2 | [P2] 낙관적 트레이 `add` 반환을 적용 완료로 취급 | 타당 — `CompareTrayContext.tsx:54-64,79-85` | 저장 resolve 뒤에만 성공 · 실패/충돌/부분 실패 규칙 · RECO-AC-16 |
| 3 | [P2] 필수 섹션 판정이 엔진 R-03(후반 1/3)·R-04(예약 변형)와 다름 | 타당 | 2.2를 R-03/R-04 의미로 · 파생 표 + `requiredSectionIssues` 대조 가드 · 반례 AC-05 |
| 4 | [P2] auto 목록 제외는 청크 미요청 증명이 아님 | 타당 — `bundleBudget.mjs:78-81` | 크기/로드 조건 분리 · 로더 호출 테스트 AC-14(a) |
| 5 | [P2] 근거 ≤3 허용이 T-REC-03과 어긋남 | 타당 | 근거 항상 3개(0점·미측정이 상태와 함께 채움) · AC-04 · 대응표 차이 제거 |

- 라운드: 1회(BRIEF "Codex 1회"). 재검증 없음 — 반영분은 명세 문서 내부 정합만 메인이 재확인.
