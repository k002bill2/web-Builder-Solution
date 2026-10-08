# P2-L3 PROGRESS — 프로젝트 파일 가져오기

- [x] P0 BRIEF 커밋
- [x] 정본 읽기 (P2-SPEC 머리·3.1·3.5·4.2·IM·FX-1·I-S07·6·7·8절 L3, p2-l1 REPORT, deleteProject·tabLockHold)
- [x] RED 예측 기록 + RED 확인 (AC-P02 쓰기 0 · AC-P06 abort · Quota IM-11)
- [x] writeImport.ts + 테스트
- [x] ImportProjectFileDialog(+Slot) + 테스트
- [x] BrowserStorageSection 버튼·hidden input + 테스트
- [x] IM-9 상수(dialogText)
- [x] ~~FX-1 — BLOCKED~~ 재개에서 해소 —: 번들 관문 실패(/profile 100.22>100, 원인 L1 profileShape.ts — REPORT 1절) · Jarvis 결정 대기
- [x] 배선 첫 커밋 직후 build 번들 실측 — **실패 /profile 100.22>100 · 원인 L1 profileShape.ts 값 import (REPORT 1절)**
- [x] ~~ProjectsPage — BLOCKED~~ 재개에서 해소 —: 번들 관문 실패(/profile 100.22>100, 원인 L1 profileShape.ts — REPORT 1절) · Jarvis 결정 대기
- [x] ~~Ego Lite — BLOCKED~~ 재개 절로 이동 —: 번들 관문 실패(/profile 100.22>100, 원인 L1 profileShape.ts — REPORT 1절) · Jarvis 결정 대기 (preview·Ego 공간 미생성 — 정리 대상 0)
- [x] ~~게이트~~ 재개 절로 이동 — typecheck·lint·전체 vitest(291/2561) exit 0 · build exit 1 — BLOCKED: 번들 관문 실패(/profile 100.22>100, 원인 L1 profileShape.ts — REPORT 1절) · Jarvis 결정 대기
- [x] REPORT (관문 정지판 — 1절 원인 실측·Jarvis 결정 요청)

## 재개 (Jarvis 결정 ①채택 ②허용 ③순서)
- [x] R0 profileShape.ts 값 import 5개 → 리터럴 복제 + parity 테스트(원천은 테스트에서만 import) · checkImages는 /profile 영향 없음(REPORT 1절 스텁③ 99.87 불변) → 그대로
- [x] R0 build → /profile 첫 화면 ≤100 (목표 99.87) — 실측 99.86 · /studio 129.09 · 복원 132.12 · /projects 105.13 · build exit 0 · RED 5/5 확인 → GREEN projectFile 73/73
- [x] FX-1 (ClearDataDialog·DeleteProjectDialog) — BACKUP_TEXT 상수(dialogText) · RED 2건(ClearDataDialog 숨김 단언→존재 단언 사양 변경, DeleteProjectDialog 캡션 단언 추가) → GREEN 125/125
- [x] ProjectsPage(IM-15·가져온 줄 포커스 — data-rename-for 경유) = 마지막 커밋 — RED 6/7(모양 틀린 키 1건은 export 없어 키가 undefined라 우연 통과) → GREEN 34/34 · build exit 0 /profile 99.87 · /studio 129.10 · 복원 132.13 · /projects 105.37
- [x] Ego Lite ①②③⑤ 통과 + 정리(deleteDatabase success · 공간 32 finish · listTaskSpaces [] · 5694 종료 · 4339 리슨 0)
- [ ] Ego Lite ④ (탭 B 쓰기 중 IM-9) — BLOCKED: IM-9 관찰 못 함 · 확인 단계 멈춤·B 열린 채 성공 의심, 원인 미확정 (REPORT 7.3) · 턴 한도로 재실측 못 함
- [x] 게이트 typecheck·lint·build·전체 vitest(293/2573) exit 0
- [x] REPORT 갱신 (7절)

## RED 예측 (R0 — profileShape parity)
- profileShape.parity.test: `PROFILE_SHAPE_KEYS` export 없음 → 5건 모두 FAIL(undefined 접근 TypeError). 기존 projectFile 테스트는 영향 없음.

## RED 예측 (R1 — writeImport·대화상자)
- writeImport.test: 모듈 없음 → import 실패로 파일 전체 FAIL (AC-P06 abort·Quota=IM-11·IM-8·IM-9 포함)
- ImportProjectFileDialog.test: 모듈 없음 → 파일 전체 FAIL (AC-P02 손상 파일 = IM-2 + factory.open 호출 0 포함)
