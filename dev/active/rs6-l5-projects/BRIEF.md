# RS6-L5 BRIEF — `/projects`·프로필 연결 (Developer, 구현)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-l5-projects` (브랜치 `k002bill2/rs6-l5-projects`, base origin/main `aca09805` = L3b PR #21 머지). `app/node_modules` 설치 완료.
병렬 레인: RS6-L4(편집기 UX, 워크트리 `rs6-l4-ux`) — **L4 경로(`components/studio/SaveStatus.tsx`·`ConflictCallout.tsx`·`features/studio/saveStatusText.ts`·편집기 새 대화상자) 접촉 금지.**
승인: MQ-6-1~5·7 A · ADR-004 개정 17. Designer 별도 호출 생략 사유: 행 상태·문구·포커스 명세가 `docs/design/restart/UX-5.md`·INTEGRATE-6 r1 8절에 있음 — QA 게이트에서 실화면 판정.

## 정본
- `docs/04-plan/RS6_INTEGRATE_PLAN.md` **6절 L5 CP1~CP3** · 레인 표 L5 행(쓰기: `features/projects/pendingRows.ts` · `components/projects/**` · `features/profile/restartFlow.ts` · `features/pending/**`).
- `docs/design/restart/INTEGRATE-6.md` r1 8.1(`/projects` 행 "코어 dirty + 편집기 밖" 표시 — r1 8.5 남은 것) · 12.1 · RS6-AC-U16·B2 · `UX-5.md` UX5-AC-08.
- 인계: `dev/active/rs6-l3b-leave/QA-REPORT.md` note 1(**해제 save 실패 시 편집기 밖 실패 표시 없음 — Medium, 이 레인에서 닫기**) · RS6-AC-U11 나머지(`/projects` 행 "저장 중…") · L2 QA 4절 catch 위치(`/projects` 행 `core.link` confirm reject 매핑) · L1 REPORT(`/projects` 진입에 레지스트리 +0.47 이미 실림).

## 범위 (PLAN L5 CP1~CP3 + 인계)
- CP1 행 "저장 확인" → `confirm` 1회 · 성공 포커스(UX5-AC-08) · 편집기 저장 성공 뒤 기억 0(RS6-AC-U16 · RS4-R2 · 코어 `saved` 뒤 `PendingRecord` 해제).
- **CP1b(인계 note 1)**: 코어가 dirty·inflight·failed인 프로젝트 행 표시 — "저장 중…"(inflight) · 실패(해제 save 실패) + "다시 저장"(= 코어 `save`) · 성공 뒤 일반 행 복귀. reject → 결과 매핑(거짓 saved 0). 문구는 UX-5 원문 우선, 새 문장이 필요하면 `features/projects/` 쪽 문구 파일에(L4의 `saveStatusText.ts` 금지) — REPORT에 원문·사유.
- CP2 `PendingStart` 유지 · "시작 다시 시도" → `retryStart`(starter 주입) · `restartFlow` 연결.
- CP3 편집기 밖 이미지 확인(C5 T5 · RS6-AC-B2 단위판) — 코어 바인딩 경유.

## 예산
- `/studio` 정규화 129.09 / 상한 129.13 — **이 레인은 `/studio`·복원 진입 증분 0이 목표**(0.04는 L4 몫). `/studio` 진입 closure 모듈(`memoryProjectRepository` 등)에 코드를 더해야 하면 조작 뒤 청크로 보내고, 그래도 `/studio`가 +0.01 이상 늘면 **멈추고 보고**. **`m2cBaseline.json`·`bundleBudget.test.mjs`·`check-bundle-size.mjs` 수정 금지**(L4와 충돌 방지).
- `/projects` 첫 화면 100 · 진입 125(현재 99.16/108.92) · `/profile` 첫 화면 100(현재 99.56 — 여유 0.44) 안. 넘으면 감량 1회 → 멈춤.

## 규칙
- TDD: CP마다 RED 예측 → PROGRESS → RED 로그 `dev/active/rs6-l5-projects/logs/` → GREEN 커밋. 기존 단언 약화·skip 0.
- 엔진·PageDoc·레코드·스키마·의존성 변경 0. DS 기존 컴포넌트 재사용.
- **Ego Lite(마지막 1회)**: build + preview `--port 4381 --strictPort`. 편집 → 즉시 링크로 `/projects` → 행 "저장 중…" → 저장됨 복귀 · 해제 save 실패 주입이 앱 안에서 어려우면 단위 테스트로 갈음(BLOCKED 사유 기록) · `PendingStart` 행 "시작 다시 시도" · 이미지 행 확인. 1280·390. 정리(IDB 삭제·finish·listTaskSpaces·서버 종료·리슨 0). 5480 무접촉.
- Codex review: 레인 끝 1회(`--scope branch --base aca09805`), 지적 반영 1회까지.
- 서브에이전트 분할: 불필요(행 표시·흐름이 같은 파일 묶음).

## 마감
- fresh `typecheck`·`lint`·`npm test -- --run`(base 331/2957 + 증분)·`build`(전 라우트 표 · `/studio` 증분 0 확인).
- `dev/active/rs6-l5-projects/{PROGRESS,REPORT}.md`: AC 판정(U16·B2·UX5-AC-08·인계 note 1·U11 나머지) · 예산 표 · 실화면 · QA 게이트 인계 · 사실/추정/미확인.
- 명시 경로 커밋, amend·rebase·push 금지. 다른 워크트리 접촉 0.
- 첫 3턴 BRIEF·PROGRESS 커밋. CP1b 45턴 전 · 75턴부터 새 구현 중단 → Ego Lite·Codex·게이트·REPORT. 최대 90턴.
