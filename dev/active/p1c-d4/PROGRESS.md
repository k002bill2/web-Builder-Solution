# P1C-D4 PROGRESS — 지우기 + 탭 간 알림

base `a0bbede` · 브랜치 `k002bill2/p1c-d4`

## 체크리스트
- [x] BRIEF P0 커밋 (`b11913d`)
- [x] 기준선 build: `/studio` 129.65 · 복원 132.68 · `/projects` 103.55 (둘 다 이미 경계값)
- [x] 1번: 지우기 버튼 + 대화상자(조작 뒤 청크) + 흐름 1~5 + `cleared` 전송 + 같은 탭 writer 회귀 → 커밋
- [ ] 2번: `saved` 전송(커밋 뒤) · 수신(싱크 `cleared` = 쓰기 0 · 영역 `saved`/`cleared`) · 같은 탭 `saved` 무시 → 커밋
- [ ] 번들 관문(129.65 · 132.68 · ≤125)
- [ ] Ego Lite 실측(① 같은 탭 ② 탭 2개 alert ③ B 닫은 뒤 성공·cleared 수신) + 정리
- [ ] typecheck · lint · build · 전체 vitest
- [ ] REPORT

## 설계
- `data/persistence/tabLink.ts`(새): 탭당 BroadcastChannel `design-studio` 1개(같은 탭 다른 인스턴스는 자기 메시지도 받으므로 공유) + 이 탭 싱크 손잡이(`attach`/`own`). localSync 청크·`/projects` 페이지 청크만 import — `/studio` 진입 closure 파일 변경 0.
- 같은 탭 writer 함정: 지우기는 `link.own()?.isWriter()`면 잠금 요청 없이 진행(이미 보유한 배타 잠금 안 — 경합 창 0). 아니면 `tryLock`(ifAvailable) — 못 잡으면 alert.
- 순서: (잠금) → 자기 싱크 `stop()`(쓰기 0·연결 닫기) → `cleared` 전송 → `deleteDatabase`. onblocked = 다른 탭 alert(요청은 대기로 남음 — 늦은 onsuccess도 성공 흐름), onerror = 실패 문장 + 잠금 놓기.
- `navigator.locks` 없음 = 잠금 없이 진행(ADR-007 개정 2 보충: 미지원이면 어느 탭도 쓰지 않음).
- localSync: 큐에 넘기는 persistence를 감싼다 — cleared면 쓰기 직전 INFRA("이 브라우저 데이터가 지워졌습니다 — 새로고침하세요"), 커밋 resolve 뒤 `saved` 전송. `cleared` 수신 = stop.

## TDD 예측 (RED 전에 기록)
- 1번 RED 예측: `ClearDataDialog`·`clearBrowserData`·`tabLink` 모듈 없음 → import 실패(새 테스트 파일 전부 FAIL). `BrowserStorageSection` 버튼 테스트 FAIL(버튼 없음). localSync "같은 탭 writer 손잡이" FAIL(attach 없음).
- 2번 RED 예측: localSync `saved` 전송 0 → FAIL, `cleared` 수신 뒤 flush가 resolve(쓰기) → FAIL, 영역 `saved` 표시 없음 → FAIL.

## 기록
- 1번 RED: 예측대로 새 테스트 5파일 import 실패(모듈 없음). GREEN 147/147. Red-Green: `own.isWriter()` 분기를 지우면 같은 탭 회귀 2건 FAIL(clearBrowserData·clearSync) → 복원 PASS.
- 1번 번들 1차: /studio 129.66 · 복원 **132.81**(멈춤선 132.68 초과). 원인: `clearBrowserData`가 `envelope`의 `DB_NAME`을 import → envelope가 별도 공유 청크(0.27KB)로 쪼개져 복원 closure에 청크 1개 추가. 수정: 리터럴 `CLEAR_DB_NAME` + parity 테스트(D3 선례). 2차: /studio **129.64** · 복원 **132.67** · /projects **104.32** — 통과.
- 테스트 환경: Node 전역 BroadcastChannel은 vitest 워커 사이로 메시지를 보내 `setup.ts`에서 지움(알림 테스트는 fakeTabLink 주입).
