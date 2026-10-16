# STUDIO-PRELOAD-SLIM BRIEF — preload 중복 제거 + polyfill off 정식 적용 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17 (영환님 "1" — 감량 2건만 main 적용, CP4 보류)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/studio-preload-slim` (브랜치 `k002bill2/studio-preload-slim`, base origin/main `92522714`). `app/node_modules` 설치 완료.
근거: `dev/active/rs4-cp4-measure/REPORT-M2.md`(후보 1·2 실측, 주의 절), 측정 패치 `dev/active/rs4-cp4-measure/patches/m2-combo-1-2.patch`(측정용 — 주석·타입 최소, 그대로 커밋 금지).
Designer 생략 사유: UI·문구 변경 없음(빌드 설정).

## 목표
- `app/vite.config.ts`에 (1) `build.modulePreload.resolveDependencies` — JS 호스트 청크에서 호스트·엔트리의 정적 import 닫힘 청크를 preload 목록에서 제외, **HTML 호스트(`hostType !== "js"`)는 그대로 반환** (2) `build.modulePreload.polyfill: false`.
- 측정 패치 로직을 읽기 쉬운 코드로 정리(필요 시 별도 모듈 `app/scripts/` 또는 `app/vite/` 아래 순수 함수로 분리해 단위 테스트 가능하게). 타입·주석으로 Vite 내부 순서 의존(generateBundle pre 훅)을 명시.
- 기대 수치(REPORT-M2 조합): `/studio` 정규화 ≈128.09 · raw ≈129.40 · 복원 ≈131.07/132.43, 증가 라우트 0. 실측이 크게 다르면 원인을 REPORT에.

## 테스트 (TDD)
1. 순수 함수 단위 테스트: 정적 닫힘 계산·필터·HTML 호스트 통과.
2. **빌드 산출물 가드 테스트**(조용한 무효화 방지): build 결과(`dist/`)에서 ① JS 청크의 preload 의존 목록에 호스트 정적 닫힘 청크가 없다 ② `dist/index.html`에 react 등 엔트리 정적 의존 `modulepreload` 링크가 유지된다 ③ polyfill 코드가 엔트리에 없다. 기존 번들 스크립트 테스트 관례(`app/scripts/*.test.mjs` 등)를 따르고, 실행 방법을 REPORT에.
3. RED 예측·결과를 PROGRESS에 → GREEN. RED만 있는 tip 커밋 금지. 기존 단언 약화 0.

## 기준선
- ADR-004 개정 16 결정 5 관례: 감량이므로 `scripts/m2cBaseline.json` `normEagerKb`(및 `eagerKb`)와 `bundleBudget.test.mjs` 기대값을 **실측값으로 같은 커밋에서** 갱신해야 판정선이 내려가 여유가 고정되는지 확인하라. 관례상 감량 시 기준선을 내리지 않는 것이 맞다면 수정하지 말고 REPORT에 근거(ADR 절)를 적어라 — 판단 근거 없이 기준선·판정 로직 변경 금지. ADR 본문 수정 금지(Jarvis 몫).

## Ego Lite (짧게, 동작 변화 0 확인)
- `npm run build` + `npx vite preview --host 127.0.0.1 --port 4371 --strictPort`(dev 서버 금지, 포트 비었는지 먼저 확인). 카탈로그 → 프로필 → 3안 → 편집 시작 → `/studio` 편집·"이 브라우저에 저장됨" → 새로고침(복원 진입) 뒤 편집 유지. 콘솔 오류 0·네트워크에서 modulepreload 정상. 캡처 ≤2장 `dev/active/studio-preload-slim/shots/`.
- 끝나면 `deleteDatabase("design-studio")` · 이 레인 창·탭 `finish({keep:[]})` · `listTaskSpaces()` 재확인 · 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉. 브라우저 도구가 막히면 BLOCKED로 적고 나머지 마감.

## 마감
- `app/`에서 `npm run typecheck`·`npm run lint`·`npm test -- --run`·`npm run build` fresh, exit·수치(base 315 files / 2842 tests + 증분)·번들 표(전 라우트 base 대비)를 REPORT에.
- 산출물 `dev/active/studio-preload-slim/{PROGRESS,REPORT}.md`. 명시 경로 커밋, 체크포인트마다 커밋. amend·rebase 금지.

## 금지
- 앱 기능 코드·문구·엔진·계약·lock·CLAUDE.md·ADR·SPEC 수정 0. 새 의존성 0. push·merge·원격 쓰기 0. 다른 워크트리 접촉 0. Codex 0.
- 첫 3턴 BRIEF·PROGRESS 커밋. 50턴부터 새 구현 중단 → 게이트·REPORT.
서브에이전트 분할: 불필요(단일 설정 파일 + 테스트).
