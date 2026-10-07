# PERSIST-E0 Developer 브리프 — P1-E0 번들 실측 스파이크 (ADR-007 MQ-P5 관문)

- 역할 Developer / Orca managed Claude Code / worktree persist-e0 / base `a55966c`(ADR-007 채택 — 영환님 "전부 ★A"). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/decisions/ADR-007-local-persistence.md`(2절 사실 9 · 3절 (a) 번들 51행 · 5절 Phase 표 P1-E0 행 · 부록 Codex 제약 1~3), `docs/design/persistence/MQ.md` P5·P6, `dev/active/persist-adr/FACTS.md`, ADR-004(`/studio` 진입 128.51 · 기준선 128.55 · 판정선 128.58).
- **이 레인의 목적은 "측정"이다 — 기능 완성 아님.** 범위는 아래 2건만.

## 범위 (2건)
1. **진입 몫 스파이크 + 실측**: ADR 5절 P1-E0 정의 그대로 — 진입 읽기기(IndexedDB 열기·단건 읽기·봉투 검증 중 진입 몫) + 대기 Promise + `"local"` 값·문구 분기 + **문서 하이드레이션 직후 이미지 자동 복원 시작 경로(Codex 제약 2 — 진입에 드는 몫)**를 최소 코드로 넣고, 쓰기 큐·이행·스냅샷·삭제는 넣지 않는다(조작 뒤 몫은 넣지 않음 — 측정 대상 아님). 실측 시나리오: `/studio/:projectId` 진입 직후, `/projects`, 그 밖 라우트 전 행. 배치를 바꿔 가며 2~3안 측정(표). 새 의존성 0, IDB는 브라우저 API 직접.
2. **Codex 제약 1 결정 자료**: 진행 중 3안 생성 잡 복원 — "재계산 재시작" vs "hidden 영속"을 코드(L1)로 비교(결정성 근거·수정 지점·진입 영향)하고 추천 1개. 구현은 하지 않음.

## 판정·산출
- 결과 `dev/active/persist-e0/E0.md`: 배치안별 `/studio` 진입 KB 표(L1, `npm run build` check-bundle-size), 판정 = **128.58 이하 배치안 존재 여부**. 없으면 최소 초과량과 그 원인(모듈별) — 예산 MQ 재상신 자료(Jarvis가 영환님께).
- **스파이크 코드는 브랜치에 커밋해 보존하되 병합 대상 아님**(Jarvis 판정). 기존 동작 변화 0을 유지할 필요는 없지만, 전체 vitest는 돌려 깨지는 테스트를 기록(수정 필수 아님).
- 기준선(`m2cBaseline.json`)·검사기·엔진·계약·docs/**·lock·CLAUDE.md 수정 0.

## 운영
- Ego Lite는 **선택**: 실제 IndexedDB 열기·읽기 동작을 확인할 필요가 있으면 build+`vite preview --port 4337`, 창 minimized면 normal, `captureBeyondViewport:false`+clip, 앱 안 클릭만, 끝나면 `finish({keep:[]})`·`listTaskSpaces()`=[]·서버 종료. 안 쓰면 REPORT에 사유.
- **Codex는 Jarvis 몫 — 하지 말 것.** 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** E0.md 측정표는 30턴 전 커밋, 35턴부터 새 측정 중단 → REPORT. REPORT 초안 40턴 전 커밋. 한국어.
