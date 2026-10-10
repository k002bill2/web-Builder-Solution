# GEN-MARK SPEC — 상세 "생성 조합" 표식 · 카드 썸네일 Tag 겹침 해소 (B-M3P-03) (r1)

- 작성: Designer(GEN-MARK-SPEC) · 2026-10-10 · base main `18e5e12` · 브랜치 `k002bill2/gen-mark-spec`
- 근거: `docs/06-handoff/BACKLOG.md:46`(B-M3P-03) · `docs/qa/m3p/REPORT.md:61·77`(QB-05 관찰) · `docs/design/m3p/SPEC.md:151·162·204·221·245` · PRD 원칙 4(권리 경계)·FR-CAT-04 · ADR-002·003·004
- 결정 대기 항목은 `docs/design/gen-mark/MQ.md`(★추천). 본문 "★MQ-GM-n A"는 추천안 기준이며, 결정이 다르면 해당 절만 바뀐다.
- 근거 수준: **L1** = 이 worktree에서 grep·빌드·실화면으로 확인 · **L3** = 추정(실측 전, [추정] 표시).
- 코드 0 — 구현은 이 SPEC 확정 뒤 별도 Developer 레인.

---

## 0. 코드가 강제하는 전제 (L1)

| # | 사실 | 위치 |
|---|---|---|
| F1 | 생성 레퍼런스는 `licenseStatus: "internal"` + `sourceKind: "library_composition"`. 큐레이션 internal(ref-a 등)과 **라이선스 값이 같다** — 라이선스 Tag만으로는 둘을 구분할 수 없다 | `app/src/domain/internalCompose.ts:173-174` · `domain/reference.ts:5·7·65` |
| F2 | 상세 머리 = `h1` + 라이선스 Tag 1개. 출처 구분은 메타 줄 끝 `buildNote` 문장("internal 조합 생성기 internal-compose-1으로 조립")뿐 — 표식 없음 | `pages/ReferenceDetailPage.tsx:42-55` · `domain/internalCompose.ts:189` · 실화면 `shots/03-detail-gen-1280.png` |
| F3 | 카드: 라이선스 Tag = 썸네일 **안** `absolute top-2.5 right-2.5`, `aria-hidden`(스크린리더에 안 읽힘). "생성 조합" Tag = 카드(article) 기준 `absolute top-9 right-2.5` + 불투명 `bg-surface-elevated` 받침, 읽힘 | `components/catalog/ReferenceCard.tsx:53-57·118-123` |
| F4 | 썸네일 `<img>`는 `object-cover object-top` — 렌더 첫 화면의 **header(로고·내비·우측 CTA 버튼)가 썸네일 맨 위 우측**에 온다. 두 Tag가 그 자리를 정확히 덮는다(390·1280 실화면, QA 390·768·1280 공통) | `ReferenceCard.tsx:44-51` · `shots/01-catalog-1280.png`·`02-catalog-390.png` · `docs/qa/m3p/REPORT.md:61` |
| F5 | 상세 미리보기(`ReferencePreview`)는 자체 와이어라 Tag 겹침이 없다. 겹침 문제는 **카드에만** 있다 | `ReferenceDetailPage.tsx:135` · m3p SPEC 4.3 |
| F6 | 카드 폭(실측): 1280 = 305.7px(3열) · 1024 = 338.5px(필터 레일 + 2열) · 390 = 343px(1열). 640(sm 2열 시작) ≈ 296px [추정, 계산] | 실화면 측정 · `pages/CatalogPage.tsx:86·123` |
| F7 | `referenceDisplay.ts`(LICENSE_TONE)는 `/profile` 첫 화면 쪽 `ProfileValues.tsx`도 import한다 → 여기에 새 값을 넣으면 `/profile` 99.87/100에 닿는다 | grep `referenceDisplay` 6곳 |
| F8 | 다른 출처 표시 지점: 상세 "유사 레퍼런스" 타일(색 블록 + 제목만, Tag 0) · 비교 보드 `ColumnHeader` 라이선스 Tag(생성 조합 0) | `components/detail/DetailSidebar.tsx:125-147` · `components/compare/ColumnHeader.tsx:63-66` |
| F9 | 기존 테스트 단언: 카드 "생성 조합"은 `aria-hidden`/`role="img"` 밖(읽힘) · 카드 라이선스 Tag는 `aria-hidden` 안 | `components/catalog/ReferenceCard.test.tsx:146-147·181·208-221` |
| F10 | `Tag`는 비대화형 `<span>`(tint 기본, neutral = `bg-fill-strong`). 중립 tint는 반투명이라 썸네일 색 위에서 안 읽혀 받침을 둔 것(주석) | `components/ds/Tag.tsx:17-24·46` · `ReferenceCard.tsx:119` |

### 0.1 번들 실측 (이 worktree, `npm run build` exit 0, gzip KB, L1)

| 라우트 | 첫 화면 / 예산 | 진입 직후 / 예산 |
|---|---|---|
| `/catalog` | **100.07 / 101 · 멈춤선 100.90** (여유 0.83, ADR-004 개정 7 `ADR-004-performance-budgets.md:135`) | 102.41 / 125 |
| `/references/:id` | 97.32 / 100 (여유 2.68) | 99.66 / 125 |
| `/profile` | 99.87 / 100 | 119.98 / 125 |
| `/studio/:projectId` | 91.84 / 100 | **129.28 / 130** (M2c 기준선 129.62 + 0.03, 멈춤 > 129.65) |

- `ReferenceCard`는 `CatalogPage` 청크(gzip 7.07), 상세는 `ReferenceDetailPage` 청크(gzip 4.71) — 둘 다 `routes.tsx:6-9` lazy 라우트. `/studio` 진입 closure에 둘 다 없다(grep: `ReferenceCard` import = CatalogPage뿐).

---

## 1. 목적 · 범위 / 제외

**목적**
1. 상세 화면에서도 카드와 같은 말("생성 조합")로 출처를 구분한다 — 같은 `internal`이어도 사람이 고른 큐레이션과 규칙으로 자동 생성한 것을 사용자가 헷갈리지 않게(PRD 원칙 4·정직성, m3p SPEC 4.1 "목업과 다른 점").
2. 카드 썸네일 위 Tag가 실렌더 header(내비·CTA)를 덮지 않게 한다 — 썸네일은 "이 레퍼런스의 첫 화면이 어떻게 생겼나"를 보여주는 자리이고, CTA 위치는 비교 축(`cta`)이기도 하다.
3. 스크린리더 사용자도 라이선스·출처를 같은 순서로 듣는다.

**범위**: 카드(`ReferenceCard`) 출처 표식 위치·크기 · 상세(`ReferenceDetailPage` 머리) 출처 표식·설명 한 줄 · 두 화면 공통 문구·낭독 · 390·1024·1280.

**제외 (사유)**
- 비교 보드 `ColumnHeader`의 "생성 조합" 표식 — `/compare` 진입 여유 2.30(122.70/125)·다른 화면 위계 검토 필요. BACKLOG 후보로 REPORT에 기록(MQ-GM-4 참고).
- 상세 "유사 레퍼런스" 타일 — 타일 폭이 좁아(3열 × `grid-cols-3`) Tag가 제목을 밀어낸다. 상세 진입 뒤 해당 상세에서 표식이 보이므로 제외.
- `buildNote` 문구("internal 조합 생성기 internal-compose-1으로 조립") 자체 수정 — 생성기 데이터(`internalCompose.ts:189`)·G5 해시에 닿는 데이터 변경이라 범위 밖. 설명 한 줄(4.2)이 사람 말 역할을 맡는다.
- 카탈로그 "출처" 필터 — m3p ★MQ-M3P-5 A 그대로(필터 추가 0).
- `sourceKind: "licensed_asset"` 표식 — 타입만 있고 데이터 0. 표식은 `library_composition`일 때만.

---

## 2. 사용자 흐름 · 상태

| 상태 | 조건 | 카드 | 상세 |
|---|---|---|---|
| 정상 · 큐레이션 | `sourceKind` 없음 | 출처 줄 = 라이선스 Tag 1개 | 머리 = 제목 + 라이선스 Tag. 설명 줄 0 (지금과 같음) |
| 정상 · 생성 조합 | `sourceKind === "library_composition"` | 출처 줄 = 라이선스 Tag + "생성 조합" Tag | 머리 = 제목 + 라이선스 Tag + "생성 조합" Tag, 메타 줄 아래 설명 한 줄(★MQ-GM-2 A) |
| 썸네일 로딩·실패 | img 디코드 전 / `onError` | 출처 줄은 썸네일 **밖**이라 영향 0. 와이어 플레이스홀더 위에도 Tag 0 | 해당 없음 |
| 빈 | 필터 결과 0 | 기존 빈 상태 그대로 | 해당 없음 |
| 오류 | 상세 not-found | 해당 없음 | 기존 `NotFound` 그대로(표식 0) |
| 진행 중 | 상세 로딩 | 해당 없음 | 기존 `LoadingState` 그대로 — 표식은 데이터 준비 뒤에만 |
| 경고 | — | 새 경고 0. "미측정"은 기존 점수 자리 글자(m3p ★MQ-M3P-4 A) 그대로 | 같음 |

흐름: 카탈로그에서 "생성 조합" 카드를 본다 → 제목 클릭 → 상세 머리에서 같은 "생성 조합" Tag와 설명 한 줄로 같은 사실을 다시 확인한다. 큐레이션 카드 → 상세는 지금과 같다.

---

## 3. 화면 구조 · 정보 위계

### 3.1 카드 (★MQ-GM-1 A — 출처 줄을 썸네일 밖, 제목 위로)

```
┌ article ───────────────────────────────┐
│ [썸네일 — 덮는 것 0, img 전체가 보임]   │
│ [internal] [생성 조합]   ← 출처 줄      │
│ 제목 (h3 · line-clamp-2)                │
│ 업종 · 레이아웃 · 모션                   │
│ 태그 · 반응형                            │
│ 접근성·성능 미측정 / 점수 · 측정일        │
│ ●●●                         [저장][비교] │
└────────────────────────────────────────┘
```

- 썸네일 안 `absolute` 라이선스 Tag와 article 기준 `absolute` "생성 조합" 받침을 **둘 다 없앤다** → 썸네일 위 겹침 0(F4 해소).
- 출처 줄: 썸네일 바로 아래, 제목 위. 가로 나열, 줄바꿈 허용(flex-wrap), Tag 사이 간격 = 기존 DetailTags와 같은 토큰 간격. 크기 = `Tag size="sm"`(지금과 같음).
- 라이선스 Tag 먼저, "생성 조합" Tag 다음 — 지금 시각 순서(위 → 아래)를 왼쪽 → 오른쪽으로 옮긴 것. 색: 라이선스 = `LICENSE_TONE`(지금과 같음), 생성 조합 = neutral tint. 카드 배경 위라 반투명 받침이 필요 없다(F10 사유 소멸).
- 모든 카드가 라이선스 Tag를 가지므로 출처 줄은 **모든 카드에 1줄** 생긴다 → 카드 높이가 그리드 전체에서 같게 늘어난다(행 정렬 깨짐 0). 증가량 ≈ Tag 높이 + 간격 1단(약 28px [추정]).
- 폭 검산: Tag 2개 ≈ 110~120px [추정] < 최소 카드 폭 296px(F6) — 1줄에 들어간다.
- 목업과 다른 점(ADR-003 기록용): 목업은 라이선스 Tag를 썸네일 우상단에 얹는다 — 사유: 실렌더 썸네일(M3P)로 바뀐 뒤 그 자리가 렌더 header CTA라 정보(CTA 위치)를 가린다. 기능·사용성 > 목업.

### 3.2 상세 머리 (`DetailHeader`)

```
1280 · 1024 (lg 2단 — 오른쪽 정보 열, 폭 95 토큰)
┌ section "레퍼런스 정보" ─────────────────┐
│ 뷰티 · 세련된 센터형  [internal] [생성 조합] │ ← h1 + 출처 Tag (flex-wrap, 지금 구조)
│ 뷰티 · 센터 히어로 · 20~30대 타깃 · internal 조합 생성기 … 조립 │ ← 메타 줄(지금과 같음)
│ 섹션 라이브러리를 조합 규칙으로 자동 생성한 레퍼런스입니다.    │ ← 설명 한 줄(생성 조합만, ★MQ-GM-2 A)
│ [접근성 미측정][성능 미측정][모션 낮음] …                     │
```

- 출처 Tag 순서·크기·색 = 카드 출처 줄과 **같은 컴포넌트·같은 순서**(3.3). 제목이 길면 Tag 묶음이 다음 줄로 내려간다(지금 `flex-wrap` 그대로) — Tag 2개가 서로 떨어지지 않게 Tag 묶음을 한 덩어리로 둔다.
- 설명 한 줄: 메타 줄과 같은 글자 크기·보조 색(`ds-caption1 text-label-alternative`) — 제목·점수보다 낮은 위계. 큐레이션은 렌더 0.
- 390(1열): 정보 열이 미리보기 아래로 내려간다(지금 구조). 표식도 h1과 함께 미리보기 아래 — h1과 같은 자리이므로 위계 변화 0. 출처 Tag가 줄바꿈되면 h1 아래 줄에 붙는다.

### 3.3 공통 부품 (구현 지침, 코드 아님)

- 카드·상세가 같은 "출처 Tag 묶음" 부품 1개를 쓴다(가칭 `SourceTags` — `components/catalog/` 아래 새 파일). 입력 = `licenseStatus`·`sourceKind`.
- **`referenceDisplay.ts`·`Tag.tsx`에 넣지 않는다**(F7 — `/profile` 첫 화면 99.87/100 영향). 새 파일은 CatalogPage·ReferenceDetailPage에서만 import.

---

## 4. 문구 원문 (한국어)

| 키 | 원문 | 쓰는 곳 | 비고 |
|---|---|---|---|
| T1 | `생성 조합` | 카드 출처 줄 · 상세 머리 Tag | 기존 카드 문구 그대로(`ReferenceCard.tsx:121`) |
| T2 | `internal` / `licensed` | 라이선스 Tag | 기존 값 그대로(`licenseStatus` 원문) |
| T3 | `섹션 라이브러리를 조합 규칙으로 자동 생성한 레퍼런스입니다.` | 상세 설명 한 줄(생성 조합만) | ★MQ-GM-2 A. 점수는 이미 "미측정" 타일이 말하므로 반복하지 않는다(`DetailSidebar.tsx:47-52`) |
| T4 | `라이선스` (화면에 안 보임) | 라이선스 Tag 앞 sr-only 접두 | ★MQ-GM-3 A. 낭독 = "라이선스 internal" |

- 금지: "AI 생성"(AI 모델 생성이 아님 — 규칙 조합) · "샘플"·"가짜"(가치 폄하) · 영문 "generated".

---

## 5. 접근성

- **낭독 순서 = 시각 순서**(m3p SPEC 7절 원칙 유지). 카드: article 이름(제목) → 썸네일 img alt → "라이선스 internal" → "생성 조합" → 제목 링크 → 메타. 상세: h1 → "라이선스 internal" → "생성 조합" → 메타 → 설명 한 줄.
- 카드 라이선스 Tag는 썸네일(`role="img"` 그림) 밖으로 나오므로 `aria-hidden`을 **뗀다** — 지금은 카드에서 라이선스가 스크린리더에 전혀 안 읽힌다(F3·F9). 권리 경계(원칙 4) 정보라 읽히게 한다(★MQ-GM-3 A).
- sr-only 접두 "라이선스"는 Tag **밖 형제 요소**로 둔다 — Tag 글자를 바꾸면 `getByText("internal")` 류 기존 단언이 깨진다(8절).
- 표식은 비대화형(Tag = span) — 포커스 대상 0, Tab 순서 변화 0(저장·비교 버튼·제목 링크 그대로). 툴팁 0(호버 전용 정보 금지).
- 라이브 영역: 없음 — 정적 정보이며 상태 변화로 나타나지 않는다. 기존 `DetailActions` 안내(notice) 라이브 영역과 무관.
- 색 단독 구분 금지: 생성 조합은 글자로 구분(neutral tone). 라이선스 tone 색은 보조.
- 대비: Tag는 기존 토큰 조합(DetailTags에서 이미 쓰는 neutral tint·라이선스 tone)만. 카드 배경 위라 썸네일 색 의존 0.
- reduced-motion: 새 모션 0.

---

## 6. 반응형 (390 · 1024 · 1280)

| 폭 | 카드(F6) | 상세 |
|---|---|---|
| 1280 | 3열 · 305.7px — 출처 줄 1줄, 썸네일 덮는 것 0 | 2단, 정보 열 우측. h1 옆 Tag, 제목 길면 Tag 묶음 줄바꿈 |
| 1024 | 필터 레일 + 2열 · 338.5px — 같음 | 2단(lg) — 같음 |
| 390 | 1열 · 343px — 같음. 카드 높이 +≈28px [추정] → 첫 화면에 보이는 카드 수 변화는 경미(카드 1장 ≈ 470px 중 6%) | 1열, 미리보기 아래 정보 열 머리에서 표시 |

---

## 7. 수용 기준

[U] = Vitest 단위·컴포넌트 · [G] = 가드(정적·빌드 검사) · [E] = Ego Lite 실브라우저(build + `vite preview`, 390·1024·1280)

| ID | 조건 | 검증 수단 |
|---|---|---|
| GM-AC-U1 | 생성 레퍼런스 카드: "생성 조합"이 보이고 읽힘(`aria-hidden`·`role="img"` 밖) — 기존 M3P-AC-U5 유지 | [U] `ReferenceCard.test.tsx` |
| GM-AC-U2 | 카드: 라이선스 Tag와 "생성 조합" Tag가 **썸네일 요소 밖**(썸네일 컨테이너의 자손 0) · `absolute` 배치 0 | [U] DOM 포함 관계 |
| GM-AC-U3 | 카드: 라이선스가 읽힘 — 접근 가능한 텍스트에 "라이선스 internal"(licensed 카드는 "라이선스 licensed") · `aria-hidden` 조상 0 | [U] (기존 181행 단언을 뒤집음) |
| GM-AC-U4 | 큐레이션 카드: "생성 조합" 0 · 라이선스 Tag 1개 | [U] |
| GM-AC-U5 | 상세(생성 조합): h1 다음에 라이선스 Tag → "생성 조합" Tag 순서, 설명 한 줄 T3 원문 1회 | [U] `ReferenceDetailPage.test.tsx` |
| GM-AC-U6 | 상세(큐레이션): "생성 조합" 0 · T3 문구 0 | [U] |
| GM-AC-U7 | 카드·상세 출처 표식 DOM 순서 = 라이선스 → 생성 조합(같은 부품) | [U] |
| GM-AC-U8 | 표식은 포커스 불가 — 카드·상세 Tab 순서 변화 0(기존 `keyboardA11y.test.tsx` 통과) | [U] |
| GM-AC-G1 | 새 출처 부품 파일이 `/profile`·`/studio` 진입 closure에 0 · `referenceDisplay.ts`·`Tag.tsx` 변경 0 | [G] `check-bundle-size` 출력 · `git diff --stat` |
| GM-AC-G2 | 예산: `/catalog` 첫 화면 ≤ 100.90(멈춤선) · `/references/:id` 첫 화면 ≤ 100 · `/profile` 99.87 그대로 · `/studio` 129.28 그대로(멈춤 > 129.65) | [G] `npm run build` 로그 |
| GM-AC-G3 | 하드코딩 금지 가드 통과(hex·px 0, 토큰만) | [G] `noHardcodedStyle.test.ts` |
| GM-AC-E1 | 390·1024·1280에서 생성 카드 썸네일 우상단 header CTA·내비가 가려지지 않음(썸네일 영역 안 Tag 0) | [E] 캡처 3장, `getBoundingClientRect` 교차 0 |
| GM-AC-E2 | 1280에서 출처 줄이 1줄(Tag 2개 같은 top) · 카드 행 높이 정렬 유지 | [E] |
| GM-AC-E3 | 상세(생성 조합) 1280·390: h1 옆/아래 Tag 2개 + 설명 한 줄, 큐레이션 상세엔 0 | [E] 앱 안 클릭으로 이동(메모리 store 함정) |
| GM-AC-E4 | 카드 → 상세 이동 뒤 같은 문구·같은 순서의 표식 | [E] |

QB(사람 판단, QA 레인): QB-GM-1 출처 줄이 제목 위계를 해치지 않는가(1280·390) · QB-GM-2 설명 한 줄이 군더더기로 느껴지지 않는가.

---

## 8. 구현 영향 추정

| 파일 | 변경 | 비고 |
|---|---|---|
| `app/src/components/catalog/SourceTags.tsx` (새) | 라이선스 Tag(+sr-only 접두) + 생성 조합 Tag 묶음 | 카드·상세 공용. `referenceDisplay.ts`의 `LICENSE_TONE`은 **import만**(파일 변경 0) |
| `app/src/components/catalog/ReferenceCard.tsx` | 썸네일 안 라이선스 Tag(53-57) 제거 · article 기준 생성 조합 받침(118-123) 제거 · 썸네일 아래 출처 줄 추가 · Thumbnail 주석(19-20) 갱신 | |
| `app/src/pages/ReferenceDetailPage.tsx` | `DetailHeader`(42-55) Tag 1개 → 출처 부품 · 생성 조합일 때 설명 한 줄 | |
| `ReferenceCard.test.tsx` | 181행(라이선스 `aria-hidden` 단언) **뒤집기** · 146-147·208-221 유지 확인 · U2·U3 추가 | 깨질 기존 테스트 1건 [L1 grep] |
| `ReferenceDetailPage.test.tsx` | U5·U6 추가 | `getByText("internal")`류 단언은 sr-only를 형제로 두면 유지 [추정] |

**예산 영향 [추정]**
- `/catalog` 첫 화면: 받침 span·absolute 클래스 제거 − 출처 부품·sr-only 추가 + → 순증 **+0.03~0.10** → 100.10~100.17 / 101 · 멈춤선 100.90 아래(남는 여유 ≥ 0.73).
- `/references/:id` 첫 화면: 부품 + T3 문장(한국어 약 30자) **+0.08~0.15** → 97.40~97.47 / 100.
- 공용 부품이 CatalogPage·ReferenceDetailPage 두 lazy 청크에 걸리면 Vite가 작은 공유 청크로 뺄 수 있다 → 두 라우트 첫 화면에 각각 포함(위 추정에 포함).
- `/studio`·`/profile`·`/projects`·`/compare`: **0** — 진입 closure를 건드리지 않으므로 조작 뒤 청크 설계 불필요. 단 `referenceDisplay.ts`를 수정하면 `/profile`에 닿으므로 금지(F7).
- 모두 예산 상향 0.

---

## 9. 위험

| 위험 | 영향 | 대응 |
|---|---|---|
| 카드 높이 +≈28px로 390 첫 화면 카드 노출이 줄어듦 | 경미(6%) | QB-GM-1에서 확인. 싫으면 MQ-GM-1 B(하단 팔레트 줄, 높이 0) |
| 라이선스 낭독 추가로 카드당 낭독이 길어짐(21장) | 스크린리더 탐색 피로 소폭 | 접두 1단어("라이선스")로 최소화. MQ-GM-3 B로 되돌릴 수 있음 |
| `internal`/`licensed` 영문 원값이 한국어 화면에서 낯섦 | 기존 문제(이번 diff가 만든 것 아님) | 범위 밖 — 라이선스 표기 한국어화는 별건 |
| `buildNote`의 "internal-compose-1" 같은 내부 버전 문자열이 메타 줄에 노출 | 기존 문제 | 설명 한 줄(T3)이 사람 말을 제공. buildNote 수정은 생성기 데이터 변경이라 별건 |
| 비교 보드에는 여전히 생성 조합 표식 없음 | 화면 간 불일치 | 제외 사유 기록 · MQ-GM-4 · BACKLOG 후보 |
| 공유 청크 분리로 첫 화면 요청 수 +1 | 성능 미미 | 예산 판정은 gzip 합계 — G2로 실측 |
