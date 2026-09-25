# V2-1 PROGRESS — 디자인 v2 토큰·DS 전환

브리프: `docs/06-handoff/V2-1_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/v2-1-tokens` (분기점 `c7efdf9`, 로컬 커밋만)
설계: `docs/design/v2/SPEC.md`(7절 Q1~Q6 추천안 채택) · ADR-002 개정 1 · ADR-004 · A11Y-01 SPEC · 기준선 테스트 **305개** 통과(35 파일), typecheck·lint 통과

## 단계 현황
| # | 항목 | 상태 |
|---|---|---|
| 0 | `/compare` 첫 화면 여유 확보(SPEC B-5) | 완료 — 여유 0.02 → 0.85KB |
| 1 | 토큰 교체(brand·colors·shape·typography·spacing·theme) | 진행 |
| 2 | Q4 컨트롤 3종 3:1 선 | 대기 |
| 3 | 원시 램프·accent 4종·primary-strong/heavy 삭제, Button·Tag·포커스 링 | 대기 |
| 4 | 테스트·가드 | 대기 |
| 5 | A11Y-01 사용처 교체 | 대기 |

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
