# FU-BLUR PROGRESS — 청크 로딩 전 blur 경계 (FIELD-UNDO Codex r2 P2-1)

- 브랜치 `k002bill2/fu-blur` · base `2ad7221` · 브리프 `BRIEF.md`
- 서브에이전트 분할: 불필요(브리프)

## 체크리스트

- [x] P0 PROGRESS 커밋
- [x] `npm ci`(lock 변경 0) · 기준 예산 실측 — `/studio` 129.57 · 복원 132.60 · docEngine +3.83
- [x] RED(청크 응답 전 첫 입력 → blur → 같은 칸 재입력 → 기록 1건) — 예측 "첫 실행 취소가 시작 문서로" · 결과 `expected '한 문장으로 소개하는 제목' to be '하나'` 1 failed
- [x] GREEN 구현(기록 2건) `53f4864` + r1 반영 `8a9e409` — 기존 FU-AC · FU-AC-13 회귀 0 · focusout 리스너 누적 0(P2-4 · 새 it 2)
- [x] 예산 실측 — BLOCKED: 최종 `/studio` 129.63(+0.06) · 복원 132.67(+0.07) 몫 초과(판정선 안) · 감량 1회 뒤 멈춤 — 영환님 결정(REPORT 0절)
- [x] 게이트 typecheck · lint · build exit 0 · 전체 vitest 300 files / 2705
- [x] Codex `review --scope branch --base 2ad7221` — r1 P2 1 반영 · r2 0
- [x] BACKLOG B-ER-08 행 "Codex r2 P2-1" 결과 표기
- [x] REPORT.md(한국어) — Ego 생략 사유 포함

## 설계 메모

- 원인: 청크(docEngine) 전에는 `fieldTyped`가 아직 안 돌아 focusout 리스너가 없다 → 그사이 blur를 못 본다.
- 수정: 진입 `field()`가 묶음을 새로 열 때 focusout 표시 리스너(`o.cut = true`)를 달고, 그 입력의 청크 응답(then)에서 뗀다.
  입력마다 `o.cut`을 읽어 지우고 청크에 넘긴다 → `fieldTyped`가 `cut`이면 앞 묶음을 닫고 새로 연다(다른 칸과 같은 경로).

## 기록

- 예산 이력: GREEN `53f4864` 129.62/132.65(+0.05 · 몫 꽉 참) → r1 수정 `.finally(off)` 129.65/132.69(복원 판정선 초과, build 실패) → 감량 1회(해제를 묶음 off로 · 청크가 on 표시로 교체) 129.63/132.67(build 0 · 몫 +0.01/+0.02 초과) → 멈춤.
