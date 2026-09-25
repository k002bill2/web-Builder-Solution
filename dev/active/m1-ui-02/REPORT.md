# M1-UI-02 최종 보고

브리프 `docs/06-handoff/M1-UI-02_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-02` (main에서 분기, 로컬 커밋만, push 없음) · 상세 기록은 `PROGRESS.md`

## 결론
작업 1·2·3 모두 끝났습니다. 검증 4종 통과(테스트 91 passed), Codex 리뷰 1라운드에서 지적 0건.
- 폰트는 번들 안의 Pretendard로 렌더됩니다. 브라우저 4xx 0건, 콘솔 오류 0건.
- 카탈로그 레일에 색상·디바이스 필터를 추가했습니다. URL에 남고 새로고침하면 복원됩니다.
- `/references/:id` 상세 화면은 1280·390 두 폭에서 확인했습니다.
- `design/`는 수정하지 않았습니다(`git diff main -- design/` 0줄).

## 작업별 완료 여부
| 작업 | 상태 | 커밋 |
|---|---|---|
| 1. 폰트 자체 호스팅 | 완료 | `18a0c52` |
| 2. 색상·디바이스 필터 (FR-CAT-01) | 완료 | `1f9eb6d` |
| 3. 1a-02 레퍼런스 상세 (FR-CAT-03) | 완료 | `08d8fa0` |
| 보고서 | 완료 | 이 파일이 들어간 커밋 |

### 1. 폰트 자체 호스팅
- `pretendard@1.3.9` 패키지의 `woff2-subset`에서 400·500·600·700 웨이트를 가져왔습니다.
  - 합계 1.07MB. variable 2.06MB, static 3.1MB보다 작습니다.
  - 코드에 쓰인 한글 392자가 서브셋에 모두 들어 있습니다.
- Pretendard JP는 뺐습니다. 같은 서브셋 형식이 없고, 전체 static은 8.3MB입니다.
- `local()`도 쓰지 않습니다. 로컬에 설치된 폰트가 404를 가렸던 문제를 막기 위해서입니다.
- 라이선스(OFL-1.1)는 `LICENSES.md`에 적었습니다.
- 빌드 산출물 `dist/assets`에 woff2 4개가 들어갑니다.
- 브라우저에서 4웨이트 모두 `loaded`, 폰트 요청은 전부 200입니다.

### 2. 색상·디바이스 필터
- 색 계열은 대표색(c1)의 HSL로 매번 계산합니다. 경계값은 `COLOR_FAMILY_RULES`에 두고 테스트로 고정했습니다.
  - 무채색: 채도 15% 미만, 또는 명도 8% 미만·95% 초과
  - 따뜻한 계열: 색상각 0~70° 또는 330~360°
  - 그린 계열: 70~170°
  - 차가운 계열: 170~330°
- `DesignReference.devices`를 추가하고 픽스처 6개에 임시값을 넣었습니다.
- 레일에서 모션 강도 다음에 기존 체크박스 그룹과 같은 방식으로 붙였습니다. URL 쿼리는 `color`, `device`입니다.

### 3. 레퍼런스 상세
- 화면 구성: 브레드크럼, 제목·라이선스·메타·태그, 자체 렌더 미리보기와 안내 문구, 탭 4개(`?tab=` 유지), 점수·액션 카드, 유사 레퍼런스 3그룹, 404 화면.
- 저장소
  - `get`을 `getById`로 이름을 바꿨습니다.
  - `getDetail`, `getSimilar`를 추가했습니다. `getSimilar`는 자기 자신·중복·비노출·없는 id를 빼고 그룹당 최대 6개를 돌려줍니다.
- 저장·비교는 카탈로그와 같은 Context를 씁니다. 6개 제한 안내는 상세 화면 안에 표시합니다.
- "템플릿으로 가져오기"는 다음 단계 안내만 합니다.
- 상세 화면에 있을 때 GNB의 '카탈로그'가 현재 위치로 표시됩니다.

## 변경 파일
main 대비 39개 파일, +1701 / −90.

**루트·문서**
- `LICENSES.md` (신규)
- `dev/active/m1-ui-02/PROGRESS.md`, `REPORT.md` (신규)

**작업 1**
- `app/src/assets/fonts/Pretendard-{Regular,Medium,SemiBold,Bold}.subset.woff2` (신규)
- `app/src/styles/tokens/fonts.css`
- `app/src/styles/fonts.test.ts` (신규)

**작업 2**
- `app/src/domain/colorFamily.ts`, `colorFamily.test.ts` (신규)
- `app/src/domain/reference.ts`
- `app/src/fixtures/references.ts`, `catalogFilters.ts`
- `app/src/features/catalog/catalogSearchParams.ts`
- `app/src/data/referenceRepository.ts`, `referenceRepository.test.ts`
- `app/src/components/catalog/FilterRail.tsx`
- `app/src/pages/CatalogPage.test.tsx`

**작업 3 — 신규**
- 도메인·데이터: `app/src/domain/referenceDetail.ts`, `app/src/fixtures/referenceDetails.ts`
- 기능: `app/src/features/detail/{detailTabs,useReferenceDetail}.ts`
- 화면: `app/src/pages/ReferenceDetailPage.tsx`, `ReferenceDetailPage.test.tsx`
- 컴포넌트: `app/src/components/detail/{ReferencePreview,DetailPanels,DetailSidebar}.tsx`
- 공용 조각: `app/src/components/catalog/referenceDisplay.ts`
- 아이콘: `app/src/assets/icons/chevron-left.svg` (design/에서 복사)

**작업 3 — 수정**
- DS: `components/ds/Tag.tsx`(outline 변형), `components/ds/Icon.tsx`
- 화면·레이아웃: `components/catalog/ReferenceCard.tsx`(공용 조각 import만), `components/layout/AppHeader.tsx`, `app/routes.tsx`, `pages/CatalogPage.tsx`(안내 문구 상수 공유)
- 데이터·배선: `features/compare/{compareTray,useTrayReferences}.ts`, `main.tsx`, `test/renderApp.tsx`

## RED / GREEN 요약
| 작업 | RED | GREEN |
|---|---|---|
| 1 | 3 failed / 5 (원격 URL 8건, 파일 없음, 첫 글꼴 "Pretendard JP") | styles 11 passed |
| 2 | 모듈 없음 + 5 failed / 33 (필터 무시로 6개 반환, 체크박스 없음, 레일 순서) | 75 passed |
| 3 | 19 failed / 91 (`getById`·`getDetail`·`getSimilar` 없음, 상세 제목·404 없음, GNB 비활성) | 91 passed |

- 작업 3에서는 규칙이 실제로 테스트에 걸리는지 확인했습니다. 자기 제외 필터를 지우면 3건, 6개 상한을 지우면 1건이 실패하고, 되돌리면 통과합니다.
- 의도적으로 바꾼 기존 테스트
  - 라우팅 표의 "`/references/ref-a`는 자리표시 페이지" 행을 지웠습니다. 이제 실제 상세 화면입니다.
  - 저장소 테스트의 `get` 호출을 `getById`로 바꿨습니다.
- 작업 2 첫 전체 실행에서 카탈로그 첫 테스트가 5초 타임아웃(6.7초)으로 1회 실패했습니다. 바로 3회 다시 돌렸을 때 모두 통과했습니다(3.4~3.9초). 콜드 스타트 지연으로 판단했습니다.

## 검증 4종 (마지막 fresh 실행)
```
typecheck exit=0
lint exit=0
 Test Files  11 passed (11)
      Tests  91 passed (91)
test exit=0
✓ built in 386ms
build exit=0
```

브라우저 확인(ego-browser, `vite preview`)
- 카탈로그: 폰트 4개 모두 `loaded`, 4xx 0건, 콘솔 오류 0건.
- 상세 1280: 넘치는 요소 0, 본문 852 + 사이드 340.
- 상세 390: 넘치는 요소 0, 1열로 쌓임.
- 카드 → 상세 → 토큰 탭 이동: 오류 0건.

## Codex 라운드 결과
| 라운드 | 범위 | 결과 |
|---|---|---|
| 1 | `review --scope branch --base main` | "No actionable correctness issues were found in the diff." |

- Codex 샌드박스가 읽기 전용이라 Codex 쪽에서는 vitest를 실행하지 못했습니다. 테스트 통과 근거는 위의 fresh 실행입니다.
- 지적이 0건이라 규칙(최대 3라운드, 남은 지적이 P2 이하면 중단)에 따라 1라운드에서 끝냈습니다.

## 목업과 다른 부분
1. **폰트**
   - 목업의 `"Pretendard JP"` 우선 체인 대신 `"Pretendard"` 한 가지를 씁니다. 그 뒤 시스템 폴백은 그대로입니다.
   - 서브셋이라 KS X 1001 밖의 드문 한글은 글자 단위로 시스템 글꼴로 그려집니다.
2. **색상·디바이스 필터 그룹**은 목업에 없습니다. 기존 그룹과 같은 형태로 레일 맨 아래에 붙였습니다. 칩 색 견본은 넣지 않았습니다(선택 항목, DS Checkbox 변경 필요).
3. **상세 탭은 패널 전환 방식입니다.** 목업 그림은 '섹션 구성' 탭에서 섹션·토큰·모바일 블록이 모두 보이지만, 구현은 선택한 탭의 내용만 보여줍니다.
4. **'점수 이력' 탭**: 목업에는 탭 이름만 있습니다. 현재 측정 1건을 표로 보여주고 "이전 측정 기록이 없습니다"를 표시합니다.
5. **A의 '유사 레이아웃'**: 목업에는 D·F·A 세 개지만, 자기 제외 규칙 때문에 D·F 두 개입니다.
6. **팔레트 견본**: 목업은 4칸(primary·surface·ink·bg)이고, 구현은 `renderVals().palette` 5역할(muted 포함) 5칸입니다.
7. **태그**
   - 콘셉트 태그 색은 목업처럼 첫째 blue, 둘째 orange로 순서대로 칠합니다.
   - 목적이 여럿이면 "…유도" outline 태그가 여러 개 나옵니다(C: 예약·문의).
8. **점수 색**: Lighthouse 구간을 따릅니다(90 이상 초록, 50 이상 주황, 그 아래 빨강). D(89·84)는 주황입니다.
9. **저장 버튼**: 목업의 정적 outline 대신 `aria-pressed` 토글이고, 저장하면 아이콘이 `bookmark-fill`로 바뀝니다. 비교 버튼은 카드와 같이 "비교 중"(assistive)으로 바뀝니다.
10. **안내 문구**: 7번째 비교 추가 거부와 템플릿 안내는 상세 화면에 트레이 바가 없어서 점수 카드 안 `role=status` 줄에 표시합니다.
11. **탭 전환은 URL `replace`**라서 뒤로 가기가 탭을 되감지 않습니다. 이동은 기본 탭(섹션 구성)으로 엽니다.
12. **Logo 자리는 `BrandMark`** 입니다(ADR-002). 1a-01과 같습니다.

## 질문
1. **B~F 상세 데이터는 임시값입니다.** 섹션 구성, 팔레트 muted, 본문 대비, 타깃 표기, 제작 출처, 모바일 구조, 유사 id 목록이 해당합니다. 목업에는 A의 상세만 있습니다. 실제 값은 누가 확정하나요?
2. **유사 추천 계산 규칙.** 지금은 id별로 고른 목록에 저장소 규칙만 적용합니다. 픽스처 6개는 콘셉트 태그·레이아웃이 서로 하나도 겹치지 않아, 규칙으로 계산하면 두 그룹이 비어 버립니다. 백엔드(T-API-CAT-04)의 산출 규칙을 정해야 합니다.
3. **`devices`와 `responsive` 필드가 겹칩니다.** 카드의 "반응형 지원"은 `responsive` 불리언을 쓰고, 필터는 `devices`를 씁니다. 6개 모두 `responsive`를 넣어 모순은 없지만, 하나로 합칠지 정해야 합니다(TRD 4.1 확정 시).
4. **색 계열 경계값**(채도 15%, 명도 8%/95%, 색상각 70°/170°/330°)은 제가 정한 값입니다. D(#00A884, 167°)가 그린/차가운 경계 근처에 있습니다. 디자인 쪽 확인이 필요합니다.
5. **상세 탭 해석.** 목업처럼 기본 탭에서 세 블록을 한꺼번에 보여줘야 한다면 알려 주세요. 탭을 앵커 이동으로 바꾸면 됩니다.
6. **상세 화면의 스크롤 위치.** 유사 레퍼런스로 이동해도 스크롤이 맨 위로 가지 않습니다(라우터 `ScrollRestoration` 미적용). 1a-01부터 있던 동작이라 이번에는 건드리지 않았습니다. 다음 handoff에 넣을까요?

## 커밋 해시
- `18a0c52` fix: Pretendard 폰트 자체 호스팅 (CDN 404 제거)
- `1f9eb6d` feat: 카탈로그 색상 계열·디바이스 필터 추가 (FR-CAT-01)
- `08d8fa0` feat: 1a-02 레퍼런스 상세 화면 (/references/:id, FR-CAT-03)
- 보고서 커밋: 이 파일이 들어간 커밋 (`git log -1 -- dev/active/m1-ui-02/REPORT.md`)
