# QA-POST-MERGE PROGRESS — FIX-P1 + L4b 통합 main 독립 회귀

## 수신 기록 (첫 진행 기록)
- 2026-09-27 · Hermes QA · 브리프 `docs/06-handoff/QA-POST-MERGE_BRIEF.md` 전체(38줄) 수신·읽음.
- 검증 HEAD: 작업 공간 HEAD `471fee8` = main `99993b91ccf51457a09c991190953d99061e1f4d` + 브리프 커밋 1개. `git diff --stat 99993b9 HEAD` = `docs/06-handoff/QA-POST-MERGE_BRIEF.md`만(38+) → 제품 코드는 99993b9와 동일.
- 범위: FIX-P1(b137006) + L4b(99993b9) + 514534c 회귀. 쓰기는 `docs/qa/post-merge/`만. 이전 개발자 보고는 검증 대상 주장으로만 취급. Q-17~24는 미승인 설계 질문 → SPEC 드리프트와 런타임 결함 분리.
- 시작 시 4341 LISTEN 없음(lsof 출력 없음).

## 체크리스트
- [ ] 1. 게이트: typecheck · lint · test(전체 1회) · build — 원본 로그 + exit code
- [ ] 2. 엔진 표적 테스트 + 514534c 단언 보존 검토 (서브에이전트 읽기 전용 + 메인 실행)
- [ ] 3. L4b 계약: createDocFromCandidate 유효·결정성·불변성, runGate 8줄, 7:1 불가 조합, SPEC 드리프트(Q-17·Q-19 등) 분리
- [ ] 4. 번들: 전 시나리오, 첫 화면 100 / 자동 125 / 여유 0.3, 화면 engine import 0, /profile afterAction 분류
- [ ] 5. D-2A4B2-01 경로 A (계측 없는 새 문서) + 경로 B, 4.5 AA 회귀
- [ ] 6. D-2A4B2-02 요청 실패 / 응답 실패 재시도 → 포커스·버전 중복
- [ ] 7. D-2A4B2-03 없는 ?v= 저장 알림 유지
- [ ] 8. 5폭 캡처 + 가로 넘침 + 키보드
- [ ] 9. VoiceOver·Safari 접근 여부 (불가 시 미검증)
- [ ] 10. preview 종료 + lsof 증거
- [ ] 11. REPORT 작성·경로 지정 커밋

## 로그
