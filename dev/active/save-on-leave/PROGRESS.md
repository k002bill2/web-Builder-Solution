# SAVE-ON-LEAVE PROGRESS — B-RS-01 편집기 이탈 저장 미보장

- base main `2ad7221` · 브랜치 `k002bill2/save-on-leave`

## 체크리스트
- [x] `npm ci` (lock 변경 0)
- [x] 현황 파악 (StudioLayout 이탈 · 스케줄러 · useDocSave) — data router 아님(`useBlocker` 불가) → 기존 클릭 캡처 확장
- [x] RED 테스트 (예측 · 결과 기록) — `StudioLeave.test.tsx` 7건
- [x] GREEN 구현 (이탈 시 flush 대기 · 실패 시 이동 보류 · 저장 중 추가 편집 flush) — 7/7 + 관련 64건 통과
- [x] 추가 테스트: 실패 주입 이동 보류·안내 / 성공 이동 1회 / 연타 1회 / 읽기 전용 탭 이동 허용
- [x] 예산 실측 (`/studio` 진입·복원 각 ≤ +0.15) — 기준선 129.77 · 132.80(+0.15). ⚠ 최종 실측 129.79 · 132.83 = 몫 +0.02·+0.03 초과(감량 1회 뒤 멈춤 — REPORT 0절 결정 필요)
- [x] typecheck · lint · build · 전체 vitest — 0·0·0 · 301 파일 2711건 통과 (1차 전체 실행에서 ExportFlow 1건 실패 → `retry()` 반환값을 effect가 return한 회귀, 수정)
- [x] Ego Lite 3회 + 캡처 + 정리 — 3/3 유지 · shots/sol-reopen-1280.png 151,753B · IDB deleted · listTaskSpaces [] · 4361 LISTEN 0
- [x] Codex review r1 (P1 1·P2 2 반영 `5d6ff9e`) · r2 (P1 1·P2 1 반영 `7db2c0b`) — 상한 2라운드
- [x] BACKLOG B-RS-01 결과 표기
- [x] REPORT.md

## 로그
- RED 예측: 저장 중 추가 편집 → 링크 → 저장소 제목 '첫 편집'(마지막 편집 없음) · 대기/보류/연타 3건도 즉시 이동으로 실패 · 읽기 전용 2건·변경 없음 1건은 통과.
- RED 결과: 4 failed | 3 passed — `expected '첫 편집' to be '마지막 편집'`(결함 재현) · 나머지 3건 `프로젝트 목록`이 이미 보임(즉시 이동). 예측과 일치.
- GREEN: 스케줄러 `retry()`가 직후 단계를 돌려줌 · `useDocSave.leave()` · StudioLayout 링크 가로채기(대기→성공 시 같은 링크 다시 클릭). 7/7.
- 예산 1차 +0.76(`infra.ts` import가 영속 청크를 진입으로 끌어옴 — 설계 실수) → import 제거 2차 +0.21/+0.22 → 기능 감량 1회(다운로드 제외를 선택자로 · 수정 키·target 검사 제거 · 비교 문자열 단축) 3차 129.74/132.77.
- 기준선 최종 129.73 · 132.76 (마지막 빌드 실측, 커밋 `4d878be`).
- Codex r1 반영 뒤 129.82/132.85 → 감량 1회 → 129.77/132.80(기준선 갱신). r2 반영 뒤 → 감량 1회 → 129.79/132.83, 판정선 안·몫 초과 → 멈추고 보고.
- 최종 게이트(7db2c0b): typecheck·lint·build 0 · vitest 301/2717 · Ego 재실행 3/3.

## RESUME-1
- [x] main(`d68006e`) `--no-ff` 병합 — `dbcfd4f`
- [x] 다운로드 제외 복원 RED→GREEN (`StudioLeave.test.tsx`) — RED(선택자 `a[href]`로 되돌림): 1 failed | 13 passed `expected false to be true`(click 기본 동작 취소=보류) · GREEN(`a[href]:not([download])`): 14/14
- [ ] 게이트 typecheck·lint·vitest·build
- [ ] 기준선 정리 (`/studio` ≤ 129.88 · 복원 ≤ 132.92)
- [ ] REPORT RESUME-1 절
