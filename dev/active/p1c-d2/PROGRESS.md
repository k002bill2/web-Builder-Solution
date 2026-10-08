# P1C-D2 PROGRESS — 쓰기 잠금 + 최신성 확인

- [x] P0 BRIEF·PROGRESS 커밋
- [x] 정본 읽기(SPEC 1.5·INFRA·meta·3·4·6, MQ C2/C3, ADR-007 개정2, 싱크 구조)
- [x] TDD 예측 기록
- [x] 1번: navigator.locks 첫 편집 획득 · 못 잡은 탭 읽기 전용 · 미지원 처리 (커밋1)
- [x] 2번: meta 세대 번호 · 잠금 직후 최신성 확인 · 회귀 테스트 (커밋1에 함께 — 잠금 획득 직후 최신성 확인이 한 단위라 분리 불가, 커밋2 = 실측·REPORT)
- [x] 번들 관문 /studio 129.62 · 복원 진입 132.65±0.03
- [x] Ego Lite 탭 2개 실측 + 정리
- [x] typecheck·lint·build·vitest exit0
- [x] REPORT

## 설계 결정
- 잠금 단위 = SPEC 1.5 이름 `design-studio-writer`(DB 전체 1개). 획득 = 첫 **쓰기**(saveState·flush) 때 — sync 열기 때가 아님: `memoryProjectRepository.entered`가 앱 안 이동(진입 문서 아님 + 머리 있음)에서 읽기만으로 sync를 연다(코드 확인) → 열기 때 잡으면 "진입만 한 탭" 잠금 보유(AC-C14 위반).
- 세대 번호 = `meta` 저장소 레코드 `generation`(정본) + 같은 트랜잭션의 상태 레코드 data `gen`(이 탭이 하이드레이트한 세대 — 진입은 상태 레코드를 이미 읽으므로 진입 바이트 0). 모든 쓰기(saveState·flush)에 statePut이 들어가므로 커밋마다 +1.
- 최신성 = 잠금 직후 meta gen(없으면 0) ≠ 진입 gen(없으면 0) 또는 (진입에 상태가 있었는데 지금 상태 레코드 없음) → 낡은 탭: 쓰기 0 · 잠금 즉시 놓음 · 새로고침까지 유지.
- 읽기 전용 탭: saveState 쓰기 0(조용히), flush = INFRA "다른 탭에서 편집 중입니다 — …" · 다음 flush(다시 저장) 때 ifAvailable 재시도 → 최신성 통과 시에만 쓰기.
- locks 미지원 = SPEC 1.5·THREATS T5 그대로 읽기 전용(쓰기 0), 사유 = 기존 기본 문장(새 문구 0).

## TDD 예측 (RED)
- 새 `writerLock.test.ts`: 잠금 주입 매개변수·meta 세대가 없어 **전부 FAIL** 예상 — 특히 AC-C14(A 편집 쓰기 0 대신 A가 덮어씀), 회귀(탭A 진입→B 저장·닫기→A 편집: 지금은 A가 B를 덮음 = 쓰기 1), held=1(B) 단언(지금 잠금 0).
- 배선 뒤 기존 localSync/imagePersist/imageRestoreLoad 테스트: jsdom에 navigator.locks 없음 → 기본값이면 읽기 전용이 되어 쓰기 단언 FAIL 예상 → 탭별 가짜 주입으로 해결(단언 변경 0).

## RED → GREEN 기록
- RED: writerLock.test 8/8 FAIL(held [] · A 쓰기 1 · STALE_DOC/NOT_FOUND 먼저 — **예측 밖 발견**: sync 열기 때 IDB 최신 문서로 DocBook 시드 → 낡은 탭이 STALE_DOC로 막혀 SPEC 사유가 안 나옴 → 열 때 무잠금 최신성 확인으로 낡았으면 진입 문서로 시드).
- 배선 뒤 기존 22건 FAIL(예측대로 jsdom 잠금 없음=unsupported) → `soloLocks()` 주입, 단언 변경 0 → persistence 12파일 91/91 PASS.
- Red-Green: 최신성 확인 임시 무력화 → writerLock 4 FAIL(회귀·AC-C02·지운 뒤·AC-C14) → 복원 8/8 PASS.
- 테스트 헬퍼 수정 1건: failureOf가 코드 접두어를 중복으로 붙임(오류 메시지 자체가 "INFRA: …") → message만 비교(기대 문자열 그대로, 약화 0).

## 결과
- 번들 129.62 · 132.65 그대로 · Ego Lite 3시나리오 통과·정리 완료 · 게이트 4종 exit 0(2313 tests) · 서브에이전트 0 — REPORT.md
