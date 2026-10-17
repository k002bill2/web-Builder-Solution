# RS7-B QA REPORT — /projects·/profile 문구 정합 독립 검증

대상: `k002bill2/rs7-rows-text` tip `1d8e9e9a` · base `73289c90` · 2026-10-17 · QA(Orca + Claude Code)

## 판정: **PASS (조건부)** — 거짓 성공 문구·포커스 경로 0. 실화면 `/profile` "시작 다시 시도" 라벨만 BLOCKED(PendingStart 상태 생성 불가), 단위·컴포넌트 테스트로 대체 확인.

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | B-RS-15 retryRow 폴백 ok:true 처리 · 거짓 성공 0 · 실제 저장 문구 유지 | PASS | 폴백 원문 복원 변이 → 3 FAIL(공통) / 분기별 2·1 FAIL `logs/qa-mut-b-rs-15*.txt` · 포커스 실측(임시 테스트, 삭제) `logs/qa-focus-b-rs-15.txt` |
| 2 | B-RS-17 /profile 라벨·C-E4·C-E6 = UX-5 D1 · /projects 동일 문자열 · 단언 교체 약화 아님 | PASS | `restartText.ts:77` `retrySave: "시작 다시 시도"` = `pendingText.ts:15` `retryStart` |
| 3 | B-RS-09 되돌림 완결성(app/src 잔재 0) · 2벌 가드 변이 RED | PASS | 양쪽 변이 각 1 FAIL(stale) `logs/qa-mut-b-rs-09-guard.txt` |
| 4 | 실화면 preview 4388 | 부분 PASS · 라벨 BLOCKED | 아래 |
| 5 | fresh 게이트 | PASS | typecheck 0 · lint 0 · test 345/3036 · build `/studio` 129.12 · `/profile` 99.53 · `/projects` 99.10/109.55 `logs/qa-gate-*.txt` |

## 4. 실화면 상세 (`vite preview --port 4388 --strictPort`, 기존 dist)
- `/projects`: 헤딩 "프로젝트"·카드 "모던 카페 브랜드 프로젝트"·저장소 섹션, 버튼 6종 정상, alert 0 — 회귀 0 (`logs/qa-browser-round1.txt`, `round5.txt`).
- `/profile/profile-1`(앱 안 "프로필 보기" 클릭 이동): 헤딩 6종·"A안으로 편집 시작" 정상 (`round2.txt`).
- **BLOCKED: `/profile` "시작 다시 시도" 라벨** — PendingStart(생성 미확인) 상태를 실화면에서 만들 수 없음. 브라우저 내 `IDBObjectStore.put/add` 예외 주입을 1회 시도했으나 잠금 오류 경로("다른 탭에서 편집 중…다시 시도")로 분류돼 PendingStart에 도달하지 않음 (`round3.txt`, `qa-browser-pending-start.png`). 라벨 문자열은 항목 2의 코드·테스트로 확인.
- 정리: IDB `design-studio` 삭제(after `[]`) · `task.finish({keep:[]})` · 서버 pkill 후 `lsof -iTCP:4388 -sTCP:LISTEN` exit 1(리슨 0) · 5480 무접촉 (`round5.txt`).
- 참고: round4는 셀렉터 중복 오류로 중단되고 서버가 먼저 종료돼 round5에서 재실행.

## 메모
- 앱·테스트 코드 변경·커밋 0. push·원격 쓰기 0. Codex 미사용(브리프 금지).
- 후속 제안: PendingStart 실화면 확인이 필요하면 lock 획득 후 쓰기 단계만 실패시키는 주입 지점(예: tx `oncomplete` 미발화) 또는 개발용 fault 플래그 필요 — 별건.
