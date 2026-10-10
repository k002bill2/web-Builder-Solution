# GEN-MARK SPEC-2 — 출처 표식 후속 3건 (B-GM-01 비교 보드 · B-GM-02 buildNote · B-GM-03 라이선스 한국어 표기) (r1)

- 작성: Designer(GEN-MARK-2-SPEC) · 2026-10-11 · base main `d68006e` · 브랜치 `k002bill2/gen-mark-2-spec`
- 근거: `docs/06-handoff/BACKLOG.md:52-54`(B-GM-01~03) · `docs/design/gen-mark/SPEC.md` r1(정본, **수정하지 않음**) · `MQ.md` 결정 기록(MQ-GM-1~4 A) · `dev/active/gen-mark-impl/REPORT.md` · PRD `docs/02-prd/PRD.md:40·79`(원칙 4·FR-CAT-04) · ADR-002·003·004
- **SPEC r1과의 관계**: 이 문서는 r1의 T2(라이선스 Tag 원값 노출)·T4(낭독 "라이선스 internal")·1절 제외 항목 중 비교 보드·buildNote를 **대체·확장**한다. r1의 나머지(카드 출처 줄·상세 머리·T1·T3)는 그대로 유효하다.
- 결정 대기 항목은 `docs/design/gen-mark/MQ-2.md`(★추천). 본문 "★MQ-GM2-n A"는 추천안 기준이며, 결정이 다르면 해당 절만 바뀐다.
- 근거 수준: **L1** = 이 worktree에서 grep·빌드로 확인 · **L3** = 추정(실측 전, [추정] 표시).
- 코드 0 — 구현은 이 SPEC 확정 뒤 별도 Developer 레인.

---

## 0. 코드가 강제하는 전제 (L1)

| # | 사실 | 위치 |
|---|---|---|
| F1 | 비교 열 머리 = 열 문자 + 제목(2줄 말줄임) + 빼기 버튼 / 둘째 줄 = 대표색 견본 + 업종 + 라이선스 Tag(+ "사용 불가" Tag) — 둘째 줄은 이미 `flex flex-wrap gap-1.5`. "생성 조합" 표식 0 | `components/compare/ColumnHeader.tsx:38-73` |
| F2 | 열 머리 뷰 모델 `BoardColumnView`에 `sourceKind`가 **없다**(license·industry·swatch만) | `features/compare/boardView.ts:20-29·56-69` |
| F3 | 열 머리 폭: 768 이상 = 표 `th min-w-48 p-3`(내용 최소 ≈168px), 768 미만(390) = 가로 스크롤 카드 `li w-56 p-3`(내용 ≈198px). 4열이면 1024·1280 모두 표가 가로 스크롤할 수 있다(`overflow-x-auto`, 행 머리 `min-w-32` 고정) | `ComparisonTable.tsx:107-122` · `ComparisonAccordion.tsx:86-89` |
| F4 | 열 상태 3가지: `available` · `withdrawn`(노출 불가 라이선스 — `external_observed` 등) · `missing`(레퍼런스 없음 → license·sourceKind 0) | `domain/comparisonCells.ts:128` · `boardView.ts:57-59` |
| F5 | 생성 레퍼런스 `buildNote` = `` `internal 조합 생성기 ${version}으로 조립` `` · version = `INTERNAL_GENERATOR_VERSION = "internal-compose-1"`. 큐레이션 buildNote = "우리 섹션 라이브러리 v1.4로 제작"·"라이선스 템플릿 기반" | `domain/internalCompose.ts:189` · `domain/internalComposeData.ts:8` · `fixtures/referenceDetails.ts:14·47` |
| F6 | **version은 seed에 들어간다** — `hash(`${industry}|${n}|${attempt}|${version}`)`. 버전 상수를 바꾸면 15개 생성물의 팔레트·카드·모션·썸네일이 전부 다시 뽑힌다. 189행 문구 템플릿만 바꾸면 seed 불변 | `internalCompose.ts:155` |
| F7 | `buildNote` 소비처 = 상세 메타 줄 1곳(`ReferenceDetailPage.tsx:43`). `app/src/engine/`의 `buildNote` 0건 · createDoc는 `generatorVersion`을 따로 받는다 → **엔진 계약 아님** | grep · `internalCompose.ts:65` |
| F8 | 생성 픽스처 가드: G1 = 커밋된 `generatedReferences.ts`·`generatedReferenceDetails.ts`가 생성기 재실행 결과와 바이트 일치. G5 = **큐레이션 3벌만** 해시(`references.ts`·`referenceDetails.ts`·`referenceComparisons.ts`) | `domain/internalCompose.test.ts:144-171` |
| F9 | 썸네일 진입(`thumbs/entry.tsx`)은 detail(`buildNote` 포함)을 읽지 않는다 → buildNote 문구 변경은 썸네일·`thumbsVersion` 영향 0 | grep `detail\|buildNote` thumbs/entry.tsx 0건 |
| F10 | 라이선스 원값(`internal`/`licensed`) 표시 지점 5곳: `SourceTags.tsx:14-16`(카드·상세) · `ColumnHeader.tsx:63-66`(비교) · `ProfileValues.tsx:41-43`(프로필 출처 목록) · `fixtures/catalogFilters.ts:152-153` label(필터 레일 체크박스) · `pages/CatalogPage.tsx:61` 부제 "internal · licensed 레퍼런스 n개" | grep |
| F11 | 필터 상태·URL·집계는 **id** 기준(`facetCounts.ts:32-33` `[ref.licenseStatus]`, `catalogSearchParams`) — 표시 문구를 바꿔도 데이터·URL 값은 그대로 | grep |
| F12 | `catalogFilters.ts`는 `features/studio/themeText.ts`·`components/profile/ProfileValues.tsx`도 import · `referenceDisplay.ts`는 `ProfileValues.tsx`도 import → 이 두 파일에 새 값을 넣으면 `/studio`·`/profile` closure에 닿을 수 있다 | grep `catalogFilters`·`referenceDisplay` |
| F13 | `LicenseStatus`는 3값(`internal`·`licensed`·`external_observed`). MVP 노출은 2값이지만 비교 보드 `withdrawn` 열은 노출 불가 값을 그대로 Tag로 그릴 수 있다 | `domain/reference.ts:5-10` · F4 |

### 0.1 예산 기준 (브리프 · gzip KB)

| 라우트 | 첫 화면 / 한도 | 진입 직후 / 한도 |
|---|---|---|
| `/catalog` | 100.33 / 101 · 멈춤 100.90 | — |
| `/references/:id` | 97.76 / 100 | — |
| `/compare` | 98.91 / 100 | 122.72 / 125 |
| `/profile` | 99.90 / 100 (여유 0.10) | — |
| `/studio/:projectId` | — | 129.63 / 멈춤 129.65 (여유 0.02) |

- 원칙: **`/studio`·`/profile` closure 무접촉**. 이 SPEC의 모든 ★안은 이 원칙 안에서 설계했다.
- 이 worktree 실측(`npm run build` exit 0, base `d68006e`, L1): `/catalog` 100.32 · `/references/:id` 97.76 · `/compare` 98.92 / 진입 122.74 · `/profile` 99.90 · `/studio` 진입 129.63(멈춤 > 129.65) · **`/studio` 저장 데이터 복원 진입 132.67(멈춤 > 132.68, 여유 0.01)**.
- manifest 정적 closure(L1): `ProfilePage` ⊃ `catalogFilters`·`referenceDisplay` 청크 · `CompareBoardPage` ⊃ `referenceDisplay` · `StudioPage` 정적 closure엔 셋 다 0 · `SourceTags` 청크는 Catalog·Detail만.
- **F14 (gen-mark-impl REPORT 3절 관측 + Codex r1 시제품)**: 새 공유 청크가 생기면 그 파일 이름이 엔트리 `index-*.js` preload 맵에 들어가 모든 라우트가 늘어난다(gen-mark-impl 관측 +0.02 — 고정값 아님). 새 청크가 없어도 청크 재편으로 엔트리·공유 청크 gzip이 수 바이트 바뀔 수 있다(Codex r1 시제품 write:false 빌드: SourceTags가 `compareTray` 청크로 합쳐지며 `/profile` +3B · `/studio` +8B · 복원 진입 +7B). → `/studio` 복원 진입 여유 0.01KB(≈10B) 안에서 **영향 0은 보장이 아니라 목표**다. ★안은 새 공유 청크를 만들지 않는 쪽으로 설계해 위험을 줄이고, 판정은 G2 base/head 실측으로 한다.

---

## 1. 목적 · 범위 / 제외

**목적**
1. 비교 보드에서도 카드·상세와 같은 말("생성 조합")로 출처를 구분한다 — 화면 간 불일치 1곳 해소(r1 MQ-GM-4 A의 후속).
2. 상세 메타 줄에서 내부 버전 문자열("internal-compose-1")을 사용자에게 보이지 않게 한다 — 사용자 말이 아닌 개발 식별자.
3. 라이선스 표기를 한국어 사람 말로 바꾼다 — 한국어 화면 안의 영문 원값(`internal`/`licensed`)은 뜻을 전달하지 못한다.

**범위**
- B-GM-01: `ColumnHeader`(표·아코디언 공용) 둘째 줄 "생성 조합" 표식 · 뷰 모델 `sourceKind` 전달.
- B-GM-02: 생성 레퍼런스 상세 메타 줄의 buildNote 표시(★MQ-GM2-2 A = 표시층에서 숨김).
- B-GM-03: 라이선스 **표시 문구만** 한국어로 — 카드·상세·비교 보드·필터 레일·카탈로그 부제. 데이터·필터 id·URL은 영문 유지.

**제외 (사유)**
- `/profile` `ProfileValues` 라이선스 Tag 한국어화 — `/profile` 첫 화면 여유 0.10 · closure 무접촉 원칙(F12). ★MQ-GM2-4 A에 따라 원값 유지, BACKLOG 후보(화면 간 불일치 1곳 남음 — 9절).
- 생성기 버전 상수(`INTERNAL_GENERATOR_VERSION`) 변경 — F6(전 생성물 재추첨).
- 큐레이션 buildNote("우리 섹션 라이브러리 v1.4로 제작") 수정 — G5 해시 승인 필요(F8). 이미 사람 말이다.
- 상세 "유사 레퍼런스" 타일 표식 — r1 제외 사유 그대로.
- `external_observed` 화면 노출 확대 — FR-CAT-04. 표시 맵에는 3값을 모두 정의하되(F13) 노출 정책은 그대로.

---

## 2. 사용자 흐름 · 상태

| 상태 | 조건 | 비교 열 머리(B-GM-01·03) | 상세 메타(B-GM-02) | 라이선스 표기(B-GM-03) |
|---|---|---|---|---|
| 정상 · 큐레이션 | `sourceKind` 없음 · available | 견본 · 업종 · [자체 제작] 또는 [이용 허락] | buildNote 그대로 노출(지금과 같음) | 한국어 Tag |
| 정상 · 생성 조합 | `library_composition` · available | 견본 · 업종 · [자체 제작] [생성 조합] | buildNote **숨김** — r1 T3 설명 한 줄이 같은 사실을 사람 말로 전달 | 한국어 Tag |
| 회수 | `withdrawn` | 견본 · 업종 · [라이선스 Tag(값별 한국어)] [생성 조합 — 해당 시] [사용 불가] + 사유 줄 | 해당 없음 | `external_observed` → "외부 관찰" |
| 없음 | `missing` | 제목 "찾을 수 없는 레퍼런스" · 라이선스·생성 조합 0(데이터 없음 — 지금과 같음) | 해당 없음(NotFound) | 0 |
| 로딩 | 보드 로딩·상세 로딩 | 기존 로딩 상태 — 표식은 데이터 준비 뒤에만 | 기존 `LoadingState` | — |
| 빈 | 보드 열 0 / 필터 결과 0 | 기존 빈 상태 그대로 | — | 필터 레일 체크박스 문구만 한국어 |
| 경고·오류 | — | 새 경고 0 | — | — |

흐름: 카탈로그 카드 [자체 제작][생성 조합] → 비교 담기 → `/compare` 열 머리에서 같은 두 Tag를 같은 순서로 다시 본다 → 제목·상세로 가면 같은 표식 + 설명 한 줄. 필터 레일 "라이선스" 그룹 체크박스도 같은 한국어 문구.

---

## 3. 화면 구조 · 정보 위계

### 3.1 비교 열 머리 (B-GM-01 · ★MQ-GM2-1 A)

```
1280 · 1024 (표, 열 min ≈168px 내용 폭)        390 (아코디언 위 가로 스크롤 카드, 내용 ≈198px)
┌ th ──────────────────────────┐               ┌ li ─────────────────────────┐
│ [A] 뷰티 · 세련된 센터형  [×] │ ← 1행 그대로   │ [A] 뷰티 · 세련된 센터형 [×] │
│ ● 뷰티 [자체 제작] [생성 조합] │ ← 2행: 표식 추가│ ● 뷰티 [자체 제작] [생성 조합]│
│ [전부 선택]                   │               │ [전부 선택]                  │
└──────────────────────────────┘               └─────────────────────────────┘
좁으면 2행이 flex-wrap으로 [생성 조합]만 다음 줄로 내려간다(축약 0)
```

- 위치: 둘째 줄(견본·업종·라이선스) **라이선스 Tag 바로 뒤**. 순서 = 견본 → 업종 → 라이선스 → 생성 조합 → (사용 불가). 카드·상세 출처 줄과 같은 "라이선스 → 생성 조합" 순서.
- 크기: `Tag size="sm"`, neutral tone(카드·상세와 같음). **축약 없음**("생성"·"조합" 등 줄임말 0) — 4글자라 줄임 이득이 작고, 화면마다 다른 말이 되면 r1 목적(같은 말)이 깨진다.
- 폭 검산 [추정]: 견본 12 + 업종(2~4자) ≈ 30~55 + [자체 제작] ≈ 58 + [생성 조합] ≈ 58 + 간격 6×3 = 176~201px. 168px 열에서는 [생성 조합]이 다음 줄로 넘어간다 → 열 머리 높이 +≈22px(Tag 1줄) [추정]. 같은 표 머리 행의 다른 열도 같은 높이로 맞춰지므로(표 행) 정렬 깨짐 0. 390 카드는 198px라 업종 글자 수에 따라 1줄 또는 2줄.
- 1행(제목·빼기 버튼) 위치는 그대로. "전부 선택"은 위 배치 계약의 허용 범위 안에서만 내려간다.
- 부품: ★ **`SourceTags` 재사용** — `ColumnHeader`의 라이선스 Tag 자리를 `<SourceTags reference={{ licenseStatus, sourceKind }} />`로 바꾼다(접두·라이선스·생성 조합이 카드·상세와 한 부품). 근거: F14 — 라이선스 표시 맵(3.3)을 `SourceTags` 청크에 두면 ColumnHeader가 어차피 그 청크를 import해야 하므로, 부품까지 재사용해도 추가 비용이 거의 같다. 새 공유 청크 0 → preload 맵 변화 0.
  - 대가: `/compare` 첫 화면에 `SourceTags` 코드(gzip ≈0.33, impl REPORT L1) 추가 → 98.92 → **≈99.25~99.30 / 100** [추정].
  - **배치 계약(Codex r1 P2-2 반영)**: 지금 `SourceTags`는 자체 `flex` div 래퍼(`SourceTags.tsx:12`)라 ColumnHeader 둘째 줄에 넣으면 두 Tag가 한 덩어리로 같이 줄바꿈된다. 구현은 래퍼가 부모 행에 녹아들게 한다 — 예: 래퍼에 `contents` 배치를 주는 prop(가칭 `inline`)이나 Fragment 반환 변형. 카드·상세의 기존 배치(r1 GM-AC-E2: 1줄 · 같은 top)는 바뀌지 않아야 한다.
  - 줄바꿈 시 "전부 선택" 버튼은 둘째 줄 높이만큼 **아래로 이동해도 된다**(세로 flex — 허용 범위 = Tag 1줄 높이). 가로 위치·빼기 버튼 위치는 그대로.
- 뷰 모델: `BoardColumnView`에 `sourceKind?: SourceKind` 추가, `columnView()`에서 `reference.sourceKind` 전달(`boardView.ts:60-68`). 화면 모델 필드 1개 추가이며 엔진·저장 스키마·비교 픽스처 변경 0.

### 3.2 상세 메타 줄 (B-GM-02 · ★MQ-GM2-2 A)

```
생성 조합 상세 (1280 정보 열 · 390 미리보기 아래 — r1 3.2 구조 그대로)
│ 뷰티 · 세련된 센터형  [자체 제작] [생성 조합]                    │
│ 뷰티 · 센터 히어로 · 20~30대 타깃                                 │ ← buildNote 항목 제거(구분점 포함)
│ 섹션 라이브러리를 조합 규칙으로 자동 생성한 레퍼런스입니다.        │ ← r1 T3 그대로
```

- 규칙: `sourceKind === "library_composition"`이면 메타 배열에서 `detail.buildNote`를 뺀다. 큐레이션은 그대로("… · 우리 섹션 라이브러리 v1.4로 제작").
- 근거: T3 한 줄이 buildNote와 같은 사실(조합으로 만든 것)을 사람 말로 이미 말한다 → 중복 제거 + 내부 버전 문자열 노출 0. 데이터(픽스처)에는 생성기 버전 이력이 그대로 남는다(추적성 유지).
- 구분점(" · ") 처리: 메타는 배열 `join(" · ")`(`ReferenceDetailPage.tsx:43·51`, L1)이라 배열에서 항목을 빼면 끝 구분점이 남지 않는다.

### 3.3 라이선스 표기 (B-GM-03 · ★MQ-GM2-3 A · ★MQ-GM2-4 A)

| 지점 | 지금 | 바뀐 뒤 | 변환 위치 |
|---|---|---|---|
| 카드 출처 줄 · 상세 머리 (`SourceTags`) | `internal` | `자체 제작` | 표시 시점 |
| 비교 열 머리 (`ColumnHeader`) | `internal` | `자체 제작` | 표시 시점 |
| 필터 레일 "라이선스" 그룹 (`FilterRail`) | 체크박스 `internal` / `licensed` | `자체 제작` / `이용 허락` | 표시 시점(FilterRail이 license 그룹일 때 label 대신 표시 맵) — `catalogFilters.ts` 데이터 변경 0 |
| 카탈로그 부제 (`CatalogPage.tsx:61`) | `internal · licensed 레퍼런스 n개` | `자체 제작 · 이용 허락 레퍼런스 n개` | 표시 시점 |
| 프로필 출처 목록 (`ProfileValues`) | `internal` | **그대로**(제외 — `/profile` closure) | — |

- 표시 맵(가칭 `LICENSE_LABEL`, 3값 전부): `internal` → `자체 제작` · `licensed` → `이용 허락` · `external_observed` → `외부 관찰`.
- 맵 위치: **`components/catalog/SourceTags.tsx` 안 export**(기존 청크 — Catalog·Detail, ★안에서 Compare 합류). `/studio`·`/profile` closure 밖. `referenceDisplay.ts`·`catalogFilters.ts`에 두지 않는다(F12). 새 파일로 빼면 3라우트 공유 새 청크 → F14 위험이라 금지.
- 데이터·필터 id·URL 쿼리·facet 집계·도메인 타입은 영문 그대로(F11). 링크 공유 URL 호환 유지.
- Tag 색(`LICENSE_TONE`)은 그대로 — 글자만 바뀐다.

---

## 4. 문구 원문 (한국어)

| 키 | 원문 | 쓰는 곳 | 비고 |
|---|---|---|---|
| T1 | `생성 조합` | 카드·상세·**비교 열 머리** Tag | r1 T1 그대로, 비교 보드로 확장 |
| T2' | `자체 제작` | `licenseStatus: internal` 표시 | r1 T2 대체. PRD:40 "우리 섹션 라이브러리로 만든" |
| T2'' | `이용 허락` | `licenseStatus: licensed` 표시 | PRD:40 "권리자 허락분". "라이선스 확보"는 낭독 중복(5절)으로 기각 |
| T2''' | `외부 관찰` | `external_observed` 표시(비교 보드 withdrawn 열에서만 가능) | 노출 정책 변화 0 |
| T4' | `라이선스: ` (화면에 안 보임) | 라이선스 Tag 앞 sr-only 접두(카드·상세·비교) | r1 T4 대체 — 콜론으로 "라이선스 / 값" 경계를 들리게. 낭독 "라이선스: 자체 제작" |
| T5 | `자체 제작 · 이용 허락 레퍼런스 {n}개` | 카탈로그 부제 | `CatalogPage.tsx:61` |
| T3 | (r1 그대로) `섹션 라이브러리를 조합 규칙으로 자동 생성한 레퍼런스입니다.` | 상세 설명 한 줄 | buildNote 숨김의 대체 설명 |

- 금지: "AI 생성"·"샘플"·"가짜"(r1) · "무료"/"유료"(라이선스 비용 정보 아님) · "내부"(사내 전용으로 오해) · 영문 원값 화면 노출(제외 지점 `/profile` 1곳은 9절 위험으로 기록).

---

## 5. 접근성

- **낭독 순서 = 시각 순서**. 비교 열 머리(`th` 이름 = 셀 전체 텍스트): "A 뷰티 · 세련된 센터형 / 뷰티 / 라이선스: 자체 제작 / 생성 조합 / 전부 선택…". 지금은 "internal"만 들린다.
- sr-only 접두 T4'는 Tag **밖 형제**(r1 원칙 유지 — Tag 글자 단언 분리). 비교 열 머리에도 같은 접두를 둔다(지금 비교 보드는 접두 0 → 카드·상세와 낭독 일치).
- 낭독 중복 금지: 접두 "라이선스"와 값이 같은 단어로 겹치는 문구("라이선스 확보")를 쓰지 않는다 → T2'' "이용 허락".
- 표에서 `th` 안 Tag 추가 → 열 머리글 접근 이름이 길어진다(셀 이동 때마다 머리글을 다시 읽는 스크린리더). 증가 = "생성 조합" 2단어(생성 조합 열만) + "라이선스:" 1단어. 허용 범위로 판단(정보 가치 > 길이) — QB-GM2-2로 확인.
- 표식은 비대화형 span — 포커스·Tab 순서 변화 0(빼기·전부 선택 버튼 그대로). 툴팁 0.
- 필터 레일 체크박스: 접근 이름 = 보이는 문구(`자체 제작`) — WCAG 2.5.3 일치. 그룹 이름 "라이선스"는 fieldset legend 그대로.
- 색 단독 구분 0(글자로 구분) · 대비 = 기존 Tag 토큰 · 새 모션 0 · 라이브 영역 0.

---

## 6. 반응형 (390 · 1024 · 1280)

| 폭 | 비교 열 머리 | 상세 메타 | 라이선스 Tag 폭 |
|---|---|---|---|
| 1280 | 표 4열. 열 폭 ≥168px 내용 — 2행이 1~2줄(업종 글자 수·열 수에 따라) [추정] | 정보 열 — buildNote 제거로 메타 줄이 짧아짐(줄 수 ≤ 지금) | `자체 제작`(4자) ≈ `internal`(8자) 폭 비슷, `이용 허락` ≈ `licensed` [추정] — 카드 출처 줄 1줄 유지(r1 GM-AC-E2) |
| 1024 | 같음(가로 스크롤 가능, 행 머리 고정) | 같음 | 같음 |
| 390 | 아코디언 위 `w-56` 카드 가로 스크롤 — 2행 1~2줄 | 미리보기 아래 정보 열 | 같음 |

- 축약 없음 — 폭이 모자라면 줄바꿈(flex-wrap 기존). 표 머리 행 높이는 열 중 가장 큰 값으로 맞춰진다.

---

## 7. 수용 기준

[U] = Vitest · [G] = 가드(정적·빌드) · [E] = Ego Lite 실브라우저(build + `vite preview`, 390·1024·1280, 앱 안 클릭 이동)

| ID | 조건 | 검증 |
|---|---|---|
| GM2-AC-U1 | 비교 열(생성 조합·available): 열 머리에 "생성 조합" Tag 1개, 라이선스 Tag **다음** DOM 순서 · `aria-hidden` 조상 0 | [U] `compareBoardV2.test.tsx`(표)·아코디언 |
| GM2-AC-U2 | 비교 열(큐레이션): "생성 조합" 0 · missing 열: 라이선스·생성 조합 0 · withdrawn 열: 생성 조합(해당 시)과 "사용 불가" 공존 | [U] |
| GM2-AC-U3 | `buildBoardView`가 `sourceKind`를 열 뷰에 전달(생성 = `library_composition`, 큐레이션 = undefined) | [U] boardView |
| GM2-AC-U4 | 생성 상세: 메타 줄에 "internal-compose" · "조합 생성기" 문자열 0 · T3 1회 · 구분점 끝 남음 0 | [U] `ReferenceDetailPage.test.tsx` |
| GM2-AC-U5 | 큐레이션 상세: 메타 줄 buildNote("우리 섹션 라이브러리 v1.4로 제작") 그대로 | [U] |
| GM2-AC-U6 | 카드·상세·비교 라이선스 Tag 글자 = `자체 제작`/`이용 허락`, 영문 원값 0 · 접근 텍스트 "라이선스: 자체 제작" | [U] |
| GM2-AC-U7 | 필터 레일 라이선스 체크박스 이름 = `자체 제작`·`이용 허락` · 체크 시 URL 쿼리 값은 `internal`/`licensed` 그대로 · facet 개수 변화 0 | [U] `CatalogPage.test.tsx`·`catalogSearchParams` |
| GM2-AC-U8 | 카탈로그 부제 = T5 | [U] `CatalogPage.test.tsx:179` 갱신 |
| GM2-AC-U9 | 표시 맵이 `LicenseStatus` 3값 전부 정의(타입 `Record<LicenseStatus, string>`로 누락 컴파일 오류) | [G] typecheck |
| GM2-AC-U10 | 표식·라벨 비대화형 — `keyboardA11y.test.tsx` 통과, Tab 순서 변화 0 | [U] |
| GM2-AC-G1 | **`/studio`·`/profile` closure 무접촉**: `referenceDisplay.ts`·`catalogFilters.ts`·`ProfileValues.tsx`·`Tag.tsx`·`internalCompose*.ts`·`fixtures/` 변경 0 | [G] `git diff --stat` |
| GM2-AC-G2 | 예산: `/studio` 진입 ≤ 129.65 · **`/studio` 복원 진입 ≤ 132.68** · `/profile` 첫 화면 ≤ 100 · `/compare` 첫 화면 ≤ 100 · 진입 ≤ 125 · `/catalog` ≤ 100.90 · `/references/:id` ≤ 100. 같은 머신에서 base(`d68006e`)·head 빌드를 둘 다 돌려 두 `/studio` 시나리오·`/profile` 수치와 manifest 정적 closure 변화를 표로 비교 | [G] `npm run build` 로그 ×2 |
| GM2-AC-G3 | G1·G5 생성 픽스처 가드 그대로 통과(데이터 변경 0) · 썸네일 `thumbsVersion` 불변 | [G] vitest · build-thumbs 출력 |
| GM2-AC-G4 | 하드코딩 금지 가드 통과 | [G] `noHardcodedStyle.test.ts` |
| GM2-AC-E1 | 1280·1024·390 비교 보드(생성 1 + 큐레이션 1 이상, 4열 포함): 생성 열 머리에 [자체 제작][생성 조합] · 좁은 열에서 **[생성 조합]만** 다음 줄(라이선스는 업종과 같은 줄) · 빼기 버튼 위치 그대로 · 전부 선택은 허용 범위(Tag 1줄 높이) 안 이동 · 긴 업종명 열과 withdrawn 열 각 1개 포함 | [E] 캡처 3장 + Tag rect |
| GM2-AC-E2 | 생성 상세 1280·390: 메타 줄에 "internal-compose" 0 | [E] |
| GM2-AC-E3 | 카탈로그 1280: 필터 레일·부제·카드에 영문 `internal`/`licensed` 0 · 체크 후 URL에 `internal` | [E] |

QB(사람 판단, QA 레인): QB-GM2-1 `이용 허락`이 사용자에게 뜻이 통하는가(대안 MQ-GM2-3 B) · QB-GM2-2 비교 열 머리 2행 줄바꿈이 산만하지 않은가(1280 4열).

---

## 8. 구현 영향 추정

| 파일 | 변경 | 비고 |
|---|---|---|
| `components/catalog/SourceTags.tsx` | `LICENSE_LABEL: Record<LicenseStatus,string>` export · Tag 글자 → `LICENSE_LABEL[...]` · 접두 T4' | 맵을 이 파일에 둔다(새 공유 청크 0, F14) |
| `components/compare/ColumnHeader.tsx` | 라이선스 Tag(63-67) → `<SourceTags>` (생성 조합·접두 포함) | "사용 불가" Tag는 그대로 SourceTags 뒤 |
| `features/compare/boardView.ts` | `BoardColumnView.sourceKind?` 추가 · `columnView()` 전달 | 화면 모델만 |
| `pages/ReferenceDetailPage.tsx` | 43행 메타 배열: 생성 조합이면 buildNote 제외 | |
| `components/catalog/FilterRail.tsx` | license 그룹 option 표시 문구 = `LICENSE_LABEL[id]` | `catalogFilters.ts` 변경 0 |
| `pages/CatalogPage.tsx` | 61행 부제 T5(맵 값으로 조립) | |
| 테스트(갱신) | `ReferenceCard.test.tsx:41·132·259·261·275` · `compareBoardV2.test.tsx:152` · `ReferenceDetailPage.test.tsx:24·439·456` · `CatalogPage.test.tsx:179` — 영문 원값·접두 단언 → 한국어 | 깨질 단언 10곳 [L1 grep] |
| 테스트(추가) | GM2-AC-U1~U8 | |
| 변경 0 | `referenceDisplay.ts` · `catalogFilters.ts` · `ProfileValues.tsx` · `Tag.tsx` · `domain/internalCompose*.ts` · `fixtures/` · `engine/` · `scripts/` · `vite.config.ts` | GM2-AC-G1 |

**예산 영향 [추정] (기준 = 0.1 실측)**
- `/compare` 첫 화면: `SourceTags` 청크 합류 ≈ +0.33 + 맵·조건 ≈ +0.02 → **≈99.25~99.30 / 100**(여유 ≥ 0.70). 진입 직후 122.74 → ≈123.10 / 125. ColumnHeader는 보드가 열리면 바로 그려지므로 조작 뒤 청크로 미룰 대상이 아니다.
- `/catalog`: SourceTags 청크 맵 + FilterRail·부제 → +0.02~0.05 → ≤100.37 / 멈춤 100.90.
- `/references/:id`: 맵 + 메타 조건 → +0.01~0.03 → ≤97.79 / 100.
- `/studio`(진입 129.63 · 복원 132.67)·`/profile` 99.90: **목표 0, 보장 아님** — 정적 closure에 SourceTags 없음(L1 manifest)이고 새 공유 청크를 만들지 않지만, 청크 재편만으로 수 바이트가 바뀔 수 있다(Codex r1 시제품: `/studio` +8B · 복원 +7B · `/profile` +3B [추정, 정식 구현 아님]). 복원 진입 여유 ≈10B라 **G2 base/head 실측이 판정**이다.
  - 넘으면 멈추고 보고한다(예산 증액은 이 SPEC 범위 밖). 시도 순서 제안: ① 청크 배치 그대로 두고 수 바이트 원인 확인 ② `SourceTags`를 `compareTray`에 합치지 않게 하는 import 경로 조정 — 둘 다 안 되면 사용자 결정.
- 대안 비교(MQ-GM2-1 B, Tag 직접 + 새 `licenseLabel.ts`): `/compare` +0.03~0.06로 작지만 새 공유 청크 → preload 맵 증가(gen-mark-impl 관측 +0.02)면 `/studio` 복원 진입 132.69 > 132.68 **초과 가능** [추정, F14]. 그래서 ★가 아니다.
- 예산 상향 0 · 엔진 계약 0 · 저장 스키마 0 · 픽스처·썸네일 0.

---

## 9. 위험

| 위험 | 영향 | 대응 |
|---|---|---|
| 새 공유 청크(preload 맵 증가) 또는 청크 재편(수 바이트)으로 `/studio` 복원 진입 132.67 → > 132.68 | 멈춤선 초과 | 맵·부품을 `SourceTags.tsx` 한 파일에(8절) · G2 실측 · 초과 시 멈춤·보고 |
| `/compare` 첫 화면 +≈0.35 [추정] | 여유 1.08 → ≈0.70 | 실측 G2. 이후 `/compare` 레인은 남은 여유를 의식 |
| `/profile` 출처 목록만 영문 원값 → 화면 간 불일치 1곳 | 사용자가 같은 값을 두 이름으로 봄 | 제외 사유 기록 · BACKLOG 후보(B-GM-03b) · `/profile` 예산 재편 때 함께 |
| `이용 허락`이 낯선 표현 | 이해도 | QB-GM2-1 · MQ-GM2-3 B("제휴")로 교체 가능(문구만) |
| 비교 열 머리 높이 증가(+≈22px, 2행 줄바꿈) [추정] | 표 첫 행이 아래로 밀림 | 축약 대신 줄바꿈 선택(같은 말 유지) · QB-GM2-2 |
| buildNote를 숨겨 생성기 버전 추적이 화면에서 사라짐 | 내부 디버깅 정보 손실 | 데이터에 그대로 남음(픽스처·doc `generatorVersion`) — 사용자 화면 대상 아님 |
| 표시 맵을 우회하는 새 라이선스 표시 지점이 생김 | 영문 재노출 | GM2-AC-E3 · 리뷰 때 `licenseStatus}` 직접 렌더 grep |
