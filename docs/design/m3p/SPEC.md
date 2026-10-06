# M3P SPEC — M3′ internal 조합 생성기 + 카탈로그 실렌더 썸네일 (r1)

- 작성: Designer(M3P-0) · 2026-10-06 · base `f21ce19` · 브랜치 `k002bill2/m3p-spec`
- 근거: `docs/04-plan/DEVELOPMENT_PLAN.md` 35행(실행 순서 4) · `docs/04-plan/M2B_PLAN.md` 10·12행(조합 생성기·썸네일 렌더 교체 = M2b 뒤 M3′) · PRD FR-CAT-02·04·06 · TRD 4.1 · ADR-003·004
- 결정 대기 항목은 `docs/design/m3p/MQ.md`(★추천). 본문의 "★MQ-M3P-n A"는 추천안 기준으로 쓴 것이며, 영환님 결정이 다르면 해당 절만 바뀐다.
- 근거 수준: **L1** = 이 worktree에서 grep·빌드로 확인 · **L3** = 추정(실측 전). 추정은 모두 [추정]으로 표시한다.

---

## 0. 코드가 강제하는 전제 (L1)

| # | 사실 | 위치 |
|---|---|---|
| F1 | 카탈로그 레퍼런스 **6개**(ref-a~f, internal 4 · licensed 2). 업종 분포: cafe-fnb 2 · beauty · medical · fitness · professional 각 1. education·retail 0 | `app/src/fixtures/references.ts` |
| F2 | 카드 필드는 FR-CAT-02 목록 기준 **누락 0**(썸네일·이름·업종·태그·대표 색상·레이아웃·모션·반응형·접근성/성능 점수+측정일·저장·비교 추가). 남은 차이 = 썸네일이 **팔레트 3색으로 그린 와이어 플레이스홀더**(`Thumbnail`, `role="img"` "자체 렌더 플레이스홀더") | `components/catalog/ReferenceCard.tsx:17~45` |
| F3 | 진짜 공백은 **FR-CAT-06**(초기 20개 = 베타 5업종 × 4) — 현재 6/20 | PRD 81행 |
| F4 | 레퍼런스 데이터는 3벌: 카드(`references.ts`) · 상세(`referenceDetails.ts` — 섹션·팔레트 5역할·대비·글꼴·간격·모바일 흐름·유사 추천) · 비교(`referenceComparisons.ts` — `sectionPlan`(type·variant)·메뉴·CTA·카드·이미지 비율·모바일·팔레트 메모). ref-b~f 상세·비교 값 상당수는 "임시값" 주석 | 각 파일 머리 주석 |
| F5 | 레퍼런스 픽스처는 **진입 직후 자동 로드**(지연 저장소). gzip: `references` 0.97 · `referenceDetails` 1.41 · `referenceComparisons` 1.01KB(6개 기준) | `data/deferredReferenceRepository.ts` · `scripts/check-bundle-size.mjs:29·31` · 빌드 로그 |
| F6 | 3안 엔진 `composeCandidates`는 **프로필 → 3안**(hero·그리드·제목 비율 축, seed 결정적, 깊은 동결, lint R-01·02·03·04·07·08·12). 레퍼런스 대량 조립용이 아니다 — **재사용 대상은 축 규칙이 아니라 검증 부품**(`lintPlan` · `createDocFromCandidate`의 R-01·R-02 거부 · `validatePageDoc` · 대비 계산 `contrast.ts`) | `domain/composeCandidates.ts:1~10` · `engine/doc/createDocFromCandidate.ts:1~10` |
| F7 | 비교 변형 이름 → 엔진 변형 대응표 `ENGINE_VARIANT_MAP`(about/split → story 등). 엔진 정의 = 30변형, 실렌더 목록 `RENDERED_VARIANTS` = 엔진 정의 전부 | `data/engineVariantMap.ts` · `features/studio/renderedVariants.ts:9` |
| F8 | 렌더 문서 = 별도 엔트리 `render.html` iframe(`sandbox="allow-scripts"`만). 3안 비교(M2B-5)가 같은 렌더 문서를 iframe 최대 3개로 띄운다. M2B-5 SPEC은 **카드 썸네일을 iframe으로 바꾸는 안을 기각**했다(카드 안쪽 ≈247px → 축소율 약 19%, 진입 자동 +18.69 수준 → 125 초과 [L3]) | `docs/design/m2b/SPEC-COMPARE3.md:62·118` |
| F9 | PNG 캡처 `pngCapture.ts` = 숨은 렌더 iframe → serialize → 킷 CSS와 XHTML → **SVG `foreignObject` → data URL Image → canvas → PNG**. 조작 뒤 청크 **+10.05KB**, iframe 상한 8000ms | `features/studio/png/pngCapture.ts:1~25` · 빌드 로그 161행 |
| F10 | 킷 컴포넌트(`src/kit/*.tsx`)와 `render/PageDocument.tsx`에 `useEffect`·`useLayoutEffect`·`window`·`document` 사용 **0**(grep) → 서버 렌더(`react-dom/server`, react-dom 패키지에 이미 포함) 가능성이 높다 [L1 grep · 실제 동작은 L3] | grep 결과 |
| F11 | 킷 사이트 글꼴 woff2 파일 하나가 **350~363KB**(KitSerifKR 400·700) | 빌드 로그 120~121행 |
| F12 | TRD 4.1 `design_reference`에 이미 `source_kind enum[library_composition, licensed_asset]` · `composition`(PageDoc) · `thumbnail_key`("internal은 우리 렌더러가 생성한 이미지")가 있다. TR-POL-01: 스키마에 외부 URL·이미지·HTML 필드 금지 | `docs/03-trd/TRD.md:80~100·299` |
| F13 | 베타 업종 5종 제안(병·의원 / 음식·카페 / 교육·학원 / 제조·B2B / IT·스타트업)은 **코드 `IndustryId`와 다르다**(코드: cafe-fnb·beauty·medical·fitness·professional·education·retail — 제조·IT 없음) | `DEVELOPMENT_PLAN.md:187` · `domain/reference.ts:9` |
| F14 | 점수순 정렬 = `scores.accessibility + scores.performance` 합 | `data/referenceRepository.ts:45~48` |

### 0.1 번들 실측 (이 worktree, `npm run build` exit 0, gzip KB, L1)

| 대상 | 첫 화면 / 예산 | 진입 직후 / 예산 |
|---|---|---|
| `/catalog` | **99.65 / 100** (여유 0.35) | 102.04 / 125 (여유 22.96) |
| `/references/:id` | 97.00 / 100 | 99.38 / 125 |
| `/compare` | 98.83 / 100 | **121.70 / 125** (여유 3.30) |
| `/studio/:projectId` | 91.76 / 100 | 128.62 / 129 (M2c 판정선 128.70) |
| 렌더 문서 | JS **84.19 / 90**(멈춤선 89.70) · CSS 8.85 / 30 | — |

→ `/catalog` 첫 화면은 사실상 증가 불가. 레퍼런스 데이터 증가는 진입 직후(여유 22.96)에 들어가지만, **`/compare` 진입 직후에도 비교 픽스처가 자동 로드**되어 여유 3.30을 함께 소모한다(6절).

---

## 1. 사용자 목표 — 흐름 안에서 조합 생성기가 하는 일

흐름: **벤치마크(카탈로그) → 비교(보드) → 선택(프로필 확정) → 생성(3안 → 편집기)**.

- 지금 카탈로그는 6개뿐이라 "업종별로 여러 안을 훑어보고 고른다"는 벤치마크 단계가 성립하지 않는다(F1·F3). 업종 필터를 하나 고르면 0~2개가 남는다.
- 조합 생성기는 **저장소 안의 추상 데이터(태그·섹션 변형·팔레트 표·프로필 축)만으로 internal 레퍼런스를 결정적으로 조립**해 카탈로그를 FR-CAT-06 수준(20개)까지 채운다. 외부 사이트를 보거나 옮기지 않는다.
- 실렌더 썸네일은 사용자가 카드에서 **실제로 만들어질 페이지의 첫 화면**을 보게 한다. 지금 와이어 플레이스홀더는 6개 모두 같은 3단 모양이라 레이아웃 차이(split·center·grid…)를 카드에서 구분할 수 없다(F2).
- 결과적으로 비교 보드·프로필·3안에 들어가는 입력이 같은 섹션 라이브러리 변형이라, 카드에서 본 모양 = 비교 보드 섹션 계획 = 편집기 실렌더가 일치한다.

비목표: 외부 레퍼런스 수집·관찰 데이터 사용 · LLM 생성 · 관리자 큐레이션 화면(FR-CAT-05) · Lighthouse 실측 자동화 · 새 업종 코드 추가(★MQ-M3P-2 A 기준).

---

## 2. 조합 규칙 (생성기)

### 2.1 입력 축 — 추상 태그만

| 축 | 값 출처 (모두 저장소 안) | 비고 |
|---|---|---|
| 업종 | `IndustryId` 7종 중 대상 5종(★MQ-M3P-2 A: cafe-fnb · medical · education · professional · beauty) | 새 코드 추가 0 |
| 목적 | `PurposeId` booking · inquiry · sales | 업종별 허용 표(2.3) |
| 타깃 | `AudienceId` | 업종별 1~2개 |
| 콘셉트 | `VisualTagId` 12종 중 2개 | 업종별 허용 묶음 |
| 레이아웃(hero) | `LayoutTypeId` 6종 = hero 변형 6종(fullbleed-left·split·center·grid·text·image) | 1:1 대응 |
| 섹션 계획 | 섹션 라이브러리 변형(엔진 30변형, F7) — **목적별 뼈대 템플릿 3종**(예약·문의·판매) + 본문 변형 선택 | R-01(본문 ≤ 9) · R-02(필수 섹션) |
| 팔레트 | **새 internal 팔레트 표**(생성기 전용, 역할 5개 primary·surface·ink·muted·bg). 색 계열(`colorFamily`)·톤 단위로 정의 | 외부 사이트 색 추출 0. 기존 6개 팔레트를 복사하지 않는다 |
| 카드·간격·비율·모션 | `KitCardStyle` 4종 · 간격 comfortable/compact · `mediaRatio` 3종 · `MotionLevel` low/mid(high 0 — R-07 L3 0) | 기존 열거형 |
| 글꼴 | 허용 글꼴 목록(`domain/fonts.ts`) 안에서만 | 새 글꼴 0 |

금지: 레퍼런스 원본 화면·문구·이미지·URL·실존 상호를 입력이나 출력에 넣는 것. 슬롯 문구는 엔진 기본 슬롯(`sections/defaults`), 이미지는 자체 플레이스홀더 패턴만.

### 2.2 출력 (레퍼런스 1개 = 카드 + 상세 + 비교 + 렌더 입력)

| 필드 | 생성 방법 | 계산 가능 |
|---|---|---|
| id · key · slug | `gen-{업종}-{n}` · key = 빈 값 규칙(보드 열 문자는 `nextColumnLabel`이 위치로 붙임 — `reference.key` 화면 사용처는 S0에서 grep 재확인) · slug = 영문 태그 조합 | ○ |
| title | 태그 조합 문장 — "{업종 라벨} · {콘셉트 라벨} {레이아웃 라벨}형"(예: "교육 · 신뢰 센터형"). 같은 제목이면 " 2"를 붙인다. 실존 상호·지명 0 | ○ |
| licenseStatus · sourceKind | `internal` · `library_composition`(TRD 4.1 F12, ★MQ-M3P-3 A) | ○ |
| industry·audience·purpose·visualTags·layoutType·motionLevel·devices·responsive | 축 값 그대로 · responsive = true · devices = 3종 | ○ |
| colorPalette(3색) | 팔레트 표의 primary·surface·ink | ○ |
| scores | **측정값 없음** — 지어내지 않는다(★MQ-M3P-4 A: "미측정" 표기) | ✕ |
| createdAt | 생성기 버전 날짜(고정 상수) — 실행 시각 사용 0 | ○ |
| 상세 sections · palette(5역할) · typography · spacing · motionNote | 섹션 계획 · 팔레트 표 · 글꼴 축 · 간격 축 · 모션 축에서 | ○ |
| 상세 bodyContrast | `contrast.ts`로 ink/bg 계산 | ○ |
| 상세 mobileFlow | 변형별 모바일 구조 문구 표(header 햄버거·hero 비율·카드 스택·CTA 위치)에서 조립 | ○(표 필요) |
| 상세 similar(업종·콘셉트·레이아웃) | 같은 업종 / 콘셉트 교집합 / 같은 hero 변형 — 정렬 규칙 고정, 그룹당 ≤ 6(FR-CAT-03) | ○ |
| 상세 measuredWith · audienceNote · buildNote | "미측정" · 타깃 라벨 · "internal 조합 생성기 {버전}으로 조립" | ○ |
| 비교 sectionPlan · menuLabel · cta · card · imageRatio · mobile · paletteNote | 섹션 계획 · header 변형별 문구 · hero/header 변형별 CTA 위치 · 카드 축 · 비율 축 · 모바일 표 · 색 계열 라벨 | ○ |

### 2.3 조합 수 상한 · 배분

- **생성 15 · 총 21**(★MQ-M3P-2 A). 대상 5업종 각 4개를 맞춘다: cafe-fnb 2(+2) · beauty 1(+3) · medical 1(+3) · professional 1(+3) · education 0(+4) = 생성 15. 기존 fitness 1개는 대상 밖이지만 빼지 않는다(기존 데이터 수정 0) → 총 21 = FR-CAT-06 "20개(5업종 × 4)" 충족 + 1.
- 상한: 생성기 한 번 실행 출력 ≤ **24개**(번들 6절 예산 기준). 상한을 넘기려면 MQ.
- 업종 안 4개는 **hero 변형이 서로 달라야** 하고(레이아웃 다양성), 목적은 업종 허용 표 안에서 돌린다.

### 2.4 결정성

- 순수 함수 `composeInternalReferences(spec, GENERATOR_VERSION)` — 시각·`Math.random`·객체 키 순서 의존 0(키 정렬, `composeCandidates`와 같은 원칙). 출력 깊게 동결.
- seed = `hash(업종|순번|생성기 버전)`(`domain/hash.ts`). 같은 입력 → 같은 출력(바이트 동일 JSON 직렬화).
- **생성은 빌드 전에 1회, 결과를 텍스트 픽스처로 커밋**(`fixtures/generatedReferences.ts` 가칭). 앱 번들에는 생성기 코드가 들어가지 않고 데이터만 들어간다(6절). 가드 테스트가 생성기를 다시 돌려 커밋된 픽스처와 **완전 일치**를 확인한다(손으로 고친 픽스처·생성기 변경 누락 차단).

### 2.5 중복 제거

- 정규 키 = (업종, hero 변형, 본문 변형 목록 정렬, 팔레트 id, 카드 축). 정규 키가 같으면 버리고 다음 seed 후보로.
- 기존 6개와의 근접 중복: 섹션 계획(type/variant 순서열) + 팔레트 id가 모두 같으면 버린다.
- 업종 안 hero 변형 중복 0(2.3).
- 후보 소진(최대 시도 상한 = 업종당 32회)이면 그 업종은 모자란 채로 두고 생성 리포트에 남긴다(조용히 채우지 않음).

### 2.6 게이트 통과 조건 (하나라도 실패하면 그 후보를 버린다)

1. 섹션 계획을 `ENGINE_VARIANT_MAP`으로 옮긴 뒤 `createDocFromCandidate` 성공(UNKNOWN_VARIANT · R-01 · R-02 거부 0) → `validatePageDoc` 통과.
2. `lintPlan` 오류 0(R-01·02·03·04·07·08·12).
3. **대비 AA**: 팔레트 ink/bg · ink/surface · primary 위 surface 글자 ≥ 4.5:1(`contrast.ts`). 실패 팔레트는 **보정하지 않고 표에서 제외**(팔레트 표 자체에 단위 테스트 — 메모리 "시드 문서는 대비 AA 차단" 이력 반영).
4. 모든 변형이 `RENDERED_VARIANTS` 안(폴백 섹션 0 — 썸네일이 실렌더여야 하므로).
5. 정적 검사: 출력 문자열 어디에도 `http:`/`https:`/`//`·`<`·`data:` 0(TR-POL-01, 자체 플레이스홀더만).

---

## 3. 썸네일 생성 방식 — 후보 트레이드오프 (결정 ★MQ-M3P-1)

공통 렌더 입력: 레퍼런스 → (비교 `sectionPlan` → 엔진 변형) → `createDocFromCandidate` → PageDoc(기본 슬롯·플레이스홀더 이미지) + KitTokenInput(팔레트 5역할·카드·글꼴·간격·비율). 기존 6개도 같은 경로로 썸네일을 만든다. 크기: 1280 폭 렌더의 첫 화면 1280×960(4:3) 영역.

| | A ★ 빌드 시 정적 SVG(foreignObject) 실렌더 | B 빌드 전 PNG 사전 생성(수동 캡처 커밋) | C 런타임 실렌더 캡처 | D 경량 SVG 와이어 |
|---|---|---|---|---|
| 방법 | 빌드 단계에서 Node가 킷을 `react-dom/server`로 정적 마크업 → 킷 CSS와 함께 XHTML → `<svg><foreignObject>` 파일(`dist/thumbs/{id}.svg`). 카드는 `<img loading="lazy">` | preview 서버에서 Ego Lite로 `pngCapture` 경로를 돌려 PNG를 만들고 저장소에 커밋 | 카드가 보이면 숨은 렌더 iframe → serialize → canvas(F9 경로)를 카드마다 순차 실행, object URL 캐시 | 섹션 계획으로 섹션 블록 SVG를 그림(지금 플레이스홀더의 정교판) |
| 실렌더인가 | **예** — 같은 킷 컴포넌트·CSS. 단 글꼴은 시스템 대체 글꼴(F11: 글꼴 내장 시 파일당 +350KB) | 예(사이트 글꼴 포함) | 예(사이트 글꼴 포함) | **아니오** — M3′ 정의 미달(범위 축소 MQ 필요) |
| 앱 JS | 첫 화면 ≈ +0.02~0.08 [추정](img 태그·경로 계산) · 데이터 맵은 지연 청크 | 같음 | 진입 직후 **+10.05 이상**(pngCapture) + 렌더 문서 84.19KB를 카탈로그 진입마다 받음(앱 판정 밖이지만 ADR-004 개정 2 "우회 금지" 취지 충돌) | 첫 화면 +1~2 [추정] → **첫 화면 100 초과 위험**, 지연 청크로 빼면 첫 그림에 와이어 깜빡임 |
| 런타임 성능 | 이미지 디코드만. 화면 밖은 lazy | 같음 | 카드당 수백 ms~수 초 [추정] × 20 순차, 새로고침마다 다시(메모리 저장소) | 즉시 |
| 저장소 용량 | **바이너리 커밋 0**(빌드 산출물) | PNG 20~21장 × 1~2 해상도 ≈ **0.6~1.5MB** [추정, 247px 카드 × dpr2 기준 장당 30~70KB] — 생성기·킷 바뀔 때마다 재커밋 | 0 | 0 |
| 전송량 | SVG 장당 원본 50~80KB · gzip 12~18KB [추정 — 렌더 CSS 원본 43.70KB(빌드 로그) 포함] × 화면에 보이는 카드 수 | PNG 장당 30~70KB | 렌더 JS 85 + 캡처 청크 | 0 |
| 결정성 | **파일 바이트 결정적**(문자열 출력, 해시 테스트 가능). 화면 픽셀은 OS 글꼴에 따라 다름 | 캡처 환경(OS·글꼴·브라우저)에 따라 바이트 비결정 | 비결정(브라우저별) | 결정적 |
| 새 의존성·파이프라인 | 의존성 0(react-dom/server·vite 기존). **빌드 스크립트 변경**(package.json `build`에 단계 1개 + vite SSR 모드) | 0(수동 절차) | 0 | 0 |
| 위험 | 킷 정적 렌더가 브라우저 렌더와 다를 수 있음(F10 grep으로는 낮음) · `<img>` 안 foreignObject는 Safari에서 일부 CSS 차이 [L3] — pngCapture가 같은 경로로 3브라우저 통과(M2A-3c) | 갱신 누락(킷 바뀌어도 썸네일 옛것) · 사람 작업 | 예산·성능·배터리 | 목표 미달 |

**추천 ★A.** 실렌더 목표를 지키면서 첫 화면 증가를 거의 0으로 묶고, 바이너리 커밋·새 의존성이 없으며, 결정성 테스트가 가능한 유일한 안. 대가는 빌드 파이프라인 변경(MQ-M3P-1에 포함)과 썸네일 글꼴이 사이트 글꼴이 아니라는 점(카드 크기 축소율 ≈19%에서 글꼴 차이는 판독에 영향이 작다 [추정] — QB-03에서 확인).

- A의 개발 서버: `npm run dev`에는 `dist/thumbs`가 없다 → img `onError` = 기존 와이어 플레이스홀더 유지(4.3 실패 상태). 테스트(jsdom)도 같은 경로.
- A의 산출 경로·파일 이름: `thumbs/{id}.{콘텐츠 해시 8자}.svg` — 해시는 지연 청크의 `THUMBNAIL_KEYS` 맵(id → 키)에만. DesignReference에 URL 필드를 넣지 않는다(TR-POL-01, F12의 `thumbnail_key` 뜻 = 키).
- A의 보안: SVG를 `<img>`로만 쓴다(스크립트 실행 0, 외부 요청 0). 생성 SVG에 `<script`·`on*=`·`http`·`href=` 외부 값 0을 빌드 가드가 검사.

---

## 4. 카탈로그 UI 변화

### 4.1 카드 (`ReferenceCard`)
- 썸네일 영역 = 지금 크기·비율 유지(`aspect-video` → `sm:aspect-[4/3]`). 안에 `<img>`를 `object-cover object-top`으로. 와이어 플레이스홀더는 **이미지 뒤 배경으로 남겨** 로딩·실패 때 그대로 보인다(레이아웃 이동 0).
- 라이선스 Tag(우상단) 유지. 생성 레퍼런스는 그 옆(또는 아래)에 **"생성 조합"** Tag(`tone` = 중립, 기존 Tag 컴포넌트) — 색만으로 구분하지 않고 글자로.
- 점수 줄: 생성 레퍼런스는 "접근성·성능 **미측정**"(★MQ-M3P-4 A). 측정일 `<time>` 없음.
- 목업과 다른 점(ADR-003 기록용): 목업 카드에는 "생성 조합" 표식·미측정 문구가 없다 — 사유: 측정하지 않은 점수를 보이지 않기 위해(정직성).

### 4.2 필터 · 정렬
- **새 필터 추가 0**(★MQ-M3P-5 A): "출처(큐레이션/생성 조합)" 필터는 `FilterRail`(첫 화면 청크)에 넣으면 첫 화면 여유 0.35를 넘을 위험. 대신 결과 머리 개수 문구에 "생성 조합 n개 포함"을 덧붙이지 않고 **카드 표식만** 둔다.
- 점수순: 미측정은 **맨 뒤**, 그 안에서는 `createdAt` 내림차순 → id 오름차순(결정적).
- 최신순: 그대로(`createdAt`).
- 업종·콘셉트 등 기존 필터의 facet 개수는 20개 기준으로 자연히 바뀐다.

### 4.3 상세 (`/references/:id`)
- ★MQ-M3P-6 A: **이번 범위는 카드만.** 상세 미리보기(`ReferencePreview`, 폭 3종 와이어)는 유지. 상세의 "생성 조합" 표식·미측정·buildNote는 데이터로 자연 반영.

---

## 5. 상태 설계

| 상태 | 조건 | 보이는 것 | 접근성 |
|---|---|---|---|
| 로딩 | img 디코드 전 | 와이어 플레이스홀더(지금과 같음). 스피너 0 | img `alt`는 처음부터 있음 |
| 성공 | img `load` | 실렌더 썸네일. 페이드 인은 `motion-safe`에서만(토큰 duration), reduced-motion = 즉시 | — |
| 실패 | img `error`(파일 없음·dev 서버·디코드 실패) | img를 숨기고 와이어 유지. **오류 문구 0**(카드 기능은 그대로) — 콘솔 로그 0 | alt가 와이어 설명으로 바뀌지 않게 와이어 `role="img"` 라벨 유지 |
| 썸네일 키 없음 | `THUMBNAIL_KEYS`에 id 없음 | img 렌더 0, 와이어 | — |
| 빈 상태 | 필터 결과 0 | 기존 빈 상태 그대로 | — |
| 생성 0개 | 생성 픽스처 비어 있음 | 기존 6개만 — 화면 변화 없음 | — |

---

## 6. 예산 배치 (상향 없음 — 넘으면 멈춰 보고)

| 대상 | 지금(L1) | 증가 [추정] | 예상 | 레인 멈춤선 |
|---|---|---|---|---|
| `/catalog` 첫 화면 | 99.65 | img·키 조회·Tag·미측정 분기 +0.02~0.10 | 99.67~99.75 | **99.90** (넘으면 구현 전 멈춤 → 상쇄안 보고) |
| `/catalog` 진입 직후 | 102.04 | 픽스처 15개분: 카드 +2.3 · 상세 +3.4 · 썸네일 키 맵 +0.3 (6개 기준 선형, gzip 반복으로 실제는 더 작을 것) | ≈108 | 124.70 |
| `/references/:id` 진입 | 99.38 | 같은 픽스처 | ≈105 | 124.70 |
| `/compare` 진입 직후 | **121.70** | 비교 픽스처 +2.4(1.01 × 15/6) | **≈124.1** — 여유 0.6 | **124.70**. 넘으면 ★MQ-M3P-7 A(생성 레퍼런스 비교 속성을 보드에 생성 레퍼런스가 있을 때만 받는 별도 청크) |
| `/studio` · `/profile` | 128.62 · 121.54 | 0(픽스처 미사용 확인 S0) | 그대로 | M2c 판정선 128.70 |
| 렌더 문서 | 84.19 | 0(썸네일은 iframe을 쓰지 않음) | 84.19 | 89.70 |
| 썸네일 SSR 번들 | — | 배포 산출물 아님(빌드 도구) | — | 판정 밖, 크기만 출력 |

- 생성기 코드는 `scripts/` 쪽(또는 테스트에서만 import하는 `domain/`)에 두어 **앱 청크에 들어가지 않게** 한다. 가드: 앱 manifest에 생성기 모듈 0.
- 각 Developer 레인은 시작 때 1개분 시제품으로 증가량을 실측하고 표를 갱신한다.

---

## 7. 접근성

- 썸네일 `<img alt>` = "{title} 첫 화면 실제 렌더 미리보기". 와이어 배경은 `aria-hidden`으로 바꾸고 img가 이름을 가진다 — **이름 있는 그림 1개**만(중복 낭독 0). 실패 상태에서는 와이어가 `role="img"` 이름을 다시 가진다(구현: img 실패 시 img 제거 + 와이어 라벨 복귀).
- 카드 Tab 순서·버튼(저장·비교) 변화 0. 썸네일은 포커스 대상 아님.
- "생성 조합" 표식은 글자(Tag)로, 스크린 리더에서 제목 뒤가 아니라 시각 순서대로 읽힘(DOM = 시각 순서).
- "미측정"은 숫자 자리에 글자로. 점수 비교를 기대하는 사용자에게 0점처럼 보이지 않게 "0"·"—" 금지.
- 대비: 썸네일 안(사용자 사이트 색)은 2.6-3 AA 게이트로 보장, 카드 UI는 v2 토큰만.
- reduced-motion: 페이드 0.

---

## 8. 수용 기준 · QB · 깨질 테스트

### 8.1 M3P-AC — [U] 단위·컴포넌트(Vitest) · [G] 가드(정적 검사) · [B] 실제 브라우저(Ego Lite, build+preview 4337, 1280·768·390)

| ID | 기준 |
|---|---|
| M3P-AC-U1 | 생성기 같은 입력 2회 → 깊은 동등 + 직렬화 바이트 동일. 입력 객체 변경 0 |
| M3P-AC-U2 | 생성 결과 수 = MQ-M3P-2 결정 수, 대상 업종마다 총 4개 이상, 업종 안 hero 변형 중복 0 |
| M3P-AC-U3 | 모든 생성 레퍼런스가 2.6 게이트 1~4 통과(createDocFromCandidate 성공·lint 0·AA·폴백 0) |
| M3P-AC-U4 | 정규 키 중복 0 · 기존 6개와 근접 중복 0 |
| M3P-AC-U5 | 카드: 생성 레퍼런스에 "생성 조합" 글자·"미측정" 글자, `<time>` 0 · 큐레이션 카드는 지금과 같음 |
| M3P-AC-U6 | 썸네일 img 실패 이벤트 → img 제거, 와이어 `role="img"` 이름 복귀, 알림·콘솔 0 |
| M3P-AC-U7 | 점수순: 미측정 맨 뒤, 같은 그룹 정렬 결정적 |
| M3P-AC-U8 | 썸네일 SVG 생성 함수: 같은 레퍼런스 → 같은 문자열(해시 고정), 폭 1280·높이 960 viewBox |
| M3P-AC-G1 | 커밋된 생성 픽스처 = 생성기 재실행 결과(완전 일치) |
| M3P-AC-G2 | 생성 픽스처·SVG에 `http`·`https`·`//`(xmlns 제외)·`<script`·`on[a-z]+=`·외부 `href` 0 · `apfs`·APFS 0 |
| M3P-AC-G3 | 앱 manifest 청크에 생성기·SSR 모듈 0 |
| M3P-AC-G4 | 번들: 6절 멈춤선 준수(`check-bundle-size.mjs` 출력 기록) · 렌더 문서 변화 0 |
| M3P-AC-G5 | 기존 6개 픽스처 바이트 변경 0(카드·상세·비교) — 생성 데이터는 별도 파일 |
| M3P-AC-B1 | `/catalog` 1280: 첫 줄 카드에 실렌더 썸네일이 보이고 카드 높이가 로드 전후 같음(레이아웃 이동 0) |
| M3P-AC-B2 | 768·390: 썸네일 잘림 = 위쪽 기준(header·hero 보임) |
| M3P-AC-B3 | 업종 필터 5종 각각 결과 ≥ 4 |
| M3P-AC-B4 | 생성 카드 → 상세 → 비교 추가 → 보드 열 표시 → 프로필 확정까지 흐름 끊김 0 |
| M3P-AC-B5 | 네트워크 요청: 같은 출처 `thumbs/*.svg`만, 외부 요청 0 |

### 8.2 QB (QA 시각·수동 검수)

| ID | 항목 | 폭 |
|---|---|---|
| QB-M3P-01 | 21장 썸네일이 서로 구분되는가(같은 업종 안 hero 모양 차이가 카드 크기에서 보이는가) | 1280 |
| QB-M3P-02 | 썸네일과 상세 와이어·비교 보드 섹션 계획이 모순되지 않는가 | 1280 |
| QB-M3P-03 | 시스템 대체 글꼴 썸네일이 판독·인상에서 어색하지 않은가(사이트 글꼴 실렌더와 나란히 1장) | 1280 |
| QB-M3P-04 | 생성 제목이 실존 상호·사이트를 연상시키지 않는가 · 문장이 자연스러운가 | — |
| QB-M3P-05 | "생성 조합"·"미측정" 표식이 카드 위계를 해치지 않는가 | 1280·390 |
| QB-M3P-06 | 생성 레퍼런스 1개로 3안 생성 → 편집기 실렌더가 썸네일과 같은 계열로 보이는가 | 1280 |

### 8.3 깨질 기존 테스트 (예상, L1 grep 기준)

생성 데이터를 **별도 파일로 붙이고 기존 6개를 바꾸지 않으면**, 깨지는 것은 "전체 개수·목록"을 단언하는 테스트로 한정된다:
- `data/referenceRepository.test.ts:22` "필터 없이 목업 레퍼런스 6개" · 109행 유사 그룹(그룹 ≤ 6은 유지되나 구성 바뀜)
- `pages/CatalogPage.test.tsx:18` "노출 가능한 레퍼런스 6개" · 170행 "internal · licensed 레퍼런스 6개" · 155행 트레이 6개 채우기(카드 순서 의존 시)
- `features/catalog/facetCounts.test.ts:46` "전체 6개"
- `pages/keyboardA11y.test.tsx` · `app/routeScroll.test.tsx`(카드 수·순서 의존 여부 S0 확인)
- `components/catalog/ReferenceCard.test.tsx`(썸네일 `role="img"` "자체 렌더 플레이스홀더" 이름 단언 시)
- 영향 없음 예상: 비교 보드·프로필·편집기 테스트(ref-a~f id로 고정 — grep 결과 다수지만 id·값 불변)

해결 원칙: 테스트가 **픽스처 길이·큐레이션 id**를 상수로 읽도록 고치거나 큐레이션 6개만 주입하는 테스트 저장소를 쓴다. 단언 약화(개수 검사 삭제) 금지.

---

## 9. 위험

1. **킷 정적 렌더 불일치** — SSR 마크업이 브라우저 렌더와 다르면 썸네일이 실제와 다르다. 완화: S0 스파이크에서 3변형(header·hero·footer) 정적 마크업 vs 렌더 문서 serialize 결과를 비교(구조 diff 0 목표). 다르면 MQ-M3P-1 B로 전환 보고.
2. **`/compare` 진입 여유 0.6 [추정]** — 6절 멈춤선·MQ-M3P-7.
3. **SVG 크기** — 킷 CSS 전체를 매 파일에 넣으면 장당 gzip 12~18KB [추정]. 완화: 문서에 쓰인 변형의 CSS만 남기는 정리(후속), 첫 줄 외 lazy.
4. **베타 업종 정의 불일치(F13)** — MQ-M3P-2.
5. **생성 데이터 품질** — 같은 뼈대 템플릿 반복으로 단조로울 수 있음. QB-01·04로 확인, 부족하면 템플릿 추가는 다음 레인.

## 10. 기록
- r1 2026-10-06 Designer(M3P-0) 작성.
