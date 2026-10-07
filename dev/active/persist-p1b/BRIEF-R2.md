# PERSIST-P1b 수정 브리프 (BRIEF-R2) — Codex r1 3건 · ADR-004 개정 11 적용

- 같은 worktree `persist-p1b`, HEAD `c76960c`(P1b 구현 + main 병합: **ADR-004 개정 11** — `/studio` "저장 데이터 복원 진입" 시나리오 한도 134 · 멈춤선 133.70 · 기준선 잠금 · 기존 130 그대로). 영환님 ★A(2026-10-07). Codex r1 원문 `dev/active/persist-p1b/codex-r1-jarvis.txt`. 기존 REPORT·PROGRESS 먼저 읽기.
- **이번이 Codex 마지막 라운드 대상 수정** — Jarvis가 수정 뒤 r2를 돌린다.

## 범위 (3건, 이 순서)
1. **[P1] 개정 11 적용**: `check-bundle-size.mjs` `SCENARIOS`에 `/studio/:projectId` "저장 데이터 복원 진입"(자동 복원 청크 = `imageRestore`와 그 정적 의존성 포함) 시나리오 1행 + 한도 134(주석 "개정 11"). **판정 로직 변경 0.** 먼저 복원 청크 감량 **1회** 시도(예: 진입 트리거가 받는 청크와 저장 쪽 공유 모듈 경계 재배치 — 검증 1:1은 유지, 검증 삭제 금지) → 실측 → `m2cBaseline.json` 복원 시나리오 기준선 + `bundleBudget.test.mjs` 고정값 — **한 커밋**("ADR-004 개정 11 — 복원 진입 시나리오"). 133.70 넘으면 멈춤. 기존 `/studio` 130 시나리오 기준선(129.57) 증가 시 상한 129.60 안에서만.
2. **[P2] 편집기 이탈 시 이미지 맵 해제**: StudioLayout effect cleanup으로 해당 프로젝트 맵 등록 해제 — 진행 중 저장에 필요한 데이터는 확보 뒤(저장 트랜잭션이 맵을 이미 읽었는지 확인). 회귀 테스트: 등록 → 언마운트 → 저장소 maps에 그 프로젝트 없음 · 진행 중 저장 결과 그대로.
3. **[P2] 복원·업로드 병합 뒤 최종 한도 검사**: 복원 완료 시 **최신 문서·참조 집합 + 최종 병합 맵**으로 `checkLimits`(기존 함수 그대로). 초과 시 처리 = 사용자가 방금 넣은 이미지는 유지하고 한도를 넘기는 복원분을 기존 잃은 이미지 경로로(또는 복원 끝날 때까지 추가 차단 — 기존 UI·문구 재사용 가능한 쪽, 선택 근거 REPORT). Codex 예시(기존 20MB 복원 지연 중 20MB 추가 → 페이지 30MB 초과)를 회귀 테스트로.

## 마감·금지
- TDD 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0. typecheck·lint·build exit 0(번들 표에 복원 진입 행) · 전체 vitest 1회 exit 0 · REPORT "Codex r1 수정(BRIEF-R2)" 절. Ego Lite 불필요(2번·3번은 테스트 증거). **Codex 실행 금지.**
- 엔진·PageDoc 계약·이미지 한도 값·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, P1c·P1d·P2 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. main 5480 무접촉.
- **턴 관리:** 1번 커밋 18턴 전, 25턴부터 새 수정 중단 → 게이트 → REPORT, REPORT 초안 30턴 전 커밋. 한국어.
