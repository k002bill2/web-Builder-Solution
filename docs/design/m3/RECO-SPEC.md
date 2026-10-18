# M3-0 RECO-SPEC — 추천 모드 (규칙 기반 점수 · 근거 · 승인 후 적용)

- 리비전: **r0 초안** · 작성 2026-10-18 · Designer (Orca + Claude Code) · base `a0068764`
- 범위: DEVELOPMENT_PLAN M3 **3.2**(추천 점수 — API 대신 브라우저 `domain/` 순수 함수) · **3.4**(추천 모드 UI, 승인 후 적용). 앱 코드 변경 0(명세만).
- 정본: PRD FR-SEL-03·04 (`docs/02-prd/PRD.md:98-99`) · TRD 6.1 (`docs/03-trd/TRD.md:212-219`) · TDD T-REC-01~06 (`docs/05-tdd/TDD.md:159-166`) · E2E-S4 (`docs/05-tdd/TDD.md:242`) · v2 SPEC `?tab=rec` (`docs/design/v2/SPEC.md:421,423,539`) · CURATION "미측정"(`docs/06-handoff/ops/CURATION.md` 품질·점수 행) · MQ-M3P-4 A(생성 레퍼런스 점수 미측정, `docs/design/m3p/SPEC.md` 2.2).
- 전제: **LLM·백엔드 없음**(FR-SEL-04 "LLM OFF에서도 동작"을 기본 경로로). 외부 리서치 0. 문안은 키·자리표시만 — 문장은 Hemingway.
- 표기: [사실] 파일 확인(L1) · [추정] 근거 있는 판단 · [미확인] 확인 전. ★ = 권장안. 질문은 7절 `RQ-NN`.

---

## 0. 한눈에

1. **진입은 이미 있다** [사실]: 카탈로그 제목 행 "추천 받기"(`components/catalog/CatalogHero.tsx:30`) → URL `tab=rec` → h1 "추천" + 자리 문구 "브리프 기반 추천은 다음 단계에서 제공됩니다."(`pages/CatalogPage.tsx:104-106`). 이 자리를 추천 화면으로 바꾼다. 새 라우트·새 버튼·새 아이콘 0.
2. **새 입력 칸 0**: 추천 입력 = 지금 카탈로그 필터 URL 상태(업종·목적·타깃·콘셉트). 자유 서술 "사업 설명"(FR-SEL-03)은 LLM 없이는 점수에 못 쓰므로 RQ-03.
3. **점수 = 정수 배점**(합 100) · 동점은 `id` 코드 단위 사전순 · 같은 입력 → 같은 순위·같은 근거(T-REC-02).
4. **승인 전 변경 0**: 추천을 보는 것만으로 트레이·보드·프로필·저장 레코드 어느 것도 바뀌지 않는다(T-REC-06). "이 추천 적용"은 미리보기 → 적용 → 되돌리기 3단계.
5. **예산**: 엔진·카드·근거는 전부 `tab=rec`일 때 받는 청크. `/catalog` 첫 화면 증분 ≈ 0, `/studio`·`/profile`·`/compare` 증분 0(★RQ-01 A 기준). ADR-004 개정 불필요(추정, 5절).

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
| booking | 예약 섹션(엔진 섹션 정의 `reservation === true`) 1개 이상 | `engine/gate/requiredSections.ts` isReservation [사실] |
| inquiry | `contact` 또는 `cta-band` 1개 이상 | 같은 파일 isInquiry [사실] |
| sales | [미확인] — 엔진에 판매 필수 섹션 판정 없음으로 보임 | RQ-06 |

- 재료: 레퍼런스 **상세**의 섹션 구성(`ReferenceDetail.sections`, `domain/referenceDetail.ts:28`) — 큐레이션 `fixtures/referenceDetails.ts`, 생성 `fixtures/generatedReferenceDetails.ts`. 둘 다 "상세 = 렌더 1:1" 규칙(M3P-7, `referenceDetails.ts:8`) [사실]. 목록 레코드(`DesignReference`)에는 섹션이 없다 [사실] → 추천 청크가 상세 섹션을 받아야 한다(5절 예산).
- `SectionEntry = { name, variant }`(`referenceDetail.ts:12-15`, 예 `{ name: "Hero", variant: "fullbleed-left" }`) [사실]. `name` → 엔진 `SectionType` 대응(소문자화로 되는지, "CTA Band" 같은 다단어) [미확인] — 구현 E0에서 21개 전수 대응표를 테스트로 고정(RECO-AC-05).
- 엔진 `structureIssues`를 직접 import하지 않는다 — 엔진 레지스트리를 카탈로그 청크로 끌고 온다 [추정]. 추천 모듈은 위 2개 판정과 같은 의미의 **표(목적 → 섹션 타입 집합)** 를 가진다. 엔진과 표가 갈라지는 것을 막는 가드 테스트 1개(RECO-AC-05).

### 2.3 정렬 · 동점 · 결정성

1. 정렬 키: (총점 내림차순, `ref.id` **코드 단위** 오름차순 — `a < b` 비교, `localeCompare` 금지(로캘 의존)). 기존 코드 관례와의 차이 [사실]: 카탈로그 점수순은 tie-break 없이 입력 순서(안정 정렬)에 맡기고(`referenceRepository.ts:45-51`), `internalCompose.ts:306`은 `localeCompare`를 쓴다. id가 ASCII(`ref-*`·`gen-*`)라 현재 데이터에서는 결과가 같지만 추천은 명시 비교로 고정한다.
2. 반환 개수 `RECO_LIMIT` = 5(정본 FR-SEL-03·T-REC-01). 화면 첫 노출은 3장 + 나머지 펼치기 — **RQ-07**.
3. 총점 0인 후보는 반환하지 않는다. 반환 후보가 0이면 "근거 부족"(3.4).
4. 비결정 요소 0: `Date`·`Math.random`·로캘 정렬·`Set` 순회 순서에 기대는 출력 금지. 입력 배열은 1.1 정규화.
5. 결과는 `Object.freeze`된 새 배열(입력 불변).

### 2.4 근거 구조 (T-REC-03)

- 결과마다 근거 = **기여 점수 상위 3항목**. 정렬: (점수 내림차순, 2.1 표의 항목 순서). 0점 항목은 상위 3에 들 수 없다 — 0점만 남으면 근거가 3개 미만일 수 있다(RECO-AC-04에서 명시 허용).
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

적용의 **대상**은 RQ-01. 이 초안의 기본(★A) = **비교 트레이에 담고 `/compare`로 이어 가기**(엔진 계약 변경 0).

| 단계 | 화면 | 바뀌는 것 |
|---|---|---|
| 0 보기 | 카드·근거 | **없음**(T-REC-06) |
| 1 미리보기 | "이 추천 적용" → 확인 대화상자(기존 `dialog` 패턴). 내용: 무엇이 바뀌는지 목록 키 `reco.apply.preview.*` — A: "비교 보드에 {title}을(를) 담습니다 · 지금 {n}/6" | **없음** |
| 2 적용 | 대화상자 "적용" | A: 트레이 `add(id)` 1회. 트레이 6개 꽉 참이면 적용 버튼 비활성 + 이유(기존 `COMPARE_LIMIT_NOTICE` 재사용) |
| 3 되돌리기 | 페이지 status(3.6)로 적용 알림 + 카드 안 "되돌리기" 버튼(이번 세션·이 화면에서만) | A: 트레이 `remove(id)`. 적용 전에 이미 트레이에 있던 id면 적용 버튼 자체가 "이미 담김"(비활성) — 되돌리기가 사용자의 기존 선택을 지우지 않게 |

- 현황 [사실]: 상세의 "템플릿으로 가져오기"는 자리 문구뿐(`components/detail/DetailSidebar.tsx:19,77-78`). 프로필 `selection_mode`는 보드에서 레퍼런스 1개만 고르고 커스텀 스타일이 없으면 `"template"`(`domain/profileDraft.ts:190`, `domain/compareBoard.ts:166`). `ProfileOrigin`에 추천 값 없음(`domain/profile.ts:13`).
- B(레퍼런스 1개를 프로필 초안으로 통째로 — FR-SEL-01 템플릿 선택 경로)를 고르면 1단계 미리보기에 "Hero·카드·Footer·색·글꼴이 {title} 것으로 바뀝니다" + 현재 초안과의 차이 목록, 3단계 되돌리기 = 이전 초안 복원. 이 경로는 보드·프로필 쓰기 계약을 건드려 **엔진/데이터 계약 질의 대상**(4.2).
- E2E-S4 "승인 → 프로필 반영"과 A의 차이: A는 프로필 반영이 `/compare` 확정 단계(기존 3.3 흐름)로 한 번 더 미뤄진다. 6절 대응표에 기록.

### 3.4 상태

| 상태 | 조건 | 표시 (문안 키) | 알림 |
|---|---|---|---|
| 근거 부족 | 업종·목적 둘 다 없음, 또는 반환 0 | `reco.empty.noBrief` + "업종 고르기"(업종 칩으로 포커스) · "목적 고르기"(레일 목적 그룹으로 — <1024면 레일 펼침) | 없음(정적 안내) |
| 결과 적음 | 반환 1~2개 | 있는 만큼 카드 + `reco.few` 한 줄 | 없음 |
| 로딩 | 추천 청크 받는 중 | 결과 영역 `aria-busy="true"` + 카드 자리 스켈레톤 3장(기존 로딩 패턴) | 없음(`LoadingState`의 status를 쓰지 않는다 — 페이지 status 1 유지) |
| 오류 | 청크 로드 실패·계산 예외 | 결과 영역 안 `role=alert` 줄 `reco.error` + "다시 시도" | 그 alert 1개(화면의 유일한 alert) |
| 정상 | 반환 ≥ 3 | 카드 3장 + 더 보기 | 필터 변경으로 재계산될 때만 페이지 status(3.6): `reco.status.updated`({n}개) |
| 적용됨 | 3.3 단계 2 | 카드 "적용됨" + 되돌리기 | 페이지 status `reco.status.applied` |
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
| `PURPOSE_REQUIRED_SECTIONS` | 같은 곳 | 2.2 표 |
| `recommend(brief, refs, details)` | 같은 곳 | 순수 함수 → `readonly RecoResult[]` |
| `parseRecoBrief(filters)` | 같은 곳 | 카탈로그 필터 → `RecoBrief`(정규화) |

### 4.2 엔진·저장 계약 변경 (사용자 질의 대상)

| # | 변경 | 필요 조건 | 영향 | 질문 |
|---|---|---|---|---|
| C1 | 없음 | RQ-01 A(트레이 담기) | 저장 레코드 영향 0 | — |
| C2 | "레퍼런스 1개 → 프로필 초안" 쓰기 경로(보드 picks 일괄 또는 새 진입점) | RQ-01 B | 보드 입력(`boardInput` zod)·프로필 초안 쓰기 — 엔진/데이터 계약 | RQ-01 |
| C3 | 프로필에 추천 출처 기록(`source_reference_ids`·`scoring_version`) | 프로필 버전에서 "추천으로 왔음"을 남기려면 | 프로필 레코드 필드 + 영속 스키마(ADR-007) | RQ-08 |
| C4 | 엔진 R-02/R-12 표를 추천과 공유(엔진에서 export) | 2.2 표 중복을 없애려면 | 엔진 모듈 공개 면 | RQ-06 |

### 4.3 저장 레코드 영향

- ★A 기준: 새 저장 키 0, 스키마 버전 변경 0. 추천 결과는 URL(필터)에서 매번 다시 계산 — 저장하지 않는다.
- 되돌리기 상태(이번에 적용한 id)는 화면 상태(`useState`)만 — 새로고침하면 사라진다(트레이 자체는 기존 규칙대로).

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
| 상세 섹션 재료(큐레이션 상세 + 생성 상세) | rec 청크 | 소스 gzip 기준 2.07 + 3.33 = ≈5.4 상한 [사실(소스 gzip) / 추정(번들 후)] — 섹션만 뽑은 표로 줄일 여지 |
| 적용(A) 트레이 `add`·`remove` | 기존 코드 | 0 |
| 적용(B) 프로필 초안 쓰기 본문 | 조작 뒤 청크("적용" onClick) | 판정 밖 |

- 합: `/catalog?tab=rec` 진입 직후 ≈ 102.39 + 8~10 = **110~113 / 125** [추정] — 개정 불필요.
- `/catalog` 첫 화면: 멈춤선 100.90까지 0.85 → 래퍼 증분 안에 듦 [추정]. **rec 청크를 `tab=all` 기본 진입에서 받으면 안 된다**(가드: 아래 검사기 시나리오).
- `/compare`·`/profile`·`/studio`: ★A면 0. 개정 17·18 몫 사용 0.
- 검사기: `app/scripts/check-bundle-size.mjs` SCENARIOS에 **"/catalog (추천)"** 행 추가(auto = EAGER_DYNAMIC + rec 청크 진입점) — 구현 레인 몫. 기존 "/catalog" 행은 rec 청크를 auto에 넣지 않아 "기본 진입에서 안 받음"을 잰다.
- 상세 픽스처 전체를 rec 청크가 받으면 `/references/:id`와 청크 공유가 생겨 그 라우트 수치가 흔들릴 수 있다 [추정] → 구현 E0에서 실측.

---

## 6. 수용 기준 · 대응표

`[U]` 단위(vitest 순수 함수·컴포넌트) · `[V]` 실화면(브라우저, ego-browser).

| ID | 기준 | 구분 |
|---|---|---|
| RECO-AC-01 | `recommend`는 노출 후보만 대상, 총점 내림차순, 최대 5개 | [U] |
| RECO-AC-02 | 총점 동점 2개 이상이면 `id` 코드 단위 오름차순. 입력 배열 순서를 섞어도 결과 동일(10회 무작위 셔플 → 깊은 동일) | [U] |
| RECO-AC-03 | 같은 입력 2회 호출 → 깊은 동일 · 결과 동결 · 입력 불변 | [U] |
| RECO-AC-04 | 결과마다 근거 ≤ 3개, 기여 점수 내림차순·항목 순, 0점 항목 없음. 펼침 breakdown은 7항목 | [U] |
| RECO-AC-05 | `PURPOSE_REQUIRED_SECTIONS` booking·inquiry 판정이 엔진 `structureIssues`/R-12 판정과 같은 섹션 집합(가드) | [U] |
| RECO-AC-06 | 미측정 레퍼런스: 품질 항목 `unmeasured` 상태, 지어낸 숫자 0 (RQ-02 결정에 따라 점수 0 또는 제외) | [U] |
| RECO-AC-07 | `external_observed` 후보 0 | [U] |
| RECO-AC-08 | 업종·목적 둘 다 없으면 계산 안 함 → "근거 부족" + 업종·목적 고르기 버튼 포커스 이동 | [U]+[V] |
| RECO-AC-09 | 추천 화면 진입·근거 펼치기·필터 변경만으로 트레이·보드·프로필·저장소 쓰기 호출 0 | [U] |
| RECO-AC-10 | "이 추천 적용" → 대화상자(미리보기) → "취소"면 변경 0 · "적용"이면 정확히 1건 변경 · "되돌리기"면 적용 전과 같음 | [U]+[V] |
| RECO-AC-11 | 이미 트레이에 있는 id / 트레이 6개면 적용 비활성 + 이유 (★A) | [U] |
| RECO-AC-12 | live region 새 요소 0, 재계산 결과가 같으면 알림 0, 적용·되돌리기 각 status 1회, 오류 alert 1회 | [U] |
| RECO-AC-13 | 390·1280에서 카드·근거·대화상자 가로 넘침 0, 키보드만으로 적용·되돌리기 완료 | [V] |
| RECO-AC-14 | `/catalog` 기본 진입은 rec 청크를 받지 않음 · `/catalog (추천)` 진입 ≤ 125 · 첫 화면 ≤ 100.90 · 다른 라우트 ±0.03 | [U](검사기) |
| RECO-AC-15 | 근거 문구는 키 표에서만(하드코딩 문장 0) · hex/px 0 | [U] |

| 정본 | 대응 | 차이 |
|---|---|---|
| T-REC-01 (병·의원·학부모·예약 → 5개, 내림차순) | AC-01 · 입력 `{industry: medical, audience: [family], purpose: [booking]}` | "학부모" 값 없음 → `family`로 대응. medical 레퍼런스는 4개(ref-c + gen-medical-1~3) [사실] → 5위는 다른 업종 후보(1.2 "업종 불일치 제외 안 함" 덕분에 5개 충족) |
| T-REC-02 (동점 id 사전순) | AC-02 | 사전순 = 코드 단위(로캘 정렬 아님)로 명확화 |
| T-REC-03 (근거 3개) | AC-04 | 0점 항목은 근거로 안 씀 → 3개 미만 가능(입력이 적을 때) — 정본 문구와 차이 |
| T-REC-04 (LLM OFF 동작·실패 시 규칙 근거) | AC-03(LLM 없음 기본) | LLM 경로 미구현 — ON 케이스는 범위 밖(P2, rs8 C안 "제외") |
| T-REC-05 (external_observed 없음) | AC-07 | — |
| T-REC-06 (조회만으로 프로필 불변) | AC-09 | 프로필뿐 아니라 트레이·보드까지 불변으로 확장 |
| E2E-S4 (5개 → 근거 → 승인 → 프로필 반영, 승인 전 불변) | AC-08~13 [V] | 화면 첫 노출 3개(RQ-07) · ★A면 "프로필 반영"은 `/compare` 확정에서(3.3) |
| FR-SEL-03 "사업 설명·타깃" 입력 | 1.1 | 자유 서술 없음 — RQ-03 |

---

## 7. 설계 질문

| ID | 질문 | 선택지 | ★권장·근거 | 분류 |
|---|---|---|---|---|
| RQ-01 | "이 추천 적용"의 대상 | A 비교 트레이 담기(→ `/compare`에서 기존 확정) · B 레퍼런스 1개를 프로필 초안으로 통째로(템플릿 선택 경로) | ★A — 엔진·저장 계약 변경 0, 승인 전 불변이 구조로 보장. B는 C2 계약 변경 + E2E-S4 문구에 더 가깝지만 FR-SEL-01 경로 구현이 선행 | **엔진 계약** |
| RQ-02 | 미측정 품질 점수 | A 0점(TRD 공식 그대로, 생성 21개가 늘 불리) · B 품질 2항목을 순위 점수에서 빼고(만점 70) 표시만 · C 미측정 = 측정 평균값 대입 | ★B — 지어낸 숫자 0 + 큐레이션 편향 0. A는 "점수 높은 순 = 큐레이션 순"이 됨. C는 측정하지 않은 값을 만드는 것(CURATION 위반 소지) | 점수 규칙(TRD 6.1 개정) |
| RQ-03 | FR-SEL-03 "사업 설명" 자유 입력 | A 이번 범위 제외(필터 4축만) · B 키워드 → 태그 사전 매칭(규칙) | ★A — 새 입력 칸·사전 유지비 0. B는 새 데이터(사전) 큐레이션 필요 | 범위 |
| RQ-04 | 라이선스·레이아웃·모션 필터를 추천에서 | A 라이선스만 후보 제한, 나머지 무시 · B 모든 필터를 후보 제한으로 · C 전부 무시 | ★A — 추천은 "필터 결과 정렬"이 아니라 "브리프 기반 제안". 라이선스는 권리 의사라 존중 | UX |
| RQ-05 | 태그일치 35의 하위 배분 | A 업종 15·목적 10·무드 10 · B 균등 12·12·11 | ★A — 업종이 첫 신호(PRD 시나리오 1) | 점수 규칙 |
| RQ-06 | 판매(sales) 필수 섹션 + 엔진 표 공유 | A 판매는 `sections` 판정에서 제외(2.1 k에서 뺌, 근거 "판정 없음") + 추천 쪽 표 + 가드 테스트 · B 엔진이 목적별 필수 섹션 표를 export(C4) | ★A — 엔진 공개 면 변경 0. B는 엔진 계약 | **엔진 계약** |
| RQ-07 | 반환 5 vs 화면 3 | A 엔진 5 반환 · 화면 3장 + "2개 더 보기" · B 엔진·화면 모두 3(정본 T-REC-01·FR-SEL-03 개정) · C 5장 모두 노출 | ★A — 정본(5)과 BRIEF(카드 3) 둘 다 만족 | 정본 충돌 |
| RQ-08 | 프로필에 추천 출처 기록 | A 기록 안 함 · B `source_reference_ids` + `scoring_version` 저장(C3) | ★A — 저장 스키마 변경 0. 출처 기록이 필요해지면 프로필 v 다음 레인 | **엔진·저장 계약** |
| RQ-09 | 추천 알림을 둘 status | A 카탈로그 기존 트레이 status(`notice`) 공유 · B 추천 영역 전용 sr-only status 추가(트레이 status는 그대로 → 화면 status 2) | ★A — 화면당 status 1 원칙. 트레이 status가 조건부 렌더면 상시 렌더로 옮기는 것까지 A 범위 | UX·접근성 |

- 기존 테스트 영향 [사실]: `pages/CatalogPage.test.tsx:198-215`(V2-AC-21)가 rec 탭 자리 문구를 고정한다 — 구현 레인이 RECO-AC-08 기준으로 바꾼다(명세 범위 안의 의도된 변경).
- 예산 상향 질문: **없음**(5절 추정 범위 안). 구현 E0 실측이 `/catalog` 첫 화면 100.90 또는 다른 라우트 ±0.03을 넘으면 그때 재상신.
- 새 의존성: **없음**.
