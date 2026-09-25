# M1-UI-03a PROGRESS

브리프: `docs/06-handoff/M1-UI-03a_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/m1-ui-03a` (main에서 분기, 로컬 커밋만)
설계: `docs/design/1a-03/SPEC.md` · 결정: ADR-003·004·005 · 기준선 테스트 115개 통과

## 단계 현황
| # | 항목 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 읽기(브리프 0절 순서) + `npm ci` + 기준선(테스트 115·build 통과) | 완료 | — |
| 10 | ADR-004 번들 검사: 라우트별 첫 화면 합계 ≤ 100KB | 진행 중 | |
| 1 | 타입 `domain/compareBoard.ts` | 대기 | |
| 2 | 행 정의·셀 값 (섹션 라이브러리·비교 픽스처) | 대기 | |
| 3 | 선택 규칙 P-1~P-7 | 대기 | |
| 5 | `contrast.ts` + `derivePalette` | 대기 | |
| 4 | `buildProfileDraft` | 대기 | |
| 6 | R-12 Footer 경고 데이터 | 대기 | |
| 7 | 사용자 대표색(zod)·폰트 허용 목록 | 대기 | |
| 8 | `compareBoardRepository` 메모리 구현 + 저장 직렬화 | 대기 | |
| 9 | 트레이 통합 | 대기 | |

작업 순서는 의존 관계 기준(10 → 1·2 → 3 → 5 → 4 → 6·7 → 8 → 9).
