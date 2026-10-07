# PERSIST-P1b Developer 브리프 — 이미지 영속 · 새로고침/재진입 뒤 이미지 복원

- 역할 Developer / Orca managed Claude Code / worktree persist-p1b / base `a07ba59`(P1a 병합: 진입 하이드레이션·IDB 저장 배선, ADR-004 개정 9·10 적용 `/studio` 129.41 / 130). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/decisions/ADR-007-local-persistence.md`(2절 6~8 · 3절 (a) `images` 저장소 `[projectId, localId]` → 변형본 Blob + 메타 동봉 · 5절 **P1b 행** · 부록 Codex 제약 2 "이미지 초기 자동 복원" · 개정 1), `docs/decisions/ADR-004-performance-budgets.md` 개정 9·10(영속 진입 몫 상한 **129.60**, 지금 129.41 → **여유 0.19**), `dev/active/persist-e0/E0.md`(이미지 자동 복원 진입 몫 실측 +0.15), `dev/active/persist-p1a2/REPORT.md`·`JARVIS_FINAL.md`(배선 구조·한계), `dev/active/persist-p1a1/REPORT.md`, 2a-05 5.9(이미지 한도 24개·60MB/프로젝트·참조 집합 정리 규칙). 이미지 코드: `app/src/features/studio/images/**`(`imageStore.ts` `WeakMap<Blob, ImageMeta>` — 메타는 Blob 옆에 함께 저장해야 함).
- 범위 밖: 다중 탭/Web Locks·"데이터 지우기"·사용량 표시·문구 분기(P1c), 스냅샷 보존·삭제·단조 카운터(P1d), 내보내기/가져오기(P2).

## 범위 (2건)
1. **이미지 저장**: 이미지 추가·교체·삭제 시 `images` 저장소에 변형본 Blob(640/1280/1920) + 메타(width·height·format·bytes) 기록 — P1a 쓰기 큐 경유, 조작 뒤 청크. 정리 = 5.9 참조 집합 규칙 그대로(문서·스냅샷이 참조하지 않는 이미지만 삭제, 기존 판정 함수 재사용). 한도(24개·60MB) 판정 변경 0. 저장 실패 = INFRA, 기존 저장 실패 흐름.
2. **이미지 자동 복원**(Codex 제약 2): 문서 하이드레이션 직후 **첫 화면 렌더에 필요한 참조 집합**의 이미지를 자동 복원(보기만 하는 사용자도 이미지가 보여야 함) → 메모리 imageStore 재구성(메타 WeakMap 포함). 복원 못 한 참조는 기존 "잃은 이미지" 경로(QB-10)로 — 개수 문구·자체 그래픽 대체 그대로. 편집기 이탈 뒤 재진입에서도 같은 복원.
   - **예산**: 진입 증가는 기준선 상한 129.60까지(실측만큼 `m2cBaseline.json` 갱신 커밋 "ADR-004 개정 9·10 배분 P1b", `bundleBudget.test.mjs` 고정값 같은 커밋, 판정 로직 변경 0). **129.60 넘으면 구현 멈추고 보고.** 복원 본체(Blob 읽기·imageStore 재구성)는 조작 뒤/별도 청크로 두고 진입에는 최소 트리거만.

## 검증
- TDD(예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0). 메모리 가짜로: 저장 → 직렬화 경계(Blob 보존) → 새 세션 복원 → imageStore 메타 일치 · 참조 없는 이미지 정리 · 복원 실패 = 잃은 이미지 경로 · 저장 실패 재시도. 복원 데이터 검증은 **실제 저장소 규칙과 1:1**(P1a 교훈 — 한도·포맷 판정 함수 재사용).
- **Ego Lite**(핵심 증거): build + `vite preview --port 4337`(dev 금지), 창 minimized면 `Browser.setWindowBounds normal`, 캡처 `captureBeyondViewport:false`+clip ≤4장(`dev/active/persist-p1b/shots/`). 시나리오: 상세 "비교 추가" → 프로필 → 3안 → 편집 시작 → **이미지 슬롯에 이미지 1장 업로드**(테스트용 이미지는 스크립트로 생성한 단색 PNG 등 — 개인 사진·외부 이미지 금지) → "이 브라우저에 저장됨" → **새로고침(허용, 횟수 기록)** → `/studio/:projectId` 직접 진입 시 이미지 표시 유지 · 편집기 이탈 → `/projects` → 재진입 시 이미지 유지. 끝나면 `indexedDB.deleteDatabase("design-studio")` 결과 기록 → `finish({keep:[]})` · `listTaskSpaces()`=[] · 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 마감: typecheck·lint·build exit 0(번들 표 전 행) · 전체 vitest 1회 exit 0 · REPORT(번들 증가·Ego Lite 결과·P1c/P1d 입력). **Codex는 Jarvis 몫 — 하지 말 것.**

## 금지·운영
- 엔진·PageDoc 계약·이미지 한도·포맷 판정 변경 0, docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, P1c·P1d·P2 범위 0. 서브에이전트 0, push/merge/삭제 0(테스트 IDB 삭제 허용), 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 1번 구현 커밋 30턴 전, 2번 커밋 42턴 전, Ego Lite는 45턴 전 시작, 52턴부터 새 구현 중단 → 게이트 → REPORT. REPORT 초안 56턴 전 커밋. 한국어.
