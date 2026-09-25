# M1-UI-03b PROGRESS

브리프: `docs/06-handoff/M1-UI-03b_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-03b` (03a가 합쳐진 main에서 분기, 로컬 커밋만)
설계: `docs/design/1a-03/SPEC.md` · 결정: ADR-003·004·005(D1-갱신·D2·D3) · 기준선 테스트 **236개** 통과(29 파일)

## 단계 현황
| # | 항목 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(0절 순서) + 기준선 236 통과 | 완료 | — |
| 1 | DS `Callout` + 아이콘 5종 복사 | 완료 | (1 커밋) |
| 2 | `PickButton`·`ColumnHeader`·`ComparisonTable` + 가로 전용 roving | 완료 | (2 커밋) |
| 3 | `DraftPanel`·`DraftItem`·`CustomStyleFields` + 폰트 3종 활성 | 완료 | (3 커밋) |
| 4 | `CompareBoardPage` (`/compare`, lazy) 상태 S-01~S-18 | 완료 | (4 커밋) |
| 5 | 반응형 (≥1280 · 768~1279 · <768 아코디언) | 완료 | (5 커밋) |
| 6 | 진입 경로 (트레이 → `/compare`, 레퍼런스 추가 → `/catalog`) | 완료(테스트 추가) | (4 커밋) |
| 7 | `addToTray`·`removeFromTray` 정리 판단 | 유지(REPORT 사유) | — |

## 단계 1 — Callout + 아이콘
- 아이콘 `check`·`circle-check`·`warning`·`circle-info`·`chevron-down`을 `design/claude-design-handoff/project/assets/icons/`에서 `app/src/assets/icons/`로 복사만 함(`design/` 변경 없음).
- RED: `Callout.test.tsx` → `Failed to resolve import "./Callout"` (1 file failed)
- GREEN: 4 passed. tone별 배경 `--status-*-bg`·아이콘 `--status-*`, 제목 `h3`, role 없음(A-9).

## 단계 2 — 표·열 머리글·선택 버튼
- 화면 모델 `features/compare/boardView.ts`(`buildBoardView`): 03a `COMPARISON_ROWS`·`isRowUniform`·결과 상태만 조합. 선택 가능 = 2열 이상(S-04) + 사용 가능 열 + 바인딩 있음.
- `rovingFocus.ts#rovingRowTargetIndex` 추가(↑/↓ 무시). `ComparisonTable`은 행마다 roving tabindex, 행을 떠나면 진입점이 선택된 버튼으로 복귀(Shift+Tab이 같은 행 A로 가지 않게).
- 스크롤 컨테이너 `role=region` + `aria-label="비교 표 (가로로 스크롤)"`, 3열 이상이면 `tabIndex=0`(768~1279는 3열부터 스크롤, SPEC 5.2). 행 머리글 `sticky left-0`.
- RED: `rovingFocus.test.ts` 2 failed(`rovingRowTargetIndex is not a function`), `ComparisonTable.test.tsx` import 실패.
- 중간 실패: AC-19 테스트가 Tab 진입점을 마지막 "빼기"로 잡아 C열 "전부 선택"에 멈춤 → 진입점을 마지막 "전부 선택"으로 고침(A-6 Tab 순서대로가 맞음).
- GREEN: 10 passed(roving 2 + 표 8). typecheck·lint·가드 통과.

## 단계 3 — 초안 패널·사용자 스타일·폰트
- `domain/fonts.ts`: ADR-005 D1-갱신에 따라 3종 모두 활성. `isAllowedFontFamily` 추가(사용자 입력과 레퍼런스 폰트 행이 같은 기준).
- D1(최소 확장): `comparisonCells#fontCell` — 허용 목록 밖 폰트 셀은 `binding: null` + `unavailableReason: "license"` + 라벨 끝 "· 라이선스 확인 중". AC-26과 같은 경로라 `togglePick`·`pickAllFrom`·저장소 `assertPicks`·확정이 모두 같은 판정을 쓴다.
- `profileDraft#itemOf`(최소 수정): Hero가 있는데 기준 레퍼런스에도 값이 없는 행이 "Hero를 먼저 고르세요"로 보이던 문제 → 폰트는 확정 값과 같은 "Pretendard 700 / 400", 그 외는 "없음" + 출처 `fallback`.
- `features/compare/draftView.ts`: D2 Footer 미리 알림(셀 `hasBusinessInfo === false` + 라이브러리 `businessInfoVariant`가 있을 때만 — 확정 교체 조건과 같음), 팔레트 견본, 상태 태그·확정 버튼 문구.
- `CustomStyleFields`: 입력은 로컬 상태, blur/Enter에 zod(`parseCustomStyle`) 검사. 밖에서 대표색이 바뀌면(보정값 쓰기·되돌리기·비우기) 입력란을 맞춘다.
- `DraftPanel`: 알림 영역 `role=status` + 이름 "선택 알림"(A-4), 확정 `aria-disabled` + `aria-describedby` 이유(A-8), 확정 중 `aria-busy`(S-13), 되돌리기 포커스(S-17), 확정 실패 안내만 `role=alert`(A-9).
- RED: `boardInput`(3종 활성 2건)·`comparisonCells`(D1)·`profileDraft`(폰트 기본값) 4 failed, `DraftPanel.test.tsx` import 실패.
- 중간 실패: AC-11 화면 테스트가 모션 "높음"이 없는 A·B·C로 구성 → 모션 높음인 D를 추가. lint `react-hooks/refs`(props 객체에 ref) → 구조 분해로 수정.
- GREEN: 컴포넌트·도메인·가드 130 passed, typecheck·lint 통과.

## 단계 4 — `/compare` 화면
- 연결: `useCompareBoard`(features/compare) = 트레이 컨텍스트의 저장소 → `getBoard`·`getComparison` → `togglePick`·`pickAllFrom` → `picksSaver.save` → `buildProfileDraft`·`evaluateBoardWarnings`·`confirmAvailability`. 새 도메인 규칙 없음.
- 트레이 컨텍스트 최소 확장(REPORT 기록): `repository`·`loaded`·`sync(board)`·`takeReleasedNotices()`.
  - 이유 ①: 메모리 `getBoard()`는 자동 해제 안내(`released`)를 한 번만 준다 — 트레이의 진입 조회가 먼저 받아 버리면 화면이 AC-15 안내를 잃는다 → 컨텍스트가 보관, 화면이 한 번 꺼냄.
  - 이유 ②: 카탈로그에서 뺀 열의 안내(SPEC 1.3)도 `removeReference` 서버 응답으로 보관 → **S-08 결정: 돌아왔을 때 한 번 보여 준다**(SPEC 1.3 그대로. 트레이의 낙관적 선택은 최신이 아닐 수 있어 서버 응답 사용).
  - 이유 ③: 화면 저장 결과를 트레이 보드에 반영(`sync`, revision이 같거나 새로울 때만) — 카탈로그 트레이의 낙관적 빼기가 옛 선택으로 계산하지 않게.
- 열 빼기: 앞 저장이 끝난 뒤 `removeReference`, 그 응답 revision으로 saver를 새로 만든다(그러지 않으면 다음 선택이 STALE_BOARD로 조용히 버려짐 — AC-08 회귀 테스트 "다음 선택도 저장된다"). 알림 문장은 화면의 최신 선택으로 `removeColumn().released.notice`.
- 확정: saver가 확인한 revision으로만, 연타는 ref 잠금(AC-17). v1 이후는 `createProfileVersion(profileId, revision)`을 직접 호출(AC-25).
- RED: `CompareBoardPage.test.tsx` 29 failed / 1 passed(자리표시 페이지; 통과 1건은 이미 있던 트레이 → `/compare` 이동).
- 중간 실패 ①: 되돌리기 문구가 알림 영역에도 있어 `getByText` 중복 → 알림 영역 제외 쿼리. ② `toHaveValue(expect.stringMatching)` 미지원 → value 정규식. ③ S-02 테스트: 트레이 진입 조회 + 재동기화가 먼저 `getBoard`를 2번 부름 → 거부 3회로.
- **기존 테스트 변경 1건(의도)**: `CatalogPage.test.tsx` "자리표시 페이지" each의 `/compare` 항목 → `/profile/profile-1`(확정 후 이동하는 자리표시). `/compare`가 실제 화면이 됐기 때문. 테스트 수는 그대로.
- 번들(ADR-004) — 첫 빌드 `/compare` 114.04KB로 실패:
  1. 새 아이콘 5종이 data URI로 인라인돼 `Icon`의 eager glob을 타고 **공통 청크**에 들어감(공통 88.46 → 90.09, `/catalog` 99.02) → `vite.config.ts` `assetsInlineLimit` 함수형으로 **새 5종만** 인라인 제외(기존 8종은 그대로). 공통 88.92.
  2. 도메인 엔진(선택 규칙·초안·대비·zod·saver)을 `features/compare/boardEngine.ts`로 묶어 **데이터와 함께 동적 로드**(메모리 저장소 청크가 이미 같은 모듈을 정적으로 씀). 대표색 검사는 `checkPrimaryColor` prop.
  - 결과: `/compare` **99.66KB**(정적) · 진입 직후 자동 로드 포함 참고 **119.30KB**(스크립트 참고 출력에 엔진·저장소·비교 픽스처 추가). 공통 88.96 · `/catalog` 97.98(기준 96.67, +1.31) · `/references/:id` 95.64(기준 94.82, +0.82).
  - 카탈로그·상세 증가분: 공통 +0.50(트레이 컨텍스트 확장) + Rolldown이 `Tag`·`Select`·`catalogFilters`를 공유 청크로 나눈 청크 오버헤드. REPORT 질문으로 남김.
- GREEN: 34 files · 298 passed, typecheck·lint·build 통과.

## 단계 5 — 반응형
- `useViewport`(matchMedia `48rem`·`80rem`, useSyncExternalStore): 표·아코디언을 CSS로 숨기지 않고 **하나만 렌더** — 둘 다 그리면 선택 버튼이 두 벌 생겨 Tab·보조기기에 중복. matchMedia가 없으면(jsdom) 넓은 화면.
- ≥1280: 표 + sticky 패널(`max-h` 화면 높이 − 여백, 넘치면 패널만 스크롤 — 확정 버튼이 화면 밖으로 밀리지 않게). 768~1279: 표 + 패널 아래 + 하단 `DraftSummaryBar`("초안 N/10 · 경고 N", 초안 보기 → 패널 제목 포커스, 확정은 같은 aria-disabled+이유). <768: `ComparisonAccordion`(h3 > button[aria-expanded][aria-controls], region+aria-labelledby, 처음엔 Hero만, 접힌 머리글에 "B 선택됨/선택 안 함/비교 정보", 열 목록은 가로 스크롤 목록 + 각 열 빼기·전부 선택).
- RED: `CompareBoardResponsive.test.tsx` 6 failed / 1 passed(≥1280 요약 바 없음은 원래 없음).
- 중간 실패: 아코디언 머리글 이름이 선택 버튼 이름("Hero 구성: …")과 같은 접두어라 쿼리 중복 → 머리글 쿼리를 "Hero 구성 ·"로.
- 번들: 아코디언을 lazy로 두면 Rolldown이 `jsx-runtime`을 별도 청크로 떼어 **공통이 88.96 → 89.45**(모든 라우트 +0.5)가 됨 → 정적 import로 되돌림. 대신 알림 문구·확정 오류 방침(`boardMessages.ts`)·`confirmGate`·`FONT_OPTIONS`를 엔진 경유로 옮김.
  - 결과: 공통 88.94 · `/catalog` 97.96 · `/references/:id` 95.62 · **`/compare` 99.84KB**(여유 0.16KB) · 자동 로드 포함 참고 120.41KB.
- GREEN: 35 files · 305 passed, typecheck·lint·build 통과.

## Codex R1 · REPORT
- R1 P1 1 · P2 2 반영(5297948). 회귀 테스트·R2는 턴 한도로 미실행 — REPORT 참조.
- 브라우저 확인: screens/ 3장, 서버 종료 확인.

## 보완 FIX-R1 (FIX-R1_BRIEF.md · 2026-09-26)
- [x] 1. Codex R1 회귀 테스트 3건(`CompareBoardPage.test.tsx` "Codex R1 회귀") — 수정 한 줄씩 되돌려 RED 확인 후 `git checkout`으로 원복·GREEN. 305 → 308.
  - P1 `latestConfirm` → `void confirm()`: `expected "confirmProfile" to be called 1 times, but got 2 times`
  - P2 `whenIdle().then(getBoard)` → `getBoard()`: `Unable to find role="table" and name "레퍼런스 4개, 비교 항목 12개"`
  - P2 STALE 기준 → 항상 로컬 선택: `toHaveAttribute("aria-pressed", "true")` 실패(Hero=C 선택이 사라짐)
- [x] 2. 번들 검사: 진입 직후 자동 로드 포함 합계 ≤ 125KB를 실패 조건으로(`ROUTE_EAGER_BUDGET_KB`), ADR-004 표에 개정 행 1줄.
  - RED(한도 120 임시): `[bundle] 예산 검사 실패 — /compare: 진입 직후 자동 로드 포함 120.51KB > 120KB` · exit 1 → 125 원복 exit 0.
  - 현재: `/compare` 첫 화면 99.93KB / 100 · 진입 직후 120.51KB / 125. `/catalog` 97.98 / 100.36 · `/references/:id` 95.64 / 98.02 · 자리표시 89.40 / 91.79.
