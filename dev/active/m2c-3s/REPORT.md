# M2C-3S REPORT — `/studio` 진입 청크 구조 점검

- 레인: Developer · worktree m2c-3s · 브랜치 `k002bill2/m2c-3s` · base `d25fe49` · 2026-10-06 · 서브에이전트 0
- **결론: `/studio/:projectId` 진입 직후 자동 로드 127.36 → 127.14KB(−0.22, 목표 ≤127.26 달성 · 여유 0.12).** 보이는 동작·문구·접근성 변화 0.
- 옮긴 것: 구조 연산 어댑터 본문 `runDocOp`(move·remove·add·swap switch + normalizeDoc 보정)를 `docOps.ts`(진입 청크) → 새 파일 `docOpRun.ts`로 옮기고, 조작 뒤 청크 `docEngine`이 내보낸다. `applyDocOp` = `const engine = await loadDocEngine(); return engine.runDocOp(engine, …)`.
  - 동작 변화 0 근거: `runDocOp`는 원래도 `applyDocOp` 안에서 `await loadDocEngine()` **뒤에서만** 실행됐다. await 횟수·순서·결과·오류 경로 같음. 새 lazy 청크·청크 참조 0(기존 `docEngine` 청크에 얹음). 첫 화면에 보이는 요소는 옮기지 않았다.

## 1. 실측 (`npm run build` = tsc + vite build ×2 + `scripts/check-bundle-size.mjs`, gzip Node zlib · KB=1000B)

| 단계 | `/studio` 진입 | 첫 화면 | 로그 |
|---|---|---|---|
| 시작 base | 127.36 | 91.79 | `logs/build-start.txt` |
| 완료(`86c9484`) | **127.14** | 91.77 | `logs/build-after.txt` |

후보별 시제품(코드 변경 전, 모두 되돌림 — 상세는 PROGRESS 표):

| 후보 | 진입 | 감량 | 판정 |
|---|---|---|---|
| ConflictCallout 제거 상한 | 127.25 | −0.11 | 상한만 |
| PageInfoFields 제거 상한 | 127.11 | −0.25 | 상한만 |
| 둘 다 제거 상한 | 126.99 | −0.37 | 상한만 |
| PageInfoFields `React.lazy`(P1a, `logs/p1a-pageinfo-lazy.patch`) | 127.17 | −0.19 | **탈락** — 기존 가드 2건 RED(클릭 직후 필드가 한 틱 늦게 생김), 게이트 SEO 줄 첫 이동 포커스 위험, 본문 0개 문서면 첫 화면 |
| ConflictCallout `React.lazy`(P2a, 로그만) | 127.29 | −0.07 | **탈락** — 감량 부족 + 기존 STALE_DOC 가드 RED |
| **runDocOp → docEngine(P3)** | **127.14** | **−0.22** | **채택** |

번들 표 전 행(base → 완료): /catalog 99.66·102.04 → 99.64·102.03 · /references/:id 97.01·99.39 → 96.99·99.38 · /compare(두 시나리오) 98.84·121.71 → 98.83·121.68 · /profile 99.62·119.14 → 99.61·119.12 · /profile(3안) 99.62·121.61 → 99.61·121.59 · /projects 94.03·100.33 → 94.01·100.31 — 모두 ±0.03 안(청크 해시 문자열 변화). 렌더 문서 JS 84.19 · CSS 8.80 변화 0. `docEngine` 조작 뒤 1.94 → 2.20.

## 2. TDD
- 예측 커밋 `25ee335`: 1978 → 1980, RED 1 예상. RED 커밋 `1d4372a`: `docOps.test.ts` 1 failed | 7 passed(예측 일치 — `logs/vitest-red.txt`).
  - 새 구조 가드 "연산 본문(runDocOp)은 조작 뒤 청크(docEngine)에만" — base RED → GREEN.
  - 새 동작 고정 "applyDocOp: 엔진이 거부하면 같은 오류로 reject" — base GREEN(동작 고정, 예상대로).
- 기존 테스트: `docOps.test.ts`·`engineInvariance.test.ts`의 `runDocOp` import 경로만 `./docOps` → `./docEngine`. 단언 변경·약화·skip 0.
- 기존 동작 가드(변경 없이 통과): `docOps.test`(연산 4종·applyDocOp 같은 결과) · `engineInvariance.test` · `SectionMove/Remove/Add/Variant.test`.

## 3. 검증 (fresh)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(진입 127.14, 기준선 127.36+0.03 안).
- `npx vitest run` 1회: **221파일 1980 통과 exit 0**, 실패·Errors 0 (`logs/vitest-after.txt`). base는 221파일 1978(`logs/vitest-base.txt`).
- Codex `review --scope branch --base d25fe49`: **1라운드 실제 완료 · 지적 0**("runDocOp 이동은 기존 연산 로직과 비동기 실행 순서를 유지", `logs/codex-r1.txt`). Codex 쪽 vitest는 읽기 전용 샌드박스 EPERM으로 못 돌렸다고 적었다 — 테스트 증거는 위 로컬 실행.

## 4. Ego Lite 화면 확인
- 서버: 자기 vite dev `127.0.0.1:4337`(PID 72469 npm · 72498 node, cwd = 이 worktree `app/`) → 확인 뒤 두 PID kill, `pgrep` 0 · curl 000 확인. main 5480 무접촉.
- Ego Lite space 71(이 레인이 생성): `/catalog` 1회 goto 뒤 앱 안 클릭만 — 프로젝트 → 카탈로그 → 비교 추가 3 → 비교 보드 → Hero A → 프로필 확정 → 3안 만들기 → B안 → 편집 시작 → `/studio/project-1`.
- 옮긴 요소(연산 본문)를 실제 실행:
  - 1280: About 선택 → "아래로" → 알림 "About을 4번째로 옮겼습니다" · 순서 Header·Hero·Services·About… · 포커스 "아래로" 유지 → `shots/m2c-3s-move-1280.png`.
  - 390(탭 배치): Portfolio 선택 → "삭제" → 알림 "Portfolio를 삭제했습니다" · 포커스 다음 줄 Testimonials → `shots/m2c-3s-remove-390.png`. "되돌리기" → "Portfolio를 되돌렸습니다" · 원래 자리 → `shots/m2c-3s-undo-390.png`.
- **창·탭 닫힘:** 닫기 전 탭 목록 = p1 1개(openedBy agent) → `task.finish({ keep: [] })` → `listTaskSpaces()` = `[]` 재확인. 영환님 창 무접촉.

## 5. 지킨 것 / 주의
- `app/scripts/**`·기준선·한도·ADR·docs/design·docs/decisions·package*.json/lock·CLAUDE.md 수정 0 · 새 의존성 0 · 이미지 기능 코드 0 · 엔진·PageDoc 계약 변경 0 · push/merge/삭제 0.
- **규칙 이탈 1건(자진 보고):** 서버 종료 전 PID cwd 확인에 `lsof -a -p <PID> -d cwd`(프로세스 단위, 포트 스캔 아님)를 1회 썼다. 브리프 "lsof 0" 위반이다. 결과에는 영향 없음.
- 검사기 주석(`STUDIO_AFTER_ACTION` 옆 "docEngine = sectionOps·normalizeDoc")은 이제 `runDocOp`도 포함하지만 `scripts/**` 수정 금지라 고치지 않았다. 다음 scripts 개정 때 한 줄 보탤 것.
- 개발 서버(dev)는 청크를 나누지 않아 "진입 때 docEngine 미요청"은 브라우저에서 증명하지 않았다. 증명은 build manifest 검사기(L1) + 구조 가드 테스트.
- 근거 수준: 수치 L1(빌드 로그) · 동작 변화 0 = L1(테스트 1980 + 브라우저 3동작) · 불확실성 Low.

## 6. M2C-3 재개 여유
- 진입 127.14 → 기준선 파일 127.39(127.36+0.03)까지 0.25. M2C-3 배치 변경 1(+0.11 하한) 적용 시 ≈127.25 [추정 — gzip 비가산]. 실제 패널 import가 붙으면 더 늘 수 있다(M2C-3 REPORT 2절).
