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

## 2. 변이 5종 — PASS (전부 FAIL로 잡힘 · 매번 `git checkout -- src` 복원 · `git status --short src` 빈 값 확인)
실행: `npx vitest --run src/features/projectFile src/data/persistence` (337 tests 기준).
| # | 변이 | 결과 | 잡은 테스트 |
|---|---|---|---|
| M1 | `IMPORT_IMAGE_ID`·`EXPORT_IMAGE_ID` → `[0-9a-fA-F]` · 버전/variant 자리 무시 | 2 FAIL | checkImages "레코드 — localId에 / · 중복 · 형식 모름…"(행동) · readProject parity `EXPORT_IMAGE_ID.source` |
| M2 | Blob.type 검사 제거(readImageRecord + exportImageOf 양쪽) | 2 FAIL | imageRecord "변형본 Blob.type ≠ image/<형식>…" · readProject parity "말뭉치 통과·거절 둘 다" |
| M2b | exportImageOf 쪽만 제거 | 5 FAIL | readProject parity SEC L-4 5건(svg+xml·text/html·빈 값·jpeg·한 단만) |
| M3 | readProject: 손상 레코드 1개면 `unreadable`(내보내기 전체 실패) | 3 FAIL | readProject "왕복 보장 — 정상 1 + 손상 1"·"width 1280 + variants 640만…"·"깨진 이미지 레코드는 건너뛴다" |
| M4 | `PROJECT_KEYS`에 `hasDoc: true` 추가 | 1 FAIL + typecheck TS2353 | rekey "project에 hasDoc… → 키 = Project 7개" · `tsc` exit 2 |
| M5 | 정규화를 저장 뒤로(plan = 원본 spread, `recordsHold`만 정규화본) | 2 FAIL | rekey SEC L-2 project·series/DocRecord/스냅샷 2건 |
- 참고: M1에서 readProject 행동 테스트("수정 전 가져온 project-1/a")는 통과 — `a`는 완화 정규식에도 안 맞아서. 대문자·버전 무시 완화는 readProject 쪽에선 parity만이 잡는다(리터럴 복제 구조상 parity가 그 역할 · 결함 아님).

## 3. 기존 사용자 데이터 회귀
(진행 중)

## 4. B-SEC-03 그 이미지만 잃은 이미지
(진행 중)

## 5. 픽스처 이전/이후 단언 약화
(진행 중)
