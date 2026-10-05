# M2C-3S PROGRESS — `/studio` 진입 청크 구조 점검

- 브랜치 `k002bill2/m2c-3s` · base `d25fe49` · 2026-10-06 · 서브에이전트 0
- 측정: `npx vite build && npx vite build --mode render && node scripts/check-bundle-size.mjs`(= `npm run build`에서 tsc만 뺀 것, 1회 ≈2초). 로그 `logs/build-*.txt`, 패치 `logs/*.patch`

## 체크리스트
- [x] P0 브리프 커밋 (`f498658`)
- [x] 시작 build 실측 — `/studio` 진입 127.36 · 첫 화면 91.79 (`logs/build-start.txt`, exit 0)
- [x] 후보별 시제품 build 실측·기록 (아래 표) — 코드 변경 전
- [x] base 전체 vitest — 221파일 1978 통과 exit 0 (`logs/vitest-base.txt`)
- [ ] 테스트 수 예측 커밋
- [ ] 동작 고정·구조 가드 테스트 작성 → RED 확인
- [ ] 구현(runDocOp → docEngine 청크) → GREEN
- [ ] typecheck · lint · build(번들 표 전 행) · 전체 vitest exit0
- [ ] Ego Lite 4337 앱 안 클릭 확인 · 1280/390 캡처 · 연 창/탭 닫기·재확인
- [ ] Codex review --scope branch --base d25fe49 (≤2라운드)
- [ ] REPORT.md

## 후보 실측 (모두 base `d25fe49` 위 시제품, 되돌림)

| 후보 | 방식 | `/studio` 진입 | 감량 | 동작 | 판정 |
|---|---|---|---|---|---|
| 시작 | base | 127.36 | — | — | 기준 |
| ConflictCallout 제거(상한) | import를 null 컴포넌트로 | 127.25 | −0.11 | (제거라 해당 없음) | 상한만 |
| PageInfoFields 제거(상한) | 같음 | 127.11 | −0.25 | — | 상한만 |
| 둘 다 제거(상한) | 같음 | 126.99 | −0.37 | — | 상한만 |
| P1a PageInfoFields `React.lazy` | `EditFields`에서 lazy+Suspense(null) | 127.17 | −0.19 | 기존 가드 2건 RED(`StudioLayout.test` "'페이지 정보' → 제목·설명 필드", `ExportFlow.test` 편집 직후 다시 검사) — 클릭 직후 필드가 한 틱 늦게 생김. 게이트 SEO 줄 첫 이동 포커스도 편집 머리로 떨어질 위험. 본문 0개 문서면 첫 화면(`initialSelection` = "") | **탈락** |
| P2a ConflictCallout `React.lazy` | `StudioLayout`에서 lazy+Suspense(null) | 127.29 | −0.07 | 기존 가드 1건 RED(`StudioLayout.test` STALE_DOC → Callout 동기 표시) | **탈락**(감량 부족 + 동작 변화) |
| **P3 `runDocOp` → docEngine 청크** | 연산 본문(switch)을 `docOpRun.ts`로 옮겨 `docEngine`이 내보냄. `applyDocOp` = `(await loadDocEngine()).runDocOp(...)` | **127.14** | **−0.22** | 원래도 `await loadDocEngine()` 뒤에서만 실행 — await 횟수·순서 같음, 새 청크 참조 0 | **채택** |

- P3 다른 라우트: /catalog 99.64·102.03 · /references 96.99·99.38 · /compare 98.83·121.68 · /profile 99.61·119.12 / 121.59 · /projects 94.01·100.31 (base 대비 −0.01~−0.03 — 청크 해시 문자열 변화) · `docEngine` 조작 뒤 1.94 → 2.20
- 제외: `ExportRetryAlert`(청크 실패 때도 떠야 함 — 파일 주석 M2A-3a Codex P2-1 r2), 화면에 보이는 부품 전부.

## 테스트 수 예측 (RED 전 커밋)
- `docOps.test.ts`에 2개 추가 → 전체 1978 → **1980** (221파일 그대로).
  1. 구조 가드 "연산 본문은 조작 뒤 청크에만 — docOps는 runDocOp를 내보내지 않고 docEngine이 내보낸다": base에서 **RED 예상**.
  2. 동작 고정 "applyDocOp: 엔진이 거부하면 같은 오류(code)로 reject — useSectionOps 이유 문장 경로": base에서 **GREEN 예상**(동작 고정).
- RED 단계 예상: 1 failed | 1979 passed. 구현 뒤: 1980 passed. 기존 테스트는 `runDocOp` import 경로만 `./docOps` → `./docEngine`(단언 변경 0).
