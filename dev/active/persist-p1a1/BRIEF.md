# PERSIST-P1a-1 Developer 브리프 — 영속 어댑터 · IDB 구현 · 직렬 쓰기 큐 (배선 없음)

- 역할 Developer / Orca managed Claude Code / worktree persist-p1a1 / base `2700242`(ADR-007 채택·개정 1 + ADR-004 개정 9). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/decisions/ADR-007-local-persistence.md`(3절 (a) 데이터 모델·봉투·쓰기 큐 · 5절 P1a 행 · 부록 Codex 제약 3 · **개정 1: StoredJob 통째로 영속, 진입 검증은 수제 schemaVersion만**), `docs/design/persistence/MQ.md`(P6 A: 메모리 가짜 + 의존성 0), `docs/design/persistence/THREATS.md`, `dev/active/persist-adr/FACTS.md`, 스파이크 참고 `git show k002bill2/persist-e0:app/src/data/localEntry.ts`(측정용 — 그대로 가져오지 말고 설계 근거로만).
- **P1a를 둘로 나눔(턴 한도 대응).** 이 레인 = 라이브러리 층만, **앱 배선 0**(진입·저장 경로·화면 연결은 P1a-2). 그래서 번들 변화 ≈ 0이 정상.

## 범위 (2건)
1. **`StudioPersistence` 어댑터 + 구현 2개**: 인터페이스(열기·레코드 읽기/쓰기·삭제·트랜잭션 단위 쓰기, 봉투 `{schemaVersion, kind, id, data}`) + **메모리 가짜**(단위 테스트용) + **IndexedDB 구현**(브라우저 API 직접, 새 의존성 0, `onupgradeneeded` 저장소 생성·버전 이행 골격, 연결 실패·blocked·quota 오류 → `INFRA` 분류). 진입 읽기 몫(열기·단건 읽기·수제 schemaVersion 확인)은 **작게 분리된 함수**로(P1a-2가 진입에 둘 것), 쓰기·이행·zod 검증은 별도 모듈(조작 뒤 청크 예정).
2. **직렬 쓰기 큐(Codex 제약 3)**: 저장 요청 → 큐 → IDB 트랜잭션 **complete 이벤트 뒤에만 resolve**(성공 = IDB 커밋 확인), 실패 → reject + 기록은 "미확인"으로 남김, 같은 요청 멱등 재시도는 **미확인 기록을 재제출**, 순서 보장(같은 키 뒤 쓰기가 앞 쓰기를 덮음), 실패 후 다음 요청 처리 규칙. StoredJob 직렬화(hidden·attempts 포함)와 "요청 → getJob 1회 → 직렬화/역직렬화 → getJob 반복 = succeeded" 테스트(개정 1).

## 테스트·검증
- TDD(예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0). 단위 테스트는 메모리 가짜로 큐 순서·실패·멱등 재시도·봉투 버전 불일치. jsdom에는 IndexedDB가 없음 — IDB 구현 자체는 **얇게** 유지하고 가짜와 같은 계약 테스트를 공유(계약 테스트 함수 1벌을 두 구현에 — IDB 쪽은 브라우저 실측 몫이라 vitest에서는 skip이 아니라 "대상 없음"으로 분기하지 말고 가짜만 등록).
- Ego Lite **선택**: IDB 구현을 실제 브라우저에서 확인하려면 build+`vite preview --port 4337` 뒤 개발용 진입점 없이 앱 안에서 호출할 방법이 없으면 생략하고 REPORT에 사유(P1a-2에서 새로고침 생존으로 실측). 쓰면 창 minimized면 normal, `captureBeyondViewport:false`+clip, 끝나면 `finish({keep:[]})`·`listTaskSpaces()`=[]·서버 종료.
- 마감: typecheck·lint·build(번들 표 — `/studio` 변화 ≈0 확인, 기준선·검사기 수정 0) · 전체 vitest 1회 exit0(부하 실패 시 단독 후 전체 1회) · REPORT.
- **Codex는 Jarvis 몫 — 하지 말 것.**

## 금지·운영
- 앱 배선(main·deferredStudio·memory 저장소·SaveStatus·화면) 0, 엔진·PageDoc 계약·`m2cBaseline.json`·check-bundle-size·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 1번 완료 커밋 25턴 전, 35턴부터 새 구현 중단 → 게이트 → REPORT. REPORT 초안 40턴 전 커밋. 한국어.
