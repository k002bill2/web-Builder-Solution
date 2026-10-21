# TEST-GAPS-TS BRIEF — 테스트 공백 2건 (B-M2B-05c · B-CI-01) + ADR-008 제출 기록 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-21 (★ 자동 진행 — 테스트만, 앱 동작 변경 0)
worktree `~/orca/workspaces/web-builder-solution/test-gaps-ts` · 브랜치 `k002bill2/test-gaps-ts` · base origin/main `7972a7b6` · `app/` npm ci 완료.

## 범위
1. **B-M2B-05c (TS-AC-16)** — `app/src/components/studio/StudioLayout.tsx:312·315` 두 `useMemo` 의존성(`doc.typeScale` · `shown.typeScale`)을 지키는 테스트가 없다(QA 변이 M4 생존 — `dev/active/typescale-impl/QA-REPORT.md` 5절은 main에 병합돼 있음).
   - 같은 `profileVersion`·다른 `typeScale`인 두 상태 사이를 오갈 때(스냅샷 미리보기 진입/종료/복원 또는 문서 교체) 캔버스에 넘어가는 `kitTokens.type.scale`이 바뀌는지 단언.
   - **RED 증명 필수**: 의존성 2개를 임시로 빼면(변이 M4) 새 테스트가 **전체 스위트에서** FAIL → 되돌리면 PASS. 변이 diff·결과를 `logs/m4-red.txt`·`logs/m4-green.txt`에 tee. 변이는 `git checkout -- app/src/components/studio/StudioLayout.tsx`로 되돌림.
   - 기존 테스트 하네스(StudioLayout을 렌더하는 테스트가 이미 있으면 그 fixture 재사용)를 먼저 찾을 것.
2. **B-CI-01** — `app/src/data/memoryProjectRepository.test.ts:173·229·292`가 KST `"… · 18:00"`을 하드코딩. 구현(`memoryDocBook.ts` `hhmm`, 로컬 시계)은 의도이므로 **앱 코드 수정 금지**.
   - 기대값을 테스트 안에서 로컬 시계로 계산(`new Date(iso).getHours()` 기반)하는 방식 ★. (대안: vitest 설정에 `process.env.TZ` 고정 — 쓰지 말 것, 다른 시간 테스트 의미가 바뀜.)
   - 증명: `TZ=UTC npx vitest run src/data/memoryProjectRepository.test.ts` · `TZ=Asia/Seoul …` · `TZ=America/New_York …` 셋 다 PASS → `logs/tz-*.txt`.
   - 그 뒤 `.github/workflows/ci.yml` test job의 `env: TZ: Asia/Seoul`과 그 주석 줄 제거. README CI 절의 `TZ=Asia/Seoul` 문구·"test job은 TZ=Asia/Seoul로 돈다" 줄도 정정. 액션 SHA·job 이름·다른 줄 변경 금지.
3. **ADR-008 6절 기록 1줄** — `docs/decisions/ADR-008-hosting.md` 6절에 추가: `- 2026-10-21: 영환님이 Cloudflare Enterprise Sales 문의 폼으로 직접 제출(본문 1,669자 축약판 — 질문 4개 원문 유지, 근거 URL은 "요청 시 제공"). 회신 경로 = 계정 이메일·영업 연락. 회신 대기.` 그리고 6절 첫 줄의 "아직 미발송"을 "→ 아래 줄에서 제출"로 정정(옛 문장 삭제 금지, 취소선 또는 정정 표기).
4. **BACKLOG**: B-M2B-05c·B-CI-01 행 끝에 `✅ 닫힘 2026-10-21 TEST-GAPS-TS <커밋 SHA>` 추가(다른 행 수정 금지).

## 규칙
- **앱 소스(`app/src/**` 중 `*.test.*` 아닌 파일) 수정 금지**(변이는 임시). 새 의존성 0. 기존 단언 약화·skip 0 — 바꾼 `expect`는 before/after 표로 REPORT에.
- **git push·pull·fetch 등 원격 명령 일절 금지.** amend·rebase 금지. 커밋은 경로 명시, 항목마다 커밋.
- 첫 2턴 BRIEF·PROGRESS(`dev/active/test-gaps-ts/PROGRESS.md`) 커밋. 마감: fresh `npm run typecheck && npm run lint && npx vitest run --maxWorkers=4 && npm run build`(예산 증분 0 확인 — 테스트만이라 128.79·131.79 그대로여야 함) → `logs/gates.txt`. REPORT.md(결론·RED/GREEN·TZ 3종·예산) · `git status --short` 빈 값.
- 브라우저·preview 불필요. Codex 불필요. 서브에이전트 분할: 불필요(작은 테스트 2건).
- 턴: 최대 60, REPORT 초안 커밋 45턴 전, 52턴부터 마감.
