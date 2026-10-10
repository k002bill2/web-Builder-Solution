# RESTART-IMPL PROGRESS

- base main `9d5076e` · 브랜치 `k002bill2/restart-impl` · 시작 2026-10-11 00:46 · `npm ci` exit 0 · lock 변경 0
- 정본: `docs/design/restart/SPEC.md` r1 + `MQ.md`(S1~S5 A)
- 상태: **중단 — SPEC r1 Codex 재검증 P1 1건(브리프 "P1 → 멈추고 보고")**. 보고 = `REPORT.md`

## 체크포인트

- [x] 0 P0 PROGRESS 커밋 `6b5aaa7`
- [x] 1 SPEC r1 Codex 재검증 — **P1 1 · P2 8**(`logs/codex-spec-result.md`). 판정이 구현 시작 뒤에 도착함(순서 이탈 — REPORT 1절)
- [x] 2 저장소 MQ-S2 A — `5aeb045`(RS-AC-08·08b·08c 단위 5/5). Codex가 잠금 경로 원자성·멱등·stale 결함 없음 확인
- [ ] 3 화면 F3/F4·대화상자·결과 문장·R-D5 — BLOCKED: `7e8ace8`로 구현됐으나 SPEC r2(P1 계약 · P2-3·4) 대기, 미승인
- [ ] 4 게이트·예산·Codex branch review — BLOCKED: 로컬 4종 통과(lint·typecheck·vitest 2708/2708·build exit 0)지만 RS-AC-13 실패(`/profile` 진입 직후 +0.36), branch review는 SPEC r2 뒤
- [ ] 5 Ego Lite RS-AC-14·15 — BLOCKED: 코드가 SPEC r2로 바뀔 수 있어 실행 보류
- [x] 6 BACKLOG B-ER-01 결과 표기 · REPORT

## 서브에이전트

- 조사 1(읽기 전용, Explore) 저장소 restart·잠금 경로 — 완료. 결과: 잠금 확인이 commit 뒤 flush에만 있음 · LocalSync에 enter 노출 없음 · INFRA 사유는 message에만(필드 없음) · 다중 탭 테스트 하네스 `writerLock.test.ts` openTab/seeded · 로컬 싱크+delay 조합 선례 없음. `restartLock.test.ts`가 이 하네스를 따름
- 조사 2(읽기 전용, Explore) 프로필 화면·대화상자 패턴 — 완료. 결과: compareLoader는 손 복제 로더 · 대화상자 버튼 행 관례 `[취소][주]` DOM 순서 + `justify-end`, reverse·세로 쌓기 선례 없음 · 제목 tabIndex=-1 대화상자 선례 없음 · 월·일 시각 형식 함수 없음 · CandidatesSection에 이전 버전 팔레트 없음 → 대화상자가 `getProfile`로 읽음
- 쓰기는 메인만

## TDD 기록 (RED 예측 → 결과)

- restartLock(저장소): 예측 "잠금 없는 탭 restart가 메모리를 바꿈" → 결과 3/5 실패(08 readonly·stale 2건 = 예측대로 메모리 변경, 08c 1건 = 테스트 오류: 스냅샷에 `revision` 필드 없음 → `doc.revision`으로 수정). 08b·create 2건은 회귀 고정용이라 처음부터 통과. 구현 뒤 identity 비교(`toBe`)가 청크 로드 뒤 사본이라 실패 → `toEqual`로 수정 → 5/5
- ProfileRestart(화면): 1차 = 모듈 없음 import 실패 · `restartText` 추가 뒤 13/14 실패(대화상자·분기 없음, 순수 문구 1건 통과) → 구현 → 11/14 → 테스트 `seq` 번호 오류(셋업 create 1 · UI create 2 · restart 3) 수정 → 14/14
- 전체: 2706/2708 → 엔진 import 가드(대화상자가 `engine/gate` import) → domain 함수로 교체 · 기존 F2 단언 셋업이 create 멱등 재생에 걸림 → 셋업 변경 → 2708/2708
