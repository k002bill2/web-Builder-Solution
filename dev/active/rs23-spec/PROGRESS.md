# RS23-SPEC PROGRESS

base 93f8111 · branch k002bill2/rs23-fix · 코드 수정 금지 (문서만)

- [x] 0. 시작 — BRIEF·SPEC r2·MQ·ADR-007·ADR-004·BACKLOG 읽기
- [x] 1. trace — B-RS-02 (startDoc create → commit → IDB flush INFRA) 코드 흐름
- [x] 1. trace — B-RS-03 (R-E4 미확인 restart → /projects → 편집기 인계) 코드 흐름
- [x] 2. draft — docs/design/restart/SPEC-3.md (상태·메시지·재시도/취소/복구·수용 기준)
- [x] 2. draft — docs/design/restart/MQ-3.md (예산·진입 증분 precondition)
- [x] 3. 저장소 계약 변경 필요 여부 판정 (메모리 전달 vs 계약 변경)
- [ ] 4. Codex 적대검토 r1 → 반영 (r1 실행 중 — logs/codex-r1.txt · 자체 발견 반영: create 커밋 확인 before 읽기 · P-U4 create 문형)
- [x] 5. REPORT.md 작성 · 커밋 (push/merge 금지)

## 서브에이전트
- RS02(Explore, 읽기 전용): 완료 — create 잠금 확인 없음(memoryProjectRepository.ts:121-122), response 단계 실패 시 flush 미실행, 같은 안·다른 버전 DOC_EXISTS로 IDB에 없는 문서 이동, stale에도 일반 문구+다시 시도. 테스트 restartLock.test.ts:136이 create 현 동작 고정.
- RS03(Explore, 읽기 전용): 완료 — 기억 restartFlow.ts:28-35, /projects 링크 state 없음, 편집기 idle 시작, 편집 저장·복원·내보내기가 레코드 전체 flush로 확정, 큐 status는 인터페이스 밖.
- advisor: B-RS-03 ★를 /studio 0B 안(/projects 게이트)으로 — 반영
