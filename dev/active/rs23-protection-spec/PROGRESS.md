# RS23 이탈 보호 확장 (SPEC-4) — PROGRESS

base 설계 7dbf116 · 앱 93f8111 · branch k002bill2/rs23-fix · 문서만(앱·예산·SPEC-3·CLAUDE.md 변경 0) · 시작 2026-10-13 07:03

- [x] 0. BRIEF · 앞 REPORT · final-gate(REPORT·QA-JUDGMENT·codex-r3) · SPEC-3 r0.2 · MQ-3 읽기
- [x] 1. 조사 병렬 2개(읽기 전용) — A: unload/history 수명 · B: 기존 write-confirm/재시도 수단
- [x] 2. 원인/복구표 체크포인트 (F1·F2·history 재진입 · 판정표)
- [x] 3. SPEC-4.md 작성 (닫힌 상태·보호·재시도/확정 경로 · 구현 계획 4 CP)
- [x] 4. MQ-4.md 작성 (예산 관문 · 새 계약 필요 여부)
- [x] 5. Codex adversarial-review 1회(logs/codex-a1.txt, needs-attention P1 2·P2 1) + advisor 점검 → r0.1 한 번 반영 · **미재검토**
- [x] 6. REPORT.md (F1/F2 닫힘 · 보호범위 · 브라우저 한계 · 측정 관문 · QA 수용기준 · 미실행 구분)
- [x] 8. MQ-4 결정 기록 (2026-10-15 사용자: 4-1 A · 4-2 A · 4-3 A)
- [x] 9. SPEC-4 r0.1b 독립 재검토(2026-10-15, `review-r01b/`) — Codex a2 needs-attention P1 1·P2 1 + 메인 P2 1 → **구현 BLOCKED**
- [x] 10a. r0.2 교정(N1 기억 토큰 해제 · N2 stale draft 충돌 복원 · N3 settling 대기 · Q-2 · Q-3) — 사용자 "1"(2026-10-15)
- [x] 10b. Codex a3 1회(3라운드 = 상한, `review-r02/`) — P1 1(전이 세대 검사) → r0.2a 반영 · **미재검토**
- [x] 10c. Codex 4라운드(사용자 승인 · 1차 usage limit 실패 → 재실행 `codex-a4b.txt`) — P2 1(기억 없음 세대) → r0.2b 반영 · **미재검토, 추가 라운드 없음**
- [ ] 11. BLOCKED: Developer 측정 관문(SPEC-4 8.0) + CP2 RED(RS4-AC-18·18b·18c)를 독립 검증으로 — 별도 구현 레인 트리거 필요
- [x] 7. diff check · 앱 변경 0 증거 · 명시 pathspec 커밋 (push/merge 0, FINAL-GATE.md 보존)

## 서브에이전트
- A unload/history 수명(Explore, 읽기 전용, 29 tool): 완료 — beforeunload 1곳(useAutosaveScheduler.ts:290-291, 편집기 수명), 저장소 탭당 1개(main.tsx·sharedLoader), POP·주소입력 가로채기 0, 요청 진행 중 기억·경고 0, 앱 공통 guard = index 청크 전 시나리오 증가. 메인 재확인: grep beforeunload/popstate 1곳 확인 · SPEC-4 2절 반영
- B write-confirm 재시도(Explore, 읽기 전용, 17 tool): 완료 — flush = 현재 메모리 레코드 전체·IDB oncomplete 뒤 resolve, startDoc 같은 키 재생은 판정보다 앞·saveDoc 뒤에도 성공, deleteSnapshot(없는 id) = 변화 0 + flush(인터페이스 0), saveDoc 같은 내용 = revision+1. 메인 재확인: memoryDocBook.ts:285-291·358-366·374-386, projectRepository.ts:157, localSync.ts:189-192 직접 판독 — 일치
