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
| 4 | `CompareBoardPage` (`/compare`, lazy) 상태 S-01~S-18 | 대기 | |
| 5 | 반응형 (≥1280 · 768~1279 · <768 아코디언) | 대기 | |
| 6 | 진입 경로 (트레이 → `/compare`, 레퍼런스 추가 → `/catalog`) | 대기 | |
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
