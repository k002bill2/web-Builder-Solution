# V2-1 PROGRESS — 디자인 v2 토큰·DS 전환

브리프: `docs/06-handoff/V2-1_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/v2-1-tokens` (분기점 `c7efdf9`, 로컬 커밋만)
설계: `docs/design/v2/SPEC.md`(7절 Q1~Q6 추천안 채택) · ADR-002 개정 1 · ADR-004 · A11Y-01 SPEC · 기준선 테스트 **305개** 통과(35 파일), typecheck·lint 통과

## 단계 현황
| # | 항목 | 상태 |
|---|---|---|
| 0 | `/compare` 첫 화면 여유 확보(SPEC B-5) | 완료 — 여유 0.02 → 0.85KB |
| 1 | 토큰 교체(brand·colors·shape·typography·spacing·theme) | 완료 |
| 2 | Q4 컨트롤 3종 3:1 선 | 완료 |
| 3 | 원시 램프·accent 4종·primary-strong/heavy 삭제, Button·Tag·포커스 링 | 완료 |
| 4 | 테스트·가드 | 완료 — 305 → **431** 통과 |
| 5 | A11Y-01 사용처 교체 | 완료 |

## 단계 0 — `/compare` 첫 화면 여유 확보

기준 빌드 manifest(L1): `/compare` 첫 화면 = 공통 `index` 88.96 + `CompareBoardPage` 9.48 + `_Select`(Select·TextField) 0.80 + `_referenceDisplay` 0.77 → **99.98KB / 100** (여유 0.02).

소스맵 바이트 귀속(`CompareBoardPage` 청크, 압축 전): useCompareBoard 5.3K · 페이지 5.0K · DraftPanel 3.6K · ComparisonTable 2.7K · Accordion 2.5K · **CustomStyleFields 1.8K** · ColumnHeader 1.7K · … SPEC이 예로 든 확정 오류 문구·경고 문구(`boardMessages`)는 **이미 엔진 청크**에 있어 후보가 아니었다.

옮긴 것: `CustomStyleFields`(+ 그것만 첫 화면에 끌고 오던 `Select`·`TextField`). 보드가 `ready`(= 엔진 로드 완료) 뒤에만 그려지므로 진입 직후에 필요 없다. `boardEngine`이 컴포넌트를 싣고, `useCompareBoard` → 페이지 → `DraftPanel`의 **선택 prop**으로 넘긴다(기존 `checkPrimaryColor`·`fonts`와 같은 경로). `DraftPanel`에는 타입 import만 남는다. 기존 테스트 수정 0.

| 라우트 | 전 첫 화면 / 진입 직후 | 후 첫 화면 / 진입 직후 |
|---|---|---|
| 공통 JS | 88.96 | 89.45 (`index` 86.12 + `jsx-runtime` 3.33) |
| `/catalog` | 97.98 / 100.36 | 98.55 / 100.94 |
| `/references/:id` | 95.64 / 98.02 | 96.19 / 98.57 |
| **`/compare`** | **99.98** / 120.64 | **99.15** / 121.52 |
| 자리표시 | 89.40 / 91.79 | 89.91 / 92.29 |

**부작용(L1)**: JSX 컴포넌트가 중첩 동적 청크(`boardEngine`)에 들어가자 rolldown 1.2.11이 React 코어(`react.production`·`jsx-runtime`, 8.77KB)를 엔트리에서 떼어 별도 공통 청크 `jsx-runtime-*.js`로 냈다 → 청크 경계 비용으로 공통 JS **+0.49KB**, 모든 라우트 +0.5KB 안팎. 실험 2회로 원인 범위를 좁혔다: (1) CustomStyleFields를 엔진이 아닌 별도 동적 import로 → 같은 분리, (2) 엔진 import를 엔트리 청크(`routes.tsx`)에서 호출 → 같은 분리. rolldown `chunkOptimization.mergeCommonChunks`가 "순환 청크 의존이 생기면 합치지 않는다"는 조건에 걸린 것으로 추정(L3). 번들러 청크 설정 변경은 전 라우트 청크 구성을 바꾸므로 이 단계에서 하지 않았다.
→ 순효과: `/compare` 여유 0.02 → **0.85KB**, `/catalog` 여유 2.02 → 1.45KB, 상세 4.36 → 3.81KB. 모두 예산(ADR-004) 안, 예산 변경 없음.

## 단계 1~5 — 토큰·DS 전환 (TDD)

### RED (현재 값으로 먼저 실행, `npx vitest --run`)
- 새·개정 테스트를 먼저 쓰고 기존 토큰·컴포넌트로 실행 → **108 failed | 323 passed (431)**, 5 파일 실패.
  - `tokens.test.ts` 66: v2 값 표(예: `--brand-primary expected '#3366ff' to be '#5a5fe8'`), 다크 별칭 재선언, 원시 램프 존재, 그림자·모션·max-width, 출처 주석.
  - `tokenContrast.test.ts` 33: 라이트 label-alternative·상태 글자(토큰 없음)·역상(토큰 없음)·Tag green/red/orange·포커스 링 1겹, 다크 on-primary 흰 글자 등. (`--surface-raised`가 없어 배경 집합 생성부터 실패하는 항목 포함)
  - `tokenUsage.test.ts` 5: assistive 글자 8곳, 접미사 없는 status 글자 3곳, 원시 색 유틸리티 5곳, 밝은 면 `secondary`(CatalogHero), 트레이 `opacity-70`.
  - `Button.test.tsx` 2(secondary 역상·assistive ghost), `DraftSummaryBar.test.tsx` 2(D-QA01·A11Y-AC-14).
### GREEN
- 토큰·theme·컴포넌트 교체 후 **431 passed (38 파일)**. 중간 실패 2건:
  - `CatalogPage.test.tsx`(6.3 V2-1 행 밖) 2건 — 트레이 개수 `<span>`을 없애 "0" 텍스트 노드를 못 찾음 → 테스트는 두고 span을 유지(원시 색 클래스만 `tabular-nums`로 교체). 설계 위반 아님(내 구현 실수).
  - 새 `DraftSummaryBar` 테스트가 primary 변형의 `disabled:` 쌍(이 버튼은 `aria-disabled`만 씀)까지 잡음 → `aria-disabled:` 상태만 보도록 좁힘.
- 6.3 목록의 `tokens.test.ts`(값·출처 정규식)·`brandIsolation.test.ts`(marker 끝 `/` 제거)만 개정. `Button.test.tsx` 기존 단언은 새 정의에서도 그대로 통과.

### 바뀐 것
- 토큰(기준 `c7efdf9` 대비, cssTokens로 계산): 라이트 값 변경 **52** · 다크 **56**, 추가 **11**(`--brand-primary-text`·`--primary-text`·`--inverse-*` 4·`--surface-raised`·`--status-*-text` 4), 삭제 **59**(원시 램프 49 · accent 4종 8 · `--primary-strong`/`-heavy` 2).
- theme.css: `primary-text`·`inverse-*` 4·`surface-raised`·`status-*-text` 4 연결, `common-100`·`cool-neutral-90`·`blue-70` 연결 삭제.
- Button `secondary` = 역상 변형(aria-disabled 쌍 포함), `assistive` = ghost. 새 변형 키 없음. 포커스 링 2중(brand.css, 다크 재선언).
- Q4: TextField·Select 테두리 `line-normal` → `line-strong`(3:1), hover `label-alternative`. Checkbox는 이미 `line-strong`.
- A11Y-01 사용처: assistive 8곳 → `label-alternative`, 상태 글자 3곳 → `*-text`(대표색 오류·저장 실패 alert·ScoreTile), 역상 자식(요약 바 "초안 보기" → `secondary`, 비활성 확정 역상 쌍, 트레이 칩 `bg-inverse-fill-normal`, opacity → `inverse-label-alternative`), 원시 색 5곳 → 의미 토큰.

### 목업·설계와 다르게 한 곳 (ADR-003)
- **C-12** 굵기 800 → 700, 캡션 12px 유지, opacity 글자 → 토큰(트레이).
- `CatalogHero` "추천 받기" `secondary` → `outline` — `secondary`가 역상 변형이 되면 밝은 면에서 흰 글자가 되므로(V2-AC-11 가드). SPEC 4.2와 같은 변형. 레이아웃 변경 없음.
- `ReferenceCard` "비교 중"도 상세와 같이 outline + `check`(V2-AC-11은 상세만 명시) — `assistive`가 ghost가 되면 경계가 사라져 V2-2 전까지 카드 버튼 모양이 흔들리므로 같은 규칙을 적용. 접근 이름·보이는 글자 그대로.
- 캡션·보조 글자·상태 글자가 v2 원값보다 짙음(Q3 적용 — 접근성 2순위 > 목업 4순위).
- 입력 테두리가 목업보다 진함(Q4).
