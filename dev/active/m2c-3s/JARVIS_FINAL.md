# Jarvis 최종 회수 — M2C-3S 구조 점검

- base d25fe49 / HEAD f9300fa. worker 57/70 success. runDocOp를 진입 청크 docOps.ts → 조작 뒤 청크 docEngine(docOpRun.ts)로 이동, 새 lazy 청크 0. /studio 진입 127.36→127.14(−0.22). 동작 변화 0(이동 전에도 loadDocEngine await 뒤에서만 실행). Codex r1 0.
- Ego Lite: 앱 안 클릭으로 이동·삭제·되돌리기 실행, 캡처 3장(Jarvis가 move-1280 육안 확인 — 순서·알림 정상, 깨짐 없음), 레인 space 닫힘 listTaskSpaces()=[] 기록.
- Jarvis 새 실행: typecheck·lint·build exit0, vitest 3회 각 1980/1980 exit0. 로그 logs/jarvis-final/.
- 검사기 주석(STUDIO_AFTER_ACTION docEngine 설명) 낡음 → 다음 scripts 개정 때 반영. push·배포 없음.
