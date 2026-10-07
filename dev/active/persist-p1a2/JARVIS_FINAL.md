# PERSIST-P1a-2 JARVIS_FINAL

- 흐름: 구현 `c931073`(예산 멈춤 129.38) → 영환님 ★A ADR-004 개정 10 → 마감 BRIEF-F(1차 usage limit 429 무변경, 재시작 53턴) → Codex r1 P2×2 수정 `cc6a5a9` · 예산 적용 `b801ab3`/`41f65f9` → Codex r2 P1×1·P2×2 수정 `f2eaab3` · 기준선 `f73af1a` 129.41(라운드 상한, r3 없음).
- Ego Lite: 새로고침 2회 — 편집 유지 · /projects 유지 · 스냅샷 목록(수정 뒤 재확인) · v1→v2. Jarvis 캡처 직접 확인(4·5번). 테스트 IDB 삭제·창 0.
- Jarvis 최종 검증 `scratch/persist-p1a2-final-gates/`: typecheck·lint·build exit 0 · vitest ×3 모두 2275 PASS · `/studio` 129.41 / 130(상한 129.60, 여유 0.19).
- ADR-004 개정 9·10 적용 커밋: `b801ab3`(한도 130) · 기준선 `f73af1a` 129.41.
- 남은 것: 생성 중 새로고침 실측 · /projects 빈 상태 문구 local(P1c) · 복원 재생 "마지막 1건" 한계 · P1b 이미지 · P1c 다중 탭 · P1d 스냅샷 보존.
