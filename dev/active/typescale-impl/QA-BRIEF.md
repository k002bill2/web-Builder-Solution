# TYPESCALE-IMPL QA-BRIEF — 독립 정적 QA (변이 포함)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-21
worktree `~/orca/workspaces/web-builder-solution/typescale-impl` · 브랜치 `k002bill2/typescale-impl` · tip `8bd6657d`(origin/main `5d1bf9f7` 병합 — CI 워크플로·B-CI-01 포함) · node_modules 설치됨.
정본 `docs/design/m2b/TYPESCALE-SPEC.md` r1(4.1 TS-AC · 4.2 T0~T4 · 6 위험) · 개발 기록 `dev/active/typescale-impl/{BRIEF,BRIEF-T4,PROGRESS,REPORT}.md` · ADR-004 개정 22.

## 최우선 판정 (이 하나가 FAIL이면 전체 FAIL)
**기존 문서(typeScale 필드 없음)의 결과가 main과 달라지는 경로가 있는가** — 렌더 토큰·정적 HTML·React zip·site.json·저장 검증·가져오기에서 필드 없는 문서가 main과 다른 결과를 내면 FAIL. 또한 typeScale 값이 범위(1~2) 밖이거나 비숫자일 때 저장·가져오기가 조용히 받아들이면 FAIL.

## Jarvis가 측정한 수치 (재현할 것 — 개발자 수치를 믿지 말 것)
- tip `9d45bdac`: typecheck·lint 0 · test 384 files / 3459 passed(`--maxWorkers=4`) · build exit 0 · 정규화 `/studio` 128.79 · 복원 131.79(판정 128.82·131.82) · 렌더 JS 84.38.
- 병합 tip `8bd6657d`는 앱 코드 변화 없음(병합분은 `.github/`·README·docs·dev만) — 그래도 fresh 게이트 1회 필수.

## 할 일 (항목마다 `dev/active/typescale-impl/QA-PROGRESS.md` 갱신 + 커밋)
1. (2턴 안) QA-PROGRESS.md 체크리스트 커밋.
2. fresh 게이트: `cd app && npm run typecheck && npm run lint && npx vitest run --maxWorkers=4 && npm run build` → `logs/qa-gates.txt` tee. 예산 수치 기록.
3. TS-AC 표 재현: REPORT 0절 판정표의 각 TS-AC를 테스트 파일:줄로 근거 확인(통과/부분/미검증). TS-AC-13은 개발자 로그(`logs/t4-ego-run1*.txt`) 재판독만 — 브라우저 재실행 금지.
4. 단언 약화 점검: `git diff 8d65fa9e HEAD -- 'app/**/*.test.*'`에서 삭제·변경된 `expect` 줄을 표로(이전→이후·정본 근거). T3의 CompareDialog/compareText 캡션·"(구조안)" 접미 삭제는 SPEC 의도대로인지 판정.
5. 변이 5개(각각 적용 → 해당 테스트 실행 → FAIL 확인 → `git checkout -- app/` 되돌림, 결과 표):
   - M1 `validatePageDoc` typeScale 범위 검사 제거(또는 상한 2 → 3).
   - M2 `validatePageDoc` 재구성에서 typeScale 보존 줄 제거.
   - M3 `memoryDocBook` start에서 plan typeScale 전달 제거.
   - M4 `StudioLayout` useMemo 의존성에서 typeScale 제거.
   - M5 `docKitTokens`가 typeScale 인자를 무시하고 프로필 비율 사용.
   - 생존 변이는 "테스트 공백"으로 기록(고치지 말 것).
6. QA-REPORT.md: 첫 줄 판정(PASS / 조건부 PASS / FAIL) · 최우선 판정 근거 · 게이트·예산 표 · TS-AC 표 · 단언 표 · 변이 표 · 머지 전 필수 / 백로그 노트 분리.

## 규칙
- **앱 코드·테스트 수정 금지**(변이는 임시, 되돌림 확인). 쓰기 경로 = `dev/active/typescale-impl/QA-*` · `dev/active/typescale-impl/logs/qa-*`만.
- **git push·pull·fetch 등 원격 명령 일절 금지.** amend·rebase 금지. 커밋은 경로 명시.
- 브라우저·preview 실행 금지(정적 QA). 서브에이전트 분할: 불필요.
- 턴: 최대 40, QA-REPORT 초안 커밋 26턴 전, 32턴부터 마감, 남은 항목은 BLOCKED. 마감 시 `git status --short` 빈 값 · `git diff -- app/` 빈 값.
