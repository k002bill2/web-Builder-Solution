# RS6-L4 MEASURE BRIEF — L4 전체(CP1~CP4) 진입 증분 실측 + 상쇄 후보 (Developer, 측정 전용 · 앱 커밋 0)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17 (★안 — 영환님 상시 지시 "권장안으로 자동 진행". 이 레인은 측정만이며 판정선 상향을 승인하지 않는다)
워크트리: 이 워크트리 `k002bill2/rs6-l4-ux` (tip `8241ba6c`, 앱 = base `aca09805`). 입력: `dev/active/rs6-l4-ux/REPORT.md`(CP1 129.25 감량 뒤 · 6절 · 7절) · `patches/cp1-reduce1.patch` · `BRIEF.md` 범위(CP2~CP4).
병렬: RS6-L5 FIX1(워크트리 `rs6-l5-projects`) — 다른 워크트리 접촉 0.

## 목적
상향 폭을 **한 번에** 정할 실측 숫자. CP마다 재상신하지 않는다.

## 절차
1. M0: base build 재현(129.09/130.42 · 복원 132.07/133.45). `cp1-reduce1.patch` 적용 → 129.25/130.58 재현.
2. M1: CP2(저장 확인·다시 저장·폐기 대화상자 — 대화상자 본문 lazy) · CP3(ConflictCallout 두 선택·포커스 — `rebase` epoch +1 단언 포함) · CP4(문구·금지 문구 가드·memory 모드)를 **실제 동작 수준**으로 붙인다(typecheck 통과 · 빈 stub 금지 — 못 붙인 것은 UNMEASURED). CP별 누적 build 실측(정규화·raw·복원·`/projects`·`/profile`).
3. M2: 상쇄 후보 조사·실측(진입 closure 상위 청크 표 기반) — 이번 L4 코드의 lazy 이동 여지 + 다른 진입 코드의 동작 변화 0 감량. 동작 변화가 있는 것은 B표로만. 효과 있는 것만 조합 1회.
4. 설계 질문 2건 근거 정리(결정은 Jarvis): ① 다른 탭 stale을 `ConflictCallout`로 보낼지 I6 8.1 `stale` 행으로 보낼지 — 각 안의 바이트·테스트 영향 ② 문구 2파일 분리(`saveStatusText.ts` + 조작 뒤 `save/reasonText.ts`)가 RS6-AC-G3와 맞는지 — 1곳 유지 시 바이트 차이.
5. 패치 보존(`patches/measure-*.patch`) → 자기 변경만 복원(`git checkout -- <경로>`·새 파일 삭제, reset/clean 금지) → base 재빌드 dist sha 동일.

## 결론 형식 (REPORT-MEASURE.md 첫 줄)
`L4 전체(CP1~4, 상쇄 반영) /studio 정규화 X · raw Y · 복원 Z → 필요 상향: 정규화 +a · raw +b · 복원 +c (UNMEASURED 하한)`

## 금지
- 앱 커밋 0(최종 `git diff -- app/` 빈 출력). 기준선·ADR·`check-bundle-size.mjs`·`bundleBudget*`·SPEC·INTEGRATE-6·UX-5 수정 0. 새 의존성·push·merge·Codex·브라우저 0. 빌드 직렬. 서브에이전트: 읽기 전용 1개(M2 청크 조사) 허용.
- 산출물 `dev/active/rs6-l4-ux/{REPORT-MEASURE.md, raw/measure-*, patches/measure-*}` · PROGRESS 갱신 · 명시 경로 커밋. 첫 3턴 BRIEF-MEASURE 커밋. 65턴부터 새 실험 중단 → 복원·게이트(build·typecheck·lint·test)·REPORT. 최대 80턴.
