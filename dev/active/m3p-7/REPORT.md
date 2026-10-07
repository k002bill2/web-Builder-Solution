# M3P-7 REPORT — 레퍼런스 데이터 정합 묶음 (B-M3P-05 · 08 · 07)

- base `be5292b`(ER-9 병합) · 커밋 `cb7527c`(B-M3P-08·05) · `173eacd`(B-M3P-07) · `bb9ce87`(PROGRESS·캡처) · 이 REPORT 커밋.
- 영환님 **★A**(2026-10-07) — 큐레이션 픽스처 수정 승인 포함.

## 원인 (B-M3P-08, L1)
- 큐레이션 "동네 치과"(ref-c) 편집 문서 About 2개 = **데이터 문제**. `fixtures/referenceComparisons.ts` ref-c `sectionPlan`에 `about/split`(소개) + `about/team-grid-3`(의료진)이 함께 있었고, `ENGINE_VARIANT_MAP`(VARIANT-MAP.md 정본, 수정 대상 아님)이 둘 다 엔진 변형 `story`로 접는다. 프로필 `section_plan` = 이 sectionPlan(`profileDraft.ts`) → 3안 → `writeStartDoc` → 같은 (about, story) 2개.
- 21개 렌더 전수 스캔: 같은 (유형, 엔진 변형) 중복 = ref-c about/story · ref-e portfolio/grid-3(case-list + insights-grid-3) · ref-f contact/form(order-form + map-form). 생성 15개 = 0.
- 규칙: 렌더 문서에서 같은 (type, 엔진 변형) 쌍 0(같은 유형·다른 변형은 허용 — ref-c/d services). 수정 = 뒤쪽 중복 행 삭제. 테스트 `curatedStartDoc.test.ts`(21개 전수).

## 바뀐 큐레이션 필드 (references.ts 카드 변경 0)
| 파일 · ref | 필드 | 변경 |
|---|---|---|
| referenceComparisons · ref-c | sectionPlan | `about/team-grid-3`(의료진) 삭제 → 8행 |
| referenceComparisons · ref-e | sectionPlan | `portfolio/insights-grid-3`(인사이트) 삭제 → 7행 |
| referenceComparisons · ref-f | sectionPlan | `contact/map-form`(오시는 길) 삭제 → 7행 |
| referenceDetails · ref-a | sections | Header sticky→sticky-right-cta · About split→story · Services grid-3→cards-3 · Testimonials carousel→quotes-2 · Contact "map + form"→form · **Footer biz-extended 추가**(8→9) |
| referenceDetails · ref-b | sections | Header sticky→sticky-hamburger · Services grid-3→cards-3 · Testimonials carousel→quotes-2 |
| referenceDetails · ref-c | sections | Header→sticky-two-tier · About→story · Services→cards-3 · Doctors 삭제 · Notice list→Services list · Contact→form · Footer biz-extended→biz-extended-map (9→8) |
| referenceDetails · ref-d | sections | Classes→Services cards-3 · Schedule table→Services list · Instructors carousel→About story · Pricing cards→tiers-2 |
| referenceDetails · ref-e | sections | Header→sticky-right-cta · Practice→Services list · Attorneys grid-2→About story · Cases+Insights→Portfolio grid-3 (8→7) |
| referenceDetails · ref-f | sections | Header→sticky-right-cta · Menu→Services cards-3 · Story→About story · Gallery→Portfolio masonry · Order form+Contact map+form→Contact form (8→7) |
- 기준(B-M3P-05) = 생성 15와 같은 "상세 = 렌더 1:1"(`detailRender.test.ts` 큐레이션 6까지 확장). ref-a는 목업 1a-02의 8개(Footer 없음)와 다르다 — 사유: ADR-003 사용자 흐름 우선(상세에 보이는 구성 = 실제로 만들어지는 문서).
- 영향받은 기존 테스트(단언 약화 0, 기대값을 새 데이터로): `comparisonCells.test`(섹션 수) · `composeCandidates.test` · `internalCompose.test`(G5) · `ReferenceDetailPage.test`.

## G5 해시 갱신 근거
- `internalCompose.test.ts` "G5" — `referenceDetails.ts` 574fbca2 → **c515bbcb**, `referenceComparisons.ts` 4c0ffbaf → **69d5ca7b**, `references.ts` bea53875 그대로. 승인된 변경과 **같은 커밋**(`cb7527c`)에서 갱신, 테스트 이름·주석에 "M3P-7 영환님 ★A 승인 · 새 base". 가드 삭제·약화 0 — 이 base 이후 무단 변경은 계속 실패한다.

## B-M3P-07 (3안 미리보기 문구)
- `comparePreviews(job, viewed, base?)` — 기준 레퍼런스 카드로 `industryCopyOf` 적용 → 미리보기 hero = 편집 시작 뒤 편집기 hero. 카드는 `/profile`이 이미 가진 출처 카드를 `CandidatesSection → CompareDialog`로 넘긴다(비교 청크가 픽스처를 import하면 카드 청크가 갈라짐 — 빌드 실측). 카드 없음·표 밖 = 예시 문구(기존).

## 번들 (gzip KB, `npm run build` exit 0 · 기준 = ER-9 최종 = base)
| 행 | base | M3P-7 | Δ |
|---|---|---|---|
| **/studio/:projectId 진입 직후** | 128.56 | **128.51** | −0.05 (기준선 128.55 · 판정선 128.58) |
| /studio 첫 화면 | 91.84 | 91.84 | 0 |
| /catalog 첫 · 진입 | 100.05 · 102.43 | 100.05 · 102.38 | 0 · −0.05 |
| /references/:id 첫 · 진입 | 97.29 · 99.68 | 97.30 · 99.63 | +0.01 · −0.05 |
| /compare 첫 · 진입 | 98.85 · 121.95 | 98.85 · 121.88 | 0 · −0.07 |
| /profile 첫 · 진입(3안) | 99.71 · 119.16(121.63) | 99.72 · 119.12(121.59) | +0.01 · −0.04 |
| /projects 첫 · 진입 | 94.03 · 100.36 | 94.04 · 100.31 | +0.01 · −0.05 |
| 렌더 JS · CSS | 84.19 · 8.85 | 84.19 · 8.85 | 0 |
| /profile 조작 뒤 CompareDialog | (ER-9 표에 없음) | 22.43 | 판정 밖 |
- 한도 초과 0. 진입 감소는 픽스처 행 삭제분(자동 로드 픽스처 청크).

## 썸네일
- 버전 **8d7310f2 → 28c1813c**(21장, 가드 통과). 사유: 큐레이션 6장 SVG가 렌더 문서에서 그려지는데 ref-c/e/f sectionPlan 행 삭제로 렌더가 바뀜(생성 15장 변화 없음 — 해시 입력이 전체 집합이라 버전 1개로 갱신).

## 검증 (fresh)
- `npm run build` exit 0(typecheck 포함, 번들 표 위) · `npm run lint` exit 0 · `npx vitest run` exit 0 — **253 files / 2219 tests**.
- Ego Lite(preview 4337, 앱 안 클릭만·새로고침 0): ref-a 상세 Footer(`shots/1-ref-a-detail-footer.png`) · 동네 치과 3안 미리보기 hero "아픈 곳을 먼저 듣는 진료실"(`shots/2-dental-3an-preview-hero.png`) · 편집 시작 뒤 편집기 섹션 Header·Hero·**About 1개(이야기 + 이미지)**·Services·FAQ·Services·Contact·Footer, hero 같은 문구(`shots/3-dental-editor-about1-hero.png`). space finish({keep:[]}) → listTaskSpaces()=[] · 자기 서버 종료·4337 리슨 0. main 5480 무접촉.
- Codex review: **Developer 미실시**(재개 36/35 턴 한도 — 2회 연속 중단, Jarvis 마감). Jarvis가 같은 명령으로 실행 → JARVIS_FINAL에 결과 기록.

## 알려진 차이 · 열린 것
- ref-a 상세 9개 ≠ 목업 1a-02 8개(위 사유).

## 마감
- Developer 71/70 → 축소 재개 36/35(2회 연속 턴 한도) → 재실행 없이 Jarvis 마감. REPORT 본문은 재개 세션 작성분(미커밋 상태로 남은 것)을 Jarvis가 커밋.
