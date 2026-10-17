# RS6-L3b FIX1 BRIEF — 이미지 고른 직후 이탈: 해제 save가 끝날 때까지 이미지 맵 유지 (Developer, 좁은 수정)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs6-l3b-leave` (tip `a8163a66`). 근거: `dev/active/rs6-l3b-leave/QA-REPORT.md` 0절 note 2 · 1절 #9(잠재 High) · L3a 인계 8(편집 틀 이미지 맵 cleanup).

## Jarvis 판정
- QA PASS with notes지만 note 2는 **링크 이탈 무손실이 React commit 순서에 기대는 상태**다. main 링크는 마운트된 채 저장을 기다려 이 의존이 없었다. MQ-6-7 A로 대기를 없앤 이 레인이 만든 의존이므로 **머지 전에 닫는다**.
- 같은 뿌리인 POP 이미지 소실(main과 같은 기존 결함)도 이 수정으로 함께 닫히면 닫는다.

## 범위 (이 수정만)
1. 편집 틀 effect cleanup(`StudioLayout.tsx:310` → `memoryProjectRepository.ts:166` `maps.delete`)이 **lease 해제 save가 이미지 맵을 읽거나 코어 바인딩으로 옮긴 뒤**에만 맵을 지우게 한다. 후보(최소안 선택·근거 기록):
   - (a) 해제 save 시작 때(언마운트 동기 구간) `link.images()`를 코어 바인딩에 먼저 합친다 → 맵 삭제 순서와 무관.
   - (b) `maps.delete`를 코어 chain 뒤(`idle()` 뒤)로 미룬다.
   - (c) `edit()` 때 바인딩 동기 합치기(INTEGRATE-6 G2 원안 — L3a가 ingest 직후 맵 state 미갱신으로 못 한 이유를 다시 확인).
   - 탭 수명 Blob 보유가 늘면 해제·GC 규칙(바인딩 committed 뒤 정리)을 함께.
2. RED 먼저(실제 저장소 · 임시가 아니라 정식 테스트):
   - 링크: 이미지 ingest 직후 `leave()` + **같은 태스크 언마운트** → IDB images 1 · 문서 이미지 참조 일치 · dirty 0 (QA 임시 테스트 재현을 정식화).
   - POP: 이미지 ingest 직후 언마운트(저장 대기 없음) → 해제 save가 이미지까지 커밋 · 재진입 이미지 복원.
   - 재진입 뒤 글자 편집이 `failed`로 고착되지 않음.
   - 기존 `imagePersist`·`imageRecord`·이미지 undo·SnapshotImages 회귀 GREEN.
3. 예산: 현재 129.03/130.36 · 복원 132.01/133.39, 상한 129.13/130.5/132.11. 증분 생기면 실측 갱신(개정 17). 상한 초과 → 감량 1회 → 멈춤.

## 규칙
- TDD(RED 로그 `dev/active/rs6-l3b-leave/logs/fix1-*`). 기존 단언 약화·skip 0. 범위 밖 변경 0(문구·`/projects`·L4 금지).
- Ego Lite(짧게): build + preview `--port 4379 --strictPort`. 이미지 교체 직후(표시 즉시) 링크 이탈 → `/projects` → IDB images·재진입 복원 / 이미지 교체 직후 뒤로 → 재진입 복원. 정리(IDB 삭제·finish·listTaskSpaces·서버 종료·리슨 0). 5480 무접촉.
- fresh `typecheck`·`lint`·`npm test -- --run`·`build`. REPORT에 "FIX1" 절(선택안·근거·테스트·예산·실화면·남은 것). 명시 경로 커밋, amend·rebase·push 금지.
- 첫 3턴 BRIEF-FIX1·PROGRESS 갱신 커밋. 최대 60턴, 45턴부터 마감. 서브에이전트 불필요.
