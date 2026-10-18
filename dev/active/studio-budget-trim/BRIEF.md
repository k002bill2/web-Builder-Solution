# BUDGET-TRIM-1 BRIEF — `/studio` 진입 여유 회복 (Developer, 감량 전용)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — BACKLOG B-M4B-05, 다음 `/studio` 작업 선행 조건)
base origin/main `601471ff`. 현재 `/studio` 정규화 128.82(판정 128.83) · 복원 131.81(판정 131.81, 여유 0). 상한 129.13·132.11.

## 할 일
1. E0 진단: `/studio`·복원 진입 집합의 청크·모듈별 gzip 기여 표(상위 20) · M4-a·M4-b·RS8 이후 진입에 붙은 문자열·헬퍼(`__exportAll` 류 런타임 헬퍼·문구 상수·공유 청크 분할) 식별.
2. 감량: **동작 변화 0**인 방법만(진입 밖으로 옮길 수 있는 문구·상수 lazy 이동, namespace import 제거, 청크 경계 정리). 목표 각 −0.05 이상(128.77 · 131.76 이하). 렌더 문서·다른 라우트 증분 0.
3. 기준선은 낮추지 않는다(ADR 개정은 Jarvis) — REPORT에 새 실측만 기록.
4. fresh typecheck·lint·test·build · Codex adversarial 1회(`--help` 금지)·반영 1회.

## 규칙
- 쓰기: `app/src/**` 중 진입 경로 모듈 이동·import 정리, 관련 테스트, `dev/active/studio-budget-trim/`. 킷·렌더·엔진·저장 계약·문구 내용 변경 0, 새 의존성 0, 단언 약화·skip 0.
- **git push·pull·fetch 등 원격 명령 일절 금지.** 첫 2턴 BRIEF·PROGRESS 커밋, E0 뒤 REPORT 초안. 항목마다 커밋. 마감 전 `git status --short` 빈 값. 최대 55턴, 45턴부터 마감.
