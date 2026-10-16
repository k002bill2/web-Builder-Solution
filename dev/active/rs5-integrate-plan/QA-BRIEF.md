# RS6 설계 독립 검토 BRIEF (QA, 읽기 전용)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs5-integrate-plan` (tip `7189816e`, base `c7a7a2a8`) — `docs/design/restart/INTEGRATE-6.md`, `MQ-6.md`, `docs/04-plan/RS6_INTEGRATE_PLAN.md`, `dev/active/rs5-integrate-plan/REPORT.md`.
추가 입력(origin/main `6d321936`에 머지됨, 이 브랜치에는 없음 — `git show origin/main:dev/active/backlog-rs-status/REPORT.md`로 읽기): "남은 저장 결함 12건" 목록.

## 목적
구현 승인 판단(MQ-6-1·6-3 결정, L0 측정 레인 발주) 전에 설계의 **사실 근거·누락·내부 모순**을 독립 판정한다. 설계를 고치지 않는다.

## 검증 항목
1. **사실 대조(L1 표본 ≥10)**: INTEGRATE-6의 파일:행 인용(예: `main.tsx:30` IDB 1회, `useDocSave.ts:69` 유일 저장 호출, revision 올리는 쓰기 5곳, 같은 탭 직접 IDB 쓰기 3곳, `pagehide` 0, `StudioLayout.tsx:130-148`)을 현재 코드와 대조. 불일치는 `오류`로.
2. **12건 커버리지**: backlog-rs-status REPORT의 결함 1~12 각각이 INTEGRATE-6/계획에서 `해결 / MQ / 범위 밖(명시) / 누락` 중 무엇인지 표. 특히 RS4-R8(POP·주소 입력 편집 소실), RS4-B1(`startDoc` 재생 이미지 없는 커밋), CE-4(동시 confirm write 2회), OBS-2/BD-2(이미지 확인 프로젝트 구분).
3. **설계 위험 판정**:
   - 링크 이탈이 저장 완료를 기다리지 않게 바꾸는 변경(LV-1 해결안)이 B-RS-01(이탈 저장 보장, 기존 `StudioLeave.test.tsx` 14건)을 약화하지 않는지 — 코어가 탭 수명이라는 전제의 근거와 예외(`failed`·`readonly` 등) 처리.
   - BD-1 "구조 관례 + import 가드"가 충분한지(테스트·HMR·StrictMode 이중 마운트 등 2번째 어댑터 경로).
   - LocalSync 포트 +5 메서드·ProjectRepository +1 접근자가 기존 저장소 계약·ADR-007과 충돌하는지.
   - 예산: L0 측정 관문 선행이 계획 순서에 실제로 강제되는지, CP4 흡수 시 상쇄 인정 조건이 측정 가능한지.
4. **MQ 품질**: MQ-6-1~6-6 각 선택지가 트레이드오프·사실/추정을 구분하는지, ★안을 고르면 다른 MQ가 자동 결정되는 의존이 숨어 있지 않은지.
5. **계획 실행 가능성**: 레인별 쓰기 경로 겹침, 턴 예산(50~90), RED/GREEN 체크포인트 ≤4, QA 게이트 환경(preview·멀티탭 실제 잠금) 명시 여부.

## 제외
- 설계 문서·코드 수정 금지. 측정·빌드·브라우저 실행 불필요(필요하면 표적 vitest 읽기 실행만). push·원격 쓰기·다른 워크트리 접촉 금지. Codex 금지.

## 산출물
- `dev/active/rs5-integrate-plan/QA-REVIEW.md`: 0. 판정(구현 판단 진행 가능 / 보완 후 가능 / 재설계 필요) 1. 사실 대조 표 2. 12건 커버리지 표 3. 위험 판정(심각도 P1/P2/P3·근거) 4. MQ 검토 5. 계획 검토 6. Jarvis에게 권고(보완 요청 목록은 최소·구체) 7. 사실/추정/미확인
- `dev/active/rs5-integrate-plan/QA-PROGRESS.md`. 로컬 커밋은 이 두 파일만(명시 경로 add).
- 첫 3턴 QA-BRIEF·QA-PROGRESS 커밋. 35턴부터 새 조사 중단 → QA-REVIEW 마감.
서브에이전트 분할: 권장(읽기 전용 2개 — ① 사실 대조 ② 12건 커버리지). 위험 판정·통합은 메인.
