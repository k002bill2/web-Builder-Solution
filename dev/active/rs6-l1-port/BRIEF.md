# RS6-L1 BRIEF — 저장 코어 포트·코어 이식 (Developer, 구현)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-l1-port` (브랜치 `k002bill2/rs6-l1-port`, base origin/main `0c196b81`). `app/node_modules` 설치 완료.
승인: MQ-6-1~5·7 = A, MQ-6-6 = ADR-004 **개정 17**(상한 선승인 + 레인별 실측). 기록 = `docs/design/restart/MQ-6.md` 결정 기록 · `docs/decisions/ADR-004-performance-budgets.md` 개정 17.
Designer 생략 사유: 이 레인은 화면 변경 0(저장소·코어 층). 화면은 L2~L5.

## 정본 (먼저 읽기)
- `docs/04-plan/RS6_INTEGRATE_PLAN.md` **2절 L1 표(CP1~CP4) — 이 레인 범위 전부**. 쓰기 경로는 PLAN 레인 표의 L1 행.
- `docs/design/restart/INTEGRATE-6.md` r1: 1절(경계표) · 2.2-2(동기 생성 + seed · 레지스트리 = 저장소 인스턴스 · local = 포트 대기 / memory = DocBook 커밋 뒤 `not-persistent`) · 4절(H4) · 5절 G1(문서 필드 = 코어 · 스냅샷 = DocBook · DocBook 경로 재쓰기는 코어 chain 뒤) · D6-3·D6-10 · 11절(깨질 테스트) · RS6-AC-U1·U2·U3·U10·U14·U15·G2.
- 코어 원본: `dev/active/save-core-harness/core/saveCore.ts` + `save-core-fix` 수정분(`dev/active/save-core-fix/REPORT.md`·MINIMAL-CONTRACT), 하네스 테스트 `save-core-harness/test/h1~h6`, QA 반례 `save-core-qa/test/*`, `save-core-final-qa/test/*`.
- 측정 패치(참고 배치): `dev/active/rs6-l0-slim/patches/s6c-slim.patch` A안 + REPORT 2절. **ADR 개정 17 결정 4: 코어·레지스트리·포트 쪽 감량(①·①′·②′·④b)은 이 레인 기본 배치**. 단 패치의 `StudioLayout`·`useDocSave`·`studioRepository` 편집기 배선은 **L3 범위 — 이 레인에서 넣지 않는다**(③ `latest` 제거도 L3).

## 범위 (PLAN L1 CP1~CP4)
- CP1 코어 상태기 이식(`app/src/features/studio/save/saveCore.ts` — 레코드 접근 제거) + 포트 `mode`·`head`·`verify`. RED = 하네스 h1·h2 의미를 `createMemoryPersistence` + 제품 `LocalSync` 포트 위에서.
- CP2 이미지 동결 바인딩·엄격 참조(포트 전용 `imageOps` — 공유 flush 경로 변경 0) · 포트 `commit` = "코어 doc + DocBook snapshots" → `queue.submit`→`committed` · G1 · **RS6-AC-U14**(코어 commit 중 `deleteSnapshot`·`createSnapshot`·`confirmDoc` → IDB doc = 코어 최신 · 새 이미지 삭제 0) · **U15**(포트 이미지 키 projectId).
- CP3 h4·h5(readonly·stale·discard·replace·lease) + U10(cleared 직전 save) · 포트 `mode` = gate·cleared 결합.
- CP4 RS6-AC-G2 import 가드(어댑터 1개 + raw `indexedDB.` 호출 지점 목록 고정 — QA R3 권고) + 동기 생성·포트 늦게 붙이기 + 레지스트리를 `memoryProjectRepository`(선택적 능력 인터페이스 `CoreKeeper` 가칭 — 공개 `ProjectRepository` 직접 확장 금지).
- 하네스 37건 → 3분류 대응표(이식/잠금 기반 대체/폐기 + 사유)를 REPORT에(RS6-AC-U1).

## 규칙
- TDD: CP마다 RED 예측(새 테스트 수) → PROGRESS → RED 로그 `dev/active/rs6-l1-port/logs/` → GREEN 커밋. RED만 있는 tip 커밋 금지. 기존 단언 약화·skip 0. INTEGRATE-6 11절 목록 밖 기존 테스트가 깨지면 멈추고 보고.
- **예산(개정 17 결정 2·3)**: CP마다 `npm run build` 정규화·raw 기록. 이 레인 진입 증분이 생기면 그 커밋에서 `app/scripts/m2cBaseline.json` `normEagerKb`·`eagerKb`와 `app/scripts/bundleBudget.test.mjs` 기대값을 실측으로 올리고 note에 "개정 17 배분 RS6-L1"을 추가. 정규화 상한 `/studio` 129.13 · 복원 132.11, raw 130.5(raw가 130을 넘는 첫 커밋에서 `check-bundle-size.mjs` `eagerBudgetKb` 130 → 130.5 + 개정 17 주석). 상한 초과 → 감량 1회 → 그래도 넘으면 멈춤·수치 보고.
- 레코드 형식·`StudioPersistence`·엔진/PageDoc 계약·스키마 변경 0. 새 의존성 0. 화면·문구 변경 0.
- 서브에이전트 분할: 권장(읽기 전용 1개 — 하네스 37건 분류표 작성 ∥ 메인 CP1 구현). 쓰기는 메인만(같은 코어 파일 공유).

## 마감
- `app/`에서 fresh `npm run typecheck`·`lint`·`npm test -- --run`(base 317/2856 + 증분)·`npm run build`(번들 표 전 라우트, base 128.09/129.40 대비).
- `dev/active/rs6-l1-port/{PROGRESS,REPORT}.md`: AC별 판정 · 37건 대응표 · 예산 표(CP별) · 깨진/바뀐 기존 테스트 대조 · ④b 배치와 INTEGRATE-6 9.2 문구 차이 · 사실/추정/미확인.
- 명시 경로 커밋, amend·rebase 금지. push·merge·원격 쓰기 0. Codex 0. 다른 워크트리 접촉 0. 브라우저 QA 0(뒤 QA 레인).
- 첫 3턴 BRIEF·PROGRESS 커밋. 턴: CP1 30턴 전 · CP2 55턴 전 · CP3 75턴 전 · 90턴부터 새 구현 중단 → 게이트·REPORT. 최대 110턴. 턴이 모자라면 마지막 완료 CP까지 커밋하고 남은 CP를 PROGRESS에 BLOCKED로.
