# M2B-5 SPEC (Designer) — REPORT

## 요약
- 산출: `docs/design/m2b/SPEC-COMPARE3.md`(0~10절) · `docs/design/m2b/MQ-M2B5.md`(4건, ★안 기준) · 이 폴더 PROGRESS·REPORT. 앱 코드·package*.json·CLAUDE.md·`docs/decisions/` 변경 0.
- 추천: `/profile` 3안 영역 "3안 실제 화면으로 비교" 버튼 → 전체 폭 모달 `dialog`(≥1280 3열 · <1280 1안씩), 미리보기는 `inert` 비대화형, 변환은 `writeStartDoc` 순수 사용(저장소 쓰기 0), 와이어프레임 유지.
- 예산: 첫 화면 +0 원칙. 비교 본문은 조작 뒤 청크. 멈춤선 표 SPEC 6.2.

## 커밋
| 커밋 | 내용 |
|---|---|
| `14ed7a6` | P0 BRIEF 명시 커밋 |
| `d49386d` | SPEC·MQ 초안 + PROGRESS |
| `9b0481c` | Codex R1 반영 |
| `0d111fe` | Codex R2 반영 |
| (이 커밋) | REPORT·PROGRESS 마감 |

## L1 실측 (2026-10-05, 이 worktree)
- `npm ci`(추적 파일 변경 0 — `git status` 확인) → `npm run build` exit 0.
- `/profile` 첫 화면 99.61/100 · 진입 118.67/125 · `/catalog` 99.66 · `/studio/:projectId` 진입 127.34/128 · 렌더 JS 83.03/90 · CSS 8.75/30 — BRIEF 수치와 일치.
- manifest closure: `CandidateResults` +2.44 · `memoryDocBook`(writeStartDoc 포함) +18.69.

## 발견 (BRIEF에 없던 것)
1. **G1 예산 분류 공백**: 잡이 있는 채 `/profile`에 들어오면 `CandidateResults`(+2.44)를 effect가 자동으로 받지만 `/profile` 시나리오 auto에 없다 → 실제 진입 ≈121.11(여유 ≈3.89, 125 이내). SPEC 7.4 S0에서 시나리오 신설.
2. **제목 비율 축 미전달**: `axes.typeScale`은 PageDoc·KitTokenInput 어디에도 가지 않는다 → 편집 시작 뒤 B·C안도 프로필 비율. MQ-M2B5-2.
3. `CANDIDATE_TEXT.preview`("실제 페이지는 생성기 연결 후(M2)…")는 이 기능 뒤 사실과 달라진다 → 문장 교체(SPEC 2.4).

## Codex 검토
실행: `node codex-companion.mjs adversarial-review --scope branch --base 292e7b6` (Codex 1.0.6), 두 라운드 모두 실제 완료(exit 0).
- **R1 (`d49386d` 대상) — needs-attention**: 예산 수치·순수 변환·sandbox·G1 설명에는 결함 없음.
  1. [P1] 기존 편집 문서가 있으면(`DOC_EXISTS`) 편집 시작이 기존 문서를 열어 "미리보기 = 편집 결과"가 깨짐 → 반영: 동일성은 새 문서에만, 안내 문장(SPEC 2.4) · U12 · QB5.
  2. [P2] 종결 집계가 failed 열·1안씩 모드에서 끝나지 않음 → 반영(3.4 · U7).
  3. [P2] 모달 중 선택 실패/성공 알림이 inert인 바깥 영역에만 감 → 반영: 대화상자 안 alert/status(2.5 · U8 · B6).
- **R2 (`9b0481c` 대상) — needs-attention**: R1의 1·3은 해결로 판정. [P2] 1건이 남음: 시간 초과·생성 실패를 "그렸습니다/구조 미리보기"로 잘못 안내하고, 복구 규칙이 없음 → 반영: 3.4 상태별 범주·문장·복구 규칙 · U7 사례(`0d111fe`).
- R3는 돌리지 않음: BRIEF 권장이 1~2라운드이고, 마지막 지적은 P2 1건이며 그대로 반영함. `0d111fe` 반영분은 Codex 검토를 받지 않았음.

## 목업과 다르게 한 부분
- 목업에 3안 실렌더 비교 화면 없음 — 와이어프레임 카드 유지 + 요청 시 대화상자(예산·거짓 미리보기 금지).
- 대화상자 열에서 "이 안 선택" 버튼을 프레임 위에 둔다(프레임 높이 수천 px — 기능 우선).

## 사용자 결정 필요
- MQ-M2B5-1~4 (★ 일괄 승인 시 SPEC 본문 수정 0).
