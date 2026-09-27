# EDITOR-A2-DATA — a2 데이터 레인 (A2-D) Developer 브리프 **발행본**

> 발행: Jarvis, 2026-09-27 · 영환님 ★A. 상위 문서 `docs/06-handoff/EDITOR-A2_BRIEF.draft.md`(Designer 초안)의 **4절 A2-D 행·5~10절을 그대로 따른다.** 이 문서는 그 초안을 A2-D 레인용으로 확정하고 기준값·경계만 덧붙인다. 초안과 이 문서가 다르면 이 문서가 우선.

## 1. 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 작업 공간 `editor-a2-data`, 브랜치 `k002bill2/editor-a2-data`, 기준 main **`2c30862`**(= origin/main). 포트 **4337**.
- 목표: 편집 문서를 **만들고(`startDoc`) · 읽고(`getDoc`) · 저장(`saveDoc`)** 하는 데이터 계층 + "편집 시작" 연결. 이 레인이 끝나면 "B안으로 편집 시작" → `/studio/:projectId`에 **실제 문서가 생긴 상태**로 도착한다(E-S03 대신 — 셸의 문서 표시 자체는 A2-S 몫이라 이 레인은 E-S03가 아닌 "문서 있음" 분기로 들어가는지만 확인).

## 2. 기준 (SPEC r4.3)
- `docs/design/2a-05/SPEC.md` 8.1 · 8.2 · **8.2.1(정본)** · 8.3 · 8.3.1 · 11.2 E-AC-11·40·41·42 · 12.3 · 변경 이력 r4~r4.3. 변형 표 `docs/design/2a-05/VARIANT-MAP.md`.
- **확정된 결정**(다시 묻지 말 것): Q-17 A(3인자) · Q-18 A(`motion?` 전달 · 정의 상한) · Q-21 A(표 한 곳 · 알림) · Q-24 A(`@source not "./engine"` + CSS 전후) · **r4.3**: 8.2.1 (a)(b) 알림 문구 Designer 안 채택 · **첫 확정 알림**(J-S11 확장).
- 미결정 Q-19·20·22·23은 a2 무관 — 코드로 정하지 않는다.

## 3. 범위 (커밋 순서 = 체크포인트)
- **C1 가드·CSS (첫 커밋, 단독 병합 가능해야 함)**: `engine/engineImportGuard.test.ts` 허용 목록(초안 4절: `pages/StudioPage.tsx` · `components/studio/**` · `features/studio/**` · `data/startDocWrite.ts`) + `app/src/index.css` `@source not "./engine"` + 빌드 CSS 크기·해시 전후를 `logs/c1-css.txt`에. CSS가 바뀌면 바뀐 규칙을 적고 **멈춤**.
- **C2 엔진 `motion?`(범위 예외 2파일, Jarvis 확정)**: `engine/doc/createDocFromCandidate.ts` + `createDocFromCandidate.test.ts`만. RED(컴포저 L2 → 문서 L2, 정의 상한 초과 시 상한) → GREEN. **기존 엔진 테스트 단언 불변.**
- **C3 변형 표·어댑터**: 새 `data/engineVariantMap.ts`(표 리터럴은 이 파일에만) · 새 `data/startDocWrite.ts`(어댑터 · `createDocFromCandidate` 호출 · 엔진 예외 → 쓰기 0). 8.2.1 가드 테스트(bound 행 = `SECTION_LIBRARY` 키 · 목적지 ⊂ 엔진 레지스트리 · 표 리터럴 파일 1개) · 픽스처 6개 × 3안 성공.
- **C4 저장소**: `data/projectRepository.ts`(`UNKNOWN_VARIANT` · 바뀐 쌍 목록) · `data/memoryProjectRepository.ts`(`getDoc`·`saveDoc`·`startDoc` — 8.3 판정 순서 · 8.3.1 경쟁·멱등 · `delay`/`fail` `phase` 주입 · `DocStart.updatedAt` = 주입 `now`).
- **C5 편집 시작 연결(마지막)**: `features/profile/CandidatesSection.tsx` — 버튼 onClick에서 조작 뒤 청크 로드 → `startDoc` → 성공 시 `/studio/:projectId`(state: 바뀐 쌍) · 실패 코드별 프로필 알림(8.3.1 표 · 8.2.1 (b)). 바뀐 쌍 알림은 이동 뒤 1회.
- **C6 첫 확정 알림(r4.3, P3)**: `features/compare/useCompareBoard.ts`의 `projectCreated` state를 **첫 확정에도** 넘긴다(현재 `toNew = toNewProject && confirmed !== undefined`만). 이 1파일 + 해당 테스트(`pages/CompareBoardTarget.test.tsx`에 케이스 추가)만 — 보드 파일 수정 금지 규칙의 **명시적 예외**. RED → GREEN.

## 4. 번들 (착수 기준 = main `2c30862` 실측, `logs/base-build.txt`로 먼저 커밋)
- 알려진 값: `/profile` 99.60 / 124.44(여유 첫 화면 0.40 · 진입 직후 0.56) · `/catalog` 99.64(0.36) · `/compare` 98.74 / 121.36 · `/studio/:projectId` 90.73 / 103.73 · 공통 89.34.
- **어댑터·표·`createDocFromCandidate`·(b) 문구는 조작 뒤 청크**("편집 시작" onClick 로드). `/profile` 청크 증가 허용치: C5 연결분만(L3 +0.03~0.08). C6은 보드 청크(`/compare`).
- **상시 판정**: 커밋마다 build. 어느 시나리오든 첫 화면 여유 < 0.3 또는 진입 직후 여유 < 0.3 이 되면 **그 커밋을 남기고 즉시 멈춤·REPORT**(예산·분류 변경 금지). 공통 증가 0.

## 5. 검증
- TDD RED→GREEN(RED 로그 `logs/`). 커밋마다 typecheck · lint · 표적 test · build. **전체 vitest는 마지막에 1회.**
- 4337 실제 흐름 1회(agent-browser CLI 스크립트 1개로 — `docs/qa/a1-beta-flow/flow.mjs` 참고 · 새 의존성 금지): 보드 첫 확정 → 알림 확인 → 3안 → 편집 시작 → `/studio/:projectId`(문서 있음 분기) · 캡처 1280 1장. 끝나면 자기 PID만 종료 + lsof.
- Codex: `review --scope branch --base 2c30862` 1회(최대 3라운드). 한도·실패면 BLOCKED 기록 후 진행.

## 6. 운영
- 서브에이전트 분할: **불필요**(rate limit 이력 — 메인 단독).
- `--max-turns` 50 · **38턴부터 REPORT 우선**. 커밋마다 `dev/active/editor-a2-data/PROGRESS.md` 체크.
- 금지: `docs/design/`·`design/` 수정 · 새 의존성 · 단언 약화 · 위 예외 밖 engine·보드 파일 수정 · push·병합·삭제 · fable 무접촉.
- REPORT `dev/active/editor-a2-data/REPORT.md`: SHA · 파일 · AC별 판정 · RED/GREEN · 번들 전후 표 · CSS 전후 · Codex · 남은 위험.
