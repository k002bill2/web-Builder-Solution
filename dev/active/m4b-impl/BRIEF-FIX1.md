# M4-b-2 BRIEF FIX1 — 문안 반영 · QA 1차 P1~P3 · 원격 자동 허용 제거 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 · 영환님 "1")
대상: 이 워크트리 tip(QA 1차 `a4c70827` 이후). 근거 `QA-REPORT.md`(판정 표 · 1절 예산 · 2절 부분 8 · 3절 M6 · 5절) · `COPY.md`(확정 문안).

## 할 일 (TDD, 항목마다 커밋)
1. **문안**: `COPY.md`를 글자 그대로 반영 — `reactZipLabel.ts`(버튼) · `reactZipNotes.ts`/`reactZipText.ts`(결과 줄·다음 할 일·README·LICENSES 1·2·4절). `TODO(copy)` 0. {files}·{transitiveLicenseTable}은 실제 값(lock 상수와 대조 테스트). 문구 단언은 COPY.md 원문 일치로 강화.
   - **예산 주의**: 복원 진입 131.81 = 판정선(여유 0, QA 1절). 버튼 라벨 모듈은 진입 청크다. 라벨이 길어져 `/studio` >128.83 또는 복원 >131.81이면 감량 1회(라벨 외 진입 문자열 이동 등, 동작 변화 0) → 그래도 넘으면 **멈추고 보고**(새 개정 상신 대상).
2. **P1 M6 가드**: `expect(new ReactZipError("x").retry).toBe(false)` + 실제 `buildReactZip` 단언 실패(허용표 위반 입력)를 흐름에 통과시켜 refused·"다시 시도" 0 확인 1건. 변이 M6(`retry=true`)가 FAIL로 잡히는지 기록.
3. **P2**: react-zip UI 흐름 1건(`ExportFlow.test.tsx` — 검사→확인→저장→requestExport 1회, 형식 값 `react-zip`) · 진입 정적 포함 0 가드 단위 테스트(`check-bundle-size.mjs` 판정 함수를 가짜 manifest로 음성·양성).
4. **P3**: `exportNotes({bytes: 3*MB+1,…}, "react-zip")` 메일 첨부 안내 0 단언.
5. **원격 자동 허용 제거**: 저장소 `.claude/settings.json` `permissions.allow`에서 `"Bash(git push:*)"`·`"Bash(git pull:*)"` 2줄만 삭제(다른 줄·hooks 변경 0, JSON 유효성 확인).
6. fresh typecheck·lint·test·build · 예산 표 · REPORT FIX1 절. 브라우저·Codex 불필요.

## 규칙
- **git push·pull·fetch 등 원격 명령 일절 금지.** 쓰기 경로: `features/studio/**`·`components/studio/ExportButtons*`·관련 테스트·`scripts/check-bundle-size.mjs`(테스트 가능하게 함수 export만)·`.claude/settings.json`(5번 2줄만)·`dev/active/m4b-impl/`. 킷·렌더·엔진 0, 새 의존성 0, 단언 약화·skip 0.
- 첫 턴 BRIEF-FIX1·COPY 커밋. 명시 경로 커밋. 마감 전 `git status --short` 빈 값. **최대 45턴, 36턴부터 마감.**
