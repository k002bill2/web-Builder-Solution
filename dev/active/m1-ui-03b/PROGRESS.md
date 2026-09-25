# M1-UI-03b PROGRESS

브리프: `docs/06-handoff/M1-UI-03b_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-03b` (03a가 합쳐진 main에서 분기, 로컬 커밋만)
설계: `docs/design/1a-03/SPEC.md` · 결정: ADR-003·004·005(D1-갱신·D2·D3) · 기준선 테스트 **236개** 통과(29 파일)

## 단계 현황
| # | 항목 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(0절 순서) + 기준선 236 통과 | 완료 | — |
| 1 | DS `Callout` + 아이콘 5종 복사 | 완료 | (1 커밋) |
| 2 | `PickButton`·`ColumnHeader`·`ComparisonTable` + 가로 전용 roving | 대기 | |
| 3 | `DraftPanel`·`DraftItem`·`CustomStyleFields` + 폰트 3종 활성 | 대기 | |
| 4 | `CompareBoardPage` (`/compare`, lazy) 상태 S-01~S-18 | 대기 | |
| 5 | 반응형 (≥1280 · 768~1279 · <768 아코디언) | 대기 | |
| 6 | 진입 경로 (트레이 → `/compare`, 레퍼런스 추가 → `/catalog`) | 대기 | |
| 7 | `addToTray`·`removeFromTray` 정리 판단 | 대기 | |

## 단계 1 — Callout + 아이콘
- 아이콘 `check`·`circle-check`·`warning`·`circle-info`·`chevron-down`을 `design/claude-design-handoff/project/assets/icons/`에서 `app/src/assets/icons/`로 복사만 함(`design/` 변경 없음).
- RED: `Callout.test.tsx` → `Failed to resolve import "./Callout"` (1 file failed)
- GREEN: 4 passed. tone별 배경 `--status-*-bg`·아이콘 `--status-*`, 제목 `h3`, role 없음(A-9).
