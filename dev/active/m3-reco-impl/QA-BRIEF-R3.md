# M3-1 QA BRIEF R3 — FIX1 재확인 (D1 회복 · 390 #8~11 · N1·N2·N4) (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "1" — D1b 수용, `/catalog` 첫 화면 100.76)
대상: 이 워크트리 tip `3c9e410f`(FIX1 코드 `15334ed5`까지 + FIX2 문서만). 근거 `REPORT.md` FIX1·FIX2 절 · `QA-REPORT.md` 8절(D1, 390 #8~11 폭 미검증).

## 검증 (항목마다 QA-REPORT 9절 갱신 커밋)
1. fresh typecheck·lint·test(361/3219)·build · 예산 `/catalog` 첫 화면 100.76(멈춤선 100.90) · `/catalog (추천)` 진입 · `/studio` 128.80 · 복원 131.78 · 다른 라우트 main 대비.
2. **D1 실화면**(preview `--port 4399 --strictPort`): 화면 청크 차단 → alert → 해제 → "다시 시도" → `RecoView-*.js?retry=1` 요청 → 카드 3 · 포커스 BODY 아님 · **트레이에 미리 1개 담아 두고 회복 뒤에도 유지**. 적용 청크도 같은 방식(차단 → alert → 해제 → 다시 시도 → 대화상자).
3. **390 #8~11 재측정**: 키보드 적용 → `/compare` 초안 → 뒤로 → 되돌리기. **폭 override와 측정을 반드시 같은 스크립트 안에서** 하고 각 단계 시작에 `innerWidth`=390 기록(QA 8.3 교훈).
4. N1(더 보기 뒤 포커스 4번째 카드 제목) · N2(390 대화상자 Tab 순서 = 시각 순서) · N4(비활성 버튼 accessible description) 실화면 확인.
- 실패 재현이 +5턴 넘으면 그 행만 BLOCKED로 적고 다음으로.

## 판정·규칙
- R3 판정 + **종합 판정**(1차·2차·R3) 1줄을 QA-REPORT 첫머리에. FAIL = 거짓 성공 · 거짓 다시 시도 · 승인 전 변경 · 입력 손실 · status/alert 중복.
- 첫 2턴 QA-BRIEF-R3·QA-PROGRESS 커밋, 항목마다 커밋, **40턴이면 남은 행 미확인으로 적고 판정 확정·마감**. preview 종료 → `lsof -nP -iTCP:4399 -sTCP:LISTEN` 0 · IDB 삭제·`finish({keep:[]})`. 앱·테스트 수정 커밋 금지, Codex 금지, push 금지. 마감 전 `git status --short` 빈 값. 최대 50턴.
