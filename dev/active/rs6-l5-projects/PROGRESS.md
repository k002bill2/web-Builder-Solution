# RS6-L5 PROGRESS — `/projects`·프로필 연결

브랜치 `k002bill2/rs6-l5-projects` · base `aca09805` · BRIEF: `BRIEF.md`

## 체크리스트
- [x] 0. 착수 — BRIEF·PROGRESS 커밋 (`3be3b529`)
- [x] 1. 정본·인계 읽기 (PLAN 6절 L5 · INTEGRATE-6 r1 8.1/12.1 · UX-5 UX5-AC-08 · L3b QA note 1 · L2 QA 4절 · L1 REPORT)
- [x] 2. 기준선 fresh (test 수 · build 예산 표)
- [x] 3. CP1 행 "저장 확인" → confirm 1회 · 성공 포커스 · 저장 성공 뒤 기억 0 — RED → GREEN
- [x] 4. CP1b 코어 dirty/inflight/failed 행 표시 · "다시 저장" · reject 매핑 — RED → GREEN
- [x] 5. CP2 PendingStart 유지 · "시작 다시 시도" → retryStart · restartFlow 연결 — RED → GREEN
- [x] 6. CP3 편집기 밖 이미지 확인 (코어 바인딩 경유) — RED → GREEN
- [x] 7. fresh typecheck · lint · test · build (예산 표 · /studio 증분 0)
- [x] 8. Ego Lite 실화면 (1280·390) + 정리
- [x] 9. Codex review 1회 — 지적 0 → 반영 불필요
- [x] 10. REPORT.md · PROGRESS 마감 · 커밋

## 로그

### 기준선 (fresh, base `aca09805` + BRIEF 커밋)
- test: 331 파일 / 2957 통과 (`logs/base-test.log`)
- build: `/studio` 정규화 129.09 (raw 130.42) · 복원 132.07 (raw 133.45) · `/projects` 99.16 / **109.04**(BRIEF 108.92와 다름 — 기록) · `/profile` 99.56 / 120.10 · `/catalog` 100.05 / 102.39 (`logs/base-build.log`)

### 설계 결정 (advisor 검토 후)
- `/projects`는 코어를 만들지 않고 읽기만 — 레지스트리 읽기 접근자 `cores`(`CoreKeeper` 타입 + `memoryProjectRepository` 반환 객체 1줄). `repo.core(id, seed)` 호출 금지(starter 없는 코어 생성 · memory 경고 상시).
  - 단독 측정: `/studio` 정규화 129.09(+0.00) · 복원 132.07(+0.00) · raw 130.44(+0.02 해시 흔들림) (`logs/accessor-build.log`)
  - 범위 이탈 기록: `data/memoryProjectRepository.ts`·`features/studio/save/saveCore.ts`(타입만)·`pages/ProjectsPage.tsx`(배선)는 PLAN L5 쓰기 표 밖. L4 경로와 겹침 0.
- 코어 변경 신호 없음 → 행이 `inflight > 0`이면 `core.idle()` 뒤 다시 그림.
- 행 우선순위: PendingStart("시작 다시 시도") > 코어 inflight("저장 중…") > 코어 dirty(실패 "저장하지 못했습니다" + "다시 저장" = `core.save`) > PendingRecord("저장 확인").
- PendingRecord + 코어 있음 → "저장 확인" = 코어 `confirm` 1회(초안을 같은 문서로 한 번 표시해 save+verify — clean·미커밋 receipt 함정 회피). 코어 없음 → 기존 `confirmDoc` 경로.
- U16: 코어 clean·inflight 0·`confirmed.proof === "committed"`·`confirmed.revision > record.head.revision`이면 PendingRecord 해제(effect에서 settle).
- CP2: 코어 레지스트리에 starter 주입점 없음(생성은 편집기) → `/projects` "시작 다시 시도" = starter(기존 재생) 직접 1회 = `startDoc` 1회.

### RED 예측
- CP1b: 새 테스트 `components/projects/ProjectsCoreRows.test.tsx` — 저장 중 행 · 실패 행 · 다시 저장 성공/실패 · reject 매핑 · 이미지(CP3) → 접근자·행 표시 없음이라 전부 FAIL 예상(5~6건).
- CP1: 같은 파일 — 코어 confirm 1회 · clean 미커밋 receipt · U16 해제/유지 → FAIL 예상(3~4건, 유지 케이스는 PASS 가능).
- CP2: `pages/ProjectsPending.test.tsx` 라벨 "저장 다시 시도" → "시작 다시 시도"(UX-5 D1 — 단언 교체, 약화 아님) + startDoc 1회 새 단언 → FAIL 예상.

### RED → GREEN
- CP1b·CP1·CP3 RED: `logs/cp1-red.log` — 8 FAIL / 1 PASS(예측 "U16 반대"만 PASS). confirm 테스트는 기존 confirmDoc 경로로 성공 문구가 나와 `link` 0회로 FAIL(예측한 이유).
- CP2 RED: `logs/cp2-red.log` — 라벨 6 FAIL(기존 "저장 다시 시도" 단언을 UX-5 D1 "시작 다시 시도"로 교체 + 연타 1회 새 테스트).
- GREEN: 커밋 `28747748` — 프로젝트 테스트 12 파일 / 130 통과 · typecheck 0 · lint 0.
- 확인 테스트를 둘로 나눔: (a) clean·커밋 = confirm 1회·쓰기 0(C5 T13) (b) 미커밋 receipt = 쓰기 탭에서 다시 써서 확인(이 경우 link 3회: confirm·mode·confirm — REPORT 기록).
- CP1·CP1b·CP2·CP3가 같은 파일 묶음(pendingRows·pendingRetry·ProjectsPage)이라 GREEN 커밋은 1개로 묶음(RED 로그는 CP별).
- 변이 5/5 잡힘(`logs/mutations.log`): idle 대기 · U16 해제 · 확인 재쓰기 · 실패 포커스 유지 · save reject 매핑.

### 게이트 (fresh)
- test 332 / 2968 통과(`logs/full-test-1.log`, base 331/2957 + 1 파일 / +11)
- build: `/studio` 129.09(+0.00) · 복원 132.07(+0.00) · `/projects` 99.18(+0.02) / 109.64(+0.60) · `/profile` 99.56 / 120.09 (`logs/cp-build.log`)

### 실화면 (Ego Lite, preview 4381, TaskSpace 18)
- 편집 → 즉시 링크로 `/projects`(실 IDB): 목록이 그려질 때 이미 저장 끝 → 일반 행(거짓 실패 0).
- 지연 주입(페이지 안에서 `design-studio` 전 store readwrite 트랜잭션 3~4초 점유) → 행 "저장 중…"(편집기 열기 유지·버튼 0·캡션) → 2.0초 뒤 다른 이벤트 없이 일반 행. 1280·390 스크린샷 `shots/`.
- 새로고침 뒤 마지막 편집("폭 390 이탈 편집") 복원.
- 이미지: 편집기 이미지 고르기 → 바로 링크 이탈 → 일반 행 → 새로고침 → IDB `images` = `project-1/4a758fcb…` 1건 · 문서 참조 일치.
- BLOCKED(단위로 갈음): 해제 save **실패** 주입·`PendingStart` 행("시작 다시 시도")은 앱 안에서 만들 수 없음(IDB 쓰기 실패·restart 실패 주입 경로 없음) → `ProjectsCoreRows.test.tsx`·`ProjectsPending.test.tsx`.
- 정리: IDB `design-studio` 삭제(databases [] 확인) · finish · listTaskSpaces 0 · 서버 종료(리슨 0) · 5480 무접촉.
