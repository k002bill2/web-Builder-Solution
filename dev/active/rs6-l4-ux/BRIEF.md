# RS6-L4 BRIEF — UX 상태·버튼·충돌·문구 (Developer, 구현)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-l4-ux` (브랜치 `k002bill2/rs6-l4-ux`, base origin/main `aca09805` = L3b PR #21 머지). `app/node_modules` 설치 완료.
병렬 레인: RS6-L5(`/projects`·프로필, 워크트리 `rs6-l5-projects`) — 쓰기 경로 겹침 0(PLAN 레인 표). **L5 경로(`features/projects/**`·`components/projects/**`·`features/profile/restartFlow.ts`·`features/pending/**`) 접촉 금지.**
승인: MQ-6-1~5·7 A(6-5 A = 충돌 두 선택 = `resolveConflict` → `replace` 조합 · "지금 문서 유지" = 기존 PendingStart 해제) · ADR-004 개정 17. Designer 산출물: `docs/design/restart/UX-5.md`(상태표·문구·포커스·UX5-AC) + INTEGRATE-6 r1 8절. Designer 별도 호출 생략 사유: 화면 명세가 UX-5·I6 8절에 있음 — 구현 뒤 QA 게이트에서 UX5-AC 실화면 판정.

## 정본
- `docs/04-plan/RS6_INTEGRATE_PLAN.md` **5절 L4 CP1~CP4** · 레인 표 L4 행(쓰기: `components/studio/SaveStatus.tsx` · `ConflictCallout.tsx` · `features/studio/saveStatusText.ts` · 새 대화상자 1개).
- `docs/design/restart/INTEGRATE-6.md` r1 8.1(상태 판정 출처) · 8.2(버튼 ↔ 코어 메서드 1:1) · 8.3 · 8.4(포커스·aria) · RS6-AC-U8·U9·G3 · `docs/design/restart/UX-5.md`(UX5-AC-01·04·05·06·12·14).
- 인계: `dev/active/rs6-l2-liveness/{REPORT 4절 5, QA-REPORT 7절 3}`(hang 문구는 `role=alert` `<p>`에, aria-busy 붙는 상태 글자에 넣지 않음) · `dev/active/rs6-l3b-leave/{REPORT 9절, QA-REPORT 7절 L4 조건}` · L2 QA 4절 catch 위치(`core.link` confirm · `core.discard()` reject 매핑 — 편집기 "저장 확인" 버튼·폐기 대화상자 호출처) · `replace` 결선 시 rebase 뒤 epoch +1 단언(L3a QA M2b).

## 범위 (PLAN L4 CP1~CP4)
- CP1 `SaveStatus` 판정 출처 교체(문자열 매칭 제거 · I6 8.1 출처별 1행 표 테스트).
- CP2 "저장 확인"·"다시 저장"·폐기 대화상자 — 버튼 ↔ 코어 메서드 1:1 스파이 · 연타 1회(진행 중 promise 공유, CE-4) · `aria-busy`/`aria-disabled` · reject → 결과 매핑(거짓 saved 0).
- CP3 `ConflictCallout` 두 선택(MQ-6-5 A) · 포커스 규칙(UX5-AC-04·05·06) · `replace` 결선 + epoch +1 단언.
- CP4 문구 `saveStatusText.ts` — `SAVE_HANG_ALERT`·`DISCARD_TIMEOUT_ALERT` 키 매핑 · "저장 뒤 다시 복원" 등 L3b가 키만 남긴 문장 · 금지 문구 0(UX5-AC-14) · memory 모드(U9). 문구 원문은 UX-5 우선.

## 예산 — 매우 빠듯함
- 현재 `/studio` 정규화 **129.09** / 상한 129.13(여유 **0.04**) · 복원 132.07/132.11 · raw 130.42/130.5. **L5는 `/studio` 증분 0 목표라 0.04는 L4 몫 전부.**
- 새 대화상자·버튼 본문은 **조작 뒤 청크**(lazy). 진입에는 결선만. 문구 상수는 진입 청크에 새 공유 모듈 간선을 만들지 않게(L2 교훈 — 공유 청크 분리로 +0.15).
- CP마다 build 실측. 상한 초과 → 감량 1회(상쇄 후보 조사 포함) → 그래도 넘으면 **멈추고** 정규화·raw·청크 구성으로 보고(Jarvis가 영환님께 재상신). 상한 안이면 `m2cBaseline.json`·`bundleBudget.test.mjs` 실측 갱신(note "개정 17 배분 RS6-L4"). **L5와 기준선 파일 충돌을 피하려 L5는 이 파일을 건드리지 않는다.**

## 규칙
- TDD: CP마다 RED 예측 → PROGRESS → RED 로그 `dev/active/rs6-l4-ux/logs/` → GREEN 커밋. 기존 단언 약화·skip 0 — 문구가 바뀐 단언은 UX-5 근거 열과 이전/이후 표.
- 엔진·PageDoc·레코드·스키마·의존성 변경 0. DS 기존 Callout·Dialog·status 재사용(새 아이콘 0).
- **Ego Lite(마지막 1회)**: build + preview `--port 4380 --strictPort`. 1280·390에서 상태 글자(저장 중·느림·저장됨·실패) · "다시 저장" · 폐기 대화상자 포커스 진입·복귀 · 키보드만으로 조작. 충돌은 다중 탭이 필요하면 2탭(실제 `navigator.locks` held 기록) 시도, 안 되면 BLOCKED 기록. 정리(IDB 삭제·finish·listTaskSpaces·서버 종료·리슨 0). 5480 무접촉.
- Codex review: 레인 끝 1회(`--scope branch --base aca09805`), 지적 반영 1회까지.
- 서브에이전트 분할: 권장(읽기 전용 1개 — UX-5·I6 8절 문구·포커스 대응표 작성 ∥ 메인 CP1). 쓰기는 메인만.

## 마감
- fresh `typecheck`·`lint`·`npm test -- --run`(base 331/2957 + 증분)·`build`(전 라우트 표).
- `dev/active/rs6-l4-ux/{PROGRESS,REPORT}.md`: AC 판정(U8·U9·G3·UX5-AC) · 문구 이전/이후 · 예산 표 · 실화면 · QA 게이트 인계 · 사실/추정/미확인.
- 명시 경로 커밋, amend·rebase·push 금지. 다른 워크트리 접촉 0.
- 첫 3턴 BRIEF·PROGRESS 커밋. CP2 45턴 전 · 85턴부터 새 구현 중단 → Ego Lite·Codex·게이트·REPORT. 최대 100턴.
