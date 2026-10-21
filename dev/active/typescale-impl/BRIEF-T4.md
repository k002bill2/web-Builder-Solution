# TYPESCALE-IMPL BRIEF-T4 — 문서 정정 · BACKLOG · Ego TS-AC-13 (Developer, 짧게)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-21
worktree `~/orca/workspaces/web-builder-solution/typescale-impl` · 브랜치 `k002bill2/typescale-impl` · tip `9d45bdac` · node_modules 설치됨.
상위 브리프 `dev/active/typescale-impl/BRIEF.md`(규칙 승계) · 정본 `docs/design/m2b/TYPESCALE-SPEC.md` r1 4.2 T4.

## 현재 상태 (Jarvis 확인)
- T3 병합 완료: `3a4dd1fb`(= `1a2aa779` 병합). ADR-004 **개정 22**(영환님 "1A") 커밋 `3e5dfbc7` — 기준선 `/studio` 128.79 · 복원 131.79(판정 128.82 · 131.82).
- Jarvis fresh 게이트(tip `9d45bdac`): typecheck·lint 0 · test 384 files/3459 passed(`--maxWorkers=4`) · build exit 0 · 렌더 JS 84.38. 로그 `logs/adr22-*.txt`.
- 이 레인에서 **앱 코드(`app/src`) 변경 0**이 목표. 결함을 발견하면 고치지 말고 REPORT에 기록.

## 할 일 (항목마다 커밋, 경로 명시 `git commit -- <paths>`)
1. PROGRESS.md 갱신: T3 → [x](병합 `3a4dd1fb` · 개정 22 `3e5dfbc7`), T4 하위 항목 체크리스트 추가 → 커밋(2턴 안).
2. 문서 정정(옛 문장 삭제 금지 — "before → after + 근거" 형식, 정정 표기):
   - `docs/design/m2b/SPEC-COMPARE3.md` F10(23행) · 106·110·135행 근처의 MQ-M2B5-2 A 전제(비율 미반영·"(구조안)" 접미) — T3로 해소됨을 표기.
   - `docs/design/m2b/MQ-M2B5.md` MQ-M2B5-2 — B-M2B-05(TYPESCALE ★B)로 대체됨 기록.
   - `docs/design/m4b/REACTZIP-SPEC.md` 2.3.1-1: "`ExportDoc` = `PageDoc`과 같은 필드 집합" → "선택 필드 `typeScale` 제외"(정본 TYPESCALE-SPEC 186행 그대로 — ExportDoc에 새 키 없음, 비율은 kitTokens 값으로만 반영).
   - SPEC-COMPARE3 2.4-2·2.5도 정본 186행 범위에 포함.
   - TYPESCALE-SPEC 상태줄에 구현·개정 22 기록 1줄.
3. `docs/06-handoff/BACKLOG.md`: B-M2B-05 행 `✅ 닫힘 2026-10-21 TYPESCALE-IMPL`(커밋 SHA들 · 개정 22) · 새 행 **B-M2B-05b**(편집기 비율 UI — 사용자가 편집 중 비율 변경, `/studio` 진입 증분은 새 개정 필요 명시)를 **파일 끝에 추가**(다른 행 수정 금지).
4. Ego 실화면 TS-AC-13 1회: `npm run build && npx vite preview --port 4399 --strictPort` → B 또는 C안(typeScale ≠ 프로필)으로 편집 시작 → 편집 캔버스 제목 비율이 그 안의 값으로 그려짐 확인(계산된 font-size 등 수치 기록). 모든 stdout은 `dev/active/typescale-impl/logs/t4-ego-*.txt`로 tee. 끝나면 preview 종료 + `lsof -nP -iTCP:4399 -sTCP:LISTEN` 결과(0) 기록. 25턴 안에 안 되면 BLOCKED로 기록하고 마감.
5. REPORT.md 0절 결론 갱신(T3·T4 완료, 개정 22 수치, TS-AC 판정표 업데이트) · PROGRESS 전부 체크.
6. 마감: `git status --short` 빈 값(logs 포함 커밋).

## 규칙
- **git push·pull·fetch 등 원격 명령 일절 금지.** amend·rebase 금지.
- 앱 코드·테스트·`m2cBaseline.json`·ADR-004 수정 금지(이 레인 쓰기 경로 = `docs/design/m2b/` · `docs/design/m4b/REACTZIP-SPEC.md` · `docs/06-handoff/BACKLOG.md` · `dev/active/typescale-impl/`).
- Codex 리뷰 불필요(문서만). 서브에이전트 분할: 불필요(문서 4개 + 브라우저 1회).
- 턴: 최대 50, REPORT 초안 커밋 35턴 전, 42턴부터 마감.
