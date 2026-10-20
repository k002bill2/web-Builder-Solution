# IMPORT-LOWS QA REPORT — B-SEC-01·02·03 독립 검증 (정적·회귀, 브라우저 0)

대상 tip `0a89ef10` · 브랜치 `k002bill2/import-lows` · base `2531ebf8` · QA 2026-10-20

## 판정
(초안 — 진행 중)

## 1. fresh 게이트 · 예산 — PASS
워킹 트리 = `0a89ef10` + 문서만(앱 diff 0). app/에서 순차 실행(2026-10-20 10:19–10:21).
| 게이트 | 명령 | 결과 |
|---|---|---|
| typecheck | `npm run typecheck` | exit 0 |
| lint | `npm run lint` | exit 0 |
| test | `npx vitest --run` | Test Files 375 passed · Tests 3374 passed · exit 0 |
| build | `npm run build` | exit 0 · 618 modules (`logs/qa-build.txt`) |
- 예산: `/studio/:projectId` 해시 정규화 진입 **128.76KB**(기준선 128.76 · 멈춤 > 128.79) · 저장 데이터 복원 진입 **131.76KB**(기준선 131.75 · 멈춤 > 131.78) — REPORT 6절 값과 일치.
- 주의: `/tmp/qa-build.txt`에 10-18 다른 세션 잔존본이 있어 한때 128.82/131.81로 읽힘 → 파일 mtime 확인 후 fresh 본(10:21)만 근거로 씀.

## 2. 변이 5종
(진행 중)

## 3. 기존 사용자 데이터 회귀
(진행 중)

## 4. B-SEC-03 그 이미지만 잃은 이미지
(진행 중)

## 5. 픽스처 이전/이후 단언 약화
(진행 중)
