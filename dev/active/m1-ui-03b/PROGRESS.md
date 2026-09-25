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
| 5 | 반응형 (≥1280 · 768~1279 · <768 아코디언) | 대기 | |
| 6 | 진입 경로 (트레이 → `/compare`, 레퍼런스 추가 → `/catalog`) | 완료(테스트 추가) | (4 커밋) |
| 7 | `addToTray`·`removeFromTray` 정리 판단 | 대기 | |

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
