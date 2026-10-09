# FIX-SIZE-LABEL Developer 브리프 — 가져오기 요약 "파일 크기" 표기 (P2-QA D1 · P3)

- 역할 Developer / Orca managed Claude Code / worktree fix-size-label / base `a75f12e`. `npm ci` 완료. **병렬 레인: FLAKY-TESTS(테스트 안정화 — 다른 파일) 동시 진행.**
- 정본: `docs/design/persistence/P2-SPEC.md` 머리 **"Jarvis 결정 2"** — 1MB(1,048,576B) 미만 `파일 {N}KB`(KB 올림 정수, 최소 1KB) · 1MB 이상 `파일 {N.N}MB`(소수 1자리 올림). `dev/active/p2-qa/QA-REPORT.md` D1(13,115B → "파일 1MB").
- 대상: `app/src/components/projects/ImportProjectFileDialog.tsx:23`(`Math.ceil(file.size / MB)`) + 그 테스트. 표기 함수는 순수 함수로(같은 파일 또는 `features/projectFile/` 안). **다른 파일 수정 0**(FLAKY-TESTS가 테스트 파일을 고칠 수 있음 — 겹침 피하기).
- TDD: RED 예측 PROGRESS → 경계값 테스트(1B=1KB · 1,024B=1KB · 1,025B=2KB · 13,115B=13KB · 1,048,575B=1024KB · 1,048,576B=1.0MB · 1,048,577B=1.1MB · 52,428,800B=50.0MB) → GREEN. RED 테스트 tip 커밋 금지 · 단언 약화 0 · amend·rebase 금지 · 명령 체인 `set -o pipefail`.
- 번들: `/projects`만 소폭 가능 · `/studio` ≤129.65 · 복원 ≤132.68 · `/profile` ≤100 · build 확인.
- **Ego Lite(짧게, 필수)**: build + `vite preview --port 4337` · 창 minimized면 normal · 단색 PNG 프로젝트 → 내보내기 실제 내려받기 → 가져오기 요약 textContent에 `파일 {N}KB` 확인 · clip 캡처 1장(`dev/active/fix-size-label/shots/`) → `deleteDatabase("design-studio")` · 자기 공간만 `finish({keep:[]})` · `listTaskSpaces()` 기록 · 서버 종료·4337 리슨 0. 영환님 창·main 5480 무접촉.
- 마감: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. Codex는 Jarvis 몫. 엔진·계약·docs·lock·CLAUDE.md 수정 0, 새 의존성 0, 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- 턴: BRIEF P0 3턴 전 · 구현 커밋 10턴 전 · Ego Lite 12턴 전 시작 · 20턴부터 게이트·REPORT만 · REPORT 24턴 전. 한국어.
