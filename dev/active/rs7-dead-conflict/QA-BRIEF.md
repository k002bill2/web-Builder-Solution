# RS7-A QA BRIEF — 도달 0 충돌 경로 제거 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs7-dead-conflict` (tip `99e33ac8`, base `73289c90`). Developer 보고 `dev/active/rs7-dead-conflict/REPORT.md`(CP0 전수표 · CP1 제거 표 · `/studio` 128.66 · 340/3018).

## 검증 (최우선 = 지운 것이 정말 도달 0이었나)
1. **CP0 독립 재증명**: `git show 73289c90:app/src/...` 기준으로 `STALE_DOC` 생산자 전수(비테스트 10파일)와 `useAutosaveScheduler` phase `stale` 진입 조건을 직접 추적. 특히 `useDocSave.save`·`core.save()` 밖으로 STALE_DOC가 reject되는 경로(io.save 밖 throw 후보 `images()`·`hashDoc`·`retainedIds`·`align`) — 임시 테스트로 확인 후 삭제.
2. **제거 범위**: `git diff 73289c90 -- app/src` 전부 대조 — reason `"stale"`(stale 행·SaveActions reload·pendingRetry)·restartFlow·RestartDialog·ExportAfter·`memoryDocBook.resolveConflict`(공개 메서드) 무접촉. 지운 테스트 −9건 표가 "도달 0 경로 전용"이고 살아 있는 동작의 단언을 지우지 않았는지 행마다 판정.
3. **회귀 변이(임시, 매번 `git checkout -- app/`)**: 스냅샷 복원 STALE_DOC 처리 제거 · stale 행 reason 매핑 제거 · discard reload 제거 → 기존 테스트 FAIL 확인.
4. **예산**: build fresh — `/studio` 128.66 · 복원 131.64 · raw ≤ 130.5 · 기준선 파일 하향값 = 실측 · `check-bundle-size.mjs` 무변경.
5. **실화면(짧게)**: build + preview `--port 4389 --strictPort`. 2탭 stale 행 → 버리고 새로고침 · 편집 → 링크 이탈 → `/projects` → **IDB 마지막 편집 확인**(Developer 미확인) · 스냅샷 복원 1회. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`.
6. fresh 게이트: typecheck·lint·test(340/3018).

## 판정
- 도달 경로가 있던 코드를 지웠거나, 살아 있는 동작의 단언을 지웠으면 FAIL.

## 규칙
- 앱·테스트 수정 커밋 금지. push·원격 쓰기·다른 워크트리·Codex 금지. 5480 무접촉.
- **마지막 커밋 직전 필수: preview 서버 종료 → `lsof -nP -iTCP:4389 -sTCP:LISTEN` 출력 0을 QA-REPORT에 기록.**
- `dev/active/rs7-dead-conflict/{QA-PROGRESS.md, QA-REPORT.md}` 명시 경로 커밋. 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋. QA-REPORT 초안 30턴 전. 최대 45턴.
