# M4-a-6 QA BRIEF — B-M4A-08 재시도 복구 독립 검증 (QA, 정적·회귀 중심)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 tip `0a426172`(base `a0068764`). Developer 보고 `dev/active/m4a-retry-fix/REPORT.md`(Ego L4 단일 탭 복구 성공 실측 있음 — `logs/ego-L4.txt`·`m4a6-l4-recovered.png`).

## 검증 (항목마다 QA-REPORT 갱신 커밋)
1. fresh typecheck·lint·test·build · 예산 `/studio` 128.79 · 복원 131.77(개정 18 M4-a 몫 0.10 중 0.09 사용 — 남은 0.01) · 다른 라우트 무변화(main 대비).
2. **거짓 성공 0 · 거짓 다시 시도**: 계수 규칙(로드 실패 +1 · 받으면 0 · 2부터 새로고침 안내) 코드 추적 + 변이 3종(계수 0 리셋 제거 / 안내 조건 `>1`→`>0` / 로더 계수 래퍼 제거) → FAIL 확인, 매번 되돌림.
3. 바뀐 기존 단언 이전/이후 표 — 약화 0.
4. **Developer Ego 증거 재판독**(실화면 재실행은 하지 않는다 — 턴 절약): `logs/ego-L3.txt`·`ego-L4.txt`에서 `?retry=N` 요청·성공 문구·두 번째 탭 INFRA 대조군 주장이 로그와 일치하는지.
5. 두 번째 탭(읽기 전용) 내보내기 INFRA + "다시 시도" 결함 후보: 이 브랜치의 회귀인지(main에서도 같은 코드 경로인지) **코드로만** 판정. 심각도 제안.

## 판정·규칙
- PASS / PASS with notes / FAIL(거짓 성공·단언 약화·예산 초과·이 브랜치가 만든 회귀).
- 브라우저 금지, 앱·테스트 수정 커밋 금지, Codex 금지, push·원격 쓰기 금지. 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋, **QA-REPORT 초안(잠정 판정) 8턴 안**. 마감 전 `git status --short` node_modules 외 빈 값. 최대 35턴, 28턴이면 판정 확정·마감.
