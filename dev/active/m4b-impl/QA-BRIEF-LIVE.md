# M4-b-2 QA BRIEF 2차 — React zip 실화면 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18. 대상 tip `06ca2b39`(FIX1 완료). 계획 정본 `QA-LIVE-PLAN.md`(R1·R2·R4) · 근거 `REPORT.md` FIX1 절 · `COPY.md`.

## 순서 (절마다 QA-REPORT 10절 갱신 커밋)
1. **R1 앱 실제 경로 zip**(필수): 버튼 "React 프로젝트(zip) 내보내기" → `_react.zip` 내려받기 → 저장소 밖 `$TMPDIR`에 풀어 docker `node:22`로 `npm ci && npm run build` exit 0 · 1차 테스트 경로 zip과 `src/kit/*.css`·`package-lock.json` 바이트 비교 · 이미지 문서도 1회(UUID 0).
2. **R4 status/alert·포커스**: 1280·390 성공 status 1 · 결과 줄 = COPY.md 원문 · 메일 안내 0 · 청크 차단 → alert·"다시 시도" → 해제 → 성공 · 포커스 · 390 버튼 줄바꿈·잘림 0.
3. **R2 렌더 대비**: 1280·390 정규화 DOM 비교 · 390 메뉴 열기→항목 클릭→닫힘 · 이미지 문서 masonry.
- 한 행 실패 재현이 +5턴 넘으면 BLOCKED로 적고 다음 행.

## 규칙
- preview `--port 4399 --strictPort`(build + preview, dev 서버 금지). **뷰포트 override·차단은 측정과 같은 스크립트 안에서**, 단계마다 `innerWidth` 기록. 종료 → `lsof -nP -iTCP:4399 -sTCP:LISTEN` 0 기록 · IDB 삭제.
- 판정 1줄(2차 + 종합 1·2차)을 QA-REPORT 첫머리에. FAIL = 거짓 성공 · 거짓 다시 시도 · zip 빌드 실패 · 렌더 대비 시각 차이 · status/alert 중복.
- 첫 2턴 QA-BRIEF-LIVE·QA-PROGRESS 커밋, **50턴이면 남은 행 미확인으로 적고 판정 확정·마감**. 앱·테스트 코드 커밋 금지, Codex 금지, **git push·pull·fetch 등 원격 명령 일절 금지**. 마감 전 `git status --short` 빈 값. 최대 62턴.
