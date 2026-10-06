# ER-OFF REPORT — `/studio` 진입 청크 상쇄 · **멈춤(동작 변화 0으로 −0.60 불가)**

- 레인: Developer · worktree er-off · 브랜치 `k002bill2/er-off` · base `9befa6a` · 2026-10-06 · 서브에이전트 0
- **결론: 동작 변화 0으로 깎을 수 있는 최대치는 −0.16 실측(127.05 → 126.89), 추정 상한 −0.32(≈126.73).** 목표 −0.60(≤126.45)에 닿지 않아 브리프 2단계대로 억지 변경 없이 멈췄다. **앱 코드 diff 0**(`git diff 9befa6a -- app` = 0줄).
- −0.60에 닿는 조합은 모두 자동 저장 스케줄러(B1, −0.77)를 뒤로 미루는 경우뿐이다. 이것은 저장 상태 표시 타이밍을 바꾸므로 브리프 범위 밖이다 → MQ-R3 재결정 입력(8절).

## 1. 진입 청크 구성 (base, gzip Node zlib · KB=1000B — `logs/build-base.txt`)

| 청크 | gz | 레버? |
|---|---|---|
| index(공통) | 86.06 | 아님 — 다른 화면과 공유(±0.03 조건) |
| StudioLayout | 16.84 | 주 레버 |
| issue(공유 엔진) | 5.95 | 일부 |
| react | 3.28 | 아님 |
| runGate | 2.50 | 게이트 진입 자동(개정 3) |
| 그 밖 | 12.42 | fixtures·deferredStudio·memoryProject 등 |
| **합** | **127.05** | |

- 모듈 단위 잘못 배치 = 0: 진입 청크의 모든 모듈은 진입 루트에서 정적으로 닿는다(rolldown runtime 제외, `logs/reach.mjs`).
- export 단위 잘못 배치: StudioLayout 청크가 조작 뒤 청크에 내보내는 심볼 7개는 모두 진입에서도 쓴다 → 0. issue 청크에만 조작 뒤·다른 화면 전용 엔진 심볼이 조금 있다(A4).
- 검사기는 auto 목록의 정적 closure만 센다. 그래서 **새 lazy 청크를 만들면 검사기 목록(`scripts/**`, 수정 금지) 밖으로 숨는다.** 이동 대상은 기존 조작 뒤 청크로 한정했다.

## 2. 후보별 시제품 (코드 변경 전, 모두 되돌림 — `logs/proto.mjs` · `logs/proto-results.txt`)

방식: vite build API로 `/tmp`에 단독 빌드 → 검사기와 같은 auto 목록 closure로 합계를 냄 → `git checkout -- <파일>`로 되돌림. gzip은 더해지지 않으므로 조합은 따로 빌드했다.

**A군 — 동작 변화 0 가능** (m2c-3s P3형: 기존 조작 뒤 청크의 await 뒤에서만 실행되는 코드)

| id | 내용 | 진입 | Δ |
|---|---|---|---|
| A1 | StudioLayout move·remove·swap·add의 `await loadDocEngine()` 뒤 꼬리 → docEngine | 126.93 | −0.12 |
| A2 | useSectionOps.run `await applyDocOp` 뒤(stack.push·setLast·edit) | 127.05 | −0.00 |
| **A1+A2** | 조합 | **126.89** | **−0.16** |
| A3 | useExportFlow.request 로드 뒤 2줄 | — | ≈0(측정 생략) |
| A4 | issue 청크의 조작 뒤·다른 화면 전용 엔진 심볼(EngineOpError 등)을 엔진 파일에서 분리 | ≤126.89 [추정] | ≤−0.16 [추정, 출력 바이트 제거 5.952→5.790. 진입 canMove가 indexOf를 써서 실제로는 더 작음] |
| A 상한 | A1+A2+A4 | ≈126.73 | ≈−0.32 [추정] |

A4는 `src/engine` 파일을 고쳐야 한다. "엔진 계약 변경 0"의 경계에 걸려 시제품을 만들지 않았다.

**B군 — 상한 참고만** (구현 안 함: 타이밍이나 보이는 동작이 바뀜)

| id | 내용 | 진입 | Δ | 이유 |
|---|---|---|---|---|
| B1 | 자동 저장 Scheduler 클래스 | 126.28 | −0.77 | 마운트 때 생성된다. 첫 편집의 `dirty` 표시가 동기라서, 청크를 늦게 받으면 저장 상태가 한 틱 늦게 바뀐다 |
| B2 | useExportFlow.start 본문 | 127.05 | −0.00 | 감량 없음 |
| B3 | ConflictCallout + resolve 본문 | 126.87 | −0.18 | m2c-3s P2a와 같은 방식(STALE_DOC 가드 RED)으로 탈락 |
| B4 | PageInfoFields | 126.79 | −0.26 | m2c-3s P1a와 같은 방식(한 틱 늦음·포커스)으로 탈락 |
| B3+B4 | | 126.59 | −0.46 | |
| B1~B4 | | 125.79 | −1.26 | |
| A1+A2+B1~B4 | | 125.61 | −1.44 | |

- A군 부분 감량(−0.16)은 문턱(−0.60)에 못 미친다. 브리프 2단계대로 구현하지 않았다.

## 3. TDD
- 옮긴 요소가 0개라 동작 고정 테스트·RED 예측 커밋은 N/A다. 테스트 추가·변경·skip도 0이다.

## 4. 검증 (fresh, 시제품 되돌림 뒤)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0이다. `/studio` 진입은 127.05이고, 번들 표 전 행이 base와 같다(해시 제외 diff 0 — `logs/build-after.txt`). 렌더 변화 0이다.
- `npx vitest run` 1회: **227파일 2048 통과, exit 0**(`logs/vitest-after.txt`).
- `git diff 9befa6a -- app` = 0줄이다.
- Codex `review --scope branch --base 9befa6a`: 9절.

## 5. Ego Lite
- 옮긴 요소가 없고 앱 코드 diff도 0이라 화면 확인·캡처는 N/A다. 창·탭은 하나도 열지 않았다.
- `listTaskSpaces()` = `[]`을 확인했다. 이 레인이 만든 space가 없으므로 finish 대상도 0이다. 영환님 창과 main 5480은 건드리지 않았다.
- 서버: preview를 시작하지 않았다. 4337 리슨 0을 확인했다(`lsof -iTCP:4337 -sTCP:LISTEN` 0줄).

## 6. 지킨 것
- `app/scripts/**`·기준선·한도·ADR·docs/**·package*.json/lock·CLAUDE.md 수정 0. 테마·스냅샷 기능 코드 0. `k002bill2/er-2-wip-bundle` 무접촉. 서브에이전트 0. push/merge/삭제 0.
- 커밋: `a994e46` BRIEF P0 · `312090b` 후보 표(코드 변경 전) · REPORT 커밋.

## 7. meta
- 턴 약 35회. 시제품 11종을 스크립트 1개로 일괄 실행했다(빌드 1회당 약 1초).
- 근거 수준: 수치 L1(빌드 실측), A4·A 상한 L2(추정). 불확실성은 Low다(A군 상한이 목표의 절반이라 결론이 뒤집히지 않음).

## 8. 영환님 결정 요청 (MQ-R3 재결정 입력)
1. **B안(추천): 기준선 상향(ADR-004 개정5).** 동작 변화 0으로 확보할 수 있는 여유는 최대 ≈0.3이다. ER-2(+0.59) 하나도 다 덮지 못한다.
2. A안을 유지한다면: 자동 저장 스케줄러(B1, −0.77)를 첫 편집 때 받도록 미뤄야 한다. 이 경우 저장 상태 "저장 전 변경" 표시가 늦어지는 동작 변화를 받아들여야 하고, 검사기 목록 갱신(`scripts/**` 개정)도 필요하다.
3. 부분 상쇄 A1+A2(−0.16)는 어느 안에서도 별도 레인으로 넣을 수 있다. A4(엔진 파일 분리)는 엔진 계약 경계라 따로 승인이 필요하다.

## 9. Codex
(아래에 결과 기록)
