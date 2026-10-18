# SEC-FIX-1 QA REPORT — 가져오기 M-1·L-1 수정 독립 검증

대상 tip `19d3337a`(QA 착수 커밋 `3b2dd420` 직전) · 브랜치 `k002bill2/import-hardening` · 2026-10-18 · QA(Claude Code, Opus 5.5). 정적·회귀만 — 브라우저 0 · Codex 0 · push 0. 앱·테스트 코드 커밋 0(퍼즈·변이는 임시 적용 후 되돌림).
표기: [사실]=실행 확인 · [추정] · [미확인].

## 판정
(작성 중)

## 1. fresh 게이트 · 예산 [사실 — 로그 `/tmp/qa-sf1/*.txt`, 미커밋]
| 게이트 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx vitest --run` | **363 files / 3269 tests passed** exit 0 (BRIEF 기대치 일치) |
| `npm run build` | exit 0 (번들 가드·preload 가드 통과) |

| 라우트 | base(`logs/build-base.txt`) | QA fresh | 증분 |
|---|---|---|---|
| /projects 첫 화면 | 99.09 | 99.09 | 0 |
| /projects 진입 직후 | 109.54 | 109.53 | −0.01 |
| /studio 해시 정규화 진입 | 128.80 | 128.80 | 0 (멈춤 > 128.82) |
| 복원 진입 해시 정규화 | 131.78 | 131.78 | 0 (멈춤 > 131.80) |
| /catalog 첫 화면 | 100.77 | 100.77 | 0 |
| 렌더 문서 JS | 84.29 | 84.30 | +0.01 (예산 90) |
→ 진입 증분 0 재현. **PASS**.
