# RS7-A QA PROGRESS

대상: `k002bill2/rs7-dead-conflict` tip `99e33ac8`, base `73289c90`. 브리프: `QA-BRIEF.md`.

- [x] 1. CP0 독립 재증명 — STALE_DOC 생산자 전수(base 비테스트) · scheduler `stale` 진입 · io.save 밖 throw 후보 임시 테스트(삭제)
- [x] 2. 제거 범위 — `git diff 73289c90 -- app/src` 대조 · 무접촉 항목 · 지운 테스트 −9건 행별 판정
- [ ] 3. 회귀 변이 3종(매번 `git checkout -- app/`) — 스냅샷 복원 STALE_DOC · stale 행 reason 매핑 · discard reload
- [x] 4. 예산 — fresh build · /studio · 복원 · raw · 기준선 · check-bundle-size.mjs 무변경
- [ ] 5. 실화면 — preview 4389 · stale 행 버리고 새로고침 · 링크 이탈 IDB · 스냅샷 복원 · 정리
- [x] 6. fresh 게이트 — typecheck · lint · test
- [x] 7. QA-REPORT 초안 커밋
- [ ] 8. preview 종료 · 4389 리슨 0 기록 · 최종 커밋
