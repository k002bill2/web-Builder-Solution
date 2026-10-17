# RS6-L4 QA BRIEF — UX 상태·버튼·폐기·충돌·문구 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs6-l4-ux` (tip `fd49cb24` = L4 R2 `045085ca` + origin/main `863edf49`(L5 #22) 병합, 충돌 0). Developer 보고 `dev/active/rs6-l4-ux/REPORT.md` R2 절.
Jarvis 병합 후 fresh(참고): build 0 · `/studio` 129.12 · 복원 132.10 · raw 130.43/133.47 · typecheck 0 · lint 0 · test 340/3022.
정본: `docs/design/restart/INTEGRATE-6.md` r1 8.1~8.4 · RS6-AC-U8·U9·G3 · `UX-5.md` UX5-AC-01·04·05·06·07·12·14 · BRIEF-R2 Jarvis 결정(① 다른 탭 stale = stale 환경 행 ② 문구 분리 ③ M2a~M2d).

## 검증 항목 (최우선 = 거짓 상태·손실)
1. **버튼 ↔ 코어 1:1 · 거짓 상태 0**: "저장 확인"(confirm)·"다시 저장"(save)·"버리고 새로고침"(discard→reload)이 reject·실패·시간 초과에서 거짓 saved/confirmed/discarded를 만들지 않는지. 폐기가 **확인 없이** 또는 다른 탭의 최신 커밋을 덮는 경로가 없는지. 폐기 시간 초과(DISCARD_GIVE_UP_MS) 뒤 상태·편집 보존.
2. **stale 전환(①)**: 포트 stale → failed + reason stale 경로에서 자동 재시도가 다른 탭 커밋을 덮지 않는지(Developer 단언 "시도는 있으나 모두 거절" — 실제 저장소로 확인) · 탭 닫기 경고 · `/projects` 행(L5) 표시와의 정합(병합 결과에서 L5 행이 stale 코어를 어떻게 보이는지). `ConflictCallout`·`resolve` 제품 도달 0 주장 grep·추적 확인.
3. **L5 병합 정합**: `coreIo.ts`·`saveCore.ts` 자동 병합(rebase proof `rebased` + L4 `text`·confirm/discard 변경)이 서로의 의미를 깨지 않는지 — U16 테스트·L4 버튼 테스트 동시 GREEN 외에 코드 대조.
4. **변이(임시, 매번 `git checkout -- app/`)**: confirm 연타 dedupe 제거 · discard reject → failed 매핑 제거 · stale → INFRA 매핑을 STALE_DOC로 되돌림 · 폐기 대화상자 첫 포커스 변경 · 금지 문구 가드 주석 제외 로직 제거 → 각 FAIL.
5. **접근성**: role·aria-busy·aria-disabled·alertdialog·포커스 진입/복귀·alert 중복 0·status 1회(slow).
6. **Ego Lite(필수 — Developer 미확인 보완)**: build + preview `--port 4384 --strictPort`. (a) 변경 없는 readonly 화면 "저장 확인" — 2탭 실제 `navigator.locks` held 기록 → 클릭 → 결과 (b) 실패 "다시 저장" — 잠금·IDB 점유 주입 (c) 저장 중/느림 꼬리 — readwrite 트랜잭션 점유로 지연 주입 (d) stale 행 → 폐기 → reload (e) 390. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·**서버 종료·리슨 0**. 5480 무접촉.
7. **fresh 게이트**: 위 수치 재현. 예산 판정은 개정 17 상한(129.13 · 132.11 · raw 130.5) 기준.

## 판정
- 거짓 saved/confirmed/discarded · 확인 없는 폐기 · 다른 탭 커밋 덮어쓰기 경로가 있으면 FAIL.

## 제외·산출물
- 앱·테스트 수정 커밋 금지. push·원격 쓰기·다른 워크트리·Codex 금지.
- `dev/active/rs6-l4-ux/QA-REPORT.md`(0 판정 · 1 거짓 상태 표 · 2 stale · 3 병합 정합 · 4 변이 · 5 접근성 · 6 실화면 · 7 게이트 · 8 사실/추정/미확인 · 최종 QA 게이트 인계) · `QA-PROGRESS.md` · `qa-shots/`. 명시 경로 커밋.
- 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋. **QA-REPORT 초안 40턴 전 커밋.** 최대 60턴(초과 금지 — 실화면 준비가 길면 (a)(b)(c) 중 일부 BLOCKED로 기록하고 마감). 서브에이전트: 읽기 전용 1개(3번 병합 대조) 허용.
