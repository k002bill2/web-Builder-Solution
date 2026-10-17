# RS6 종료 문서 BRIEF — AC 문면 정정 · 도달 0 수용 기록 · 예산 기록 · BACKLOG 갱신 (Designer, 문서만)

책임 역할: Designer(설계 문서 소유) / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-close-docs` (브랜치 `k002bill2/rs6-close-docs`, base origin/main `af76d10b` = RS6 최종 QA PR #24).
병렬 레인: `rs6-t16-guard`(테스트 1건, `app/src/**` 테스트 파일만) — 이 레인은 `app/` 접촉 0.

## 영환님 결정 (2026-10-17 "일괄" = RS6 최종 QA 4절 ★안 전부)
1. ★A **편집기 "저장 확인" 도달 0 수용** — RS6-AC-B3·U8 문면을 제품 동작에 맞게 정정(B3: "A 닫기 → B 편집 저장 → `stale` 문구 + 버리고 새로고침"). 버튼·경로 추가 없음, 예산 0.
2. ★A **AC 문면 정정 + 도달 0 수용 기록** — RS6-AC-B2(`/projects` "저장 확인" 단계 = 성공 시 도달 불가 → 실제 경로로) · RS6-AC-B4 · UX5-AC-04·05(충돌 Callout 제품 도달 0 — L4 BRIEF-R2 결정 ①). `ConflictCallout`·`resolve` 코드 삭제는 하지 않음(백로그).
3. ★A **예산 여유 0.01 — 기록만**: 다음 `/studio` 진입 변경 레인 착수 때 감량/ADR 개정을 정한다. ADR-004 본문·판정 스크립트·기준선 수정 금지.
4. T16 상시 테스트 — 병렬 레인이 처리(여기서는 BACKLOG·AC 표에 그 레인 결과를 반영할 자리만, 결과 SHA는 Jarvis가 머지 때 확인).

## 할 일
- `docs/design/restart/INTEGRATE-6.md`: r2 표기 + "변경 이력"에 r2 1줄. RS6-AC-B2·B3·B4·U8 문면 정정 — 각 행에 **이전 문면 → 새 문면 · 근거(QA 경로)** 를 변경 이력 또는 각주로 남긴다(원문 삭제만 하지 말 것). 근거: `dev/active/rs6-qa/REPORT.md` 0·2·3·4절 · `dev/active/rs6-l4-ux/QA-REPORT.md` N1 · `dev/active/rs6-l4-ux/REPORT.md` R2-2.
- `docs/design/restart/UX-5.md`: UX5-AC-04·05에 "제품 도달 0(RS6 L4 결정 ① — 다른 탭 stale = stale 행), 단위 검증만 · 충돌 경로가 다시 생기면 재판정" 주석. 판정 기준 자체는 유지.
- `docs/design/restart/MQ-6.md` "결정 기록"에 RS6 종료 결정 4건 추가(날짜 · "일괄").
- `docs/04-plan/RS6_INTEGRATE_PLAN.md`: 상태 줄 — L0~L5·QA 완료, PR #15~#24 · 종료 조건.
- `docs/06-handoff/BACKLOG.md`:
  - **B-RS-01·B-RS-03·B-RS-04 상태 갱신**(RS6로 닫힘/부분 — 근거 PR·QA 경로). RS4-R1·R8·R2 연동 기술.
  - 새 행(ID 규칙은 기존 표 따름): 예산 여유 0.01(129.12/129.13 · 복원 132.10/132.11) — 다음 진입 변경 착수 조건 · ConflictCallout/resolve 제품 도달 0 코드 정리 · 생존 변이 테스트 공백(L5 M1·M3·M4b · L1 U14-b·U10-a·IMG-meta · L3a M2b) · L4 N2(stale 행 첫 문구 · 문자열 2벌)·N3·N4 · 390 상태 줄 스크롤 밖(sticky 아님) · 폐기 대화상자 Tab 2회째 BODY(추정) · `/compare` 조작 뒤 `memoryProfileAdjust` +0.66(판정 밖) · L5 폴백 문구 "다시 저장했습니다" 부정확 · PendingStart 실화면 미관측 · `/profile` "저장 다시 시도" UX-5 D1 미적용.
- `dev/active/rs6-close-docs/REPORT.md`: 바뀐 문서·행 목록(이전→이후) · 사실/미확인.

## 금지
- `app/`·ADR·판정 스크립트·기준선·SPEC-4 본문 수정 0(SPEC-4는 이미 D6-11로 대체 기록됨 — 필요하면 REPORT에 "SPEC-4 갱신 필요" 인계만). 새 결정 만들지 않기(위 4건 밖 판단은 REPORT "확인 필요"로).
- push·merge·원격 쓰기·Codex 0. 명시 경로 커밋. 첫 3턴 BRIEF·PROGRESS 커밋. 최대 40턴.
