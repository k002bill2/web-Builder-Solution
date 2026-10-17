# RS7-M1 마무리 REPORT — L5 M1 테스트 · BACKLOG 상태 갱신

base `bcaa9832` · 브랜치 `k002bill2/rs7-m1-close` · 2026-10-17 · 앱(비테스트) 코드 변경 0 · 기존 테스트 수정 0
커밋: `1e78884c`(BRIEF·PROGRESS) · `76bab1e4`(새 테스트 + 변이 로그) · `8afa6a9c`(BACKLOG) · 이 REPORT 커밋

## 0. 판정
- L5 M1 **검출** — 새 파일 `app/src/components/projects/ProjectsRowPriority.test.tsx`(2건) · 변이 3종 모두 RED → 복원 GREEN.
- BACKLOG 7행 갱신 + 새 행 1개(B-RS-18).

## 1. 우선순위 기대값 (근거 = 현재 코드)
- `app/src/features/projects/pendingRows.ts:37` `if (pending?.kind === "start") return …describePending` → 시작 대기가 맨 앞(라벨 `P.retryStart` = "시작 다시 시도").
- `pendingRows.ts:39` inflight → "저장 중…"(버튼 없음) · `:40` dirty → "저장하지 못했습니다" + "다시 저장" · `:41` 그 밖 = 미확인 기록("저장 확인").
- 클릭: `app/src/features/projects/pendingRetry.ts:76` 시작 대기 → `retryPending`(restart = `restartOnce` = starter) · `:77` dirty → `saveAgain`(core.save).
- 기대: 시작 대기 + 코어 dirty → 라벨 "시작 다시 시도" · 클릭 = starter 1회 · core.save 0. 저장 중 + 미확인 기록 → "저장 중…" · "저장 확인" 버튼 0.

## 2. 테스트
- 리그 = `testRig.startedRig`(ProjectsCoreRows.test와 같은 앱 조립). 코어 dirty = `db.failNext("AbortError")` 뒤 save failed. starter는 `restartFlow.restartOnce`만 모듈 mock(나머지 원본)으로 센다.
- 건 1: 시작 대기(restart) + 저장 실패 코어 → "시작 다시 시도" 있음 · "다시 저장" 없음 · "저장하지 못했습니다" 없음 · 클릭 → `restartOnce` 1회(projectId 일치) · `core.save` 0 · alert 표시.
- 건 2: 미확인 기록 + 저장 보류(`db.hold`) 중 코어 → "저장 중…" · "저장 확인" 버튼 0 → 보류 해제 뒤 saved.

## 3. 변이 표 (매번 `git checkout -- <앱 파일>` 복원 · 로그에 `git diff -U0` 헝크 포함)
| 변이 | 위치 | 결과 | 로그 |
|---|---|---|---|
| M1-rows: 시작 대기 판정을 dirty 뒤로 | `pendingRows.ts:37` → `:40` 뒤 | **RED 1**(건 1 — "시작 다시 시도" 버튼 없음) | `logs/mut-M1-rows.txt` |
| M1-retry: `retryRow` dirty를 시작 대기 앞으로 | `pendingRetry.ts:76-77` 순서 교환 | **RED 1**(건 1 — starter 0회 · 라벨은 맞고 동작 불일치) | `logs/mut-M1-retry.txt` |
| M1-saving-record: 기억이 있으면 저장 중 건너뜀 | `pendingRows.ts:39` `&& !pending` | **RED 1**(건 2 — "저장 중…" 없음) | `logs/mut-M1-saving-record.txt` |
- 복원 후 `git status --short -- app/src` = 새 테스트 파일(untracked)만 — 앱 파일 M 0(사실, 명령 출력).

## 4. 게이트 (fresh · `76bab1e4` 위 — 이후 커밋은 문서만)
| 게이트 | 결과 | 로그 |
|---|---|---|
| 새 파일 단독 10회 | 10/10 · 2 passed | `logs/solo-10x.txt` |
| `npm run typecheck` | exit 0 | `logs/gate-typecheck.txt` |
| `npm run lint` | exit 0 | `logs/gate-lint.txt` |
| `npm test -- --run` | 347 파일 / 3035 통과 · exit 0 (base 346/3033 + 1 파일 / +2 테스트) | `logs/gate-test.txt` |
- preview 미기동(실화면 검증 범위 아님) → 포트 정리 대상 0.

## 5. BACKLOG 변경 행 (`docs/06-handoff/BACKLOG.md`만)
- B-RS-06 ✅ PR #27 · B-RS-07 ✅ PR #27 · B-RS-08 🔶(PR #29 5종 + M1 · 남은 U14-b) · B-RS-09 열림 유지 + 재개 조건 · B-RS-15 ✅ PR #28 · B-RS-16 RS7-B QA BLOCKED 1줄 · B-RS-17 ✅ PR #28 · **B-RS-18 신규**(전체 스위트 간헐 실패 — `rs7-flaky-hunt` 결과는 Jarvis 기입).
- 기존 행은 4열 끝에 덧붙이기만(기존 글자 삭제 0).

## 6. 사실 / 추정 / 미확인
- 사실: 3절 RED·GREEN(로그) · 4절 게이트(로그).
- 추정: 없음.
- 미확인: B-RS-18 원인(이 레인 범위 밖).

## 7. 서브에이전트
- 0개 — 변이는 같은 앱 파일을 순차로 바꾸고 되돌려야 하고, BACKLOG는 한 파일이라 병렬 이득이 없었다.
