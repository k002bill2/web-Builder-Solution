# FLAKY-TESTS PROGRESS

- [x] P0 BRIEF 커밋
- [ ] 재현 (부하 동시 실행) — 재현 명령·실패 목록·횟수 표 (14턴 전 커밋)
- [ ] 원인 분석 (대상 8개 파일 대기 패턴 정적 점검)
- [ ] 테스트 쪽 수정 + 커밋 (30턴 전)
- [ ] 같은 부하 조건 전체 vitest 5회 연속 exit 0
- [ ] typecheck · lint · build exit 0
- [ ] REPORT.md (원인별 표: 파일:줄·원인·수정·근거) (42턴 전)
- [x] Ego Lite 생략 — UI 변경 0 (테스트 파일만 수정)
- [x] Codex — Jarvis 몫 (브리프)

## 재현표 (늦은 커밋 — 14턴 기한 넘김)

이전 실패 로그(`~/.hermes/.../p1d-l3-final-gates/vitest-2.txt`)는 통과 로그로 덮여 있어 실패 목록을 다시 볼 수 없음.

| 라운드 | 명령 (`/tmp/flaky/load.sh N`) | vitest a | vitest b | build | 실패 |
|---|---|---|---|---|---|
| 1 | `npx vitest --run` ×2 동시 + `npm run build` 동시 | exit 0 (296 files / 2642 tests, 108.8s) | exit 0 (108.9s) | exit 0 | 0 |
| 2 | 같음 | 진행 중 | 진행 중 | | |
| 3 | 같음 | 진행 중 | 진행 중 | | |

정적 가설: `src/test/renderApp.tsx`는 라우트 페이지 6개만 미리 로드 — 렌더 뒤 2단계 lazy 청크(`StudioLayout`·`docEngine`·`AddSectionDialog`·`VariantOptions`·`ImageSlotPanel`·`boardEngine`·`memoryGenerate`·`CandidateResults` 등)는 파일 첫 테스트의 findBy(3s)/testTimeout(5s) 창 안에서 콜드 변환된다.
