# M2B-5 PROGRESS — 3안 실렌더 나란히 비교 (Developer)

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-5` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-5/BRIEF.md` · 정본 `docs/design/m2b/SPEC-COMPARE3.md` · `MQ-M2B5.md`(1~4 ★A)
- 시작 SHA `48487d5` (브랜치 `k002bill2/m2b-5`) · baseline(브리프) suite 210 files · 1840

## 체크리스트
- [ ] P0 npm ci exit 0 · lock 불변 · BRIEF·PROGRESS 커밋
- [ ] S0 기준선 — check-bundle-size `/profile (3안 있음)` 시나리오 추가(한도·판정 변경 0) · 빌드 실측
- [ ] S1 시제품 예산 실측(버튼·onClick 동적 import·변환 3건, iframe 0) · 6.2 표
- [ ] S2 대화상자 + 비교 전용 프레임 다리(U3·U4·U9·U10, G2·G3)
- [ ] S3 상태·알림·폴백·캡션(U6·U7·U11·U12)
- [ ] S4 선택 연동·접근성(U8·포커스·스크롤 영역)
- [ ] S5 브라우저 B1~B6 4폭(1280·1024·768·390)
- [ ] S6 전체 vitest exit0 · Codex review --scope branch --base 48487d5 · REPORT

## 6.2 예산 표 (gzip KB)
| 대상 | baseline | S0 | S1 | 최종 | 멈춤선 |
|---|---|---|---|---|---|

## 새 테스트 delta 사전 예측 (각 단계 RED 전 기록)
