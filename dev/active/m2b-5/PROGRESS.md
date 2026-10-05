# M2B-5 PROGRESS — 3안 실렌더 나란히 비교 (Developer)

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-5` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-5/BRIEF.md` · 정본 `docs/design/m2b/SPEC-COMPARE3.md` · `MQ-M2B5.md`(1~4 ★A)
- 시작 SHA `48487d5` (브랜치 `k002bill2/m2b-5`) · baseline(브리프) suite 210 files · 1840

## 체크리스트
- [x] P0 npm ci exit 0 · lock 불변(`git diff --exit-code` exit 0) · BRIEF·PROGRESS 커밋 f1b07bb
- [x] S0 기준선 — check-bundle-size `/profile (3안 있음)` 시나리오 추가(한도·판정·예산 변경 0, 시나리오 1개 추가만) · build exit 0 · 실측 **121.11** = SPEC 0.1 일치(logs/s0-build.txt·s0-bundle.txt) · bundleBudget.test 8 passed · 새 테스트 예측 0 = 실제 0
- [ ] S1 시제품 예산 실측(버튼·onClick 동적 import·변환 3건, iframe 0) · 6.2 표
- [ ] S2 대화상자 + 비교 전용 프레임 다리(U3·U4·U9·U10, G2·G3)
- [ ] S3 상태·알림·폴백·캡션(U6·U7·U11·U12)
- [ ] S4 선택 연동·접근성(U8·포커스·스크롤 영역)
- [ ] S5 브라우저 B1~B6 4폭(1280·1024·768·390)
- [ ] S6 전체 vitest exit0 · Codex review --scope branch --base 48487d5 · REPORT

## 6.2 예산 표 (gzip KB)
| 대상 | baseline | S0 | S1 | 최종 | 멈춤선 |
|---|---|---|---|---|---|
| /profile 첫 | 99.61 | 99.61 | | | >99.64 |
| /catalog 첫 | 99.66 | 99.66 | | | >99.69 |
| /references/:id 첫 | 97.00 | 97.00 | | | >97.03 |
| /compare 첫 · 진입 | 98.84 · 121.72 | 98.84 · 121.72 | | | >98.87 |
| /profile 진입(잡 없음) | 118.67 | 118.67 | | | >119.50 |
| /profile (3안 있음) 진입 | ≈121.11 | 121.11 | | | >122.00 |
| /studio 진입 | 127.34 | 127.34 | | | >127.37 |
| 렌더 JS · CSS | 83.03 · 8.75 | 83.03 · 8.75 | | | 변화 시 멈춤 |
| 비교 조작 뒤 청크 | — | — | | | >25 |

## 새 테스트 delta 사전 예측 (각 단계 RED 전 기록)
