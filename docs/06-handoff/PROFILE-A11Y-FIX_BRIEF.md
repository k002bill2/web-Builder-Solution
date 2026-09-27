# PROFILE-A11Y-FIX — 프로필 화면 접근성 결함 D1·D2·D4 수정

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 기준 main `09d9255`. 작업 공간 `profile-a11y-fix`. 포트 4345.
- 입력: `docs/qa/profile-visual-align/REPORT.md` D1·D2·D4, 증거 `keyboard-flow.txt`. Designer 생략 사유: QA가 재현 절차·기대 동작을 특정한 결함 수정.
- 번들: `/profile` 기준 99.54 / 124.67KB, **순증가 ≤ 0.10KB, 여유 0.3 미만이면 중지·보고**(진입 직후 여유 0.33뿐 — 코드는 가능하면 이미 있는 청크·함수 재사용).

## 범위
- **D1** `보정값 쓰기` 실행 결과를 기존 알림 영역(`role=status` "프로필 알림", `ProfilePage`의 `announce`)으로 전달: 예 "보조 글자(muted) 보정값을 썼습니다 · 조정을 저장하면 새 버전에 적용됩니다". 포커스는 같은 버튼 유지(현행). 확인 단계는 **추가하지 않는다**(되돌리기 = "조정 취소"가 있음, 현 설계 유지).
- **D2** `/profile/:id` 진입·버전 전환 시 `document.title = "디자인 프로필 · ${brand.name}"`(비교 보드 `CompareBoardPage.tsx` 61행 패턴과 같게). `/profile` 무인자(목록 분기)는 a1-β가 바꿀 예정이므로 건드리지 않는다.
- **D4** 보정값을 쓴 뒤(저장 전)에는 배너 문구가 요약과 모순되지 않게: 예 "보조 글자(muted) 보정값을 썼습니다 — 조정을 저장하면 적용됩니다"로 바꾸거나 배너를 쓴 상태 문구로 대체. 저장 전 스와치 색은 그대로(현행).
- 제외: D3(공통 헤더 — a1-β에서 처리), 새 기능, 레이아웃 변경.

## 쓰기 범위 / 금지
- 쓰기: `app/src/pages/ProfilePage.tsx`, `app/src/components/profile/**`, `app/src/features/profile/**`(UI·훅만), 해당 테스트, `dev/active/profile-a11y-fix/`.
- 금지: `engine/**`·`domain/**`·`data/**`, compare 파일(병렬 레인 `fix-ac07-isolation`), 라우트·레이아웃·AppHeader·DS 공통, 번들 스크립트·예산, `design/`·`docs/design/`, 새 의존성·아이콘, 가드 완화.

## 검증
- TDD RED→GREEN: D1(알림 영역 문구), D2(document.title, 버전 전환 포함), D4(쓴 뒤 배너 문구). 기존 단언 약화·삭제 금지. 전체 vitest 1회·typecheck·lint·build 로그+exit. 번들 전후 표.
- 127.0.0.1:4345 실제 흐름(QA REPORT 6행 흐름: 앱 안 링크로만 이동) → 3안 B 선택 → 보정값 쓰기 Enter: 알림 영역 문구·title·배너 기록(`logs/a11y-check.txt`), 1280 캡처 1장. 자기 PID만 종료 + lsof.
- 서브에이전트 분할: 불필요.
- `--max-turns` 30, 22턴부터 REPORT 우선. 단계마다 PROGRESS 커밋. push·병합·삭제 금지. fable 무접촉.
