# 2A-04b1 PROGRESS

브리프 `docs/06-handoff/2A-04b1_DEVELOPER_BRIEF.md` · SPEC `docs/design/2a-04/SPEC.md` r5 · 기준 커밋 `3623e9b`

| # | 단계 | 상태 |
|---|---|---|
| 1 | 테스트 플레이크 3곳(테스트 코드만) | 완료 — 정상 5회 599/599, 부하 A/B 원본만 실패 (logs/) |
| 2 | 번들 용량 확보·실측 | 완료 — /compare 99.49 / 124.45 (여유 0.51 / 0.55), 조건부 동적 import |
| 3 | 저장소·순수 함수(getAdjustmentRange·saveAdjustments·carryOverAdjustments·effectiveProfile) | 완료 (1e60ad2·b82986c) |
| 4 | 보드 P-S25 패널 · P-AC-37 | 완료 (cdd86c5) |
| 5 | 검증 4종 · 5회 · 스모크 · Codex · REPORT | 검증 4종·스모크·Codex(P2 반영 0a94c68)·REPORT 완료. 5회 연속 642/642(3차) — P-AC-11 원인 = 보드 화면 언마운트 전 복귀(REPORT 1.3) |

## 기준 번들 (3623e9b 재빌드, gzip KB)
공통 88.92 · /catalog 98.98 / 101.36 · /references/:id 96.31 / 98.69 · /compare 99.16 / 123.32 · /profile 98.84 / 117.48 · /studio 89.38 / 91.77

## 메모
- 부하 재현: 전체 테스트 3~4개 동시(`--maxWorkers=10`, 10코어). 주변 부하(load avg 120~246, 다른 프로세스)가 커서 대상 밖 테스트도 가끔 실패 → 같은 실행 안에서 원본 사본(Orig*.test.tsx, 임시)과 A/B 비교.
