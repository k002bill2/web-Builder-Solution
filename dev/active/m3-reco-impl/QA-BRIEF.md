# M3-1 QA BRIEF — 추천 모드 독립 검증 1차 (QA, 정적·회귀)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 tip `62d3aec2`(main `36e825a6` 병합 포함). 정본 `docs/design/m3/RECO-SPEC.md` r1 + 7a · Developer `dev/active/m3-reco-impl/REPORT.md`.
**이번 run = 1차(정적·회귀).** 브라우저 금지 — 실화면은 2차 run에서 따로.

## 검증 (항목마다 QA-REPORT 커밋)
1. fresh typecheck·lint·test(361/3212)·build · 예산 표 재현(`/catalog` 첫 화면 100.46 · `/catalog (추천)` 진입 · `/studio` 128.80 · 복원 131.78 · 다른 라우트 main 대비).
2. **결정성·근거**(T-REC-01~05): 같은 입력 2회 같은 순위·근거 · 동점 id 사전순 · 품질 2항목 순위 제외(RQ-02 B) · 업종15·목적10·무드10(RQ-05) · `RECO_SECTION_FIT` 엔진 대조 가드. 변이 3종(동점 규칙 뒤집기 / 품질 항목 순위 포함 / 파생 표 1행 변경) → FAIL 확인.
3. **승인 전 변경 0**(T-REC-06) · 적용 = 저장 확인 뒤 성공 · 되돌리기 세션 유지 · 뒤 적용 실패 시 앞 기록 보존(Codex P2). 변이 2종(적용 성공을 저장 전에 표시 / 되돌리기 기록 덮어쓰기) → FAIL.
4. **로드 조건**: `tab=all`에서 rec 청크 안 받음 테스트가 실제로 막는지 변이 1종(정적 import로 바꾸기) → FAIL.
5. 바뀐 기존 단언(V2-AC-21 등) 이전/이후 표 — 약화 0. RECO-AC-01~17 단위 판정표.
6. 2차 실화면 계획 `dev/active/m3-reco-impl/QA-LIVE-PLAN.md`(390·1280, 필터 → 추천 → 근거 → 2개 더 보기 → 적용 → /compare 초안 → 되돌리기, 빈/실패 상태, 예상 턴).

## 판정·규칙
- PASS / PASS with notes / FAIL(거짓 성공·승인 전 변경·결정성 깨짐·회귀). 앱·테스트 수정 커밋 금지, Codex 금지, push 금지. 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋, **QA-REPORT 초안(잠정 판정) 8턴 안**. 변이 매번 되돌림. 마감 전 `git status --short` 빈 값. 최대 45턴, 36턴이면 판정 확정·마감.
