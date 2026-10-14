# RS23-IMPL — B-RS-02 create 잠금 확인 · B-RS-03 /projects 미확인 게이트 구현

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. Jarvis에게 보고. 설계 = `docs/design/restart/SPEC-3.md` r0.3(Codex r1~r4, r4 approve) · 결정 = `docs/design/restart/MQ-3.md`(MQ-3-1~4 모두 A, MQ-3-4는 2026-10-15 사용자 재확인).
- 기준: main `e3e22520`(ADR-004 개정 16 포함)에서 전용 worktree를 만들고 설계 브랜치 `k002bill2/rs23-fix`(문서만, `app/` 변경 0)를 병합한 뒤 시작한다. 병합에서 충돌이 나면 멈추고 보고한다.
- 구현 순서·수용 기준은 SPEC-3 8절(CP0~CP4)과 7절(RS3-AC-01~13, 07b~07e, 08b)이 정본이다. 이 브리프는 범위·관문·금지만 정한다.

## 쓰기 범위 (하드 경계)
1. `app/src/data/memoryProjectRepository.ts`: `startDoc` 가드 조건 **1곳만** `(mode === "restart" || !docs.docOf(projectId))`로 바꾼다(SPEC-3 3절 4). 인터페이스·오류 타입·`localSync.guardWrite` 본문은 변경 0.
2. 기억 모듈 신설(예: `app/src/features/projects/unconfirmedStart.ts`, import 0) + `app/src/features/profile/restartFlow.ts`·`RestartDialog.tsx`·`restartText.ts`·`CandidatesSection.tsx`의 판정·문구(SPEC-3 5.1, 6절 3-1·3-2). `infra.ts`의 `TAB_REASON`에 `CLEARED_TAB` 추가.
3. `/projects` 행 분기(`projectListView.ts`·`ProjectRow.tsx`) + 재시도 본문은 조작 뒤 청크, `check-bundle-size.mjs`에 `/projects` afterAction 등록(SPEC-3 5.2).
4. 위에 대응하는 테스트 + `dev/active/rs23-impl/{PROGRESS,REPORT}.md`. 다른 경로를 바꿔야 하면 멈추고 이유를 보고한다.

## 명시 금지
- `/studio` 화면(`StudioPage`·`StudioLayout`·`useDocSave`·`useAutosaveScheduler`) 변경 금지 — MQ-3-1 B 범위. history 재진입(RS3-R1)은 미해결로 남긴다.
- 새 스키마·저장소/엔진 인터페이스·의존성·백엔드 금지. 확인용 추가 쓰기(같은 내용 `saveDoc`) 금지(SPEC-3 6절 3-2).
- `restartLock.test.ts:136-142` 단언 유지(이름 문구만 수정 가능). 기존 단언을 바꾸면 보호하던 의미와 근거를 REPORT에 적는다. 테스트 단순 삭제 금지.
- 판정선·`m2cBaseline.json`·`bundleBudget.test.mjs` 수정 금지. push·merge·삭제 금지. 다른 세션 파일 무접촉.

## 예산 관문 (ADR-004 개정 16 — SPEC-3 9절 raw 수치보다 우선)
- 판정은 해시 정규화 gzip(`normEagerKb`)이다: `/studio` 일반 **128.50 + 0.03 → 판정선 128.53** · 복원 진입 **131.48 + 0.03 → 131.51**. raw(129.87·132.91)는 참고값이다.
- `/profile` 첫 화면 ≤100 · 진입 직후 ≤125(base 대비 증분 0 목표) · `/projects` 첫 화면 ≤100 · 진입 직후 ≤125.
- **CP0(코드 커밋 전)**: base 빌드 출력 기록 → 스파이크 (i) 가드 조건만 · (ii) (i) + 행 분기·기억 모듈을 빌드해 수치를 REPORT에 남긴다. 넘으면 감량 1회, 그래도 넘으면 측정·REPORT를 커밋하고 멈춘다(판정선 수정·MQ-3-1 B 자동 전환 금지).

## 실행/수용
- TDD RED→GREEN, CP1~CP4 체크포인트마다 커밋한다. RED 우선 대상: RS3-AC-01·04(CP1), 03·05·06·07b·07c·07d·07e·08b(U)(CP2), 07·13(CP3).
- `STALE_DOC` 재시도 = 커밋 0 추론을 테스트로 고정한다(같은 키가 커밋됐으면 재생되어 STALE이 나지 않음).
- 게이트: `npm run typecheck` · `npm run lint` · `npm test -- --run` · `npm run build` 4종 + `noHardcodedStyle`·브랜드 격리 가드 + 기억 모듈 import 간선 가드(RS3-AC-12).
- 브라우저 QA는 Ego Lite만(Playwright·Puppeteer 설치 금지). `npm run build` + `vite preview`, 앱 안 클릭으로만 이동(메모리 store 새로고침 함정). 대상: RS3-AC-07·08·08b·09·10(E)·13. 다른 탭 차단은 탭 A를 실제로 편집·저장해 writer 잠금을 잡은 뒤 검증한다.
- 완료 게이트: Codex review(`--scope branch --base <분기점>`) 최대 3라운드. 검증을 실행하지 않았으면 미실행으로 적는다.
- 서브에이전트: CP1~CP3은 순차 의존이라 분할 불필요.
- 결과 보고: 로컬 SHA, 변경 파일, 테스트 증감, CP0·최종 빌드 수치(base·브랜치), 캡처 경로, 남은 위험(RS3-R1·새로고침 시 미확인 편집 손실 — 안전 경고로만 처리됨).
