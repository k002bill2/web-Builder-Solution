# QFIX PROGRESS

- base f73708f · 레인 포트 4337 · 턴 상한 45

## 체크리스트
- [x] BRIEF P0 커밋
- [x] B-TEST-01 원인 특정 (CMP-AC-U1 · J-S07) + 부하 재현 전후 기록
- [x] B-TEST-01 대기 방식 안정화 (단언 유지)
- [ ] B-ER-10 TDD (예측 · RED · GREEN)
- [ ] B-ER-11 TDD (예측 · RED · GREEN)
- [ ] B-ER-03 문구 교체
- [ ] 번들 /studio 증가 ≤0.08 (판정선 128.70)
- [ ] typecheck · lint · build
- [ ] 전체 vitest 3회 연속 exit0
- [ ] Ego Lite 4337 (B-ER-10 1280 · B-ER-11 390 · B-ER-03) + finish/리슨0
- [ ] Codex review branch base f73708f (≤2)
- [ ] REPORT 커밋

## 기록

### B-TEST-01
- CMP-AC-U1 원인: "만드는 중…"은 `busy==="request"`(요청 응답 전)에도 보인다. 파일 첫 생성은 계산 청크 `loadGenerate()` 콜드 로드를 기다리는데, 테스트는 "만드는 중…"만 보고 tick 3회(3000ms)를 넘겨 첫 조회 타이머가 예약되기 전에 시간이 소진 → 조회 3회 미달 → 비교 버튼 없음(이전 로그 m2c-4 final-vitest-try1: 71:41 실패 시 DOM "만드는 중…"). 제품 경쟁 조건 아님(응답 뒤 조회 시작은 의도된 순서).
- 수정: `requested()` = 프로필 알림 status가 /^3안을 만/ 될 때까지 waitFor(시작 알림은 follow() 안 — 타이머 예약과 같은 동기 구간). CMP-AC-U1과 `generate` 헬퍼에 적용. 단언·순서 변경 0, timeout 변경 0.
- J-S07 원인: 포커스 복귀는 커밋 뒤 passive `useEffect`, `findByRole`은 커밋(버튼 DOM 등장)에 풀림 → effect flush 지연 시 toHaveFocus 실패. 수정: 같은 단언을 `await waitFor(...)`로. 제품은 정상(브라우저에서 effect는 곧 실행).
- 부하 재현(`yes` ×8 + 병렬 레인, load 30→96, 두 파일 5회): 전 `logs/before-load.txt` CMP-AC-U1 5/5 실패 · J-S07 0/5 → 후 `logs/after-load.txt` 5/5 통과(23/23).
