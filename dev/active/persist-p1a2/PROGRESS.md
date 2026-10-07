# PERSIST-P1a-2 PROGRESS

- [x] P0 BRIEF 커밋
- [x] 정본 읽기(ADR-007·ADR-004 개정 9·E0·P1a-1 REPORT)
- [x] TDD 예측 기록 + RED 확인(예측 일치, needsUnloadGuard local은 런타임 선통과 — REPORT)
- [x] 1-a 진입 하이드레이션(안1-min, 수제 schemaVersion)
- [x] 1-b 저장 배선(쓰기 큐, "저장됨"=IDB 커밋 뒤, 실패 INFRA·retry, persistence local 문구)
- [x] 1-c P1a-1 한계(복제 실패 재시도 불가·문구 원인 일치·stateOf 공유)
- [ ] 2 ADR-004 개정 9 적용 — BLOCKED: 실측 129.38 > 상한 129.15(멈춤 조건), 예산 결정 필요
- [ ] Ego Lite 시나리오(preview 4337) + IDB 삭제 + finish/listTaskSpaces=[] + 서버 종료
- [ ] 게이트 typecheck·lint·build·vitest exit0
- [ ] REPORT (초안 커밋됨, 마감 갱신 필요)

## TDD 예측 (RED 전 기록)
- localSync.test(새 파일) 전부 RED 예상: `./localSync`·`readEntry` 없음 → import 실패(파일 단위 1실패).
  - D2 왕복: 확정→조정 없음→생성(getJob 반복)→startDoc→이름 변경→saveDoc → 저장소 레코드로 새 studio 복원 → 목록·문서·프로필·잡 toEqual.
  - C4 실패 뒤 편집: IDB 실패(INFRA) → 다른 해시로 같은 expectedRevision 저장 → STALE 아님, 내 미확인 쓰기 위에 얹혀 revision 3.
  - B1 첫 실행: entry {} → persistence "local", 첫 쓰기가 v2 저장소 생성(브라우저 실측).
  - 저장됨 = 커밋 뒤: 커밋 지연 중 saveDoc 미settle.
  - 멱등 재생 실패 → 재시도: 같은 인자 재호출 → 미확인 재제출로 저장.
  - 복제 실패: INFRA, 문구에 "브라우저 저장소에 접근하지 못했습니다" 없음, 재호출도 INFRA(거짓 저장됨 0).
  - 검증 1:1: 잡 state↔후보 불일치·계열 번호 건너뜀·프로젝트 이름 위반 → 저장 INFRA reject, 레코드 덮기 0.
- entryRead.test(추가): readEntry — IDB 없음 → undefined(memory) · 저장소 없음 → {} · 버전 불일치 → undefined · ok → 상태·문서.
- saveStatusText.test(추가): "local" → "이 브라우저에 저장됨"; useAutosaveScheduler needsUnloadGuard local = server 조건.
- 번들 예측: /studio 진입 128.51 → 128.85~129.00(E0 안1-min − 이미지 0.15 + 머리·쓰기 배선). /projects·/compare·/profile +0.4~0.5, 125 이내.

## 로그

- 번들: 129.87 → 129.52(진입 toInfra 제거) → 129.46 → 129.38. 상한 129.15 초과로 멈춤(②미적용).
