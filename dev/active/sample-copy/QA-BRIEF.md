# SAMPLE-COPY QA BRIEF — 문구 교체 실화면 확인 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-25
같은 worktree `~/orca/workspaces/web-builder-solution/sample-copy` · 브랜치 `k002bill2/sample-copy` · HEAD(이 브리프 직전) Jarvis 게이트 커밋.
쓰기 경로 = `dev/active/sample-copy/qa/`만. 앱 코드·테스트·docs 수정 금지. **다운로드한 zip 등 바이너리는 커밋 금지**(sha256·엔트리 목록만 로그로).

## 0. Jarvis가 이미 확인한 것 (다시 돌리지 말 것)
- 게이트 `logs/gates-j.txt`: typecheck 0 · lint 0 · vitest 390 files / 3492 passed · build 0 · `/studio` 128.83 · 복원 131.83(판정 통과).
- 문구 전/후 표 = `REPORT.md` C1~C9 · 가드 `app/src/test/noPublishCopy.test.ts` 변이 확인 완료.

## 1. 실화면 (ego-browser만, 1280 한 폭)
- `cd app && npm run build && npx vite preview --port 4399 --strictPort`(시작 전 LISTEN 기록, 점유면 4398). 새 TaskSpace, 앱 안 클릭으로만 이동, 네이티브 `<dialog>`는 `dialog[open]`. 선례 흐름·스크립트: `dev/active/sample-bundle/qa/scripts/qa-sample.mjs`(게이트 통과 경로: 보정값 v2 → B안 새로 시작 → SEO 입력).
- 확인:
  1. `/studio` 내보내기 영역 버튼 글자 = "PNG 내려받기" · "디자인 샘플 내려받기" · "HTML 파일 1개 내보내기" · "HTML 샘플 묶음(zip) 내보내기" · "React 코드 샘플(zip) 내보내기" (순서 포함) — 스크린샷.
  2. 페이지 정보 패널 대표 주소 도움말 = "샘플에는 대표 주소가 필요하지 않습니다" — 스크린샷.
  3. "HTML 샘플 묶음(zip) 내보내기" 1회 실행 → 결과 줄 문구 "HTML 샘플 묶음(zip)을 만들었습니다…" 확인 → 폴백 링크로 zip 확보 → `unzip -p … LICENSES.md`에서 "샘플 파일(index.html)" 포함·"사이트 파일" 0 확인(zip은 저장소 밖 `$TMPDIR`).
  4. 화면 전체 텍스트(`document.body.innerText`)에서 "발행"·"정적 사이트"·"게시" 0건(`/studio` 내보내기 열린 상태 · 스냅샷 대화상자 열린 상태 각 1회).
  5. (시간 남으면) `/compare` 보드에서 푸터 사업자정보 경고가 보이는 상태를 만들 수 있으면 "실제 사이트로 쓰려면 사업자정보가 있는 푸터가 필요합니다" 확인. 15턴 안에 상태를 못 만들면 "단위 테스트 `boardWarnings.test.ts`로 대체"로 기록하고 넘어감.
- 콘솔 error 0 수집.

## 2. 마감
- `qa/QA-REPORT.md`: 첫 줄 판정(PASS / PASS with notes / FAIL) · 항목 1~5 결과표 · 결함(재현 절차) · 로그·스크린샷 경로.
- preview 종료 + LISTEN 0줄 기록 · TaskSpace 페이지 정리 · `qa/` 커밋(바이너리 제외) · `git status --short` 빈 값.

## 규칙
- git 원격 명령 금지 · 서브에이전트 금지. 실행 상한 약 15분. 최대 50턴.
