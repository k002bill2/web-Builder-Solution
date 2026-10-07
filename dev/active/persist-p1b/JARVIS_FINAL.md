# PERSIST-P1b JARVIS_FINAL

- 흐름: 구현 `4950ccb`~`8153a1f`(Hermes 래퍼 SIGTERM, 작업자 정상 완료) → Codex r1(Jarvis) P1×1·P2×2 → 영환님 ★A ADR-004 개정 11 → BRIEF-R2(턴 한도 41/40 → 축소 재개 1회 17턴) `c773178`·`82efd7a`·`217ce5c` → Codex r2 P1×1·P2×2 → BRIEF-R3 `1259539`·`095f70e` · ③ 예산 멈춤(129.62 > 129.60) → 영환님 ★A ADR-004 개정 12 → Jarvis 패치 적용·기준선 `260b9e3`. Codex 라운드 상한(r3 없음).
- Ego Lite(구현 레인): 단색 PNG 업로드 → 새로고침 1회·이탈 후 재진입 이미지 유지 — Jarvis 캡처 직접 확인(2·4번). 테스트 IDB 삭제·창 0. 이후 수정은 회귀 테스트 증거.
- Jarvis 최종 검증 `scratch/persist-p1b-final-gates/`: typecheck·lint·build exit 0 · vitest ×3 모두 2305 PASS · `/studio` 129.62 / 130(상한 129.65) · 저장 데이터 복원 진입 132.65 / 134.
- 알려진 기록: BRIEF-R2 재개 레인 amend 1회(푸시 전, BRIEF-R3부터 금지 명시). 남은 것: 이미지 기록은 문서 저장에 묶임(2초 디바운스) · 복원 한도 재검사는 보수적 상한 · P1c(다중 탭·데이터 지우기에 images 포함·문구) · P1d(프로젝트 삭제 시 이미지 함께).
