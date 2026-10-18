# M4-b-2 QA BRIEF 1차 — React zip 정적·회귀 (QA, 브라우저 금지)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18. 대상 tip `89d88dbf`(main `dcdabea0` 병합 포함). 근거 `REPORT.md` · `docs/design/m4b/REACTZIP-SPEC.md` r1 + 7a · ADR-004 개정 20.

## 검증 (항목마다 QA-REPORT 커밋)
1. fresh typecheck·lint·test·build · 예산 `/studio` ≤128.83 · 복원 ≤131.81 · 다른 라우트·렌더 증분 0 · 진입 정적 포함 0 가드 양성/음성.
2. RZ-AC 판정표 01~20·C1·C3 재판독 — 테스트가 실제로 그 AC를 단언하는지(이름만 맞는 테스트 0).
3. 변이 6종(되돌림): 허용표 entry 1개 허용 · site.json UUID 치환 제거 · lock integrity 대조 제거 · 메뉴 리스너 제거 · 진입 가드 표식 문자열 변경 · 단언 실패를 재시도 가능으로 분류. 각각 FAIL로 잡히는지.
4. 산출 zip 1개를 docker `node:22`로 `npm ci && npm run build`(저장소 밖 `$TMPDIR`) 재현 — 앱 테스트 경로 산출이면 그 사실 기록.
5. `exportFlow.ts:76` "메일 첨부… 정적 사이트(zip)" 안내가 react-zip 3MB 초과에 붙는지 판정(Hemingway 지적).
6. 2차 실화면 계획 `QA-LIVE-PLAN.md`(R1 앱 실제 경로 zip · R2 렌더 대비 · R4 status/alert·포커스, 1280·390, 이미지 문서) — 계획만.

## 규칙
- 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋, QA-REPORT 초안 8턴 안, **32턴이면 판정 확정**. 앱·테스트 코드 커밋 금지, Codex 금지, **push·pull·fetch 등 원격 명령 금지**. 마감 전 `git status --short` 빈 값. 최대 40턴.
