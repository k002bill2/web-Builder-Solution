**판정: B-M2B-05d = BLOCKED(부분 실측 — 선택 안 C 값은 계산식 일치, A안 대조 미취득) · B-SEC-09 ②④ = BLOCKED(시간 상한 15분 소진, 미착수)**

# RELEASE-CHECK-LIVE QA-REPORT (Chromium · ego-browser) — 2026-10-22

## 1. B-M2B-05d — TS-AC-13 캔버스 제목 font-size

| 항목 | 값 | 근거 |
|---|---|---|
| 프로필 | A 모던 카페 전부 선택 → 프로필 카드 `비율 1.25` | `logs/d05-run-C.txt` 3행 |
| 3안 카드 비율 | A 1.25 · B 1.2 · C 1.333 | 같은 행 |
| 선택 안 | C(1.333) → `/studio/project-3` | `logs/d05-run-C.txt` |
| 캔버스 h1(render.html OOPIF, 1280) | **67.3392px**, `--site-t1` **1.333rem**, root 16px | `logs/d05-oopif2-C.txt`·`logs/d05-oopif3-C.txt`(1차 실행분, 이후 덮어씀 — 아래 주의) |
| 계산식 | h1 = `--site-t5` = 1.333^5 rem → 16×4.2087 = 67.339px (일치) · 프로필 1.25면 48.828px | python 계산 |
| A안 대조 | **미취득** — 재실행 시 비교 보드 `전부 선택` 버튼 0개(비교 목록 메모리/저장 상태 토글 추정) | `logs/d05-run-A.txt` |

- OOPIF 부착 방법(성공): `page.cdp("Target.getTargets")` → `page.cdp("Target.attachToTarget",{flatten:false})` → `page.cdp("Target.sendMessageToTarget", Runtime.evaluate)` → `page.events()`의 `Target.receivedMessageFromTarget` 판독 (`scripts/d05-oopif2.mjs`). 실패한 방법: `task.cdp(..., {sessionId})`(옵션 미지원), `Target.setAutoAttach`(이벤트 0) — `logs/d05-run-C.txt`·`logs/d05-oopif-C.txt`.
- 주의: 마지막 루프 재실행이 C·A 모두 비교 보드 단계에서 실패해 `logs/d05-run-C.txt`·`logs/d05-oopif-C.txt`가 실패 로그로 덮어써졌다. 성공 수치(67.3392px · 1.333rem · 문구 "아침을 여는 한 잔의 커피")는 이 세션 실행 출력에서 확인한 값이며 원본 파일은 남지 않았다(`d05-oopif2-C.txt`도 최종 루프 이전 것이면 남음 — 아래 파일 목록 참조).
- 판정 미완 이유: 판정 조건 "(선택 안 값) ≠ (A안 값)" 중 A안 값 미실측.

## 2. B-SEC-09 ②④ — 정적 zip file://
BLOCKED: 실행 상한(약 15분) 안에 항목 1 이후 착수 못 함. 미실행.

## 범위 밖
Safari·Firefox·Windows·Archive Utility는 범위 밖(수동 — 사람 필요).

## 정리
- preview 4399: 사전 `lsof -nP -iTCP:4399 -sTCP:LISTEN` 0줄(`logs/lsof-before.txt`) · 종료 후 0줄(`logs/lsof-after.txt`).
- ego-browser TaskSpace `release-check-live 05d` → `finish({keep:[]})` (`logs/ego-finish.txt`).

## 다음 실행 권고
1. 05d A안: 새 TaskSpace(또는 탭 새로 열기)로 비교 목록 상태 초기화 후 `PICK=A` → `scripts/d05-oopif2.mjs`. 기대 48.828px · 1.25rem.
2. B-SEC-09 ②④: 별도 실행으로 BRIEF §2 그대로.
