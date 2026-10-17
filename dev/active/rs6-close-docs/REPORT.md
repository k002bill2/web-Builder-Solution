# RS6 종료 문서 REPORT (Designer · 문서만)

브랜치 `k002bill2/rs6-close-docs` · base `af76d10b`(PR #24) · 2026-10-17 · 브리프 `BRIEF.md` · 사용자 결정 "일괄" 4건만 반영(새 결정 0).

## 1. 바뀐 문서·행 (이전 → 이후)
| 문서 | 행 | 이전 | 이후 | 근거 |
|---|---|---|---|---|
| `docs/design/restart/INTEGRATE-6.md` | 상태 줄 | r1 설계안 · 코드 0 · 측정 0 · 실화면 0 | r2 — 10절 AC 문면 정정만 · 본문 변경 0 · L0~L5·QA 완료(PR #15~#24). r1 상태 줄은 아래에 보존 | `dev/active/rs6-qa/REPORT.md` 0절 |
| 〃 | RS6-AC-B2 | POP → `/projects` "저장 확인" → 새로고침 | POP → 해제 save 성공 → 행 기억 0(U16) → 새로고침 | QA 2절 B2 · 3절 B2-1~4 |
| 〃 | RS6-AC-B3 | A 닫기 → B "저장 확인" → stale | A 닫기 → B 편집 저장 → stale + "버리고 새로고침" | L4 QA N1 · QA 2절 B3 · 3절 B3-0~5 |
| 〃 | RS6-AC-B4 | 상태 글자·충돌 Callout 노출 | 상태 글자 노출 · 충돌 Callout 도달 0 = 단위만 · 재판정 조건. 390 화면 밖은 "부분" 유지(B-RS-12) | L4 REPORT R2-2 ① · QA 2절 B4 |
| 〃 | RS6-AC-U8 | 스파이 1:1 · 연타 1회 | 같은 기준 + "편집기 저장 확인 = 도달 0 → 단위만" 범위 주석 | L4 QA N1 · M1 |
| 〃 | RS6-AC-U2 | (문면 그대로) | T16 = `rs6-t16-guard` 레인 주석 · SHA는 Jarvis 기입 | QA 2절 U2 |
| 〃 | 10.1 표 · 변경 이력 r2 | 없음 | 위 4행의 r1 원문 · r2 문면 · 근거 경로 표 | — |
| `docs/design/restart/UX-5.md` | UX5-AC-04·05 · 변경 이력 r0b | 기준 문장만 | 기준 문장 유지 + "제품 도달 0(L4 결정 ①) · 단위만 · 충돌 경로 재발 시 재판정" | L4 REPORT R2-2 · QA 3절 |
| `docs/design/restart/MQ-6.md` | 결정 기록 · 변경 이력 r2 | 6-6까지 | + "2026-10-17 RS6 종료 4건"(일괄) | BRIEF 결정 1~4 |
| `docs/04-plan/RS6_INTEGRATE_PLAN.md` | 상태 줄 · 변경 이력 r2 | r1 계획 · 실행 승인 아님 | 실행 완료 · PR 매핑 · 종료 조건 = 이 레인 + T16 레인 머지(Jarvis 확인). r1 문구 보존 | `git log --merges` |
| `docs/06-handoff/BACKLOG.md` | B-RS-01 | 링크 = 저장 끝난 뒤 이동 · 뒤로·탭 닫기 범위 밖 | + RS6 이탈 규칙 교체(즉시 이동 + 해제 save + 레지스트리 경고, MQ-6-7 A · #21) · RS4-R8 닫힘 · 주소창·네이티브 대화상자 미실행 | QA 1절 |
| 〃 | B-RS-03 | 🔶 편집기 진입 인계 남음 | 🔶 인계 닫힘(CP4 → L3 흡수 · #20·#21 · RS4-R1) · PendingStart 실화면만 남음 → B-RS-16 | QA 1절 · L5 QA-REPORT 4절 |
| 〃 | B-RS-04 | 열림(CP4 예산 실패) | ✅ R1·R2·R8 닫힘(R1 = #20 L3a·#23 L4 — `git log -S` 테스트 이름 귀속 · R2 = #22 · R8 = #21 · QA #24) | QA 1절 · 3절 |
| 〃 | B-RS-05~17 (새 13행) | 없음 | T16(⏳) · 예산 0.01(기록만) · ConflictCallout/resolve · 생존 변이 · N2 · N3 · N4 · 390 화면 밖 · Tab BODY · memoryProfileAdjust +0.66 · L5 폴백 문구 · PendingStart 실화면 · `/profile` D1 | BRIEF 할 일 목록 |

- 새 행 "결정" 칸은 예산(B-RS-06 = 결정 3 문구)·T16(B-RS-05 = 결정 4) 외 전부 "미정(Jarvis 배정)" — 담당 배정도 새 결정이라 하지 않았다.

## 2. 사실 / 추정 / 확인 필요
- **사실 [L1]**: 위 근거 경로의 수치·관측(QA REPORT·L4 QA·L5 REPORT 직접 읽음) · PR 매핑(`git log --oneline --merges`).
- **추정**: Tab 2회째 BODY 원인(B-RS-13) · PendingStart 실화면 경로 없음(B-RS-16) · L5 폴백 도달 경로(B-RS-15) — 원문 표기 그대로 "추정"으로 옮겼다.
- **확인 필요(인계)**:
  1. **SPEC-4 갱신 필요** — `SPEC-4.md:175,304,317`이 RS4-R1·R2를 열린 위험으로 적고 있다. RS6로 닫힘(BACKLOG B-RS-04). BRIEF 금지 범위라 수정 0.
  2. 예산 숫자: BRIEF·ADR-004 개정 17 판정선 = 129.13/132.11, QA REPORT 0절의 "멈춤 129.14·132.12"는 멈춤선 표기. BACKLOG에는 판정선을 적었다. 두 표기 정합은 Jarvis 확인.
  3. T16 레인 결과 SHA — Jarvis가 머지 때 B-RS-05·I6 U2 주석에 기입.

## 3. 검증
- `git diff --name-only af76d10b..HEAD` = 8경로(문서 5 + `dev/active/rs6-close-docs/` 3: BRIEF·PROGRESS·REPORT) · `git status --short` 빈 값 — 커밋 뒤 실행.
- `app/`·ADR·판정 스크립트·기준선·SPEC-4 변경 0. 게이트(typecheck 등)는 문서만이라 실행하지 않았다.
- Codex: BRIEF "Codex 0"에 따라 생략. push·원격 쓰기 0. 서브에이전트 0(독립 부분 없음).
