# FU-BLUR PROGRESS — 청크 로딩 전 blur 경계 (FIELD-UNDO Codex r2 P2-1)

- 브랜치 `k002bill2/fu-blur` · base `2ad7221` · 브리프 `BRIEF.md`
- 서브에이전트 분할: 불필요(브리프)

## 체크리스트

- [x] P0 PROGRESS 커밋
- [ ] `npm ci`(lock 변경 0) · 기준 예산 실측
- [ ] RED(청크 응답 전 첫 입력 → blur → 같은 칸 재입력 → 기록 1건) — 예측·결과 기록
- [ ] GREEN 구현(기록 2건) + 기존 FU-AC · FU-AC-13 회귀 0 · focusout 리스너 누적 0(P2-4)
- [ ] 예산 실측 — `/studio` 진입·복원 각각 ≤ +0.05
- [ ] 게이트 typecheck · lint · build exit 0 · 전체 vitest 1회
- [ ] Codex `review --scope branch --base 2ad7221` 최대 2라운드
- [ ] BACKLOG B-ER-08 행 "Codex r2 P2-1" 결과 표기
- [ ] REPORT.md(한국어) — Ego 생략 사유 포함

## 설계 메모

- 원인: 청크(docEngine) 전에는 `fieldTyped`가 아직 안 돌아 focusout 리스너가 없다 → 그사이 blur를 못 본다.
- 수정: 진입 `field()`가 묶음을 새로 열 때 focusout 표시 리스너(`o.cut = true`)를 달고, 그 입력의 청크 응답(then)에서 뗀다.
  입력마다 `o.cut`을 읽어 지우고 청크에 넘긴다 → `fieldTyped`가 `cut`이면 앞 묶음을 닫고 새로 연다(다른 칸과 같은 경로).

## 기록
