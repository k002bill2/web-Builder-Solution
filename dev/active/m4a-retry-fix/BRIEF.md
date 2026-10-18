# M4-a-6 BRIEF — B-M4A-08 렌더 청크 로드 실패 뒤 같은 탭 재시도 복구 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "1 진행 · 자동 진행")
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m4a-retry-fix` (브랜치 `k002bill2/m4a-retry-fix`, base origin/main `a0068764`). node_modules 설치 완료.
근거: `docs/06-handoff/BACKLOG.md` B-M4A-08 · `dev/active/m4a-qa/QA-REPORT.md` 8절 L2(진단 r11: 같은 청크 fetch 200인데 `import()`가 "Failed to fetch dynamically imported module" — 실패한 동적 import가 모듈 맵에 남음).
사실: `features/studio/exportFlow.ts:32`에 이미 `retryableImport`(새 URL로 다시 받기)가 있다 — **QA가 막힌 청크가 이 경로 밖인지 먼저 확정**하라.

## 할 일
1. **CP0 진단(코드 추적)**: 내보내기 클릭 → 동적 import 체인 전부(exportFlow·ExportAfter·staticHtml·zip·render 문서 로더 등) 표. 각 import가 `retryableImport`를 타는지. QA L2에서 막은 청크 식별. 이미 다 타는데 실패했다면 `retryableImport` 자체 결함(쿼리 변경이 같은 모듈 그래프 하위 import엔 안 먹는 문제 등) 확인.
2. **수정(TDD)**: 재시도 가능한 모든 내보내기 import를 같은 재시도 경로로. 재시도로 못 고치는 경우(하위 정적 import가 캐시된 실패) **정직한 안내** — alert 문구에 "새로고침한 뒤 다시 시도하세요"(저장 상태가 안전할 때만 — 저장 중이면 저장 먼저 안내, 기존 SaveStatus 규칙 따름). 거짓 성공·거짓 "다시 시도" 0.
   - RED: import 실패 1회 뒤 재시도 성공 · 2회 연속 실패 시 새로고침 안내 · 재시도 시 다른 URL 요청.
3. 문구 키는 기존 문구 파일 위치 규칙 따름(조작 뒤 청크). 새 문구가 진입 청크(ExportRetryAlert)에 들어가면 **증분 실측** — `/studio` 128.71 · 복원 131.69, 개정 18 남은 몫 0.09 안에서 기준선 실측 갱신, 넘으면 멈춤.
4. Ego Lite 1회(preview `--port 4397 --strictPort`): QA L2와 같은 방식으로 청크 차단 → 해제 → 다시 시도 → 성공(또는 새로고침 안내) 확인.
5. fresh typecheck·lint·test·build · Codex adversarial 1회(`--scope branch --base a0068764`) · 반영 1회.

## 규칙
- 쓰기 경로: `features/studio/exportFlow*`·`components/studio/Export*`·`features/studio/{staticHtml,zip}/**`(import 배선만)·관련 테스트·기준선 2파일(예산 규칙일 때만)·`dev/active/m4a-retry-fix/`. 그 밖 0. 새 의존성 0. 단언 약화·skip 0.
- 최대 60턴, 48턴부터 마감.

## 공통
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 2턴 BRIEF·PROGRESS 커밋, **REPORT 초안(잠정 결론 줄 포함) 10턴 안**, 이후 항목마다 갱신 커밋. 사실/추정/미확인 구분.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 0 기록. 마감 전 `git status --short` node_modules 외 빈 값.
- Codex는 `--help` 없이 1회만.
