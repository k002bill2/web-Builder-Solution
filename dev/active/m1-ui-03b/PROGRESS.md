# M1-UI-03b PROGRESS

브리프: `docs/06-handoff/M1-UI-03b_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-03b` (03a가 합쳐진 main에서 분기, 로컬 커밋만)
설계: `docs/design/1a-03/SPEC.md` · 결정: ADR-003·004·005(D1-갱신·D2·D3) · 기준선 테스트 **236개** 통과(29 파일)

## 단계 현황
| # | 항목 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(0절 순서) + 기준선 236 통과 | 완료 | — |
| 1 | DS `Callout` + 아이콘 5종 복사 | 완료 | (1 커밋) |
| 2 | `PickButton`·`ColumnHeader`·`ComparisonTable` + 가로 전용 roving | 완료 | (2 커밋) |
| 3 | `DraftPanel`·`DraftItem`·`CustomStyleFields` + 폰트 3종 활성 | 대기 | |
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
