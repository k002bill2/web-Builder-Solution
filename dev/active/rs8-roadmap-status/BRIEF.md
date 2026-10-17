# RS8-1 BRIEF — 제품 로드맵 현황 점검 · 다음 단계 범위 제안 (Developer, 읽기 전용 조사)

책임 역할: Developer(기술 현황 판정) / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "순서대로 진행해" — 1번 제품 로드맵 복귀)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs8-roadmap-status`. 쓰기 경로: `dev/active/rs8-roadmap-status/`만. 앱·docs 수정 0.

## 목적
RS 트랙(RS1~RS7, PR #5~#31)이 끝났다. `docs/04-plan/DEVELOPMENT_PLAN.md`(v0.3) 단계 M2a·M2b·M2c·M3·M4·M5와 실제 `main` 구현 상태를 대조해, **다음 제품 단계 후보와 범위**를 근거와 함께 제안한다. 결정은 Jarvis→영환님.

## 할 일
1. **단계별 현황표**: M2a·M2b·M2c·M3(3.1~3.7)·M4(4.1~4.6) 각 항목 — 구현됨/부분/없음 + 근거(코드 경로·테스트·REPORT·QA 경로·PR). `dev/active/*`·`docs/qa/*`·`docs/06-handoff/BACKLOG.md`·git log 활용. 추정은 표시.
2. **M4 세부 진단**(유력 후보): 4.1 품질 게이트(`features/studio/gateCheck.ts`·`gateView.ts` 현황 — axe·대비·링크·3뷰포트 중 무엇이 있나) · 4.2 내보내기(정적 HTML·PNG 있음 — zip(react/static)·LICENSES.md·금지 패턴 검사 유무) · 4.3 사용량 원장(백엔드 0 전제에서 해당 여부) · 4.4 AppSec 범위(업로드·sandbox iframe·산출물) · 4.5·4.6. 백엔드 없는 브라우저 단독 제품이라는 ADR-007·현 구조에서 **적용 불가/변형 필요** 항목 표시.
3. **열린 백로그 분류**: `BACKLOG.md`에서 ✅ 아닌 행 전부를 (a) 다음 단계에 흡수 (b) 별건 유지 (c) 닫아도 됨(근거)로 분류.
4. **제안**: 다음 단계 후보 2~3개(예: M4-a 품질 게이트·zip 내보내기 / M2b 잔여 B-M2B-05·09 / M3 잔여) — 각각 목적·범위·제외·예상 레인 구성(역할·병렬성)·예산 영향(ADR-004 개정 17 기준선: `/studio` 128.66/129.13 · 복원 131.64/132.11 · `/projects` 99.09 · `/profile` 99.53 · `/catalog` 100.06/101 · `/compare` 98.96/100)·사전 결정 필요 사항(새 의존성·엔진 계약·ADR 개정 등)·추정 규모. ★권장 1개와 이유.
- 산출물: `dev/active/rs8-roadmap-status/REPORT.md`(0 결론·권장 → 1 현황표 → 2 M4 진단 → 3 백로그 분류 → 4 후보 비교 → 5 사전 결정 질문 번호 목록 → 6 사실/추정/미확인).
- 서브에이전트 분할: 권장(읽기 전용 3개 — M2·M3 현황 ∥ M4 진단 ∥ 백로그 분류). 통합은 메인.
- 최대 45턴, 35턴부터 마감. build·test 실행 불필요(필요하면 1회).

## 공통
- base origin/main `494a7c6f`. 병렬 레인 3개(`rs8-roadmap-status` · `rs8-row-reason` · `rs8-ux-polish-spec`) — 다른 레인 쓰기 경로 접촉 0.
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. REPORT 초안은 마감 10턴 전 커밋. 사실/추정/미확인 구분.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 출력 0을 REPORT에 기록.
- **마감 전 `git status --short`가 node_modules 외 빈 값**(로그도 커밋하거나 지운다).
