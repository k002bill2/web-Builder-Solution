# RS6-L5 QA BRIEF — `/projects`·프로필 연결 독립 검증 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs6-l5-projects` (tip `40b50234`, base `aca09805`). Developer 보고 `dev/active/rs6-l5-projects/REPORT.md`.
Jarvis 판정(참고): PLAN 쓰기 표 밖 3파일(`memoryProjectRepository.ts` `cores` 접근자 1줄 · `saveCore.ts` 타입 · `ProjectsPage.tsx` 배선)은 **승인** — 코어 생성 없는 읽기 접근에 필요, `/studio` 증분 0 실측, L4 경로 겹침 0. 병렬 L4는 예산 정지(앱 코드 미커밋)라 충돌 없음.
정본: `docs/design/restart/INTEGRATE-6.md` r1 8.1·8.2·12.1·RS6-AC-U11·U16·B2, `UX-5.md` UX5-AC-08·11, L3b QA-REPORT note 1.

## 검증 항목
1. **손실·거짓 상태 판정(최우선)**: 행 "저장 확인"·"다시 저장"·"시작 다시 시도"가 거짓 saved/confirmed를 만들지 않는지. 특히
   - U16 해제 조건(clean · inflight 0 · proof committed · `confirmed.revision > record.head.revision`)이 기억을 너무 일찍 지워 미확인 쓰기를 숨기는 경로가 없는지(head 없는 기록 · rebase 뒤 flush 실패 · 다른 탭 커밋).
   - "저장 확인" + 코어에서 writer 탭일 때 초안을 같은 문서로 표시하고 다시 confirm하는 경로(save + verify)가 불필요한 revision 증가나 다른 탭 덮어쓰기를 만들지 않는지.
   - "시작 다시 시도"가 코어 dirty일 때 starter(`startDoc`)로 초안을 덮지 않는지(L3a CP0 STALE_DOC 가드와의 관계).
   - `/projects`가 `repo.core()`를 부르지 않아 memory 모드 경고·빈 코어가 생기지 않는지.
2. **변이(임시, 매번 `git checkout -- app/`)**: 행 우선순위 뒤바꿈 · U16 revision 조건 제거 · "다시 저장" 연타 dedupe 제거 · reject → 실패 매핑 제거 · `watchCores` idle 재판정 제거 → 각 FAIL.
3. **접근성**: 성공 포커스 = 편집기 열기(UX5-AC-08) · 실패 포커스 유지 · `aria-busy` · status/alert 역할 · 버튼 0 행에서 포커스 유실 0.
4. **Ego Lite(필수 — Developer BLOCKED 보완)**: build + preview `--port 4382 --strictPort`(포트 확인). 해제 save **실패 행**을 실화면에서 만든다(예: 다른 탭이 writer 잠금 보유 상태에서 편집 → 이탈 → readonly 실패, 또는 quota 주입 — 실제 `navigator.locks` held 기록) → "저장하지 못했습니다" + "다시 저장" → 잠금 해제 뒤 "다시 저장" → 일반 행·IDB 마지막 편집. `PendingStart` 행("시작 다시 시도")도 가능하면 실화면. 1280·390. 끝나면 IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·리슨 0. 영환님 창·main 5480 무접촉. 불가하면 사유와 BLOCKED.
5. **fresh 게이트**: `typecheck`·`lint`·`npm test -- --run`(기대 332/2968)·`build`(`/studio` 129.09/130.44 · 복원 132.07 — 증분 0 · `/projects` 99.18/109.64). 기존 테스트 수정·삭제는 `ProjectsPending.test.tsx` 라벨 교체 외 0이고 약화가 아닌지.

## 제외
- 앱·테스트 수정 커밋 금지. push·원격 쓰기·다른 워크트리(`rs6-l4-ux` 포함)·Codex 금지.

## 산출물
- `dev/active/rs6-l5-projects/QA-REPORT.md`: 0. 판정(PASS / PASS with notes / FAIL — 거짓 saved·confirmed 또는 미확인 쓰기 은폐 경로가 있으면 FAIL) 1. 손실·거짓 상태 표 2. 변이 표 3. 접근성 4. 실화면 5. 게이트 6. 사실/추정/미확인
- `QA-PROGRESS.md`. 로컬 커밋은 이 두 파일·`qa-shots/`만(명시 경로).
- 첫 3턴 QA-BRIEF·QA-PROGRESS 커밋. 45턴부터 마감. 최대 55턴. 서브에이전트 불필요.
