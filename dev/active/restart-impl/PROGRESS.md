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

## RESUME-1 (2026-10-11 02:03 시작 · 정본 SPEC r2 + MQ S1~S7 · 시간 상한 90분)

- [x] R1 `git merge --no-ff main`(b416328) → 충돌 0 · lock 변경 0 · typecheck exit 0 · 3개 파일 33/33 · 새 base 빌드(임시 worktree `/tmp/restart-impl-base`, 실측 뒤 제거) `logs/base-build-r1.txt`: /profile 120.01 · 122.49 · /studio 129.63 · 132.67
- [x] R2 3.3.1 실패 판정 순서(커밋 확인 먼저 → R-E4 / 음성 → 코드·사유 / 확인 실패 R-E5) · RS-AC-07·07b·07c·08b·08d(미확인 기억)
- [x] R3 P2: STALE 재판정(06b · R-E1b) · create 재생 재판정(17 · R-C3) · R-D2 문구 · 성공 state {editNotice}만(18) · RS-AC-01 · 스냅샷 id 집합(04·08b·10·11)
- [ ] R4 MQ-S7 A 배치(Promise.all · create 판정 = 조작 뒤) · /profile 진입 직후 ±0.03 · /studio ≤ +0.05 — BLOCKED: 배치 변경·감량 1회(로더 3개 본문 공용화 retryLoader) 뒤에도 /profile 120.10(+0.09) · 122.58(+0.09) > ±0.03 → MQ-S7 재상신(B 자동 전환 금지). /studio 129.65 · 132.69(+0.02 · +0.02, 몫 안) → 기준선 갱신
- [ ] R5 게이트 4종 → Codex review --scope branch --base main(≤2라운드)
- [ ] R6 Ego RS-AC-14·15
- [ ] R7 REPORT "RESUME-1" 절 · BACKLOG B-ER-01

### RESUME-1 TDD·측정 기록
- 배치 1차 build(`logs/build-r1a.txt`): /profile 120.21(+0.20) · 122.68(+0.19) · /studio 129.67 · 132.70(exit 1 기준선) → 감량 1회 = compare·candidateResults·restart 로더 본문을 `retryLoader.ts`로 공용화 → `logs/build-r1b.txt` 120.10 · 122.58 · 129.65 · 132.69. 추가 감량 없음(RESUME "감량 1회 → 멈추고 수치 보고")
- 기존 테스트 RED 예측 "R-D2 문구 · 성공 state changes · R-E4 버튼 3건" → 결과 정확히 3건 실패 → SPEC r2 행으로 갱신(R-D2 r2 P2-5 · RS-AC-04/RS-D9 · RS-AC-08b P2-2 — SPEC이 바꾼 단언, 약화 아님)
- 새 테스트는 구현 뒤 작성 → 변이로 RED 확인: ① `committed` 읽기 실패 → "no" + 미확인 기억 끔 = 3건 실패 ② 커밋 확인 먼저 끔(unknown만) = 5건 실패 → 원복 28/28
- 테스트 오류 1건: RS-AC-17 "getDoc 실패 → F1 알림 없음"을 editNotice undefined로 단언 → SPEC 3.1 F1 = `{changes, editNotice: changeNotice}`라 테스트를 "F2·F3 알림 없음"으로 수정
- 게이트: typecheck exit 0 · lint exit 0 · vitest 302 files / 2739 passed · build exit 0(`logs/build-r1d.txt`, 기준선 갱신 뒤)
