# CSP-2 PROGRESS — 정적 zip·React zip CSP

브랜치 `k002bill2/csp-zip` · base `4e2cf602` · 정본 `docs/design/csp/CSP-SPEC.md` r1 + 5a

## E0 실측
- [x] E0-1 CSP-AC-R3: 정적 zip(임시 CSP meta) file:// Chromium 실측 → CQ-03 판정
- [x] E0-2 CSP-AC-C1: React zip docker node:22 빌드·dist 검사·vite preview 위반 수 → CQ-05 판정
- [x] E0-3 static-html R1 위반 0 · R5 시트 닫힘 재확인 (로그)
- [x] E0 결과 REPORT 초안 (표)

## E1 구현 (TDD)
- [x] 정적 zip: CQ-03 A → STATIC_CSP_ZIP / C → 미구현 + 판정 기록
- [x] React zip: CSP-AC-09·C1·C2·R4
- [x] 예산 /studio 128.76 · 복원 131.75 증분 0 확인
- [x] 게이트 typecheck·lint·test(--maxWorkers=4)·build

## 검증·마감
- [x] Codex adversarial 1회 + 반영 1회
- [x] preview 종료·리슨 0 기록
- [x] REPORT 확정 · `git status --short` 빈 값

## 메모
- E0: CQ-03 A(Chromium file:// 통과) · CQ-05 A(preview 위반 0) — REPORT 표. 임시 산출 테스트 `app/src/features/studio/zip/e0Out.tmp.test.ts`는 untracked(마감 전 삭제).
- R2(2026-10-20 마감): Codex P2 반영 커밋 `9a3b6b48` · 로그 `aad95c2a` · 가드 변이 1회 FAIL→되돌림 PASS(`logs/r2-guard-mutation.txt`) · REPORT 게이트·Codex·결론 확정. `e0Out.tmp.test.ts` 부재 확인.
